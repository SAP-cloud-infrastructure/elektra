import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Metrics - Visual Regression Tests (Member)
 *
 * Tests visual stability of metrics page with security masking.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT metrics-member-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/metrics-member-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots metrics-member-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Metrics", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/metrics/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Metrics")
    await page.waitForTimeout(1000)
  })

  test("full page - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("metrics-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("metrics-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
