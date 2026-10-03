import Redis from "ioredis";
import { env } from "@/lib/env";

let _redis: Redis | null = null;

function getRedis(): Redis {
    if (_redis) return _redis;

    _redis = new Redis(env.REDIS_URL, {
        // ไม่จำกัดการเชื่อมต่อ Redis (แต่ใช้ Connection Pool / keep-alive)
        maxRetriesPerRequest: null,
    });

    return _redis;
}

export const redis = getRedis();