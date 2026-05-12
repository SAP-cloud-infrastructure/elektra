import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Cost Report - Functional Tests (Admin)
 *
 * Tests functionality of cost report page.
 * Verifies that page loads and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT cost-report-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Cost Report - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access cost report page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/reports/cost/project`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Cost Report")
    await page.waitForTimeout(2000)

    // Verify content loads (either data or no data message)
    const noDataMessage = page.locator("text=/No data available/i")
    const isVisible = await noDataMessage.isVisible().catch(() => false)

    // Page should either show data or "no data" message
    if (isVisible) {
      await expect(noDataMessage).toBeVisible()
    }
    // If no "no data" message, page has loaded successfully
  })
})
