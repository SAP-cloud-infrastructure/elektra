import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Images - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars, filters, and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT images-member-component-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/images-member-component-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots images-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Images Components", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/image/ng?r=/os-images/available`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Server Images & Snapshots")
    // Wait longer for images to load
    await page.waitForTimeout(5000)
  })

  test("search toolbar", async ({ page }) => {
    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("images-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
