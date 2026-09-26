import Redis from "ioredis";
import { env } from "@/lib/env";

let _redis: Redis | null = null;

function getRedis(): Redis {
    if (_redis) return _redis; // ← ถ้ามีอยู่แล้ว ใช้ตัวเดิม ไม่สร้างใหม่

    _redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    return _redis;
}

export const redis = getRedis();