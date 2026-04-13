// e2e/playwright/tests/visual/styleguide/forms.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Styleguide - Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__styleguide/forms')
    await page.waitForLoadState('networkidle')
  })

  test('Full Page - All Form Components', async ({ page }) => {
    await expect(page).toHaveScreenshot('styleguide-forms-full.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Text Inputs Section', async ({ page }) => {
    const section = page.locator('#text-inputs')
    await expect(section).toHaveScreenshot('forms-text-inputs.png')
  })

  test('Validation States Section', async ({ page }) => {
    const section = page.locator('#validation-states')
    await expect(section).toHaveScreenshot('forms-validation-states.png')
  })

  test('Select Inputs Section', async ({ page }) => {
    const section = page.locator('#select-inputs')
    await expect(section).toHaveScreenshot('forms-select-inputs.png')
  })

  test('Checkboxes and Radios Section', async ({ page }) => {
    const section = page.locator('#checkboxes-radios')
    await expect(section).toHaveScreenshot('forms-checkboxes-radios.png')
  })

  test('Input Groups Section', async ({ page }) => {
    const section = page.locator('#input-groups')
    await expect(section).toHaveScreenshot('forms-input-groups.png')
  })

  test('Input Focus State', async ({ page }) => {
    const input = page.locator('#input-focus')

    // Normal state
    await expect(input).toHaveScreenshot('input-normal.png')

    // Focused state
    await input.focus()
    await page.waitForTimeout(100)
    await expect(input).toHaveScreenshot('input-focused.png')
  })

  test('Input with Value', async ({ page }) => {
    const input = page.locator('#input-normal')

    // Fill input
    await input.fill('Test Value')
    await expect(input).toHaveScreenshot('input-filled.png')
  })

  test('Error State', async ({ page }) => {
    const errorGroup = page.locator('.form-group.has-error').first()
    await expect(errorGroup).toHaveScreenshot('form-error-state.png')
  })

  test('Success State', async ({ page }) => {
    const successGroup = page.locator('.form-group.has-success').first()
    await expect(successGroup).toHaveScreenshot('form-success-state.png')
  })
})
