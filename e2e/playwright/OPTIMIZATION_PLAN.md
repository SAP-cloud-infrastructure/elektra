# Playwright Test Suite Optimization Plan

**Status:** Draft  
**Created:** 2026-04-22  
**Context:** After completing Cypress to Playwright migration and attempting wait/selector refactoring

## Optimization Areas

### 1. Error Handling Improvements (LOW PRIORITY - Low Risk)

**Current State:**

- Only 2 tests handle expected errors (SmartOps, App Credentials)
- Most tests fail hard on unavailable services
- No distinction between "service down" vs "test broken"

**Strategy:** Add conditional skips for external dependencies

**Pattern:**

```typescript
test("can access plugin page", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto(`/${TEST_DOMAIN}/admin/plugin`)

  // Check if service is available
  const notFound = await page
    .locator("text=/not found|unavailable/i")
    .isVisible()
    .catch(() => false)
  if (notFound) {
    test.skip(true, "Service not available in e2e environment")
  }

  await expect(page.locator("[data-test=page-title]")).toContainText("Plugin")
})
```

**Tasks:**

- [ ] Identify tests that depend on external services
- [ ] Add conditional skips where appropriate
- [ ] Document which services are expected in e2e mode

---

### 2. Test Organization (LOW PRIORITY - Low Risk)

**Current State:**

- Only 16 of 46 UI tests use `beforeEach`
- Lots of code duplication (login + navigation repeated)

**Strategy:** Standardize `beforeEach` usage

**Pattern:**

```typescript
test.describe("Plugin Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/plugin`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("[data-test=page-title]")).toContainText("Plugin")
    await page.waitForTimeout(2000)
  })

  test("element is visible", async ({ page }) => {
    // Page already loaded from beforeEach
    await expect(page.locator(".some-element")).toBeVisible()
  })
})
```

**Tasks:**

- [ ] Identify tests with repeated setup
- [ ] Refactor to use `beforeEach` where it makes sense
- [ ] Keep it simple - don't force it if tests are too different
