---
name: inquiry
description: >-
  Use when working with the inquiry plugin: creating new inquiry kinds, changing
  state machine behaviour, adding email notifications, understanding the
  requester/approver domain split, or tracing how identity and dns_service
  consume the inquiry workflow. Covers AASM states, InquiryService API, Delegates,
  Processor caching, email templates, and all consumer integrations.
---

# Inquiry Plugin

The `inquiry` plugin implements a **lightweight approval workflow** entirely
within Elektra's local PostgreSQL database. It has no direct OpenStack involvement
— it sits between a user request and the OpenStack action that fulfils it.
Consumers (identity, dns_service, etc.) call `InquiryService` to create/transition
inquiries; the inquiry plugin provides the UI for processors to act on them.

```
User requests something
  → consumer plugin creates Inquiry via InquiryService
      → Processors are notified by email
          → Processor approves/rejects in Elektra UI
              → approved callback triggers OS action (e.g. create project)
```

---

## AASM State Machine

`plugins/inquiry/app/models/inquiry/inquiry.rb`

### States

```
new  →  open  →  reviewing  →  approved  (terminal — reopen allowed)
                             →  rejected  (terminal — reopen allowed)
                ↑___________↓  (reopen back to open)
                                          ↓
                                        closed  (terminal — from approved or rejected)
```

| State | Meaning |
|-------|---------|
| `new` | Created, not yet acknowledged by a processor |
| `open` | Acknowledged — processor is aware |
| `reviewing` | Active review in progress |
| `approved` | Approved; OS action can proceed |
| `rejected` | Rejected; no action taken |
| `closed` | Archived; no further transitions |

### Events

| Event | From → To | Guard |
|-------|-----------|-------|
| `open` | `new` → `open` | — |
| `review` | `open` → `reviewing` | — |
| `approve` | `open` or `reviewing` → `approved` | `valid?` |
| `reject` | `open` or `reviewing` → `rejected` | — |
| `reopen` | `approved` or `rejected` → `open` | — |
| `close` | `approved` or `rejected` → `closed` | — |

`approve` is guarded by `valid?` — if an `Inquiry::Inquiry` has errors,
`aasm.approve!` will fail. Validations are minimal (presence of `kind` and
`description`); in practice `valid?` always passes.

### Email notifications per transition

Each event fires `after_transition` callbacks that call `InquiryMailer`:

| Transition | Email sent to |
|-----------|----------------|
| `→ open` | processors |
| `→ reviewing` | processors |
| `→ approved` | requester, processors, additional recipients |
| `→ rejected` | requester, processors |
| `→ closed` | (no email) |
| `→ new project approval` | `MONSOON_NEW_PROJECT_DL` env var (DL email) |

The `notification_new_project` mailer method sends **only** when `kind == "project"`,
triggered from the `approved` transition.

### Callback system (currently disabled)

`Inquiry::Inquiry` has a `callbacks` JSON column. The intent was to `eval()` a Ruby
expression stored in `callbacks["approved"]` when an inquiry is approved —
effectively auto-running an OS action. The code exists as `run_automatically` and
`proceed_state_change` dispatcher but the `eval()` call is **commented out**.

Callbacks are still passed by consumer plugins (as URLs/identifiers for redirect),
but they are treated as data only — nothing auto-executes.

---

## Data Model

### `inquiry_inquiries`

`plugins/inquiry/app/models/inquiry/inquiry.rb`

Key columns:

| Column | Type | Notes |
|--------|------|-------|
| `kind` | string | e.g. `"project"`, `"zone"` — consumer-defined |
| `description` | string | Human-readable summary of the request |
| `aasm_state` | string | Current state (see above) |
| `payload` | JSON | Arbitrary data — what is being requested |
| `callbacks` | JSON | `{ "approved" => url, "rejected" => url }` |
| `tags` | JSON | Array of strings for filtering |
| `domain_id` | string | OpenStack domain of the requester |
| `project_id` | string | OpenStack project of the requester |
| `approver_domain_id` | string | Domain whose processors handle this inquiry |
| `requester` | JSON | Snapshot of the requesting user (uid, name, email) |

`approver_domain_id` is the key to cross-domain approvals: a DNS zone request
originates in the user's domain but needs approval in `cloud_admin` (ccadmin).
`InquiryService` filters processors by `approver_domain_id`, not `domain_id`.

### `inquiry_processors`

`plugins/inquiry/app/models/inquiry/processor.rb`

Cached copy of OpenStack user identities for users who can process inquiries.

**`Processor.from_users(users)`** — finds-or-creates `Processor` rows from an
array of OpenStack user objects (returned by e.g. `identity.list_scope_resource_admins`).
Syncs `email`, `name`, `full_name` on every call.

Columns: `uid` (Keystone UUID), `name`, `email`, `full_name`.

### `inquiry_process_steps`

Audit trail. One row per state transition.

Columns: `inquiry_id` (FK), `from_state`, `to_state`, `event`, `processor_id`
(FK to `inquiry_processors`), `description`.

### `inquiry_inquiries_processors` (join table)

M:N between `inquiry_inquiries` and `inquiry_processors`. Records which processors
are responsible for a given inquiry.

---

## Delegates::Inquiry — the returned wrapper

`plugins/inquiry/app/models/delegates/inquiry.rb`

`InquiryService` **always returns a `Delegates::Inquiry`**, never a raw
`Inquiry::Inquiry`. The delegate is a thin read-only wrapper that exposes only
a safe subset:

| Method delegated | Notes |
|------------------|-------|
| `id` | inquiry UUID |
| `description` | request summary |
| `payload` | JSON data |
| `domain_id` | requester domain |
| `project_id` | requester project |
| `aasm_state` | current state string |
| `requester` | JSON snapshot |
| `errors` | AR errors |
| `errors?` | boolean |
| `valid?` | AR validation |
| `nil?` | boolean |

State-transition methods (`approve!`, `reject!`, etc.) are **not** delegated.
Callers use `InquiryService#set_inquiry_state` for transitions.

---

## InquiryService API

`plugins/inquiry/app/services/service_layer/inquiry_service.rb`

### `create_inquiry`

```ruby
inquiry_service.create_inquiry(
  kind,           # string — "project", "zone", etc.
  description,    # string — human-readable summary
  requester_user, # current_user object (token user)
  payload,        # hash — what is being requested
  processor_users,# array of OS user objects (from identity.list_scope_resource_admins)
  callbacks,      # hash { "approved" => url, "rejected" => url } — not auto-run
  domain_id,      # requester's domain UUID
  tags,           # array of strings
  approver_domain_id  # whose processors handle this — can differ from domain_id
)
```

Returns a `Delegates::Inquiry`. Transitions to `:open` immediately after creation.

**The processor list is fixed at creation time.** `set_inquiry_state` and
`change_inquiry` have no parameter to update processors — the join table rows
written by `create_inquiry` are permanent for the lifetime of the inquiry. If
the set of resource admins changes after creation (e.g. a new admin is added),
they will not receive notifications and will not see the inquiry in their queue
unless it is reopened and a new inquiry is created.

### `set_inquiry_state`

```ruby
inquiry_service.set_inquiry_state(
  :approved,          # AASM event symbol
  inquiry_id,         # UUID
  processor: user,    # current processor user
  description: "..."  # step description for audit trail
)
```

Called by consumer approval controllers after performing the OS action.

### Other methods

| Method | Purpose |
|--------|---------|
| `get_inquiry(id)` | Fetch single inquiry as Delegates::Inquiry |
| `change_inquiry(id, attributes)` | Update arbitrary attributes |
| `find_by_kind_user_states(kind:, user_uid:, states:)` | Filter by kind + requester + state array |

---

## Controllers

### `Inquiry::InquiriesController`

`plugins/inquiry/app/controllers/inquiry/inquiries_controller.rb`

Standard CRUD for processors — the approval UI.

- `index` — filtered list (by state, kind, domain via `Filterable` concern)
- `show` — detail view with state timeline
- `update` — not directly exposed; state changes go through custom actions
- `approve`, `reject`, `open`, `review`, `close` — custom actions that call
  `inquiry_service.set_inquiry_state`
- `to_csv` — CSV export of current filter result

Uses `Filterable` concern to build AR scopes from query params
(`state=open`, `kind=project`, `domain_id=abc`).

### `Inquiry::Admin::InquiriesController`

Subclass of `InquiriesController` with elevated access — mounted under an admin
scope with `cloud_admin` authorization context. Provides the same actions but
allows processors from any domain to manage all inquiries.

---

## Email Templates

`plugins/inquiry/app/mailers/inquiry/inquiry_mailer.rb`

Four mailer methods:

| Method | Recipients | Trigger |
|--------|-----------|---------|
| `notification_email_requester` | `inquiry.requester["email"]` | approved, rejected |
| `notification_email_processors` | all processor emails | open, reviewing, approved, rejected |
| `notification_email_additional_recipients` | `inquiry.payload["additional_recipients"]` | approved |
| `notification_new_project` | `ENV["MONSOON_NEW_PROJECT_DL"]` | approved + kind=="project" |

Views in `plugins/inquiry/app/views/inquiry/inquiry_mailer/`.

---

## Consumer Integrations

### `identity` — new project requests

**Create:** `plugins/identity/app/controllers/identity/projects/request_wizard_controller.rb`

```ruby
inquiry_service.create_inquiry(
  "project",
  "#{current_user.name} has requested a new project ...",
  current_user,
  project.attributes,              # payload = project form data
  service_user.identity.list_scope_resource_admins(domain_id: @scoped_domain_id),
  { "approved" => domain_url(...) }, # redirect URL on approval
  @scoped_domain_id,
  [],
  @scoped_domain_id                # approver domain = same domain
)
```

**Approve:** `plugins/identity/app/controllers/identity/domains/create_wizard_controller.rb`

```ruby
# 1. Create the project in OpenStack
project = service_user.identity.create_project(...)
# 2. Grant admin role to requester
service_user.identity.grant_user_role_in_project(...)
# 3. Approve the inquiry
inquiry_service.set_inquiry_state(:approved, inquiry_id, processor: current_user)
```

### `dns_service` — new DNS zone requests

**Create:** `plugins/dns_service/app/controllers/dns_service/request_zone_wizard_controller.rb`

```ruby
inquiry_service.create_inquiry(
  "zone",
  "#{current_user.name} has requested a new DNS zone ...",
  current_user,
  zone.attributes,
  service_user.identity.list_scope_resource_admins(domain_id: cloud_admin_domain_id),
  { "approved" => dns_service_url(...) },
  @scoped_domain_id,          # requester domain = user's domain
  [],
  cloud_admin_domain_id       # approver domain = ccadmin (cross-domain)
)
```

`cloud_admin_domain_id` is resolved from the `ccadmin` domain — the DNS
zone inquiry travels to a different domain's processors.

**Approve:** `plugins/dns_service/app/controllers/dns_service/create_zone_wizard_controller.rb`

```ruby
# 1. Create the DNS zone via designate
zone = services.dns_service.create_zone(...)
# 2. Approve the inquiry
inquiry_service.set_inquiry_state(:approved, inquiry_id, processor: current_user)
```

---

## Frontend

The inquiry plugin UI is **pure HAML + jQuery** — no React. It predates Elektra's
React migration and remains on the legacy stack.

- `plugins/inquiry/app/javascript/plugin.js` — plugin initialisation
- `plugins/inquiry/app/javascript/inquiries.js` — jQuery interactions
  (state transition buttons, inline confirm dialogs, CSV download)
- Views: `plugins/inquiry/app/views/inquiry/` — HAML templates

No `init.js` / `widget.jsx` structure; follows Pattern 1 (pure HAML).

---

## Routes

`plugins/inquiry/config/routes.rb`

```ruby
resources :inquiries, only: [:index, :show, :new, :create, :edit, :update] do
  member do
    put :approve
    put :reject
    put :open
    put :review
    put :close
  end
  collection do
    get :to_csv
  end
end
```

Mounted twice — once for regular domain scope and once under an `/admin` namespace
for the `Admin::InquiriesController`.

---

## Adding a New Inquiry Kind

1. **Consumer controller — create:** call `inquiry_service.create_inquiry(kind, ...)`.
   - `kind`: a new string identifying your request type
   - `payload`: hash of everything the processor needs to act
   - `processor_users`: who should receive/process this — typically
     `service_user.identity.list_scope_resource_admins(domain_id: approver_domain_id)`
   - `approver_domain_id`: set to `cloud_admin_domain_id` for cross-domain approvals

2. **Consumer controller — approve:** perform the OS action, then call
   `inquiry_service.set_inquiry_state(:approved, id, processor: current_user)`.
   Handle rejection similarly.

3. **Email:** no new mailer code needed — `notification_email_processors` fires
   automatically. Add `"additional_recipients"` to the payload if extra addresses
   need to be notified on approval.

4. **No DB migration required** — `kind` is a free-form string; `payload` is JSON.

---

## Key Files

- `plugins/inquiry/app/models/inquiry/inquiry.rb` — AASM model, state machine, email callbacks
- `plugins/inquiry/app/models/inquiry/processor.rb` — processor identity cache, `from_users`
- `plugins/inquiry/app/models/inquiry/process_step.rb` — audit trail model
- `plugins/inquiry/app/models/delegates/inquiry.rb` — read-only wrapper returned by service
- `plugins/inquiry/app/services/service_layer/inquiry_service.rb` — `create_inquiry`, `set_inquiry_state`, `get_inquiry`
- `plugins/inquiry/app/controllers/inquiry/inquiries_controller.rb` — approval UI controller, `Filterable`
- `plugins/inquiry/app/controllers/inquiry/admin/inquiries_controller.rb` — elevated admin subclass
- `plugins/inquiry/app/mailers/inquiry/inquiry_mailer.rb` — 4 notification mailers
- `plugins/inquiry/config/routes.rb` — `approve/reject/open/review/close` member actions
- `plugins/inquiry/db/migrate/` — inquiry tables (oldest: 2015)
- `plugins/identity/app/controllers/identity/projects/request_wizard_controller.rb` — project request consumer
- `plugins/identity/app/controllers/identity/domains/create_wizard_controller.rb` — project approval consumer
- `plugins/dns_service/app/controllers/dns_service/request_zone_wizard_controller.rb` — DNS zone request consumer
- `plugins/dns_service/app/controllers/dns_service/create_zone_wizard_controller.rb` — DNS zone approval consumer
