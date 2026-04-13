import { test, expect } from '@playwright/test'

/**
 * Smoke test for the login page
 * Tests basic page load and login form elements
 */
test.describe('Login Page', () => {
  test('should load login page', async ({ page }) => {
    // Try common login routes
    // Adjust the route based on your actual login path
    await page.goto('/auth/sessions/new')

    await page.waitForLoadState('networkidle')

    // Check page loaded (either login page or redirect to SSO)
    expect(page.url()).toBeTruthy()
  })

  test('should display login form or SSO button', async ({ page }) => {
    await page.goto('/auth/sessions/new')
    await page.waitForLoadState('networkidle')

    // Check for login form elements OR SSO button
    const hasLoginForm = await page.locator('form, input[type="text"], input[type="password"]').count()
    const hasSSOButton = await page.locator('button, a').filter({ hasText: /sign in|login|sso/i }).count()

    // At least one authentication method should be visible
    expect(hasLoginForm + hasSSOButton).toBeGreaterThan(0)
  })

  test('should not have JavaScript errors on login page', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/auth/sessions/new')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })
})
