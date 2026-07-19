export type NutritionProfile = {
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  exerciseLevel?: string | null;
  goal?: string | null;
};

export type NutritionTargets = {
  calories: number;
  protein: number;
  bmr: number;
  tdee: number;
  goalLabel: string;
};

export type BmiStatus = {
  label: string;
  tone: string;
};

export function calculateDailyNutritionTargets(profile: NutritionProfile | null | undefined): NutritionTargets | null {
  if (!profile?.age || !profile?.weight || !profile?.height) {
    return null;
  }

  const age = Number(profile.age);
  const weight = Number(profile.weight);
  const height = Number(profile.height);

  const bmr =
    profile.gender === "MALE"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultiplierMap: Record<string, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  };
  const calorieAdjustmentMap: Record<string, number> = {
    LOSE_WEIGHT: -500,
    MAINTAIN_WEIGHT: 0,
    GAIN_WEIGHT: 300,
  };
  const proteinFactorMap: Record<string, number> = {
    LOSE_WEIGHT: 1.8,
    MAINTAIN_WEIGHT: 1.6,
    GAIN_WEIGHT: 2.0,
  };

  const activityMultiplier = activityMultiplierMap[profile.exerciseLevel ?? ""] ?? 1.2;
  const calorieAdjustment = calorieAdjustmentMap[profile.goal ?? ""] ?? 0;
  const proteinFactor = proteinFactorMap[profile.goal ?? ""] ?? 1.6;

  const tdee = Math.round(bmr * activityMultiplier);
  const calories = Math.max(1200, tdee + calorieAdjustment);
  const protein = Math.max(80, Math.round(weight * proteinFactor));

  const goalLabelMap: Record<string, string> = {
    LOSE_WEIGHT: "Lose weight",
    MAINTAIN_WEIGHT: "Maintain weight",
    GAIN_WEIGHT: "Gain weight",
  };
  const goalLabel = goalLabelMap[profile.goal ?? ""] ?? "Maintain weight";

  return {
    calories,
    protein,
    bmr: Math.round(bmr),
    tdee,
    goalLabel,
  };
}

export function getBmiStatus(bmi: number): BmiStatus {
  if (bmi < 18.5) {
    return { label: "Underweight", tone: "border-amber-400/30 bg-amber-500/10 text-amber-300" };
  }

  if (bmi < 25) {
    return { label: "Healthy", tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" };
  }

  return { label: "Overweight", tone: "border-rose-400/30 bg-rose-500/10 text-rose-300" };
}

export function buildProfileNutritionSummary(
  profile: NutritionProfile | null | undefined,
  todayCalories = 0,
  todayProtein = 0
) {
  const nutritionTargets = calculateDailyNutritionTargets(profile);

  const bmi =
    profile?.weight && profile?.height
      ? Number((profile.weight / ((profile.height / 100) ** 2)).toFixed(1))
      : null;

  const bmiStatus = bmi !== null ? getBmiStatus(bmi) : null;

  const caloriesTarget = nutritionTargets?.calories ?? 0;
  const proteinTarget = nutritionTargets?.protein ?? 0;

  return {
    bmi,
    bmiStatus,
    nutritionTargets,
    dailyProgress: {
      calories: {
        consumed: todayCalories,
        target: caloriesTarget,
        percent: nutritionTargets ? Math.min(100, Math.round((todayCalories / caloriesTarget) * 100)) : 0,
      },
      protein: {
        consumed: todayProtein,
        target: proteinTarget,
        percent: nutritionTargets ? Math.min(100, Math.round((todayProtein / proteinTarget) * 100)) : 0,
      },
    },
  };
}
