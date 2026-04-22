import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * Key Manager - Functional Tests (Member)
 *
 * Tests functionality of Key Manager pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:4001 keymanager-member-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

test.describe("Key Manager - Member", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access secrets page", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/secrets`, {
      waitUntil: "domcontentloaded",
    })

    // Wait for React widget to load
    await page.waitForTimeout(5000)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")

    // Verify toolbar is visible
    const toolbar = page.locator(".juno-datagrid-toolbar")
    await expect(toolbar).toBeVisible()
  })

  test("can access containers tab", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/containers`, {
      waitUntil: "domcontentloaded",
    })

    await page.waitForTimeout(5000)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")

    // Verify toolbar is visible
    const toolbar = page.locator(".juno-datagrid-toolbar")
    await expect(toolbar).toBeVisible()
  })

  test("can access orders tab", async ({ page }) => {
    await loginAsMember(page)
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager/orders`, {
      waitUntil: "domcontentloaded",
    })

    await page.waitForTimeout(5000)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Key Manager")

    // Verify toolbar is visible
    const toolbar = page.locator(".juno-datagrid-toolbar")
    await expect(toolbar).toBeVisible()
  })
})
