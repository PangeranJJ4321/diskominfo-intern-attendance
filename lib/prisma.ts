import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = getAdapter();
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
