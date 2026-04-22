import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * DNS Service - Functional Tests (Member)
 *
 * Tests functionality of DNS service pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT dns-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("DNS Service - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access dns zones page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/dns-service/zones`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("DNS")
    await page.waitForTimeout(2000)

    // Verify search form is visible
    await expect(page.locator('input[name="search"]')).toBeVisible()
  })
})
