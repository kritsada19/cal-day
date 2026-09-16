import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { Role, Plan } from "@/app/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "admin-users", 100, 60);

  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const roleParam = searchParams.get("role")?.toUpperCase();
    const planParam = searchParams.get("plan")?.toUpperCase();

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role;
    }

    if (planParam && Object.values(Plan).includes(planParam as Plan)) {
      where.subscription = {
        plan: planParam as Plan,
      };
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              startAt: true,
              endAt: true,
            },
          },
          profile: {
            select: {
              gender: true,
              age: true,
              weight: true,
              height: true,
              exerciseLevel: true,
              goal: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Admin users GET error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}