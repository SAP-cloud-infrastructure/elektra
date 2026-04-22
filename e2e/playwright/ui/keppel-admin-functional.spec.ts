import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Keppel - Functional Tests (Admin)
 *
 * Tests functionality of Keppel (Container Image Registry) pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT keppel-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Keppel - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access keppel page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/keppel`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Container Image Registry")

    // Verify page content loaded
    const pageContent = page.locator("body")
    await expect(pageContent).toBeVisible()
  })
})
