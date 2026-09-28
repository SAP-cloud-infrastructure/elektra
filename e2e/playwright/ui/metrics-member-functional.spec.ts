import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Metrics - Functional Tests (Member)
 *
 * Tests functionality of metrics page.
 * Verifies that page loads and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT metrics-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Metrics - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access metrics page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/metrics/`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Metrics")
    await page.waitForTimeout(2000)

    // Verify "Open Maia Dashboard" link is visible
    await expect(page.locator("a:has-text('Open Maia Dashboard')")).toBeVisible()
  })
})
