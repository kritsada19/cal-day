import { redis } from "./db/redis"
import { logger } from "./logger";

export const getCache = async (key: string) => {
    try {
        const data = await redis.get(key)
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error({ err: error, key }, "getCache error");
        return null;
    }
}

export const setCache = async (key: string, value: unknown, ttlSec: number) => {
    // ป้องกันการเกิด cache stampede โดยการเพิ่ม jitter ให้กับ TTL
    // สุ่มเวลาเพิ่มขึ้น 0-60 วินาที เพื่อให้ cache ของแต่ละ instance หมดอายุไม่พร้อมกัน
    const jitter = Math.floor(Math.random() * 60);
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSec + jitter);
    } catch (error) {
        logger.error({ err: error, key }, "setCache error");
        return null;
    }
}

export const deleteUserCache = async (userId: number) => {
    try {
        const keys = await redis.keys(`cache:user:${userId}:*`)
        if (keys.length === 0) return null
        await redis.del(keys)
    } catch (error) {
        logger.error({ err: error, userId }, "deleteUserCache error");
        return null
    }
}
