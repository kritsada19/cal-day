import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, rateLimitResponse } from "../http";
import { AppError } from "../services/errors";
import { logger } from "../logger";

// Mock logger เพื่อตรวจสอบการเรียกใช้งาน log
vi.mock("../logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("http helper functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rateLimitResponse", () => {
    it("สร้าง NextResponse สถานะ 429 พร้อมข้อมูลข้อความและ Headers ที่ถูกต้อง", async () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
      };

      const response = rateLimitResponse(result);
      const json = await response.json();

      // ตรวจสอบ status code และข้อความตอบกลับ
      expect(response.status).toBe(429);
      expect(json).toEqual({
        message: "Rate limit exceeded. Please try again later.",
      });

      // ตรวจสอบ RateLimit Headers ที่ส่งกลับ
      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("errorResponse", () => {
    it("จัดการ AppError: ส่งกลับ status/message ของ AppError และบันทึก logger.warn", async () => {
      const appError = new AppError(404, "ไม่พบข้อมูลผู้ใช้");
      const options = {
        status: 500,
        message: "เกิดข้อผิดพลาดภายในระบบ",
        log: "ข้อผิดพลาดในการค้นหาผู้ใช้",
        context: { userId: "user_123" },
      };

      const response = errorResponse(appError, options);
      const json = await response.json();

      // ต้องใช้ status และ message จาก AppError (404) ไม่ใช่จาก fallback options (500)
      expect(response.status).toBe(404);
      expect(json).toEqual({ message: "ไม่พบข้อมูลผู้ใช้" });

      // ต้องบันทึก log เป็น warn พร้อม context และ status
      expect(logger.warn).toHaveBeenCalledWith(
        { userId: "user_123", status: 404 },
        "ข้อผิดพลาดในการค้นหาผู้ใช้"
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("จัดการ Unexpected Error: ส่งกลับ fallback status/message และบันทึก logger.error", async () => {
      const unexpectedError = new Error("Database connection timeout");
      const options = {
        status: 500,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
        log: "Database failure occurred",
        context: { dbHost: "localhost" },
      };

      const response = errorResponse(unexpectedError, options);
      const json = await response.json();

      // ต้องใช้ status และ message จาก fallback options
      expect(response.status).toBe(500);
      expect(json).toEqual({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });

      // ต้องบันทึก log เป็น error พร้อม error object และ context
      expect(logger.error).toHaveBeenCalledWith(
        { err: unexpectedError, dbHost: "localhost" },
        "Database failure occurred"
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
