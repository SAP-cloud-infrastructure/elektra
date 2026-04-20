import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Domain - Visual Regression Tests (Admin)
 *
 * Tests visual stability of domain landing page with security masking.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 domain-admin-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Domain", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/home`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Home")
    await page.waitForTimeout(1000)
  })

  test("full page - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("domain-admin-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("domain-admin-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("my requests page - masked", async ({ page }) => {
    await page.locator("a:has-text('My Requests')").click()
    await expect(page.locator("[data-test=page-title]")).toContainText("My Requests")
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("domain-admin-my-requests.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
