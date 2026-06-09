import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import * as dotenv from "dotenv";
import { generateCuid } from "../lib/string-utils";

// Load environment variables from .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}

const adminName = process.env.ADMIN_NAME;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminName || !adminEmail || !adminPassword) {
  throw new Error(
    "Missing required environment variables for seeding admin user:\n" +
    `ADMIN_NAME: ${adminName ? "Set" : "Not Set"}\n` +
    `ADMIN_EMAIL: ${adminEmail ? "Set" : "Not Set"}\n` +
    `ADMIN_PASSWORD: ${adminPassword ? "Set" : "Not Set"}`
  );
}

// Narrowed variables for use inside the main function closure
const name = adminName;
const email = adminEmail;
const password = adminPassword;

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

/**
 * Main database seed function that creates an admin user and credential account.
 *
 * @returns {Promise<void>} Resolves when database seeding is completed.
 */
async function main() {
  console.log("Seeding started...");

  const normalizedEmail = email.toLowerCase();

  // 1. Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  let userId: string;

  if (existingUser) {
    console.log(`User with email ${email} already exists. ID: ${existingUser.id}`);
    userId = existingUser.id;

    // Check if the user has an Account record
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      console.log("Creating credential account for existing user...");
      const hashedPassword = await hashPassword(password);
      await prisma.account.create({
        data: {
          id: generateCuid(),
          userId,
          providerId: "credential",
          accountId: userId,
          password: hashedPassword,
        },
      });
      console.log("Credential account created successfully.");
    } else {
      console.log("Credential account already exists.");
    }
  } else {
    // 2. Create the user
    userId = generateCuid();
    console.log(`Creating user ${name} (${email})...`);

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name: name,
          email: normalizedEmail,
          emailVerified: true,
        },
      });

      await tx.account.create({
        data: {
          id: generateCuid(),
          userId,
          providerId: "credential",
          accountId: userId,
          password: hashedPassword,
        },
      });
    });

    console.log("User and account created successfully.");
  }

  // 3. Add to Access data (Admin privileges)
  const existingAccess = await prisma.access.findFirst({
    where: { userId },
  });

  if (!existingAccess) {
    console.log("Granting admin access (creating Access record)...");
    await prisma.access.create({
      data: {
        userId,
      },
    });
    console.log("Admin access granted.");
  } else {
    console.log("User already has admin access.");
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect prisma client
    await prisma.$disconnect();
  });
