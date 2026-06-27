import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { nextCookies } from "better-auth/next-js";
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
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});
