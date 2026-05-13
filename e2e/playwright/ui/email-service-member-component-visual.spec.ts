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
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/email-service-member-component-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots email-service-member-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - EmailService Components", () => {
  test.setTimeout(60000)

  test("maillog search form", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/email-service`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(5000)

    // Click on Maillog tab to see the maillog content
    const maillogTab = page.locator('text="Maillog"')
    await maillogTab.click()

    // Wait for maillog content to load
    await page.waitForTimeout(2000)

    // Locate the entire search form (juno-form component)
    const searchForm = page.locator('.juno-form').first()
    await expect(searchForm).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(searchForm).toHaveScreenshot("email-service-maillog-form.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
