import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Networking - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT networking-admin-component-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/networking-admin-component-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots networking-admin-component-visual
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

  test("security groups - new dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/widget/security-groups/?r=/new`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Security Groups")
    await page.waitForTimeout(2000)

    // Wait for modal content (direct link to /new)
    const modalContent = page.locator(".modal-content[role='document']").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-security-groups-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("private networks - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/networks/private`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(5000)

    // Click on "Create new" button
    const createButton = page.locator('a[data-modal="true"]:has-text("Create new")')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait longer for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content
    const modalContent = page.locator(".modal-content.networking").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-networks-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("routers - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/routers`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(5000)

    // Click on "Create new" button
    const createButton = page.locator('a[data-modal="true"]:has-text("Create new")')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Wait longer for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content
    const modalContent = page.locator(".modal-content.networking").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-routers-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("floating ips - allocate dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/floating_ips`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Floating IPs")
    await page.waitForTimeout(5000)

    // Click on "Allocate new" button
    const allocateButton = page.locator('a[data-modal="true"]:has-text("Allocate new")')
    await expect(allocateButton).toBeVisible({ timeout: 10000 })
    await allocateButton.click()

    // Wait longer for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content
    const modalContent = page.locator(".modal-content.networking").first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-floating-ips-allocate-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("fixed ips and ports - reserve dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/widget/ports/?r=/ports`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Fixed IPs / Ports")

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "Reserve new IP" button
    const reserveButton = page.locator('a:has-text("Reserve new IP")')
    await expect(reserveButton).toBeVisible({ timeout: 10000 })
    await reserveButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (React app uses role="document")
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-ports-reserve-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("bgp vpns - create dialog", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/widget/bgp-vpns/?r=`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Click on "New BGP VPN" button
    const newButton = page.locator('a:has-text("New BGP VPN")')
    await expect(newButton).toBeVisible({ timeout: 10000 })
    await newButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(3000)

    // Wait for modal content (React app uses role="document")
    const modalContent = page.locator('.modal-content[role="document"]').first()
    await expect(modalContent).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(modalContent).toHaveScreenshot("networking-bgp-vpns-create-dialog.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
