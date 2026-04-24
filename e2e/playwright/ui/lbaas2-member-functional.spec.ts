import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Load Balancers - Functional Tests (Member)
 *
 * Tests functionality of load balancer pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT lbaas2-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Load Balancers - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access load balancers page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/lbaas2/?r=/loadbalancers`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Load Balancers")

    // Verify the table is loaded
    const table = page.locator("[data-target='table-loadbalancers']")
    await expect(table).toBeVisible()
  })

  test("search functionality exists", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/lbaas2/?r=/loadbalancers`, {
      waitUntil: "domcontentloaded",
    })

    await page.waitForTimeout(5000)

    // Verify search input is visible
    const searchInput = page.locator("input[data-test='search']")
    await expect(searchInput).toBeVisible()
  })
})
