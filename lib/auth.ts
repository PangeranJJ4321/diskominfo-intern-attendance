import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

// The canonical URL of your app.
// Set this in your Vercel environment variables.
// For production: https://your-domain.com
// For preview deployments, Vercel sets VERCEL_URL.
const appUrl =
  process.env.AUTH_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const allowedHosts = Array.from(
  new Set(
    [
      new URL(appUrl).host,
      // Add the Vercel project URL as a fallback if you use a custom domain
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter((host): host is string => Boolean(host)),
  ),
);

export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    protocol: new URL(appUrl).protocol.replace(":", "") as "http" | "https",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  advanced: {
    trustedProxyHeaders: true,
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
