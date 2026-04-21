import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Shared File System - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 shared-filesystem-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Shared File System Components", () => {
  test.setTimeout(60000)

  test("shares - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/shares`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load and items to be fetched
    await page.waitForTimeout(5000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("shared-filesystem-shares-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("share networks - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/share-networks`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load and items to be fetched
    await page.waitForTimeout(5000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("shared-filesystem-share-networks-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("security services - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/security-services`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load and items to be fetched
    await page.waitForTimeout(5000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("shared-filesystem-security-services-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("autoscaling - tab content", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/autoscaling`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    const tabPane = page.locator(".tab-pane.active").first()
    await expect(tabPane).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(tabPane).toHaveScreenshot("shared-filesystem-autoscaling-tab.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("shares - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/shares`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Create New" button
    const createButton = page.locator('a:has-text("Create New")')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (React app uses role="document")
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("shared-filesystem-shares-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("share networks - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/share-networks`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Create New" button
    const createButton = page.locator('a:has-text("Create New")')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (React app uses role="document")
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("shared-filesystem-share-networks-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("security services - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/security-services`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Create New" button
    const createButton = page.locator('a:has-text("Create New")')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (React app uses role="document")
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("shared-filesystem-security-services-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  // Note: Replicas and Snapshots pages have no toolbar, so we skip visual tests for these pages
})
