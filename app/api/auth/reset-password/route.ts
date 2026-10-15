import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
    try {
        const rateLimit = await checkRateLimit(req, "reset-password", 20, 60);

        if (!rateLimit.success) {
            return NextResponse.json(
                { message: "Too many reset password attempts. Please try again in a minute." },
                { status: 429, headers: { "Cache-Control": "no-store" } }
            );
        }

        let body = {};
        try {
            body = await req.json();
        } catch {
            // Zod will report missing fields
        }

        const validationResult = resetPasswordSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { token, password } = validationResult.data;

        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token: token,
                type: "PASSWORD_RESET",
            }
        });

        if (!verificationToken?.token) {
            return NextResponse.json(
                { message: "Invalid reset token" },
                { status: 400 }
            );
        }

        if (verificationToken.expiresAt < new Date()) {
            return NextResponse.json(
                { message: "Expired reset token" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email: verificationToken.email,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid reset token" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: {
                    email: verificationToken.email,
                },
                data: {
                    password: hashedPassword,
                },
            }),
            prisma.verificationToken.delete({
                where: {
                    token: token,
                },
            }),
        ]);

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}