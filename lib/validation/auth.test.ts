import { describe, expect, it } from "vitest";
import { sessionSchema, signupSchema } from "./auth";

describe("signupSchema", () => {
  // Happy path: ข้อมูลที่ถูกต้องทุก field ควรผ่าน validation
  // เพราะ regex ตรวจว่า password ต้องมีตัวเล็ก ตัวใหญ่ และตัวเลข อย่างน้อย 1 ตัว
  it("accepts a valid signup payload", () => {
    const payload = {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    };

    const result = signupSchema.safeParse(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(payload);
    }
  });

  // name ต้องมีความยาวอย่างน้อย 1 ตัวอักษร
  // ถ้าเป็น string ว่าง จะ fail ที่ message "Name is required"
  it("rejects an empty name", () => {
    const result = signupSchema.safeParse({
      name: "",
      email: "alice@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  // email ต้องเป็นรูปแบบ email ที่ถูกต้องตาม zod email validator
  it("rejects an invalid email format", () => {
    const result = signupSchema.safeParse({
      name: "Alice Johnson",
      email: "not-an-email",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address");
    }
  });

  // Password ต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข รวมกัน
  // ถ้าไม่มีข้อใดข้อหนึ่ง จะ fail ตาม regex message ที่กำหนดไว้
  it("rejects weak passwords that do not satisfy the rules", () => {
    const result = signupSchema.safeParse({
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "weakpass",
      confirmPassword: "weakpass",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }
  });

  // refine() ถูกใช้เพื่อเช็คว่า password กับ confirmPassword ต้องตรงกัน
  // และ set path เป็น ["confirmPassword"] เพื่อบอกว่าความผิดพลาดมาจากฟิลด์นี้
  it("rejects mismatched confirmPassword values", () => {
    const result = signupSchema.safeParse({
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "Password123",
      confirmPassword: "Password456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("sessionSchema", () => {
  // Session payload ที่มาจากระบบ auth ควรมี id, role, plan เป็น string
  it("accepts a valid session payload", () => {
    const payload = {
      id: "user_123",
      role: "user",
      plan: "pro",
    };

    const result = sessionSchema.safeParse(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(payload);
    }
  });

  // ถ้าขาด field ใด field หนึ่ง จะ fail และให้เห็นว่ามีข้อมูลจำเป็นหายไป
  it("rejects a session payload with missing required fields", () => {
    const result = sessionSchema.safeParse({
      id: "user_123",
      role: "user",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["plan"]);
    }
  });
});
