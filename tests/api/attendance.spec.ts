import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Attendance API", () => {
  const runId = apiTestUtils.createRunId();
  const attendanceFaceDescriptor = Array.from(
    { length: 128 },
    (_, index) => (index + 1) / 1000,
  );
  const mismatchedAttendanceFaceDescriptor = attendanceFaceDescriptor.map(
    (value, index) => (index === 0 ? value + 1 : value),
  );
  const insideLatitude = -5.1479;
  const insideLongitude = 119.4345;
  const outsideLatitude = -5.2;
  const outsideLongitude = 119.5;

  let superadminCookie = "";
  let agencyId = "";
  let agencyRuleId = "";
  let institutionId = "";
  let internUserId = "";
  let internCookie = "";
  let internId = "";
  let faceDescriptorId = "";
  let scheduleId = "";
  let attendanceId = "";
  let internAttendanceId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Attendance Agency ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const institution = await apiTestUtils.apiRequest<Response>(
      "/api/institutes",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          name: `Attendance Institution ${runId}`,
        },
      },
    );
    expect(institution.status).toBe(201);
    institutionId = (await apiTestUtils.readJson<{ id: string }>(institution))
      .id;

    const internUser = await apiTestUtils.createCredentialUser({
      name: `attendance-intern-${runId}`,
      role: "INTERN",
      runId,
      superadminCookie,
    });
    internUserId = internUser.id;
    internCookie = internUser.cookie;

    const schedule = await apiTestUtils.apiRequest<Response>(
      "/api/agency-schedules",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          agencyId,
          name: `Attendance Shift ${runId}`,
          dayOfWeek: 1, // Represents Monday
          agencyScheduleStart: "08:00:00",
          agencyScheduleEnd: "16:00:00",
        },
      },
    );
    expect(schedule.status).toBe(201);
    scheduleId = (await apiTestUtils.readJson<{ id: string }>(schedule)).id;

    const agencyArea = await apiTestUtils.apiRequest<Response>(
      `/api/agency-areas/${agencyId}`,
      {
        method: "PUT",
        cookie: superadminCookie,
        body: {
          geoData: {
            type: "Polygon",
            coordinates: [
              [
                [119.434, -5.149],
                [119.436, -5.149],
                [119.436, -5.146],
                [119.434, -5.146],
                [119.434, -5.149],
              ],
            ],
          },
        },
      },
    );
    expect(agencyArea.status).toBe(200);

    const existingRule = await apiTestUtils.apiRequest<Response>(
      `/api/agency-rules/${agencyId}`,
      {
        method: "GET",
        cookie: superadminCookie,
      },
    );
    expect(existingRule.status).toBe(200);

    const existingRuleBody = await apiTestUtils.readJson<{
      id: string | null;
    } | null>(existingRule);

    if (existingRuleBody?.id) {
      agencyRuleId = existingRuleBody.id;
    } else {
      const createdRule = await apiTestUtils.apiRequest<Response>(
        `/api/agency-rules/${agencyId}`,
        {
          method: "POST",
          cookie: superadminCookie,
          body: {
            requireFaceVerification: true,
            requireWithinArea: true,
            lateToleranceMinutes: 15,
          },
        },
      );
      expect(createdRule.status).toBe(201);
      agencyRuleId = (await apiTestUtils.readJson<{ id: string }>(createdRule))
        .id;
    }

    const intern = await apiTestUtils.apiRequest<Response>("/api/interns", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        userId: internUserId,
        agencyId,
        institutionId,
        startedAt: "2026-01-10T00:00:00.000Z",
      },
    });
    expect(intern.status).toBe(201);
    internId = (await apiTestUtils.readJson<{ id: string }>(intern)).id;

    const faceDescriptor = await apiTestUtils.apiRequest<Response>(
      "/api/face-descriptors",
      {
        method: "POST",
        cookie: internCookie,
        body: {
          descriptor: attendanceFaceDescriptor,
        },
      },
    );
    expect(faceDescriptor.status).toBe(201);
    faceDescriptorId = (
      await apiTestUtils.readJson<{ id: string }>(faceDescriptor)
    ).id;
  });

  test.afterAll(async () => {
    // agencyArea is automatically dropped due to Prisma Cascade when agency is deleted.
    // Removing the 405 error source here.

    if (internAttendanceId) {
      await apiTestUtils.deleteIfExists(
        `/api/attendances/${internAttendanceId}`,
        superadminCookie,
      );
    }
    if (attendanceId) {
      await apiTestUtils.deleteIfExists(
        `/api/attendances/${attendanceId}`,
        superadminCookie,
      );
    }
    if (faceDescriptorId) {
      await apiTestUtils.deleteIfExists(
        `/api/face-descriptors/${faceDescriptorId}`,
        internCookie,
      );
    }
    if (agencyRuleId) {
      await apiTestUtils.deleteIfExists(
        `/api/agency-rules/${agencyId}`,
        superadminCookie,
      );
    }
    if (internUserId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${internUserId}`,
        superadminCookie,
      );
    }
    if (institutionId) {
      await apiTestUtils.deleteIfExists(
        `/api/institutes/${institutionId}`,
        superadminCookie,
      );
    }
    if (agencyId) {
      await apiTestUtils.deleteIfExists(
        `/api/agencies/${agencyId}`,
        superadminCookie,
      );
    }
  });

  test("creates attendance", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/attendances",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          internId,
          agencyScheduleId: scheduleId,
          date: "2026-01-19T00:00:00.000Z", // Changed to a valid Monday
          attendanceTime: "2026-01-19T01:00:00.000Z",
          attendanceLatitude: insideLatitude,
          attendanceLongitude: insideLongitude,
          attendanceWithinArea: true,
          attendanceFaceDescriptor,
          status: "PRESENT",
          notes: `Attendance ${runId}`,
        },
      },
    );
    expect(created.status).toBe(201);
    attendanceId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("rejects intern attendance when face descriptor does not match", async () => {
    const failed = await apiTestUtils.apiRequest<Response>("/api/attendances", {
      method: "POST",
      cookie: internCookie,
      body: {
        internId,
        agencyScheduleId: scheduleId,
        date: "2026-01-12T00:00:00.000Z", // Valid Monday
        attendanceTime: "2026-01-12T01:00:00.000Z",
        attendanceLatitude: insideLatitude,
        attendanceLongitude: insideLongitude,
        attendanceWithinArea: true,
        attendanceFaceDescriptor: mismatchedAttendanceFaceDescriptor,
        status: "PRESENT",
        notes: `Attendance mismatch ${runId}`,
      },
    });

    expect(failed.status).toBe(409);
  });

  test("creates intern attendance when rule checks pass", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/attendances",
      {
        method: "POST",
        cookie: internCookie,
        body: {
          internId,
          agencyScheduleId: scheduleId,
          date: "2026-01-12T00:00:00.000Z", // Valid Monday
          attendanceTime: "2026-01-12T01:00:00.000Z",
          attendanceLatitude: insideLatitude,
          attendanceLongitude: insideLongitude,
          attendanceWithinArea: true,
          attendanceFaceDescriptor,
          status: "PRESENT",
          notes: `Attendance intern ${runId}`,
        },
      },
    );
    const createdBody = await apiTestUtils.readJson<{
      id: string;
      status: string;
    }>(created);

    expect(createdBody.status).toBe("LATE");
    internAttendanceId = createdBody.id;
    internAttendanceId = (await apiTestUtils.readJson<{ id: string }>(created))
      .id;
  });

  test("lists attendance", async () => {
    const listed = await apiTestUtils.apiRequest<Response>("/api/attendances", {
      cookie: superadminCookie,
    });
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(
      listedBody.data.some((item) => item.id === attendanceId),
    ).toBeTruthy();
  });

  test("reads attendance", async () => {
    const readByIntern = await apiTestUtils.apiRequest<Response>(
      `/api/attendances/${attendanceId}`,
      {
        cookie: internCookie,
      },
    );
    expect(readByIntern.status).toBe(200);
  });

  test("updates attendance", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/attendances/${attendanceId}`,
      {
        method: "PATCH",
        cookie: superadminCookie,
        body: {
          notes: `Attendance Updated ${runId}`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes attendance", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/attendances/${attendanceId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
    attendanceId = "";
  });

  test("rejects intern attendance when outside agency area", async () => {
    const failed = await apiTestUtils.apiRequest<Response>("/api/attendances", {
      method: "POST",
      cookie: internCookie,
      body: {
        internId,
        agencyScheduleId: scheduleId,
        date: "2026-01-26T00:00:00.000Z", // Changed to a valid Monday to avoid schedule conflict 409
        attendanceTime: "2026-01-26T01:00:00.000Z",
        attendanceLatitude: outsideLatitude,
        attendanceLongitude: outsideLongitude,
        attendanceWithinArea: false,
        attendanceFaceDescriptor,
        status: "PRESENT",
        notes: `Attendance outside area ${runId}`,
      },
    });

    expect(failed.status).toBe(409);
  });
});
