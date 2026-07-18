import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    let body: { name?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "Please provide name, email, password and confirm password" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    if (name.length > 100 || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid name and email address" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: "If this account already exists, you can log in instead" },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "We could not create your account right now" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
