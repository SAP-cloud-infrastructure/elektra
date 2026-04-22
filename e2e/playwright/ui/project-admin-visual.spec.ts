import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

/**
 * Project - Visual Regression Tests (Admin)
 *
 * Tests visual stability of project admin home page with security masking.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT project-admin-visual
 * Update snapshots: 
 *   1. Delete old snapshots: rm -rf e2e/playwright/ui/project-admin-visual.spec.ts-snapshots/ 
 *   2. Generate new: pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots project-admin-visual
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Visual Regression - Project", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/project/home`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Overview")

    // Wait for page to be ready
    await page.waitForTimeout(2000)

    // Scroll to bottom to load all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // Scroll back to top for consistent screenshots
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
  })

  test("full page - masked", async ({ page }) => {
    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("project-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("services dropdown - masked", async ({ page }) => {
    // Click on Services dropdown to open it
    const servicesDropdown = page.locator('a.dropdown-toggle:has-text("Services")')
    await servicesDropdown.click()

    // Wait for dropdown to open
    await page.waitForTimeout(500)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("project-services-dropdown.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })

  test("your projects modal - masked", async ({ page }) => {
    // Click on the list icon to open modal
    const listIcon = page.locator('a:has(i.icon-link.fa.fa-th-list)').first()
    await listIcon.click()

    // Wait for modal to open
    await page.waitForTimeout(2000)

    // Wait for modal to be visible
    const modal = page.locator('.modal-content[role="document"]').first()
    await expect(modal).toBeVisible({ timeout: 10000 })

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("project-your-projects-modal.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
