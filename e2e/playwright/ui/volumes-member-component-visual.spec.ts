import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Volumes - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars, headers, and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 volumes-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Volumes Components", () => {
  test.setTimeout(60000)

  test("volumes toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage?r=/volumes`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Volumes & Snapshots")
    await page.waitForTimeout(5000)

    // Screenshot just the toolbar area
    const toolbar = page.locator(".toolbar.toolbar-controlcenter")
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("volumes-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("snapshots toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage?r=/snapshots`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Volumes & Snapshots")
    await page.waitForTimeout(5000)

    // Screenshot the search toolbar (if visible with enough items)
    const toolbar = page.locator(".toolbar")

    // Check if toolbar exists (only shows with 5+ items)
    const isVisible = await toolbar.first().isVisible().catch(() => false)
    if (isVisible) {
      const masks = getBasicMaskSelectors(page)

      await expect(toolbar.first()).toHaveScreenshot("snapshots-toolbar.png", {
        mask: masks,
        ...SCREENSHOT_OPTIONS,
      })
    } else {
      // Skip if no toolbar (not enough snapshots)
      console.log("Skipping snapshots toolbar - not enough items to show toolbar")
      test.skip()
    }
  })
})
