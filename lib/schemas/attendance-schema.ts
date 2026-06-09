// lib/schemas/attendance-schema.ts
import { z } from "zod";
import { ATTENDANCE_STATUS_VALUES, AttendanceStatus } from "@/interfaces/enums";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAttendanceSchema = z.object({
  userId: z.string().min(1, "User ID tidak valid."),
  scheduleId: z.cuid2("Schedule ID tidak valid."),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD."),
  attendanceTime: z.coerce.date().optional().nullable(),
  attendanceLatitude: z.number().optional().nullable(),
  attendanceLongitude: z.number().optional().nullable(),
  attendancePhotoUrl: z.url().optional().nullable(),
  attendanceFaceDescriptor: z.any().optional().nullable(),
  status: z
    .enum(ATTENDANCE_STATUS_VALUES as [string, ...string[]])
    .default(AttendanceStatus.ABSENT),
  notes: z.string().optional().nullable(),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();
