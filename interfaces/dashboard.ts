import type { GeoJsonObject } from "geojson";
import type { Schedule, Attendance } from "./models";
import { AttendanceStatus, type AttendanceStatusType } from "./enums";

export interface TakeAttendanceListProps {
  /** The intern ID to fetch shifts/attendances for */
  internId: string;
}

export interface TakeAttendanceFaceCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userHasFaceRegistered: boolean;
  onSuccess: (photoUrl: string, faceDescriptor: number[]) => void;
}

export interface TakeAttendanceCardProps {
  schedule: Schedule;
  internId: string;
  workDate?: string;
  className?: string;
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
}

export interface LiveLocationMapCardProps {
  geoData: GeoJsonObject | null;
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
}

export interface UserAttendanceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  schedule: Schedule | null;
  attendance: Attendance | null;
}
