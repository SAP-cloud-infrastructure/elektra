# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke/homepage.spec.ts >> Homepage >> should display navigation
- Location: tests/smoke/homepage.spec.ts:19:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('nav, header, .navbar').first()
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav, header, .navbar').first()
    9 × locator resolved to <nav class="tw-w-full tw-border-b-2 tw-border-juno-grey-light-8 tw-mb-8">…</nav>
      - unexpected value "hidden"

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
  4  |  * Smoke test for the homepage
  5  |  * Tests basic page load and core elements
  6  |  */
  7  | test.describe('Homepage', () => {
  8  |   test('should load successfully', async ({ page }) => {
  9  |     // Navigate to homepage
  10 |     await page.goto('/')
  11 | 
  12 |     // Wait for page to be fully loaded
  13 |     await page.waitForLoadState('networkidle')
  14 | 
  15 |     // Check page title contains "Elektra"
  16 |     await expect(page).toHaveTitle(/Elektra/i)
  17 |   })
  18 | 
  19 |   test('should display navigation', async ({ page }) => {
  20 |     await page.goto('/')
  21 |     await page.waitForLoadState('networkidle')
  22 | 
  23 |     // Check for main navigation or header
  24 |     const nav = page.locator('nav, header, .navbar')
> 25 |     await expect(nav.first()).toBeVisible()
     |                               ^ Error: expect(locator).toBeVisible() failed
  26 |   })
  27 | 
  28 |   test('should not have console errors', async ({ page }) => {
  29 |     const errors: string[] = []
  30 | 
  31 |     // Capture console errors
  32 |     page.on('console', (msg) => {
  33 |       if (msg.type() === 'error') {
  34 |         errors.push(msg.text())
  35 |       }
  36 |     })
  37 | 
  38 |     await page.goto('/')
  39 |     await page.waitForLoadState('networkidle')
  40 | 
  41 |     // Check no critical errors occurred
  42 |     expect(errors).toHaveLength(0)
  43 |   })
  44 | 
  45 |   test('should respond within acceptable time', async ({ page }) => {
  46 |     const startTime = Date.now()
  47 | 
  48 |     await page.goto('/')
  49 |     await page.waitForLoadState('networkidle')
  50 | 
  51 |     const loadTime = Date.now() - startTime
  52 | 
  53 |     // Page should load within 5 seconds
  54 |     expect(loadTime).toBeLessThan(5000)
  55 |   })
  56 | })
  57 | 
```