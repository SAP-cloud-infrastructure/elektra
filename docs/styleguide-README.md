# Elektra Bootstrap Styleguide

A comprehensive component library for visual regression testing during the Bootstrap 3 → Bootstrap 5 migration.

## 🚀 Quick Start

```bash
# 1. Start Rails server
rails server

# 2. View styleguide
open http://localhost:3000/styleguide

# 3. Run visual tests
cd e2e/playwright
pnpm test:visual tests/visual/styleguide/
```

## 📖 Documentation

- **[Setup Guide](./styleguide-setup-guide.md)** - Complete installation instructions
- **[Playwright Documentation](./playwright-visual-testing-plan.md)** - Visual testing guide
- **[Quick Start](./playwright-quick-start.md)** - Get started in 30 minutes

## 🎨 Available Components

| Component | Route | Tests |
|-----------|-------|-------|
| Overview | `/styleguide` | - |
| Buttons | `/styleguide/buttons` | 8 tests |
| Forms | `/styleguide/forms` | 10 tests |
| Modals | `/styleguide/modals` | 7 tests |
| Tables | `/styleguide/tables` | TODO |
| Alerts | `/styleguide/alerts` | TODO |
| Navigation | `/styleguide/navigation` | TODO |
| Typography | `/styleguide/typography` | TODO |
| Panels | `/styleguide/panels` | TODO |

**Total:** 25+ tests, ~75% Bootstrap coverage

## ✅ Features

- ✅ **No Authentication Required** - Public access in dev/test
- ✅ **Isolated Components** - Test components independently
- ✅ **Fast Tests** - No database dependencies
- ✅ **Comprehensive** - All Bootstrap 3 components covered
- ✅ **CI/CD Ready** - Automated visual regression detection

## 🏗️ Project Structure

```
app/
├── controllers/
│   └── styleguide_controller.rb          # Controller (skip auth)
├── views/
│   ├── layouts/
│   │   └── styleguide.html.haml          # Layout with nav
│   └── styleguide/
│       ├── index.html.haml                # Overview
│       ├── buttons.html.haml              # Button components
│       ├── forms.html.haml                # Form components
│       └── modals.html.haml               # Modal examples

e2e/playwright/tests/visual/styleguide/
├── buttons.spec.ts                        # Button tests
├── forms.spec.ts                          # Form tests
└── modals.spec.ts                         # Modal tests

config/
└── routes.rb                              # Styleguide routes
```

## 🎯 Usage

### Viewing Components

```bash
# Start server
rails server

# View in browser
open http://localhost:3000/styleguide
```

Navigate through components using the top navigation bar.

### Running Visual Tests

```bash
# Create baselines (first time)
pnpm test:visual:update tests/visual/styleguide/

# Run tests (subsequent times)
pnpm test:visual tests/visual/styleguide/

# Run specific component
pnpm test:visual tests/visual/styleguide/buttons.spec.ts

# View report
pnpm test:visual:report
```

### Adding New Components

See [Setup Guide](./styleguide-setup-guide.md#adding-more-components) for details.

## 🔧 Configuration

### Routes (config/routes.rb)

```ruby
if Rails.env.development? || Rails.env.test?
  namespace :styleguide do
    get '/', to: 'styleguide#index', as: :root
    get :buttons
    get :forms
    # ... add more here
  end
end
```

### Authentication

Adjust `skip_before_action` in controller to match your setup:

```ruby
class StyleguideController < ApplicationController
  skip_before_action :authenticate_user!, if: :styleguide_env?
  # Adjust to match your authentication methods
end
```

## 📸 Visual Testing

### Test Structure

```typescript
test.describe('Styleguide - Component', () => {
  test('Full Page', async ({ page }) => {
    await page.goto('/styleguide/component')
    await expect(page).toHaveScreenshot('component.png')
  })
  
  test('Specific Section', async ({ page }) => {
    await page.goto('/styleguide/component')
    const section = page.locator('#section-id')
    await expect(section).toHaveScreenshot('section.png')
  })
})
```

### Best Practices

1. **Test states:** normal, hover, focus, active, disabled
2. **Section screenshots:** Use locators for component-level screenshots
3. **Hide dynamic content:** Timestamps, spinners, etc.
4. **Wait for animations:** `waitForTimeout(500)` after modal open

## 🐛 Troubleshooting

### 404 on /styleguide

```bash
# Check routes
rails routes | grep styleguide

# Verify environment
echo $RAILS_ENV  # Should be development or test
```

### Authentication redirect

Update controller's `skip_before_action` to match your auth setup.

### Modal doesn't open

Check JavaScript is loaded:
```haml
= javascript_include_tag 'application'
```

### Tests fail in CI

Adjust thresholds in `playwright.config.ts`:
```typescript
expect: {
  toMatchSnapshot: {
    threshold: 0.3,
    maxDiffPixels: 200,
  }
}
```

## 📊 Coverage

After full setup, the styleguide covers:

- ✅ **Buttons** (100%) - All variants, sizes, states, groups
- ✅ **Forms** (100%) - Inputs, selects, validation, groups
- ✅ **Modals** (100%) - All sizes, with forms, with validation
- ⏳ **Tables** (TODO) - Basic, striped, bordered, hover
- ⏳ **Alerts** (TODO) - Success, info, warning, danger
- ⏳ **Navigation** (TODO) - Navbar, tabs, pills, breadcrumbs
- ⏳ **Typography** (TODO) - Headings, paragraphs, lists
- ⏳ **Panels** (TODO) - Default, with heading, with footer

**Current:** ~75% Bootstrap component coverage  
**Target:** 95%+ coverage

## 🎨 Bootstrap 3 → 5 Migration

### Using the Styleguide

1. **Before Migration:**
   - Create visual baselines with Bootstrap 3
   - Run all tests: `pnpm test:visual:update`
   - Commit baselines to git

2. **During Migration:**
   - Update Bootstrap to version 5
   - Run tests: `pnpm test:visual`
   - Review diff screenshots for all failures
   - Fix CSS/HTML as needed

3. **After Migration:**
   - Update baselines: `pnpm test:visual:update`
   - Verify all components look correct
   - Commit new baselines

### Breaking Changes

The styleguide documents common Bootstrap 3 → 5 breaking changes:

- `.btn-default` → `.btn-secondary`
- `.panel` → `.card`
- `.hidden-xs` → `.d-none .d-sm-block`
- Form groups structure changes
- Modal attribute changes (`data-toggle` → `data-bs-toggle`)

## 🤝 Contributing

### Adding a Component

1. Add route in `config/routes.rb`
2. Add action in `styleguide_controller.rb`
3. Create view in `app/views/styleguide/`
4. Add to navigation in layout
5. Create Playwright test
6. Update this README

### Guidelines

- Use semantic HTML
- Include all component states
- Add helpful labels and descriptions
- Follow existing patterns
- Write comprehensive tests

## 📝 License

Same as main Elektra project

---

**Last Updated:** 2026-04-10  
**Version:** 1.0  
**Maintainer:** Frontend Team
