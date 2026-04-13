# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke/login.spec.ts >> Login Page >> should display login form or SSO button
- Location: tests/smoke/login.spec.ts:19:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - link "Cloud Infrastructure" [ref=e5] [cursor=pointer]:
      - /url: http://localhost:4001/monsoon3
      - text: Cloud Infrastructure
  - generic [ref=e8]:
    - heading "Page Not Found" [level=3] [ref=e9]
    - paragraph [ref=e10]: The page you are looking for cannot be found.
  - contentinfo [ref=e11]:
    - img [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * Smoke test for the login page
  5  |  * Tests basic page load and login form elements
  6  |  */
  7  | test.describe('Login Page', () => {
  8  |   test('should load login page', async ({ page }) => {
  9  |     // Try common login routes
  10 |     // Adjust the route based on your actual login path
  11 |     await page.goto('/auth/sessions/new')
  12 | 
  13 |     await page.waitForLoadState('networkidle')
  14 | 
  15 |     // Check page loaded (either login page or redirect to SSO)
  16 |     expect(page.url()).toBeTruthy()
  17 |   })
  18 | 
  19 |   test('should display login form or SSO button', async ({ page }) => {
  20 |     await page.goto('/auth/sessions/new')
  21 |     await page.waitForLoadState('networkidle')
  22 | 
  23 |     // Check for login form elements OR SSO button
  24 |     const hasLoginForm = await page.locator('form, input[type="text"], input[type="password"]').count()
  25 |     const hasSSOButton = await page.locator('button, a').filter({ hasText: /sign in|login|sso/i }).count()
  26 | 
  27 |     // At least one authentication method should be visible
> 28 |     expect(hasLoginForm + hasSSOButton).toBeGreaterThan(0)
     |                                         ^ Error: expect(received).toBeGreaterThan(expected)
  29 |   })
  30 | 
  31 |   test('should not have JavaScript errors on login page', async ({ page }) => {
  32 |     const errors: string[] = []
  33 | 
  34 |     page.on('console', (msg) => {
  35 |       if (msg.type() === 'error') {
  36 |         errors.push(msg.text())
  37 |       }
  38 |     })
  39 | 
  40 |     await page.goto('/auth/sessions/new')
  41 |     await page.waitForLoadState('networkidle')
  42 | 
  43 |     expect(errors).toHaveLength(0)
  44 |   })
  45 | })
  46 | 
```