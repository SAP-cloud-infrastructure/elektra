// e2e/playwright/tests/visual/styleguide/buttons.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Styleguide - Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__styleguide/buttons')
    await page.waitForLoadState('networkidle')
  })

  test('Full Page - All Button Components', async ({ page }) => {
    await expect(page).toHaveScreenshot('styleguide-buttons-full.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Button Variants Section', async ({ page }) => {
    const section = page.locator('#button-variants')
    await expect(section).toHaveScreenshot('buttons-variants.png')
  })

  test('Button Sizes Section', async ({ page }) => {
    const section = page.locator('#button-sizes')
    await expect(section).toHaveScreenshot('buttons-sizes.png')
  })

  test('Button Groups Section', async ({ page }) => {
    const section = page.locator('#button-groups')
    await expect(section).toHaveScreenshot('buttons-groups.png')
  })

  test('Button Dropdowns Section', async ({ page }) => {
    const section = page.locator('#button-dropdowns')
    await expect(section).toHaveScreenshot('buttons-dropdowns.png')
  })

  test('Button States Section', async ({ page }) => {
    const section = page.locator('#button-states')
    await expect(section).toHaveScreenshot('buttons-states.png')
  })

  test('Button with Icons Section', async ({ page }) => {
    const section = page.locator('#button-icons')
    await expect(section).toHaveScreenshot('buttons-icons.png')
  })

  test('Button Hover State', async ({ page }) => {
    const button = page.locator('.btn-primary').first()

    // Normal state
    await expect(button).toHaveScreenshot('button-primary-normal.png')

    // Hover state
    await button.hover()
    await page.waitForTimeout(200)
    await expect(button).toHaveScreenshot('button-primary-hover.png')
  })
})
