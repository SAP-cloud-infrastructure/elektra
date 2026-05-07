import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * EmailService - Component Visual Tests (Member)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on search bar and static UI elements.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT email-service-member-component-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/email_service-member-component-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots email-service-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - EmailService Components", () => {
  test.setTimeout(60000)

  test("intro box", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email_service`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(5000)

    // Locate the intro box
    const introBox = page.locator(".juno-intro-box, [class*='intro']").first()
    await expect(introBox).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(introBox).toHaveScreenshot("email-service-intro-box.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("search bar", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email_service`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(5000)

    // Locate the search bar area
    const searchBar = page.locator("[class*='search'], form").first()
    await expect(searchBar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(searchBar).toHaveScreenshot("email-service-search-bar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
