# Playwright Tests - Quick Start

## ✅ Voraussetzungen

1. **Playwright installiert?**
   ```bash
   pnpm add -D @playwright/test
   cd e2e/playwright
   npx playwright install chromium --with-deps
   ```

2. **Rails Server läuft?**
   ```bash
   rails server
   # Sollte auf http://localhost:3000 laufen
   ```

## 🚀 Tests ausführen

### Terminal 1: Rails Server
```bash
rails server
```

### Terminal 2: Playwright Tests

#### **UI Mode (EMPFOHLEN für Entwicklung)**
```bash
pnpm test:e2e:ui
```
- Interaktives UI
- Siehst Tests live
- Kannst einzelne Tests auswählen
- Best für Entwicklung!

#### **Headless Mode (schnell)**
```bash
pnpm test:e2e
```
- Keine UI
- Wie in CI
- Schnellster Mode

#### **Headed Mode (siehst Browser)**
```bash
pnpm test:e2e:headed
```
- Browser-Fenster sichtbar
- Gut zum Debuggen

#### **Debug Mode (Schritt für Schritt)**
```bash
pnpm test:e2e:debug
```
- Pausiert bei jedem Schritt
- Playwright Inspector

## 📸 Visual Tests (Styleguide)

### Erster Start - Baselines erstellen

```bash
# Terminal 1: Rails Server muss laufen!
rails server

# Terminal 2: Erstelle Baseline-Screenshots
pnpm test:e2e:update tests/visual/styleguide/

# Das erstellt Screenshots in:
# e2e/playwright/tests/visual/styleguide/*-snapshots/
```

### Nachfolgende Tests - Gegen Baselines prüfen

```bash
# Normale Tests (vergleicht mit Baselines)
pnpm test:e2e tests/visual/styleguide/

# Alle Styleguide Tests
pnpm test:e2e tests/visual/styleguide/

# Nur Modals
pnpm test:e2e tests/visual/styleguide/modals.spec.ts

# Nur Buttons
pnpm test:e2e tests/visual/styleguide/buttons.spec.ts

# Nur Forms
pnpm test:e2e tests/visual/styleguide/forms.spec.ts
```

## 🎯 Kompletter Workflow

```bash
# 1. Server starten
rails server

# 2. In neuem Terminal: Baselines erstellen (nur beim ersten Mal)
pnpm test:e2e:update tests/visual/styleguide/

# 3. Baselines committen
git add e2e/playwright/tests/visual/styleguide/*-snapshots/
git commit -m "Add Bootstrap 3 visual baselines"

# 4. Jetzt kannst du Tests normal laufen lassen
pnpm test:e2e:ui
```

## 📊 Test Report ansehen

```bash
# Nach einem Test-Lauf
pnpm test:e2e:report
```

Öffnet HTML-Report mit:
- ✅ Welche Tests passed/failed
- 📸 Screenshot-Diffs (bei Visual Tests)
- 📝 Traces und Logs

## 🔧 Nur Smoke Tests (keine Visual Tests)

```bash
# Nur die einfachen Smoke Tests
pnpm test:e2e tests/smoke/
```

## 🐛 Debugging

### Test hängt?
```bash
# Erhöhe Timeout
cd e2e/playwright
playwright test --timeout=60000
```

### Rails Server läuft nicht?
```bash
# Prüfen
curl http://localhost:3000/__styleguide
# Sollte HTML zurückgeben
```

### Test schlägt fehl?
```bash
# Mit UI Mode debuggen
pnpm test:e2e:ui

# Oder mit Debug Mode
pnpm test:e2e:debug tests/visual/styleguide/modals.spec.ts
```

## 📁 Test-Struktur

```
e2e/playwright/
├── playwright.config.ts          # Konfiguration
├── tests/
│   ├── smoke/                    # Einfache Smoke Tests
│   │   ├── homepage.spec.ts
│   │   ├── login.spec.ts
│   │   └── ...
│   └── visual/
│       └── styleguide/           # Visual Regression Tests
│           ├── buttons.spec.ts
│           ├── forms.spec.ts
│           ├── modals.spec.ts
│           └── *-snapshots/      # Baseline Screenshots
└── playwright-report/            # Test Reports (gitignored)
```

## 🎨 Bootstrap 3 → 5 Migration Workflow

### 1. Baselines mit Bootstrap 3 erstellen
```bash
rails server
pnpm test:e2e:update tests/visual/styleguide/
git add . && git commit -m "Bootstrap 3 baselines"
```

### 2. Bootstrap upgraden
```bash
# In Gemfile: bootstrap-sass → bootstrap
bundle update
```

### 3. Tests laufen lassen - sehe Diffs!
```bash
pnpm test:e2e:ui
# Zeigt alle visuellen Änderungen!
```

### 4. CSS Fixes machen
```bash
# .btn-default → .btn-secondary, etc.
```

### 5. Neue Baselines
```bash
pnpm test:e2e:update tests/visual/styleguide/
git commit -m "Bootstrap 5 migration complete"
```

## ⚡ Cheat Sheet

```bash
# Häufigste Befehle
pnpm test:e2e:ui                              # UI Mode (beste für Dev)
pnpm test:e2e tests/visual/styleguide/        # Alle Styleguide Tests
pnpm test:e2e:update tests/visual/styleguide/ # Baselines updaten
pnpm test:e2e:report                          # Report anschauen
pnpm test:e2e:debug modals.spec.ts            # Debug einzelnen Test
```

## 💡 Tipps

1. **Immer UI Mode verwenden beim Entwickeln** - du siehst sofort was passiert
2. **Baselines nur updaten wenn du sicher bist** - Visual Changes sind erwünscht
3. **Teste lokal vor dem Push** - Visual Tests können in CI anders aussehen (Fonts!)
4. **Server muss laufen** - Sonst schlagen alle Tests fehl

---

**Los geht's:** `rails server` → `pnpm test:e2e:ui` 🚀
