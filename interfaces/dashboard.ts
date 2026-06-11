import type { Schedule, Attendance, AgencyRule } from "./models";
import { AttendanceStatus, type AttendanceStatusType } from "./enums";

/** Props for the AttendanceHistoriesCard component. */
export interface AttendanceHistoriesCardProps {
  userId: string;
  refreshTrigger: number;
  agencyRule: AgencyRule | null;
}

/** Props for the TakeAttendanceFaceCamera component. */
export interface TakeAttendanceFaceCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userHasFaceRegistered: boolean;
  onSuccess: (photoUrl: string, faceDescriptor: number[]) => void;
}

/** Props for the TakeAttendanceButtonGroup component. */
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

/** Props for the AttendanceNotesDialog component. */
export interface AttendanceNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: AttendanceStatusType | null;
  onSubmit: (notes: string) => void;
  isSubmitting: boolean;
}

/** Props for the UserAttendanceDetailDialog component. */
export interface UserAttendanceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  schedule: Schedule | null;
  attendance: Attendance | null;
}
