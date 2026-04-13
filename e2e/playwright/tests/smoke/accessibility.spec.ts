import { test, expect } from '@playwright/test'

/**
 * Smoke test for accessibility basics
 * Checks fundamental accessibility features
 */
test.describe('Basic Accessibility', () => {
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for main landmark
    const main = page.locator('main, [role="main"], #main')
    const mainCount = await main.count()
    expect(mainCount).toBeGreaterThanOrEqual(1)
  })

  test('should have skip links or proper heading structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for h1
    const h1 = page.locator('h1')
    const h1Count = await h1.count()

    // Page should have at least one h1 heading
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('should have proper language attribute', async ({ page }) => {
    await page.goto('/')

    // Check html lang attribute
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
  })

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find first button or link
    const button = page.locator('button, a[href]').first()

    if (await button.count() > 0) {
      // Should be able to focus
      await button.focus()

      const isFocused = await button.evaluate((el) => el === document.activeElement)
      expect(isFocused).toBe(true)
    }
  })
})
