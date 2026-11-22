
import { describe, it, expect, vi } from "vitest";
import { deduplicateRequest } from "../request-deduplication";

describe("deduplicateRequest", () => {
    it("should reuse the same promise for duplicate requests", async () => {
        const requestFn = vi.fn().mockResolvedValue({ success: true });

        const request1 = deduplicateRequest("profile", requestFn);
        const request2 = deduplicateRequest("profile", requestFn);

        expect(requestFn).toHaveBeenCalledTimes(1);
        expect(request1).toBe(request2);

        await expect(request1).resolves.toEqual({ success: true });
    });

    it("should execute different keys separately", async () => {
        const requestFn = vi.fn().mockResolvedValue({ success: true });

        const request1 = deduplicateRequest("profile", requestFn);
        const request2 = deduplicateRequest("dashboard", requestFn);

        expect(requestFn).toHaveBeenCalledTimes(2);

        await Promise.all([request1, request2]);
    });

    it("should allow retry after request failure", async () => {
        const requestFn = vi.fn()
            .mockRejectedValueOnce(new Error("Network error"))
            .mockResolvedValueOnce({ success: true });

        await expect(
            deduplicateRequest("profile", requestFn)
        ).rejects.toThrow("Network error");

        await expect(
            deduplicateRequest("profile", requestFn)
        ).resolves.toEqual({ success: true });

        expect(requestFn).toHaveBeenCalledTimes(2);
    });


    it("should deduplicate concurrent requests", async () => {
        let resolveRequest!: (value: { success: boolean }) => void;

        const requestFn = vi.fn(
            () =>
                new Promise<{ success: boolean }>((resolve) => {
                    resolveRequest = resolve;
                })
        );

        const request1 = deduplicateRequest("meal", requestFn);
        const request2 = deduplicateRequest("meal", requestFn);
        const request3 = deduplicateRequest("meal", requestFn);

        // API ต้องถูกเรียกเพียงครั้งเดียว
        expect(requestFn).toHaveBeenCalledTimes(1);

        // ทุก Request ต้องใช้ Promise เดียวกัน
        expect(request1).toBe(request2);
        expect(request2).toBe(request3);

        // จำลอง API ส่ง Response กลับมา
        resolveRequest({ success: true });

        await expect(request1).resolves.toEqual({ success: true });
        await expect(request2).resolves.toEqual({ success: true });
        await expect(request3).resolves.toEqual({ success: true });
    });

});
