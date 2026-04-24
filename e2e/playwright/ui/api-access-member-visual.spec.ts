import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * API Access - Visual Regression Tests (Member)
 *
 * Tests visual stability of API endpoints page with security masking.
 * All sensitive data is masked with black boxes:
 * - Domain/Project IDs
 * - Email addresses (if any)
 * - User names
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT api-access-member-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/api-access-member-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots api-access-member-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - API Endpoints", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
    await page.waitForTimeout(1000)
  })

  test("full page - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("api-endpoints-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("api-endpoints-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})

test.describe("Responsive - API Access", () => {
  test.setTimeout(60000) // 60 seconds

  test("desktop 1920x1080 - API endpoints", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("api-endpoints-desktop-1920.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("tablet 768x1024 - API endpoints", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("api-endpoints-tablet-768.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
