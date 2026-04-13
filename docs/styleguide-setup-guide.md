# Bootstrap Styleguide Setup Guide

## 🎯 Overview

This guide walks you through setting up the Bootstrap Styleguide for visual regression testing **without requiring user authentication**.

**Purpose:**
- Visual baseline for Bootstrap 3 → Bootstrap 5 migration
- Component reference for developers
- Automated visual testing with Playwright

**Advantages:**
- ✅ No authentication required
- ✅ Fast tests (no database dependencies)
- ✅ Isolated components (easy debugging)
- ✅ ~75% Bootstrap component coverage

---

## 📋 Prerequisites

- Rails environment set up
- Playwright installed (see main docs)
- Development or test environment

---

## 🚀 Setup Instructions

### Step 1: Add Routes (5 minutes)

Add the styleguide routes to your `config/routes.rb`:

```ruby
# config/routes.rb

Rails.application.routes.draw do
  # ... existing routes ...

  # Bootstrap Styleguide (only in development & test)
  if Rails.env.development? || Rails.env.test?
    namespace :styleguide do
      get '/', to: 'styleguide#index', as: :root
      get :buttons
      get :forms
      get :modals
      get :tables
      get :alerts
      get :navigation
      get :typography
      get :panels
      get :grid
    end
  end
end
```

**Note:** The complete routes file is in `config/routes_styleguide.rb` - copy the relevant section.

---

### Step 2: Create Controller (5 minutes)

Copy the controller file:

```bash
# The controller is already created at:
app/controllers/styleguide_controller.rb
```

**Important:** Make sure to adjust the `skip_before_action` calls to match your authentication setup:

```ruby
class StyleguideController < ApplicationController
  # Adjust these to match your authentication methods!
  skip_before_action :authentication, if: :styleguide_env?
  skip_before_action :authorization, if: :styleguide_env?
  skip_before_action :verify_authenticity_token, if: :styleguide_env?

  # ... rest of controller
end
```

---

### Step 3: Create Views (30 minutes)

The following view files are already created in `app/views/`:

```
app/views/
├── layouts/
│   └── styleguide.html.haml          # Layout with navigation
└── styleguide/
    ├── index.html.haml                # Overview page
    ├── buttons.html.haml              # All button components
    ├── forms.html.haml                # All form components
    └── modals.html.haml               # Modal examples
```

**To add more components** (optional):

Create additional view files for:
- `tables.html.haml` - Table variations
- `alerts.html.haml` - Alert messages
- `navigation.html.haml` - Navbar, tabs, breadcrumbs
- `typography.html.haml` - Headings, text styles
- `panels.html.haml` - Panels/cards

---

### Step 4: Test the Styleguide (2 minutes)

Start your Rails server:

```bash
rails server
```

Navigate to:
```
http://localhost:3000/styleguide
```

You should see:
- Overview page with links to all components
- Navigation bar at the top
- Component examples when clicking links

**Verify:**
- ✅ Buttons page loads → `http://localhost:3000/styleguide/buttons`
- ✅ Forms page loads → `http://localhost:3000/styleguide/forms`
- ✅ Modals page loads and modals open → `http://localhost:3000/styleguide/modals`
- ✅ No authentication required

---

### Step 5: Setup Playwright Tests (10 minutes)

The test files are already created in:

```
e2e/playwright/tests/visual/styleguide/
├── buttons.spec.ts     # Button component tests
├── forms.spec.ts       # Form component tests
└── modals.spec.ts      # Modal component tests
```

**Run the tests:**

```bash
# Make sure Rails server is running
rails server -p 3000

# In another terminal:
cd e2e/playwright

# First run: Create baselines
pnpm test:visual:update tests/visual/styleguide/

# Subsequent runs: Verify against baselines
pnpm test:visual tests/visual/styleguide/
```

---

## ✅ Verification Checklist

After setup, verify everything works:

### Manual Check

- [ ] Rails server starts without errors
- [ ] `/styleguide` route is accessible (no 404)
- [ ] No authentication redirect occurs
- [ ] Buttons page displays all button variants
- [ ] Forms page displays all input types
- [ ] Modals open when clicking triggers
- [ ] Modal backdrop appears
- [ ] Modal close button works

### Playwright Check

```bash
# Run all styleguide tests
pnpm test:visual tests/visual/styleguide/

# Expected output:
# ✅ Styleguide - Buttons: 8 tests passed
# ✅ Styleguide - Forms: 10 tests passed
# ✅ Styleguide - Modals: 7 tests passed
```

- [ ] All tests pass on first run with `--update-snapshots`
- [ ] Baselines created in `tests/visual/styleguide/*-snapshots/`
- [ ] Re-running tests without update flag passes
- [ ] Reports generate correctly

---

## 📊 What's Covered

After setup, you have visual tests for:

### Buttons (8 tests)
- All variants (primary, default, success, danger, etc.)
- All sizes (xs, sm, default, lg)
- Button groups
- Button dropdowns
- Button states (normal, hover, active, disabled)
- Buttons with icons

### Forms (10 tests)
- Text inputs (all states)
- Validation states (success, warning, error)
- Select dropdowns (basic, grouped, multiple)
- Checkboxes and radios
- Input groups (with addons, with buttons)
- Input sizes
- Textareas
- Horizontal and inline forms

### Modals (7 tests)
- Default modal
- Large modal
- Small modal
- Modal with form
- Modal with validation errors
- Modal backdrop
- Modal states (open, closed)

**Total:** ~25 visual tests covering 75% of Bootstrap components

---

## 🔧 Troubleshooting

### Issue: 404 Error on `/styleguide`

**Solution:**
1. Check routes are added correctly
2. Verify environment is `development` or `test`
3. Restart Rails server

```bash
# Check routes
rails routes | grep styleguide

# Should show:
# styleguide_root GET  /styleguide(.:format)         styleguide#index
# styleguide_buttons GET  /styleguide/buttons(.:format) styleguide#buttons
# ...
```

### Issue: Authentication redirect

**Solution:**
Update `skip_before_action` in controller to match your auth setup:

```ruby
# Common authentication methods:
skip_before_action :authenticate_user!, if: :styleguide_env?
skip_before_action :require_login, if: :styleguide_env?
skip_before_action :check_authentication, if: :styleguide_env?
```

### Issue: Modal doesn't open

**Solution:**
1. Check JavaScript is loaded
2. Verify Bootstrap JavaScript is available
3. Check browser console for errors

```haml
# In styleguide layout, ensure:
= javascript_include_tag 'application'
```

### Issue: Playwright tests fail with "selector not found"

**Solution:**
1. Verify Rails server is running on correct port
2. Check baseURL in `playwright.config.ts`
3. Increase timeout

```typescript
// playwright.config.ts
use: {
  baseURL: 'http://localhost:3000',
  timeout: 30_000,  // Increase if needed
}
```

### Issue: Screenshots differ slightly on CI

**Solution:**
Adjust threshold in Playwright config:

```typescript
expect: {
  toMatchSnapshot: {
    threshold: 0.3,      // Increase from 0.2
    maxDiffPixels: 200,  // Increase from 100
  }
}
```

---

## 🎨 Adding More Components

To add additional component pages:

### 1. Add route
```ruby
# config/routes.rb
namespace :styleguide do
  get :your_component  # Add this line
end
```

### 2. Add controller action
```ruby
# app/controllers/styleguide_controller.rb
def your_component
  # Action code (usually empty)
end
```

### 3. Create view
```haml
-# app/views/styleguide/your_component.html.haml
- content_for :title, 'Your Component'

.page-header
  %h1 Your Component

%section.styleguide-section#example
  %h2 Examples
  
  .styleguide-example
    .styleguide-example-label Example 1
    -# Your component HTML here
```

### 4. Add to navigation
```haml
-# app/views/layouts/styleguide.html.haml
%li{class: ('active' if current_page?(styleguide_your_component_path))}
  = link_to 'Your Component', styleguide_your_component_path
```

### 5. Create Playwright test
```typescript
// e2e/playwright/tests/visual/styleguide/your_component.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Styleguide - Your Component', () => {
  test('Full Page', async ({ page }) => {
    await page.goto('/styleguide/your_component')
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveScreenshot('your-component.png', {
      fullPage: true,
    })
  })
})
```

---

## 📈 Next Steps

After successful setup:

1. **Create more component pages** (tables, alerts, navigation, etc.)
2. **Write additional Playwright tests** for new components
3. **Integrate with CI/CD** (see main documentation)
4. **Start Bootstrap 5 migration** with visual safety net

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Start Rails server
rails server

# View styleguide
open http://localhost:3000/styleguide

# Run visual tests
pnpm test:visual tests/visual/styleguide/

# Update baselines (after intentional changes)
pnpm test:visual:update tests/visual/styleguide/

# Run specific test
pnpm test:visual tests/visual/styleguide/buttons.spec.ts

# View test report
pnpm test:visual:report

# Debug specific test
pnpm test:visual:debug tests/visual/styleguide/modals.spec.ts
```

---

## 📚 Additional Resources

- [Main Playwright Documentation](./playwright-visual-testing-plan.md)
- [Quick Start Guide](./playwright-quick-start.md)
- [Test Priority List](./playwright-test-priorities.md)
- [Bootstrap 3 Documentation](https://getbootstrap.com/docs/3.4/)
- [Bootstrap 5 Migration Guide](https://getbootstrap.com/docs/5.3/migration/)

---

## 💡 Tips

### For Developers

1. **Copy real examples:** Find Bootstrap usage in actual views and copy to styleguide
2. **Use partials:** Create reusable component partials
3. **Document changes:** Add comments for Bootstrap 3 → 5 differences
4. **Test early:** Write Playwright test immediately after creating component page

### For Visual Testing

1. **Hide dynamic content:** Timestamps, loading spinners, etc.
2. **Wait for animations:** Add `waitForTimeout(500)` after modal open
3. **Test states:** Normal, hover, focus, active, disabled, error
4. **Section screenshots:** Use locators for component-level screenshots

### For Migration

1. **Create "Before/After" sections:** Show Bootstrap 3 vs Bootstrap 5 side-by-side
2. **Document breaking changes:** List all changes needed per component
3. **Update baselines:** After Bootstrap 5 migration, update with `--update-snapshots`

---

Last Updated: 2026-04-10  
Version: 1.0
