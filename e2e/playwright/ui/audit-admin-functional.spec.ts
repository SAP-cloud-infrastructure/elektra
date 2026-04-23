import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Audit - Functional Tests (Admin)
 *
 * Tests functionality of audit log pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT audit-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Audit - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto(`/${TEST_DOMAIN}/admin/audit/`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Audit Log")
    // Wait for React widget to load
    await page.waitForTimeout(2000)
  })

  test("can access audit log page", async ({ page }) => {
    // Verify filter dropdown is visible (React widget loaded)
    await expect(page.locator("select[name='filterType']")).toBeVisible()
  })
})
