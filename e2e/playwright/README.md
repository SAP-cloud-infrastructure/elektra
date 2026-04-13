# Elektra Playwright Tests

Smoke tests for Elektra public routes.

## Setup

```bash
# Install Playwright (from project root)
pnpm add -D @playwright/test

# Install browsers
cd e2e/playwright
npx playwright install chromium --with-deps
```

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run in UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e tests/smoke/homepage.spec.ts

# Debug a test
pnpm test:e2e:debug tests/smoke/homepage.spec.ts

# View last test report
pnpm test:e2e:report
```

## Test Structure

```
tests/
├── smoke/              # Basic smoke tests for public routes
│   ├── homepage.spec.ts
│   └── login.spec.ts
└── fixtures/           # Shared test data and helpers
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test'

test('example test', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Elektra/)
})
```

## CI Integration

Tests run automatically in GitHub Actions. See `.github/workflows/` for configuration.
