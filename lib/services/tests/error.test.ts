import { describe, expect, it } from "vitest";
import { AppError, isAppError } from "../errors";

describe("AppError & isAppError", () => {
  describe("AppError", () => {
    it("ควรสร้าง instance ของ AppError พร้อมกำหนด status, message และ name ได้อย่างถูกต้อง", () => {
      // 1. Arrange & Act: สร้าง AppError ตัวอย่างพร้อม status code และข้อความแจ้งเตือน
      const status = 404;
      const message = "ไม่พบข้อมูลที่ต้องการ";
      const error = new AppError(status, message);

      // 2. Assert: ตรวจสอบคุณสมบัติต่าง ๆ ของ AppError
      expect(error).toBeInstanceOf(AppError); // ต้องเป็น instance ของ AppError
      expect(error).toBeInstanceOf(Error); // ต้องเป็น instance ของ Error พื้นฐานด้วย
      expect(error.name).toBe("AppError"); // name ต้องถูกตั้งเป็น "AppError"
      expect(error.status).toBe(status); // status code ต้องตรงตามที่ส่งเข้าไป
      expect(error.message).toBe(message); // message ต้องตรงตามที่ส่งเข้าไป
    });
  });

  describe("isAppError", () => {
    it("คืนค่า true เมื่อ error เป็น instance ของ AppError", () => {
      // สร้าง AppError object
      const appError = new AppError(400, "ข้อมูลไม่ถูกต้อง");

      // ตรวจสอบว่า isAppError ระบุได้ถูกต้อง
      expect(isAppError(appError)).toBe(true);
    });

    it("คืนค่า false เมื่อ error เป็น Error ทั่วไป (Standard Error)", () => {
      // สร้าง Error ทั่วไปของ JavaScript
      const standardError = new Error("ข้อผิดพลาดทั่วไป");

      // ตรวจสอบว่า isAppError คืนค่า false
      expect(isAppError(standardError)).toBe(false);
    });

    it("คืนค่า false เมื่อสิ่งที่ส่งเข้ามาไม่ใช่ Error object (เช่น string, number, null, undefined, object ทั่วไป)", () => {
      // ทดสอบกับชนิดข้อมูลต่าง ๆ ที่ไม่ใช่ AppError
      expect(isAppError("string error")).toBe(false);
      expect(isAppError(500)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({ status: 400, message: "Custom object" })).toBe(false);
    });
  });
});
