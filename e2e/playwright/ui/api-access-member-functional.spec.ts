import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * API Access - Functional Tests (Member)
 *
 * Tests functionality of API endpoints page for member users.
 * Verifies that members can view API endpoints.
 * Tests require Rails running in e2e mode with mock services.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 api-access-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test" // Standard test project in e2e environment

test.describe("API Access - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)

    // Navigate to API endpoints page
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for page to be fully loaded
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")

    // Wait for main content (Domain ID is a key indicator page loaded)
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
  })

  test("can access API endpoints for clients page", async ({ page }) => {
    // Verify help text is present
    await expect(page.locator("text=/access the project with the openstack client/i")).toBeVisible()
  })

  test("API endpoints page contains expected sections", async ({ page }) => {
    // Verify expected content is present
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
    await expect(page.locator("text=/Project ID/i")).toBeVisible()
  })
})
