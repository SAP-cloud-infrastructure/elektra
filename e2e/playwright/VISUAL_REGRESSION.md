# Visual Regression Testing

Visual regression testing captures screenshots of your UI and compares them against baseline images to detect visual changes after code modifications, Bootstrap upgrades, or CSS updates.

## Quick Start

### 1. Create Baseline Screenshots

Before making changes (e.g., Bootstrap upgrade), create baseline screenshots:

```bash
# Start Rails in e2e mode
bundle exec rails server -p 4001

# Create baselines (in another terminal)
pnpm e2e:playwright:ui -- --host http://localhost:4001 --update-snapshots <test-name>
```

### 2. Make Your Changes

- Upgrade Bootstrap
- Modify CSS
- Change HTML structure

### 3. Run Visual Tests

```bash
pnpm e2e:playwright:ui -- --host http://localhost:4001 <test-name>
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
pnpm e2e:playwright:ui -- --host http://localhost:4001 --update-snapshots <test-name>
```

## Available Test Suites

### Masterdata Cockpit

```bash
# Visual regression tests (10 tests)
pnpm e2e:playwright:ui -- --host http://localhost:4001 masterdata-visual
```

### API Access

```bash
# Visual regression tests (5 tests)
pnpm e2e:playwright:ui -- --host http://localhost:4001 api-access-visual
```

### All Visual Tests

```bash
pnpm e2e:playwright:ui -- --host http://localhost:4001
```

## Configuration

Visual tests use centralized configuration from `e2e/playwright/helpers/masking.ts`:

- **Mask Color**: Black (`#000000`)
- **Max Diff Ratio**: 3% (`0.03`)
- **Security Masking**: Automatic masking of sensitive data (IDs, emails, usernames)

## What Gets Tested

- ✅ **Layout & Structure** - Grid system, sections, alignment
- ✅ **Typography** - Font sizes, weights, line heights
- ✅ **Colors** - Background, text, border colors
- ✅ **Spacing** - Margins, padding, gaps
- ✅ **Components** - Buttons, modals, icons, forms
- ✅ **Responsive Design** - Desktop, tablet layouts

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
pnpm e2e:playwright:ui -- --host http://localhost:4001 --update-snapshots

# Commit baselines
git add e2e/playwright/ui/*-snapshots
git commit -m "chore: add visual regression baselines before bootstrap upgrade"
```

### After Upgrade

```bash
# Upgrade Bootstrap
pnpm add bootstrap@5.x.x

# Run visual tests
pnpm e2e:playwright:ui -- --host http://localhost:4001

# Review report
npx playwright show-report

# If changes look good, update baselines
pnpm e2e:playwright:ui -- --host http://localhost:4001 --update-snapshots
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

## Adding New Visual Tests

1. Create new test file: `<feature>-visual.spec.ts`
2. Import masking helpers:
   ```typescript
   import { getBasicMaskSelectors, SCREENSHOT_OPTIONS } from "../helpers/masking"
   ```
3. Use centralized masking:
   ```typescript
   const masks = getBasicMaskSelectors(page)
   await expect(page).toHaveScreenshot("test.png", {
     mask: masks,
     ...SCREENSHOT_OPTIONS,
   })
   ```

See `api-access-visual.spec.ts` or `masterdata-visual.spec.ts` for examples.
