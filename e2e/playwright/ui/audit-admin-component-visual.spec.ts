import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Audit - Component Visual Tests (Admin)
 *
 * Tests visual stability of specific UI components (not dynamic data).
 * Focuses on toolbars, filters, and static UI elements.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 audit-admin-component-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Visual Regression - Audit Components", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/audit/`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Audit Log")
    // Wait longer for audit widget to load
    await page.waitForTimeout(3000)
  })

  test("search bar", async ({ page }) => {
    const searchBar = page.locator(".search-bar")
    await expect(searchBar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(searchBar).toHaveScreenshot("audit-search-bar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("filter toolbar", async ({ page }) => {
    const toolbar = page.locator(".toolbar.toolbar-controlcenter.audit")
    await expect(toolbar).toBeVisible()

    const masks = getBasicMaskSelectors(page)

    await expect(toolbar).toHaveScreenshot("audit-filter-toolbar.png", {
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
