type TranslateFn = (key: string) => string;

export function enumToTranslationKey(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const underscored = trimmed.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
  return underscored
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

const GOAL_LABEL_KEYS: Record<string, string> = {
  loseWeight: "goalOptions.loseWeight",
  maintainWeight: "goalOptions.maintainWeight",
  gainWeight: "goalOptions.gainWeight",
};

const GENDER_LABEL_KEYS: Record<string, string> = {
  male: "genderOptions.male",
  female: "genderOptions.female",
};

const EXERCISE_LEVEL_LABEL_KEYS: Record<string, string> = {
  sedentary: "exerciseLevelOptions.sedentary",
  light: "exerciseLevelOptions.light",
  moderate: "exerciseLevelOptions.moderate",
  active: "exerciseLevelOptions.active",
  veryActive: "exerciseLevelOptions.veryActive",
};

const USER_ROLE_LABEL_KEYS: Record<string, string> = {
  ADMIN: "administrator",
  USER: "user",
};

export function formatGoalLabel(goal: string | null | undefined, t: TranslateFn) {
  if (!goal) return "—";
  const normalizedGoal = enumToTranslationKey(goal) ?? goal;
  return t(GOAL_LABEL_KEYS[normalizedGoal] ?? "goalOptions.maintainWeight");
}

export function formatGenderLabel(gender: string | null | undefined, t: TranslateFn) {
  if (!gender) return "—";
  const normalizedGender = enumToTranslationKey(gender) ?? gender;
  return t(GENDER_LABEL_KEYS[normalizedGender] ?? "genderOptions.male");
}

export function formatExerciseLevelLabel(exerciseLevel: string | null | undefined, t: TranslateFn) {
  if (!exerciseLevel) return "—";
  const normalizedExerciseLevel = enumToTranslationKey(exerciseLevel) ?? exerciseLevel;
  return t(EXERCISE_LEVEL_LABEL_KEYS[normalizedExerciseLevel] ?? "exerciseLevelOptions.moderate");
}

export function formatUserRoleLabel(role: string | null | undefined, t: TranslateFn) {
  if (!role) return t("user");
  return t(USER_ROLE_LABEL_KEYS[role] ?? "user");
}

export function formatSubscriptionPlanLabel(plan: string | null | undefined, t: TranslateFn) {
  if (!plan || plan === "FREE") return t("free");
  return plan.toUpperCase();
}
