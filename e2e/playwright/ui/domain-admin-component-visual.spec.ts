import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Domain - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on sidebar navigation and infobox.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 domain-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Domain Components", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/home`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Home")
    await page.waitForTimeout(2000)
  })

  test("sidebar navigation", async ({ page }) => {
    // Screenshot the left sidebar with Requests and Projects sections
    const sidebar = page.locator(".col-md-3").first()
    await expect(sidebar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(sidebar).toHaveScreenshot("domain-sidebar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("infobox", async ({ page }) => {
    // Screenshot the right infobox with Region, Domain, Helpful Links
    const infobox = page.locator(".infobox")
    await expect(infobox).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(infobox).toHaveScreenshot("domain-infobox.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("my requests page - content", async ({ page }) => {
    await page.locator("a:has-text('My Requests')").click()
    await expect(page.locator("[data-test=page-title]")).toContainText("My Requests")
    await page.waitForTimeout(1000)

    // Screenshot the entire inquiry content section (tabs, toolbar, table)
    const inquiryContent = page.locator("div.content.inquiry")
    await expect(inquiryContent).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(inquiryContent).toHaveScreenshot("domain-my-requests-content.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
