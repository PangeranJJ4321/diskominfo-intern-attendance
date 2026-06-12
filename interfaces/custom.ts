import type { Schedule, Attendance } from "./models";

export interface CameraProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** Menentukan apakah kamera harus aktif atau mati */
  open: boolean;
  /** Callback opsional saat video stream berhasil berjalan */
  onStreamActive?: () => void;
  /** Callback opsional jika akses kamera gagal (setelah user menolak / error fatal) */
  onStreamError?: (error: Error) => void;
  /** Kamera depan ("user") atau belakang ("environment") */
  facingMode?: "user" | "environment";
}

export interface FaceModelLoadingOverlayProps {
  /** Whether the overlay should be shown (typically tied to camera dialog being open). */
  visible: boolean;
  /** Called when models finish loading and the overlay can be dismissed. */
  onReady: () => void;
  /** Called when model loading fails. */
  onError: (error: Error) => void;
}

export interface UserAttendancesProps {
  userId: string;
  currentMonth: Date;
  onDayClick?: (
    date: Date,
    schedule: Schedule,
    attendance: Attendance | null,
  ) => void;
  refreshTrigger?: number;
}

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  hideTextOnMobile?: boolean;
}

export interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted: (position: GeolocationPosition) => void;
  onDenied?: (error: string) => void;
}

export interface CameraPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted: (stream: MediaStream) => void;
  onDenied?: (error: string) => void;
}
