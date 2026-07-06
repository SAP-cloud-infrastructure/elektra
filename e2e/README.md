# E2E Testing for Elektra

This directory contains end-to-end tests for Elektra using Playwright.

## 📁 Structure

```
e2e/
├── playwright/                 # Playwright tests
│   ├── smoke/                 # Smoke tests (no auth required)
│   │   ├── health.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── plugins.spec.ts
│   │   ├── landing-functional.spec.ts
│   │   └── landing-visual.spec.ts
│   ├── ui/                    # UI tests (requires auth + Rails in e2e mode)
│   │   ├── *-functional.spec.ts    # Functional tests (page loads, elements visible)
│   │   └── *-visual.spec.ts        # Visual regression tests (screenshots)
│   ├── helpers/
│   │   ├── auth.ts            # Login helper functions
│   │   └── masking.ts         # Security masking for screenshots
│   ├── playwright.config.ts
│   ├── SECURITY.md            # PII masking guidelines
│   └── VISUAL_REGRESSION.md   # Visual testing best practices
├── run.sh                     # Playwright test runner (uses Docker)
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

**Playwright:** Requires `@playwright/test` in `package.json` (already included). Tests run in Docker container with browsers pre-installed.

```bash
# Install dependencies (required for Playwright)
pnpm install
```

## Playwright Tests

### Running Smoke Tests (No Authentication)

Smoke tests verify basic functionality without requiring authentication or backend services.

```bash
# Using npm scripts (default: http://localhost:3000)
pnpm e2e:smoke              # Chromium (default)
pnpm e2e:smoke:firefox      # Firefox
pnpm e2e:smoke:all          # All browsers

# Custom host via npm scripts
pnpm e2e:smoke -- --host http://localhost:PORT
pnpm e2e:smoke:firefox -- --host http://localhost:PORT

# Using run.sh directly
./e2e/run.sh --host http://localhost:PORT -p smoke

# Run specific test
./e2e/run.sh --host http://localhost:PORT -p smoke health

# Mac users with Docker
./e2e/run.sh --host http://host.docker.internal:3000 -p smoke
```

**Docker image:** `mcr.microsoft.com/playwright:v1.59.1-noble`

### Running UI Tests (Requires Authentication + E2E Mode)

UI tests require Rails running in e2e mode with mock OpenStack services and test credentials.

```bash
# Terminal 1: Start Rails in e2e mode
RAILS_ENV=e2e bundle exec rails server -p 4001

# Terminal 2: Run UI tests
pnpm e2e:ui -- --host http://localhost:PORT
pnpm e2e:ui:firefox -- --host http://localhost:PORT
pnpm e2e:ui:all -- --host http://localhost:PORT

# Using run.sh directly
./e2e/run.sh --host http://localhost:PORT -p ui

# Run specific test
./e2e/run.sh --host http://localhost:PORT -p ui masterdata-admin-functional
```

### Updating Visual Snapshots

When UI changes are intentional and you need to update baselines:

```bash
# Delete old snapshots for a specific test
rm -rf e2e/playwright/ui/<test-name>.spec.ts-snapshots/

# Generate new snapshots
pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots <test-name>

# Example: Update masterdata snapshots
rm -rf e2e/playwright/ui/masterdata-admin-visual.spec.ts-snapshots/
pnpm e2e:ui -- --host http://localhost:PORT --update-snapshots masterdata-admin-visual
```

Note: if it breaks the first time let it run a second time and mostly all will be good

## Test Types

### Smoke Tests

Verify basic functionality without authentication:

- System health endpoints (liveliness, readiness, startprobe)
- Landing page rendering (including Shadow DOM)
- Plugin routes are mounted (not 404)
- Login page renders correctly
- Console error detection

### Functional Tests

Verify UI elements load and are interactive:

- Page loads successfully
- Key elements are visible
- Navigation works
- Forms are accessible
- No critical errors

### Visual Regression Tests

Capture screenshots to detect unintended UI changes:

- Full-page screenshots
- Component-level screenshots (toolbars, modals)
- Security masking (see `SECURITY.md`)
- Responsive design testing (desktop, tablet, mobile)

## Environment Configuration

Configure via `.env` file in project root:

```bash
# Test domain (defaults to cc3test if not set)
TEST_DOMAIN=cc3test

# Credentials for authenticated tests (member/admin/ui profiles)
TEST_MEMBER_USER=xxx
TEST_MEMBER_PASSWORD=xxx
TEST_ADMIN_USER=xxx
TEST_ADMIN_PASSWORD=xxx
```

## Environment Mode

Start Rails in dev mode:

```bash
bundle exec rails server -p 4001
```

Start also Javascript server:

```bash
pnpm build --watch
```

This environment is used for:

- UI rendering tests (Playwright `ui/` tests)
- Visual regression testing
- Component-level testing

## Writing New Tests

### Functional Test Pattern

```typescript
import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Plugin - Functional Tests", () => {
  test.setTimeout(60000)

  test("can access plugin page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/plugin`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("Plugin")
    await page.waitForTimeout(2000)

    // Verify key elements
    await expect(page.locator(".toolbar")).toBeVisible()
  })
})
```

### Visual Test Pattern

```typescript
import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"
import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"

test.describe("Visual Regression - Plugin", () => {
  test.setTimeout(60000)

  test("full page - masked", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/plugin`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForTimeout(2000)

    const masks = getBasicMaskSelectors(page)

    await expect(page).toHaveScreenshot("plugin-full-page.png", {
      fullPage: true,
      mask: masks,
      ...SCREENSHOT_OPTIONS,
    })
  })
})
```

## Documentation

- **[SECURITY.md](playwright/SECURITY.md)** - Guidelines for masking PII in screenshots
- **[VISUAL_REGRESSION.md](playwright/VISUAL_REGRESSION.md)** - Best practices for visual testing
- **[OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md)** - Future improvements and learnings

## Continuous Integration

Tests run in Concourse CI pipeline:

- **Smoke tests** - Run on every commit (no auth required)
- **UI tests** - Run after successful build (requires e2e environment)

Results of failed tests are uploaded to Swift object storage for review.

## Troubleshooting

### Tests Timing Out

If tests timeout frequently:

- Increase timeout in test file: `test.setTimeout(120000)`
- Check Rails server is running in correct mode
- Verify network connectivity to Rails server

### Visual Test Failures

If visual tests fail unexpectedly:

1. Review diff images in `playwright-results/`
2. Check if UI changes were intentional
3. Update snapshots if changes are expected (see "Updating Visual Snapshots")

## CI/CD Integration

Tests run in Concourse CI pipeline:

- **Smoke tests** - Run on every commit (no auth required)
- **UI tests** - Run after successful build (requires e2e environment)

Test results of failed tests are automatically uploaded to Swift object storage on failure:

- Image: see `docker/Dockerfile.ci-helper`
- Container: `playwright`
- Path: `elektra/VERSION/smoke/` or `elektra/VERSION/ui/`
