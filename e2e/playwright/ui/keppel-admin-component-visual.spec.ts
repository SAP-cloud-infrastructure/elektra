import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Keppel - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbar and new account modal.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT keppel-admin-component-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/keppel-admin-component-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots keppel-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Keppel Components", () => {
  test.setTimeout(60000)

  test("toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/keppel`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Container Image Registry")
    await page.waitForTimeout(5000)

    // Locate the toolbar
    const toolbar = page.locator(".toolbar, [class*='toolbar']").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("keppel-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("new account modal", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/keppel`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Container Image Registry")
    await page.waitForTimeout(5000)

    // Click on "New Account" button
    const newButton = page.locator('button:has-text("New Account"), a:has-text("New Account")').first()
    await expect(newButton).toBeVisible({ timeout: 10000 })
    await newButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("keppel-new-account-modal.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
