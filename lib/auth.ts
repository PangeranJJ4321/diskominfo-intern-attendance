import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { nextCookies } from "better-auth/next-js";

/**
 * Creates and configures the MariaDB driver adapter for Prisma.
 *
 * @returns {PrismaMariaDb} Configured driver adapter.
 */
function getAdapter(): PrismaMariaDb {
  const mysqlUrl = process.env.DATABASE_URL;
  if (!mysqlUrl) {
    throw new Error("DATABASE_URL is not defined");
  }
  const parsedUrl = new URL(mysqlUrl);
  const user = decodeURIComponent(parsedUrl.username);
  const password = decodeURIComponent(parsedUrl.password);
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 3306;
  const database = parsedUrl.pathname.replace(/^\//, '');

  return new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 10,
  });
}

const adapter = getAdapter();
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
