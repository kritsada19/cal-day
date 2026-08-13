import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getServerSession(authOptions);

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

        const session = await stripe.checkout.sessions.create({
            customer: user?.stripeCustomerId || undefined,
            customer_email: user?.stripeCustomerId
                ? undefined
                : user?.user?.email || undefined,

            mode: "subscription",

            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID!,
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

            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cancel`,
        });

        return NextResponse.json({
            url: session.url,
            status: 200,
        });
    } catch (error) {
        console.error("Checkout error:", error);

        return NextResponse.json(
            {
                error: "Checkout failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}