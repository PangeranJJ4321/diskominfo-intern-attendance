// lib/casl.ts
import { Ability, AbilityBuilder } from "@casl/ability";
import { createPrismaAbility, PrismaQuery } from "@casl/prisma";

type Actions = "create" | "read" | "update" | "delete";
type Subjects =
  | "AttendanceArea"
  | "User"
  | "Access"
  | "Holiday"
  | "Schedule"
  | "Shift"
  | "ShiftAssignment"
  | "Attendance"
  | "LocationLog"
  | "FaceDescriptor";

// In CASL, the base Ability class combined with PrismaQuery handles types perfectly
export type AppAbility = Ability<[Actions, Subjects], PrismaQuery>;

interface AuthUser {
  id: string;
  accesses: { userId: string }[];
}

export function defineAbilityFor(user: AuthUser) {
  // Use createPrismaAbility as the underlying builder rule engine
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  // ABAC Rule: If the user context contains active permissions records,
  // allow them to execute CRUD tasks on targets.
  if (user.accesses && user.accesses.length > 0) {
    can("create", "AttendanceArea");
    can("read", "AttendanceArea");
    can("update", "AttendanceArea");
    can("delete", "AttendanceArea");

    can("create", "User");
    can("read", "User");
    can("update", "User");
    can("delete", "User");

    can("create", "Access");
    can("read", "Access");
    can("update", "Access");
    can("delete", "Access");

    can("create", "Holiday");
    can("read", "Holiday");
    can("update", "Holiday");
    can("delete", "Holiday");

    can("create", "Schedule");
    can("read", "Schedule");
    can("update", "Schedule");
    can("delete", "Schedule");

    can("create", "Shift");
    can("read", "Shift");
    can("update", "Shift");
    can("delete", "Shift");

    can("create", "ShiftAssignment");
    can("read", "ShiftAssignment");
    can("update", "ShiftAssignment");
    can("delete", "ShiftAssignment");

    can("create", "Attendance");
    can("read", "Attendance");
    can("update", "Attendance");
    can("delete", "Attendance");

    can("create", "LocationLog");
    can("read", "LocationLog");
    can("delete", "LocationLog");

    can("create", "FaceDescriptor");
    can("read", "FaceDescriptor");
    can("update", "FaceDescriptor");
    can("delete", "FaceDescriptor");
  } else {
    // Ordinary users can read, update, and delete their own User resource
    can("read", "User", { id: user.id });
    can("update", "User", { id: user.id });
    can("delete", "User", { id: user.id });

    // Ordinary users can read holidays, schedules, and shifts
    can("read", "Holiday");
    can("read", "Schedule");
    can("read", "Shift");

    // Ordinary users can create and read their own attendance
    can("create", "Attendance", { userId: user.id });
    can("read", "Attendance", { userId: user.id });

    // Ordinary users can create their own location logs
    can("create", "LocationLog", { userId: user.id });
    can("read", "LocationLog", { userId: user.id });

    // Ordinary users can read their own shift assignments
    can("read", "ShiftAssignment", { userId: user.id });

    // Ordinary users can read attendance areas (needed for geofence check)
    can("read", "AttendanceArea");

    // Ordinary users can create and read their own face descriptors, but NOT delete
    can("create", "FaceDescriptor", { userId: user.id });
    can("read", "FaceDescriptor", { userId: user.id });
  }

  return build();
}
