import type { GeoJsonObject } from "geojson";
import type { AttendanceStatusType } from "./enums";

export interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface Shift {
  id: string;
  name: string;
  workOnHolidays?: boolean;
}

export interface Schedule {
  id: string;
  shiftId: string;
  name: string;
  dayOfWeek: number;
  windowStart: string;
  scheduleStart: string;
  lateCutoff: string;
  scheduleEnd: string;
  shift?: Shift;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface AdminAccess {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  shiftId: string;
  startDate: string;
  endDate: string | null;
  user?: User;
  shift?: Shift;
}

export interface Attendance {
  id: string;
  userId: string;
  scheduleId: string;
  date: string;
  attendanceTime: string | null;
  attendanceLatitude?: number | null;
  attendanceLongitude?: number | null;
  attendancePhotoUrl?: string | null;
  attendanceFaceDescriptor?: number[] | null;
  status: AttendanceStatusType;
  notes: string | null;
  schedule?: Schedule;
  user?: User;
}

export interface AttendanceArea {
  id: string;
  geoData: GeoJsonObject;
  timezone: string;
}

export interface LocationLog {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  ipAddress: string | null;
  createdAt: string;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  accounts: {
    id: string;
    providerId: string;
    accountId: string;
  }[];
  faceDescriptors: {
    id: string;
    createdAt: string;
    updatedAt: string;
  }[];
}
