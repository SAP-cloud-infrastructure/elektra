# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke/accessibility.spec.ts >> Basic Accessibility >> should have proper language attribute
- Location: tests/smoke/accessibility.spec.ts:30:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: null
```

# Page snapshot

```yaml
- generic [ref=e7]:
  - banner [ref=e8]:
    - generic [ref=e9]:
      - img "SAP_grad_R_scrn_Zeichenfläche 1" [ref=e11]
      - generic [ref=e14]:
        - generic [ref=e15]: Cloud Infrastructure
        - button "Log in Log in" [ref=e18] [cursor=pointer]:
          - img "Log in" [ref=e20]
          - text: Log in
  - generic [ref=e23]:
    - generic [ref=e25]:
      - generic [ref=e26]: SAP's strategic Infrastructure-as-a-Service (IaaS) stack, optimized for SAP solutions, running purely in SAP datacenters.
      - generic [ref=e27]:
        - button "Enter MONSOON3 Enter MONSOON3" [ref=e28] [cursor=pointer]:
          - img "Enter MONSOON3" [ref=e30]
          - text: Enter MONSOON3
        - link "Location Wrong domain?" [ref=e32] [cursor=pointer]:
          - /url: "#"
          - img "Location" [ref=e34]
          - text: Wrong domain?
    - generic [ref=e38]:
      - generic [ref=e39]:
        - link "QA-DE-1" [ref=e40] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e41]: QA-DE-1
        - link "QA-DE-2" [ref=e42] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e43]: QA-DE-2
        - link "QA-DE-3" [ref=e44] [cursor=pointer]:
          - /url: "#"
          - generic [ref=e45]: QA-DE-3
      - img [ref=e46]
  - generic [ref=e605]:
    - generic [ref=e606]:
      - img [ref=e607]
      - heading "Documentation Detailed information" [level=5] [ref=e616]:
        - text: Documentation
        - text: Detailed information
      - paragraph [ref=e617]: The documentation has detailed information about all the services that SAP Cloud Infrastructure offers including how-tos and tutorials.
      - button "Read the documentation Read the documentation" [ref=e619] [cursor=pointer]:
        - img "Read the documentation" [ref=e621]
        - text: Read the documentation
    - generic [ref=e623]:
      - img [ref=e624]
      - heading "Join the community Ask questions and connect with others" [level=5] [ref=e632]:
        - text: Join the community
        - text: Ask questions and connect with others
      - paragraph [ref=e633]: "Join the #sap-cc-users channel on Slack to connect with other users or ask questions."
      - button "Find our Slack channel Find our Slack channel" [ref=e635] [cursor=pointer]:
        - img "Find our Slack channel" [ref=e637]
        - text: Find our Slack channel
    - generic [ref=e639]:
      - img [ref=e640]
      - heading "Need help? Contact our support team *" [level=5] [ref=e647]:
        - text: Need help?
        - text: Contact our support team *
      - paragraph [ref=e648]: Our support team is available during EMEA business hours and for emergencies we offer 24/7 premium support.
      - button "Contact our support Contact our support" [ref=e650] [cursor=pointer]:
        - img "Contact our support" [ref=e652]
        - text: Contact our support
    - link "* Premium 24 hour emergency support For emergencies in productive systems. Exit to app Learn more" [ref=e654] [cursor=pointer]:
      - /url: https://documentation.global.cloud.sap/docs/customer/docs/support/service-now-ticket-creation/support-prod-sys-down/
      - generic [ref=e655]:
        - generic [ref=e656]: "*"
        - generic [ref=e657]:
          - generic [ref=e658]: Premium 24 hour emergency support
          - text: For emergencies in productive systems.
        - generic [ref=e659]:
          - img "Exit to app" [ref=e661]
          - generic [ref=e663]: Learn more
  - contentinfo [ref=e664]:
    - img [ref=e665]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * Smoke test for accessibility basics
  5  |  * Checks fundamental accessibility features
  6  |  */
  7  | test.describe('Basic Accessibility', () => {
  8  |   test('should have proper document structure', async ({ page }) => {
  9  |     await page.goto('/')
  10 |     await page.waitForLoadState('networkidle')
  11 | 
  12 |     // Check for main landmark
  13 |     const main = page.locator('main, [role="main"], #main')
  14 |     const mainCount = await main.count()
  15 |     expect(mainCount).toBeGreaterThanOrEqual(1)
  16 |   })
  17 | 
  18 |   test('should have skip links or proper heading structure', async ({ page }) => {
  19 |     await page.goto('/')
  20 |     await page.waitForLoadState('networkidle')
  21 | 
  22 |     // Check for h1
  23 |     const h1 = page.locator('h1')
  24 |     const h1Count = await h1.count()
  25 | 
  26 |     // Page should have at least one h1 heading
  27 |     expect(h1Count).toBeGreaterThanOrEqual(1)
  28 |   })
  29 | 
  30 |   test('should have proper language attribute', async ({ page }) => {
  31 |     await page.goto('/')
  32 | 
  33 |     // Check html lang attribute
  34 |     const lang = await page.locator('html').getAttribute('lang')
> 35 |     expect(lang).toBeTruthy()
     |                  ^ Error: expect(received).toBeTruthy()
  36 |     expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
  37 |   })
  38 | 
  39 |   test('interactive elements should be keyboard accessible', async ({ page }) => {
  40 |     await page.goto('/')
  41 |     await page.waitForLoadState('networkidle')
  42 | 
  43 |     // Find first button or link
  44 |     const button = page.locator('button, a[href]').first()
  45 | 
  46 |     if (await button.count() > 0) {
  47 |       // Should be able to focus
  48 |       await button.focus()
  49 | 
  50 |       const isFocused = await button.evaluate((el) => el === document.activeElement)
  51 |       expect(isFocused).toBe(true)
  52 |     }
  53 |   })
  54 | })
  55 | 
```