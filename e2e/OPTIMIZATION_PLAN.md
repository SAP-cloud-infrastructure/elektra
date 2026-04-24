# Playwright Test Suite Optimization Plan

**Status:** Draft  
**Created:** 2026-04-22  
**Context:** After completing Cypress to Playwright migration and attempting wait/selector refactoring

## Background

We successfully migrated from Cypress to Playwright and created comprehensive test coverage:

- **51 test files** (5 smoke + 46 UI)
- **142 test cases** (15 smoke + 58 functional + 69 visual)
- **23 plugins tested** (4x more than originally planned)

**Lessons Learned:**

- Wait helpers (`waitForReactWidget`, `waitForModal`) add complexity without clear benefit
- Selector constants make code harder to read and maintain
- Simple, direct code is better than abstractions for test readability

## Optimization Areas

### 1. Documentation Updates (HIGH PRIORITY - Low Risk)

**Current Issues:**

- README.md claims 42 smoke tests (actual: 15)
- Migration plan (`eventual-herding-pascal.md`) is outdated
- Test counts don't match reality
- Missing decision trees for test types

**Tasks:**

- [ ] Update `/home/d058266/workspace/elektra/e2e/README.md`
  - Fix test counts (15 smoke, 58 functional, 69 visual)
  - Update plugin list (23 plugins tested)
  - Add actual vs planned comparison
  - Update run instructions

- [ ] Update `/home/d058266/workspace/elektra/e2e/playwright/VISUAL_REGRESSION.md`
  - Add troubleshooting section
  - Document when to use full-page vs component tests
  - Add examples of good/bad visual tests

- [ ] Archive migration plan as completed
  - Mark all phases as done
  - Document what was actually built vs planned

**Estimated Effort:** 1-2 hours  
**Value:** Medium (helps future developers)

---

### 2. Missing Plugin Tests (MEDIUM PRIORITY - Medium Risk)

**Plugins Without Tests:**

1. **Inquiry** - Request items workflow
2. **Kubernetes / Kubernetes_ng** - Container orchestration
3. **Lookup** - Resource lookup service
4. **Tools (cc-tools)** - Admin utilities

**Strategy:** Simple page-load tests only (no complex workflows)

**Template Pattern:**

```typescript
// inquiry-member-functional.spec.ts
test("can access inquiry page", async ({ page }) => {
  await loginAsMember(page)
  await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/inquiry`)
  await expect(page.locator("[data-test=page-title]")).toContainText("Request Items")
  await page.waitForTimeout(2000)
  // Basic smoke test - verify page loads
})
```

**Tasks:**

- [ ] Create `inquiry-member-functional.spec.ts`
- [ ] Create `kubernetes-admin-functional.spec.ts`
- [ ] Create `lookup-member-functional.spec.ts`
- [ ] Create `tools-admin-functional.spec.ts`

**Estimated Effort:** 2-3 hours (4 plugins × 30-45 min each)  
**Value:** Medium (completes coverage)

---

### 3. Parallel Test Execution (HIGH PRIORITY - Medium Risk)

**Current State:**

- CI runs with `workers: 1` (serial execution)
- Local dev uses default (parallel)
- No verification of test independence

**Problem:**

- Tests take longer than necessary in CI
- No guarantee tests are parallel-safe

**Strategy:**

1. Verify test independence
2. Enable parallel execution in CI
3. Monitor for flakiness

**Tasks:**

- [ ] Test parallel execution locally

  ```bash
  pnpm e2e:playwright:ui -- --host http://localhost:PORT --workers=4
  ```

- [ ] Check for shared state issues
  - Domain/project dependencies
  - Race conditions
  - Resource conflicts

- [ ] Update `playwright.config.ts` if safe:

  ```typescript
  workers: process.env.CI ? 2 : undefined, // Increase from 1
  ```

- [ ] Monitor CI runs for flakiness
- [ ] Roll back if issues detected

**Estimated Effort:** 2-3 hours (testing + monitoring)  
**Value:** HIGH (potentially 2-4x faster test execution)  
**Risk:** Medium (could introduce flakiness)

---

### 4. Error Handling Improvements (LOW PRIORITY - Low Risk)

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

**Estimated Effort:** 3-4 hours  
**Value:** Low-Medium (reduces false negatives)

---

### 5. Test Organization (LOW PRIORITY - Low Risk)

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

**Estimated Effort:** 2-3 hours  
**Value:** Low (code quality, not functionality)

---

### 6. Flaky Test Improvements (MEDIUM PRIORITY - Medium Risk)

**Known Issues:**

- **Webconsole test** - Takes up to 180s, polls for shell initialization
- **Modal tests** - Sometimes fail if animations are slow
- **React widget tests** - Sometimes fail on slow loads

**Strategy:** Make tests more resilient without adding complexity

**Tasks:**

- [ ] Review webconsole test timing
  - Consider marking as optional/slow
  - Or improve polling logic

- [ ] Add retry logic at Playwright config level:

  ```typescript
  retries: process.env.CI ? 3 : 2, // Increase from current 2/1
  ```

- [ ] Increase timeout for known-slow tests:
  ```typescript
  test.setTimeout(120000) // For webconsole and similar
  ```

**Estimated Effort:** 2-3 hours  
**Value:** Medium (reduces CI failures)

---

### 7. Visual Test Coverage (LOW PRIORITY - High Effort)

**Current Gaps:**

- Some plugins only have component tests (no full-page)
- Some admin tests missing member equivalents
- Table content not tested (intentionally - too dynamic)

**Decision:** Skip for now - current coverage is good enough

**Reasoning:**

- Component tests cover most visual regressions
- Full-page tests have diminishing returns
- Dynamic content makes visual tests brittle

**Tasks:**

- [ ] None - defer indefinitely

**Estimated Effort:** N/A  
**Value:** Low

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Day 1)

1. **Documentation Updates** (1-2h)
   - Update README.md
   - Fix test counts
   - Archive migration plan

2. **Parallel Execution Testing** (2-3h)
   - Test locally with --workers=4
   - Check for race conditions
   - Update config if safe

**Total Effort:** 3-5 hours  
**Expected Value:** HIGH

---

### Phase 2: Coverage & Stability (Day 2-3)

3. **Missing Plugin Tests** (2-3h)
   - Add 4 missing plugin tests
   - Simple page-load only

4. **Flaky Test Improvements** (2-3h)
   - Review webconsole timing
   - Adjust retry/timeout configs

**Total Effort:** 4-6 hours  
**Expected Value:** MEDIUM

---

### Phase 3: Polish (Optional - Day 4)

5. **Error Handling** (3-4h)
   - Add conditional skips
   - Document service dependencies

6. **Test Organization** (2-3h)
   - Refactor to use beforeEach
   - Reduce code duplication

**Total Effort:** 5-7 hours  
**Expected Value:** LOW-MEDIUM

---

## Success Metrics

**Phase 1 Success:**

- ✅ Documentation matches reality
- ✅ Tests run 2x faster in CI (if parallel works)
- ✅ No increase in flakiness

**Phase 2 Success:**

- ✅ All major plugins have at least smoke tests
- ✅ <5% flaky test rate in CI
- ✅ Clear error messages for skipped tests

**Phase 3 Success:**

- ✅ Less code duplication
- ✅ Clear patterns for new tests
- ✅ Easy for new developers to add tests

---

## What NOT to Do

❌ **Don't add wait helpers** - Complexity > Value  
❌ **Don't add selector constants** - Makes code harder to read  
❌ **Don't test complex workflows** - Keep tests simple  
❌ **Don't chase 100% visual coverage** - Diminishing returns  
❌ **Don't abstract too early** - KISS principle  
❌ **Don't fix what isn't broken** - Tests work, leave them alone

---

## Notes

- **Keep it simple** - Direct code is better than clever abstractions
- **Test readability matters** - Future developers will thank you
- **Don't over-engineer** - Tests should be boring and obvious
- **Measure before optimizing** - Collect data on flakiness and timing

---

## Future Considerations

**If we revisit wait optimization:**

- Consider Playwright's built-in `page.waitForLoadState('networkidle')` directly
- Document patterns in test files themselves, not helper modules
- Only extract when pattern is used 10+ times

**If we revisit selector optimization:**

- Add `data-test` attributes to application code instead
- Keep selectors inline where they're used
- Only extract truly shared/repeated selectors

**If test suite grows to 200+ tests:**

- Consider test sharding
- Split smoke/functional/visual into separate CI jobs
- Add performance benchmarking
