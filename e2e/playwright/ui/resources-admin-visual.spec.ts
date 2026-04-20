import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Resources - Visual Regression Tests (Admin)
 *
 * Tests visual stability of resource management pages with security masking.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 resources-admin-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Resources", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/resources/v2/project`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Resource Management")
    // Wait longer for resource data to load
    await page.waitForTimeout(3000)
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("resources-admin-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("storage tab - masked", async ({ page }) => {
    // Click on Storage tab (Juno tab component)
    await page.locator('li.juno-tab:has-text("Storage")').click()
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("resources-admin-storage-tab.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
