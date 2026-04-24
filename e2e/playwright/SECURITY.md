# Security Best Practices for Visual Regression Testing

## Problem

Visual regression screenshots can contain sensitive data:

- User IDs and names
- Email addresses
- Domain/Project IDs
- Timestamps

This data should **not** appear in screenshots stored in Git, CI/CD pipelines, or test reports.

## Solution: Automatic Security Masking

All visual regression tests use centralized security masking from `e2e/playwright/helpers/masking.ts`.

### Usage

```typescript
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

test("screenshot with masking", async ({ page }) => {
  const masks = getBasicMaskSelectors(page)

  await expect(page).toHaveScreenshot("secure.png", {
    mask: masks,
    ...SCREENSHOT_OPTIONS, // Includes black masking
  })
})
```

### Available Masking Functions

**`getSecurityMaskSelectors(page)`** - Full masking

- Use for pages with extensive sensitive data (e.g., masterdata cockpit)
- Masks: user info, emails, IDs, timestamps, cost objects, etc.

**`getBasicMaskSelectors(page)`** - Basic masking

- Use for simpler pages (e.g., API endpoints)
- Masks: user info, emails, domain/project IDs

Masked areas appear as **black boxes** in screenshots.

## Checklist Before Commit

- [ ] All email addresses masked?
- [ ] All IDs (Domain, Project, User) masked?
- [ ] No personal data visible?
- [ ] Screenshots manually reviewed?

## Common Scenarios

### Custom Masking

If you need additional masking beyond the defaults:

```typescript
const masks = [
  ...getBasicMaskSelectors(page),
  page.locator(".custom-sensitive-class"), // Add custom mask
]
```

## Adding New Tests

When creating new visual regression tests:

1. Import masking helpers:

   ```typescript
   import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"
   ```

2. Use appropriate masking function:

   ```typescript
   const masks = getBasicMaskSelectors(page) // or getSecurityMaskSelectors(page)
   ```

3. Apply masks to screenshots:
   ```typescript
   await expect(page).toHaveScreenshot("test.png", {
     mask: masks,
     ...SCREENSHOT_OPTIONS,
   })
   ```

See `api-access-visual.spec.ts` or `masterdata-visual.spec.ts` for examples.

## Resources

- [Playwright Screenshot Options](https://playwright.dev/docs/api/class-page#page-screenshot)
- [GDPR Compliance for Testing](https://gdpr.eu/test-data/)
- [OWASP Testing Guide - PII](https://owasp.org/www-project-testing/)

## Implemented In

- `e2e/playwright/helpers/masking.ts` - Centralized masking configuration
- `api-access-visual.spec.ts` - Visual tests with basic masking
- `masterdata-visual.spec.ts` - Visual tests with full security masking
