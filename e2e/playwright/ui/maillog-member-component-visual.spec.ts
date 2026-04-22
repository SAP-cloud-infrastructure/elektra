import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Maillog - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on search bar and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 maillog-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Maillog Components", () => {
  test.setTimeout(60000)

  test("intro box", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/maillog`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(5000)

    // Locate the intro box
    const introBox = page.locator(".juno-intro-box, [class*='intro']").first()
    await expect(introBox).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(introBox).toHaveScreenshot("maillog-intro-box.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("search bar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/maillog`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(5000)

    // Locate the search bar area
    const searchBar = page.locator("[class*='search'], form").first()
    await expect(searchBar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(searchBar).toHaveScreenshot("maillog-search-bar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
