import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Audit - Visual Regression Tests (Admin)
 *
 * Tests visual stability of audit log pages with security masking.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 audit-admin-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Audit", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/audit/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Audit Log")
    await page.waitForTimeout(1000)
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("audit-admin-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
