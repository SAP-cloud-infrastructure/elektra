import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Web Console - Functional Tests (Member)
 *
 * Tests functionality of Web Console (Web Shell) for member users.
 * Verifies that the shell page loads correctly.
 * Note: Shell needs up to 60 seconds to fully initialize in e2e mode.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT webconsole-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Web Console - Member", () => {
  test.setTimeout(120000) // 120 seconds (shell needs time to load)

  test("can access web console page", async ({ page }) => {
    await loginAsMember(page)

    // Navigate to web console
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/webconsole/`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Web Shell")

    // Verify page content loaded
    const pageContent = page.locator("body")
    await expect(pageContent).toBeVisible()
  })
})
