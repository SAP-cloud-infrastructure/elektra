import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * DNS Service - Functional Tests (Admin)
 *
 * Tests functionality of DNS service pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT dns-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("DNS Service - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access dns zones page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/dns-service/zones`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("DNS")
    await page.waitForTimeout(2000)

    // Verify search form is visible
    await expect(page.locator('input[name="search"]')).toBeVisible()
  })
})
