import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
    interface Session {
        user: {
            id: number;
            name?: string | null;
            email?: string | null;
            role?: string | null;
        };
    }

    interface User {
        id: number;
        role: string;
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id: number;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "john@doe.com",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },
            async authorize(credentials) {
                if (!credentials) return null;

                const { email, password } = credentials;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid email or password");
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24, // 24 ชั่วโมง
    },

    pages: {
        signIn: "/signin",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as number;
                token.role = user.role;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
