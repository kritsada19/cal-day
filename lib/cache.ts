import { redis } from "./db/redis"

export const getCache = async <T>(key: string) => {
    try {
        const data = await redis.get(key)
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
}

export const setCache = async (key: string, value: unknown, ttlSec: number) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    } catch (error) {
        return null;
    }
}

export const deleteUserCache = async (userId: number) => {
    try {
        const keys = await redis.keys(`cache:user:${userId}:*`)
        if (keys.length === 0) return null
        await redis.del(keys)
    } catch (error) {
        console.error(`[cache] deleteUserCache error for user ${userId}:`, error)
        return null
    }
}
