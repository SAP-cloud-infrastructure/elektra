import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Resources - Functional Tests (Member)
 *
 * Tests functionality of resource management pages (LIMES).
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT resources-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Resources - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)

    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/resources/v2/project#/compute`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Resource Management")
    // Wait for content to load
    await page.waitForTimeout(3000)
  })

  test("can access resource management page", async ({ page }) => {
    // Page loaded - title verification is sufficient for smoke test
  })
})
