# Playwright Visual Testing - Quick Start Guide

**Ziel:** In 30 Minuten von 0 zu ersten funktionierenden Visual Tests

---

## ⚡ 5-Minuten Setup

### 1. Installation

```bash
cd /path/to/elektra

# Playwright installieren
pnpm add -D @playwright/test

# Browser binaries installieren (dauert ~2 min)
npx playwright install chromium --with-deps
```

### 2. Test-Verzeichnis erstellen

```bash
mkdir -p e2e/playwright/tests/{visual/baseline,helpers}
mkdir -p e2e/playwright/tests/visual/components
```

### 3. Minimale Konfiguration

**Datei erstellen:** `e2e/playwright/playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  expect: {
    toMatchSnapshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  projects: [
    { name: 'chromium', use: { viewport: { width: 1920, height: 1080 } } },
  ],
})
```

### 4. Package.json Scripts

Zu `package.json` hinzufügen:

```json
{
  "scripts": {
    "test:visual": "playwright test",
    "test:visual:ui": "playwright test --ui",
    "test:visual:update": "playwright test --update-snapshots",
    "test:visual:report": "playwright show-report"
  }
}
```

**Setup fertig! ✅**

---

## 🎯 Ersten Test schreiben (10 Minuten)

### Schritt 1: Login Helper

**Datei:** `e2e/playwright/tests/helpers/auth.ts`

```typescript
import { Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/auth/login')
  
  // Passe an eure Login-Form an
  await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'test-user')
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'test-pass')
  await page.click('button[type="submit"]')
  
  // Warte auf erfolgreichen Login
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}
```

### Schritt 2: Erster Visual Test

**Datei:** `e2e/playwright/tests/visual/baseline/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'

test.describe('Dashboard - Visual Baseline', () => {
  test('Dashboard Page', async ({ page }) => {
    // Login
    await login(page)
    
    // Zur Dashboard navigieren
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Screenshot erstellen
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
    })
  })
})
```

### Schritt 3: Test ausführen

```bash
# Environment variables setzen (optional)
export TEST_USERNAME=your-test-user
export TEST_PASSWORD=your-test-password

# Rails Server starten (in anderem Terminal)
rails server -p 3000

# Test ausführen (erstellt Baseline beim ersten Mal)
cd e2e/playwright
pnpm test:visual:update
```

**Ergebnis:**
```
Running 1 test using 1 worker
✓ dashboard.spec.ts:4:3 › Dashboard Page (5s)

1 passed (5s)
```

**Screenshot erstellt:**
```
e2e/playwright/tests/visual/baseline/
  dashboard.spec.ts-snapshots/
    dashboard-page-chromium.png  ← Deine Baseline!
```

### Schritt 4: Test erneut ausführen (ohne --update-snapshots)

```bash
pnpm test:visual
```

**Bei Erfolg:**
```
✓ dashboard.spec.ts:4:3 › Dashboard Page (3s)
  Screenshot matched!
```

**Bei Änderung:**
```
✗ dashboard.spec.ts:4:3 › Dashboard Page (3s)
  Error: Screenshot comparison failed:
    12 pixels (ratio 0.02 of all image pixels) are different
```

**Fertig! Du hast deinen ersten Visual Test! 🎉**

---

## 🚀 Nächste Schritte (15 Minuten)

### Test #2: Compute Instance Form

**Datei:** `e2e/playwright/tests/visual/baseline/compute.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'

test.describe('Compute Plugin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })
  
  test('Instance List', async ({ page }) => {
    await page.goto('/compute/instances')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('compute-instances-list.png')
  })
  
  test('New Instance Form - Initial', async ({ page }) => {
    await page.goto('/compute/instances/new')
    
    // Warte bis Formular geladen
    await page.waitForSelector('#server_flavor_id')
    await page.waitForTimeout(500)  // Rendering abwarten
    
    await expect(page).toHaveScreenshot('compute-new-instance-form.png')
  })
  
  test('New Instance Form - KVM Selected', async ({ page }) => {
    await page.goto('/compute/instances/new')
    await page.waitForSelector('#server_flavor_id')
    
    // KVM Flavor auswählen
    await page.selectOption('#server_flavor_id', { label: /kvm/ })
    await page.waitForSelector('#kvm_image_id_wrapper:visible')
    await page.waitForTimeout(500)
    
    await expect(page).toHaveScreenshot('compute-new-instance-kvm.png')
  })
})
```

```bash
# Baseline erstellen
pnpm test:visual:update compute.spec.ts

# Test ausführen
pnpm test:visual compute.spec.ts
```

### Test #3: Modal Component

**Datei:** `e2e/playwright/tests/visual/components/modals.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../../helpers/auth'

test.describe('Modal Component', () => {
  test('Modal - Open State', async ({ page }) => {
    await login(page)
    await page.goto('/compute/instances')
    
    // Ersten Modal-Link klicken
    const modalLink = page.locator('a[data-modal="true"]').first()
    if (await modalLink.isVisible()) {
      await modalLink.click()
      
      // Warte auf Modal
      await page.waitForSelector('#modal-holder .modal.show, #modal-holder .modal.in')
      await page.waitForTimeout(500)  // Animation abwarten
      
      // Screenshot nur vom Modal
      const modal = page.locator('#modal-holder .modal')
      await expect(modal).toHaveScreenshot('modal-default.png')
    }
  })
})
```

---

## 🎨 UI Mode - Interaktives Testing

**Playwright UI Mode** ist der beste Weg, Tests zu entwickeln:

```bash
pnpm test:visual:ui
```

**Features:**
- 🔍 Tests live ausführen
- ⏯️ Pause/Resume
- 🔎 DOM Inspector
- 📸 Screenshot Vergleich
- ⚡ Zeit-Reise (Time Travel)

**Workflow:**
1. Test in UI Mode öffnen
2. Test ausführen
3. Bei Failure: Screenshot-Diff ansehen
4. Code anpassen
5. Re-run

---

## 📊 Report ansehen

Nach Test-Ausführung:

```bash
pnpm test:visual:report
```

**Öffnet HTML-Report mit:**
- ✅ Passed/Failed Tests
- 📸 Screenshots (Expected vs. Actual vs. Diff)
- ⏱️ Test-Dauer
- 📝 Logs & Traces

---

## 🔧 Häufige Probleme & Lösungen

### Problem 1: "Target closed" Error

**Ursache:** Rails Server nicht gestartet

**Lösung:**
```bash
# In separatem Terminal:
rails server -p 3000
```

### Problem 2: "Selector not found"

**Ursache:** Element lädt langsam oder Selector falsch

**Lösung:**
```typescript
// Explizit warten
await page.waitForSelector('#my-element', { timeout: 10_000 })

// ODER: networkidle warten
await page.waitForLoadState('networkidle')
```

### Problem 3: Screenshots unterscheiden sich minimal

**Ursache:** Anti-Aliasing, Font-Rendering

**Lösung:**
```typescript
// In playwright.config.ts Toleranz erhöhen:
expect: {
  toMatchSnapshot: {
    maxDiffPixels: 200,  // Erhöht von 100
    threshold: 0.3,      // Erhöht von 0.2
  }
}
```

### Problem 4: Flaky Tests (mal Pass, mal Fail)

**Ursache:** Animationen, dynamischer Content

**Lösung:**
```typescript
// Dynamischen Content ausblenden
await page.evaluate(() => {
  document.querySelectorAll('[data-timestamp], .spinner').forEach(el => {
    (el as HTMLElement).style.visibility = 'hidden'
  })
})

// Animationen deaktivieren (global in config)
use: {
  screenshot: {
    animations: 'disabled',
  }
}
```

### Problem 5: Tests laufen lokal, aber nicht in CI

**Ursache:** Unterschiedliches Font-Rendering Linux vs. Mac

**Lösung:**
```typescript
// In playwright.config.ts:
use: {
  deviceScaleFactor: 1,  // Force scale factor
  viewport: { width: 1920, height: 1080 },
}

// Fonts laden warten:
await page.evaluate(() => document.fonts.ready)
```

---

## 📝 Cheat Sheet

### Test ausführen
```bash
pnpm test:visual                    # Alle Tests
pnpm test:visual compute.spec.ts    # Spezifischer Test
pnpm test:visual --grep "Dashboard" # Tests mit "Dashboard"
pnpm test:visual:ui                 # UI Mode
pnpm test:visual:headed             # Mit sichtbarem Browser
```

### Baseline updaten
```bash
pnpm test:visual:update                 # Alle
pnpm test:visual:update compute.spec.ts # Spezifisch
```

### Debugging
```bash
pnpm test:visual:debug compute.spec.ts  # Step-by-step Debugger
npx playwright show-trace trace.zip     # Trace ansehen
```

### Screenshots ansehen
```bash
pnpm test:visual:report                 # HTML Report öffnen

# Oder manuell:
open test-results/*/actual.png          # Aktueller Screenshot
open test-results/*/expected.png        # Expected Screenshot  
open test-results/*/*-diff.png          # Diff (rot markiert)
```

---

## ✅ Nächste Schritte

Nach diesem Quick Start:

1. **Mehr Tests schreiben:**
   - [ ] Top 5 kritische Pages deines Plugins
   - [ ] Modal/Form-Komponenten
   - [ ] Mobile-Views

2. **CI/CD Integration:**
   - [ ] GitHub Actions Workflow (siehe Hauptdokumentation)
   - [ ] PR-Integration

3. **Team onboarden:**
   - [ ] Quick Start mit Team teilen
   - [ ] Live-Demo zeigen
   - [ ] Erste Tests gemeinsam schreiben

4. **Vollständigen Plan lesen:**
   - [ ] `docs/playwright-visual-testing-plan.md`

---

## 🆘 Hilfe bekommen

1. **Playwright Docs:** https://playwright.dev
2. **Team-Slack:** #frontend-testing
3. **GitHub Issues:** Tag mit `visual-tests`
4. **Hauptdokumentation:** `docs/playwright-visual-testing-plan.md`

---

**Happy Testing! 🎭**

_Erstellt: 2026-04-09 | Version: 1.0_
