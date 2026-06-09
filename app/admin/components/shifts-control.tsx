"use client";

import { Plus, Settings, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShiftsControlProps } from "@/interfaces/admin";

export default function ShiftsControl({
  shifts,
  selectedShiftId,
  onSelectShiftId,
  onAddShiftClick,
  onEditShiftClick,
  onDeleteShiftClick,
}: ShiftsControlProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <h3 className="text-md font-semibold text-foreground/90 flex items-center gap-2">
          <CalendarDays className="size-5 text-primary/80" />
          Jadwal Presensi Mingguan
        </h3>
        <p className="text-xs text-muted-foreground">
          Pilih shift untuk mengatur jam masuk & pulang kerja.
        </p>
      </div>

      {/* Shift Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-60">
          <Select
            value={selectedShiftId}
            onValueChange={onSelectShiftId}
          >
            <SelectTrigger className="rounded-lg bg-background border-border text-sm w-full">
              <SelectValue placeholder="Pilih Shift Kerja" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-lg">
              {shifts.map((s) => (
                <SelectItem key={s.id} value={s.id} className="rounded-md cursor-pointer text-sm">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddShiftClick}
          className="rounded-lg border-border h-9 text-xs flex items-center gap-1 font-semibold"
        >
          <Plus className="size-3.5" /> Shift
        </Button>

        {selectedShiftId && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onEditShiftClick}
              className="rounded-lg border-border size-9"
              title="Edit Nama Shift"
            >
              <Settings className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onDeleteShiftClick}
              className="rounded-lg border-border size-9 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
              title="Hapus Shift"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
