import { checkProfileCompletion } from "@/lib/auth/profile-guard";
import MealFormClient from "./meal-form-client";

export default async function MealFormPage() {
  await checkProfileCompletion();

  return <MealFormClient />;
}