import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/sesstion";
import { logger } from "@/lib/logger";


export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        const { id } = await params;
        const mealId = Number(id);

        if (!session?.user?.id) {
            logger.error({ session }, "Unauthorized");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(session.user.id);


        const isMealOwner = await prisma.meal.findFirst({
            where: {
                id: mealId,
                userId: userId
            }
        });

        if (!isMealOwner) {
            logger.error({ mealId, userId }, "Meal not found or unauthorized");
            return NextResponse.json({ message: "Meal not found or unauthorized" }, { status: 404 });
        }

        await prisma.meal.delete({
            where: {
                id: mealId
            }
        });

        return NextResponse.json({ message: "Meal deleted successfully" });

    } catch (error) {
        console.error(error);
        logger.error({ error }, "Meal delete error");
        return NextResponse.json({ message: "Internal server error" }, { status: 503 });
    }
}   