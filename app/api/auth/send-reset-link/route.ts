import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateResetPasswordEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { email, locale = "en" } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, we don't reveal if email exists
      return NextResponse.json(
        {
          message:
            locale === "id"
              ? "Jika email terdaftar, link reset akan dikirim"
              : "If the email is registered, a reset link will be sent",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset links for this user
    await prisma.verification.deleteMany({
      where: {
        identifier: `password-reset-link:${user.id}`,
      },
    });

    // Store verification token
    await prisma.verification.create({
      data: {
        identifier: `password-reset-link:${user.id}`,
        value: resetToken,
        expiresAt,
      },
    });

    // Generate reset link
    const baseUrl = process.env.AUTH_BASE_URL || "http://localhost:3000";

    const resetLink = `${baseUrl}/${locale}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email with link
    const emailHtml = generateResetPasswordEmail(user.name || user.email, resetLink, locale);
    const emailResult = await sendEmail({
      to: email,
      subject:
        locale === "id"
          ? "Link Reset Password - Diskominfo Makassar"
          : "Password Reset Link - Diskominfo Makassar",
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      return NextResponse.json(
        {
          error:
            locale === "id"
              ? "Gagal mengirim email. Silakan coba lagi."
              : "Failed to send email. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          locale === "id"
            ? "Link reset password telah dikirim ke email Anda"
            : "Password reset link has been sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send reset link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
