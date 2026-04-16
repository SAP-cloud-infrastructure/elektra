# E2E Testing for Elektra

This directory contains end-to-end tests for Elektra using both Cypress (legacy) and Playwright (new).

## 📁 Structure

```
e2e/
├── cypress/                    # Cypress tests (legacy, being phased out)
│   ├── integration/
│   │   ├── smoke/             # Smoke tests (no auth)
│   │   ├── member/            # Member role tests
│   │   └── admin/             # Admin role tests
│   ├── support/
│   └── cypress.config.js
├── playwright/                 # Playwright tests (new)
│   └── smoke/                 # Smoke tests (no auth)
│       ├── health.spec.ts
│       ├── landing.spec.ts
│       ├── auth.spec.ts
│       └── plugins.spec.ts
├── run.sh                     # Cypress test runner
└── run-playwright.sh          # Playwright test runner
```

## 🚀 Quick Start

### Prerequisites

**No local installation required!** Tests run in Docker containers with pre-installed browsers.

```bash
# Only needed if you want IDE autocomplete (optional):
pnpm install
```

## Playwright Tests (Recommended for New Tests)

### Running Playwright Smoke Tests

**All tests run in Docker container - no local Playwright installation needed!**

```bash
# Using npm scripts (default: http://localhost:3000)
pnpm e2e:smoke              # Chromium (default)
pnpm e2e:smoke:firefox      # Firefox
pnpm e2e:smoke:all          # All browsers

# Pass custom host via npm scripts (using -- to pass args)
pnpm e2e:smoke -- --host http://localhost:4001
pnpm e2e:smoke:firefox -- --host http://localhost:4001

# Using run-playwright.sh directly with custom host
./e2e/run-playwright.sh --host http://localhost:4001 -p smoke

# From e2e directory
cd e2e
./run-playwright.sh --host http://localhost:4001 -p smoke

# Mac users (with Docker)
./e2e/run-playwright.sh --host http://host.docker.internal:3000 -p smoke

# Run specific test
./e2e/run-playwright.sh --host http://localhost:4001 -p smoke health
./e2e/run-playwright.sh -p smoke landing  # Uses default port 3000
```

**Default host:** `http://localhost:3000` (override with `--host` parameter)

**Docker image:** `mcr.microsoft.com/playwright:v1.59.1-noble`

## Cypress Tests (Legacy)

### Running Cypress Smoke Tests

```bash
cd e2e
./run.sh --profile smoke --host http://localhost:3000

# Mac users
./run.sh --profile smoke --host http://host.docker.internal:3000
```

**Note:** The test user and credentials are only configured in QA-DE-1 for authenticated tests.

### Smoke Tests (No Authentication Required)

Both Cypress and Playwright support smoke tests that verify:

- System health endpoints (liveliness, readiness, startprobe)
- Landing page renders correctly
- All plugin routes are mounted (not 404)
- Login page renders correctly

### Environment Variables

Configure via `.env` file in project root:

```bash
# Test domain (defaults to cc3test)
TEST_DOMAIN=cc3test

# For authenticated tests (member/admin profiles):
TEST_MEMBER_USER=TEST_D021500_TM
TEST_MEMBER_PASSWORD=xxx
TEST_ADMIN_USER=TEST_D021500_TA
TEST_ADMIN_PASSWORD=xxx
```

Check `secrets/qa-de-1/values/domain-seeds.yaml` for passwords.

## Migration Status

| Test Suite | Cypress | Playwright | Notes |
|------------|---------|------------|-------|
| Smoke Tests | ✅ | ✅ | Fully migrated, both work |
| Member Tests | ✅ | ⏳ | Migration pending (auth strategy) |
| Admin Tests | ✅ | ⏳ | Migration pending (auth strategy) |

## Development Workflow

### Creating New Tests

**For new tests, use Playwright:**

Tests run in Docker, so no local Playwright installation needed. Just create `.spec.ts` files in `e2e/playwright/smoke/` (or other appropriate directory).

Example test structure:

```typescript
import { test, expect } from "@playwright/test"

test.describe("my feature", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/my-page")
    await expect(page.locator("h1")).toContainText("Expected Title")
  })
})
```

Then run via Docker:
```bash
./e2e/run-playwright.sh --host http://localhost:3000 -p smoke
```

### Debugging Tests

Tests run in Docker container. To debug:

```bash
# Run with headed mode (visible browser - requires X11 forwarding)
./e2e/run-playwright.sh --host http://localhost:3000 -p smoke --headed

# Check test results in terminal output
# Or view HTML report (generated in playwright-report/)
```

**Note:** Interactive UI mode (`--ui`) and debug mode (`--debug`) require X11 forwarding and are not typically used in Docker setups.

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Pull Playwright Docker image
  run: docker pull mcr.microsoft.com/playwright:v1.59.1-noble

- name: Run Playwright smoke tests
  run: ./e2e/run-playwright.sh --host http://localhost:3000 -p smoke
  env:
    TEST_DOMAIN: cc3test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-results
    path: e2e/playwright-results/
```

## Why Playwright?

We're migrating from Cypress to Playwright for:

1. **Better Performance** - Parallel execution by default
2. **Multi-Browser** - Chromium, Firefox, WebKit out-of-the-box
3. **Modern API** - Better TypeScript integration
4. **Auto-waiting** - More reliable, less flakiness
5. **Docker-First** - Like Cypress, runs in container (no local installation)
6. **Cost** - No Enterprise license needed for parallel tests

## Architecture

Both Cypress and Playwright follow the same pattern:

```
Host Machine
  ├── e2e/
  │   ├── cypress/           # Cypress tests
  │   ├── playwright/        # Playwright tests  
  │   ├── run.sh            # Runs Cypress in Docker
  │   └── run-playwright.sh # Runs Playwright in Docker
  │
  └── Tests execute in Docker containers:
      ├── cypress/included:15.10.0      (Cypress)
      └── playwright:v1.59.1-noble      (Playwright)
```

**No local installation of Playwright or Cypress needed** - everything runs in Docker!

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Cypress Documentation](https://docs.cypress.io/) (for legacy tests)
- Project root `CLAUDE.md` for testing conventions

## TODOs

- [ ] Migrate member tests to Playwright (pending auth strategy)
- [ ] Migrate admin tests to Playwright (pending auth strategy)
- [ ] Create authentication fixtures for Playwright
- [ ] Remove Cypress once migration is complete
- [ ] Add visual regression testing with Playwright
