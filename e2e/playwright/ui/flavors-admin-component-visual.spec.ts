import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Flavors - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 flavors-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Flavors Components", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/compute/flavors`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Flavors")
    await page.waitForTimeout(2000)
  })

  test("toolbar (if visible)", async ({ page }) => {
    // Toolbar only shows if user has create permission
    const toolbar = page.locator(".toolbar")
    const isVisible = await toolbar.first().isVisible().catch(() => false)

    if (isVisible) {
      const masks = getBasicMaskSelectors(page)

      await expect(toolbar.first()).toHaveScreenshot("flavors-toolbar.png", {
        mask: masks,
        ...SCREENSHOT_OPTIONS,
      })
    } else {
      // Skip if no toolbar (policy restriction)
      console.log("Skipping toolbar - not visible (policy restriction)")
      test.skip()
    }
  })
})
