"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

interface AttendanceContextValue {
  // simple counter per intern to signal updates
  updates: Record<string, number>;
  markUpdated: (internId: string) => void;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [updates, setUpdates] = useState<Record<string, number>>({});

  function markUpdated(internId: string) {
    setUpdates((prev) => ({ ...prev, [internId]: (prev[internId] ?? 0) + 1 }));
  }

  const value = useMemo(() => ({ updates, markUpdated }), [updates]);

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendanceContext() {
  const ctx = useContext(AttendanceContext);
  if (!ctx)
    throw new Error(
      "useAttendanceContext must be used within AttendanceProvider",
    );
  return ctx;
}
