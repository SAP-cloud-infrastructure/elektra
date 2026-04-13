# ✅ Styleguide Routes sind jetzt korrekt konfiguriert!

## Problem gelöst

Die Styleguide-Routes wurden von Elektras `:domain_id` Routing überschrieben. 
Die Routes wurden jetzt **vor** alle Domain-Routes verschoben (Zeile 38-50 in `config/routes.rb`).

## Jetzt testen

### 1. Rails Server neu starten

```bash
# Alten Server stoppen (Ctrl+C falls läuft)

# Neu starten im Development Mode
rails server

# ODER explizit Development Mode setzen:
RAILS_ENV=development rails server
```

### 2. Im Browser öffnen

```
http://localhost:3000/styleguide
```

### Verfügbare URLs

- **Overview:** http://localhost:3000/styleguide
- **Buttons:** http://localhost:3000/styleguide/buttons
- **Forms:** http://localhost:3000/styleguide/forms
- **Modals:** http://localhost:3000/styleguide/modals

## Warum hat es nicht funktioniert?

Elektra verwendet ein komplexes Routing-System:

```ruby
# Diese Route matched ALLES mit 2 Segmenten:
scope '/:domain_id(/:project_id)(/:plugin)' do
  # ...
end
```

Das bedeutet `/styleguide` wurde als `domain_id: 'styleguide'` interpretiert!

## Die Lösung

Styleguide-Routes wurden **ganz nach oben** verschoben (nach `/system` aber **vor** `/:domain_id`):

```ruby
# Zeile 38-50 in config/routes.rb
if Rails.env.development? || Rails.env.test?
  get '/styleguide', to: 'styleguide#index', as: :styleguide_root
  get '/styleguide/buttons', to: 'styleguide#buttons', as: :styleguide_buttons
  # ...
end
```

Rails matched Routes von **oben nach unten**, also wird jetzt `/styleguide` **vor** `/:domain_id` gefunden.

## Falls es immer noch nicht funktioniert

### Check 1: Rails Environment

```bash
# Im Terminal wo der Server läuft:
echo $RAILS_ENV

# Sollte leer sein (= development) oder "development"
# Falls "production": Styleguide ist nur in dev/test verfügbar!
```

### Check 2: Server wirklich neu gestartet?

Routes werden nur beim Server-Start geladen. **Unbedingt neu starten** nach Routes-Änderungen!

### Check 3: Authentication Problem?

Falls Redirect zur Login-Seite:

```ruby
# app/controllers/styleguide_controller.rb prüfen
skip_before_action :authentication, if: :styleguide_env?
```

Möglicherweise verwendet deine App andere Authentication-Methoden. Prüfe `application_controller.rb` für die korrekten Methoden-Namen.

### Check 4: Syntax Error in routes.rb?

```bash
ruby -c config/routes.rb
# Sollte "Syntax OK" ausgeben
```

## Nach erfolgreichem Start

### Tipp 1: Navigiere durch die Komponenten

Der Styleguide hat eine Top-Navigation mit allen verfügbaren Seiten.

### Tipp 2: Playwright Tests ausführen

```bash
# Server muss laufen!
# In einem anderen Terminal:
pnpm test:e2e:ui
```

Die Tests unter `e2e/playwright/tests/visual/styleguide/` testen:
- Buttons (8 Tests)
- Forms (10 Tests)
- Modals (7 Tests)

### Tipp 3: Weitere Komponenten hinzufügen

Siehe `docs/styleguide-setup-guide.md` für Anleitung zum Hinzufügen von:
- Tables
- Alerts
- Navigation
- Typography
- Panels

## Quick Check Commands

```bash
# 1. Server starten
rails server

# 2. In neuem Terminal: Test ob es läuft
curl http://localhost:3000/styleguide
# Sollte HTML zurückgeben (nicht 404)

# 3. Im Browser öffnen
open http://localhost:3000/styleguide
```

---

**Problem behoben:** 2026-04-10  
**Root Cause:** Routing-Konflikte mit `/:domain_id` Pattern  
**Solution:** Routes vor Domain-Pattern verschoben
