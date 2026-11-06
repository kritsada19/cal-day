import { requireAuth } from "@/lib/auth/access";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export async function checkProfileCompletion() {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const session = auth.session;

  const profile = await prisma.profile.findUnique({
    where: { userId: Number(session.user.id) },
    select: {
      gender: true,
      age: true,
      weight: true,
      height: true,
      exerciseLevel: true,
      goal: true,
      bmr: true,
      tdee: true,
      targetCalories: true,
      targetProtein: true,
    },
  });

  const isComplete = Boolean(
    profile &&
    profile.gender &&
    profile.age &&
    profile.weight &&
    profile.height &&
    profile.exerciseLevel &&
    profile.goal &&
    profile.bmr &&
    profile.tdee &&
    profile.targetCalories &&
    profile.targetProtein,
  );

  if (!isComplete && !profile) {
    redirect("/profile/form");
  }

  return { ok: true, completed: isComplete };
}
