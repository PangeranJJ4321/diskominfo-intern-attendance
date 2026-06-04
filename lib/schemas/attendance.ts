import { z } from "zod";
import { AttendanceStatus } from "@/lib/generated/prisma/enums";

export const attendanceSchema = z.object({
  id: z.cuid2(),
  internId: z.cuid2(),
  agencyScheduleId: z.cuid2(),
  date: z.coerce.date(),
  attendanceTime: z.coerce.date().nullable(),
  attendanceLatitude: z.number().nullable(),
  attendanceLongitude: z.number().nullable(),
  attendanceFaceDescriptor: z.array(z.number().finite()).nullable(),
  status: z.enum([
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.EXCUSED,
  ]),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Attendance creation schema
 */
export const createAttendanceSchema = z.object({
  internId: z.cuid2().min(1, "Intern harus dipilih"),
  agencyScheduleId: z.cuid2().min(1, "Jadwal harus dipilih"),
  date: z.coerce.date("Tanggal tidak valid"),
  attendanceTime: z.coerce
    .date("Waktu absensi tidak valid")
    .nullable()
    .optional(),
  attendanceLatitude: z.number().nullable().optional(),
  attendanceLongitude: z.number().nullable().optional(),
  attendanceFaceDescriptor: z
    .array(z.number().finite())
    .min(1, "Deskriptor wajah tidak valid")
    .nullable()
    .optional(),
  status: z
    .enum([
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.LATE,
      AttendanceStatus.EXCUSED,
    ])
    .default(AttendanceStatus.ABSENT),
  notes: z.string().nullable().optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

/**
 * Attendance update schema
 */
export const updateAttendanceSchema = z.object({
  internId: z.cuid2().min(1, "Intern harus dipilih").optional(),
  agencyScheduleId: z.cuid2().min(1, "Jadwal harus dipilih").optional(),
  date: z.coerce.date("Tanggal tidak valid").optional(),
  attendanceTime: z.coerce
    .date("Waktu absensi tidak valid")
    .nullable()
    .optional(),
  attendanceLatitude: z.number().nullable().optional(),
  attendanceLongitude: z.number().nullable().optional(),
  attendanceFaceDescriptor: z
    .array(z.number().finite())
    .min(1, "Deskriptor wajah tidak valid")
    .nullable()
    .optional(),
  status: z
    .enum([
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.LATE,
      AttendanceStatus.EXCUSED,
    ])
    .optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

export const allowedAttendanceSortColumns = [
  "id",
  "internId",
  "agencyScheduleId",
  "date",
  "attendanceTime",
  "attendanceLatitude",
  "attendanceLongitude",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default attendance data object for optimistic UI updates.
 */
export const defaultAttendanceData: AttendanceData = {
  id: "",
  internId: "",
  agencyScheduleId: "",
  date: new Date(),
  attendanceTime: null,
  attendanceLatitude: null,
  attendanceLongitude: null,
  attendanceFaceDescriptor: null,
  status: AttendanceStatus.ABSENT,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type AttendanceData = z.infer<typeof attendanceSchema>;
