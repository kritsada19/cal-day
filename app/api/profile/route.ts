import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: Number(session.user.id) },
  });

  return NextResponse.json({ profile });
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

  const userId = Number(session.user.id);
  const existingProfile = await prisma.profile.findUnique({
    where: { userId },
  });

  const profile = existingProfile
    ? await prisma.profile.update({
        where: { userId },
        data: {
          gender,
          age: Number(age),
          weight: Number(weight),
          height: Number(height),
          exerciseLevel,
          goal,
        },
      })
    : await prisma.profile.create({
        data: {
          userId,
          gender,
          age: Number(age),
          weight: Number(weight),
          height: Number(height),
          exerciseLevel,
          goal,
        },
      });

  return NextResponse.json({ profile, message: "Profile saved successfully" });
}
