import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";
import { buildProfileNutritionSummary, calculateDailyNutritionTargets } from "@/lib/nutrition";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: Number(session.user.id) },
    });

    const summary = buildProfileNutritionSummary(profile, 0, 0);

    return NextResponse.json({ profile, ...summary });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gender, age, weight, height, exerciseLevel, goal } = body;

  if (!gender || !age || !weight || !height || !exerciseLevel || !goal) {
    return NextResponse.json(
      { message: "Please complete all personal information fields" },
      { status: 400 }
    );
  }

  const profileData = {
    gender,
    age: Number(age),
    weight: Number(weight),
    height: Number(height),
    exerciseLevel,
    goal,
  };

  const nutritionTargets = calculateDailyNutritionTargets(profileData);

  if (!nutritionTargets) {
    return NextResponse.json(
      { message: "Unable to calculate nutrition targets from the provided profile" },
      { status: 400 }
    );
  }

  const profilePayload = {
    ...profileData,
    bmr: nutritionTargets.bmr,
    tdee: nutritionTargets.tdee,
    targetCalories: nutritionTargets.calories,
    tragetProtein: nutritionTargets.protein,
  };

  try {
    const userId = Number(session.user.id);
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const profile = existingProfile
      ? await prisma.profile.update({
          where: { userId },
          data: profilePayload,
        })
      : await prisma.profile.create({
          data: {
            userId,
            ...profilePayload,
          },
        });

    const summary = buildProfileNutritionSummary(profile, 0, 0);

    return NextResponse.json({ profile, ...summary, message: "Profile saved successfully" });
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  }
}
