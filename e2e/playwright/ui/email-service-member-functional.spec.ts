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

  test("can access email-service page and see setup tab", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email-service`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Verify page title (displays "Email" not "EmailService")
    await expect(page.locator("[data-test=page-title]")).toContainText("Email")

    // Verify Setup tab is visible
    const setupTab = page.locator('text="Setup"')
    await expect(setupTab).toBeVisible()

    // Verify Maillog tab is visible
    const maillogTab = page.locator('text="Maillog"')
    await expect(maillogTab).toBeVisible()
  })

  test("search bar is visible in maillog tab", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email-service`, {
      waitUntil: "domcontentloaded",
    })

    await page.waitForTimeout(5000)

    // Click on Maillog tab to see the maillog content
    const maillogTab = page.locator('text="Maillog"')
    await maillogTab.click()

    // Wait for maillog content to load
    await page.waitForTimeout(2000)

    // Verify search bar elements are present in maillog tab
    const searchInput = page.locator('input[type="text"], input[placeholder*="Subject" i]').first()
    await expect(searchInput).toBeVisible()
  })
})
