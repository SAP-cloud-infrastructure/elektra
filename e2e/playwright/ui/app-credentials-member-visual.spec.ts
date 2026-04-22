import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * App Credentials - Visual Tests (Member)
 *
 * Tests visual stability of app credentials page (static view).
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 app-credentials-member-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - App Credentials", () => {
  test.setTimeout(60000)

  test("full page - masked", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/app-credentials`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("app-credentials-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("create panel", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/app-credentials`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Create" button (not "Create New", just "Create")
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create")').first()
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait for side panel to appear
    await page.waitForTimeout(3000)

    // Wait for Juno panel with specific class
    const panel = page.locator('.juno-panel[role="dialog"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(panel).toHaveScreenshot("app-credentials-create-panel.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
