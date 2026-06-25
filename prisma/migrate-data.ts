import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental configuration
dotenv.config();

const postgresUrl = process.env.POSTGRES_DATABASE_URL as string;
const mysqlUrl = process.env.DATABASE_URL as string;

if (!process.env.POSTGRES_DATABASE_URL) {
  throw new Error("POSTGRES_DATABASE_URL (PostgreSQL connection string) is not set in environment variables");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL (MySQL connection string) is not set in environment variables");
}

/**
 * Creates and configures the MariaDB driver adapter for Prisma.
 *
 * @returns {PrismaMariaDb} Configured driver adapter.
 */
function getAdapter(): PrismaMariaDb {
  if (!mysqlUrl) {
    throw new Error("DATABASE_URL (MySQL connection string) is not set in environment variables");
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

async function main() {
  console.log("Starting data migration...");
  console.log("Source (PostgreSQL):", postgresUrl.split("@")[1]); // print domain only for security
  console.log("Target (MySQL):", mysqlUrl.split("@")[1]);

  const pgPool = new pg.Pool({ connectionString: postgresUrl });
  const adapter = getAdapter();
  const prisma = new PrismaClient({ adapter });

  try {
    // Connect to source and target
    await pgPool.query("SELECT 1");
    console.log("Connected to PostgreSQL successfully.");

    await prisma.$connect();
    console.log("Connected to MySQL successfully.");

    // 1. Clear target database tables to avoid conflicts
    console.log("Clearing target MySQL tables...");
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    
    await prisma.attendance.deleteMany();
    await prisma.locationLog.deleteMany();
    await prisma.shiftAssignment.deleteMany();
    await prisma.intern.deleteMany();
    await prisma.agencyRule.deleteMany();
    await prisma.agencyArea.deleteMany();
    await prisma.agencyHoliday.deleteMany();
    await prisma.agencyAccess.deleteMany();
    await prisma.faceDescriptor.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.agency.deleteMany();
    await prisma.institution.deleteMany();
    await prisma.user.deleteMany();
    
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log("Target MySQL database cleared.");

    // 2. Fetch all data from PostgreSQL
    console.log("Fetching data from PostgreSQL...");
    const pgUsers = await fetchAll(pgPool, "user");
    const pgInstitutions = await fetchAll(pgPool, "institution");
    const pgSessions = await fetchAll(pgPool, "session");
    const pgAccounts = await fetchAll(pgPool, "account");
    const pgVerifications = await fetchAll(pgPool, "verification");
    const pgAgencies = await fetchAll(pgPool, "agency");
    const pgShifts = await fetchAll(pgPool, "shift");
    const pgSchedules = await fetchAll(pgPool, "schedule");
    const pgShiftAssignments = await fetchAll(pgPool, "shift_assignment");
    const pgAgencyHolidays = await fetchAll(pgPool, "agency_holiday");
    const pgAgencyAreas = await fetchAll(pgPool, "agency_area");
    const pgAgencyRules = await fetchAll(pgPool, "agency_rule");
    const pgAgencyAccesses = await fetchAll(pgPool, "agency_access");
    const pgFaceDescriptors = await fetchAll(pgPool, "face_descriptor");
    const pgInterns = await fetchAll(pgPool, "intern");
    const pgAttendances = await fetchAll(pgPool, "attendance");
    const pgLocationLogs = await fetchAll(pgPool, "location_log");

    // 3. Migrate Users
    console.log(`Migrating ${pgUsers.length} Users...`);
    for (const row of pgUsers) {
      await prisma.user.create({
        data: {
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 4. Migrate Institutions
    console.log(`Migrating ${pgInstitutions.length} Institutions...`);
    for (const row of pgInstitutions) {
      await prisma.institution.create({
        data: {
          id: row.id,
          name: row.name,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 5. Migrate Sessions
    console.log(`Migrating ${pgSessions.length} Sessions...`);
    for (const row of pgSessions) {
      await prisma.session.create({
        data: {
          id: row.id,
          expiresAt: new Date(row.expiresAt),
          token: row.token,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
          userId: row.userId,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 6. Migrate Accounts
    console.log(`Migrating ${pgAccounts.length} Accounts...`);
    for (const row of pgAccounts) {
      await prisma.account.create({
        data: {
          id: row.id,
          accountId: row.accountId,
          providerId: row.providerId,
          userId: row.userId,
          accessToken: row.accessToken,
          refreshToken: row.refreshToken,
          idToken: row.idToken,
          accessTokenExpiresAt: row.accessTokenExpiresAt ? new Date(row.accessTokenExpiresAt) : null,
          refreshTokenExpiresAt: row.refreshTokenExpiresAt ? new Date(row.refreshTokenExpiresAt) : null,
          scope: row.scope,
          password: row.password,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 7. Migrate Verifications
    console.log(`Migrating ${pgVerifications.length} Verifications...`);
    for (const row of pgVerifications) {
      await prisma.verification.create({
        data: {
          id: row.id,
          identifier: row.identifier,
          value: row.value,
          expiresAt: new Date(row.expiresAt),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 8. Migrate Face Descriptors
    console.log(`Migrating ${pgFaceDescriptors.length} Face Descriptors...`);
    for (const row of pgFaceDescriptors) {
      await prisma.faceDescriptor.create({
        data: {
          id: row.id,
          userId: row.userId,
          descriptor: row.descriptor,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 9. Migrate Agencies (without defaultShiftId initially due to circular references)
    console.log(`Migrating ${pgAgencies.length} Agencies (temporary null defaultShiftId)...`);
    for (const row of pgAgencies) {
      await prisma.agency.create({
        data: {
          id: row.id,
          name: row.name,
          defaultShiftId: null, // set to null temporarily
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 10. Migrate Shifts
    console.log(`Migrating ${pgShifts.length} Shifts...`);
    for (const row of pgShifts) {
      await prisma.shift.create({
        data: {
          id: row.id,
          agencyId: row.agencyId,
          name: row.name,
          workOnHolidays: row.workOnHolidays,
          deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        }
      });
    }

    // 11. Restore Agency defaultShiftId values
    console.log("Restoring Agency defaultShiftId links...");
    for (const row of pgAgencies) {
      if (row.defaultShiftId) {
        await prisma.agency.update({
          where: { id: row.id },
          data: { defaultShiftId: row.defaultShiftId },
        });
      }
    }

    // 12. Migrate Agency Area, Rule, Access, Holidays
    console.log(`Migrating ${pgAgencyAreas.length} Agency Areas...`);
    for (const row of pgAgencyAreas) {
      await prisma.agencyArea.create({
        data: {
          id: row.id,
          agencyId: row.agencyId,
          geoData: row.geoData,
          timezone: row.timezone,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    console.log(`Migrating ${pgAgencyRules.length} Agency Rules...`);
    for (const row of pgAgencyRules) {
      await prisma.agencyRule.create({
        data: {
          id: row.id,
          agencyId: row.agencyId,
          requireFaceVerification: row.requireFaceVerification,
          requireWithinArea: row.requireWithinArea,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    console.log(`Migrating ${pgAgencyAccesses.length} Agency Access levels...`);
    for (const row of pgAgencyAccesses) {
      await prisma.agencyAccess.create({
        data: {
          id: row.id,
          agencyId: row.agencyId,
          userId: row.userId,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    console.log(`Migrating ${pgAgencyHolidays.length} Agency Holidays...`);
    for (const row of pgAgencyHolidays) {
      await prisma.agencyHoliday.create({
        data: {
          id: row.id,
          agencyId: row.agencyId,
          date: row.date,
          description: row.description,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 13. Migrate Intern profiles
    console.log(`Migrating ${pgInterns.length} Interns...`);
    for (const row of pgInterns) {
      await prisma.intern.create({
        data: {
          id: row.id,
          userId: row.userId,
          agencyId: row.agencyId,
          institutionId: row.institutionId,
          startedAt: new Date(row.startedAt),
          finishedAt: row.finishedAt ? new Date(row.finishedAt) : null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    // 14. Migrate Shift Assignments, Schedules, and Location Logs
    console.log(`Migrating ${pgShiftAssignments.length} Shift Assignments...`);
    for (const row of pgShiftAssignments) {
      await prisma.shiftAssignment.create({
        data: {
          id: row.id,
          internId: row.internId,
          shiftId: row.shiftId,
          startDate: row.startDate,
          endDate: row.endDate,
        }
      });
    }

    console.log(`Migrating ${pgSchedules.length} Schedules...`);
    for (const row of pgSchedules) {
      await prisma.schedule.create({
        data: {
          id: row.id,
          shiftId: row.shiftId,
          name: row.name,
          dayOfWeek: row.dayOfWeek,
          windowStart: row.windowStart,
          scheduleStart: row.scheduleStart,
          lateCutoff: row.lateCutoff,
          scheduleEnd: row.scheduleEnd,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        }
      });
    }

    console.log(`Migrating ${pgLocationLogs.length} Location Logs...`);
    for (const row of pgLocationLogs) {
      await prisma.locationLog.create({
        data: {
          id: row.id,
          internId: row.internId,
          latitude: row.latitude,
          longitude: row.longitude,
          ipAddress: row.ipAddress,
          createdAt: new Date(row.createdAt),
        }
      });
    }

    // 15. Migrate Attendances
    console.log(`Migrating ${pgAttendances.length} Attendances...`);
    for (const row of pgAttendances) {
      await prisma.attendance.create({
        data: {
          id: row.id,
          internId: row.internId,
          scheduleId: row.scheduleId,
          date: row.date,
          attendanceTime: row.attendanceTime ? new Date(row.attendanceTime) : null,
          attendanceLatitude: row.attendanceLatitude,
          attendanceLongitude: row.attendanceLongitude,
          attendancePhotoUrl: row.attendancePhotoUrl,
          attendanceFaceDescriptor: row.attendanceFaceDescriptor,
          status: row.status,
          notes: row.notes,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }
      });
    }

    console.log("Data migration completed successfully!");

  } catch (error) {
    console.error("Migration failed with error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pgPool.end();
  }
}

/**
 * Helper to fetch all records from a PostgreSQL table.
 *
 * @param {pg.Pool} pool The pg pool instance.
 * @param {string} tableName The DB table name to fetch.
 * @returns {Promise<any[]>} Resolves to the rows array.
 */
async function fetchAll(pool: pg.Pool, tableName: string): Promise<any[]> {
  const query = `SELECT * FROM "${tableName}"`;
  const result = await pool.query(query);
  return result.rows;
}

main().catch(err => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
