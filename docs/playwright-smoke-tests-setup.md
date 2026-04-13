# Playwright Setup & Smoke Tests - Quick Start

## Was wurde eingerichtet

✅ Playwright Konfiguration (`playwright.config.ts`)  
✅ 5 Smoke Test Suites mit 18+ Tests:
  - Homepage Tests (4 Tests)
  - Login Page Tests (3 Tests)
  - Static Assets Tests (3 Tests)
  - Responsive Design Tests (4 Tests)
  - Basic Accessibility Tests (4 Tests)
✅ npm Scripts für einfache Verwendung  
✅ README und .gitignore

## Installation (einmalig)

```bash
# 1. Playwright installieren (vom Projekt-Root)
pnpm add -D @playwright/test

# 2. Chromium Browser installieren
cd e2e/playwright
npx playwright install chromium --with-deps
```

## Tests ausführen

```bash
# Rails Server starten (in separatem Terminal)
rails server

# Tests im Headless Mode
pnpm test:e2e

# Tests mit UI (EMPFOHLEN für Entwicklung)
pnpm test:e2e:ui

# Tests mit sichtbarem Browser
pnpm test:e2e:headed

# Einzelnen Test debuggen
pnpm test:e2e:debug tests/smoke/homepage.spec.ts

# Test Report anzeigen
pnpm test:e2e:report
```

## Test Übersicht

### 1. Homepage Tests (`tests/smoke/homepage.spec.ts`)
- ✅ Lädt die Homepage erfolgreich
- ✅ Navigation wird angezeigt
- ✅ Keine Console Errors
- ✅ Ladezeit unter 5 Sekunden

### 2. Login Tests (`tests/smoke/login.spec.ts`)
- ✅ Login-Seite lädt
- ✅ Login-Form oder SSO Button vorhanden
- ✅ Keine JavaScript Errors

### 3. Assets Tests (`tests/smoke/assets.spec.ts`)
- ✅ CSS lädt ohne Fehler
- ✅ JavaScript lädt ohne Fehler
- ✅ Bilder sind nicht kaputt

### 4. Responsive Tests (`tests/smoke/responsive.spec.ts`)
- ✅ Desktop Viewport (1920x1080)
- ✅ Tablet Viewport (768x1024)
- ✅ Mobile Viewport (375x667)
- ✅ Mobile Navigation vorhanden

### 5. Accessibility Tests (`tests/smoke/accessibility.spec.ts`)
- ✅ Dokument-Struktur korrekt
- ✅ H1 Heading vorhanden
- ✅ HTML lang Attribut gesetzt
- ✅ Keyboard Navigation möglich

## Anpassungen für dein Projekt

### Login Route anpassen

Falls eure Login-Route anders ist, passe sie in `tests/smoke/login.spec.ts` an:

```typescript
// Aktuell:
await page.goto('/auth/sessions/new')

// Falls anders, z.B.:
await page.goto('/login')
```

### Base URL ändern

Standard ist `http://localhost:3000`. Falls anders:

```bash
BASE_URL=http://localhost:5000 pnpm test:e2e
```

### Weitere Tests hinzufügen

Kopiere eine bestehende Test-Datei und passe sie an:

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Test Suite', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-route')
    await page.waitForLoadState('networkidle')
    
    // Dein Test Code
    const element = page.locator('#my-element')
    await expect(element).toBeVisible()
  })
})
```

## CI Integration (GitHub Actions)

Beispiel `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Install Playwright
        run: cd e2e/playwright && npx playwright install --with-deps chromium
        
      - name: Start Rails server
        run: |
          bundle install
          rails server -e test &
          sleep 10
          
      - name: Run Playwright tests
        run: pnpm test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: e2e/playwright/playwright-report/
```

## Nächste Schritte

1. **Jetzt testen:**
   ```bash
   pnpm add -D @playwright/test
   cd e2e/playwright && npx playwright install chromium --with-deps
   cd ../..
   rails server
   # In neuem Terminal:
   pnpm test:e2e:ui
   ```

2. **Login-Route anpassen** (falls nötig)

3. **Weitere Public Routes testen:**
   - About/Info Seiten
   - Documentation
   - Status/Health Check Endpoints

4. **Später: Styleguide Tests hinzufügen** (aus vorherigen Dokumenten)

## Troubleshooting

### "Cannot find module @playwright/test"
```bash
pnpm add -D @playwright/test
```

### "Executable doesn't exist"
```bash
cd e2e/playwright
npx playwright install chromium --with-deps
```

### Tests hängen bei Navigation
Rails Server läuft nicht oder falsche URL:
```bash
# Server Status prüfen
curl http://localhost:3000

# BASE_URL setzen
BASE_URL=http://localhost:5000 pnpm test:e2e
```

### Tests sind flaky
Timeouts erhöhen in `playwright.config.ts`:
```typescript
timeout: 60_000,  // 60 Sekunden
```

## Hilfreiche Commands

```bash
# Alle Tests mit vollem Output
pnpm test:e2e --reporter=list

# Nur einen Test
pnpm test:e2e tests/smoke/homepage.spec.ts

# Tests mit bestimmtem Name
pnpm test:e2e -g "should load successfully"

# Test pausieren für Debugging
# Im Test Code: await page.pause()

# Codegen - Playwright generiert Test Code
cd e2e/playwright
npx playwright codegen http://localhost:3000
```

## Playwright Dokumentation

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)

---

**Erstellt:** 2026-04-10  
**Tests:** 18+ Smoke Tests für Public Routes
