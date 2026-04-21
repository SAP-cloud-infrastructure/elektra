import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * DNS Service - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 dns-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - DNS Service Components", () => {
  test.setTimeout(60000)

  test("zones - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/dns-service/zones`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("DNS")
    await page.waitForTimeout(2000)

    const toolbar = page.locator(".toolbar.toolbar-controlcenter").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("dns-zones-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("zones - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/dns-service/zones`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("DNS")
    await page.waitForTimeout(2000)

    // Click on "Create New Zone" button (admin has full permissions)
    const createButton = page.locator('a[data-modal="true"]:has-text("Create New Zone")').first()
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (Rails modal with dns_service class)
    const modalContent = page.locator(".modal-content.dns_service").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("dns-zones-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
