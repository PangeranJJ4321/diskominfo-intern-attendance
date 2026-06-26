import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
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
      `ADMIN_PASSWORD: ${adminPassword ? "Set" : "Not Set"}`,
  );
}

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

// Narrowed variables for use inside the main function closure
const name = adminName;
const email = adminEmail;
const password = adminPassword;

const adapter = getAdapter();
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
    console.log(
      `User with email ${email} already exists. ID: ${existingUser.id}`,
    );
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

    await prisma.$transaction(async (txClient) => {
      const tx = txClient as typeof prisma;
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

  // 3. Create Institution
  const institutionName = "Universitas Hasanuddin";
  let institutionId: string;

  const existingInstitution = await prisma.institution.findFirst({
    where: { name: institutionName },
  });

  if (existingInstitution) {
    console.log(
      `Institution "${institutionName}" already exists. ID: ${existingInstitution.id}`,
    );
    institutionId = existingInstitution.id;
  } else {
    console.log(`Creating institution "${institutionName}"...`);
    institutionId = generateCuid();

    await prisma.institution.create({
      data: {
        id: institutionId,
        name: institutionName,
      },
    });
    console.log("Institution created successfully.");
  }

  // 4. Create Agency
  const agencyName = "Diskominfo Kota Makassar";
  let agencyId: string;

  const existingAgency = await prisma.agency.findFirst({
    where: { name: agencyName },
  });

  if (existingAgency) {
    console.log(
      `Agency "${agencyName}" already exists. ID: ${existingAgency.id}`,
    );
    agencyId = existingAgency.id;
  } else {
    console.log(`Creating agency "${agencyName}"...`);
    agencyId = generateCuid();

    await prisma.agency.create({
      data: {
        id: agencyId,
        name: agencyName,
      },
    });
    console.log("Agency created successfully.");
  }

  // 5. Create AgencyArea (GeoJSON geofence)
  const existingAgencyArea = await prisma.agencyArea.findUnique({
    where: { agencyId },
  });

  if (existingAgencyArea) {
    console.log(`AgencyArea for "${agencyName}" already exists.`);
  } else {
    console.log("Creating AgencyArea...");
    await prisma.agencyArea.create({
      data: {
        id: generateCuid(),
        agencyId,
        geoData: {
          type: "Polygon",
          coordinates: [
            [
              [119.41, -5.15],
              [119.43, -5.15],
              [119.43, -5.135],
              [119.41, -5.135],
              [119.41, -5.15],
            ],
          ],
        },
        timezone: "Asia/Makassar",
      },
    });
    console.log("AgencyArea created successfully.");
  }

  // 6. Create AgencyRule
  const existingAgencyRule = await prisma.agencyRule.findUnique({
    where: { agencyId },
  });

  if (existingAgencyRule) {
    console.log(`AgencyRule for "${agencyName}" already exists.`);
  } else {
    console.log("Creating AgencyRule...");
    await prisma.agencyRule.create({
      data: {
        id: generateCuid(),
        agencyId,
        requireFaceVerification: true,
        requireWithinArea: true,
      },
    });
    console.log("AgencyRule created successfully.");
  }

  // 7. Create AgencyAccess linking admin user to agency
  const existingAgencyAccess = await prisma.agencyAccess.findFirst({
    where: { userId, agencyId },
  });

  if (existingAgencyAccess) {
    console.log("Admin already has agency access.");
  } else {
    console.log("Granting admin access to the agency...");
    await prisma.agencyAccess.create({
      data: {
        id: generateCuid(),
        userId,
        agencyId,
      },
    });
    console.log("Agency access granted successfully.");
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
