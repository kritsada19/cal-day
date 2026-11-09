import { redis } from "./db/redis";
import { logger } from "./logger";

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
}

// กำหนดขีดจำกัดการเข้าถึง API ต่างๆ ไว้ที่เดียว
export const RATE_LIMITS = {
    authGet: { 
        limit: Number.parseInt(process.env.AUTH_GET_RATE_LIMIT ?? "60", 10) || 60,
        windowSec: 60,
    },
    authPost: {
        limit: Number.parseInt(process.env.AUTH_POST_RATE_LIMIT ?? "10", 10) || 10,
        windowSec: 60,
    },
    signup: { limit: 5, windowSec: 60 },
    forgotPassword: { limit: 3, windowSec: 60 * 15 },
    resetPassword: { limit: 5, windowSec: 60 * 15 },
    verifyEmail: { limit: 5, windowSec: 60 },
    webhookUnsigned: { limit: 20, windowSec: 60 },
    webhook: { limit: 120, windowSec: 60 },

    adminUsers: { limit: 60, windowSec: 60 },
    adminUserDetail: { limit: 60, windowSec: 60 },
    adminUserDelete: { limit: 10, windowSec: 60 },
    adminFoods: { limit: 60, windowSec: 60 },
    adminDashboard: { limit: 60, windowSec: 60 },

    profile: { limit: 100, windowSec: 60 },
    meals: { limit: 100, windowSec: 60 },
    mealsImage: { limit: 20, windowSec: 60 },
    analytics: { limit: 100, windowSec: 60 },
    checkout: { limit: 50, windowSec: 60 },
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
    request: Request,
    apiName: string,
    limit: number = 10,
    windowSec: number = 60
): Promise<RateLimitResult> {
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
        logger.error({ err: error, apiName, ip }, "Rate limiting error");

        // Fail closed: เมื่อ Redis ไม่สามารถใช้งานได้ เราไม่ควรปล่อยให้ traffic
        // ผ่านไปโดยไม่ถูกจำกัด เพราะนี่เป็นเรื่องความปลอดภัย ไม่ใช่แค่ความทนทานระบบ
        // หาก limiter ไม่สามารถพิสูจน์ได้ว่าคำขออยู่ในโควต้า เราควรปฏิเสธทันที
        // การคืนค่า success = false จะทำให้ API routes ส่ง 429 อย่างเหมาะสม
        return { success: false, limit, remaining: 0 };
    }
}

export async function checkRateLimitPolicy(
    request: Request,
    policyName: RateLimitPolicyName,
): Promise<RateLimitResult> {
    const policy = RATE_LIMITS[policyName];
    return checkRateLimit(request, policyName, policy.limit, policy.windowSec);
}
