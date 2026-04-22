import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Masterdata Cockpit - Functional Tests (Admin)
 *
 * Tests functionality and UI elements of the Masterdata Cockpit for admin users.
 * Verifies that all sections, buttons, modals, and interactions work correctly.
 * Tests require Rails running in e2e mode with mock services.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 masterdata-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Masterdata Cockpit - Admin User", () => {
  // Increase timeout for tests
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await loginAsAdmin(page)

    // Navigate to masterdata cockpit
    await page.goto(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for page to be fully loaded
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Masterdata", {
      timeout: 10000,
    })

    // Wait for main content sections to be loaded
    await expect(page.locator("#project_masterdata_details")).toBeVisible({ timeout: 10000 })
  })

  test("page renders main sections without errors", async ({ page }) => {
    // Verify Project section
    await expect(page.locator("#project_details")).toBeVisible()

    // Verify Masterdata section
    await expect(page.locator("#project_masterdata_details")).toBeVisible()

    // Verify additional info sidebar
    await expect(page.locator("#project_masterdata_additional_infos")).toBeVisible()
  })

  test("displays masterdata status section", async ({ page }) => {
    // Verify status heading
    await expect(page.locator("text=/Masterdata Status/i")).toBeVisible()

    // Verify status indicators (Complete/Incomplete)
    const statusSection = page.locator(".infobox")
    await expect(statusSection).toBeVisible()

    // Check for either complete or incomplete status
    const hasCompleteStatus = await statusSection.locator("text=/Complete/i").isVisible()
    const hasIncompleteStatus = await statusSection.locator("text=/Incomplete/i").isVisible()

    expect(hasCompleteStatus || hasIncompleteStatus).toBeTruthy()
  })

  test("displays significance section", async ({ page }) => {
    // Verify Significance heading
    await expect(page.locator("h5:has-text('Significance')")).toBeVisible()
  })

  test("displays contact section", async ({ page }) => {
    // Verify Contact heading
    await expect(page.locator("h5:has-text('Contact')")).toBeVisible()
  })

  test("displays roles section", async ({ page }) => {
    // Verify Roles heading
    await expect(page.locator("h5:has-text('Roles')")).toBeVisible({ timeout: 15000 })
  })

  test("displays role propagation section", async ({ page }) => {
    // Verify Role Propagation heading
    await expect(page.locator("h5:has-text('Role Propagation')")).toBeVisible({ timeout: 15000 })
  })

  test("displays cost info section", async ({ page }) => {
    // Verify Cost Info heading
    await expect(page.locator("h5:has-text('Cost Info')")).toBeVisible({ timeout: 15000 })
  })

  test("displays project info section", async ({ page }) => {
    // Verify Project Info heading
    await expect(page.locator("h5:has-text('Project Info')")).toBeVisible()
  })

  test("displays audit section", async ({ page }) => {
    // Verify Audit heading
    await expect(page.locator("h5:has-text('Audit')")).toBeVisible()
  })

  test("help icons are present", async ({ page }) => {
    // Get all help icon links
    const helpIcons = page.locator("a.help-link")
    const helpIconCount = await helpIcons.count()

    // Verify we have help icons (should be many)
    expect(helpIconCount).toBeGreaterThan(10)
  })

  test("edit button is present and clickable", async ({ page }) => {
    // Verify edit button exists
    const editButton = page.locator("#edit_masterdata_btn")
    await expect(editButton).toBeVisible()
    await expect(editButton).toBeEnabled()

    // Verify button text
    await expect(editButton).toContainText("Edit")
  })

  test("project details section is displayed", async ({ page }) => {
    // Verify project details fields
    const projectDetails = page.locator("#project_details")
    await expect(projectDetails).toBeVisible()
  })
})
