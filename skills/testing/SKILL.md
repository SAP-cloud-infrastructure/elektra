---
name: testing
description: >-
  Use when writing or debugging tests: RSpec controller specs, Vitest React/JS
  unit tests, or Playwright E2E tests. Covers setup files, how auth and API calls
  are mocked, the shared examples pattern, factory conventions, the e2e Rails
  environment, CI job structure, and how to run each suite.
---

# Testing

Elektra has three test layers:

| Layer | Framework | Scope |
|-------|-----------|-------|
| Ruby/Rails | RSpec | Controller auth/response, service layer, AR models |
| JavaScript/TypeScript | Vitest | React components, utility libs (ajax_helper, policy engine) |
| End-to-end | Playwright | HTTP health checks, visual landing page snapshots, UI rendering (e2e Rails env) |

Running commands — see `AGENTS.md` for container setup:

```bash
bin/workspace bundle exec rspec           # all Ruby specs
bin/workspace bundle exec rspec spec/path/to/file_spec.rb:42
bin/workspace pnpm test                   # all Vitest tests
bin/workspace pnpm test path/to/file.test.tsx
bin/workspace pnpm test-watch             # watch mode
pnpm e2e:smoke                            # Playwright smoke tests
pnpm e2e:ui -- --host http://localhost:8010  # Playwright UI tests (requires e2e Rails)
```

---

## RSpec

### Setup files

**`spec/spec_helper.rb`** — loads the Rails env, configures RSpec, mounts the
test suite. Key things it does on every example:

- Calls `stub_authentication` (from `monsoon-openstack-auth` gem's `AuthenticationStub`
  support module) — installs a fake Keystone token into the request stack so
  no real OpenStack auth happens.
- Stubs `Core.locate_region` to return the region from the stub token.
- Stubs `services.identity`, `service_user`, `cloud_admin` on every
  `ApplicationController` instance — all three return doubles so no live API
  calls slip through.
- Stubs `DashboardController#load_active_project` and `#check_terms_of_use` —
  these before-actions run on every scoped request; stubbing them avoids DB setup.
- Uses `DatabaseCleaner` with `:truncation` strategy (`before(:suite)`,
  `before(:all)`, `after(:all)`) — wraps the test database rather than
  transactions (since some specs use `before(:all)` for `FriendlyIdEntry` setup).
- Includes `FactoryBot::Syntax::Methods` globally.
- Configures a custom ordering: `monsoon-openstack-auth` plugin specs run first
  to prevent auth-stub pollution (other plugins modify the stub token, and random
  order can cause auth tests to reset stubs mid-run).

**No `spec/rails_helper.rb`** — `spec_helper.rb` doubles as both; it directly
`require 'rspec/rails'` and sets up the DB.

### How auth is mocked

`AuthenticationStub` (from the gem) provides:
- `stub_authentication` — installs a fake token; called globally in `before(:each)`
- A block form that lets you customise the token per context:

```ruby
stub_authentication do |token|
  token["roles"] = []
  token["roles"] << { "id" => "lbaas2_role", "name" => "network_admin" }
  token
end
```

`AuthenticationStub.domain_id` / `.project_id` / `.test_token` — static
accessors to the fixture token's values, used for seeding `FriendlyIdEntry`
and building `default_params`.

### Factories

`spec/factories/` — five factory files using FactoryBot:

| Factory file | Model |
|---|---|
| `user_profiles.rb` | `UserProfile` |
| `domain_profiles.rb` | `DomainProfile` |
| `project_profiles.rb` | `ProjectProfile` |
| `friendly_id_entry.rb` | `FriendlyIdEntry` |
| `object_cache.rb` | `ObjectCache` |

All factories cover only the DB-backed AR models. OpenStack-mapped
`Core::ServiceLayer::Model` instances are built as doubles, not factories.

### Controller specs — the dominant pattern

Most controller specs across plugins follow the same shape:

1. **`require "spec_helper"`** — no `rails_helper`.
2. **`describe SomeController, type: :controller do`** — uses the plugin engine
   routes: `routes { PluginName::Engine.routes }`.
3. **`before(:all)` — seed `FriendlyIdEntry`** — every scoped controller
   needs a domain/project entry or routing fails:

```ruby
before(:all) do
  FriendlyIdEntry.find_or_create_entry("Domain", nil, domain_id, "default")
  FriendlyIdEntry.find_or_create_entry("Project", domain_id, project_id, project_id)
end
```

4. **Mock the service layer** — double the Elektron client chain to prevent
   live OpenStack calls:

```ruby
before :each do
  lbs = double("elektron", service: double("octavia", get: double("get", map_to: [])))
  allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(:elektron).and_return(lbs)
end
```

5. **Verify auth/policy enforcement** — the shared example pattern checks each
   relevant OpenStack role.

### Shared examples — lbaas2 pattern

`plugins/lbaas2/spec/controllers/shared.rb` defines reusable role-permission
shared examples. Each one stubs the token's `roles` array and asserts the
expected HTTP response code. Used by every lbaas2 controller spec:

```ruby
it_behaves_like "index action" do
  subject { @default_params = default_params }
end

it_behaves_like "post action" do
  subject do
    @default_params = default_params
    @extra_params = { loadbalancer: { name: "test" } }
  end
end
```

Shared example names: `"index action"`, `"show action"`, `"post action"`,
`"PUT action"`, `"destroy action"`, `"GET action with editor context"`,
`"GET action with viewer context"`, `"GET action with cloud_network_admin rule"`,
`"GET action with lbaas_admin rule."`.

The convention: **viewer roles** (network_viewer, loadbalancer_viewer) are
denied write actions (403); **admin/member roles** succeed. Empty roles always
get 403.

### Other notable spec locations

| Path | Notes |
|------|-------|
| `plugins/inquiry/spec/` | Inquiry model and controller specs |
| `plugins/dns_service/spec/` | DNS controller specs |
| `plugins/monsoon-openstack-auth/spec/` | Auth stub and policy engine — run first |
| `spec/factories/` | FactoryBot factories for AR models |

Most plugins have only `application_controller_spec.rb` — a minimal smoke test
that verifies routing and auth for the plugin's base controller. `lbaas2` has the
most complete controller coverage.

---

## Vitest

### Configuration

**`vitest.config.ts`** (repo root):

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./setupVitestMock.js", "./vitest.setup.ts"],
    include: ["**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", "vendor"],
    globals: true,   // expect/vi/describe/it available without import
  },
  resolve: {
    alias: {
      ajax_helper: "app/javascript/lib/ajax_helper.js",
      testHelper:  "app/javascript/test/support/testHelper.js",
      lib:         "app/javascript/lib",
      core:        "app/javascript/core",
      plugins:     "plugins",
      config:      "config",
    },
  },
})
```

Path aliases mirror the build-system aliases — `import { policy } from "lib/policy"`
works the same in tests and production code.

### Setup files (run before every test file)

**`setupVitestMock.js`** — mocks `global.fetch` with a successful 200 response
returning `{ name: "test" }`. This ensures no test accidentally fires a real
HTTP request.

**`vitest.setup.ts`** — extends `expect` with `@testing-library/jest-dom` matchers
(`toBeInTheDocument`, `toHaveTextContent`, etc.) and sets up global mocks:

- **jQuery** (`$` / `jQuery`) → `vi.fn()` returning an object with `.popover`,
  `.tooltip`, `.modal`, `.dropdown` stubs. Prevents bootstrap jQuery plugins from
  crashing in jsdom.
- **`ResizeObserver`** → class stub with `observe/unobserve/disconnect` as
  `vi.fn()`. Needed by Juno UI `Select` component.
- **`document.createRange`** and **`Element.getBoundingClientRect`** → mocked
  with zero-rect returns. Needed by CodeMirror editor.
- Also imports `lib/react19-finddomnode-shim.js` to patch `ReactDOM.findDOMNode`
  which React 19 removed but react-bootstrap@0.33 still calls.

### How API calls are mocked in component tests

API calls go through `ajaxHelper`. In component tests mock at the module level:

```ts
// Mock the entire ajax_helper module
vi.mock("ajax_helper", () => ({
  ajaxHelper: {
    get: vi.fn().mockResolvedValue({ data: [...] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))
```

Or use the global `fetch` mock already installed by `setupVitestMock.js` and
override it per-test:

```ts
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({ clusters: [] }),
  headers: new Headers({ "Content-Type": "application/json" }),
})
```

### How policy is mocked

The policy module (`lib/policy`) is a simple object reference. Mock it at module
level:

```ts
const mockIsAllowed = vi.fn().mockReturnValue(true)
vi.mock("lib/policy", () => ({ policy: { isAllowed: mockIsAllowed } }))
```

Per-test overrides:
```ts
mockIsAllowed.mockReturnValue(false)   // deny
mockIsAllowed.mockReturnValue(true)    // allow
```

### Test file locations

| Path | What it tests |
|------|---------------|
| `app/javascript/lib/ajax_helper.test.js` | Full suite for `ajaxHelper` (URL building, CSRF token, fetch delegation, error handling, all HTTP methods) |
| `app/javascript/lib/elektra-form/components/*.test.tsx` | 6 form component tests (Input, Select, Textarea, etc.) |
| `plugins/kubernetes_ng/app/javascript/widgets/app/components/*.test.tsx` | 7+ cluster/nodepool component tests (TanStack Query + React Testing Library) |
| `plugins/monsoon-openstack-auth/app/assets/javascripts/.../policy_engine.test.js` | Policy engine JS evaluation — rule parsing, `isAllowed` logic, eval correctness |

### Running JavaScript tests

```bash
bin/workspace pnpm test                     # all files
bin/workspace pnpm test-watch               # watch mode
bin/workspace pnpm test-verbose             # verbose output
bin/workspace pnpm test path/to/file.test.tsx  # single file
```

---

## Playwright E2E

### How it works

Playwright tests run in the official Docker image
`mcr.microsoft.com/playwright:v1.59.1-noble` — no local browser installation
required. The `e2e/run.sh` script pulls/uses the image and mounts the repo.

```bash
./e2e/run.sh [--host URL] [--profile smoke|ui] [--browser chromium|firefox|webkit|all]
```

Default host: `http://localhost:3000`. Mac: use `http://host.docker.internal:PORT`.

### Test profiles

**`smoke`** — no auth, no backend required. Tests that Elektra is running:

- `health.spec.ts` — liveliness/readiness/startprobe endpoints, root returns 200
- `landing-visual.spec.ts` — login page visual snapshot (screenshot comparison)
- `landing-functional.spec.ts` — functional checks on the landing page
- `auth.spec.ts` — authentication-related smoke checks
- `plugins.spec.ts` — plugin presence/loading checks

**`ui`** — requires Rails running in `e2e` environment:

```bash
# Terminal 1
RAILS_ENV=e2e bundle exec rails server -p 8010

# Terminal 2
pnpm e2e:ui -- --host http://localhost:8010
```

Located in `e2e/playwright/ui/`.

### The `e2e` Rails environment

`RAILS_ENV=e2e` disables authentication and wires in mock OpenStack services
that return static fake data. This lets the UI tests render realistic pages
without a real OpenStack backend. UI tests exercise the full frontend rendering
path (React widgets loading, routes resolving, data displaying) with controlled
data.

### E2E commands from package.json

```bash
pnpm e2e:smoke                  # chromium, localhost:3000
pnpm e2e:smoke:firefox          # firefox
pnpm e2e:smoke:all              # all browsers
pnpm e2e:ui -- --host URL       # UI tests on custom host
pnpm e2e:ui:firefox -- --host URL
pnpm e2e:ui:all -- --host URL
```

### Playwright config

No `playwright.config.ts` at root — configuration is embedded in `run.sh`
and passed as CLI flags to the Playwright Docker container. The `e2e/playwright/`
directory contains `smoke/`, `ui/`, and `helpers/` subdirectories.

---

## CI — checks.yaml

`.github/workflows/checks.yaml` — triggered on `pull_request` events.

### Jobs

| Job | Depends on | What it does |
|-----|-----------|--------------|
| `check-permissions` | — | Fails forks without the `save-to-merge` label |
| `test-rails` | `check-permissions` | Spins up PostgreSQL service, installs gems, runs `bundle exec rspec` |
| `test-javascript` | `check-permissions` | Installs pnpm@8.15.0, installs deps, runs `pnpm test` |
| `typecheck` | `check-permissions` | Runs `pnpm typecheck` (TypeScript strict check) |
| `lint` | `check-permissions` | Runs `pnpm lint` (ESLint) |

All three JS jobs require pnpm pinned to **8.15.0** — lockfileVersion 6.0 breaks on newer
pnpm. The pin is in both `package.json` (`"packageManager": "pnpm@8.15.0"`) and
`checks.yaml`.

**Fork PRs:** `test-javascript`, `typecheck`, and `lint` skip unless the label
`save-to-merge` is present (they need repo secrets for private `@sapcc/*` packages).
Only `test-rails` runs for forks (it has no secret dependency).

**E2E tests are not in CI** — Playwright smoke/UI tests are run manually or as
a pre-release check. There is no CI job for E2E.

### Local CI simulation

The workflow can be run locally with `act`:

```bash
act -j test --env-file dummy.env --rm
```

`dummy.env` must exist and be empty (prevents `act` from loading `.env` and
picking up any proxy settings that would break the run).

---

## Key files

- `spec/spec_helper.rb` — RSpec config, auth stubbing, DatabaseCleaner setup
- `spec/factories/` — FactoryBot factories for AR models
- `plugins/lbaas2/spec/controllers/shared.rb` — role-permission shared examples
- `vitest.config.ts` — Vitest config: jsdom, setup files, path aliases
- `setupVitestMock.js` — global `fetch` mock (no real HTTP in tests)
- `vitest.setup.ts` — jest-dom matchers, jQuery/ResizeObserver/DOM mocks
- `app/javascript/lib/ajax_helper.test.js` — most thorough JS unit test
- `plugins/monsoon-openstack-auth/app/assets/javascripts/.../policy_engine.test.js` — policy rule evaluation
- `e2e/run.sh` — Playwright runner script (Docker-based)
- `e2e/playwright/smoke/` — smoke test specs (health, landing, auth, plugins)
- `e2e/playwright/ui/` — UI rendering tests (requires `RAILS_ENV=e2e`)
- `.github/workflows/checks.yaml` — CI: Rails tests + JS tests + typecheck + lint
