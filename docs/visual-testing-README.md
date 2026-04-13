# Elektra Visual Testing Documentation

Dokumentation für Playwright Visual Regression Testing im Elektra-Projekt.

---

## 📚 Dokumente

### 1. [Quick Start Guide](./playwright-quick-start.md) ⚡
**Für:** Entwickler, die sofort loslegen wollen  
**Dauer:** 30 Minuten  
**Inhalt:**
- 5-Minuten Setup
- Ersten Test schreiben
- Häufige Probleme lösen
- Cheat Sheet

👉 **Start hier, wenn du noch nie Playwright benutzt hast!**

---

### 2. [Vollständiger Implementation Plan](./playwright-visual-testing-plan.md) 📋
**Für:** Tech Leads, Projektplanung  
**Dauer:** Lesedauer 20 Minuten  
**Inhalt:**
- Detaillierter 4-Wochen Plan
- Setup & Konfiguration (Code-Beispiele)
- Baseline Creation (50+ Pages)
- CI/CD Integration
- Team-Training
- Troubleshooting Guide

👉 **Lies das für vollständigen Kontext und Projektplanung!**

---

## 🎯 Was ist Visual Testing?

Visual Testing automatisiert den Vergleich von UI-Screenshots zwischen Code-Änderungen:

```
1. Baseline erstellen:     Screenshot_v1.png (committed)
2. Code ändern:             Bootstrap 3 → Bootstrap 5
3. Test ausführen:          Screenshot_v2.png
4. Automatischer Vergleich: v1 vs. v2
   ├─ ✅ Gleich: Test passed
   └─ ❌ Unterschied: Test failed + Diff-Image
```

**Vorteile:**
- ✅ Automatische Regression-Detection während Bootstrap 5 Migration
- ✅ Cross-Browser Testing (Chrome, Firefox, Safari)
- ✅ Mobile/Responsive Testing automatisch
- ✅ Dokumentation des visuellen Zustands
- ✅ Reduziert manuelle QA-Zeit um ~50%

---

## 🚀 Schnelleinstieg

### Für Eilige (nur Basics)

```bash
# 1. Installation
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# 2. Config erstellen
cat > e2e/playwright/playwright.config.ts << 'EOF'
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:3000' },
})
EOF

# 3. Ersten Test schreiben (siehe Quick Start Guide)

# 4. Test ausführen
pnpm test:visual
```

### Für gründliches Setup

👉 Folge dem **[Quick Start Guide](./playwright-quick-start.md)** (30 Minuten)

---

## 📖 Dokumentationsübersicht

| Dokument | Zweck | Zielgruppe | Lesezeit |
|----------|-------|------------|----------|
| [Quick Start](./playwright-quick-start.md) | Sofort loslegen | Entwickler | 30 min |
| [Implementation Plan](./playwright-visual-testing-plan.md) | Vollständiger Rollout-Plan | Tech Leads, PM | 20 min |

---

## 🗂️ Projektstruktur (nach Setup)

```
elektra/
├── e2e/
│   ├── cypress/              # Bestehendes Cypress (bleibt)
│   └── playwright/           # NEU: Playwright Visual Tests
│       ├── tests/
│       │   ├── visual/
│       │   │   ├── baseline/           # Page-Level Tests
│       │   │   │   ├── compute.spec.ts
│       │   │   │   ├── networking.spec.ts
│       │   │   │   └── ...
│       │   │   ├── components/         # Component-Level Tests
│       │   │   │   ├── modals.spec.ts
│       │   │   │   ├── buttons.spec.ts
│       │   │   │   └── forms.spec.ts
│       │   │   └── responsive/         # Mobile/Tablet Tests
│       │   └── helpers/
│       │       ├── auth.ts
│       │       ├── screenshot.ts
│       │       └── navigation.ts
│       └── playwright.config.ts
├── playwright-report/        # Auto-generierte HTML-Reports
└── test-results/            # Screenshots & Diffs
```

---

## 🎬 Demo-Video (TODO)

_Nach Setup: Team-Demo-Video aufnehmen und hier verlinken_

---

## 🤝 Workflow

### Für Entwickler

1. **Neue Feature entwickeln**
2. **Visual Test schreiben**
   ```bash
   pnpm test:visual:update my-test.spec.ts  # Baseline erstellen
   ```
3. **Committen**
   ```bash
   git add e2e/playwright/
   git commit -m "feat: add new feature + visual tests"
   ```
4. **PR erstellen** → CI läuft automatisch

### Für Reviewer

1. **CI-Status prüfen**
   - ✅ Grün: Keine visuellen Änderungen
   - ❌ Rot: Visual Regression detected

2. **Bei Regression:**
   - Artifacts downloaden
   - Diff-Screenshots reviewen
   - Entscheiden: Bug oder intended change?

3. **Bei intended change:**
   - Entwickler: Baseline updaten
   - Re-push → CI wird grün

---

## 📊 Status (Update nach Rollout)

| Phase | Status | Completion |
|-------|--------|------------|
| Setup & Konfiguration | ⏳ Pending | 0% |
| Baseline Creation | ⏳ Pending | 0% |
| CI/CD Integration | ⏳ Pending | 0% |
| Team Training | ⏳ Pending | 0% |

**Last Updated:** 2026-04-09

---

## 🔗 Weiterführende Links

### Playwright Dokumentation
- [Official Docs](https://playwright.dev)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Interne Ressourcen
- GitHub Repo: `sapcc/elektra`
- CI/CD: GitHub Actions
- Slack: `#frontend-testing`

---

## 💡 FAQ

### Warum Playwright zusätzlich zu Cypress?

**Cypress:** Funktionale E2E-Tests (User Flows, Business Logic)  
**Playwright:** Visual Regression Tests (UI Appearance, Layout)

Beide haben ihren Platz - **komplementär**, nicht "entweder/oder"!

### Wie lange dauert der Setup?

- **Minimal-Setup:** 5 Minuten
- **Quick Start (inkl. ersten Tests):** 30 Minuten
- **Vollständiger Rollout:** 3-4 Wochen (siehe Implementation Plan)

### Muss ich Playwright lernen?

**Für Basic Usage:** Nein - Quick Start Guide reicht  
**Für Advanced Features:** Ja - aber sehr ähnlich zu Cypress

### Was kostet das?

**Playwright:** 100% Open Source, kostenlos  
**CI/CD:** Läuft in GitHub Actions (kostenlos für Public Repos)

### Ersetzt das manuelle Testing?

**Nein!** Visual Tests ergänzen manuelle Tests:
- Automatisch: Pixel-perfect Regressions
- Manuell: UX, User Flows, Edge Cases

---

## 🆘 Support

**Bei Fragen oder Problemen:**

1. Check [Quick Start Troubleshooting](./playwright-quick-start.md#-häufige-probleme--lösungen)
2. Check [Implementation Plan Troubleshooting](./playwright-visual-testing-plan.md#troubleshooting-guide)
3. Frag im Team-Slack: `#frontend-testing`
4. Erstelle GitHub Issue mit Tag `visual-tests`

---

## 📝 Changelog

| Datum | Version | Änderungen |
|-------|---------|------------|
| 2026-04-09 | 1.0 | Initial Documentation erstellt |

---

**Maintainer:** Development Team  
**Last Updated:** 2026-04-09
