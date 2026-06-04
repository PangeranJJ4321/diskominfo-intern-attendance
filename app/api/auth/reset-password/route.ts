import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@better-auth/utils/password";

export async function POST(req: NextRequest) {
  try {
    const { email, token, otp, newPassword, locale = "en" } = await req.json();

    if (!email || (!token && !otp) || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Password minimal 8 karakter"
              : "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or token" },
        { status: 400 }
      );
    }

    let verificationIdentifier = otp
      ? `password-reset-otp:${user.id}`
      : `password-reset-link:${user.id}`;

    let verification = await prisma.verification.findFirst({
      where: {
        identifier: verificationIdentifier,
        value: otp ?? token,
      },
    });

    if (!verification && token && !otp) {
      verificationIdentifier = `password-reset:${user.id}`;
      verification = await prisma.verification.findFirst({
        where: {
          identifier: verificationIdentifier,
          value: token,
        },
      });
    }

    if (!verification || verification.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? otp
                ? "Kode OTP telah kadaluarsa atau tidak valid"
                : "Link reset password telah kadaluarsa"
              : otp
                ? "The OTP code has expired or is invalid"
                : "Password reset link has expired",
        },
        { status: 400 }
      );
    }

    // Hash new password using Better Auth's hashPassword function (CRITICAL - must match seed.ts)
    const hashedPassword = await hashPassword(newPassword);

    // Get or create account with credential provider
    let account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
    });

    if (!account) {
      // Create account if it doesn't exist
      account = await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    } else {
      // Update existing account password
      account = await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
    }

    // Delete verification token
    await prisma.verification.deleteMany({
      where: {
        identifier: verificationIdentifier,
      },
    });

    return NextResponse.json(
      {
        message:
          locale === "id"
            ? "Password berhasil diperbarui"
            : "Password successfully updated",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
