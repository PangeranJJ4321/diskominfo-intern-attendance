import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, locale = "en" } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            locale === "id" ? "Email tidak ditemukan" : "Email not found",
        },
        { status: 400 }
      );
    }

    // Find and verify OTP
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: `password-reset-otp:${user.id}`,
        value: otp,
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Kode OTP tidak valid"
              : "Invalid OTP code",
        },
        { status: 400 }
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Kode OTP telah kadaluarsa"
              : "OTP code has expired",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message:
          locale === "id"
            ? "Kode OTP berhasil diverifikasi"
            : "OTP code verified successfully",
        email,
        otp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
