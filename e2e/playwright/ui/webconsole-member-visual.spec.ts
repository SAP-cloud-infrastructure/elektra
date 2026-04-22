import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Web Console - Visual Tests (Member)
 *
 * Tests visual stability of Web Console (Web Shell) with security masking.
 * The shell needs up to 60 seconds to initialize and show the prompt.
 * Expected prompt format: "qa-de-1 > cc3test > test >" rendered in .xterm-screen div.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT webconsole-member-visual
 * Update snapshots:
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/webconsole-member-visual.spec.ts-snapshots/
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots webconsole-member-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Web Console", () => {
  test.setTimeout(180000) // 180 seconds (shell needs time to load)

  test("full page with loaded shell - masked", async ({ page }) => {
    await loginAsMember(page)

    // Navigate to web console
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/webconsole/`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Web Shell")

    // Wait for initial page load
    await page.waitForTimeout(5000)

    // Check if shell is still pending
    const pendingMessage = page.locator("text=/shell is pending, please try again later/i")
    let hasPendingMessage = await pendingMessage.isVisible().catch(() => false)

    if (hasPendingMessage) {
      // Wait for shell to be ready
      await page.waitForTimeout(60000) // Wait 60 seconds

      // Reload the page
      await page.reload({ waitUntil: "domcontentloaded" })

      // Wait after reload
      await page.waitForTimeout(5000)

      // Check again if still pending
      hasPendingMessage = await pendingMessage.isVisible().catch(() => false)

      if (hasPendingMessage) {
        await page.waitForTimeout(45000) // Wait another 45 seconds

        // Reload again
        await page.reload({ waitUntil: "domcontentloaded" })
        await page.waitForTimeout(5000)
      }
    }

    // Wait for xterm screen to potentially load
    const xtermScreen = page.locator(".xterm-screen")
    const hasXterm = await xtermScreen.isVisible().catch(() => false)

    if (hasXterm) {
      // Additional wait to ensure shell prompt is rendered
      await page.waitForTimeout(5000)
    } else {
      // Wait 30 more seconds for shell to fully initialize
      await page.waitForTimeout(30000)

      // Check again for xterm screen
      const hasXtermNow = await xtermScreen.isVisible().catch(() => false)
      if (hasXtermNow) {
        await page.waitForTimeout(5000)
      }
    }

    // Take screenshot with masking
    const masks = getBasicMaskSelectors(page)

    // Additionally mask the entire xterm terminal (external service, only test Elektra UI)
    masks.push(page.locator("#webconsole-container"))

    await expect(page).toHaveScreenshot("webconsole-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
