import NextAuth, { type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import GoogleProvider from "next-auth/providers/google";
import { redis } from "@/lib/db/redis";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma) as Adapter,
    secret: process.env.NEXTAUTH_SECRET,
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

                const email = typeof credentials.email === "string"
                    ? credentials.email.trim().toLowerCase()
                    : "";
                const password = typeof credentials.password === "string"
                    ? credentials.password
                    : "";

                if (!email || !password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    // แก้ช่องโหว่ User Enumeration ผ่าน Timing Attacks
                    // ใช้ Dummy Hash ที่มีโครงสร้างถูกต้องเพื่อให้ bcrypt เสียเวลาประมวลผลใกล้เคียงกัน
                    await bcrypt.compare(password, "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
                    return null;
                }

                const failedLoginKey = `failed_login:${email}`

                const failedLoginCount = await redis.get(failedLoginKey);
                if (Number(failedLoginCount) >= 5) {
                    throw new Error("Too many failed login attempts. Please try again later.")
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    const count = await redis.incr(failedLoginKey);
                    if (Number(count) === 1) {
                        redis.expire(failedLoginKey, 60 * 15); // 15 minutes
                    }
                    return null;
                }

                // Reset counter after successful login
                await redis.del(failedLoginKey);

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

    events: {
        async createUser({ user }) {
            await prisma.subscription.create({
                data: {
                    userId: Number(user.id),
                    plan: "FREE",
                    status: "ACTIVE",
                },
            });
        },
    },
};

const handler = NextAuth(authOptions);

async function rateLimitedHandler(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "auth", 60, 60);

  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  }

  return handler(request);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
