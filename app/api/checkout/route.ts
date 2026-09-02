import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

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

    try {
        const sessionUser = await getSession();

        if (!sessionUser?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

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
            // Handle cases where the customer ID in DB doesn't exist in Stripe (often happens in test mode)
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

        return NextResponse.json({
            url: session.url,
            status: 200,
        });
    } catch (error) {
        logger.error({ err: error }, "Checkout error");

        return NextResponse.json(
            {
                error: "Checkout failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
