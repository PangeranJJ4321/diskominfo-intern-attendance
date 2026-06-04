import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Face Descriptor API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let userId = "";
  let userCookie = "";
  let faceDescriptorId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const faceDescriptorUser = await apiTestUtils.createCredentialUser({
      name: `face-descriptor-user-${runId}`,
      role: "INTERN",
      runId,
      superadminCookie,
    });
    userId = faceDescriptorUser.id;
    userCookie = faceDescriptorUser.cookie;
  });

  test.afterAll(async () => {
    if (faceDescriptorId) {
      await apiTestUtils.deleteIfExists(
        `/api/face-descriptors/${faceDescriptorId}`,
        userCookie,
      );
    }

    if (userId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${userId}`,
        superadminCookie,
      );
    }
  });

  test("requires authentication", async () => {
    const response = await apiTestUtils.apiRequest<Response>(
      "/api/face-descriptors",
    );

    expect(response.status).toBe(401);
  });

  test("creates face descriptor", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/face-descriptors",
      {
        method: "POST",
        cookie: userCookie,
        body: {
          userId,
          descriptor: [0.12, 0.34, 0.56, 0.78],
        },
      },
    );

    expect(created.status).toBe(201);
    faceDescriptorId = (await apiTestUtils.readJson<{ id: string }>(created))
      .id;
  });

  test("lists face descriptors", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      "/api/face-descriptors",
      {
        cookie: userCookie,
      },
    );

    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(
      listedBody.data.some((item) => item.id === faceDescriptorId),
    ).toBeTruthy();
  });

  test("reads face descriptor", async () => {
    const detailed = await apiTestUtils.apiRequest<Response>(
      `/api/face-descriptors/${faceDescriptorId}`,
      {
        cookie: userCookie,
      },
    );

    expect(detailed.status).toBe(200);
  });

  test("deletes face descriptor", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/face-descriptors/${faceDescriptorId}`,
      {
        method: "DELETE",
        cookie: userCookie,
      },
    );

    expect(removed.status).toBe(200);
    faceDescriptorId = "";
  });
});
