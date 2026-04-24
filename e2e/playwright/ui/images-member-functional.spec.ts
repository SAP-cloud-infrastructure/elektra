import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Images - Functional Tests (Member)
 *
 * Tests functionality of images pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT images-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Images - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)

    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/image/ng?r=/os-images/available`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Server Images & Snapshots")
    // Wait for content to load
    await page.waitForTimeout(2000)
  })

  test("can access images page", async ({ page }) => {
    // Verify images table is visible (class="table shares")
    await expect(page.locator("table.shares")).toBeVisible()
  })
})
