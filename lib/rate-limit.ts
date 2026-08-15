import { redis } from "./db/redis";

export async function checkRateLimit(
    request: Request,
    apiName: string,
    limit: number = 10,
    windowSec: number = 60
) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const limitKey = `rate-limit:${apiName}:${ip}`;

    try {
        const current = await redis.incr(limitKey);

        if (current === 1) {
            await redis.expire(limitKey, windowSec);
        }
        const remaining = Math.max(0, limit - current);
        return {
            success: current <= limit,
            limit,
            remaining,
        };
    } catch (error) {
        console.error("Rate limiting error:", error);
        // Fail open: allow the request through if Redis is unavailable
        return { success: true, limit, remaining: limit };
    }
}