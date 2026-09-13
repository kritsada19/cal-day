import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "../rate-limit";
import { redis } from "../db/redis";

describe("checkRateLimit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("get ip address from x-forwarded-for header and increment the count in redis for the first request", async () => {
        // กำหนดให้ redis.incr ส่งกลับ 1 (เป็นคำขอแรกใน window)
        vi.mocked(redis.incr).mockResolvedValueOnce(1);

        const request = new Request("http://localhost:3000/api/profile", {
            headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
        });

        const result = await checkRateLimit(request, "profile", 100, 60);

        // ตรวจสอบว่า key ถูกสร้างขึ้นโดยใช้ IP ตัวแรกจาก x-forwarded-for
        expect(redis.incr).toHaveBeenCalledWith("rate-limit:profile:203.0.113.195");
        // คำขอแรกต้องตั้งเวลาหมดอายุ (TTL) ให้ key ใน Redis
        expect(redis.expire).toHaveBeenCalledWith("rate-limit:profile:203.0.113.195", 60);
        expect(result).toEqual({
            success: true,
            limit: 100,
            remaining: 99,
        });
    });

    it("use default ip 127.0.0.1 if there is no x-forwarded-for header", async () => {
        vi.mocked(redis.incr).mockResolvedValueOnce(2);

        const request = new Request("http://localhost:3000/api/profile");
        const result = await checkRateLimit(request, "profile", 10, 60);

        expect(redis.incr).toHaveBeenCalledWith("rate-limit:profile:127.0.0.1");
        // คำขอที่ 2 (current !== 1) ไม่ต้องเรียก expire ซ้ำ
        expect(redis.expire).not.toHaveBeenCalled();
        expect(result).toEqual({
            success: true,
            limit: 10,
            remaining: 8,
        });
    });

    it("returns false when the request exceeds the rate limit (rate limit exceeded)", async () => {
        // กำหนดให้เรียกใช้งานครั้งที่ 11 ซึ่งเกิน limit ที่ตั้งไว้ (limit = 10)
        vi.mocked(redis.incr).mockResolvedValueOnce(11);

        const request = new Request("http://localhost:3000/api/profile");
        const result = await checkRateLimit(request, "profile", 10, 60);

        expect(result).toEqual({
            success: false,
            limit: 10,
            remaining: 0, // remaining ไม่ติดลบ ต้องคงไว้ที่ 0
        });
    });

    it("works in fail-open mode (allow through) if Redis errors", async () => {
        // จำลองกรณี Redis ล่ม/เกิด Exception
        vi.mocked(redis.incr).mockRejectedValueOnce(new Error("Redis connection error"));

        const request = new Request("http://localhost:3000/api/profile");
        const result = await checkRateLimit(request, "profile", 10, 60);

        // Fail-open: ต้องคืนค่า success: true และ remaining เท่ากับ limit
        expect(result).toEqual({
            success: true,
            limit: 10,
            remaining: 10,
        });
    });
});