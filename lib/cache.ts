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
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
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
