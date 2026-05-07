import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Volumes - Functional Tests (Member)
 *
 * Tests functionality of volumes and snapshots pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT volumes-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Volumes - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access volumes page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage?r=/volumes`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Volumes & Snapshots")
    await page.waitForTimeout(2000)

    // Verify volumes table is visible (class="table volumes")
    await expect(page.locator("table.volumes")).toBeVisible()
  })

  test("can access snapshots page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage?r=/snapshots`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Volumes & Snapshots")
    await page.waitForTimeout(2000)

    // Verify snapshots table is visible (class="table snapshots")
    await expect(page.locator("table.snapshots")).toBeVisible()
  })
})
