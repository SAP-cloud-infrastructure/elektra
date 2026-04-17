import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Masterdata Cockpit Tests - Admin User
 *
 * These tests verify that admin users can access and interact with the Masterdata Cockpit.
 * Tests require Rails running in e2e mode with mock services.
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Masterdata Cockpit - Admin User", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await loginAsAdmin(page)
  })

  test("can open masterdata cockpit", async ({ page }) => {
    // Navigate to masterdata cockpit
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")

    // Verify "Masterdata Status" section is present
    await expect(page.locator("text=/Masterdata Status/i")).toBeVisible()
  })

  test("can open and close edit masterdata dialog", async ({ page }) => {
    // Navigate to masterdata cockpit
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`)

    // Verify page is loaded
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata")

    // Click edit masterdata button
    await page.click("#edit_masterdata_btn")

    // Verify edit dialog opens
    await expect(page.locator("text=/Edit masterdata for project: admin/i")).toBeVisible()

    // Click cancel button
    await page.click('button:has-text("Cancel")')

    // Verify dialog is closed (wait for dialog to disappear)
    await expect(page.locator("text=/Edit masterdata for project: admin/i")).not.toBeVisible()
  })
})

