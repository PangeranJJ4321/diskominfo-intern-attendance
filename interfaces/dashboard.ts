import type { GeoJsonObject } from "geojson";
import type { Schedule, Attendance, AgencyRule } from "./models";
import { AttendanceStatus, type AttendanceStatusType } from "./enums";

export interface TakeAttendanceListProps {
  userId: string;
  internId: string;
  userName: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  isWithinGeofence: boolean | null;
  onAttendanceSuccess: () => void;
  refreshTrigger: number;
  agencyRule: AgencyRule | null;
}

export interface TakeAttendanceFaceCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userHasFaceRegistered: boolean;
  onSuccess: (photoUrl: string, faceDescriptor: number[]) => void;
}

export interface TakeAttendanceCardProps {
  schedule: Schedule;
  attendances: Attendance[];
  internId: string;
  userName: string;
  userHasFaceRegistered: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  isWithinGeofence: boolean | null;
  onAttendanceSuccess: () => void;
  refreshTrigger: number;
  workDate?: string;
  className?: string;
  /** Agency rule to control whether face & geofence validations are enforced on the client side */
  agencyRule: AgencyRule | null;
}

export interface TakeAttendanceButtonGroupProps {
  onClockIn: () => void;
  onStatusSelect: (
    status: typeof AttendanceStatus.SICK | typeof AttendanceStatus.EXCUSED,
  ) => void;
  disabled: boolean;
  isAttendanceRecorded: boolean;
  recordedStatus: AttendanceStatusType | null;
  actionLabel: string;
  isSubmitting: boolean;
}

export interface LiveLocationMapProps {
  geoData: GeoJsonObject | null;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
}

export interface LiveLocationMapCardProps {
  geoData: GeoJsonObject | null;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
  isWithinGeofence: boolean | null;
  /** Agency rule to control whether geofence warnings are shown */
  agencyRule: AgencyRule | null;
}

export interface AttendanceNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: AttendanceStatusType | null;
  onSubmit: (notes: string) => void;
  isSubmitting: boolean;
}

export interface AttendanceHistoriesCardProps {
  internId: string;
  refreshTrigger: number;
}

export interface UserAttendanceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  schedule: Schedule | null;
  attendance: Attendance | null;
}
