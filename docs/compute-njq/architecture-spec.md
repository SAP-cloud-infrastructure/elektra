# Architektur-Spec: `compute_njq` — autarkes React/BFF-Plugin neben `compute`

## Context

Das bestehende `compute`-Plugin ist eine klassische Rails-App: HAML Server-Side-Rendering
+ jQuery fürs Frontend, serverseitige `.js.erb`-DOM-Patches, Service-Layer der Rails-Model-
Objekte liefert. Das ist in die Jahre gekommen: 50 HAML-Templates, 16 `.js.erb`-Dateien,
dekaffeiniertes CoffeeScript (`fixed_ip.js`), inline `:javascript`-Blöcke mit rohen
`fetch()`-Calls. Ziel: jQuery loswerden (Security + UX), moderne React-UX, saubere Trennung.

**Entscheidung des Teams (bewusst, nicht Migration):** Ein **komplett neues, autarkes
Plugin `compute_njq`** wird **parallel** aufgebaut. Das alte `compute` bleibt unangetastet und
wird **nicht** abgeschaltet. Das neue Plugin hat **keine** Querverbindungen zu anderen
Service-Layern/Plugins (`services.networking`, `services.image`, `services.block_storage`,
`services.identity`). Alles — auch Netzwerke, Floating IPs, Images, Volumes — wird **im
eigenen Scope** gegen die OpenStack-APIs implementiert. Querverbindungen entstehen nur noch
**auf API-Ebene** (der Browser ruft mehrere BFF-Endpunkte *dieses* Plugins). Bewusst in Kauf
genommener Preis: **Redundanz** gegenüber bestehenden Service-Layern. Gewinn: Wenn an einem
anderen Plugin/Service etwas geändert wird, bricht `compute_njq` nicht.

**Scope-Beschränkung:** `compute_njq` darf **nur im Dev auftauchen** — kein Prod-Deployment,
solange entwickelt wird.

**Bewertung (warum dieser Weg gut ist):** Der Stack existiert bereits als Referenz in
`smartops` (einfache, saubere Struktur) und `kubernetes_ng` (robustere Patterns): `AjaxController`-
BFF + React Pattern 4 (TanStack Router + Juno `AppShellProvider`) + Service-Layer, der direkt
OpenStack ruft und plain Hashes liefert. Das Autarkie-Prinzip ist genau das, was ein echtes
Backend-for-Frontend ausmacht. Risiko ist niedrig, weil parallel (Fallback = altes Plugin bleibt).

**Referenz-Strategie (Best Practice, keine halben Sachen):** `smartops` dient als **Struktur-
Skelett** (minimal, gut lesbar), aber seine Patterns werden **nicht 1:1 kopiert** — mehrere sind
Rough Edges. Wo `smartops` schwächer ist, werden die **robusteren `kubernetes_ng`-Patterns**
übernommen. Siehe Abschnitt „Best-Practice-Filter".

**UI-Framework:** **Juno UI 4.0.1 zuerst.** Wo Juno eine Komponente/Funktion nicht hergibt,
ist der **Fallback erlaubt** — in dieser Reihenfolge: (1) Tailwind `tw-`-Utilities (für
Layout/Spacing, so macht es `kubernetes_ng` mit ~95 `tw-`-Klassen), (2) **Bootstrap 5.3.8** /
react-bootstrap 2.10.10 für fehlende Komponenten. `smartops` bleibt bewusst Juno-only (0 `tw-`),
`kubernetes_ng` mischt Juno + Tailwind — beide Enden sind im Repo erprobt.

> **Update (2026-11-10, Team-Entscheidung — kehrt die UI-Strategie um):** Statt „Juno zuerst"
> jetzt **Bootstrap 5 zuerst**, damit `compute_njq` **optisch wie die alte `compute`-Seite**
> aussieht. Juno wird **vollständig aus dem Plugin entfernt** (keine `@cloudoperators/juno`-Imports).
> Die alte UI ist reines BS5 (`.table.instances`, `.toolbar`, `.input-group`, `.form-control`,
> `.btn`, `.status-pill`), und BS5 ist global geladen — das Widget rendert ohne Shadow-DOM in die
> Host-Seite und erbt die BS5-Styles direkt. Status-Pills nutzen die **geteilte Core-Komponente**
> `app/javascript/lib/components/StatusPill.tsx` (gleiche `.status-pill`-Optik wie die HAML-Welt);
> das ist Core-Infra (`lib/*`, wie `lib/ajax_helper`), **kein Fremd-Plugin** → Autarkie bleibt
> gewahrt. TanStack Router/Query, Zod und die BFF-JSON-Shape bleiben unverändert (reine UI-Änderung).

---

## Verifizierte Fakten (als Grundlage)

- **Kein `RAILS_ENV=e2e`.** Rails-Envs sind nur `development`, `production`, `test`. E2E ist
  Playwright gegen einen normal laufenden Server.
- **Plugins werden env-agnostisch per Gemfile-Glob geladen** (`Gemfile:76-84`, Glob über
  `plugins/*`). Das Prod-Docker-Image (`docker/Dockerfile`) kopiert **alle** `plugins/*` und
  esbuild globbt alle Widget-Entrypoints. Ein `Rails.env`-Guard in der Engine verhindert nur
  das *Mounten*, nicht Gem-Load/JS-Build → Plugin wäre trotzdem im Prod-Image.
- **Einziger echter Prod-Ausschluss-Hebel:** `BLACK_LIST_PLUGINS` (`Gemfile:76-84`), gelesen
  zur `bundle install`-Zeit. Aktuell nirgends gesetzt. Muss als Build-Arg/ENV in den Prod-
  `bundle install`-Schritt in `docker/Dockerfile` injiziert werden.
- **Engine-Auto-Mount:** `config/routes.rb:82-93` mountet jedes `mountable_plugin` automatisch
  unter `/:domain/:project/<mount_point>`. `mount_point` kommt aus Gemspec
  `spec.metadata["mount_path"]`. Kein expliziter `mount`-Eintrag nötig.
- **esbuild Auto-Discovery:** `config/esbuild/build.js` scannt `plugins/*/esbuild.plugin.js`
  und merged die exportierten Plugins. Entrypoint `widgets/app/init.js` → Asset
  `compute_njq_app_widget`. Keine Root-Build-Config-Änderung nötig.
- **Keine neuen npm-Deps nötig:** React 19, `@tanstack/react-query@^4.28.0`,
  `@tanstack/react-router@1.131.25`, `zod@^4.1.12`, Juno `4.0.1` sind in Root-`package.json`.
- **Bootstrap 5.3.8 IST vorhanden und aktiv** (`package.json`, `application.scss.erb` importiert
  `bootstrap/scss/bootstrap`, BS5-JS als Singleton via `essentials.js` auf `window.bootstrap`).
  **Die Doku ist falsch:** CLAUDE.md und `skills/css-styling/SKILL.md` behaupten BS 3.4.1 — das
  stimmt nicht mehr. react-bootstrap 2.10.10 (BS5-kompatibel) ist ebenfalls installiert.
- **`smartops`/`kubernetes_ng` haben KEIN `db/` und KEINE Engine-Initializer** → für BFF ohne DB
  nicht replizieren.
- **Shared-Infra-Fakten:** `createAjaxHelper` (`app/javascript/lib/ajax_helper.js`) bietet
  `get/post/put/patch/delete`, `baseURL`, CSRF-Injection, `.cancelable.*` (AbortController) und
  wirft bei `!response.ok` einen Error mit `.status/.data/.response`. **Bekannter latenter Bug**:
  `osApi`-Header-Prefixing (`ajax_helper.js:392`, `heders`-Tippfehler) — `osApi` daher meiden,
  wir sprechen eh unser eigenes BFF an, nicht den OS-API-Proxy.

---

## Zielarchitektur

### Autarkie-Prinzip (Kernregel)
Kein `services.<fremd>`-Aufruf. `compute_njq_service` baut eigene Elektron-Handles pro
OpenStack-Backend (Nova, Neutron, Glance, Cinder) und ruft diese direkt. Redundanz bewusst,
aber **schmal** (nur die Felder, die die neue UI zeigt) und **modular** (ein Mixin pro Backend).

### Datenfluss
`DashboardController#show` rendert eine HAML-Seite mit einem React-Mount-Point. React (Pattern 4)
ruft die BFF-JSON-Endpunkte unter `/:scope/api/...`. **Aggregation im BFF**: `GET /api/instances`
führt Nova + Neutron + Glance serverseitig in einem `InstanceAssembler` zusammen und liefert
UI-fertiges JSON (Pattern C, plain Hashes). React aggregiert nicht über mehrere Queries.

### Logik-Platzierung (löst die „wo landet die Helper-Logik?"-Frage)
- **Datenbeschaffung + -formung** (heute `grouped_images`, `grouped_flavors`, IP-Aggregation
  in `instances_helper.rb`) → **neu & schmal** in `compute_njq_services/*` + `instance_assembler.rb`
  (Ruby). Nicht aus dem alten Helper aufrufen — neu implementieren.
- **Darstellung** (IP-Pills, Status-Pills, Labels, „+N more"-Toggle) → React/TS-Komponenten.
- **Semantisches Status-Mapping** (vm_state/task_state → Status) → im BFF (liefert semantischen
  Zustand); Farbe/Icon/Pill → React (nutzt bestehende Juno-Status-Pills, vgl. Commit `b853617`).
- **Anti-Pattern (verboten):** HTML-Strings als JSON durchreichen (`{ ip_html: "<p>..." }`).
  BFF liefert Daten, React entscheidet über Markup.

---

## Best-Practice-Filter (COPY vs. NICHT reproduzieren)

`smartops` = Struktur-Vorbild (schlank), aber mehrere Patterns sind Rough Edges. Verbindlich:

**COPY (von `kubernetes_ng`, das robustere Vorbild):**
- **Typisierte, vollständige Error-Hülle** `handle_api_call` → einheitlich `{ error, code, message }`
  mit passendem HTTP-Status + Upstream-Status-Passthrough. Fehlerleiter nach Typ:
  `Elektron::Errors::ApiResponse` → `e.code`, `Elektron::Errors::Request` → 500,
  `Net::HTTPError` → 500, eigene Domain-Errors → 400. (kng `base_controller.rb:28-60`.)
- **Elektron-Handle mit Robustheit** wo nötig: internal→public-Interface-Fallback via
  `rescue Elektron::Errors::ServiceEndpointUnavailable` + Memoisierung (kng `elektron_gardener`).
- **Zod `safeParse` pro Endpoint zur RUNTIME** (nicht nur `z.infer`-Typen) + Error-Normalisierung.
- **TanStack Query** für allen Server-State (`useQuery`/`useMutation`, `isLoading`/Error,
  `invalidateQueries`), nicht Daten nur über Route-Loader ziehen.
- **Tiefe Testabdeckung**: RSpec pro Service-Modul + Assembler + Controller-Fehlerfälle; Vitest
  pro Komponente + apiClient-Parsing.

**NICHT reproduzieren (Rough Edges aus `smartops` / Shared Infra):**
- ❌ `smartops`-Error-Hülle `{ success, error }` mit **Blanket-`:bad_request`** für alle Nicht-
  Elektron-Fehler und Annahme, dass `error.response` existiert. → Stattdessen kng-Hülle.
- ❌ Misnamed ivar (`@elektron_identity` im smartops-Service) → saubere, sprechende Namen.
- ❌ Hartcodiertes `return true` nach POST ohne Response-Auswertung.
- ❌ Zod-Schemas nur als Typen (smartops validiert Responses NICHT zur Runtime) → wir validieren.
- ❌ Dead `available?`, das nie aufgerufen wird → entweder am Request-Boundary nutzen oder weglassen.
- ❌ Logging von Objekt-/Job-IDs (`Rails.logger.info` mit IDs) — AGENTS.md: kein sensibles Logging.
- ❌ Zurückgelassene Debug-Kommentare / auskommentierter Code.
- ❌ `osApi` des ajax_helper (latenter `heders`-Bug) — wir rufen nur unser eigenes BFF.

**Juno-first + Fallback (dokumentieren, wo abgewichen wird):** Juno 4.0.1 zuerst (Referenz-
Komponenten aus smartops: `AppShellProvider`, `AppShell embedded`, `DataGrid*`, `Panel`,
`PanelBody`, `Message`, `Badge`, `Stack`, `Button`, `Spinner`, `IntroBox`). Fehlt etwas:
Tailwind `tw-` (Layout) → BS5/react-bootstrap (Komponenten). Jede Abweichung von Juno im Code
kurz begründen.

---

## File-Struktur (verifiziert gegen reale `kubernetes_ng`-Dateien)

```
plugins/compute_njq/
├── compute_njq.gemspec                     # spec.metadata = { "mount_path" => "compute-njq" }
├── tsconfig.json                          # 4 Zeilen: extends ../../tsconfig.json, include widgets
├── esbuild.plugin.js                      # createTanstackRouterPlugin mit compute_njq-Pfaden
├── lib/
│   ├── compute_njq.rb                      # require version + engine
│   └── compute_njq/
│       ├── engine.rb                      # isolate_namespace ComputeNjq (minimal, KEINE Initializer)
│       └── version.rb
├── config/
│   ├── routes.rb                          # show + api-scope + *path catch-all
│   └── policy.json                        # RBAC
├── app/
│   ├── controllers/compute_njq/
│   │   ├── application_controller.rb      # < DashboardController, nur #show (rendert React-Mount)
│   │   └── api/
│   │       ├── base_controller.rb         # < AjaxController, handle_api_call (kng-Hülle) + scoped-service-accessor
│   │       ├── instances_controller.rb    # thin: handle_api_call { ... } (aggregiert via Assembler)
│   │       ├── networks_controller.rb     # autark – eigene Neutron-Calls
│   │       ├── floating_ips_controller.rb # autark – eigene Neutron-Calls
│   │       ├── images_controller.rb       # autark – eigene Glance-Calls
│   │       └── flavors_controller.rb      # autark – eigene Nova-Calls
│   ├── services/service_layer/
│   │   ├── compute_njq_service.rb          # < Core::ServiceLayer::Service; scoped(...), includes Mixins
│   │   └── compute_njq_services/
│   │       ├── nova.rb                     # eigener elektron-Handle (Nova microversion), Server/Flavor/Keypair
│   │       ├── neutron.rb                  # eigener Handle: Netze/Ports/FIPs
│   │       ├── glance.rb                   # Images
│   │       ├── cinder.rb                   # Volumes/Volume-Types
│   │       └── instance_assembler.rb       # Aggregation Nova+Neutron+Glance → UI-JSON
│   ├── views/compute_njq/application/
│   │   └── show.html.haml                  # javascript_include_tag "compute_njq_app_widget", data: {basepath,region,projectid}
│   └── javascript/
│       ├── plugin.js                       # Kommentar-Stub
│       └── widgets/app/
│           ├── init.js                     # createWidget({pluginName:"compute_njq",widgetName:"app"}).render(App)
│           ├── App.tsx                     # AppShellProvider → MessagesProvider → QueryClientProvider → RouterProvider(basepath)
│           ├── router.ts                   # createAppRouter(basepath, region, projectid)
│           ├── routeTree.gen.ts            # GENERIERT (esbuild) — nicht manuell editieren
│           ├── apiClient.ts                # createAjaxHelper({baseURL}), Zod safeParse PRO Endpoint (Runtime), checkForApiError-Guard
│           ├── styles.scss                 # ?inline (Juno + ggf. tw-)
│           ├── hooks/                       # useInstanceQueries.ts (TanStack Query), queryKeys.ts
│           ├── types/                       # Zod-Schemas (instance, network, flavor, image) — Runtime-validiert
│           └── routes/
│               ├── __root.tsx              # RouterContext { apiClient, region, projectid }, AppShell + Outlet
│               ├── index.tsx               # redirect → /instances
│               └── instances/
│                   ├── route.tsx           # Loader + Outlet
│                   ├── index.tsx           # Liste (ERSTER DURCHSTICH)
│                   ├── $instanceName.tsx   # Detail (später)
│                   └── -components/         # InstanceTable, StatusPill, IpList (— Präfix = aus Route-Gen ausgeschlossen)
└── spec/                                   # RSpec: Services (Nova/Neutron gemockt) + Assembler + Controller
```

---

## Dev-only erzwingen (beides kombinieren)

1. **Harte Grenze — `BLACK_LIST_PLUGINS`:** Im Prod-Build (`docker/Dockerfile`) vor dem
   `bundle install`-Schritt `ENV BLACK_LIST_PLUGINS=compute_njq` (bzw. Build-Arg) setzen, sodass
   das Gem gar nicht geladen wird → keine Route, kein JS im Image. (Gemfile liest es bereits aus,
   es muss nur im Prod-Build gesetzt werden.)
2. **Defense-in-depth — Mount-Guard:** In `config/routes.rb` den Auto-Mount für `compute_njq`
   zusätzlich an `Rails.env.development?` koppeln (analog zum bestehenden `next if %w[docs ...]`-
   Filter bzw. dem `unless Rails.env.test?`-Muster in `config/application.rb`), falls der
   Blacklist-Eintrag mal vergessen wird.

> Hinweis: `domain-config` `disabled_plugins` wäre nur ein Runtime-*Hide* (Plugin bleibt geladen
> & gemountet) — als alleinige Lösung ungeeignet, höchstens ergänzend.

---

## Erster Durchstich (vertikale Scheibe)

**Instanz-Liste mit Netzwerk/FIP** — zeigt das Autarkie-Prinzip + BFF-Aggregation exemplarisch:
1. `GET /:scope/api/instances` → `instances_controller#index` → `handle_api_call { compute_njq_service.scoped(...).list_instances }`.
2. `list_instances` im `InstanceAssembler`: ruft `nova.rb` (Server) + `neutron.rb` (Ports/FIPs) +
   `glance.rb` (Image-Namen), führt zu UI-JSON zusammen. **Kein** `services.networking` o.ä.
3. React: `useInstancesQuery` (TanStack Query) → `InstanceTable` mit Suche/Pagination, `StatusPill`,
   `IpList` (+N-more-Toggle als Komponente).
4. Läuft **parallel** zur alten `compute`-Seite, erreichbar unter `/:domain/:project/compute-njq`.

---

## Verifikation (end-to-end)

- **Dev-Container:** `bin/workspace start-rails` (Port 4001) + `bin/workspace start-js` (esbuild watch).
- **Plugin mountet:** `/:domain/:project/compute-njq` lädt die HAML-Seite; `compute_njq_app_widget`-
  Asset wird gebaut (esbuild-Log „Found plugin configs in: [... compute_njq]").
- **BFF liefert JSON:** `GET /:domain/:project/compute-njq/api/instances` → 200 mit aggregiertem JSON;
  Fehlerfall → `{ error, code, message }` (handle_api_call).
- **React:** Instanz-Liste rendert mit Daten, Suche/Pagination funktionieren, keine jQuery-Abhängigkeit.
- **Autarkie-Check:** `grep -rn "services\.\(networking\|image\|block_storage\|identity\)" plugins/compute_njq`
  → **keine Treffer** (Akzeptanzkriterium).
- **Tests:**
  - RSpec: `bin/workspace bundle exec rspec plugins/compute_njq/spec` — Service-Mixins (Elektron
    gemockt), `InstanceAssembler` (Aggregation), API-Controller (JSON + Fehlerhülle).
  - Vitest: `bin/workspace pnpm test plugins/compute_njq/...` — Komponenten (InstanceTable,
    StatusPill, IpList), apiClient-Zod-Parsing, Query-Hooks.
  - `bin/workspace pnpm typecheck` + `pnpm lint`.
- **Prod-Ausschluss:** Nach Setzen von `BLACK_LIST_PLUGINS=compute_njq` im Prod-Build darf das
  Plugin nicht gemountet sein und kein `compute_njq_app_widget`-Asset erzeugt werden.

---

## Explizite Nicht-Ziele / Risiken

- **Kein Umbau/Abschalten von `compute`.** Parallelbetrieb.
- **API-Umfang hart an „was die neue UI zeigt" grenzen**, nicht an „was das alte Plugin kann"
  (sonst Duplizierung von ~45 Actions ohne Not).
- **Verlagerte Kopplung:** Redundanz bedeutet, OpenStack-API-Änderungen (Nova-Microversion,
  Neutron-Payloads) müssen in `compute` *und* `compute_njq` gepflegt werden. Bewusster Trade-off.
- **Naming:** `compute_njq` (konsistent mit `kubernetes_ng`-Konvention) — bestätigt.
- **Doku-Korrektur fällig:** `skills/css-styling/SKILL.md` + CLAUDE.md behaupten BS 3.4.1, real ist
  **BS 5.3.8**. Nicht Teil dieses Plugins, aber als Folge-Hygiene notieren (nicht blind der Doku folgen).
- **Kein `smartops`-1:1-Klon:** Struktur ja, Patterns nur gefiltert (siehe Best-Practice-Filter).
