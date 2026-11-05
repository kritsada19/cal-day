import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/access";
import prisma from "@/lib/db/prisma";
import { stripe } from "../route";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST() {
    try {
        const auth = await requireAuth();

        if (!auth.ok) {
            return auth.response;
        }

        const sessionUser = auth.session;

        const user = await prisma.subscription.findUnique({
            where: { userId: sessionUser.user.id },
            select: { stripeCustomerId: true },
        });

        if (!user?.stripeCustomerId) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
        }

        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${env.NEXT_PUBLIC_APP_URL}/subscription`,
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        logger.error({ err: error }, "Portal session creation error");
        return NextResponse.json(
            { error: "Failed to create portal session" },
            { status: 500 }
        );
    }
}
