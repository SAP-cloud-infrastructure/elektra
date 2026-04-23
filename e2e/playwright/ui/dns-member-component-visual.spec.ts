import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * DNS Service - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT dns-member-component-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/dns-member-component-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots dns-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - DNS Service Components", () => {
  test.setTimeout(60000)

  test("zones - toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/dns-service/zones`, {
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
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/dns-service/zones`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("DNS")
    await page.waitForTimeout(2000)

    // Click on "Create New Zone" button (or "Request New Zone" depending on permissions)
    const createButton = page
      .locator('a[data-modal="true"]:has-text("Create New Zone"), a[data-modal="true"]:has-text("Request New Zone")')
      .first()
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
