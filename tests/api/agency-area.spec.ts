import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

test.describe.serial("Agency Area API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let ownerAdminId = "";
  let ownerAdminCookie = "";
  let agencyId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Agency Area ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const ownerAdmin = await apiTestUtils.createCredentialUser({
      name: `area-admin-${runId}`,
      role: "ADMIN",
      runId,
      superadminCookie,
    });
    ownerAdminId = ownerAdmin.id;
    ownerAdminCookie = ownerAdmin.cookie;

    const ownerAccess = await apiTestUtils.apiRequest<Response>(
      "/api/agency-accesses",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          agencyId,
          userId: ownerAdminId,
        },
      },
    );
    expect(ownerAccess.status).toBe(201);
  });

  test.afterAll(async () => {
    if (agencyId) {
      await apiTestUtils.deleteIfExists(
        `/api/agencies/${agencyId}`,
        superadminCookie,
      );
    }
    if (ownerAdminId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${ownerAdminId}`,
        superadminCookie,
      );
    }
  });

  test("upserts agency area", async () => {
    const upserted = await apiTestUtils.apiRequest<Response>(
      `/api/agency-areas/${agencyId}`,
      {
        method: "PUT",
        cookie: ownerAdminCookie,
        body: {
          geoData: {
            type: "Polygon",
            coordinates: [
              [
                [119.4342, -5.1477],
                [119.4348, -5.1477],
                [119.4348, -5.1483],
                [119.4342, -5.1483],
                [119.4342, -5.1477],
              ],
            ],
          },
          timezone: "Asia/Makassar",
        },
      },
    );
    expect(upserted.status).toBe(200);
  });

  test("fetches agency area", async () => {
    const fetched = await apiTestUtils.apiRequest<Response>(
      `/api/agency-areas/${agencyId}`,
      {
        cookie: ownerAdminCookie,
      },
    );
    expect(fetched.status).toBe(200);
  });
});
