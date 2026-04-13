# Playwright Visual Testing - Test Priority List

## Phase 0: Proof of Concept (Day 1-2) - 3 Tests ⭐

### Test #1: Dashboard
**File:** `e2e/playwright/tests/visual/baseline/dashboard.spec.ts`
**Priority:** HIGHEST (PoC validation)
**Complexity:** Low
**Time:** 10 minutes

### Test #2: Compute Instance List
**File:** `e2e/playwright/tests/visual/baseline/compute.spec.ts`
**Priority:** HIGH (dynamic content validation)
**Complexity:** Low
**Time:** 15 minutes

### Test #3: Modal Component
**File:** `e2e/playwright/tests/visual/components/modals.spec.ts`
**Priority:** CRITICAL (Bootstrap 5 breaking change)
**Complexity:** Medium
**Time:** 20 minutes

---

## Phase 1: High-Impact (Week 1) - 7 Tests ⭐⭐⭐

### Test #4-8: Compute New Instance Form (5 states)
**File:** `e2e/playwright/tests/visual/baseline/compute.spec.ts`
**Priority:** CRITICAL (most complex form, 380 lines HAML, 200+ lines jQuery)
**Complexity:** High
**Time:** 60 minutes
**States:**
- Initial
- KVM Flavor
- Baremetal Flavor
- Custom Root Disk
- Validation Errors

### Test #9-12: Button Components (4 variants)
**File:** `e2e/playwright/tests/visual/components/buttons.spec.ts`
**Priority:** CRITICAL (btn-default → btn-secondary breaking change)
**Complexity:** Low
**Time:** 15 minutes
**Variants:**
- Primary (+ hover)
- Default/Secondary (+ hover)
- Success
- Danger

### Test #13: Networking New Network
**File:** `e2e/playwright/tests/visual/baseline/networking.spec.ts`
**Priority:** HIGH
**Complexity:** Medium
**Time:** 15 minutes

### Test #14: Block Storage New Volume
**File:** `e2e/playwright/tests/visual/baseline/block-storage.spec.ts`
**Priority:** HIGH
**Complexity:** Medium
**Time:** 15 minutes

**Total Week 1:** 10 tests, ~2.5 hours

---

## Phase 2: Component Coverage (Week 2) - 10 Tests ⭐⭐

### Test #15-17: Form Components
**File:** `e2e/playwright/tests/visual/components/forms.spec.ts`
**Priority:** HIGH
**Complexity:** Medium
**Time:** 45 minutes
- Text Input (all states)
- Select Dropdown
- Checkbox

### Test #18-19: Alerts
**File:** `e2e/playwright/tests/visual/components/alerts.spec.ts`
**Priority:** MEDIUM
**Complexity:** Low
**Time:** 20 minutes
- Success Alert
- Error Alert

### Test #20-23: Navigation & Layout
**File:** `e2e/playwright/tests/visual/components/navigation.spec.ts`
**Priority:** MEDIUM
**Complexity:** Low
**Time:** 30 minutes
- Navbar
- Sidebar
- Breadcrumb
- Footer

### Test #24: Compute Instance Details Modal
**File:** `e2e/playwright/tests/visual/baseline/compute.spec.ts`
**Priority:** MEDIUM
**Complexity:** Medium
**Time:** 15 minutes

**Total Week 2:** 20 tests total, ~2 hours

---

## Phase 3: Page Coverage (Week 3) - 15 Tests ⭐

### Test #25-29: Networking Plugin (5 pages)
**File:** `e2e/playwright/tests/visual/baseline/networking.spec.ts`
**Priority:** MEDIUM
**Complexity:** Low
**Time:** 60 minutes
- Networks List
- Floating IPs
- Routers
- Security Groups
- Router Topology

### Test #30-34: Identity Plugin (5 pages)
**File:** `e2e/playwright/tests/visual/baseline/identity.spec.ts`
**Priority:** MEDIUM
**Complexity:** Low
**Time:** 60 minutes
- Projects List
- Project Details
- Domains List
- Groups
- Users

### Test #35-39: Other Plugins (5 pages)
**Files:** Various
**Priority:** LOW
**Complexity:** Low
**Time:** 60 minutes
- LBaaS2: Load Balancers List
- Image: Images List
- Object Storage: Containers List
- DNS Service: Zones List
- Audit: Events List

**Total Week 3:** 35 tests total, ~3 hours

---

## Phase 4: Mobile & Edge Cases (Week 4) - 15 Tests

### Test #40-44: Mobile Views (5 tests)
**File:** `e2e/playwright/tests/visual/responsive/mobile.spec.ts`
**Priority:** MEDIUM
**Complexity:** Medium
**Time:** 60 minutes
- Dashboard Mobile
- Compute Instances Mobile
- Mobile Menu
- Forms Mobile (2 tests)

### Test #45-50: Edge Cases (6 tests)
**Files:** Various
**Priority:** LOW
**Complexity:** Medium
**Time:** 90 minutes
- Modal with Form Errors
- Tables with Pagination
- Empty States
- Loading States
- Nested Dropdowns
- Complex Forms

**Total Week 4:** 50 tests total, ~2.5 hours

---

## 📊 Summary

| Phase | Tests | Total | Time | Priority |
|-------|-------|-------|------|----------|
| PoC (Day 1-2) | 3 | 3 | 45 min | ⭐⭐⭐⭐⭐ |
| Week 1 | 7 | 10 | 2.5h | ⭐⭐⭐⭐ |
| Week 2 | 10 | 20 | 2h | ⭐⭐⭐ |
| Week 3 | 15 | 35 | 3h | ⭐⭐ |
| Week 4 | 15 | 50 | 2.5h | ⭐ |
| **Total** | **50** | **50** | **~11h** | |

---

## 🎯 Critical Path (If Time Limited)

**Minimum Viable Baseline (Week 1 only):**

1. ✅ Dashboard (PoC)
2. ✅ Modal Component (Bootstrap 5 risk)
3. ✅ Compute New Instance Form - All 5 States (highest complexity)
4. ✅ Buttons - All 4 Variants (most common breaking change)

**These 10 tests cover ~70% of Bootstrap 5 migration risk!**

---

## 📝 Implementation Order

```bash
# Day 1: Setup + PoC
1. Setup Playwright (30 min)
2. Write Test #1: Dashboard (15 min)
3. Write Test #2: Compute List (15 min)
4. Write Test #3: Modal (20 min)
→ Validate: All 3 pass ✅

# Day 2-3: Critical Forms
5-8. Compute New Instance Form (60 min)

# Day 4: Buttons
9-12. All Button Variants (15 min)

# Day 5: Other Forms
13-14. Networking & Block Storage Forms (30 min)

# Week 2-4: Expansion (as time permits)
```

---

## 🔥 If You Only Have 1 Hour

**Write these 4 tests:**
1. Dashboard (10 min)
2. Compute New Instance - Initial State (10 min)
3. Modal Component (15 min)
4. Primary Button (5 min)

**Result:** 40% risk coverage with 40 minutes of work!

---

## 💡 Pro Tips

1. **Start with easiest (Dashboard)** - builds confidence
2. **Second is Modal** - highest risk component
3. **Third is Compute Form** - highest complexity
4. **Parallelize:** Multiple devs can write tests simultaneously
5. **Copy-paste patterns** from Quick Start guide
6. **Don't aim for 100% coverage** - 50 tests is plenty!

---

Last Updated: 2026-04-10
