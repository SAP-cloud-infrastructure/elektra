import { test, expect } from '@playwright/test'

/**
 * Smoke test for the homepage
 * Tests basic page load and core elements
 */
test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check page title contains "Elektra"
    await expect(page).toHaveTitle(/Elektra/i)
  })

  test('should display navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for main navigation or header
    const nav = page.locator('nav, header, .navbar')
    await expect(nav.first()).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check no critical errors occurred
    expect(errors).toHaveLength(0)
  })

  test('should respond within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})
