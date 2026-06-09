"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TimePickerProps } from "@/interfaces/custom";

export function TimePicker({
  value,
  onChange,
  disabled,
  className,
}: TimePickerProps) {
  // Parse hour and minute from value
  const [hour, minute] = React.useMemo(() => {
    if (!value || typeof value !== "string" || !value.includes(":")) {
      return ["08", "00"];
    }
    const parts = value.split(":");
    return [parts[0] || "08", parts[1] || "00"];
  }, [value]);

  const [isOpen, setIsOpen] = React.useState(false);

  // Local state to manage active text editing
  const [localHour, setLocalHour] = React.useState(hour);
  const [localMinute, setLocalMinute] = React.useState(minute);

  // Refs for inputs and containers
  const hourInputRef = React.useRef<HTMLInputElement>(null);
  const minuteInputRef = React.useRef<HTMLInputElement>(null);
  const hourContainerRef = React.useRef<HTMLDivElement>(null);
  const minuteContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync local state when prop changes, BUT only if the corresponding input is not focused
  React.useEffect(() => {
    if (document.activeElement !== hourInputRef.current) {
      setLocalHour(hour);
    }
  }, [hour]);

  React.useEffect(() => {
    if (document.activeElement !== minuteInputRef.current) {
      setLocalMinute(minute);
    }
  }, [minute]);

  // Sync helpers
  const setHour = (newHour: string) => {
    const padded = newHour.padStart(2, "0");
    onChange(`${padded}:${minute}`);
  };

  const setMinute = (newMinute: string) => {
    const padded = newMinute.padStart(2, "0");
    onChange(`${hour}:${padded}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  // Keyboard navigation for Hour input (Up/Down visually align with vertical list)
  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      // ArrowUp moves UP the list, i.e., decreases value
      const val = (parseInt(localHour || hour, 10) - 1 + 24) % 24;
      const strVal = String(val).padStart(2, "0");
      setLocalHour(strVal);
      setHour(strVal);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // ArrowDown moves DOWN the list, i.e., increases value
      const val = (parseInt(localHour || hour, 10) + 1) % 24;
      const strVal = String(val).padStart(2, "0");
      setLocalHour(strVal);
      setHour(strVal);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  };

  // Keyboard navigation for Minute input
  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      // ArrowUp moves UP the list, i.e., decreases value
      const val = (parseInt(localMinute || minute, 10) - 1 + 60) % 60;
      const strVal = String(val).padStart(2, "0");
      setLocalMinute(strVal);
      setMinute(strVal);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // ArrowDown moves DOWN the list, i.e., increases value
      const val = (parseInt(localMinute || minute, 10) + 1) % 60;
      const strVal = String(val).padStart(2, "0");
      setLocalMinute(strVal);
      setMinute(strVal);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
    } else if (e.key === "Backspace" && !localMinute) {
      e.preventDefault();
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
    }
  };

  // Handle typing numbers in Hour input
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setLocalHour(val);

    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 23) {
      setHour(val);
      // Auto focus minutes when two digits are typed or value is >= 3
      if (val.length === 2 || num >= 3) {
        setTimeout(() => {
          minuteInputRef.current?.focus();
          minuteInputRef.current?.select();
        }, 50);
      }
    }
  };

  const handleHourBlur = () => {
    const val = localHour
      ? String(Math.min(23, parseInt(localHour, 10))).padStart(2, "0")
      : "00";
    setLocalHour(val);
    setHour(val);
  };

  // Handle typing numbers in Minute input
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setLocalMinute(val);

    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setMinute(val);
    }
  };

  const handleMinuteBlur = () => {
    const val = localMinute
      ? String(Math.min(59, parseInt(localMinute, 10))).padStart(2, "0")
      : "00";
    setLocalMinute(val);
    setMinute(val);
  };

  // Scroll active elements into view when popover opens or selection changes
  const scrollSelectedIntoView = React.useCallback(() => {
    const activeHourEl = hourContainerRef.current?.querySelector(
      "[data-active='true']",
    );
    if (activeHourEl) {
      activeHourEl.scrollIntoView({ block: "center", behavior: "auto" });
    }
    const activeMinuteEl = minuteContainerRef.current?.querySelector(
      "[data-active='true']",
    );
    if (activeMinuteEl) {
      activeMinuteEl.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(scrollSelectedIntoView, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollSelectedIntoView, hour, minute]);

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {/* Custom Trigger container styled to look like an Input field */}
          <div
            className={cn(
              "flex items-center justify-between w-full h-9 bg-background border border-input rounded-xl px-3 py-1.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-ring cursor-text",
              disabled && "opacity-50 pointer-events-none",
            )}
            onClick={() => {
              if (!isOpen) setIsOpen(true);
              hourInputRef.current?.focus();
            }}
          >
            <div className="flex items-center gap-1 font-medium text-sm text-foreground">
              {/* Hour Input field */}
              <input
                ref={hourInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localHour}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                onKeyDown={handleHourKeyDown}
                disabled={disabled}
                maxLength={2}
                className="w-5 text-center bg-transparent border-none outline-none p-0 focus:ring-0 focus:outline-none focus:bg-muted/50 rounded text-sm font-medium"
              />
              <span className="text-muted-foreground select-none">:</span>
              {/* Minute Input field */}
              <input
                ref={minuteInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localMinute}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onKeyDown={handleMinuteKeyDown}
                disabled={disabled}
                maxLength={2}
                className="w-5 text-center bg-transparent border-none outline-none p-0 focus:ring-0 focus:outline-none focus:bg-muted/50 rounded text-sm font-medium"
              />
            </div>
            <Clock
              className="h-4 w-4 text-muted-foreground shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-0 border border-border bg-popover text-popover-foreground shadow-md rounded-xl"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex h-64 divide-x divide-border">
            {/* Hours Column */}
            <div
              ref={hourContainerRef}
              className="flex-1 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
              style={{ scrollbarWidth: "none" }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="px-1 text-center text-[10px] font-bold text-muted-foreground/60 sticky top-0 bg-popover py-1 border-b border-border/50 uppercase tracking-wider select-none">
                Jam
              </div>
              <div className="space-y-0.5 px-1 pt-1">
                {hours.map((h) => {
                  const isActive = h === hour;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={isActive}
                      onClick={() => {
                        setHour(h);
                        setLocalHour(h);
                        hourInputRef.current?.focus();
                      }}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded-md transition-colors hover:bg-muted font-medium text-center block cursor-pointer",
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold",
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div
              ref={minuteContainerRef}
              className="flex-1 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
              style={{ scrollbarWidth: "none" }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="px-1 text-center text-[10px] font-bold text-muted-foreground/60 sticky top-0 bg-popover py-1 border-b border-border/50 uppercase tracking-wider select-none">
                Menit
              </div>
              <div className="space-y-0.5 px-1 pt-1">
                {minutes.map((m) => {
                  const isActive = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={isActive}
                      onClick={() => {
                        setMinute(m);
                        setLocalMinute(m);
                        minuteInputRef.current?.focus();
                      }}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded-md transition-colors hover:bg-muted font-medium text-center block cursor-pointer",
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
