import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * EmailService - Functional Tests (Member)
 *
 * Tests functionality of EmailService pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT email-service-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("EmailService - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access email_service page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email_service`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Verify page title (displays "Email" not "EmailService")
    await expect(page.locator("[data-test=page-title]")).toContainText("Email")

    // Verify app loaded - should see the intro box with documentation link
    const introBox = page.locator("text=/For documentation on configuring/i")
    await expect(introBox).toBeVisible()
  })

  test("search bar is visible", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email_service`, {
      waitUntil: "domcontentloaded",
    })

    await page.waitForTimeout(5000)

    // Verify search bar elements are present
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible()
  })
})
