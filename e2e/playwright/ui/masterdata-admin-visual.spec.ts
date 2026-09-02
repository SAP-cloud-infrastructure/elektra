import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getSecurityMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Masterdata Cockpit - Visual Regression Tests (Admin)
 *
 * Tests visual stability of the Masterdata Cockpit UI with security masking.
 * All sensitive data is masked with black boxes:
 * - User names and IDs
 * - Email addresses
 * - Domain/Project IDs
 * - Timestamps
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT masterdata-admin-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/masterdata-admin-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots masterdata-admin-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Masterdata Cockpit", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")

    // Wait for main content sections to be fully loaded
    await expect(page.locator("#project_masterdata_details")).toBeVisible()
    await page.waitForTimeout(1000) // Additional wait for any animations/async content
  })

  test("full page - masked", async ({ page }) => {
    const masks = getSecurityMaskSelectors(page)

    await expect(page).toHaveScreenshot("secure-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("viewport - masked", async ({ page }) => {
    const masks = getSecurityMaskSelectors(page)

    await expect(page).toHaveScreenshot("secure-viewport.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("masterdata details - masked emails and IDs", async ({ page }) => {
    const masterdataDetails = page.locator("#project_masterdata_details")
    await expect(masterdataDetails).toBeVisible()

    const masks = [
      // Email addresses
      masterdataDetails.locator("a[href^='mailto:']"),

      // User/Distribution List IDs (C3Us_*, DL_*)
      masterdataDetails.locator("text=/^C3Us_/i"),
      masterdataDetails.locator("text=/^DL_/i"),

      // Cost Object row
      masterdataDetails.locator("text=/Name\\/Number/i").locator("..").locator(".."),
    ]

    await expect(masterdataDetails).toHaveScreenshot("secure-masterdata-details.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("edit button area - masked", async ({ page }) => {
    const buttonArea = page.locator(".toolbar:has(#edit_masterdata_btn)")
    await expect(buttonArea).toBeVisible()

    await expect(buttonArea).toHaveScreenshot("secure-edit-button-area.png", {
      ...SCREENSHOT_OPTIONS,
      maxDiffPixelRatio: 0.02, // Override for this specific test
    })
  })

  test("significance section - no PII", async ({ page }) => {
    const section = page.locator(".masterdata-group:has(h5:has-text('Significance'))")
    await expect(section).toBeVisible()

    await expect(section).toHaveScreenshot("secure-significance.png", {
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("roles section - masked contacts", async ({ page }) => {
    const section = page.locator(".masterdata-group:has(h5:has-text('Roles'))")
    await expect(section).toBeVisible()

    const masks = [
      // Email addresses
      section.locator("a[href^='mailto:']"),

      // User/Distribution List IDs (C3Us_*, DL_*)
      section.locator("text=/^C3Us_/i"),
      section.locator("text=/^DL_/i"),
    ]

    await expect(section).toHaveScreenshot("secure-roles.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})

test.describe("Bootstrap Components - Masterdata", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")
    // Wait for main content to load
    await expect(page.locator("#project_masterdata_details")).toBeVisible()
  })

  test("button bootstrap classes", async ({ page }) => {
    const editButton = page.locator("#edit_masterdata_btn")
    await expect(editButton).toBeVisible()

    const classAttr = await editButton.getAttribute("class")
    expect(classAttr).toContain("btn")
    expect(classAttr).toContain("btn-primary")

    const box = await editButton.boundingBox()
    expect(box!.width).toBeGreaterThan(50)
    expect(box!.height).toBeGreaterThan(30)

    const bgColor = await editButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)")
    expect(bgColor).not.toBe("transparent")
  })

  test("help icons present", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000)

    const helpIcons = page.locator("a.help-link")
    await expect(helpIcons.first()).toBeVisible()

    const count = await helpIcons.count()
    expect(count).toBeGreaterThan(10)
  })
})

test.describe("Responsive - Masterdata", () => {
  test.setTimeout(60000) // 60 seconds

  test("desktop 1920x1080 - masked", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")
    await expect(page.locator("#project_masterdata_details")).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getSecurityMaskSelectors(page)

    await expect(page).toHaveScreenshot("secure-desktop-1920.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("tablet 768x1024 - masked", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")
    await expect(page.locator("#project_masterdata_details")).toBeVisible()
    await page.waitForTimeout(1000)

    const masks = getSecurityMaskSelectors(page)

    await expect(page).toHaveScreenshot("secure-tablet-768.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
