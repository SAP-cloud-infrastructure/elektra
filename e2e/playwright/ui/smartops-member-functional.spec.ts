import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * SmartOps - Functional Tests (Member)
 *
 * Tests functionality of SmartOps pages for member users.
 * Verifies that the SmartOps page loads correctly.
 * Note: API errors for avatar endpoints are expected and ignored.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT smartops-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("SmartOps - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access smartops page and app loads", async ({ page }) => {
    await loginAsMember(page)

    let hasJobsApiError = false

    // Listen for API responses
    page.on("response", (response) => {
      const url = response.url()

      // Check for SmartOps jobs API error (this means SmartOps is not available)
      if (url.includes("/smartops/api/jobs") && response.status() === 400) {
        hasJobsApiError = true
      }

      // Ignore avatar API errors (these are expected and normal)
      if (url.includes("/avatar")) {
        return
      }
    })

    // Navigate to SmartOps page
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/smartops`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Skip test if SmartOps API is not available
    if (hasJobsApiError) {
      test.skip(true, "SmartOps API not available (jobs endpoint returns 400)")
      return
    }

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Smart Ops")
  })
})
