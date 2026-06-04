import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Agency API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let agencyId = "";
  const agencyName = `Agency ${runId}`;

  test.beforeAll(async () => {
    const authState = await apiTestUtils.loadAuthState();
    superadminCookie = authState.superadminCookie;
  });

  test.afterAll(async () => {
    if (agencyId) {
      await apiTestUtils.deleteIfExists(
        `/api/agencies/${agencyId}`,
        superadminCookie,
      );
    }
  });

  test("creates agency", async () => {
    const created = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: agencyName,
      },
    });
    expect(created.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists agency", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/agencies?q=${encodeURIComponent(agencyName)}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(listedBody.data.some((item) => item.id === agencyId)).toBeTruthy();
  });

  test("reads agency", async () => {
    const detailed = await apiTestUtils.apiRequest<Response>(
      `/api/agencies/${agencyId}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(detailed.status).toBe(200);
  });

  test("updates agency", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/agencies/${agencyId}`,
      {
        method: "PATCH",
        cookie: superadminCookie,
        body: {
          name: `${agencyName} Updated`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes agency", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/agencies/${agencyId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
    agencyId = "";
  });
});
