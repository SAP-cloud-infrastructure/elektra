import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Key Manager - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and create panels.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT keymanager-member-component-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/keymanager-member-component-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots keymanager-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Key Manager Components", () => {
  test.setTimeout(60000)

  test("secrets - toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/secrets`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Locate the toolbar
    const toolbar = page.locator(".juno-datagrid-toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("keymanager-secrets-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("secrets - new secret panel", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/secrets/newSecret`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Wait for panel to appear
    const panel = page.locator('.juno-panel[role="dialog"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(panel).toHaveScreenshot("keymanager-secrets-new-panel.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("containers - toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/containers`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Locate the toolbar
    const toolbar = page.locator(".juno-datagrid-toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("keymanager-containers-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("containers - new container panel", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/containers/newContainer`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Wait for panel to appear
    const panel = page.locator('.juno-panel[role="dialog"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(panel).toHaveScreenshot("keymanager-containers-new-panel.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("orders - toolbar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/orders`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Locate the toolbar
    const toolbar = page.locator(".juno-datagrid-toolbar").first()
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("keymanager-orders-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("orders - new order panel", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/orders/newOrder`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")
    await page.waitForTimeout(5000)

    // Wait for panel to appear
    const panel = page.locator('.juno-panel[role="dialog"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(panel).toHaveScreenshot("keymanager-orders-new-panel.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
