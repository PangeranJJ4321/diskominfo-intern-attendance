import { type NextRequest, NextResponse } from "next/server";
import type { GeoJsonObject } from "geojson";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isLocationWithinArea } from "@/lib/location-within-area";
import { prisma } from "@/lib/prisma";
import {
  allowedAttendanceSortColumns,
  createAttendanceSchema,
} from "@/lib/schemas/attendance";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

const FACE_DESCRIPTOR_MATCH_THRESHOLD = 0.6;

async function getAccessibleAgencyIds(userId: string): Promise<string[]> {
  const accesses = await prisma.agencyAccess.findMany({
    where: { userId },
    select: { agencyId: true },
  });

  return accesses.map((access) => access.agencyId);
}

async function getAccessibleInternIds(userId: string): Promise<string[]> {
  const interns = await prisma.intern.findMany({
    where: { userId },
    select: { id: true },
  });

  return interns.map((intern) => intern.id);
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function getMinutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return hour * 60 + minute;
}

function shouldAutoMarkLate(options: {
  attendanceTime: Date;
  scheduleEnd: string;
  lateToleranceMinutes: number;
  timeZone: string;
}): boolean {
  const attendanceMinutes = getMinutesInTimeZone(
    options.attendanceTime,
    options.timeZone,
  );
  const scheduleEndMinutes = parseTimeToMinutes(options.scheduleEnd);
  const lateWindowEndMinutes =
    scheduleEndMinutes + options.lateToleranceMinutes;

  return (
    attendanceMinutes > scheduleEndMinutes &&
    attendanceMinutes <= lateWindowEndMinutes
  );
}

async function getAgencyAreaData(agencyId: string): Promise<{
  geoData: GeoJsonObject | null;
  timezone: string;
}> {
  const area = await prisma.agencyArea.findFirst({
    where: { agencyId },
    select: { geoData: true, timezone: true },
  });

  return {
    geoData: (area?.geoData as GeoJsonObject | null) ?? null,
    timezone: area?.timezone ?? "Asia/Makassar",
  };
}

function calculateDescriptorDistance(
  candidateDescriptor: number[],
  referenceDescriptor: number[],
): number | null {
  if (
    candidateDescriptor.length === 0 ||
    candidateDescriptor.length !== referenceDescriptor.length
  ) {
    return null;
  }

  let squaredDistance = 0;

  for (let index = 0; index < candidateDescriptor.length; index += 1) {
    const difference = candidateDescriptor[index] - referenceDescriptor[index];
    squaredDistance += difference * difference;
  }

  return Math.sqrt(squaredDistance);
}

function toNumberDescriptor(descriptor: Prisma.JsonValue): number[] | null {
  if (!Array.isArray(descriptor)) {
    return null;
  }

  if (
    descriptor.some(
      (value) => typeof value !== "number" || !Number.isFinite(value),
    )
  ) {
    return null;
  }

  return descriptor as number[];
}

function isFaceDescriptorMatch(
  candidateDescriptor: number[],
  referenceDescriptors: number[][],
): boolean {
  return referenceDescriptors.some((referenceDescriptor) => {
    const distance = calculateDescriptorDistance(
      candidateDescriptor,
      referenceDescriptor,
    );

    return distance !== null && distance <= FACE_DESCRIPTOR_MATCH_THRESHOLD;
  });
}

/**
 * GET /api/attendances
 * Retrieves a paginated list of attendance records.
 * Requires an authenticated session.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(
      allowedAttendanceSortColumns,
      "createdAt",
    ).safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, q } = parsedQuery.data;

    // --- NEW: Extract specific query parameters ---
    const queryInternId = searchParams.get("internId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let allowedInternIds: string[] | null = null;

    if (session.user.role === "SUPERADMIN") {
      allowedInternIds = null; // Superadmin accesses all
    } else if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (agencyIds.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { totalRowCount: 0, totalPages: 0 },
        });
      }

      allowedInternIds = (
        await prisma.intern.findMany({
          where: { agencyId: { in: agencyIds } },
          select: { id: true },
        })
      ).map((intern) => intern.id);
    } else if (session.user.role === "INTERN") {
      allowedInternIds = await getAccessibleInternIds(session.user.id);

      if (allowedInternIds.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { totalRowCount: 0, totalPages: 0 },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const where: Prisma.AttendanceWhereInput = {};

    // --- NEW: Securely apply the internId filter ---
    if (queryInternId) {
      // If not SUPERADMIN, ensure the requested queryInternId is within their allowed list
      if (
        allowedInternIds !== null &&
        !allowedInternIds.includes(queryInternId)
      ) {
        return NextResponse.json(
          { error: "Forbidden - tidak ada akses ke data absensi peserta ini" },
          { status: 403 },
        );
      }
      where.internId = queryInternId;
    } else if (allowedInternIds !== null) {
      // Fallback: If no query parameter provided, get all allowed attendances
      where.internId = { in: allowedInternIds };
    }

    // --- NEW: Apply Date Range Filters for the calendar ---
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (q) {
      const queryFilter: Prisma.AttendanceWhereInput = {
        OR: [
          { notes: { contains: q, mode: "insensitive" } },
          {
            intern: {
              user: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
          {
            agencySchedule: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                {
                  agency: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
              ],
            },
          },
        ],
      };

      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];

      where.AND = [queryFilter, ...existingAnd];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          internId: true,
          agencyScheduleId: true,
          date: true,
          attendanceTime: true,
          attendanceLatitude: true,
          attendanceLongitude: true,
          attendanceFaceDescriptor: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      data: attendances,
      meta: {
        totalRowCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/attendances]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data absensi" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/attendances
 * Creates a new attendance record.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const isSuperadmin = session.user.role === "SUPERADMIN";
    const isAdmin = session.user.role === "ADMIN";
    const isIntern = session.user.role === "INTERN";

    if (!isSuperadmin && !isAdmin && !isIntern) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = createAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { internId, agencyScheduleId, date, ...rest } = parsed.data;

    const [intern, agencySchedule, existing] = await Promise.all([
      prisma.intern.findUnique({
        where: { id: internId },
        select: {
          id: true,
          userId: true,
          agencyId: true,
        },
      }),
      prisma.agencySchedule.findUnique({
        where: { id: agencyScheduleId },
        select: {
          id: true,
          agencyId: true,
          dayOfWeek: true,
          agencyScheduleStart: true,
          agencyScheduleEnd: true,
        },
      }),
      prisma.attendance.findFirst({
        where: {
          internId,
          agencyScheduleId,
          date,
        },
        select: { id: true },
      }),
    ]);

    if (!intern) {
      return NextResponse.json(
        { error: "Peserta magang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (isIntern && intern.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Tidak dapat membuat absensi untuk peserta magang lain" },
        { status: 403 },
      );
    }

    if (!agencySchedule) {
      return NextResponse.json(
        { error: "Jadwal dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    const agencyAccess =
      isSuperadmin || isIntern
        ? null
        : await prisma.agencyAccess.findFirst({
            where: {
              agencyId: intern.agencyId,
              userId: session.user.id,
            },
            select: { id: true },
          });

    if (!isSuperadmin && !isIntern && !agencyAccess) {
      return NextResponse.json(
        {
          error:
            "Forbidden - hanya admin dinas peserta magang yang dapat membuat absensi",
        },
        { status: 403 },
      );
    }

    if (!isSuperadmin && intern.agencyId !== agencySchedule.agencyId) {
      return NextResponse.json(
        { error: "Jadwal tidak sesuai dengan dinas peserta magang" },
        { status: 409 },
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          error: "Catatan absensi untuk jadwal dan tanggal tersebut sudah ada",
        },
        { status: 409 },
      );
    }

    const [agencyRule, agencyArea] = await Promise.all([
      prisma.agencyRule.findUnique({
        where: { agencyId: intern.agencyId },
        select: {
          id: true,
          agencyId: true,
          requireFaceVerification: true,
          requireWithinArea: true,
          lateToleranceMinutes: true,
        },
      }),
      getAgencyAreaData(intern.agencyId),
    ]);

    if (isIntern) {
      const [holiday, faceDescriptors] = await Promise.all([
        prisma.agencyHoliday.findFirst({
          where: {
            agencyId: intern.agencyId,
            date,
          },
          select: {
            id: true,
          },
        }),
        prisma.faceDescriptor.findMany({
          where: { userId: intern.userId },
          select: {
            descriptor: true,
          },
        }),
      ]);
      const storedFaceDescriptors = faceDescriptors
        .map((faceDescriptor) => toNumberDescriptor(faceDescriptor.descriptor))
        .filter((descriptor): descriptor is number[] => descriptor !== null);

      if (!agencyRule) {
        return NextResponse.json(
          { error: "Aturan dinas tidak ditemukan" },
          { status: 404 },
        );
      }

      if (agencySchedule.dayOfWeek !== date.getUTCDay()) {
        return NextResponse.json(
          { error: "Tanggal absensi tidak sesuai dengan jadwal dinas" },
          { status: 409 },
        );
      }

      if (holiday) {
        return NextResponse.json(
          { error: "Tanggal absensi jatuh pada hari libur dinas" },
          { status: 409 },
        );
      }

      // Face verification and area checks only apply to PRESENT and LATE statuses
      const isExcused = parsed.data.status === "EXCUSED";

      if (!isExcused) {
        if (agencyRule.requireFaceVerification) {
          if (!rest.attendanceFaceDescriptor) {
            return NextResponse.json(
              { error: "Deskriptor wajah wajib disertakan untuk absensi ini" },
              { status: 409 },
            );
          }

          if (storedFaceDescriptors.length === 0) {
            return NextResponse.json(
              { error: "Deskriptor wajah pengguna belum terdaftar" },
              { status: 409 },
            );
          }

          const descriptorMatches = isFaceDescriptorMatch(
            rest.attendanceFaceDescriptor,
            storedFaceDescriptors,
          );

          if (!descriptorMatches) {
            return NextResponse.json(
              { error: "Deskriptor wajah tidak cocok dengan data pengguna" },
              { status: 409 },
            );
          }
        }

        if (agencyRule.requireWithinArea) {
          if (
            rest.attendanceLatitude === undefined ||
            rest.attendanceLatitude === null ||
            rest.attendanceLongitude === undefined ||
            rest.attendanceLongitude === null
          ) {
            return NextResponse.json(
              {
                error: "Koordinat lokasi wajib disertakan untuk absensi ini",
              },
              { status: 409 },
            );
          }

          const agencyAreaGeoData = agencyArea.geoData;

          if (!agencyAreaGeoData) {
            return NextResponse.json(
              { error: "Area dinas tidak ditemukan" },
              { status: 404 },
            );
          }

          const attendanceWithinArea = isLocationWithinArea(
            rest.attendanceLatitude,
            rest.attendanceLongitude,
            agencyAreaGeoData,
          );

          if (attendanceWithinArea !== true) {
            return NextResponse.json(
              { error: "Absensi wajib dilakukan di dalam area dinas" },
              { status: 409 },
            );
          }
        }
      }
    }

    const resolvedStatus =
      parsed.data.status === "PRESENT" &&
      parsed.data.attendanceTime &&
      agencyRule &&
      shouldAutoMarkLate({
        attendanceTime: parsed.data.attendanceTime,
        scheduleEnd: agencySchedule.agencyScheduleEnd,
        lateToleranceMinutes: agencyRule.lateToleranceMinutes,
        timeZone: agencyArea.timezone,
      })
        ? "LATE"
        : parsed.data.status;

    const attendance = await prisma.attendance.create({
      data: {
        internId,
        agencyScheduleId,
        date,
        attendanceTime: rest.attendanceTime,
        attendanceLatitude: rest.attendanceLatitude ?? undefined,
        attendanceLongitude: rest.attendanceLongitude ?? undefined,
        attendanceFaceDescriptor: rest.attendanceFaceDescriptor ?? undefined,
        status: resolvedStatus,
        notes: rest.notes ?? undefined,
      },
      select: {
        id: true,
        internId: true,
        agencyScheduleId: true,
        date: true,
        attendanceTime: true,
        attendanceLatitude: true,
        attendanceLongitude: true,
        attendanceFaceDescriptor: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        intern: {
          select: {
            id: true,
            userId: true,
            agencyId: true,
            startedAt: true,
            finishedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        agencySchedule: {
          select: {
            id: true,
            agencyId: true,
            name: true,
            dayOfWeek: true,
            agencyScheduleStart: true,
            agencyScheduleEnd: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/attendances]", error);
    return NextResponse.json(
      { error: "Gagal membuat data absensi" },
      { status: 500 },
    );
  }
}
