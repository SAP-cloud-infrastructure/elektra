import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Networking - Functional Tests (Admin)
 *
 * Tests functionality of networking pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT networking-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Networking - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access floating ips page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/floating_ips`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Floating IPs")
    await page.waitForTimeout(2000)

    // Verify search input is visible
    await expect(page.locator("input[placeholder*='floating ip']")).toBeVisible()
  })

  test("can access networks page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/networks/private`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(2000)
  })

  test("can access routers page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/routers`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Networks & Routers")
    await page.waitForTimeout(2000)
  })

  test("can access security groups page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/widget/security-groups/?r=`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Security Groups")
    await page.waitForTimeout(2000)
  })

  test("can access backup networks page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/backup_networks`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Backup Network")
    await page.waitForTimeout(2000)
  })

  test("can access fixed ips and ports page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/networking/widget/ports/?r=/ports`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Fixed IPs / Ports")
    await page.waitForTimeout(2000)
  })
})
