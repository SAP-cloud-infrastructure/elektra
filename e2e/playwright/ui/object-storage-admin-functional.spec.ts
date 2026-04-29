import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Object Storage - Functional Tests (Admin)
 *
 * Tests functionality of object storage page.
 * Verifies that page loads and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT object-storage-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Object Storage - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access object storage page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/swift/`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")
    await page.waitForTimeout(2000)

    // Verify "Create container" button is visible
    await expect(page.locator("a:has-text('Create container')")).toBeVisible()
  })

  test("can access object storage ceph page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/object-storage/ceph/`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Object Storage")
    await page.waitForTimeout(2000)

    // Verify "Create container" button is visible
    await expect(page.locator("a:has-text('Create container')")).toBeVisible()
  })
})
