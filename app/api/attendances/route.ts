// app/api/attendances/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDatedQuerySchema } from "@/lib/schemas/query-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
import { createAttendanceSchema } from "@/lib/schemas/attendance-schema";
import type { GeoJsonObject } from "geojson";

import { isLocationWithinArea } from "@/lib/location-within-area";
import { verifyLocationVelocity } from "@/lib/location-verifier";
import { verifyAttendanceTime } from "@/lib/attendance-time-verifier";
import {
  AttendanceStatus,
  type AttendanceStatusType,
} from "@/interfaces/enums";

const querySchema = createDatedQuerySchema(
  ["id", "date", "status", "attendanceTime", "createdAt"],
  "date",
);

const attendanceSelect = {
  id: true,
  internId: true,
  scheduleId: true,
  date: true,
  attendanceTime: true,
  attendanceLatitude: true,
  attendanceLongitude: true,
  attendancePhotoUrl: true,
  status: true,
  notes: true,
  createdAt: true,
  intern: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  schedule: true,
} as const;

/**
 * GET: List all attendances with pagination, sorting, search, and optional date range filtering.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const GET = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {
    const session = { user: { id: dbUser.id } };

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsedParams = querySchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedParams.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, search, startDate, endDate } =
      parsedParams.data;
    const skip = (page - 1) * limit;

    // Admins see all attendances; ordinary users only see their own (via intern)
    const isAdmin = dbUser.agencyAccesses.length > 0;

    const whereCondition = {
      ...(!isAdmin ? { intern: { userId: session.user.id } } : {}),
      ...(search
        ? {
            OR: [
              { date: { contains: search } },
              {
                intern: {
                  user: {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [attendances, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where: whereCondition,
        select: attendanceSelect,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.attendance.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: attendances,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "Attendance"
);

/**
 * POST: Create a new attendance record.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {
    const session = { user: { id: dbUser.id } };

    const body = await request.json();
    const parsedBody = createAttendanceSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { internId, scheduleId } = parsedBody.data;

    // Determine if user is admin
    const isAdmin = dbUser.agencyAccesses.length > 0;

    // Validate that the referenced intern exists and belongs to the current user
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
    });

    if (!intern) {
      return NextResponse.json(
        { error: "Data magang tidak ditemukan." },
        { status: 404 },
      );
    }

    // Non-admin users can only create attendance for their own intern record
    if (!isAdmin && intern.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only submit your own attendance." },
        { status: 403 },
      );
    }

    // Validate that the referenced schedule exists and is active (along with its parent shift)
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        deletedAt: null,
        shift: {
          deletedAt: null,
        },
      },
      include: {
        shift: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found." },
        { status: 404 },
      );
    }

    // Run strict validations for ordinary (non-admin) users
    if (!isAdmin) {
      const {
        status,
        attendanceLatitude,
        attendanceLongitude,
        attendanceFaceDescriptor,
      } = parsedBody.data;

      // Fetch agency rule and area for this intern's agency
      const [rule, agencyArea] = await Promise.all([
        prisma.agencyRule.findUnique({
          where: { agencyId: intern.agencyId },
        }),
        prisma.agencyArea.findUnique({
          where: { agencyId: intern.agencyId },
        }),
      ]);

      // 1. Fetch timezone and run timing verification
      const timezone = agencyArea?.timezone || "Asia/Makassar";
      const now = new Date();

      const timeCheck = verifyAttendanceTime(
        schedule,
        timezone,
        now,
        status as AttendanceStatusType,
      );

      if (!timeCheck.isValid) {
        return NextResponse.json(
          { error: timeCheck.error || "Waktu absen tidak valid." },
          { status: 400 },
        );
      }

      // Check if target working date is a public holiday
      const holiday = await prisma.agencyHoliday.findFirst({
        where: { 
          agencyId: intern.agencyId,
          date: timeCheck.currentLocalDateStr 
        },
      });

      if (holiday && !schedule.shift.workOnHolidays) {
        return NextResponse.json(
          {
            error: `Presensi tidak diizinkan karena bertepatan dengan hari libur: ${holiday.description}.`,
          },
          { status: 400 },
        );
      }

      // Ensure that user is only submitting attendance for today
      if (parsedBody.data.date !== timeCheck.currentLocalDateStr) {
        return NextResponse.json(
          {
            error: `Anda hanya dapat mengisi presensi untuk hari ini (${timeCheck.currentLocalDateStr}).`,
          },
          { status: 400 },
        );
      }

      // Timing, location, and face checks only apply to PRESENT and LATE status
      if (
        status === AttendanceStatus.PRESENT ||
        status === AttendanceStatus.LATE
      ) {
        // 2. Geofence Check — only if agency rule requires it
        if (rule?.requireWithinArea !== false) {
          if (
            attendanceLatitude === null ||
            attendanceLatitude === undefined ||
            attendanceLongitude === null ||
            attendanceLongitude === undefined
          ) {
            return NextResponse.json(
              { error: "Koordinat GPS diperlukan untuk presensi ini." },
              { status: 400 },
            );
          }

          if (agencyArea) {
            const isWithin = isLocationWithinArea(
              attendanceLatitude,
              attendanceLongitude,
              agencyArea.geoData as unknown as GeoJsonObject,
            );

            if (!isWithin) {
              return NextResponse.json(
                { error: "Presensi wajib dilakukan di dalam area kantor." },
                { status: 400 },
              );
            }
          }
        }

        // 3. Location velocity spoofing check (using haversine) — only if location data is available
        if (attendanceLatitude != null && attendanceLongitude != null) {
          const newestLog = await prisma.locationLog.findFirst({
            where: { internId },
            orderBy: { createdAt: "desc" },
          });

          if (newestLog) {
            const velocityCheck = verifyLocationVelocity(
              newestLog.latitude,
              newestLog.longitude,
              newestLog.createdAt,
              attendanceLatitude,
              attendanceLongitude,
              now,
            );

            if (!velocityCheck.isValid) {
              console.warn(
                `GPS spoofing indication for intern ${internId}. Speed: ${velocityCheck.speed.toFixed(2)} m/s, Distance: ${velocityCheck.distance.toFixed(2)} m`,
              );
              return NextResponse.json(
                {
                  error:
                    "Terdeteksi indikasi pemalsuan lokasi (GPS spoofing). Silakan hubungi admin atau coba lagi.",
                },
                { status: 400 },
              );
            }
          }
        }

        // 4. Face Recognition Check — only if agency rule requires it
        if (rule?.requireFaceVerification !== false) {
          const registeredFaces = await prisma.faceDescriptor.findMany({
            where: { userId: intern.userId },
          });

          if (registeredFaces.length > 0) {
            if (
              !attendanceFaceDescriptor ||
              !Array.isArray(attendanceFaceDescriptor)
            ) {
              return NextResponse.json(
                {
                  error:
                    "Verifikasi wajah diperlukan. Harap sertakan data verifikasi wajah Anda.",
                },
                { status: 400 },
              );
            }

            // Compare with registered face descriptors (Euclidean distance <= 0.6)
            const euclideanDistance = (
              arr1: number[],
              arr2: number[],
            ): number => {
              if (arr1.length !== arr2.length) return Infinity;
              let sum = 0;
              for (let i = 0; i < arr1.length; i++) {
                const diff = arr1[i] - arr2[i];
                sum += diff * diff;
              }
              return Math.sqrt(sum);
            };

            let minDistance = Infinity;
            for (const rf of registeredFaces) {
              const regDescriptor = rf.descriptor as number[];
              const dist = euclideanDistance(
                attendanceFaceDescriptor,
                regDescriptor,
              );
              if (dist < minDistance) {
                minDistance = dist;
              }
            }

            if (minDistance > 0.6) {
              return NextResponse.json(
                {
                  error:
                    "Verifikasi wajah gagal. Wajah tidak cocok dengan data terdaftar.",
                },
                { status: 400 },
              );
            }

            // Auto-improve face recognition if similarity is close to the limit (e.g. > 0.4 and <= 0.6)
            if (minDistance > 0.4 && minDistance <= 0.6) {
              console.log(
                `Face similarity distance (${minDistance.toFixed(3)}) is close to limit (0.6). Adding face descriptor to improve recognition.`,
              );
              try {
                await prisma.faceDescriptor.create({
                  data: {
                    userId: intern.userId,
                    descriptor: attendanceFaceDescriptor,
                  },
                });
              } catch (dbErr) {
                console.error(
                  "Gagal menambahkan face descriptor cadangan:",
                  dbErr,
                );
              }
            }

            console.log(
              "Face verified successfully on client-provided descriptor!",
            );
          }
        }
      }
    }

    try {
      const newAttendance = await prisma.attendance.create({
        data: {
          ...parsedBody.data,
          status: parsedBody.data.status as AttendanceStatusType,
        },
        select: attendanceSelect,
      });

      return NextResponse.json(newAttendance, { status: 201 });
    } catch (error: any) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Anda sudah mengisi presensi untuk jadwal ini pada hari ini." },
          { status: 409 },
        );
      }
      throw error;
    }
  },
  "create",
  "Attendance"
);
