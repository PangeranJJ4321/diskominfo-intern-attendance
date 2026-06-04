import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@better-auth/utils/password";

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword, locale = "en" } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: "Email, token, and new password are required" },
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

    // Find and verify the reset token
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: `password-reset-link:${user.id}`,
        value: token,
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Link tidak valid"
              : "Invalid link",
        },
        { status: 400 }
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Link reset password telah kadaluarsa"
              : "Password reset link has expired",
        },
        { status: 400 }
      );
    }

    // Hash new password using Better Auth's hashPassword function
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

    // Delete verification token after successful reset (one-time use)
    await prisma.verification.deleteMany({
      where: {
        identifier: `password-reset-link:${user.id}`,
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
    console.error("Reset password with link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
