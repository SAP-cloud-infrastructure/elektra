import { test, expect } from "@playwright/test"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Landing Page - Visual Regression Tests
 *
 * Tests visual stability of public-facing landing pages with security masking.
 * No authentication required for these tests.
 *
 * Run with: pnpm e2e:playwright:smoke -- --host http://localhost:PORT landing-visual
 * Update snapshots: pnpm e2e:playwright:smoke -- --host http://localhost:PORT --update-snapshots landing-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Landing Page", () => {
  test.setTimeout(60000) // 60 seconds

  test("root page - full page", async ({ page }) => {
    await page.goto("/")

    // Wait for React app to load
    const root = page.locator('[id="root"]')
    const shadowHost = root.locator('[data-shadow-host="true"]')
    await expect(shadowHost).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-root-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("root page - viewport", async ({ page }) => {
    await page.goto("/")

    const root = page.locator('[id="root"]')
    const shadowHost = root.locator('[data-shadow-host="true"]')
    await expect(shadowHost).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-root-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("domain page without auth", async ({ page }) => {
    await page.goto(`/${TEST_DOMAIN}`)
    await page.waitForTimeout(1000)

    // Wait for login button
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-domain-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("login page", async ({ page }) => {
    await page.goto(`/${TEST_DOMAIN}/home/`)
    await page.waitForTimeout(1000)

    // Wait for login prompt
    await expect(page.locator("text=Please sign in")).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-login-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("error page - unsupported domain", async ({ page }) => {
    await page.goto("/BAD_DOMAIN_THAT_DOES_NOT_EXIST/home", {
      waitUntil: "domcontentloaded"
    })
    await page.waitForTimeout(1000)

    // Wait for error message
    await expect(page.locator("text=Unsupported Domain")).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-error-unsupported-domain.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})

test.describe("Responsive - Landing Page", () => {
  test.setTimeout(60000) // 60 seconds

  test("desktop 1920x1080 - root page", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto("/")

    const root = page.locator('[id="root"]')
    const shadowHost = root.locator('[data-shadow-host="true"]')
    await expect(shadowHost).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-desktop-1920.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("tablet 768x1024 - root page", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")

    const root = page.locator('[id="root"]')
    const shadowHost = root.locator('[data-shadow-host="true"]')
    await expect(shadowHost).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-tablet-768.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("mobile 375x667 - root page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")

    const root = page.locator('[id="root"]')
    const shadowHost = root.locator('[data-shadow-host="true"]')
    await expect(shadowHost).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("landing-mobile-375.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
