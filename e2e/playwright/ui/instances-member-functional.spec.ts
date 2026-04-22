import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Compute Instances - Functional Tests (Member)
 *
 * Tests functionality of compute instances pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 instances-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Compute Instances - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access instances page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/compute/instances`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Servers")
    await page.waitForTimeout(2000)

    // Verify search form is visible
    await expect(page.locator('input[name="search"]')).toBeVisible()
  })

  test("search functionality exists", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/compute/instances`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Servers")
    await page.waitForTimeout(2000)

    // Verify search input and dropdown are visible
    const searchInput = page.locator('input#search')
    await expect(searchInput).toBeVisible()

    const searchDropdown = page.locator('select#searchfor')
    await expect(searchDropdown).toBeVisible()
  })

  test("create new button visible", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/compute/instances`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Servers")
    await page.waitForTimeout(2000)

    // Verify "Create New" button is visible
    const createButton = page.locator('a:has-text("Create New")')
    await expect(createButton).toBeVisible()
  })

  // Note: Complex interaction tests (dropdown menus, edit, resize, etc.) are NOT included
  // as they are beyond smoke testing scope and require detailed workflow testing
})
