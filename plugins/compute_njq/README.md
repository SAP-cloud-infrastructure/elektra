# compute_njq

An autonomous, React/BFF rewrite of the legacy `compute` plugin — built to run
**in parallel** with it, not to replace it in place.

## Why "njq" — the reason for the rewrite

`njq` stands for **"no jQuery"**. The legacy `compute` plugin renders its UI with
server-side HAML templates wired up by jQuery. Getting rid of jQuery is the whole
point of this rewrite:

- **Security.** jQuery-driven UIs tend to accumulate manual DOM manipulation and
  HTML-string assembly, which are a recurring source of XSS and injection bugs.
  A declarative React UI that renders data (never raw HTML strings) removes that
  class of risk, and drops a large legacy dependency from the surface area.
- **Maintainability.** Typed, component-based React with runtime-validated data
  contracts (Zod) is far easier to reason about, test, and evolve than imperative
  jQuery against HAML. The data that reaches the browser is plain, UI-ready JSON
  from a single backend-for-frontend endpoint, not HTML fragments.

## Design principles

- **Parallel, not a migration.** The legacy `compute` plugin stays untouched and
  enabled as a fallback. This plugin lives alongside it.
- **Autonomous (Kernregel).** `compute_njq` never reaches into other plugins'
  service layers (no `services.networking` / `image` / `block_storage` /
  `identity`). It owns its own Nova / Neutron / Glance Elektron handles, and
  cross-service joins happen **only** in this plugin's BFF layer. (Shared core
  infrastructure under `lib/*` — `ajax_helper`, `widget`, `StatusPill`,
  `pretty_date` — is core, not a cross-plugin dependency, and is allowed.)
- **BFF aggregation.** `GET /api/instances` joins Nova + Neutron + Glance
  server-side (`InstanceAssembler`) and returns UI-ready plain hashes. HTML
  strings are never passed as JSON.
- **Dev-only.** This plugin must not ship to production while it is under
  development: it is excluded at bundle time via `BLACK_LIST_PLUGINS` in the
  production image build, with a `Rails.env.development?` mount guard in
  `config/routes.rb` as defense-in-depth.

## Stack

- **Backend:** Rails Engine, Elektron OpenStack client (Nova microversion 2.67),
  BFF controllers with a `{ error, code, message }` error envelope.
- **Frontend:** React 19, TanStack Router (file-based) + TanStack Query, Zod
  runtime validation, Bootstrap 5 styling (to match the look of the legacy
  `compute` page), esbuild.

## Architecture

See [`docs/compute-njq/architecture-spec.md`](../../docs/compute-njq/architecture-spec.md)
for the full specification.
