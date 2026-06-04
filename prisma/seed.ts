import "dotenv/config";
import { hashPassword } from "@better-auth/utils/password";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { Role } from "../lib/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main(): Promise<void> {
  const superadminName = process.env.SUPERADMIN_NAME;
  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superadminName || !superadminEmail || !superadminPassword) {
    throw new Error(
      "Missing SUPERADMIN_NAME, SUPERADMIN_EMAIL, or SUPERADMIN_PASSWORD in the environment",
    );
  }

  const normalizedEmail = superadminEmail.trim().toLowerCase();
  const passwordHash = await hashPassword(superadminPassword);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: {
      name: superadminName.trim(),
      email: normalizedEmail,
      role: Role.SUPERADMIN,
      emailVerified: true,
    },
    update: {
      name: superadminName.trim(),
      role: Role.SUPERADMIN,
      emailVerified: true,
    },
  });

  await prisma.account.deleteMany({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    },
  });

  console.log(
    `Seeded superadmin account for ${user.email} with role ${user.role}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
