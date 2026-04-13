import { test, expect } from '@playwright/test'

/**
 * Smoke test for responsive design
 * Tests that pages are accessible on different viewport sizes
 */
test.describe('Responsive Design', () => {
  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Page should be visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have mobile-friendly navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for hamburger menu or mobile navigation
    const nav = page.locator('nav, .navbar, .mobile-menu, button[aria-label*="menu"]')
    const navCount = await nav.count()

    expect(navCount).toBeGreaterThan(0)
  })
})
