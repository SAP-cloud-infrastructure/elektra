---
name: skill-curator
description: >-
  Use when adding or changing a skill, after a large refactor, or periodically to
  keep skills accurate. Also governs when to create a new skill vs. update AGENTS.md:
  always-on rules belong in AGENTS.md, situational deep-dives belong in a skill.
---

# Skill Curator

Skills double as technical documentation, so they rot the moment the code moves on
(wrong file paths, renamed classes, stale versions, dead index links). This skill is
the routine that keeps them trustworthy.

The guiding rule for all skills: **every architectural claim must be verifiable
against the current code — never from memory.**

---

## When to run the curator

Run the full routine whenever:
- A new skill is added or an existing one is significantly changed
- A large refactor touches areas covered by skills
- Periodically as a hygiene pass

Run at minimum the **check script** (step 1–2 below) after any skill edit.

### Proactive agent behaviour

**Do not wait to be asked.** When a session produces a durable rule, pattern, or
architectural insight that is not yet captured in a skill, surface it proactively:

> "This session established [X]. I can add/update a skill for it — want me to?"

Present a concrete proposal (which skill, what to add) rather than a vague offer.
If the user agrees, apply the update and run the check script in the same change.
If the user declines, drop it — do not re-ask in the same session.

---

## When to create a skill vs. update AGENTS.md

**Put it in `AGENTS.md`** if the rule must apply to every session — a short
invariant or pointer is enough. Keep it brief; details belong in a skill.

**Put it in a skill** if the guidance is detailed, situational, or
workflow-specific. Skills are loaded on demand; `AGENTS.md` is always loaded.

**One source of truth.** Never duplicate the full text in both places — a short
pointer in `AGENTS.md` linking to the skill is the right pattern.

### Checklist for a new or changed durable rule

1. Decide: always-on (`AGENTS.md`) or on-demand (skill)?
2. Add or update the relevant `skills/<name>/SKILL.md`.
3. Add a row to `skills/index.md` (new skill) or update the existing description.
4. Add or update the short pointer in `AGENTS.md` if always-on.
5. Cross-link related skills instead of copying text.
6. Include the skill update in the same commit as the behaviour it governs.

### When NOT to create a skill

- One-off fixes or task-specific notes
- Unconfirmed ideas
- Content already covered by an existing skill
- Temporary debugging context

---

## Maintenance routine

### 1. Structure & frontmatter

- Every skill is `skills/<name>/SKILL.md`.
- Every `SKILL.md` has YAML frontmatter with `name` (equal to the directory) and a
  `description` that states *when* the skill applies ("Use when …").

### 2. Reconcile the index

- Every `skills/<name>/` directory has a row in `skills/index.md`.
- Every link in `skills/index.md` points to a file that exists.
- No orphan rows (index entries without a directory) and no missing rows
  (directories without an index entry).

### 3. Fact-check against code

For each skill, take the cited file paths, class/method names, and version numbers
and confirm they still exist and still mean what the skill says. Fix or flag:

- Paths that no longer exist or moved.
- Renamed or removed classes/methods.
- Version numbers that drift from `Gemfile.lock`, `package.json`, `.ruby-version`,
  `.nvmrc`.
- Behaviour described in prose that the code contradicts.

### 4. Redundancy & gaps

- Flag overlapping skills that should merge, and large undocumented areas that
  deserve a new skill.
- Keep each skill focused on one area.

## Check script

The structural checks (steps 1–2) are mechanical. Run this from the repo root:

```bash
set -e
fail=0

# every skill dir has a SKILL.md with name: matching the dir
for dir in skills/*/; do
  name=$(basename "$dir")
  [ "$name" = "index.md" ] && continue
  f="$dir/SKILL.md"
  [ -f "$f" ] || { echo "MISS $f"; fail=1; continue; }
  grep -q "^name: $name$" "$f" || { echo "BAD frontmatter name in $f (expected '$name')"; fail=1; }
  grep -q "^description:" "$f" || { echo "MISS description in $f"; fail=1; }
  grep -q "($name/SKILL.md)" skills/index.md || { echo "MISS index row for $name"; fail=1; }
done

# every index link resolves
for link in $(grep -oE '\(([a-z-]+)/SKILL.md\)' skills/index.md | tr -d '()'); do
  [ -f "skills/$link" ] || { echo "MISS index→skills/$link"; fail=1; }
done

[ "$fail" = 0 ] && echo "skills: structure OK" || echo "skills: issues found"
```

Steps 3–4 (fact-checking and redundancy) need judgement and reading the code — they
are not fully automatable, but the per-skill "Key files" lists make them tractable:
open each listed file and confirm the claims.

## When you find problems

- Trivial drift (moved path, bumped version): fix inline in the skill.
- Behavioural change: update the prose and the example, re-run the fact-check.
- A skill that no longer has a clear subject: propose merging or removing it; update
  `skills/index.md` in the same change.
