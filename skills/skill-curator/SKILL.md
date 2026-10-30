---
name: skill-curator
description: >-
  Use periodically (and before shipping new skills) to keep the skills under
  `skills/` accurate and tidy: verify every factual claim against the current code,
  reconcile `skills/index.md` with the skills that actually exist, and check that
  each SKILL.md has valid frontmatter. Run this as a maintenance routine, not for
  feature work.
---

# Skill Curator

Skills double as technical documentation, so they rot the moment the code moves on
(wrong file paths, renamed classes, stale versions, dead index links). This skill is
the routine that keeps them trustworthy. Run it on a schedule, after large refactors,
and whenever a new skill is added.

The guiding rule for all skills: **every architectural claim must be verifiable
against the current code — never from memory or from the private `CLAUDE.md`.**

## Routine

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
