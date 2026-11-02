import { describe, expect, it, vi, beforeEach } from "vitest";
import { analyzeFood, aiBreaker } from "../ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock @/lib/env เพื่อไม่ให้พึ่งพา Environment Variable จริงขณะรัน Unit Test
vi.mock("@/lib/env", () => ({
  env: {
    GOOGLE_GENERATIVE_AI_API_KEY: "mock-google-api-key",
  },
}));

// สร้าง mock function สำหรับ generateContent และ getGenerativeModel
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

// Mock @google/generative-ai เป็น class constructor ที่สมบูรณ์
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
  };
});

describe("analyzeFood", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiBreaker.reset(); // รีเซ็ต Circuit Breaker ก่อนแต่ละ test
  });

  it("should successfully analyze food and return correct JSON data", async () => {
    // 1. จัดเตรียมข้อมูลจำลอง (Mock Data) จาก AI
    const mockAiResponse = {
      foods: [
        {
          name: "ข้าวผัดกระเพราไข่ดาว",
          amount: 1,
          unit: "จาน",
          calories: 600,
          protein: 25,
        },
      ],
      summary: "ข้าวผัดกระเพราไข่ดาว 1 จาน",
      estimatedCalories: 600,
      estimatedProtein: 25,
      note: "ปริมาณแคลอรีโดยประมาณ",
    };

    // จำลองคำตอบจาก generateContent
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAiResponse),
      },
    });

    // 2. เรียกใช้งานฟังก์ชัน analyzeFood
    const result = await analyzeFood("ข้าวผัดกระเพราไข่ดาว 1 จาน");

    // 3. ตรวจสอบผลลัพธ์
    expect(result).toEqual(mockAiResponse);
    expect(GoogleGenerativeAI).toHaveBeenCalledWith("mock-google-api-key");
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
  });

  it("should throw AI_QUOTA_EXCEEDED error when API returns Quota Exceeded error", async () => {
    // จำลอง Error 429 จาก Google AI API
    mockGenerateContent.mockRejectedValue(
      new Error("429 Resource has been exhausted (e.g. check quota)."),
    );

    // คาดหวังว่าจะโยน Error "AI_QUOTA_EXCEEDED"
    await expect(analyzeFood("ก๋วยเตี๋ยวเรือ")).rejects.toThrow(
      "AI_QUOTA_EXCEEDED",
    );
  });

  it("should throw AI_INVALID_RESPONSE error when AI returns invalid JSON response", async () => {
    // จำลองกรณีที่ AI คืนค่าที่ไม่สามารถ parse เป็น JSON ได้
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Invalid raw text response from model",
      },
    });

    // คาดหวังว่าจะโยน Error "AI_INVALID_RESPONSE"
    await expect(analyzeFood("ส้มตำไทย")).rejects.toThrow(
      "AI_INVALID_RESPONSE",
    );
  });

  it("should propagate the original error when other errors occur", async () => {
    // จำลอง Generic Error เช่น 500 Internal Server Error หรือ Network Connection Failed
    const genericError = new Error("500 Internal Server Error");
    mockGenerateContent.mockRejectedValue(genericError);

    // คาดหวังว่าจะโยน Error เดิมกลับมา ไม่โดนแปลงเป็น AI_QUOTA_EXCEEDED
    await expect(analyzeFood("ข้าวมันไก่")).rejects.toThrow(
      "500 Internal Server Error",
    );
  });

  it("should fail fast when circuit is open", async () => {
    mockGenerateContent.mockRejectedValue(new Error("429 Resource exhausted"));

    // ครั้งแรก-5 ครั้ง ทำให้ breaker เปิด
    for (let i = 0; i < 5; i++) {
      await expect(analyzeFood("test")).rejects.toThrow();
    }

    await expect(analyzeFood("test")).rejects.toThrow(
      "AI_PROVIDER_UNAVAILABLE",
    );
  });

  it("should reopen after cooldown", async () => {
    vi.useFakeTimers();

    try {
      mockGenerateContent.mockRejectedValue(
        new Error("500 Internal Server Error"),
      );

      // Failure 5 ครั้ง → Circuit เปิด
      for (let i = 0; i < 5; i++) {
        await expect(analyzeFood("test")).rejects.toThrow();
      }

      // เลื่อนเวลาให้ผ่าน Cooldown
      await vi.advanceTimersByTimeAsync(30_000); // 30 วินาที

      // Half-Open → ทดลองเรียก AI แต่ยังล้มเหลว
      await expect(analyzeFood("test")).rejects.toThrow(
        "500 Internal Server Error",
      );

      // กลับไป Open → Request ถัดไปต้องถูกปฏิเสธ
      // Request ถัดไปต้องถูกปฏิเสธ เพราะ Circuit กลับไป Open
      await expect(analyzeFood("test")).rejects.toThrow(
        "AI_PROVIDER_UNAVAILABLE",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should count repeated failure and open breaker", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error("500 Internal Server Error"),
    );

    // ทำให้เกิดความล้มเหลวซ้ำ ๆ จน Circuit Breaker เปิด
    for (let i = 0; i < 4; i++) {
      await expect(analyzeFood("test")).rejects.toThrow(
        "500 Internal Server Error",
      );
    }

    // ครั้งที่ 5 → Circuit Breaker เปิด
    await expect(analyzeFood("test")).rejects.toThrow(
      "500 Internal Server Error",
    );

    // ครั้งที่ 6 → Circuit Breaker เปิดแล้ว → ควรถูกปฏิเสธทันที
    await expect(analyzeFood("test")).rejects.toThrow(
      "AI_PROVIDER_UNAVAILABLE",
    );

    // ตรวจสอบว่า mockGenerateContent ถูกเรียกใช้งานทั้งหมด 5 ครั้ง (ก่อนที่ Circuit Breaker จะเปิด)
    expect(mockGenerateContent).toHaveBeenCalledTimes(5);
  });
});
