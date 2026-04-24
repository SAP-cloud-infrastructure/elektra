import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Project - Functional Tests (Admin)
 *
 * Tests functionality of project admin home page.
 * Verifies that page loads and basic UI elements are visible.
 *
 * Run with: pnpm e2e:ui -- --host http://localhost:PORT project-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Project - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/project/home`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Project Overview")
    await page.waitForTimeout(2000)
  })

  test("can access project home page", async ({ page }) => {
    // Page already loaded in beforeEach
    // Verify navigation sidebar is visible
    const navigation = page.locator(".col-md-9").first()
    await expect(navigation).toBeVisible()
  })

  test("project info panel visible", async ({ page }) => {
    // Verify project info box is visible with project details
    const infobox = page.locator(".infobox")
    await expect(infobox).toBeVisible()
    await expect(infobox.locator("th:has-text('Name:')")).toBeVisible()
    await expect(infobox.locator("th:has-text('Description:')")).toBeVisible()
  })

  test("sub projects section visible", async ({ page }) => {
    // Verify sub projects section is visible
    await expect(page.locator("h4:has-text('Sub Projects')")).toBeVisible()
  })
})
