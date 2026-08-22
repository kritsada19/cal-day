/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { redis } from "@/lib/db/redis";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getPeriodEnd } from "@/lib/stripe/getPeriodEnd";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    const rateLimit = await checkRateLimit(req, "webhook", 300, 60);

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

    if (!env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json(
            { error: "STRIPE_WEBHOOK_SECRET is not defined" },
            { status: 500 }
        );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
        // Idempotency check: ensure we haven't processed this event before
        const processed = await redis.get(`webhook:${event.id}`);
        if (processed) {
          console.log(`Duplicate webhook event ${event.id} ignored.`);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        // Mark event as processed with a TTL (e.g., 24 hours)
        await redis.set(`webhook:${event.id}`, "1", "EX", 60 * 60 * 24);

    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const session = event.data.object as any;

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                if (!session?.metadata?.userId) {
                    return NextResponse.json({ error: "User ID not found in metadata" }, { status: 400 });
                }

                await prisma.subscription.update({
                    where: { userId: Number(session.metadata.userId) },
                    data: {
                        stripeCustomerId: session.customer as string,
                        plan: "PRO",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });

                break;
            }

            case "invoice.payment_succeeded": {
                if (!session.subscription) return NextResponse.json({ received: true });

                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: subscription.status === "active" ? "PRO" : "FREE",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });
                break;
            }

            case "invoice.payment_failed": {
                if (!session.subscription) return NextResponse.json({ received: true });

                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: "FREE",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });
                break;
            }

            case "customer.subscription.deleted": {
                await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: "FREE",
                    },
                });
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as any;
                await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: (subscription.status === "active") ? "PRO" : "FREE",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error("Webhook Error Handled:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}
