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

export interface AgencyHoliday {
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

export interface ShiftAssignment {
  id: string;
  internId: string;
  shiftId: string;
  startDate: string;
  endDate: string | null;
  intern?: Intern;
  shift?: Shift;
}

export interface Attendance {
  id: string;
  internId: string;
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
  intern?: Intern;
}

export interface AgencyArea {
  id: string;
  agencyId: string;
  geoData: GeoJsonObject;
  timezone: string;
}

export interface LocationLog {
  id: string;
  internId: string;
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

/** Agency model — represents an organizational unit / office */
export interface Agency {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Institution model — represents a school / university */
export interface Institution {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Intern model — links a user to an agency with optional institution */
export interface Intern {
  id: string;
  userId: string;
  agencyId: string;
  institutionId: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  agency?: Agency;
  institution?: Institution | null;
}

/** AgencyRule model — per-agency attendance rules */
export interface AgencyRule {
  id: string;
  agencyId: string;
  requireFaceVerification: boolean;
  requireWithinArea: boolean;
  createdAt: string;
  updatedAt: string;
  agency?: Agency;
}

/** AgencyAccess model — granular access control for managing agencies */
export interface AgencyAccess {
  id: string;
  agencyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  agency?: Agency;
  user?: User;
}

/** @deprecated Use AgencyHoliday instead */
export type Holiday = AgencyHoliday;

/** @deprecated Use AgencyAccess instead */
export type AdminAccess = AgencyAccess;

/** InternInfo — summarized intern data for dashboard display */
export interface InternInfo {
  internId: string;
  agencyName: string;
  institutionName: string | null;
  startedAt: string;
  finishedAt: string | null;
}
