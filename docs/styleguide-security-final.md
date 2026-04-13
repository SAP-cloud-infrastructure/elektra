# Styleguide Security - Final Setup

## Implementierte Lösung: Development/Test Only

**Einfachste und sicherste Lösung ohne Credential-Management**

### Routes nur in dev/test verfügbar

```ruby
# config/routes.rb
if Rails.env.development? || Rails.env.test?
  scope '/__styleguide' do
    # ... styleguide routes
  end
end
```

**Production:** ✅ Routes existieren nicht → 404 Error
**Development:** ✅ Voll verfügbar ohne Auth
**Test:** ✅ Playwright Tests funktionieren

## Zugriff

**Development:**
```bash
http://localhost:3000/__styleguide
http://localhost:3000/__styleguide/modals
```

**Production:**
```bash
http://production.com/__styleguide
# → 404 Not Found
```

## Vorteile

✅ **Keine Credentials:** Kein Password-Management, keine Rotation
✅ **Zero Config:** Funktioniert out-of-the-box
✅ **Sicher:** In Production nicht verfügbar
✅ **Einfach:** Keine zusätzliche Komplexität
✅ **Playwright-kompatibel:** Tests brauchen keine Auth

## Use Case: Bootstrap 5 Migration

### Workflow:

1. **Baselines erstellen (Development):**
   ```bash
   rails server
   cd e2e/playwright
   pnpm test:visual:update tests/visual/styleguide/
   git add . && git commit -m "Bootstrap 3 baselines"
   ```

2. **Bootstrap upgraden:**
   ```bash
   # Gemfile ändern
   bundle update bootstrap-sass
   ```

3. **Visual Diffs prüfen (Development):**
   ```bash
   pnpm test:visual tests/visual/styleguide/
   # Sehe alle Breaking Changes in den Screenshots
   ```

4. **Fixes implementieren:**
   ```bash
   # CSS anpassen, .btn-default → .btn-secondary, etc.
   ```

5. **Neue Baselines (Development):**
   ```bash
   pnpm test:visual:update tests/visual/styleguide/
   git commit -m "Bootstrap 5 baselines"
   ```

### CI/CD Integration

Der Styleguide läuft in Test-Environment automatisch:

```yaml
# .github/workflows/visual-tests.yml
- name: Run Visual Tests
  run: |
    RAILS_ENV=test bundle exec rails server &
    cd e2e/playwright
    pnpm test:visual tests/visual/styleguide/
```

## Warum nicht in Production?

**Gründe:**

1. **Keine Production-Daten:** Der Styleguide zeigt nur statische Bootstrap-Komponenten, keine echten Daten
2. **Development-Tool:** Ist ein Entwicklungs- und Test-Tool, kein Production-Feature
3. **Keine User-Nachfrage:** Normale User brauchen keinen Styleguide
4. **Security:** Weniger Angriffsfläche in Production

**Wenn doch Production-Testing nötig:**

→ Verwende Staging-Environment mit `RAILS_ENV=test`

## robots.txt (Optional)

Falls du es doch mal in Production brauchst:

```
# public/robots.txt
User-agent: *
Disallow: /__styleguide
```

Aber da die Routes gar nicht existieren in Production, ist das nicht nötig.

## Alternative: Feature Flag

Falls du später doch Production-Zugriff brauchst:

```ruby
# config/routes.rb
if Rails.env.development? || Rails.env.test? || ENV['ENABLE_STYLEGUIDE'] == 'true'
  scope '/__styleguide' do
    # routes...
  end
end
```

Dann in Production wenn nötig:
```bash
ENABLE_STYLEGUIDE=true rails server
```

Aber das brauchst du vermutlich nicht.

## Fazit

**Aktuelle Lösung:**
- ✅ Nur in dev/test verfügbar
- ✅ Keine Auth, keine Credentials
- ✅ Versteckter Pfad `/__styleguide`
- ✅ In Production nicht vorhanden

**Perfekt für:**
- ✅ Bootstrap 3 → 5 Migration
- ✅ Visual Regression Testing
- ✅ Component Documentation
- ✅ CI/CD Integration

---

**Status:** Production-safe, zero-config, development-ready
