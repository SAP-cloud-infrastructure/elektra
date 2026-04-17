import { test, expect } from "@playwright/test"

/**
 * Landing Page - Functional Tests
 *
 * Tests functionality of landing page and public-facing pages.
 * No authentication required for these tests.
 *
 * Run with: pnpm e2e:playwright:smoke -- landing-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Landing Page - Functional", () => {
  test.describe("root page", () => {
    test("loads and renders react app", async ({ page }) => {
      await page.goto("/")
      // React app should render content inside shadow DOM
      const root = page.locator('[id="root"]')
      const shadowHost = root.locator('[data-shadow-host="true"]')
      await expect(shadowHost).toBeVisible()

      // Check shadow DOM content using evaluate
      const hasContent = await shadowHost.evaluate((el) => {
        return el.shadowRoot?.textContent?.includes("SAP Cloud Infrastructure") || false
      })
      expect(hasContent).toBe(true)
    })

    test("has a login button", async ({ page }) => {
      await page.goto("/")
      const root = page.locator('[id="root"]')
      const shadowHost = root.locator('[data-shadow-host="true"]')

      // Check for button in shadow DOM using evaluate
      const hasButton = await shadowHost.evaluate((el) => {
        return el.shadowRoot?.querySelector("button") !== null
      })
      expect(hasButton).toBe(true)
    })
  })

  test.describe("domain access without auth", () => {
    test("shows login button when visiting domain without auth", async ({ page }) => {
      await page.goto(`/${TEST_DOMAIN}`)
      // Wait a bit for the page to load
      await page.waitForTimeout(500)
      await expect(page.getByRole("button", { name: /log in/i })).toBeVisible()
    })

    test("redirects to login when visiting domain home without auth", async ({ page }) => {
      await page.goto(`/${TEST_DOMAIN}/home/`)
      await expect(page.locator("text=Please sign in")).toBeVisible()
    })
  })

  test.describe("error handling", () => {
    test("shows unsupported domain error for invalid domain", async ({ page }) => {
      await page.goto("/BAD_DOMAIN_THAT_DOES_NOT_EXIST/home", { waitUntil: "domcontentloaded" })
      await expect(page.locator("text=Unsupported Domain")).toBeVisible()
    })
  })
})
