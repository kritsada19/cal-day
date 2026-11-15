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
    signup: {
        limit: Number.parseInt(process.env.SIGNUP_RATE_LIMIT ?? "5", 10) || 5,
        windowSec: 60,
    },
    forgotPassword: {
        limit: Number.parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT ?? "3", 10) || 3,
        windowSec: 60 * 15,
    },
    resetPassword: {
        limit: Number.parseInt(process.env.RESET_PASSWORD_RATE_LIMIT ?? "5", 10) || 5,
        windowSec: 60 * 15,
    },
    verifyEmail: {
        limit: Number.parseInt(process.env.VERIFY_EMAIL_RATE_LIMIT ?? "5", 10) || 5,
        windowSec: 60,
    },
    webhookUnsigned: {
        limit: Number.parseInt(process.env.WEBHOOK_UNSIGNED_RATE_LIMIT ?? "20", 10) || 20,
        windowSec: 60,
    },
    webhook: {
        limit: Number.parseInt(process.env.WEBHOOK_RATE_LIMIT ?? "120", 10) || 120,
        windowSec: 60,
    },

    adminUsers: {
        limit: Number.parseInt(process.env.ADMIN_USERS_RATE_LIMIT ?? "60", 10) || 60,
        windowSec: 60,
    },
    adminUserDetail: {
        limit: Number.parseInt(process.env.ADMIN_USER_DETAIL_RATE_LIMIT ?? "60", 10) || 60,
        windowSec: 60,
    },
    adminUserDelete: {
        limit: Number.parseInt(process.env.ADMIN_USER_DELETE_RATE_LIMIT ?? "10", 10) || 10,
        windowSec: 60,
    },
    adminFoods: {
        limit: Number.parseInt(process.env.ADMIN_FOODS_RATE_LIMIT ?? "60", 10) || 60,
        windowSec: 60,
    },
    adminDashboard: {
        limit: Number.parseInt(process.env.ADMIN_DASHBOARD_RATE_LIMIT ?? "60", 10) || 60,
        windowSec: 60,
    },

    profile: {
        limit: Number.parseInt(process.env.PROFILE_RATE_LIMIT ?? "100", 10) || 100,
        windowSec: 60,
    },
    meals: {
        limit: Number.parseInt(process.env.MEALS_RATE_LIMIT ?? "100", 10) || 100,
        windowSec: 60,
    },
    mealsImage: {
        limit: Number.parseInt(process.env.MEALS_IMAGE_RATE_LIMIT ?? "20", 10) || 20,
        windowSec: 60,
    },
    analytics: {
        limit: Number.parseInt(process.env.ANALYTICS_RATE_LIMIT ?? "100", 10) || 100,
        windowSec: 60,
    },
    checkout: {
        limit: Number.parseInt(process.env.CHECKOUT_RATE_LIMIT ?? "50", 10) || 50,
        windowSec: 60,
    },
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
