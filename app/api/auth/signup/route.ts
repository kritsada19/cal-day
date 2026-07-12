import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: "Please provide name, email and password" }, { status: 400 });
        }

        const user = await prisma.users.findUnique({ where: { email } });

        if (user) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        return NextResponse.json({ message: "User created successfully" }, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    }
} 