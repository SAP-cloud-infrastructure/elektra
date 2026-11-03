# Skills Index

Focused, loadable docs for Elektra's internals. Each skill is a directory with a
`SKILL.md` carrying YAML frontmatter (`name`, `description`). They are written for a
**dual audience** — readable technical documentation for humans, and on-demand
context for AI agents.

Read a skill before working in the area it covers. See the repo-root
[`AGENTS.md`](../AGENTS.md) for the overall project entry point.

| Skill | Description |
| --- | --- |
| [api-clients](api-clients/SKILL.md) | The three Elektron client tiers: `services` (user token), `service_user` / `cloud_admin` (privileged, same underlying client). Covers auth strategies (app credentials vs. password), middleware stacks, ObjectCache, `current_user` wrapper, `AuthUser`, scope resolution, and FriendlyIdEntry. |
| [build-system](build-system/SKILL.md) | esbuild JS pipeline (entry point discovery, path aliases, ?inline CSS, TanStack Router codegen) and Sprockets CSS pipeline (Bootstrap, Tailwind, plugin SCSS). Covers dev watch mode, production asset:precompile sequence, non-digest widget copies, Vitest setup, and TypeScript config. |
| [database](database/SKILL.md) | What Elektra stores locally in PostgreSQL: FriendlyIdEntry (UUID↔slug), ObjectCache (OpenStack API response cache), UserProfile/DomainProfile (identity metadata), ProjectProfile (wizard state), and the Inquiry workflow tables. Covers the AR vs. ServiceLayer::Model distinction. |
| [domain-config](domain-config/SKILL.md) | Per-domain behaviour: plugin/feature visibility, floating IP networks, DNS options, federation/SSO settings, CIDR validation. Covers the YAML file, DomainConfig class, and multi-entry merge. |
| [error-handling](error-handling/SKILL.md) | How exceptions flow from OpenStack through Elektron to rendered pages. Covers ErrorRenderer, the Rescue concern, rescue_and_render_exception_page, all error classes, templates, and request-format routing. |
| [inquiry](inquiry/SKILL.md) | The inquiry approval workflow plugin: AASM state machine (new→open→reviewing→approved/rejected→closed), InquiryService API (create_inquiry, set_inquiry_state), Delegates::Inquiry wrapper, Processor caching, email notifications, approver_domain_id cross-domain split, and consumer integrations (identity project requests, DNS zone requests). |
| [plugin-architecture](plugin-architecture/SKILL.md) | Rails Engine structure, esbuild build system, and all six frontend patterns (pure HAML, Redux+ReactRouter, TanStack Query+Juno, TanStack Router+Juno, Juno shadow DOM, external mount). Covers widget embedding, multi-widget plugins, and new plugin generation. |
| [policy-rbac](policy-rbac/SKILL.md) | Elektra's UI-layer permission system: policy.json format, server-side enforce_permissions / authorization_required, JS delivery via window.policyConfig, and client-side policy.isAllowed() in React widgets. |
| [service-layer](service-layer/SKILL.md) | How controllers reach OpenStack through the service layer: `services.NAME`, `Service`/`Model` base classes, the Elektron client, and the API-client tiers. |
| [skill-curator](skill-curator/SKILL.md) | Routine to keep these skills accurate and tidy — verify facts against code, reconcile this index, check frontmatter. Run regularly. |
| [testing](testing/SKILL.md) | RSpec controller specs (auth stubbing, FriendlyIdEntry seeding, Elektron doubles, shared examples), Vitest component/unit tests (jsdom setup, fetch/policy/ajaxHelper mocking), and Playwright E2E (smoke vs. UI profiles, e2e Rails environment, CI job structure). |

## Conventions for skills

- One directory per skill: `skills/<name>/SKILL.md`.
- Frontmatter requires `name` (matches the directory) and `description` (a one-line
  "use when …" that states when the skill is relevant).
- Cite real file paths (e.g. `lib/core/service_layer/service.rb`) for every
  architectural claim. Do not document from memory or from the private `CLAUDE.md`;
  verify against the code.
- Add a row to this table whenever you add a skill.
