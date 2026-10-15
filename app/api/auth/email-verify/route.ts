import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    try {
        const rateLimit = await checkRateLimit(req, "verify-email", 3, 60);

        if (!rateLimit.success) {
            return NextResponse.redirect(
                `${baseUrl}/verify-email?status=error`
            );
        }

        const token = req.nextUrl.searchParams.get("token") || ""

        const record = await prisma.verificationToken.findFirst({
            where: {
                token: token,
                type: "EMAIL_VERIFY"
            }
        });

        if (!record) {
            return NextResponse.redirect(
                `${baseUrl}/verify-email?status=invalid`
            );
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.redirect(
                `${baseUrl}/verify-email?status=expired`
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email: record.email
            }
        });

        if (!user) {
            return NextResponse.redirect(
                `${baseUrl}/verify-email?status=invalid`
            );
        }

        if (user.emailVerified) {
            return NextResponse.redirect(
                `${baseUrl}/verify-email?status=already`
            );
        }

        await prisma.$transaction([
            prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    emailVerified: new Date()
                }
            }),
            prisma.verificationToken.delete({
                where: {
                    token: token
                }
            })
        ])

        return NextResponse.redirect(
            `${baseUrl}/verify-email?status=success`
        );

    } catch {
        return NextResponse.redirect(
            `${baseUrl}/verify-email?status=error`
        );
    }
}