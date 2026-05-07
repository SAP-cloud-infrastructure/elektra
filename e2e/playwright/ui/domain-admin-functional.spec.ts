import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Domain - Functional Tests (Admin)
 *
 * Tests functionality of domain landing page.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT domain-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Domain - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto(`/${TEST_DOMAIN}/home`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Home")
  })

  test("can access domain landing page", async ({ page }) => {
    // Page already loaded in beforeEach
    // Verify key elements are visible
    await expect(page.locator("text=/Create.*Project/i")).toBeVisible()
  })

  test("can navigate to my requests", async ({ page }) => {
    await page.locator("a:has-text('My Requests')").click()
    await expect(page.locator("[data-test=page-title]")).toContainText("My Requests")
  })
})
