import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { sendForgotPasswordEmail } from "@/lib/email/sendEmail";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
    try {
        const rateLimit = await checkRateLimit(req, "forgot-password", 20, 60);

        if (!rateLimit.success) {
            return NextResponse.json(
                { message: "Too many forgot password attempts. Please try again in a minute." },
                { status: 429, headers: { "Cache-Control": "no-store" } }
            );
        }

        let body = {};
        try {
            body = await req.json();
        } catch {
            // Zod will report missing fields
        }

        const validationResult = forgotPasswordSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: validationResult.error.issues[0].message },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        const email = validationResult.data.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: "If an account exists, we have sent a reset link" },
                { status: 200, headers: { "Cache-Control": "no-store" } }
            );
        }

        await prisma.verificationToken.deleteMany({
            where: {
                email,
                type: "PASSWORD_RESET",
            },
        });

        const resetToken = crypto.randomBytes(32).toString("hex");

        await prisma.verificationToken.create({
            data: {
                email,
                token: resetToken,
                type: "PASSWORD_RESET",
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expire in 1 Hour
            },
        });

        const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

        await sendForgotPasswordEmail(email, resetLink);

        return NextResponse.json(
            { message: "If an account exists, we have sent a reset link" },
            { status: 200, headers: { "Cache-Control": "no-store" } }
        );

    } catch (error) {
        logger.error({ err: error }, "Error sending password reset email");
        return NextResponse.json(
            { message: "We could not send a reset email right now" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
