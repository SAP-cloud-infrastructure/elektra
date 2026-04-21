import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Networking - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 networking-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Networking Components", () => {
  test.setTimeout(60000)

  test("floating ips - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/floating_ips`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Floating IPs")
    await page.waitForTimeout(2000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("networking-floating-ips-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("networks - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/networks/private`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(2000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("networking-networks-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("routers - toolbar", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/routers`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(2000)

    const toolbar = page.locator(".toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("networking-routers-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("backup networks - content", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/backup_networks`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Backup Network")
    await page.waitForTimeout(2000)

    const content = page.locator(".content").first()
    await expect(content).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(content).toHaveScreenshot("networking-backup-networks-content.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
