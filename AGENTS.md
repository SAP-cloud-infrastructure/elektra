# AGENTS.md

Entry point for AI agents **and** humans working on Elektra. Keep it short; deep
technical topics live as skills under [`skills/`](skills/index.md) and are loaded
on demand.

## What Elektra is

Elektra is an OpenStack dashboard for SAP Cloud Infrastructure, built on **Ruby on
Rails 8.1** and **React 19**. It uses a **plugin-based architecture**: each OpenStack
service (compute, networking, identity, …) is an independent Rails Engine under
`plugins/` with its own controllers, services, views, and frontend widgets.

**Tech stack:** Ruby 3.4.8 · Rails 8.1 · PostgreSQL · React 19 · TypeScript 5 ·
TanStack Router/Query · esbuild · pnpm 8 · Node 22 · RSpec · Vitest 4 · Playwright
(E2E). Always verify a version against `Gemfile.lock`, `package.json`,
`.ruby-version`, or `.nvmrc` rather than trusting prose — this file included.

## Working in the dev container

Development runs in a Docker container built from `docker/Dockerfile.dev`. The repo
is mounted at `/app`, the container is named `elektra-dev`, and it exposes port
**4001** (`APP_PORT`). Running these commands on the host (outside the container)
often fails with permission errors — always go through the container.

### Preferred: the `bin/workspace` helper

`bin/workspace` builds/starts/attaches the container and runs commands in it.

```bash
bin/workspace                      # start/attach the container, interactive shell
bin/workspace start-rails          # Rails server  (http://localhost:4001)
bin/workspace start-js             # JS build (watch mode)
bin/workspace bundle exec rspec    # Ruby tests
bin/workspace pnpm test            # JS/TS tests
bin/workspace rebuild              # rebuild the image
bin/workspace cleanup              # stop and remove the container
```

### Native Docker (equivalent, no helper)

`bin/workspace` is a thin wrapper around plain Docker; there is no docker-compose
setup. If you prefer raw commands:

```bash
docker build -t elektra-dev -f docker/Dockerfile.dev .
docker run -it --name elektra-dev -v "$PWD:/app" -p 4001:4001 -e APP_PORT=4001 elektra-dev
docker exec -it elektra-dev start-rails          # or start-js / bundle exec rspec / pnpm test
```

(`make build` / `docker/Dockerfile` build the **production** image `sapcc/elektra`,
not the dev environment.)

## Conventions

- **Commits & PR titles:** Conventional Commits `type(scope): subject`, **enforced in
  CI** by [`.github/workflows/pr-title-lint-check.yaml`](.github/workflows/pr-title-lint-check.yaml).
  The allowed types and scopes are the single source of truth in
  [`commitlint.config.mjs`](commitlint.config.mjs) — a scope is required and the
  subject must not start with an uppercase character.
- **PR description:** follow [`.github/pull_request_template.md`](.github/pull_request_template.md).
- **Ruby:** `snake_case` files/methods, `PascalCase` classes. Plugin controllers
  inherit from `DashboardController`; services from `Core::ServiceLayer::Service`;
  models from `Core::ServiceLayer::Model`.
- **JS/TS:** Prettier (120 cols, 2 spaces, no semicolons, double quotes). Strict
  TypeScript, functional React components with hooks.
- **Git/PRs:** never commit, push, or open a PR without explicit approval.

## Skills

The `skills/` directory holds focused, loadable docs for Elektra's internals. They
serve a **dual audience**: readable technical documentation for humans, and
on-demand context for agents.

- Browse the catalog in **[`skills/index.md`](skills/index.md)**.
- Each skill is `skills/<name>/SKILL.md` with YAML frontmatter (`name`,
  `description`). Read a skill's `SKILL.md` before working in the area it covers.
- Harness-neutral by design: skill-aware harnesses can list/trigger skills via the
  frontmatter; everything stays plain Markdown for everyone else.
- Keeping them current is itself a skill — see
  [`skills/skill-curator`](skills/skill-curator/SKILL.md).

> **Local overrides:** personal, machine-specific notes go in `AGENTS.local.md`
> (gitignored, not part of the repository). Claude Code loads `AGENTS.md` and
> `AGENTS.local.md` via the `CLAUDE.md` stub; other tools can read them directly.
