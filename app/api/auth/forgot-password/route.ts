import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateOtpEmail } from "@/lib/email";
import { randomInt } from "crypto";

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
              ? "Jika email terdaftar, kode OTP akan dikirim"
              : "If the email is registered, an OTP code will be sent",
        },
        { status: 200 }
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store verification token
    await prisma.verification.create({
      data: {
        identifier: `password-reset-otp:${user.id}`,
        value: otp,
        expiresAt,
      },
    });

    // Send email
    const emailHtml = generateOtpEmail({
      name: user.name,
      otp,
      locale,
    });
    const emailResult = await sendEmail({
      to: email,
      subject:
        locale === "id"
          ? "Kode OTP Reset Password - Diskominfo Makassar"
          : "Password Reset OTP - Diskominfo Makassar",
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
            ? "Kode OTP telah dikirim ke email Anda"
            : "The OTP code has been sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
