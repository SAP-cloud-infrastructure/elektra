# Styleguide Security Setup

## Implementierte Lösung

**Kombination aus verstecktem Pfad + Basic Auth in Production**

### 1. Versteckter Pfad: `/__styleguide`

Statt `/styleguide` → `/__styleguide`

**Zugriff:**
```
http://localhost:3000/__styleguide
http://localhost:3000/__styleguide/buttons
http://localhost:3000/__styleguide/modals
```

Der `__` Prefix signalisiert "internal/system route".

### 2. HTTP Basic Auth in Production

**Development/Test:** Kein Password nötig
**Production:** Benötigt Username + Password

## Environment Variables für Production

In Production musst du diese ENV Vars setzen:

```bash
# .env oder Kubernetes secrets
STYLEGUIDE_USER=admin
STYLEGUIDE_PASSWORD=your-secure-password-here
```

**Standard-Credentials (falls nicht gesetzt):**
- Username: `styleguide`
- Password: `change-me-in-production`

⚠️ **WICHTIG:** Ändere das Password in Production!

## Playwright Tests mit Auth

Für Playwright Tests in Production/Staging:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    httpCredentials: {
      username: process.env.STYLEGUIDE_USER || 'styleguide',
      password: process.env.STYLEGUIDE_PASSWORD || 'change-me-in-production',
    },
  },
})
```

Oder in einzelnen Tests:

```typescript
test.beforeEach(async ({ page }) => {
  // Set HTTP Basic Auth
  await page.setExtraHTTPHeaders({
    'Authorization': 'Basic ' + Buffer.from('styleguide:your-password').toString('base64')
  })
  
  await page.goto('/__styleguide/modals')
})
```

## Security Level

**Development:**
- ✅ Verfügbar ohne Auth
- ✅ Versteckter Pfad (nicht leicht zu finden)
- ✅ Keine production-Daten

**Production:**
- ✅ HTTP Basic Auth erforderlich
- ✅ Versteckter Pfad
- ✅ Nicht in Sitemap/Robots.txt
- ⚠️ Schwache Stelle: Default-Passwort

## Alternativen

### Option A: Nur in Dev/Test verfügbar

```ruby
# config/routes.rb
if Rails.env.development? || Rails.env.test?
  scope '/__styleguide' do
    # routes...
  end
end
```

**Pro:** Maximal sicher
**Contra:** Kann nicht in Production/Staging testen

### Option B: IP Whitelist zusätzlich

```ruby
# app/controllers/styleguide_controller.rb
before_action :check_ip, if: -> { Rails.env.production? }

private

def check_ip
  allowed_ips = ENV['STYLEGUIDE_IPS'].to_s.split(',')
  return if allowed_ips.include?(request.remote_ip)
  
  head :forbidden
end
```

Dann in Production:
```bash
STYLEGUIDE_IPS=1.2.3.4,5.6.7.8
```

### Option C: Token-basiert

```ruby
before_action :check_token, if: -> { Rails.env.production? }

private

def check_token
  token = params[:token] || request.headers['X-Styleguide-Token']
  expected = ENV['STYLEGUIDE_TOKEN']
  
  return if token.present? && token == expected
  
  head :forbidden
end
```

Zugriff dann via:
```
http://production.com/__styleguide?token=secret-token
```

## Empfehlung nach Environment

**Local Dev:**
- ✅ Wie jetzt: `/__styleguide` ohne Auth

**CI/Testing:**
- ✅ Wie jetzt: Auth-free oder mit bekanntem Password

**Staging:**
- ✅ HTTP Basic Auth mit festem Password

**Production:**
- ✅ HTTP Basic Auth mit starkem Password
- ✅ Optional: IP Whitelist zusätzlich
- ⚠️ Oder: Komplett deaktivieren

## Aktueller Zugriff

**Development:**
```bash
# Kein Password nötig
open http://localhost:3000/__styleguide
```

**Production (simulieren):**
```bash
# Mit Auth
curl -u styleguide:your-password http://production.com/__styleguide

# Im Browser: Browser fragt nach Username/Password
open http://production.com/__styleguide
```

## Was ist sicherer?

**Am sichersten:**
1. IP Whitelist + Basic Auth
2. Nur in Dev/Test verfügbar
3. Token-basiert mit rotierenden Tokens

**Praktisch ausreichend:**
- Versteckter Pfad + Basic Auth (aktuelle Lösung)

**Nicht ausreichend:**
- Nur versteckter Pfad ohne Auth
- Security by obscurity allein

## robots.txt

Optional kannst du den Styleguide aus der Sitemap ausschließen:

```
# public/robots.txt
User-agent: *
Disallow: /__styleguide
```

---

**Aktuelle Lösung:** Versteckter Pfad `/__styleguide` + Basic Auth in Production
**URLs aktualisieren:** Alle Docs und Tests auf `/__styleguide` anpassen
