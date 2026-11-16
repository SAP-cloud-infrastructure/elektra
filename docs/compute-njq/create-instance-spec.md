# Design Spec: Create-Instance dialog in `compute_njq`

> Extends the [`architecture-spec.md`](architecture-spec.md). The same core
> principles apply (autonomy, BFF emits plain JSON, no jQuery, Bootstrap-5 look,
> TanStack Router/Query + Zod). This document covers **only** the new
> "create an instance" flow.

## Context

The legacy `compute` create dialog is the most complex piece of the old plugin:
a ~380-line HAML form (`instances/new.html.haml`) driven by two inline
`:javascript` blocks plus the jQuery plugin `fixed_ip.js`, backed by ~400 lines
of helpers (`grouped_*`), a ~150-line `create` controller action, and the
`Compute::Server` model with `attributes_for_create`.

Two structural weaknesses of the old system that the rewrite deliberately removes:

1. **Fragile label string-matching.** The entire flavor→image conditional logic
   in jQuery decides based on the **visible dropdown labels** (`/ironic/`,
   `/kvm/`, `/vmware/`, `Disk: 0`, `Bootable:`). Change a label and the logic
   breaks. The rewrite replaces this with **structured fields** from the BFF
   (`hypervisor_type`, `disk`, …) that React filters on declaratively.

2. **Transformation scattered across controller + model.** Today the controller
   builds `block_device_mapping_v2`, translates security-group IDs → names, and
   pre-creates Neutron ports; the model additionally does the Nova camelCase
   mapping and Base64 encoding. The rewrite consolidates this into a single
   **`ServerCreateAssembler`** in the BFF — the write-side counterpart to the
   read-side `InstanceAssembler`.

## Goal & Scope

**End goal: full feature parity** with the legacy dialog — but **iteratively**.
This spec covers **v1 = happy path**; special cases follow as their own
iterations (see "Follow-up iterations").

**UX guardrail (from v1 on):** the dialog opens **immediately**; long lists load
**lazily** (only when their field is opened), are **searchable**, and the user
keeps an overview. No full-page reload on errors.

### v1 — happy path (this spec)

Fields: `name`, `flavor`, `image`, `keypair`, `network`, `security_groups`,
`availability_zone`, `user_data`. Exactly **one** instance per create
(`max_count = 1`, set server-side in a single place).

### Follow-up iterations (deliberately NOT in v1, in priority order)

1. **Custom root disk + volume type** — `block_device_mapping_v2` (image source),
   Nova microversion 2.67 (already set in the service). Most common special case.
2. **Boot from volume** — a Cinder volume as boot source (BDM `source_type:
   "volume"`), including the `imageRef` drop.
3. **Advanced networking** — subnet selection, fixed IP with autocomplete,
   Neutron port pre-creation (replaces `fixed_ip.js`).
4. **Multiple instances** — `min_count`/`max_count` as a UI field, including
   handling of partially successful creation.
5. **Metadata automation** — `image_name`/`image_buildnumber` like legacy.

To keep item 4 a small, local change: `max_count = 1` is set in v1 in **exactly
one place** in the `ServerCreateAssembler`, not scattered across the code.

## Architecture principles (applied to the create flow)

1. **Structured fields instead of label matching.** The BFF emits flavors/images
   with explicit fields; the React UI filters declaratively. No regex over labels.
2. **One transformation site.** `ServerCreateAssembler` takes the validated UI
   payload and builds the Nova `POST /servers` payload. No logic scattered across
   the controller.
3. **Autonomy stays.** Keypairs, AZs, security groups, networks come through the
   existing own Elektron handles (`elektron_nova`, `elektron_neutron`) — **no**
   `services.networking`/`image`/`block_storage`. New mixin methods extend the
   existing `Nova`/`Neutron`/`Glance` modules.
4. **UX first.** One lazy TanStack query per field; small lists searched
   client-side, images searched server-side (`?q=` + pagination).

## BFF endpoints & data contracts

New routes under `namespace :api` in `config/routes.rb`:

| Endpoint | Purpose | Search/paging | Loads when |
|---|---|---|---|
| `GET /api/flavors` | Flavor list (structured) | client-side | on field open |
| `GET /api/images?q=&marker=&limit=` | Image list | **server-side** (Glance `name` filter + marker pagination) | on open + on input (debounced) |
| `GET /api/keypairs` | Keypairs | client-side | on open |
| `GET /api/networks` | Private networks | client-side | on open |
| `GET /api/security_groups` | Security groups | client-side | on open |
| `GET /api/availability_zones` | Available AZs | client-side | on open |
| `POST /api/instances` | Create a server | — | on submit |

All endpoints run through the existing `handle_api_call` envelope and return
`{ <resource>: [...] }`. Images additionally carry a paging marker:
`{ images: [...], next_marker: "<id>" | null }`.

### Structured option shapes (replace label matching)

```
Flavor:  { id, name, vcpus, ram, disk, hypervisor_type }   # "kvm" | "vmware" | "baremetal"
Image:   { id, name, visibility, hypervisor_type, min_disk, size }
Keypair: { name }                                          # Nova keyed by name
Network: { id, name }
SecGroup:{ id, name }
AZ:      { name }                                          # available AZs only
```

### Create payload (request)

```
{
  name, flavor_id, image_id, keypair, availability_zone,
  network_id, security_groups: [name, ...], user_data
}
```

### New service layer

Two new mixins, analogous to `InstanceAssembler` (plain data in/out, no markup):

- **`FormOptionsAssembler`** — maps raw Nova/Neutron/Glance hashes to the lean
  structured option shapes above. No label/markup generation.
- **`ServerCreateAssembler`** — validates the incoming payload and builds the
  Nova `POST /servers` body:
  - camelCase rename: `image_id`→`imageRef`, `flavor_id`→`flavorRef`,
    `keypair`→`key_name`, `availability_zone`→`availability_zone`
  - `user_data` → Base64
  - `security_groups` → `[{ name: … }]`
  - `network_id` → `networks: [{ uuid: … }]`
  - `max_count = 1` (single place; v1)
  - **without** BDM / port pre-creation (follow-up iterations)

New mixin methods in `Nova`/`Neutron`/`Glance` for the additional lists
(`nova_keypairs`, `nova_availability_zones`, `neutron_networks`,
`neutron_security_groups`, `glance_images` extended with `q`/`marker`,
`nova_create_server`).

### Policy

New entry `compute_njq:instance_create` in `config/policy.json` (matching the
legacy `rule:instance_actions`). The POST controller enforces it.

## Frontend

### Routing

Dedicated route `routes/instances/new.tsx` (file-based) instead of a modal with
no URL. The instance table gets a "Create New" button that navigates there.
Rendered as a Bootstrap-5 modal/panel matching the njq look. Advantages over the
legacy modal: shareable URL, back button, router context for the apiClient.

### Components (`routes/instances/-components/`)

```
CreateInstanceForm.tsx        # orchestrates fields, submit, error display
SearchableSelect.tsx          # reusable searchable dropdown
fields/
  FlavorSelect.tsx            # client-side searchable
  ImageSelect.tsx             # server-side search (debounced), pagination
  KeypairSelect.tsx
  NetworkSelect.tsx
  SecurityGroupSelect.tsx
  AvailabilityZoneSelect.tsx
  NameField.tsx
  UserDataField.tsx
```

### Lazy loading & search

- Each select has its own TanStack query with `enabled` on first open/focus →
  the dialog renders immediately, data arrives on demand.
- `SearchableSelect` encapsulates the search/scroll/keyboard logic. Small lists:
  client-side filter. Images: an `onSearch` prop (debounced query with `q`) +
  "load more" via `next_marker`.
- New hooks in `hooks/`: `useFlavorsQuery`, `useImagesQuery` (infinite/marker),
  `useKeypairsQuery`, `useNetworksQuery`, `useSecurityGroupsQuery`,
  `useAvailabilityZonesQuery`.

### Create mutation

`useCreateInstanceMutation` (`useMutation`) → POST; `onSuccess` invalidates
`QUERY_KEYS.instances` (the list refetches automatically, including the existing
transition polling) and navigates back to the table. New query keys in
`queryKeys.ts` for the form resources.

### Types & validation

New Zod schemas in `types/` (`flavor.ts`, `image.ts`, `keypair.ts`, …) for the
option shapes, plus `createInstance.ts` for the request payload. The `apiClient`
gains `formOptions` and `instances.create` methods, each using
`parseOrThrow`/`checkForApiError` as existing.

## Validation & error handling

Two-stage (like legacy, but cleaner):

- **Client (React/Zod):** required fields (name, flavor, image, keypair,
  network), name-format rule (`/\A.*\.\d+\Z/` forbidden — today server-side only,
  pulled forward for immediate feedback), submit disabled until valid. Replaces
  the legacy enable/disable fiddling with declarative form state.
- **Server (BFF, authoritative):** `ServerCreateAssembler` validates before
  building the payload; missing required fields → `ComputeNjq::RequestError` (→
  HTTP 400 via the envelope). Nova/Neutron errors (quota, invalid combination)
  pass through as `Elektron::Errors::ApiResponse` with the original status code.

Frontend: mutation errors → Bootstrap `alert-danger` above the fields (message
from `{ error, code, message }`). Field-specific errors, where Nova provides them
structurally, at the field; otherwise a summary message. The form stays open on
error with the entered values preserved (no data loss).

## Testing (TDD, per layer)

- **RSpec (BFF):** specs for `FormOptionsAssembler` mapping, `ServerCreateAssembler`
  payload building (Base64, SG names, networks shape, `max_count=1`), the new
  controller endpoints (success, 400 on missing fields, policy enforcement).
  Analogous to `instances_controller_spec` / `*_services` specs.
- **Vitest (frontend):** `SearchableSelect` (client filter + image server
  search), the query hooks (lazy `enabled`, invalidation after create),
  `CreateInstanceForm` (validation, submit, error display). Analogous to
  `InstanceTable.test` / `apiClient.test`.

## Reference: legacy locations (for orientation)

- Form: `plugins/compute/app/views/compute/instances/new.html.haml`
- jQuery network plugin: `plugins/compute/app/javascript/fixed_ip.js`
- Controller: `plugins/compute/app/controllers/compute/instances_controller.rb`
  (`new` ~176–245, `create` ~266–421)
- Model mapping: `plugins/compute/app/models/compute/server.rb`
  (`attributes_for_create` ~71–110, validations ~8–33)
- Helpers (grouping/labels): `plugins/compute/app/helpers/compute/instances_helper.rb`
