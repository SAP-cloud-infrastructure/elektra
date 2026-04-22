# Visual Regression Testing

Visual regression testing captures screenshots of your UI and compares them against baseline images to detect visual changes after code modifications, Bootstrap upgrades, or CSS updates.

## Quick Start

### 1. Create Baseline Screenshots

Before making changes (e.g., Bootstrap upgrade), create baseline screenshots:

```bash
# Start Rails in e2e mode
bundle exec rails server -p PORT

# Create baselines (in another terminal)
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>
```

### 2. Make Your Changes

- Upgrade Bootstrap
- Modify CSS
- Change HTML structure

### 3. Run Visual Tests

```bash
pnpm e2e:playwright:ui -- --host http://localhost:PORT <test-name>
```

### 4. Review Differences

If tests fail (visual differences detected):

```bash
npx playwright show-report
```

The report shows:

- ✅ **Expected**: Original baseline
- ❌ **Actual**: Current screenshot
- 🔍 **Diff**: Highlighted differences

### 5. Update Baselines (if changes are intentional)

```bash
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>
```

### 6. Recreating Baselines After Masking Changes

**Important:** When you change the masking logic (e.g., adding new selectors to mask in `masking.ts`), the `--update-snapshots` flag alone will NOT recreate the snapshots properly. You must delete the old snapshots first.

**Example: After adding "Token expires at:" masking**

```bash
# Step 1: Delete old snapshots
rm -rf e2e/playwright/ui/api-access-visual.spec.ts-snapshots/

# Step 2: Create new snapshots (writes -actual.png files)
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots api-access-visual

# Step 3: Accept new baselines (converts -actual.png to baseline)
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots api-access-visual
```

**Why is this necessary?**

- `--update-snapshots` only updates existing snapshot files
- When masking logic changes, the old snapshots still have unmasked content
- Deleting forces Playwright to create completely new snapshots with the new masking applied

**When to use this approach:**

- ✅ After modifying `masking.ts` (adding/removing mask selectors)
- ✅ After changing `SCREENSHOT_OPTIONS` (mask color, diff ratio)
- ✅ When snapshots are consistently failing despite being visually correct
- ❌ Not needed for normal CSS/HTML changes (regular `--update-snapshots` is fine)

## Available Test Suites

### Static Pages (Full-Page Visual Tests)

**Landing Page**

```bash
pnpm e2e:playwright:ui -- --host http://localhost:PORT landing-visual
```

**Masterdata Cockpit**

```bash
# Visual regression tests (10 tests)
pnpm e2e:playwright:ui -- --host http://localhost:PORT masterdata-visual
```

**API Access**

```bash
# Visual regression tests (5 tests)
pnpm e2e:playwright:ui -- --host http://localhost:PORT api-access-visual
```

**Domain Home (Admin)**

```bash
# Visual regression tests (3 tests)
pnpm e2e:playwright:ui -- --host http://localhost:PORT domain-admin-visual
```

### Dynamic Pages (Component-Level Visual Tests)

**Audit (Admin)**

```bash
# Component visual tests (2 tests: search bar, filter toolbar)
pnpm e2e:playwright:ui -- --host http://localhost:PORT audit-admin-component-visual
```

**Volumes (Member)**

```bash
# Component visual tests (2 tests: volumes toolbar, snapshots toolbar)
pnpm e2e:playwright:ui -- --host http://localhost:PORT volumes-member-component-visual
```

**Images (Member)**

```bash
# Component visual tests (1 test: search toolbar)
pnpm e2e:playwright:ui -- --host http://localhost:PORT images-member-component-visual
```

### All Visual Tests

```bash
pnpm e2e:playwright:ui -- --host http://localhost:PORT
```

## Configuration

Visual tests use centralized configuration from `e2e/playwright/helpers/masking.ts`:

- **Mask Color**: Black (`#000000`)
- **Max Diff Ratio**: 3% (`0.03`)
- **Security Masking**: Automatic masking of sensitive data (IDs, emails, usernames)

## What Gets Tested

We use **two different approaches** depending on whether the page has static or dynamic data:

### Full-Page Visual Tests (Static Pages)

For pages with **static, predictable content** (e.g., landing pages, settings pages):

- ✅ **Layout & Structure** - Grid system, sections, alignment
- ✅ **Typography** - Font sizes, weights, line heights
- ✅ **Colors** - Background, text, border colors
- ✅ **Spacing** - Margins, padding, gaps
- ✅ **Components** - Buttons, modals, icons, forms
- ✅ **Responsive Design** - Desktop, tablet layouts
- ✅ **Multiple viewports** - Full page and viewport screenshots

**Examples:**

- Landing page (full page + viewport + mobile)
- Masterdata Cockpit (full page + viewport + tabs)
- API Access (full page + viewport + modals)
- Domain home page (full page + viewport)

### Component-Level Visual Tests (Dynamic Pages)

For pages with **dynamic, changing data** (e.g., resource lists, audit logs):

- ✅ **Static UI Components** - Toolbars, search bars, filter controls
- ✅ **Navigation Elements** - Tabs, breadcrumbs
- ❌ **NOT table headers** - These can fail due to dynamic column rendering
- ❌ **NOT data rows** - These change constantly and would cause false positives

**Why component-level?** Full-page screenshots of data lists fail whenever data changes (new resources, deleted items, different timestamps). Component-level tests focus on the **UI structure**, not the data.

**What to test:**

- **Toolbars and search bars** - These are stable UI elements that rarely change
- **Filter controls** - Dropdowns, buttons for filtering
- **Static navigation** - Tabs, breadcrumbs

**What NOT to test:**

- **Table headers** - Can fail due to dynamic column rendering or sorting states
- **Data rows** - Change with every data modification
- **Timestamps or counts** - Always changing

**Examples:**

- Audit logs: search bar, filter toolbar
- Volumes: volumes toolbar, snapshots toolbar
- Images: search toolbar

**Pattern:**

```typescript
// ✅ Good: Test toolbar component
const toolbar = page.locator(".toolbar").first()
await expect(toolbar).toHaveScreenshot("volumes-toolbar.png", {
  mask: masks,
  ...SCREENSHOT_OPTIONS,
})

// ❌ Bad: Test table header
// Table headers can fail due to sorting states or dynamic rendering
const tableHeader = page.locator("table.volumes thead")
await expect(tableHeader).toHaveScreenshot("volumes-table-header.png")

// ❌ Bad: Test entire table with data rows
// This will fail every time data changes!
const table = page.locator("table.volumes")
await expect(table).toHaveScreenshot("volumes-full-table.png")
```

## Security

All visual tests use automatic security masking to prevent sensitive data from being committed:

- User IDs and names
- Email addresses
- Domain/Project IDs
- Timestamps

Masked areas appear as black boxes in screenshots. See `SECURITY.md` for details.

## Bootstrap Upgrade Workflow

### Before Upgrade

```bash
# Create baselines
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots

# Commit baselines
git add e2e/playwright/ui/*-snapshots
git commit -m "chore: add visual regression baselines before bootstrap upgrade"
```

### After Upgrade

```bash
# Upgrade Bootstrap
pnpm add bootstrap@5.x.x

# Run visual tests
pnpm e2e:playwright:ui -- --host http://localhost:PORT

# Review report
npx playwright show-report

# If changes look good, update baselines
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots
```

## Troubleshooting

### Tests fail with small differences

Some differences are expected due to font rendering or anti-aliasing. Increase `maxDiffPixelRatio` in the test if needed.

### Tests are flaky

Add wait times for animations:

```typescript
await page.waitForTimeout(1000) // Wait for animations
```

### Screenshots look different on CI vs local

Use Docker container for consistency (already configured in our setup).

### Tests fail consistently after masking changes

If you modified `masking.ts` to add/remove mask selectors and tests are now failing, you need to **recreate the baselines completely**:

```bash
# Delete old snapshots
rm -rf e2e/playwright/ui/<test-name>-snapshots/

# Create new snapshots (2-step process)
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>
pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>
```

See "Recreating Baselines After Masking Changes" section above for details.

### Dynamic content keeps failing tests

If you see text like "Token expires at:" or timestamps that change with every test run:

1. Add a mask selector in `masking.ts`:
   ```typescript
   page.locator("text=/Token expires at:/i")
   ```
2. Delete and recreate all affected baselines (see above)

## Adding New Visual Tests

### Decision: Full-Page vs Component-Level?

**Use Full-Page Visual Tests when:**

- Page has **static content** (no dynamic lists)
- Content is **predictable** (same every time)
- Examples: landing pages, settings, documentation, forms

**Use Component-Level Visual Tests when:**

- Page has **dynamic data** (resource lists, audit logs)
- Data **changes frequently** (new items, deletions, updates)
- Examples: volumes, images, instances, audit logs, any CRUD list view

### Creating Full-Page Visual Tests

1. Create new test file: `<feature>-<role>-visual.spec.ts`
2. Import masking helpers:
   ```typescript
   import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"
   ```
3. Test multiple viewports:

   ```typescript
   test("full page - masked", async ({ page }) => {
     const masks = getBasicMaskSelectors(page)
     await expect(page).toHaveScreenshot("<feature>-full-page.png", {
       fullPage: true,
       mask: masks,
       ...SCREENSHOT_OPTIONS,
     })
   })

   test("viewport - masked", async ({ page }) => {
     const masks = getBasicMaskSelectors(page)
     await expect(page).toHaveScreenshot("<feature>-viewport.png", {
       mask: masks,
       ...SCREENSHOT_OPTIONS,
     })
   })
   ```

See `landing-visual.spec.ts`, `masterdata-visual.spec.ts`, or `domain-admin-visual.spec.ts` for examples.

### Creating Component-Level Visual Tests

1. Create new test file: `<feature>-<role>-component-visual.spec.ts`
2. **Read the plugin code** to identify correct selectors:
   ```bash
   # Find the React component
   plugins/<plugin>/app/javascript/widgets/app/components/<feature>/list.jsx
   ```
3. Test individual UI components:

   ```typescript
   test("search toolbar", async ({ page }) => {
     // Target specific toolbar, not entire page
     const toolbar = page.locator(".toolbar").first()
     await expect(toolbar).toBeVisible()

     const masks = getBasicMaskSelectors(page)
     await expect(toolbar).toHaveScreenshot("<feature>-toolbar.png", {
       mask: masks,
       ...SCREENSHOT_OPTIONS,
     })
   })

   test("filter controls", async ({ page }) => {
     // Target filter controls, search bars, etc.
     const filterBar = page.locator(".filter-bar")
     await expect(filterBar).toBeVisible()

     const masks = getBasicMaskSelectors(page)
     await expect(filterBar).toHaveScreenshot("<feature>-filters.png", {
       mask: masks,
       ...SCREENSHOT_OPTIONS,
     })
   })
   ```

**Important:**

- Use **specific CSS classes** (e.g., `.toolbar.toolbar-controlcenter`, not just `.toolbar`)
- Read plugin code to find correct selectors
- Only test **stable UI components** (toolbars, search bars, filter controls)
- **Do NOT test table headers** - they can fail due to dynamic rendering or sorting states
- **Do NOT test data rows** - they change with every data modification
- Add custom masking functions in `masking.ts` if needed

See `audit-admin-component-visual.spec.ts`, `volumes-member-component-visual.spec.ts`, or `images-member-component-visual.spec.ts` for examples.

### Creating Modal/Dialog Visual Tests

For testing modal dialogs that appear when clicking buttons (e.g., "Create New", "New BGP VPN"):

1. **Identify the modal type** by reading the plugin code:
   - **Classic Rails modals**: Use `.modal-content.networking` selector
   - **React widget modals**: Use `.modal-content[role="document"]` selector

2. **Test pattern:**

   ```typescript
   test("feature - create dialog", async ({ page }) => {
     await loginAsAdmin(page)
     await page.goto(`/${TEST_DOMAIN}/admin/<plugin>/<path>`, {
       waitUntil: "domcontentloaded",
     })
     await expect(page.locator("[data-test=page-title]")).toContainText("<Page Title>")

     // Wait for React widget to load (for React apps)
     await page.waitForTimeout(5000)

     // Click on button to open modal
     const createButton = page.locator('a:has-text("Create New")')
     await expect(createButton).toBeVisible({ timeout: 10000 })
     await createButton.click()

     // Wait for modal to appear
     await page.waitForTimeout(3000)

     // Wait for modal content (choose correct selector based on modal type)
     // For React widgets:
     const modalContent = page.locator('.modal-content[role="document"]').first()
     // For classic Rails modals:
     // const modalContent = page.locator('.modal-content.networking').first()

     await expect(modalContent).toBeVisible({ timeout: 10000 })
     await page.waitForTimeout(2000)

     const masks = getBasicMaskSelectors(page)

     await expect(modalContent).toHaveScreenshot("<feature>-create-dialog.png", {
       mask: masks,
       ...SCREENSHOT_OPTIONS,
     })
   })
   ```

3. **Creating baselines for modal tests:**

   ```bash
   # Step 1: Create baseline (writes -actual.png files)
   pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>

   # Step 2: Accept baseline (converts -actual.png to baseline)
   pnpm e2e:playwright:ui -- --host http://localhost:PORT --update-snapshots <test-name>

   # Step 3: Verify tests pass
   pnpm e2e:playwright:ui -- --host http://localhost:PORT <test-name>
   ```

**Important Notes:**

- **Always use button clicks** instead of direct navigation to `/new` routes for consistency
- **Choose the correct modal selector**:
  - `.modal-content[role="document"]` for React widgets (security groups, ports, BGP VPNs, volumes, shared filesystem)
  - `.modal-content.networking` for classic Rails modals (private networks, routers, floating IPs)
- **Wait times are critical**:
  - 5000ms after page load for React widgets to initialize
  - 3000ms after button click for modal animation
  - 2000ms after modal visible for content to fully render
- **Test one modal per test** - don't try to test multiple modals in one test

**Examples:**

- Networking modals: `networking-admin-component-visual.spec.ts` (10 tests including 6 modal tests)
- Volumes modal: `volumes-member-component-visual.spec.ts` (3 tests including 1 modal test)
- Shared filesystem modals: `shared-filesystem-admin-component-visual.spec.ts` (7 tests including 3 modal tests)

**Common pitfalls:**

- ❌ Using direct navigation like `?r=/new` instead of button click
- ❌ Wrong modal selector causing "element not found" errors
- ❌ Not waiting long enough for React widgets to load (use 5000ms minimum)
- ❌ Testing multiple modals in one test (keep it simple, one modal per test)
