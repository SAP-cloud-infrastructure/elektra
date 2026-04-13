import { test, expect } from '@playwright/test'

/**
 * Smoke test for public static assets
 * Ensures CSS, JavaScript, and images load correctly
 */
test.describe('Static Assets', () => {
  test('should load CSS without errors', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for failed CSS requests
    const failedRequests: string[] = []

    page.on('response', (response) => {
      if (response.url().match(/\.css/) && !response.ok()) {
        failedRequests.push(response.url())
      }
    })

    // Give time for all CSS to load
    await page.waitForTimeout(1000)

    expect(failedRequests).toHaveLength(0)
  })

  test('should load JavaScript without errors', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('response', (response) => {
      if (response.url().match(/\.js/) && !response.ok()) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(failedRequests).toHaveLength(0)
  })

  test('should not have broken images on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find all images
    const images = page.locator('img')
    const count = await images.count()

    if (count > 0) {
      // Check first few images loaded successfully
      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i)
        const src = await img.getAttribute('src')

        if (src && !src.startsWith('data:')) {
          // Verify image natural width > 0 (loaded successfully)
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
          expect(naturalWidth).toBeGreaterThan(0)
        }
      }
    }
  })
})
