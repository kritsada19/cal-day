import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { stripe } from "../route";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST() {
    try {
        const sessionUser = await getSession();

        if (!sessionUser?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
