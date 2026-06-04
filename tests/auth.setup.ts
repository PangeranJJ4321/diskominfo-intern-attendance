/**
 * Auth Setup (API)
 *
 * Runs once before all test projects (see playwright.config.ts `setup` project).
 * Authenticates the shared test account via API and saves the token/cookie state so
 * subsequent tests can start already signed-in without repeating the login flow.
 *
 * Required environment variables (fall back to sensible test defaults):
 *   SUPERADMIN_NAME     – display name for the account  (default: "Superadmin User")
 *   SUPERADMIN_EMAIL    – email for the test account    (default: "superadmin@playwright.local")
 *   SUPERADMIN_PASSWORD – password for the test account (default: "Playwright@123")
 *
 * On the very first run the account may not exist yet.  The setup will attempt
 * to sign in via API; if that fails it creates the account via the sign-up API and
 * then signs in again so the storage state always reflects a valid session.
 */

import { expect, test as setup } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import apiTestUtils from "./api/api-test-utils";

dotenv.config({ path: ".env" });
dotenv.config();

const TEST_NAME = process.env.SUPERADMIN_NAME ?? "Superadmin User";
const TEST_EMAIL =
  process.env.SUPERADMIN_EMAIL ?? "superadmin@playwright.local";
const TEST_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "Playwright@123";

setup("authenticate superadmin via API", async () => {
  let superadminCookie: string | null = null;

  // ── Step 1: attempt sign-in ──────────────────────────────────────────────
  try {
    superadminCookie = await apiTestUtils.signInWithEmail(
      TEST_EMAIL,
      TEST_PASSWORD,
    );
  } catch (error) {
    // Catching the error assuming apiTestUtils throws on a 401/404 login failure
    console.log("API sign-in failed. Attempting to create account...", error);
  }

  // ── Step 2: if sign-in failed, create the account first ─────────────────
  if (!superadminCookie) {
    // Note: Ensure your apiTestUtils has a corresponding method to register an account
    await apiTestUtils.signUpWithEmail(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);

    // Attempt sign-in again after successful creation
    superadminCookie = await apiTestUtils.signInWithEmail(
      TEST_EMAIL,
      TEST_PASSWORD,
    );
  }

  // ── Step 3: assert we have a valid authentication state ─────────────────
  expect(superadminCookie).toBeTruthy();
  expect(superadminCookie?.length).toBeGreaterThan(0);

  // ── Step 4: persist the authenticated context ────────────────────────────
  const authDirectory = path.join(process.cwd(), "playwright", ".auth");
  await mkdir(authDirectory, { recursive: true });

  await writeFile(
    apiTestUtils.authStatePath,
    JSON.stringify(
      {
        superadminCookie,
      },
      null,
      2,
    ),
    "utf8",
  );
});
