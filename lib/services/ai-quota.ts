import { redis } from "@/lib/db/redis";

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
