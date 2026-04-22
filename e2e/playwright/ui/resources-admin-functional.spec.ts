import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Resources - Functional Tests (Admin)
 *
 * Tests functionality of resource management pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT resources-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Resources - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto(`/${TEST_DOMAIN}/admin/resources/v2/project`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Resource Management")
  })

  test("can access resource management page", async ({ page }) => {
    // Page already loaded in beforeEach
    // Page title verification is sufficient for this smoke test
  })
})
