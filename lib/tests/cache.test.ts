import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCache, setCache, deleteUserCache } from '@/lib/cache';
import { redis } from '@/lib/db/redis';

/**
 * Ensure all mocks are cleared before each test to avoid cross‑test interference.
 */
beforeEach(() => {
    vi.clearAllMocks();
});

/**
 * Test that `setCache` correctly stores a value and that `getCache` can retrieve
 * and deserialize it. We manually mock `redis.get` to return the JSON string
 * that `setCache` would have stored.
 */
describe('cache', () => {
    it('stores a value with setCache and retrieves it with getCache (cache hit)', async () => {
        const key = 'test:hit';
        const value = { foo: 'bar', count: 42 };
        const ttl = 60;

        // Set the cache – the mock will capture the call parameters.
        await setCache(key, value, ttl);
        expect(redis.set).toHaveBeenCalledWith(key, JSON.stringify(value), 'EX', ttl);

        // Mock the next call to `redis.get` to return the JSON string we just set.
        (redis.get as any).mockResolvedValueOnce(JSON.stringify(value));

        const cached = await getCache<typeof value>(key);
        expect(cached).toEqual(value);
    });

    /**
     * When the cache does not contain the key, `redis.get` resolves to `null`
     * and `getCache` should return `null`.
     */
    it('returns null on cache miss', async () => {
        const key = 'test:miss';
        (redis.get as any).mockResolvedValueOnce(null);
        const cached = await getCache<any>(key);
        expect(cached).toBeNull();
    });

    /**
     * `deleteUserCache` should retrieve all keys matching the user‑specific pattern
     * and delete them. We mock `redis.keys` to return a sample array and verify that
     * `redis.del` receives that array.
     */
    it('deletes all cache entries for a specific user', async () => {
        const userId = 123;
        const mockKeys = [
            `cache:user:${userId}:analytics:7`,
            `cache:user:${userId}:profile`,
        ];

        (redis.keys as any).mockResolvedValueOnce(mockKeys);
        await deleteUserCache(userId);
        expect(redis.keys).toHaveBeenCalledWith(`cache:user:${userId}:*`);
        expect(redis.del).toHaveBeenCalledWith(mockKeys);
    })
});
