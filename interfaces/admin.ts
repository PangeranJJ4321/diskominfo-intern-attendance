import type { GeoJsonObject } from "geojson";
import type {
  Shift,
  Schedule,
  AgencyHoliday,
  Attendance,
  User,
  ShiftAssignment,
} from "./models";

export interface AttendanceAreaMapProps {
  mapCenter: [number, number];
  draftLayers: GeoJsonObject[];
  hasGeoData: boolean;
  onLayersChange: (layers: GeoJsonObject[]) => void;
}

export interface UserShiftEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internId: string;
  userName: string;
  onSuccess: () => void;
}

export interface UserAttendanceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internId: string;
  userName: string;
  date: Date | null;
  schedule: Schedule | null;
  existingAttendance: Attendance | null;
  onSuccess: () => void;
}

export interface UserAttendanceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internId: string;
  userName: string;
  date: Date | null;
  schedule: Schedule | null;
  onSuccess: () => void;
}

export interface ShiftsControlProps {
  shifts: Shift[];
  selectedShiftId: string;
  defaultShiftId?: string | null;
  onSelectShiftId: (id: string) => void;
  onAddShiftClick: () => void;
  onEditShiftClick: () => void;
  onDeleteShiftClick: () => void;
}

export interface ShiftEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  isDefaultShift: boolean;
  agencyId: string;
  onSuccess: (updatedShift: Shift, setAsDefault: boolean) => void;
}

export interface ShiftCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  onSuccess: (newShift: Shift, setAsDefault: boolean) => void;
}

export interface DayLabel {
  value: number;
  short: string;
  long: string;
  weekend: boolean;
}

export interface ScheduleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchedule: Schedule | null;
  onSuccessUpdate: (schedule: Schedule) => void;
  onSuccessDelete: (id: string) => void;
  dayName: string;
}

export interface ScheduleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: number;
  selectedShiftId: string;
  onSuccess: (newSchedule: Schedule) => void;
  dayName: string;
}

export interface HolidaysTabProps {
  dayLabels: DayLabel[];
}

export interface HolidayEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: AgencyHoliday | null;
  onSuccessUpdate: (holiday: AgencyHoliday) => void;
  onSuccessDelete: (id: string) => void;
}

export interface HolidayCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSuccessAdd: (holiday: AgencyHoliday) => void;
}

export interface AttendanceAreaState {
  id: string;
  geoData: GeoJsonObject | null;
  timezone: string;
}

export interface ExportAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  shifts: Shift[];
  assignments: ShiftAssignment[];
}
