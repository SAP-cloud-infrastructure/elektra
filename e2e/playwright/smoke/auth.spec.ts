import { test, expect } from "@playwright/test"

/**
 * Authentication Page Tests
 *
 * These tests verify that the authentication pages render correctly.
 * No actual login is performed - we only test the UI elements.
 *
 * Run with: pnpm e2e:smoke -- --host http://localhost:PORT auth
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("authentication pages", () => {
  test.describe("login page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`)
    })

    test("renders login form", async ({ page }) => {
      await expect(page.locator("#username")).toBeVisible()
      await expect(page.locator("#password")).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test("has username and password input fields", async ({ page }) => {
      await expect(page.locator("#username")).toHaveAttribute("type", "text")
      await expect(page.locator("#password")).toHaveAttribute("type", "password")
    })

    test("submit button is enabled", async ({ page }) => {
      await expect(page.locator('button[type="submit"]')).toBeEnabled()
    })
  })

  test.describe("login validation", () => {
    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto(`/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`)
      await page.fill("#username", "INVALID_USER_THAT_DOES_NOT_EXIST")
      await page.fill("#password", "INVALID_PASSWORD")
      await page.click('button[type="submit"]')
      await expect(page.locator("text=Invalid username/password combination.")).toBeVisible()
    })
  })

  test.describe("domain validation", () => {
    test("shows error for unsupported domain", async ({ page }) => {
      await page.goto("/BAD_DOMAIN_12345/home", { waitUntil: "domcontentloaded" })
      await expect(page.locator("text=Unsupported Domain")).toBeVisible()
    })

    test("login page handles non-existent domain gracefully", async ({ request }) => {
      const response = await request.get("/NON_EXISTENT_DOMAIN/auth/login/NON_EXISTENT_DOMAIN", {
        maxRedirects: 0,
      })
      // Should not crash - either show error or redirect
      expect([200, 302, 404]).toContain(response.status())
    })
  })
})
