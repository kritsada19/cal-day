import { describe, expect, it } from "vitest";
import {
  buildProfileNutritionSummary,
  calculateDailyNutritionTargets,
  getBmiStatus,
} from "./nutrition";

describe("calculateDailyNutritionTargets", () => {
  it("returns null when required profile information is missing", () => {
    // profile ที่ขาด age/weight/height จะไม่สามารถคำนวณ BMR ได้
    // ดังนั้น function ควรป้องกันก่อนคำนวณและคืนค่า null
    const profile = {
      gender: "MALE",
      exerciseLevel: "MODERATE",
      goal: "LOSE_WEIGHT",
    };

    expect(calculateDailyNutritionTargets(profile)).toBeNull();
  });

  it("calculates BMR, TDEE, calories and protein correctly for a male profile", () => {
    // สูตร BMR ในโค้ดใช้ Mifflin-St Jeor แบบมี gender ติดตาม
    // male: 10*weight + 6.25*height - 5*age + 5
    // เราตั้ง profile ให้ชัดเจนเพื่อเช็กค่าที่คำนวณออกมา
    const profile = {
      gender: "MALE",
      age: 30,
      weight: 70,
      height: 175,
      exerciseLevel: "MODERATE",
      goal: "LOSE_WEIGHT",
    };

    const result = calculateDailyNutritionTargets(profile);

    expect(result).toEqual({
      calories: 2056,
      protein: 126,
      bmr: 1649,
      tdee: 2556,
      goalLabel: "Lose weight",
    });
  });

  it("uses default values when exerciseLevel or goal is unknown", () => {
    // ถ้า exerciseLevel หรือ goal ไม่ตรงกับ map ที่กำหนด
    // โค้ดจะ fallback เป็นค่า default: exerciseLevel = SEDENTARY, goal = MAINTAIN_WEIGHT
    const profile = {
      gender: "FEMALE",
      age: 25,
      weight: 60,
      height: 160,
      exerciseLevel: "UNKNOWN_LEVEL",
      goal: "UNKNOWN_GOAL",
    };

    const result = calculateDailyNutritionTargets(profile);

    expect(result).toEqual({
      calories: 1577,
      protein: 96,
      bmr: 1314,
      tdee: 1577,
      goalLabel: "Maintain weight",
    });
  });
});

describe("getBmiStatus", () => {
  it("returns the correct status label for underweight range", () => {
    const result = getBmiStatus(17.8);

    expect(result).toEqual({
      label: "Underweight",
      tone: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    });
  });

  it("returns the correct status label for healthy range", () => {
    const result = getBmiStatus(22.5);

    expect(result).toEqual({
      label: "Healthy",
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    });
  });

  it("returns overweight status for BMI 30", () => {
    const result = getBmiStatus(30);

    expect(result).toEqual({
      label: "Overweight",
      tone: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    });
  });
});

describe("buildProfileNutritionSummary", () => {
  it("builds BMI and progress summary for a healthy profile", () => {
    // BMI = weight / (height in meter)^2
    // 70 / (1.75^2) = 22.857... -> toFixed(1) = 22.9
    const profile = {
      gender: "MALE",
      age: 30,
      weight: 70,
      height: 175,
      exerciseLevel: "MODERATE",
      goal: "LOSE_WEIGHT",
    };

    const result = buildProfileNutritionSummary(profile, 1000, 60);

    expect(result.bmi).toBe(22.9);
    expect(result.bmiStatus).toEqual({
      label: "Healthy",
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    });
    expect(result.nutritionTargets).toEqual({
      calories: 2056,
      protein: 126,
      bmr: 1649,
      tdee: 2556,
      goalLabel: "Lose weight",
    });
    expect(result.dailyProgress.calories).toEqual({
      consumed: 1000,
      target: 2056,
      percent: 49,
    });
    expect(result.dailyProgress.protein).toEqual({
      consumed: 60,
      target: 126,
      percent: 48,
    });
  });

  it("returns zeroed values when profile is null or undefined", () => {
    // profile เป็น null => ไม่สามารถคำนวณ BMI หรือเป้าหมายได้
    // ดังนั้น summary ควร return ค่า default เป็น null/0 เพื่อป้องกัน crash
    const result = buildProfileNutritionSummary(null, 0, 0);

    expect(result.bmi).toBeNull();
    expect(result.bmiStatus).toBeNull();
    expect(result.nutritionTargets).toBeNull();
    expect(result.dailyProgress.calories).toEqual({
      consumed: 0,
      target: 0,
      percent: 0,
    });
    expect(result.dailyProgress.protein).toEqual({
      consumed: 0,
      target: 0,
      percent: 0,
    });
  });
});
