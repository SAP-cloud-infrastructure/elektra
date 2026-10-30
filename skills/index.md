# Skills Index

Focused, loadable docs for Elektra's internals. Each skill is a directory with a
`SKILL.md` carrying YAML frontmatter (`name`, `description`). They are written for a
**dual audience** — readable technical documentation for humans, and on-demand
context for AI agents.

Read a skill before working in the area it covers. See the repo-root
[`AGENTS.md`](../AGENTS.md) for the overall project entry point.

| Skill | Description |
| --- | --- |
| [service-layer](service-layer/SKILL.md) | How controllers reach OpenStack through the service layer: `services.NAME`, `Service`/`Model` base classes, the Elektron client, and the API-client tiers. |
| [skill-curator](skill-curator/SKILL.md) | Routine to keep these skills accurate and tidy — verify facts against code, reconcile this index, check frontmatter. Run regularly. |

<!-- Planned (not yet written): authentication, frontend-widgets, plugin-architecture -->

## Conventions for skills

- One directory per skill: `skills/<name>/SKILL.md`.
- Frontmatter requires `name` (matches the directory) and `description` (a one-line
  "use when …" that states when the skill is relevant).
- Cite real file paths (e.g. `lib/core/service_layer/service.rb`) for every
  architectural claim. Do not document from memory or from the private `CLAUDE.md`;
  verify against the code.
- Add a row to this table whenever you add a skill.
