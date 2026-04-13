# Styleguide Browser Zugriff

## ✅ Setup ist komplett!

Der Styleguide ist bereits vollständig eingerichtet:
- ✅ Routes hinzugefügt in `config/routes.rb`
- ✅ Controller erstellt: `app/controllers/styleguide_controller.rb`
- ✅ Views erstellt: `app/views/styleguide/`
- ✅ Layout erstellt: `app/views/layouts/styleguide.html.haml`

## 🌐 Styleguide öffnen

### 1. Rails Server starten

```bash
# Development Mode
rails server

# Oder mit Port-Angabe
rails server -p 3000
```

### 2. Im Browser öffnen

```
http://localhost:3000/styleguide
```

## 📑 Verfügbare Seiten

Nach dem Start des Servers kannst du diese URLs aufrufen:

- **Overview:** http://localhost:3000/styleguide
- **Buttons:** http://localhost:3000/styleguide/buttons
- **Forms:** http://localhost:3000/styleguide/forms
- **Modals:** http://localhost:3000/styleguide/modals

Die anderen Seiten (tables, alerts, navigation, typography, panels) haben noch keine Views, können aber später hinzugefügt werden.

## ⚠️ Wichtig

Der Styleguide ist **nur im Development und Test Mode** verfügbar:

```ruby
# config/routes.rb
if Rails.env.development? || Rails.env.test?
  # Styleguide routes
end
```

Im Production Mode wird der Styleguide automatisch deaktiviert.

## 🔧 Troubleshooting

### Problem: 404 Error beim Aufrufen

**Lösung 1 - Rails Server neu starten:**
```bash
# Server stoppen (Ctrl+C)
# Dann neu starten:
rails server
```

**Lösung 2 - Environment prüfen:**
```bash
# Sicherstellen, dass du im development Mode bist
echo $RAILS_ENV

# Wenn leer oder "development", ist alles OK
# Falls "production", explizit development setzen:
RAILS_ENV=development rails server
```

**Lösung 3 - Routes prüfen:**
```bash
RAILS_ENV=development rails routes | grep styleguide

# Du solltest sehen:
# styleguide_root GET  /styleguide(.:format)         styleguide#index
# styleguide_buttons GET  /styleguide/buttons(.:format) styleguide#buttons
# ...
```

### Problem: Authentication Redirect

Falls der Styleguide auf die Login-Seite umleitet, musst du die Authentication-Methoden im Controller anpassen.

**Aktuell:**
```ruby
# app/controllers/styleguide_controller.rb
skip_before_action :authentication, if: :styleguide_env?
skip_before_action :authorization, if: :styleguide_env?
```

**Falls deine App andere Methoden verwendet**, passe diese an:
```ruby
# Beispiele für andere Auth-Methoden:
skip_before_action :authenticate_user!, if: :styleguide_env?
skip_before_action :require_login, if: :styleguide_env?
skip_before_action :check_authentication, if: :styleguide_env?
```

### Problem: Layout nicht gefunden

Prüfe, ob das Layout existiert:
```bash
ls -la app/views/layouts/styleguide.html.haml
```

Falls nicht vorhanden, wurde es möglicherweise nicht erstellt. Siehe `docs/styleguide-setup-guide.md` für die komplette Anleitung.

## 🎨 Navigation

Der Styleguide hat eine Top-Navigation mit Links zu allen verfügbaren Component-Seiten:

```
┌─────────────────────────────────────────┐
│ [Elektra Bootstrap Styleguide]          │
│ Overview | Buttons | Forms | Modals     │
└─────────────────────────────────────────┘
```

## 📸 Playwright Tests

Nachdem der Styleguide im Browser läuft, kannst du die Playwright Visual Tests ausführen:

```bash
# Rails Server muss laufen!
rails server

# In einem anderen Terminal:
pnpm test:e2e:ui
```

Die Tests unter `e2e/playwright/tests/visual/styleguide/` testen automatisch die Styleguide-Seiten.

## 🚀 Nächste Schritte

1. **Server starten:**
   ```bash
   rails server
   ```

2. **Im Browser öffnen:**
   ```
   http://localhost:3000/styleguide
   ```

3. **Durch Komponenten navigieren** und visuell prüfen

4. **Playwright Tests ausführen:**
   ```bash
   pnpm test:e2e:ui
   ```

---

**Fragen?** Siehe `docs/styleguide-setup-guide.md` für die vollständige Dokumentation.
