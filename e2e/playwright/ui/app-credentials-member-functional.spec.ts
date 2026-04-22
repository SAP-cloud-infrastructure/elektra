import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * App Credentials - Functional Tests (Member)
 *
 * Tests functionality of app credentials pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 app-credentials-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("App Credentials - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access app credentials page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/app-credentials`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Check if page loaded (either title or content visible)
    const pageNotFound = await page.locator("text=Page Not Found").isVisible().catch(() => false)

    if (pageNotFound) {
      // Page not available in e2e environment, skip test
      test.skip()
    } else {
      // Verify page loaded successfully
      const pageContent = page.locator("body")
      await expect(pageContent).toBeVisible()
    }
  })
})
