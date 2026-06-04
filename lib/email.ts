import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface OtpEmailOptions {
  name: string;
  otp: string;
  locale?: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.verify();
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, result };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export function generateResetPasswordEmail(
  name: string,
  resetLink: string,
  locale: string = "en"
) {
  const isIndonesian = locale === "id";
  const title = isIndonesian
    ? "Atur Ulang Password Anda"
    : "Reset Your Password";
  const message = isIndonesian
    ? "Kami menerima permintaan untuk mengatur ulang password akun Anda. Klik tombol di bawah untuk melanjutkan."
    : "We received a request to reset the password for your account. Click the button below to proceed.";
  const buttonText = isIndonesian ? "Atur Ulang Password" : "Reset Password";
  const footer = isIndonesian
    ? "Link ini akan berlaku selama 1 jam. Jika Anda tidak meminta perubahan ini, abaikan email ini."
    : "This link will expire in 1 hour. If you didn't request this change, please ignore this email.";
  const company = "Diskominfo Kota Makassar";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #dc2626 0%, #7f1d1d 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
          .message { font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 25px; }
          .button { display: inline-block; background: linear-gradient(to right, #dc2626 0%, #991b1b 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          .company { font-weight: 600; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${company}</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Sistem Absensi Digital</p>
          </div>
          <div class="content">
            <div class="title">${title}</div>
            <p class="message">${message}</p>
            <center>
              <a href="${resetLink}" class="button">${buttonText}</a>
            </center>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">
              ${isIndonesian ? "atau salin URL ini ke browser Anda:" : "Or copy this URL to your browser:"}
            </p>
            <p style="font-size: 12px; color: #6b7280; word-break: break-all;">
              ${resetLink}
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">${footer}</p>
            <p style="margin: 0;"><span class="company">${company}</span> © 2026</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateOtpEmail({
  name,
  otp,
  locale = "en",
}: OtpEmailOptions) {
  const isIndonesian = locale === "id";
  const title = isIndonesian ? "Kode OTP Reset Password" : "Password Reset OTP";
  const message = isIndonesian
    ? `Halo ${name}, berikut kode OTP untuk mengatur ulang password akun Anda.`
    : `Hello ${name}, here is the OTP code to reset your account password.`;
  const instructions = isIndonesian
    ? "Gunakan kode berikut di halaman reset password. Kode ini berlaku selama 10 menit."
    : "Use the code below on the reset password page. This code expires in 10 minutes.";
  const footer = isIndonesian
    ? "Jika Anda tidak meminta reset password, abaikan email ini."
    : "If you did not request a password reset, please ignore this email.";
  const company = "Diskominfo Kota Makassar";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #dc2626 0%, #7f1d1d 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
          .message { font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 20px; }
          .otp-box { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 18px; text-align: center; font-size: 30px; letter-spacing: 0.28em; font-weight: 700; color: #111827; margin: 24px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          .company { font-weight: 600; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${company}</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Sistem Absensi Digital</p>
          </div>
          <div class="content">
            <div class="title">${title}</div>
            <p class="message">${message}</p>
            <p class="message">${instructions}</p>
            <div class="otp-box">${otp}</div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">${footer}</p>
            <p style="margin: 0;"><span class="company">${company}</span> © 2026</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
