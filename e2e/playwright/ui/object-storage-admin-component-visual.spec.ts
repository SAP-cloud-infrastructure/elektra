import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Object Storage - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 object-storage-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Object Storage Components", () => {
  test.setTimeout(60000)

  test("main page - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/swift/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("object-storage-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("capabilities popover", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/swift/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on info icon to open popover
    const infoIcon = page.locator("i.fa-info-circle").first()
    await expect(infoIcon).toBeVisible()
    await infoIcon.click()

    // Wait for popover to appear
    await page.waitForTimeout(1000)

    // Find the popover
    const popover = page.locator(".popover").first()
    await expect(popover).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(popover).toHaveScreenshot("object-storage-capabilities-popover.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("ceph - main page toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/ceph/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("object-storage-ceph-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("create container dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/swift/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Create container" button
    const createButton = page.locator("a:has-text('Create container')").first()
    await expect(createButton).toBeVisible()
    await createButton.click()

    // Wait for modal content to appear
    const modalContent = page.locator(".modal-content[role='document']").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })

    // Wait for animation to complete
    await page.waitForTimeout(1000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("object-storage-create-container-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
