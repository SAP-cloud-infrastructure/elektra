// e2e/playwright/tests/visual/styleguide/modals.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Styleguide - Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__styleguide/modals')
    await page.waitForLoadState('networkidle')
  })

  test('Default Modal', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("Open Default Modal")')

    // Wait for modal to be visible (Bootstrap 3 uses .in class, Bootstrap 5 uses .show)
    await page.waitForSelector('#modal-default.in, #modal-default.show', {
      timeout: 5000,
    })

    // Wait for animation to complete
    await page.waitForTimeout(500)

    // Screenshot the modal (not the whole page)
    const modal = page.locator('#modal-default')
    await expect(modal).toHaveScreenshot('modal-default.png', {
      animations: 'disabled',
    })
  })

  test('Large Modal', async ({ page }) => {
    await page.click('button:has-text("Open Large Modal")')
    await page.waitForSelector('#modal-large.in, #modal-large.show')
    await page.waitForTimeout(500)

    const modal = page.locator('#modal-large')
    await expect(modal).toHaveScreenshot('modal-large.png', {
      animations: 'disabled',
    })
  })

  test('Small Modal', async ({ page }) => {
    await page.click('button:has-text("Open Small Modal")')
    await page.waitForSelector('#modal-small.in, #modal-small.show')
    await page.waitForTimeout(500)

    const modal = page.locator('#modal-small')
    await expect(modal).toHaveScreenshot('modal-small.png', {
      animations: 'disabled',
    })
  })

  test('Modal with Form', async ({ page }) => {
    await page.click('button:has-text("Open Modal with Form")')
    await page.waitForSelector('#modal-form.in, #modal-form.show')
    await page.waitForTimeout(500)

    const modal = page.locator('#modal-form')
    await expect(modal).toHaveScreenshot('modal-form-empty.png', {
      animations: 'disabled',
    })
  })

  test('Modal with Form - Filled State', async ({ page }) => {
    await page.click('button:has-text("Open Modal with Form")')
    await page.waitForSelector('#modal-form.show')
    await page.waitForTimeout(500)

    // Fill form
    await page.fill('#instance-name', 'test-instance-01')
    await page.selectOption('#instance-flavor', 'm1.medium')
    await page.selectOption('#instance-image', { index: 1 })
    await page.check('input[type="checkbox"]')

    await page.waitForTimeout(200)

    const modal = page.locator('#modal-form')
    await expect(modal).toHaveScreenshot('modal-form-filled.png', {
      animations: 'disabled',
    })
  })

  test('Modal with Validation Errors', async ({ page }) => {
    await page.click('button:has-text("Open Modal with Validation")')
    await page.waitForSelector('#modal-validation.show')
    await page.waitForTimeout(500)

    const modal = page.locator('#modal-validation')
    await expect(modal).toHaveScreenshot('modal-validation-errors.png', {
      animations: 'disabled',
    })
  })

  test('Modal Backdrop', async ({ page }) => {
    await page.click('button:has-text("Open Default Modal")')
    await page.waitForSelector('#modal-default.show')
    await page.waitForTimeout(500)

    // Screenshot entire page to capture backdrop
    await expect(page).toHaveScreenshot('modal-with-backdrop.png', {
      animations: 'disabled',
    })
  })
})
