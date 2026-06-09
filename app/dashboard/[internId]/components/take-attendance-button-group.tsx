"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { ChevronDown, CheckCircle2, Calendar } from "lucide-react";
import { type TakeAttendanceButtonGroupProps } from "@/interfaces/dashboard";
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusButtonStyles,
} from "@/interfaces/enums";

/**
 * Button group component for checking in and choosing attendance status.
 *
 * @param props - Component properties.
 */
export default function TakeAttendanceButtonGroup({
  onClockIn,
  onStatusSelect,
  disabled,
  isAttendanceRecorded,
  recordedStatus,
  actionLabel,
  isSubmitting,
}: TakeAttendanceButtonGroupProps) {
  const getButtonStyles = () => {
    if (isAttendanceRecorded && recordedStatus) {
      return getAttendanceStatusButtonStyles(recordedStatus);
    }
    return "";
  };

  return (
    <ButtonGroup className="w-full shadow-sm rounded-xl overflow-hidden">
      <Button
        className={cn(
          "flex-1 text-xs font-semibold h-10 transition-all",
          getButtonStyles(),
        )}
        disabled={disabled}
        onClick={onClockIn}
        loading={isSubmitting}
        type="button"
        variant={isAttendanceRecorded ? "default" : "default"}
      >
        {isAttendanceRecorded ? (
          <>
            <CheckCircle2 className="mr-2 size-4 animate-in zoom-in" />
            {getAttendanceStatusLabel(recordedStatus ?? "")}
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            {actionLabel}
          </>
        )}
      </Button>
      {!isAttendanceRecorded && (
        <>
          <ButtonGroupSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Pilih status presensi lain"
                className="px-3 h-10 focus-visible:z-10"
                disabled={disabled || isSubmitting}
                type="button"
                variant="default"
              >
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-44 rounded-xl p-1.5 border border-border/50 bg-card"
            >
              <DropdownMenuItem
                className="cursor-pointer gap-2 py-2 px-3 rounded-lg text-xs font-medium"
                onSelect={(event) => {
                  event.preventDefault();
                  onStatusSelect(AttendanceStatus.EXCUSED);
                }}
              >
                <Calendar className="size-3.5 text-primary" />
                Izin / Cuti
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 py-2 px-3 rounded-lg text-xs font-medium"
                onSelect={(event) => {
                  event.preventDefault();
                  onStatusSelect(AttendanceStatus.SICK);
                }}
              >
                <Calendar className="size-3.5 text-rose-500" />
                Sakit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </ButtonGroup>
  );
}
