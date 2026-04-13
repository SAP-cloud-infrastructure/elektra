# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual/styleguide/modals.spec.ts >> Styleguide - Modals >> Modal Backdrop
- Location: tests/visual/styleguide/modals.spec.ts:92:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#modal-default.show') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "Elektra Styleguide" [ref=e5] [cursor=pointer]:
        - /url: /__styleguide
        - strong [ref=e6]: Elektra
        - text: Styleguide
      - generic [ref=e7]:
        - list [ref=e8]:
          - listitem [ref=e9]:
            - link "Overview" [ref=e10] [cursor=pointer]:
              - /url: /__styleguide
          - listitem [ref=e11]:
            - link "Buttons" [ref=e12] [cursor=pointer]:
              - /url: /__styleguide/buttons
          - listitem [ref=e13]:
            - link "Forms" [ref=e14] [cursor=pointer]:
              - /url: /__styleguide/forms
          - listitem [ref=e15]:
            - link "Modals" [ref=e16] [cursor=pointer]:
              - /url: /__styleguide/modals
          - listitem [ref=e17]:
            - link "Tables" [ref=e18] [cursor=pointer]:
              - /url: /__styleguide/tables
          - listitem [ref=e19]:
            - link "Alerts" [ref=e20] [cursor=pointer]:
              - /url: /__styleguide/alerts
          - listitem [ref=e21]:
            - link "Navigation" [ref=e22] [cursor=pointer]:
              - /url: /__styleguide/navigation
          - listitem [ref=e23]:
            - link "Typography" [ref=e24] [cursor=pointer]:
              - /url: /__styleguide/typography
          - listitem [ref=e25]:
            - link "Panels" [ref=e26] [cursor=pointer]:
              - /url: /__styleguide/panels
        - list [ref=e27]:
          - listitem [ref=e28]:
            - generic [ref=e29]: Bootstrap 3.4.1
  - generic [ref=e32]:
    - heading "Modal Components" [level=1] [ref=e34]
    - generic [ref=e35]:
      - strong [ref=e36]: "Debug Info:"
      - text: Check the browser console (F12) for jQuery and Bootstrap status.
      - button "Test Modal (JavaScript)" [ref=e37] [cursor=pointer]
    - generic [ref=e38]:
      - heading "Modal Examples" [level=2] [ref=e39]
      - generic [ref=e40]:
        - generic [ref=e41]: Modal Triggers
        - button "Open Default Modal" [ref=e42] [cursor=pointer]
        - button "Open Large Modal" [ref=e43] [cursor=pointer]
        - button "Open Small Modal" [ref=e44] [cursor=pointer]
        - button "Open Modal with Form" [ref=e45] [cursor=pointer]
    - dialog [active] [ref=e46]:
      - document [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]:
            - button "Close" [ref=e50] [cursor=pointer]: ×
            - heading "Default Modal Title" [level=4] [ref=e51]
          - generic [ref=e52]:
            - paragraph [ref=e53]: This is a default modal dialog.
            - paragraph [ref=e54]: It contains simple text content and demonstrates the basic modal structure.
          - generic [ref=e55]:
            - button "Close" [ref=e56] [cursor=pointer]
            - button "Save Changes" [ref=e57] [cursor=pointer]
  - contentinfo [ref=e58]:
    - paragraph [ref=e60]:
      - text: Elektra Bootstrap Styleguide for Visual Regression Testing
      - text: Used for Bootstrap 3 → Bootstrap 5 Migration
```

# Test source

```ts
  1   | // e2e/playwright/tests/visual/styleguide/modals.spec.ts
  2   | import { test, expect } from '@playwright/test'
  3   | 
  4   | test.describe('Styleguide - Modals', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/__styleguide/modals')
  7   |     await page.waitForLoadState('networkidle')
  8   |   })
  9   | 
  10  |   test('Default Modal', async ({ page }) => {
  11  |     // Open modal
  12  |     await page.click('button:has-text("Open Default Modal")')
  13  | 
  14  |     // Wait for modal to be visible (Bootstrap 3 uses .in class, Bootstrap 5 uses .show)
  15  |     await page.waitForSelector('#modal-default.in, #modal-default.show', {
  16  |       timeout: 5000,
  17  |     })
  18  | 
  19  |     // Wait for animation to complete
  20  |     await page.waitForTimeout(500)
  21  | 
  22  |     // Screenshot the modal (not the whole page)
  23  |     const modal = page.locator('#modal-default')
  24  |     await expect(modal).toHaveScreenshot('modal-default.png', {
  25  |       animations: 'disabled',
  26  |     })
  27  |   })
  28  | 
  29  |   test('Large Modal', async ({ page }) => {
  30  |     await page.click('button:has-text("Open Large Modal")')
  31  |     await page.waitForSelector('#modal-large.in, #modal-large.show')
  32  |     await page.waitForTimeout(500)
  33  | 
  34  |     const modal = page.locator('#modal-large')
  35  |     await expect(modal).toHaveScreenshot('modal-large.png', {
  36  |       animations: 'disabled',
  37  |     })
  38  |   })
  39  | 
  40  |   test('Small Modal', async ({ page }) => {
  41  |     await page.click('button:has-text("Open Small Modal")')
  42  |     await page.waitForSelector('#modal-small.in, #modal-small.show')
  43  |     await page.waitForTimeout(500)
  44  | 
  45  |     const modal = page.locator('#modal-small')
  46  |     await expect(modal).toHaveScreenshot('modal-small.png', {
  47  |       animations: 'disabled',
  48  |     })
  49  |   })
  50  | 
  51  |   test('Modal with Form', async ({ page }) => {
  52  |     await page.click('button:has-text("Open Modal with Form")')
  53  |     await page.waitForSelector('#modal-form.in, #modal-form.show')
  54  |     await page.waitForTimeout(500)
  55  | 
  56  |     const modal = page.locator('#modal-form')
  57  |     await expect(modal).toHaveScreenshot('modal-form-empty.png', {
  58  |       animations: 'disabled',
  59  |     })
  60  |   })
  61  | 
  62  |   test('Modal with Form - Filled State', async ({ page }) => {
  63  |     await page.click('button:has-text("Open Modal with Form")')
  64  |     await page.waitForSelector('#modal-form.show')
  65  |     await page.waitForTimeout(500)
  66  | 
  67  |     // Fill form
  68  |     await page.fill('#instance-name', 'test-instance-01')
  69  |     await page.selectOption('#instance-flavor', 'm1.medium')
  70  |     await page.selectOption('#instance-image', { index: 1 })
  71  |     await page.check('input[type="checkbox"]')
  72  | 
  73  |     await page.waitForTimeout(200)
  74  | 
  75  |     const modal = page.locator('#modal-form')
  76  |     await expect(modal).toHaveScreenshot('modal-form-filled.png', {
  77  |       animations: 'disabled',
  78  |     })
  79  |   })
  80  | 
  81  |   test('Modal with Validation Errors', async ({ page }) => {
  82  |     await page.click('button:has-text("Open Modal with Validation")')
  83  |     await page.waitForSelector('#modal-validation.show')
  84  |     await page.waitForTimeout(500)
  85  | 
  86  |     const modal = page.locator('#modal-validation')
  87  |     await expect(modal).toHaveScreenshot('modal-validation-errors.png', {
  88  |       animations: 'disabled',
  89  |     })
  90  |   })
  91  | 
  92  |   test('Modal Backdrop', async ({ page }) => {
  93  |     await page.click('button:has-text("Open Default Modal")')
> 94  |     await page.waitForSelector('#modal-default.show')
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  95  |     await page.waitForTimeout(500)
  96  | 
  97  |     // Screenshot entire page to capture backdrop
  98  |     await expect(page).toHaveScreenshot('modal-with-backdrop.png', {
  99  |       animations: 'disabled',
  100 |     })
  101 |   })
  102 | })
  103 | 
```