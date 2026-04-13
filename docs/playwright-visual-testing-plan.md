# Playwright Visual Testing Implementation Plan

**Status:** 📋 Planning  
**Created:** 2026-04-09  
**Owner:** Development Team  
**Timeline:** 3-4 Wochen Setup + Fortlaufend  

---

## 🎯 Ziele

1. **Visual Regression Protection** während der Bootstrap 5 Migration
2. **Automatisierte UI-Tests** für kritische User Flows
3. **Cross-Browser Kompatibilität** sicherstellen
4. **CI/CD Integration** für Pull Request Validierung
5. **Dokumentation** des aktuellen visuellen Zustands als Baseline

---

## 📊 Projektstatus

### Aktuelle Situation
- **E2E Framework:** Cypress 15.10.0 (vorhanden)
- **Visual Testing:** ❌ Nicht vorhanden
- **Templates:** 532 HAML/ERB Dateien
- **Kritische Plugins:** Compute, Networking, Identity, Block Storage, LBaaS2
- **Geplante Migration:** Bootstrap 3 → Bootstrap 5

### Warum Playwright zusätzlich zu Cypress?
- **Cypress:** Funktionale E2E-Tests (User Flows, Business Logic)
- **Playwright:** Visual Regression Tests (UI Appearance, Layout)
- **Komplementär:** Beide Frameworks parallel nutzen

---

## 🗓️ Zeitplan

### Phase 1: Setup & Konfiguration (Woche 1)
**Dauer:** 3-5 Tage  
**Aufwand:** 20-30 Stunden  

- [ ] Playwright Installation
- [ ] Konfiguration für Elektra-Projekt
- [ ] Test-Helper & Utilities
- [ ] Login-Helper für authentifizierte Routes
- [ ] Dokumentation für Team

### Phase 2: Baseline Creation (Woche 2-3)
**Dauer:** 8-10 Tage  
**Aufwand:** 40-60 Stunden  

- [ ] Kritische Pages identifizieren (Top 50)
- [ ] Visual Baseline-Tests schreiben
- [ ] Snapshots erstellen und reviewen
- [ ] Component-Level Tests (Modals, Forms, Buttons)
- [ ] Mobile/Responsive Tests

### Phase 3: CI/CD Integration (Woche 3-4)
**Dauer:** 3-5 Tage  
**Aufwand:** 20-30 Stunden  

- [ ] GitHub Actions Workflow
- [ ] Screenshot Artifact Upload
- [ ] PR Integration
- [ ] Failure Notifications
- [ ] Team-Training

### Phase 4: Laufender Betrieb (Fortlaufend)
- [ ] Baseline-Updates bei intentionalen Changes
- [ ] Neue Tests für neue Features
- [ ] Monitoring & Maintenance
- [ ] Team-Feedback Integration

---

## 📦 Phase 1: Setup & Konfiguration

### 1.1 Installation

```bash
# Playwright installieren
pnpm add -D @playwright/test

# Browser binaries installieren
npx playwright install --with-deps

# Optionale Tools
pnpm add -D @playwright/test pixelmatch
```

### 1.2 Projektstruktur

```
elektra/
├── e2e/
│   ├── cypress/          # Bestehendes Cypress Setup
│   │   └── ...
│   └── playwright/       # NEU: Playwright Tests
│       ├── tests/
│       │   ├── visual/
│       │   │   ├── baseline/
│       │   │   │   ├── compute.spec.ts
│       │   │   │   ├── networking.spec.ts
│       │   │   │   ├── identity.spec.ts
│       │   │   │   ├── block-storage.spec.ts
│       │   │   │   └── lbaas2.spec.ts
│       │   │   ├── components/
│       │   │   │   ├── modals.spec.ts
│       │   │   │   ├── forms.spec.ts
│       │   │   │   ├── buttons.spec.ts
│       │   │   │   ├── tables.spec.ts
│       │   │   │   └── navigation.spec.ts
│       │   │   └── responsive/
│       │   │       ├── mobile.spec.ts
│       │   │       └── tablet.spec.ts
│       │   └── helpers/
│       │       ├── auth.ts
│       │       ├── navigation.ts
│       │       └── screenshot.ts
│       └── playwright.config.ts
├── playwright-report/    # Auto-generierte Reports
└── test-results/         # Screenshots & Diffs
```

### 1.3 Konfigurationsdatei

**Datei:** `e2e/playwright/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  
  // Test-Konfiguration
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['json', { outputFile: '../../test-results/results.json' }],
    ['list'],
  ],
  
  // Global Use-Settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Videos bei Failure
    video: 'retain-on-failure',
    
    // Trace für Debugging
    trace: 'retain-on-failure',
    
    // Browser-Settings
    viewport: { width: 1920, height: 1080 },
    
    // Timeouts
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  
  // Visual Testing Config
  expect: {
    timeout: 10_000,
    toMatchSnapshot: {
      // Anti-Aliasing Toleranz
      maxDiffPixels: 100,
      
      // Prozentuale Toleranz (0.2 = 0.2% der Pixel dürfen unterschiedlich sein)
      threshold: 0.2,
      
      // Animationen deaktivieren
      animations: 'disabled',
    },
  },
  
  // Browser-Projekte
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    // Später aktivieren für Multi-Browser Testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile Testing
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
  
  // Dev-Server starten (optional)
  // Wenn Tests gegen lokalen Server laufen sollen
  webServer: {
    command: 'rails server -e test -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
```

### 1.4 Helper-Funktionen

**Datei:** `e2e/playwright/tests/helpers/auth.ts`

```typescript
import { Page } from '@playwright/test'

/**
 * Login Helper für authentifizierte Routes
 */
export async function login(page: Page, options?: {
  username?: string
  password?: string
  domain?: string
  project?: string
}) {
  const {
    username = process.env.TEST_USERNAME || 'test-user',
    password = process.env.TEST_PASSWORD || 'test-password',
    domain = process.env.TEST_DOMAIN || 'default',
    project = process.env.TEST_PROJECT || 'test-project',
  } = options || {}
  
  // Zur Login-Page navigieren
  await page.goto('/auth/login')
  
  // Login-Form ausfüllen
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  
  if (await page.locator('select[name="domain"]').isVisible()) {
    await page.selectOption('select[name="domain"]', domain)
  }
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Warte auf erfolgreichen Login (Dashboard oder Project-Auswahl)
  await page.waitForURL(/\/(dashboard|projects)/, { timeout: 30_000 })
  
  // Falls Project-Auswahl nötig
  if (page.url().includes('/projects')) {
    await page.click(`a:has-text("${project}")`)
    await page.waitForURL(/\/dashboard/)
  }
}

/**
 * Check ob User eingeloggt ist
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  return await page.locator('.user-profile, [data-user-profile]').isVisible()
}

/**
 * Logout Helper
 */
export async function logout(page: Page) {
  await page.click('.user-profile')
  await page.click('a:has-text("Logout")')
  await page.waitForURL('/auth/login')
}
```

**Datei:** `e2e/playwright/tests/helpers/screenshot.ts`

```typescript
import { Page, Locator, expect } from '@playwright/test'

/**
 * Screenshot mit automatischer Wartezeit und cleanup
 */
export async function takeVisualSnapshot(
  pageOrLocator: Page | Locator,
  name: string,
  options?: {
    fullPage?: boolean
    removeDynamic?: boolean
    hideElements?: string[]
  }
) {
  const { 
    fullPage = true, 
    removeDynamic = true,
    hideElements = [],
  } = options || {}
  
  const page = 'page' in pageOrLocator ? pageOrLocator.page() : pageOrLocator as Page
  
  // Warte auf Network Idle
  await page.waitForLoadState('networkidle')
  
  // Optional: Dynamischen Content ausblenden
  if (removeDynamic) {
    await page.evaluate(() => {
      // Timestamps, Loading-Spinner, etc. ausblenden
      const selectors = [
        '[data-timestamp]',
        '[data-dynamic]',
        '.loading-spinner',
        '.spinner',
        '.fa-spinner',
        'time[datetime]',
      ]
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })
    })
  }
  
  // Zusätzliche Elemente ausblenden
  if (hideElements.length > 0) {
    await page.evaluate((selectors) => {
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden'
        })
      })
    }, hideElements)
  }
  
  // Warte kurz für Rendering
  await page.waitForTimeout(500)
  
  // Screenshot
  if ('page' in pageOrLocator) {
    // Ist ein Page-Objekt
    await expect(pageOrLocator).toHaveScreenshot(name, {
      fullPage,
      animations: 'disabled',
    })
  } else {
    // Ist ein Locator
    await expect(pageOrLocator).toHaveScreenshot(name, {
      animations: 'disabled',
    })
  }
}

/**
 * Warte auf Modal
 */
export async function waitForModal(page: Page) {
  await page.waitForSelector('#modal-holder .modal.show, #modal-holder .modal.in', {
    timeout: 10_000,
  })
  
  // Warte auf Animations-Ende
  await page.waitForTimeout(500)
}

/**
 * Schließe Modal
 */
export async function closeModal(page: Page) {
  await page.click('#modal-holder .modal [data-dismiss="modal"], #modal-holder .modal [data-bs-dismiss="modal"]')
  
  // Warte bis Modal weg ist
  await page.waitForSelector('#modal-holder .modal', { state: 'hidden' })
}
```

**Datei:** `e2e/playwright/tests/helpers/navigation.ts`

```typescript
import { Page } from '@playwright/test'

/**
 * Navigiere zu Plugin
 */
export async function navigateToPlugin(page: Page, plugin: string) {
  // Sidebar-Navigation
  await page.click(`[data-plugin="${plugin}"], .sidebar a:has-text("${plugin}")`)
  await page.waitForLoadState('networkidle')
}

/**
 * Warte auf Elektra-spezifische Events
 */
export async function waitForElektraReady(page: Page) {
  await page.waitForLoadState('networkidle')
  
  // Warte auf potentielle AJAX-Updates
  await page.waitForTimeout(1000)
  
  // Check ob Polling-Service aktiv ist und warte
  const hasPolling = await page.evaluate(() => {
    return typeof window['PollingService'] !== 'undefined'
  })
  
  if (hasPolling) {
    // Warte einen Polling-Zyklus ab
    await page.waitForTimeout(5000)
  }
}
```

### 1.5 Environment Configuration

**Datei:** `.env.test` (erstellen)

```bash
# Test Environment Configuration
TEST_USERNAME=test-admin
TEST_PASSWORD=test-password
TEST_DOMAIN=default
TEST_PROJECT=test-project

# Base URL (wird von playwright.config.ts gelesen)
BASE_URL=http://localhost:3000

# Optional: Remote Test Environment
# BASE_URL=https://staging.elektra.example.com
```

**In `.gitignore` hinzufügen:**
```gitignore
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
.env.test.local
```

### 1.6 Package.json Scripts

**Zu `package.json` hinzufügen:**

```json
{
  "scripts": {
    "test:visual": "playwright test",
    "test:visual:ui": "playwright test --ui",
    "test:visual:headed": "playwright test --headed",
    "test:visual:debug": "playwright test --debug",
    "test:visual:update": "playwright test --update-snapshots",
    "test:visual:report": "playwright show-report",
    "test:visual:chromium": "playwright test --project=chromium",
    "test:visual:ci": "playwright test --project=chromium --reporter=json"
  }
}
```

---

## 📸 Phase 2: Baseline Creation

### 2.1 Kritische Pages identifizieren

**Prioritätenliste (Top 50 Pages):**

#### High Priority (20 Pages)
1. **Compute Plugin:**
   - `/compute/instances` - Instance List
   - `/compute/instances/new` - New Instance Form
   - `/compute/instances/{id}` - Instance Details
   - `/compute/instances/{id}/edit` - Edit Instance
   - `/compute/flavors` - Flavor List

2. **Networking Plugin:**
   - `/networking/networks` - Network List
   - `/networking/networks/new` - New Network
   - `/networking/floating_ips` - Floating IPs
   - `/networking/routers` - Router List

3. **Identity Plugin:**
   - `/identity/projects` - Project List
   - `/identity/projects/{id}` - Project Details
   - `/identity/domains` - Domain List

4. **Block Storage Plugin:**
   - `/block_storage/volumes` - Volume List
   - `/block_storage/volumes/new` - New Volume
   - `/block_storage/snapshots` - Snapshot List

5. **LBaaS2 Plugin:**
   - `/lbaas2/loadbalancers` - Load Balancer List
   - `/lbaas2/loadbalancers/new` - New Load Balancer

6. **Core:**
   - `/dashboard` - Dashboard/Landing Page
   - `/` - Landing Page (unauthenticated)

#### Medium Priority (15 Pages)
- DNS Service Plugin (5 Pages)
- Image Plugin (3 Pages)
- Object Storage Plugin (3 Pages)
- Kubernetes Plugin (4 Pages)

#### Low Priority (15 Pages)
- Admin/Monitoring Tools
- Audit Plugin
- Tools Plugin
- Reports Plugin

### 2.2 Baseline Test Template

**Datei:** `e2e/playwright/tests/visual/baseline/compute.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'
import { takeVisualSnapshot, waitForModal } from '../../helpers/screenshot'
import { waitForElektraReady } from '../../helpers/navigation'

test.describe('Compute Plugin - Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/compute')
    await waitForElektraReady(page)
  })
  
  test('Instance List Page', async ({ page }) => {
    await page.goto('/compute/instances')
    await waitForElektraReady(page)
    
    // Desktop View
    await takeVisualSnapshot(page, 'compute-instances-list-desktop.png')
    
    // Mobile View
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    await takeVisualSnapshot(page, 'compute-instances-list-mobile.png')
  })
  
  test('New Instance Form - Initial State', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // Warte bis Form komplett geladen
    await page.waitForSelector('#server_flavor_id')
    await page.waitForSelector('#server_availability_zone_id')
    
    await takeVisualSnapshot(page, 'compute-new-instance-initial.png')
  })
  
  test('New Instance Form - KVM Flavor Selected', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // KVM Flavor auswählen
    await page.selectOption('#server_flavor_id', { label: /kvm/ })
    await page.waitForSelector('#kvm_image_id_wrapper:visible')
    await page.waitForTimeout(500)
    
    await takeVisualSnapshot(page, 'compute-new-instance-kvm.png')
  })
  
  test('New Instance Form - Baremetal Flavor Selected', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // Baremetal Flavor auswählen
    await page.selectOption('#server_flavor_id', { label: /ironic/ })
    await page.waitForSelector('#baremetal_image_id_wrapper:visible')
    await page.waitForTimeout(500)
    
    await takeVisualSnapshot(page, 'compute-new-instance-baremetal.png')
  })
  
  test('New Instance Form - VMware Flavor Selected', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // VMware Flavor auswählen (default wenn nicht kvm/ironic)
    const options = await page.locator('#server_flavor_id option').all()
    for (const option of options) {
      const text = await option.textContent()
      if (text && !text.match(/kvm|ironic/i)) {
        const value = await option.getAttribute('value')
        if (value) {
          await page.selectOption('#server_flavor_id', value)
          break
        }
      }
    }
    
    await page.waitForSelector('#vmware_image_id_wrapper:visible')
    await page.waitForTimeout(500)
    
    await takeVisualSnapshot(page, 'compute-new-instance-vmware.png')
  })
  
  test('New Instance Form - Validation Errors', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // Submit ohne required fields
    await page.click('button:has-text("Create")')
    
    // Warte auf Validation-Fehler
    await page.waitForSelector('.has-error, .is-invalid', { timeout: 5000 })
    await page.waitForTimeout(500)
    
    await takeVisualSnapshot(page, 'compute-new-instance-validation-errors.png')
  })
  
  test('Instance Details Modal', async ({ page }) => {
    await page.goto('/compute/instances')
    await waitForElektraReady(page)
    
    // Ersten Instance-Link klicken (falls vorhanden)
    const instanceLink = page.locator('.instance-list a[data-modal="true"]').first()
    
    if (await instanceLink.isVisible()) {
      await instanceLink.click()
      await waitForModal(page)
      
      const modal = page.locator('#modal-holder .modal')
      await expect(modal).toHaveScreenshot('compute-instance-details-modal.png')
    }
  })
})
```

**Weitere Baseline-Tests:**

**Datei:** `e2e/playwright/tests/visual/baseline/networking.spec.ts`

```typescript
import { test } from '@playwright/test'
import { login } from '../../helpers/auth'
import { takeVisualSnapshot } from '../../helpers/screenshot'
import { waitForElektraReady } from '../../helpers/navigation'

test.describe('Networking Plugin - Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForElektraReady(page)
  })
  
  test('Networks List', async ({ page }) => {
    await page.goto('/networking/networks')
    await waitForElektraReady(page)
    await takeVisualSnapshot(page, 'networking-networks-list.png')
  })
  
  test('New Network Form', async ({ page }) => {
    await page.goto('/networking/networks/new')
    await waitForElektraReady(page)
    await takeVisualSnapshot(page, 'networking-new-network.png')
  })
  
  test('Floating IPs List', async ({ page }) => {
    await page.goto('/networking/floating_ips')
    await waitForElektraReady(page)
    await takeVisualSnapshot(page, 'networking-floating-ips.png')
  })
  
  test('Routers List', async ({ page }) => {
    await page.goto('/networking/routers')
    await waitForElektraReady(page)
    await takeVisualSnapshot(page, 'networking-routers.png')
  })
})
```

### 2.3 Component-Level Tests

**Datei:** `e2e/playwright/tests/visual/components/modals.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'
import { waitForModal, closeModal } from '../../helpers/screenshot'
import { waitForElektraReady } from '../../helpers/navigation'

test.describe('Modal Component - All States', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForElektraReady(page)
  })
  
  test('Modal - Default State', async ({ page }) => {
    await page.goto('/compute/instances')
    
    // Click any modal trigger
    const modalTrigger = page.locator('a[data-modal="true"]').first()
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      await waitForModal(page)
      
      const modal = page.locator('#modal-holder .modal')
      await expect(modal).toHaveScreenshot('modal-default-state.png')
    }
  })
  
  test('Modal - With Form', async ({ page }) => {
    await page.goto('/compute/keypairs')
    await page.click('a:has-text("New Keypair")')
    await waitForModal(page)
    
    const modal = page.locator('#modal-holder .modal')
    await expect(modal).toHaveScreenshot('modal-with-form.png')
  })
  
  test('Modal - Error State', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    // Trigger validation error
    await page.click('button:has-text("Create")')
    await page.waitForSelector('.alert-error, .alert-danger')
    
    await expect(page).toHaveScreenshot('modal-error-state.png')
  })
  
  test('Modal - Loading State', async ({ page }) => {
    await page.goto('/compute/instances')
    
    // Intercept request to delay response
    await page.route('**/compute/instances/*', route => {
      setTimeout(() => route.continue(), 2000)
    })
    
    const modalTrigger = page.locator('a[data-modal="true"]').first()
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      
      // Screenshot während Loading
      await page.waitForSelector('.loading-spinner, .spinner')
      await expect(page.locator('#modal-holder')).toHaveScreenshot('modal-loading-state.png')
    }
  })
})
```

**Datei:** `e2e/playwright/tests/visual/components/buttons.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'

test.describe('Button Component - All Variants', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })
  
  test('Primary Button - Normal State', async ({ page }) => {
    await page.goto('/compute/instances')
    
    const btn = page.locator('.btn-primary').first()
    await expect(btn).toHaveScreenshot('button-primary-normal.png')
  })
  
  test('Primary Button - Hover State', async ({ page }) => {
    await page.goto('/compute/instances')
    
    const btn = page.locator('.btn-primary').first()
    await btn.hover()
    await page.waitForTimeout(200)
    await expect(btn).toHaveScreenshot('button-primary-hover.png')
  })
  
  test('Secondary Button', async ({ page }) => {
    await page.goto('/compute/instances')
    
    const btn = page.locator('.btn-default, .btn-secondary').first()
    if (await btn.isVisible()) {
      await expect(btn).toHaveScreenshot('button-secondary-normal.png')
    }
  })
  
  test('Danger Button', async ({ page }) => {
    await page.goto('/compute/instances')
    
    const btn = page.locator('.btn-danger').first()
    if (await btn.isVisible()) {
      await expect(btn).toHaveScreenshot('button-danger-normal.png')
    }
  })
  
  test('Button Group', async ({ page }) => {
    await page.goto('/compute/instances')
    
    const btnGroup = page.locator('.btn-group').first()
    if (await btnGroup.isVisible()) {
      await expect(btnGroup).toHaveScreenshot('button-group.png')
    }
  })
})
```

**Datei:** `e2e/playwright/tests/visual/components/forms.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'
import { waitForElektraReady } from '../../helpers/navigation'

test.describe('Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })
  
  test('Text Input - Normal', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const input = page.locator('#server_name')
    await expect(input).toHaveScreenshot('form-input-normal.png')
  })
  
  test('Text Input - Focused', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const input = page.locator('#server_name')
    await input.focus()
    await expect(input).toHaveScreenshot('form-input-focused.png')
  })
  
  test('Text Input - With Value', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const input = page.locator('#server_name')
    await input.fill('test-instance')
    await expect(input).toHaveScreenshot('form-input-filled.png')
  })
  
  test('Text Input - Error State', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    await page.click('button:has-text("Create")')
    await page.waitForSelector('.has-error #server_name, .is-invalid#server_name')
    
    const formGroup = page.locator('.form-group:has(#server_name)')
    await expect(formGroup).toHaveScreenshot('form-input-error.png')
  })
  
  test('Select Dropdown', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const select = page.locator('#server_flavor_id')
    await expect(select).toHaveScreenshot('form-select-normal.png')
  })
  
  test('Textarea', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const textarea = page.locator('#server_user_data')
    await expect(textarea).toHaveScreenshot('form-textarea-normal.png')
  })
  
  test('Checkbox', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await waitForElektraReady(page)
    
    const checkbox = page.locator('#server_custom_root_disk')
    if (await checkbox.isVisible()) {
      await expect(checkbox).toHaveScreenshot('form-checkbox-unchecked.png')
      
      await checkbox.check()
      await expect(checkbox).toHaveScreenshot('form-checkbox-checked.png')
    }
  })
})
```

### 2.4 Responsive Tests

**Datei:** `e2e/playwright/tests/visual/responsive/mobile.spec.ts`

```typescript
import { test, devices } from '@playwright/test'
import { login } from '../../helpers/auth'
import { takeVisualSnapshot } from '../../helpers/screenshot'
import { waitForElektraReady } from '../../helpers/navigation'

// Mobile Devices
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPad', device: devices['iPad Pro'] },
]

for (const { name, device } of mobileDevices) {
  test.describe(`Mobile - ${name}`, () => {
    test.use(device)
    
    test.beforeEach(async ({ page }) => {
      await login(page)
    })
    
    test('Dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForElektraReady(page)
      await takeVisualSnapshot(page, `mobile-dashboard-${name}.png`)
    })
    
    test('Compute Instances', async ({ page }) => {
      await page.goto('/compute/instances')
      await waitForElektraReady(page)
      await takeVisualSnapshot(page, `mobile-compute-instances-${name}.png`)
    })
    
    test('Navigation Menu', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForElektraReady(page)
      
      // Open mobile menu
      const menuToggle = page.locator('.navbar-toggle, .mobile-menu-toggle')
      if (await menuToggle.isVisible()) {
        await menuToggle.click()
        await page.waitForTimeout(500)
        await takeVisualSnapshot(page, `mobile-nav-menu-${name}.png`)
      }
    })
  })
}
```

### 2.5 Baseline ausführen

```bash
# Alle Baseline-Tests ausführen
pnpm test:visual

# Nur Compute Plugin
pnpm test:visual tests/visual/baseline/compute.spec.ts

# Snapshots erstellen (erster Lauf)
pnpm test:visual:update

# Report anzeigen
pnpm test:visual:report
```

---

## 🔄 Phase 3: CI/CD Integration

### 3.1 GitHub Actions Workflow

**Datei:** `.github/workflows/playwright-visual-tests.yml`

```yaml
name: Playwright Visual Tests

on:
  pull_request:
    branches: [master, develop]
    paths:
      - 'app/views/**'
      - 'plugins/**/views/**'
      - 'app/assets/stylesheets/**'
      - 'app/javascript/**'
      - 'plugins/**/javascript/**'
      - 'e2e/playwright/**'
  
  # Manual trigger
  workflow_dispatch:

jobs:
  visual-tests:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]  # Parallelize across 4 shards
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.4'
          bundler-cache: true
      
      - name: Setup Database
        run: |
          bundle exec rails db:create RAILS_ENV=test
          bundle exec rails db:schema:load RAILS_ENV=test
      
      - name: Start Rails Server
        run: |
          bundle exec rails server -e test -p 3000 &
          sleep 10
          curl http://localhost:3000 || exit 1
      
      - name: Run Playwright Tests
        run: pnpm test:visual:ci --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: http://localhost:3000
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ matrix.shard }}
          path: test-results/
          retention-days: 30
      
      - name: Upload Screenshots on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots-${{ matrix.shard }}
          path: |
            test-results/**/*.png
            test-results/**/*-diff.png
          retention-days: 30
      
      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30
  
  # Merge sharded reports
  merge-reports:
    name: Merge Test Reports
    needs: visual-tests
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Download all reports
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-report-*
          path: all-reports
      
      - name: Merge Reports
        run: |
          npx playwright merge-reports ./all-reports
      
      - name: Upload Merged Report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
  
  # Comment on PR with results
  comment-pr:
    name: Comment on PR
    needs: [visual-tests, merge-reports]
    runs-on: ubuntu-latest
    if: always() && github.event_name == 'pull_request'
    
    steps:
      - name: Download test results
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-results-*
          path: test-results
      
      - name: Parse Results
        id: results
        run: |
          # Count passed/failed tests
          PASSED=$(find test-results -name "*.json" -exec jq '.suites[].specs[].tests[] | select(.status=="passed")' {} \; | wc -l)
          FAILED=$(find test-results -name "*.json" -exec jq '.suites[].specs[].tests[] | select(.status=="failed")' {} \; | wc -l)
          
          echo "passed=$PASSED" >> $GITHUB_OUTPUT
          echo "failed=$FAILED" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const passed = ${{ steps.results.outputs.passed }}
            const failed = ${{ steps.results.outputs.failed }}
            
            const icon = failed === 0 ? '✅' : '❌'
            const status = failed === 0 ? 'All visual tests passed!' : `${failed} visual test(s) failed`
            
            const body = `## ${icon} Playwright Visual Tests
            
            **Status:** ${status}
            
            - ✅ Passed: ${passed}
            - ❌ Failed: ${failed}
            
            ${failed > 0 ? '⚠️ **Visual regressions detected!** Please review the screenshots in the artifacts.' : ''}
            
            [View full report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            })
```

### 3.2 Pre-commit Hook (Optional)

**Datei:** `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run visual tests on push (optional)
# Uncomment to enable
# pnpm test:visual
```

### 3.3 Baseline-Update Workflow

**Datei:** `.github/workflows/update-visual-baseline.yml`

```yaml
name: Update Visual Baseline

on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to update baselines for'
        required: true
        type: number

jobs:
  update-baseline:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout PR
        uses: actions/checkout@v4
        with:
          ref: refs/pull/${{ inputs.pr_number }}/head
      
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Update Snapshots
        run: pnpm test:visual:update
      
      - name: Commit updated snapshots
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add e2e/playwright/**/*-snapshots/
          git commit -m "chore: update visual test baselines"
          git push
```

---

## 📚 Phase 4: Dokumentation & Training

### 4.1 Team-Dokumentation

**Datei:** `docs/playwright-usage-guide.md`

```markdown
# Playwright Visual Testing - Usage Guide

## Für Entwickler

### Neue Tests schreiben

1. Test-Datei erstellen:
   \`\`\`bash
   e2e/playwright/tests/visual/baseline/my-plugin.spec.ts
   \`\`\`

2. Test schreiben:
   \`\`\`typescript
   import { test } from '@playwright/test'
   import { login } from '../../helpers/auth'
   import { takeVisualSnapshot } from '../../helpers/screenshot'
   
   test('My Page', async ({ page }) => {
     await login(page)
     await page.goto('/my-plugin/my-page')
     await takeVisualSnapshot(page, 'my-page.png')
   })
   \`\`\`

3. Baseline erstellen:
   \`\`\`bash
   pnpm test:visual:update tests/visual/baseline/my-plugin.spec.ts
   \`\`\`

4. Snapshots committen:
   \`\`\`bash
   git add e2e/playwright/**/*-snapshots/
   git commit -m "test: add visual baseline for my-plugin"
   \`\`\`

### Tests lokal ausführen

\`\`\`bash
# Alle Tests
pnpm test:visual

# Specific test file
pnpm test:visual compute.spec.ts

# UI Mode (interaktiv)
pnpm test:visual:ui

# Debug Mode
pnpm test:visual:debug
\`\`\`

### Baseline aktualisieren

Wenn visuelle Änderungen **intentional** sind:

\`\`\`bash
# Alle Snapshots aktualisieren
pnpm test:visual:update

# Nur spezifische Tests
pnpm test:visual:update compute.spec.ts

# Review changes
git diff e2e/playwright/**/*-snapshots/

# Commit
git add e2e/playwright/**/*-snapshots/
git commit -m "chore: update visual baselines after Bootstrap 5 button changes"
\`\`\`

### Test-Failure Debugging

1. Failure im CI:
   - Gehe zu GitHub Actions Run
   - Download "playwright-screenshots" Artifact
   - Öffne `*-diff.png` Files

2. Lokal reproduzieren:
   \`\`\`bash
   pnpm test:visual:headed tests/visual/baseline/compute.spec.ts
   \`\`\`

3. Trace Viewer nutzen:
   \`\`\`bash
   # Nach Test-Failure:
   npx playwright show-trace test-results/*/trace.zip
   \`\`\`

### Best Practices

1. **Dynamischen Content ausblenden:**
   \`\`\`typescript
   await takeVisualSnapshot(page, 'my-page.png', {
     hideElements: ['[data-timestamp]', '.loading-spinner']
   })
   \`\`\`

2. **Warte auf Stabilität:**
   \`\`\`typescript
   await page.waitForLoadState('networkidle')
   await waitForElektraReady(page)
   \`\`\`

3. **Component-Screenshots statt Full-Page:**
   \`\`\`typescript
   const modal = page.locator('#modal-holder .modal')
   await expect(modal).toHaveScreenshot('modal.png')
   \`\`\`

4. **Naming Convention:**
   - Format: `<plugin>-<page>-<state>-<viewport>.png`
   - Beispiel: `compute-new-instance-kvm-selected-desktop.png`

## Für Reviewer

### PR mit Visual Changes reviewen

1. Check CI Status:
   - Grüner Haken: Keine visuellen Änderungen
   - Roter X: Visual Regression detected

2. Bei Failure:
   - Download "playwright-screenshots" Artifact
   - Review Diff-Images
   - Entscheiden: Bug oder intended change?

3. Bei intended change:
   - Request vom Entwickler: Baseline update
   - ODER: Trigger "Update Visual Baseline" Workflow

### Visual Baseline akzeptieren

Option A - Entwickler macht lokal:
\`\`\`bash
git checkout pr-branch
pnpm test:visual:update
git add e2e/playwright/**/*-snapshots/
git commit -m "chore: update visual baselines"
git push
\`\`\`

Option B - Automatisch via GitHub Action:
1. Gehe zu "Actions" Tab
2. Wähle "Update Visual Baseline"
3. Run workflow → Enter PR number
4. Baselines werden automatisch updated und committed
\`\`\`

## Troubleshooting

### "Screenshot comparison failed"
- **Ursache:** Visuelle Änderung erkannt
- **Lösung:** Review diff, bei intended change → update baseline

### "Timeout waiting for selector"
- **Ursache:** Element nicht gefunden
- **Lösung:** Check Selektoren, add `waitForElektraReady()`

### "Different screenshot size"
- **Ursache:** Viewport-Größe unterschiedlich
- **Lösung:** Explicit viewport setzen in test

### Tests sind flaky
- **Ursache:** Animationen, dynamic content
- **Lösung:** 
  - `animations: 'disabled'` in config
  - Hide dynamic elements
  - Increase `maxDiffPixels` tolerance
\`\`\`
```

### 4.2 Team-Training

**Agenda für 2h Workshop:**

1. **Einführung (20 min)**
   - Warum Visual Testing?
   - Playwright vs. Cypress
   - Demo: Diff-Viewer

2. **Hands-On Setup (30 min)**
   - Projekt auschecken
   - Dependencies installieren
   - Ersten Test laufen lassen

3. **Test schreiben (40 min)**
   - Live-Coding: Neuen Test erstellen
   - Helpers nutzen
   - Baseline erstellen

4. **CI/CD Workflow (20 min)**
   - PR-Process
   - Baseline-Updates
   - Artifacts reviewen

5. **Q&A (10 min)**

---

## 📊 Metriken & Monitoring

### Tracking während Bootstrap 5 Migration

**KPIs:**

1. **Visual Regression Rate:**
   - Ziel: <5% unintended regressions pro Sprint
   - Messung: Failed tests / Total tests

2. **Baseline Coverage:**
   - Ziel: 50 kritische Pages nach 4 Wochen
   - Messung: Anzahl Tests

3. **Test Stability:**
   - Ziel: <2% flaky tests
   - Messung: Tests mit inconsistent results

4. **CI/CD Performance:**
   - Ziel: <10min pro Test-Run
   - Messung: GitHub Actions duration

5. **Time to Fix Visual Regression:**
   - Ziel: <1 Tag
   - Messung: Time from detection to resolution

### Dashboard

**Datei:** `docs/visual-testing-dashboard.md`

```markdown
# Visual Testing Dashboard

## Coverage Status

| Plugin | Pages | Tests | Status |
|--------|-------|-------|--------|
| Compute | 10 | 25 | ✅ Complete |
| Networking | 8 | 15 | 🟡 In Progress |
| Identity | 6 | 12 | ✅ Complete |
| Block Storage | 5 | 10 | 🟡 In Progress |
| LBaaS2 | 4 | 8 | ⏳ Pending |
| DNS Service | 5 | 0 | ⏳ Pending |
| **Total** | **50** | **70** | **60% Complete** |

## Recent Test Runs

| Date | Tests | Passed | Failed | Duration |
|------|-------|--------|--------|----------|
| 2026-04-09 | 70 | 68 | 2 | 8m 32s |
| 2026-04-08 | 70 | 70 | 0 | 8m 12s |
| 2026-04-07 | 65 | 63 | 2 | 7m 45s |

## Known Issues

- [ ] Networking: Floating IP list - flaky due to dynamic IPs
- [x] Compute: Instance form - fixed custom root disk rendering
- [ ] Identity: Project list - pagination causes inconsistent screenshots

## Baseline Update History

| Date | PR | Changed Files | Reason |
|------|-----|---------------|--------|
| 2026-04-09 | #1234 | 5 snapshots | Bootstrap 5: Button styles updated |
| 2026-04-08 | #1230 | 2 snapshots | Compute: Fixed instance form layout |
```

---

## 🎓 Anhang

### A. Häufige Selektoren

```typescript
// Modals
'#modal-holder .modal'
'#modal-holder .modal.show'
'.modal-body'
'.modal-footer'

// Forms
'#server_name'
'#server_flavor_id'
'.form-group'
'.has-error'
'.help-block'

// Buttons
'.btn-primary'
'.btn-default'
'.btn-danger'

// Tables
'.table'
'tbody tr'

// Navigation
'.navbar'
'.sidebar'
'.breadcrumb'

// Alerts
'.alert'
'.alert-error'
'.alert-success'
```

### B. Performance-Optimierung

**Schnellere Test-Execution:**

```typescript
// playwright.config.ts
export default defineConfig({
  // Parallel ausführen
  fullyParallel: true,
  workers: 4,
  
  // Nur Failed tests retries
  retries: process.env.CI ? 1 : 0,
  
  // Screenshots nur bei Failure
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Timeout reduzieren
  timeout: 30_000,
  
  // Spezifische Tests ausschließen
  testIgnore: ['**/slow-tests/**'],
})
```

**Test-Grouping:**

```bash
# Nur schnelle Tests in PR
pnpm test:visual tests/visual/components/

# Full Baseline nur Nightly
pnpm test:visual tests/visual/baseline/
```

### C. Troubleshooting Guide

**Problem:** Tests schlagen in CI fehl, lokal aber nicht

**Lösung:**
```typescript
// Ensure consistent rendering
test.use({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
})

// Wait for fonts
await page.evaluate(() => document.fonts.ready)
```

**Problem:** Flaky Tests durch Animationen

**Lösung:**
```typescript
// Disable animations globally
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
})
```

**Problem:** Different screenshots on Mac vs. Linux

**Lösung:**
```typescript
// Use threshold for minor rendering differences
expect: {
  toMatchSnapshot: {
    threshold: 0.2,  // 0.2% difference OK
    maxDiffPixels: 100,
  }
}
```

### D. Checkliste für Baseline-Review

Vor dem Committen von Snapshot-Updates:

- [ ] Alle Diffs manuell reviewt
- [ ] Intentionale Änderungen dokumentiert (Commit-Message)
- [ ] Keine ungewollten Regressions
- [ ] Screenshots sehen auf allen Browsern OK aus
- [ ] Mobile-Views geprüft
- [ ] CI-Tests laufen durch

---

## 🚀 Nächste Schritte

### Woche 1: Setup
- [ ] Playwright installieren
- [ ] Config erstellen
- [ ] Helpers implementieren
- [ ] Login-Flow testen
- [ ] Erste 5 Tests schreiben

### Woche 2: Baseline (Compute)
- [ ] Compute Plugin: 10 Pages
- [ ] Component-Tests: Modals, Buttons
- [ ] Mobile Tests: iPhone, iPad

### Woche 3: Baseline (Weitere Plugins)
- [ ] Networking Plugin: 8 Pages
- [ ] Identity Plugin: 6 Pages
- [ ] Block Storage Plugin: 5 Pages

### Woche 4: CI/CD
- [ ] GitHub Actions Setup
- [ ] PR Integration
- [ ] Team-Training
- [ ] Dokumentation finalisieren

### Ab Woche 5: Production
- [ ] Bootstrap 5 Migration starten
- [ ] Visual Tests als Safety Net
- [ ] Kontinuierliche Baseline-Updates

---

## 📞 Support & Fragen

**Bei Problemen:**
1. Check Troubleshooting Guide (Anhang C)
2. Review Test-Output: `pnpm test:visual:report`
3. GitHub Issues: Tag mit `visual-tests`
4. Team-Slack: #frontend-testing

**Weiterführende Ressourcen:**
- [Playwright Docs](https://playwright.dev)
- [Visual Testing Best Practices](https://playwright.dev/docs/test-snapshots)
- [CI/CD Examples](https://github.com/microsoft/playwright/tree/main/.github/workflows)

---

**Letzte Aktualisierung:** 2026-04-09  
**Version:** 1.0  
**Maintainer:** Development Team
