import Redis from "ioredis";

let _redis: Redis | null = null;

function getRedis(): Redis {
    if (_redis) return _redis;

    _redis = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
    });

    return _redis;
}

export const redis = getRedis();