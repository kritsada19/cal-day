import NextAuth, { type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import GoogleProvider from "next-auth/providers/google";
import { redis } from "@/lib/db/redis";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { rateLimitResponse } from "@/lib/http";
import { env } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit";

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

const useSecureCookies = env.NEXTAUTH_URL.startsWith("https://");

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    secret: env.NEXTAUTH_SECRET,
    useSecureCookies,
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24, // 24 ชั่วโมง
        updateAge: 60 * 60, // ต่ออายุของ session ทุก 1 ชั่วโมง ถ้ายังใช้งาน
    },
    cookies: {
        sessionToken: {
            name: useSecureCookies
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true, // XSS อ่าน JWT จาก document.cookie ไม่ได้
                sameSite: "lax", // พอสำหรับ Google OAuth redirect กลับมาโดเมนเดิม ถ้าเป็น strict login Google อาจหลุด cookie
                path: "/",
                secure: useSecureCookies, // ส่ง cookie ผ่าน TLS เท่านั้น อย่าเปิดบน http://localhost
            },
        },
    },
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
                    logAuditEvent({
                        event: "login_failed",
                        email,
                        status: 400,
                        action: "credentials_missing",
                        details: { reason: "missing_credentials" },
                    });
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    // แก้ช่องโหว่ User Enumeration ผ่าน Timing Attacks
                    // ใช้ Dummy Hash ที่มีโครงสร้างถูกต้องเพื่อให้ bcrypt เสียเวลาประมวลผลใกล้เคียงกัน
                    await bcrypt.compare(password, "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
                    logAuditEvent({
                        event: "login_failed",
                        email,
                        status: 401,
                        action: "invalid_credentials",
                        details: { reason: "user_not_found_or_no_password" },
                    });
                    return null;
                }

                const failedLoginKey = `failed_login:${email}`

                const failedLoginCount = await redis.get(failedLoginKey);
                if (Number(failedLoginCount) >= 5) {
                    logAuditEvent({
                        event: "login_blocked",
                        userId: user.id,
                        email,
                        status: 429,
                        action: "rate_limited_login",
                        details: { failedAttempts: Number(failedLoginCount) },
                    });
                    throw new Error("Too many failed login attempts. Please try again later.")
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    const count = await redis.incr(failedLoginKey);
                    if (Number(count) === 1) {
                        redis.expire(failedLoginKey, 60 * 15); // 15 minutes
                    }
                    logAuditEvent({
                        event: "login_failed",
                        userId: user.id,
                        email,
                        status: 401,
                        action: "password_mismatch",
                        details: { failedAttempts: Number(count) },
                    });
                    return null;
                }

                // Reset counter after successful login
                await redis.del(failedLoginKey);

                // เช็คว่า user ยืนยันอีเมลแล้วหรือยัง
                if (!user.emailVerified) {
                    logAuditEvent({
                        event: "login_blocked",
                        userId: user.id,
                        email,
                        status: 403,
                        action: "email_not_verified",
                    });
                    throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
                }

                logAuditEvent({
                    event: "login_success",
                    userId: user.id,
                    email,
                    status: 200,
                    action: "credentials_auth",
                });

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
    ],

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

async function rateLimitedHandler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const policyName = request.method === "POST" ? "authPost" : "authGet";
  const rateLimit = await checkRateLimitPolicy(request, policyName);

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  return handler(request, context);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
