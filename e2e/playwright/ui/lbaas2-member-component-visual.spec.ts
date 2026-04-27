import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Load Balancers - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbar and create modal dialog.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT lbaas2-member-component-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/lbaas2-member-component-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots lbaas2-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Load Balancers Components", () => {
  test.setTimeout(60000)

  test("toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/lbaas2/?r=/loadbalancers`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Load Balancers")
    await page.waitForTimeout(5000)

    // Locate the toolbar (search toolbar)
    const toolbar = page.locator(".toolbar.searchToolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("lbaas2-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("new load balancer dialog", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/lbaas2/?r=/loadbalancers`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Load Balancers")
    await page.waitForTimeout(5000)

    // Click on "New Load Balancer" button
    const newButton = page.locator('a:has-text("New Load Balancer"), button:has-text("New Load Balancer")').first()
    await expect(newButton).toBeVisible({ timeout: 10000 })
    await newButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (lbaas2 modal)
    const modalDialog = page.locator(".lbaas2.modal-dialog").first()
    await expect(modalDialog).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalDialog).toHaveScreenshot("lbaas2-new-loadbalancer-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
