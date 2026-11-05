import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/access";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logAuditEvent } from "@/lib/audit";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(request, "checkout", 50, 60);

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

    let auth: Awaited<ReturnType<typeof requireAuth>> | null = null;

    try {
        auth = await requireAuth();

        if (!auth.ok) {
            return auth.response;
        }

        const sessionUser = auth.session;

        logAuditEvent({
            event: "payment_initiated",
            userId: sessionUser.user.id,
            email: sessionUser.user.email ?? null,
            status: 200,
            action: "checkout_session_create",
            route: "/api/checkout",
        });

        const user = await prisma.subscription.findUnique({
            where: {
                userId: sessionUser.user.id,
            },
            select: {
                stripeCustomerId: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        let session;
        const checkoutConfig: Stripe.Checkout.SessionCreateParams = {
            mode: "subscription",
            line_items: [
                {
                    price: env.STRIPE_PRO_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: sessionUser.user.id,
            },
            subscription_data: {
                metadata: {
                    userId: sessionUser.user.id,
                },
            },
            success_url: `${env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/cancel`,
        };

        try {
            session = await stripe.checkout.sessions.create({
                ...checkoutConfig,
                customer: user?.stripeCustomerId || undefined,
                customer_email: user?.stripeCustomerId
                    ? undefined
                    : user?.user?.email || undefined,
            });
        } catch (err) {
            // จัดการกรณีที่ customer ID ในฐานข้อมูลไม่มีอยู่ใน Stripe (มักเกิดขึ้นใน test mode)
            if (
                err instanceof Stripe.errors.StripeError &&
                err.statusCode === 400 &&
                err.code === "resource_missing" &&
                err.param === "customer"
            ) {
                logger.warn({ userId: sessionUser.user.id }, "Stripe customer missing, retrying without customer id.");
                session = await stripe.checkout.sessions.create({
                    ...checkoutConfig,
                    customer_email: user?.user?.email || undefined,
                });
            } else {
                throw err;
            }
        }

        logAuditEvent({
            event: "payment_completed",
            userId: sessionUser.user.id,
            email: sessionUser.user.email ?? null,
            status: 200,
            action: "checkout_session_created",
            route: "/api/checkout",
            details: {
                sessionId: session.id,
            },
        });

        return NextResponse.json({
            url: session.url,
            status: 200,
        });
    } catch (error) {
        logger.error({ err: error }, "Checkout error");
        logAuditEvent({
            event: "payment_failed",
            userId: auth?.ok ? auth.session.user.id : null,
            status: 500,
            action: "checkout_session_create",
            route: "/api/checkout",
            details: { reason: "checkout_exception" },
        });

        // อย่าเปิดเผยรายละเอียดภายในของ Stripe หรือฐานข้อมูลกลับไปให้ client
        // รายละเอียดแบบละเอียดจะถูกเก็บไว้ที่ server log อย่างเดียว เพื่อป้องกันไม่ให้
        // attacker ใช้ stack trace หรือ error message จาก provider ในการสืบค้นระบบ
        return NextResponse.json(
            {
                error: "Checkout failed. Please try again later.",
            },
            { status: 500 }
        );
    }
}
