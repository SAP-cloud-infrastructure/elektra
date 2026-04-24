import { Page } from "@playwright/test"

/**
 * Authentication helper for Playwright tests
 * Provides login functionality similar to Cypress custom commands
 */

interface LoginOptions {
  domain?: string
}

/**
 * Perform login with member user credentials from environment
 *
 * @param page - Playwright page object
 * @param options - Optional configuration (domain override)
 */
export async function loginAsMember(page: Page, options: LoginOptions = {}) {
  const domain = options.domain || process.env.TEST_DOMAIN || "cc3test"
  const username = process.env.TEST_MEMBER_USER
  const password = process.env.TEST_MEMBER_PASSWORD

  if (!username || !password) {
    throw new Error("TEST_MEMBER_USER and TEST_MEMBER_PASSWORD must be set in environment")
  }

  await elektraLogin(page, domain, username, password)
}

/**
 * Perform login with admin user credentials from environment
 *
 * @param page - Playwright page object
 * @param options - Optional configuration (domain override)
 */
export async function loginAsAdmin(page: Page, options: LoginOptions = {}) {
  const domain = options.domain || process.env.TEST_DOMAIN || "cc3test"
  const username = process.env.TEST_ADMIN_USER
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!username || !password) {
    throw new Error("TEST_ADMIN_USER and TEST_ADMIN_PASSWORD must be set in environment")
  }

  await elektraLogin(page, domain, username, password)
}

/**
 * Core login function - performs the actual login steps
 *
 * @param page - Playwright page object
 * @param domain - The domain to login to
 * @param username - The username
 * @param password - The password
 */
async function elektraLogin(page: Page, domain: string, username: string, password: string) {
  // Navigate to login page
  await page.goto(`/${domain}/auth/login/${domain}`)

  // Fill in credentials
  await page.fill("#username", username)
  await page.fill("#password", password)

  // Submit login form
  await page.click('button[type="submit"]')

  // Check if login failed
  const bodyText = await page.locator("body").textContent()
  if (bodyText?.includes("Invalid username/password combination.")) {
    throw new Error("Login failed: Invalid credentials")
  }

  // Navigate to domain home page
  await page.goto(`/${domain}/home`)

  // Handle Terms of Service if present
  const tosCheckbox = page.locator("input#accept_tos")
  const isVisible = await tosCheckbox.isVisible().catch(() => false)

  if (isVisible) {
    await tosCheckbox.check()
    await page.locator('input:has-text("Accept")').click()
  }
}
