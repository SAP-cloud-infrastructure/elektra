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
│   ├── smoke/                 # Smoke tests (no auth)
│   │   ├── health.spec.ts
│   │   ├── landing.spec.ts
│   │   ├── auth.spec.ts
│   │   └── plugins.spec.ts
│   ├── ui/                    # UI tests (requires auth + e2e mode)
│   │   └── api-access.spec.ts
│   └── helpers/
│       └── auth.ts            # Authentication helper functions
├── run.sh                     # Cypress test runner
└── run-playwright.sh          # Playwright test runner
```

## 🚀 Quick Start

### Prerequisites

**Cypress:** No local installation required - tests run in Docker container with pre-installed Cypress.

**Playwright:** Requires `@playwright/test` package in `node_modules` (already in `package.json`). The Docker container mounts the project's `node_modules` to access the Playwright test framework, while browsers are provided by the Docker image.

```bash
# For Playwright: Install dependencies (required)
pnpm install
```

## Playwright Tests (Recommended for New Tests)

### Running Playwright Smoke Tests (No Authentication)

**Playwright runs in Docker container with browsers pre-installed. The container mounts your project to access `node_modules/@playwright/test`.**

```bash
# Using npm scripts (default: http://localhost:3000)
pnpm e2e:playwright:smoke              # Chromium (default)
pnpm e2e:playwright:smoke:firefox      # Firefox
pnpm e2e:playwright:smoke:all          # All browsers

# Pass custom host via npm scripts (using -- to pass args)
pnpm e2e:playwright:smoke -- --host http://localhost:4001
pnpm e2e:playwright:smoke:firefox -- --host http://localhost:4001

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

### Running Playwright UI Tests (Requires Authentication + E2E Mode)

**UI tests require Rails running in e2e mode with mock services and test credentials in `.env` file.**

```bash
# Terminal 1: Start Rails in e2e mode (provides mock OpenStack services)
RAILS_ENV=e2e bundle exec rails server -p 4001

# Terminal 2: Run UI tests
pnpm e2e:playwright:ui -- --host http://localhost:4001
pnpm e2e:playwright:ui:firefox -- --host http://localhost:4001
pnpm e2e:playwright:ui:all -- --host http://localhost:4001

# Using run-playwright.sh directly
./e2e/run-playwright.sh --host http://localhost:4001 -p ui

# Run specific UI test
./e2e/run-playwright.sh --host http://localhost:4001 -p ui api-access
```

**Note:** UI tests use `TEST_MEMBER_USER` and `TEST_MEMBER_PASSWORD` from `.env` file.

**Default host:** `http://localhost:3000` (override with `--host` parameter)

**Docker image:** `mcr.microsoft.com/playwright:v1.59.1-noble` (browsers only, test framework from project's node_modules)

## Cypress Tests (Legacy)

### Running Cypress Smoke Tests

**Cypress runs in Docker container with everything pre-installed (no local setup needed).**

```bash
# Using npm scripts (default: http://localhost:3000)
pnpm e2e:cypress:smoke       # Smoke tests (no auth)
pnpm e2e:cypress:member      # Member role tests (requires credentials)
pnpm e2e:cypress:admin       # Admin role tests (requires credentials)

# Pass custom host via npm scripts (using -- to pass args)
pnpm e2e:cypress:smoke -- --host http://localhost:4001
pnpm e2e:cypress:member -- --host http://localhost:4001

# Using run.sh directly
cd e2e
./run.sh --profile smoke --host http://localhost:3000
./run.sh --profile member --host http://localhost:3000
./run.sh --profile admin --host http://localhost:3000

# Mac users
./run.sh --profile smoke --host http://host.docker.internal:3000
```

**Default host:** `http://localhost:3000` (override with `--host` parameter)

**Docker image:** `cypress/included:15.10.0` (complete Cypress + browsers)

**Note:** The test user and credentials are only configured in QA-DE-1 for authenticated tests.

### Smoke Tests (No Authentication Required)

Both Cypress and Playwright support smoke tests that verify:

- System health endpoints (liveliness, readiness, startprobe)
- Landing page renders correctly
- All plugin routes are mounted (not 404)
- Login page renders correctly

### Environment Variables (Needed for Login)

Configure via `.env` file in project root:

```bash
# Test domain (defaults to cc3test)
TEST_DOMAIN=cc3test

# For authenticated tests (member/admin profiles):
TEST_MEMBER_USER=xxx
TEST_MEMBER_PASSWORD=xxx
TEST_ADMIN_USER=xxx
TEST_ADMIN_PASSWORD=xxx
```

# Attempted Approaches and Learnings

We explored several approaches to expand test coverage beyond smoke tests. Without backend or login

Here's what we tried and why it didn't work:

## 1. E2E Environment with Mock Services (Abandoned)

**Goal:** Test UI rendering without requiring real OpenStack backend or authentication.

**Approach:**

- Create `config/environments/e2e.rb` environment
- Mock authentication bypass in initializer
- Provide fake data for controllers to render views
- Use NullDB adapter to avoid database requirements

**Why it failed:**

- **Database errors:** E2E environment required database configuration, NullDB adapter caused compatibility issues
- **Complex dependencies:** Views depend on many helpers, route helpers, and authentication state
- **Asset pipeline issues:** Production-like asset compilation caused errors
- **Maintenance burden:** Would require mocking every controller action's data requirements

**Conclusion:** Too many technical hurdles and ongoing maintenance for marginal benefit.

## 2. Test Renderer Controller (Abandoned)

**Goal:** Render individual HAML views in isolation with mock data.

**Approach:**

- Create `TestRendererController` that bypasses authentication
- Provide mock user and project data
- Render specific views with `render template: "plugin/view", layout: false`

**Why it failed:**

- **No CSS/JS/Layout:** Rendered plain HTML without styling or JavaScript
- **Limited value:** Testing HAML syntax without the full rendering context is not meaningful
- **Routing issues:** Views generate links that require proper route parameters
- **Incomplete representation:** Without layout, navigation, and assets, not testing real user experience

**Conclusion:** Plain HTML rendering without CSS/JS/layout is too limited to provide valuable test coverage.

## 3. Element Tests for Protected Pages (Abandoned)

**Goal:** Test that specific UI elements (buttons, forms, tables) exist on plugin pages.

**Approach:**

- Write Playwright tests that navigate to plugin pages and assert element presence
- Test Masterdata Cockpit page for sections, labels, help icons, etc.

**Why it failed:**

- **Authentication required:** Plugin pages return 404 or redirect to login without authentication
- **Cannot mock API responses in browser:** Many React plugins call APIs directly from browser (not via Rails), would need different mocking strategy per plugin type
- **VCR/Mock complexity:**
  - Some plugins (HAML-based) make API calls via Rails backend
  - Other plugins (React-based like kubernetes_ng, object_storage) call APIs directly from browser
  - Would require two different mocking strategies (backend + frontend)
  - Maintenance nightmare keeping mocks in sync with real APIs

**Conclusion:** Element testing for authenticated pages requires authentication. Mocking the full API surface across different plugin architectures is not feasible.

## What Works: Smoke Tests

The **42 Smoke Tests** provide solid UI integrity coverage without authentication:

✅ **Health Endpoints** - Verify application health checks  
✅ **Landing Page** - Full rendering test with CSS/JS/layout (including Shadow DOM)  
✅ **Authentication Pages** - Login form, validation, error handling  
✅ **Plugin Routes** - All 27 plugins mounted and accessible (not 404)  
✅ **JavaScript Errors** - Console error detection  
✅ **Server Errors** - No 500 errors on smoke test pages

These tests run in Docker containers without requiring:

- OpenStack backend
- Authentication/login
- Database seeding
- Mock services
