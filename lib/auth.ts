import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { nextCookies } from "better-auth/next-js";
import nodemailer from "nodemailer";
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  advanced: {
    trustedProxyHeaders: true,
    generateId: false,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Sistem Absensi" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset Kata Sandi Anda",
        html: `
          <p>Halo ${user.name},</p>
          <p>Anda menerima email ini karena ada permintaan untuk mengatur ulang kata sandi akun Anda.</p>
          <p>Silakan klik tautan di bawah ini untuk mengatur ulang kata sandi Anda:</p>
          <a href="${url}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Kata Sandi</a>
          <p>Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan saja email ini.</p>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});
