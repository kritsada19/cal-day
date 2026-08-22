import { redis } from "@/lib/db/redis";
import { NextResponse } from "next/server";

export const AI_LIMIT_FREE = 5;
export const AI_LIMIT_PRO = 50;

export async function getUserAiQuota(userId: number, plan: string = "FREE") {
    const limit = plan === "PRO" ? AI_LIMIT_PRO : AI_LIMIT_FREE;
    const countStr = await redis.get(`ai_limit:${userId}`);
    const usage = countStr ? parseInt(countStr, 10) : 0;

    return {
        usage,
        limit,
        remaining: Math.max(0, limit - usage)
    };
}


export async function checkAndComsumeAiQuota(userId: number, plan: string = "FREE") {

    await redis.incr(`ai_limit:${userId}`);

    const usage = await getUserAiQuota(userId, plan);

    if (usage.usage === 1) {
        await redis.expire(`ai_limit:${userId}`, 60 * 60 * 24);
    }

    if (plan === "FREE" && usage.usage > AI_LIMIT_FREE) {
        return NextResponse.json(
            { message: "AI limit reached. Please upgrade to premium to continue." },
            { status: 429 },
        );
    }

    if (plan === "PRO" && usage.usage > AI_LIMIT_PRO) {
        return NextResponse.json(
            { message: "Pro AI limit reached. Please contact support for assistance." },
            { status: 429 }
        )
    }
}   
