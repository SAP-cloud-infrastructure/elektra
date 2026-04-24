import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Flavors - Functional Tests (Admin)
 *
 * Tests functionality of flavors page.
 * Verifies that page loads and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT flavors-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Flavors - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access flavors page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/compute/flavors`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Flavors")
    await page.waitForTimeout(2000)

    // Verify flavors table is visible
    const flavorsTable = page.locator("table.flavors")
    await expect(flavorsTable).toBeVisible()
  })
})
