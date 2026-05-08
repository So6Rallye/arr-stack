You are auditing the arr-stack repository for coherence between the rule surface
(files agents read as instructions) and the project state (files describing
what the project is, what was decided, what's in progress).

## Your job

Identify contradictions, broken pointers, and drift. Do NOT propose stylistic
improvements. Do NOT rewrite for clarity. Findings only matter if acting on
the wrong information would change agent behavior or mislead a future reader.

## Read order

1. Read `.agentaudit.yml` to learn which files belong to which bucket.
   If you cannot read it, stop and report that as the only finding.
2. Read every file in `always_loaded` first (CLAUDE.md and its tracked imports).
3. Read `rules_docs` files — these are the project's rule documentation trackable in CI.
   Note: `.claude/rules/*.md`, `.claude/agents/*.md`, `.brain/*.md`, and `AGENTS.md`
   are local files not tracked by git; their coherence is NOT verifiable in CI.
4. Read `ci_infra` — verify internal coherence of the audit system:
   - Bucket names in `audit-prompt.md` match bucket names in `.agentaudit.yml`
   - Files listed in `.agentaudit.yml` actually exist in the repository
   - `sync-findings-to-dashboard.mjs` JSON field names match the schema in this prompt
   - `agent-audit.yml` secret names are consistent with what the workflow expects
5. Read `project_state` and compare claims against:
   - `always_loaded` and `rules_docs` files
   - Other `project_state` files (e.g., FONCTIONNALITES.md vs JOURNAL.md vs REALISE.md)
   - Follow internal markdown links one level deep; verify targets exist.

## arr-stack-specific conventions (not findings)

- `.brain/` with dot — expected local directory, not tracked, not a violation
- `.claude/` — expected local directory (rules, agents, settings), not tracked, not a violation
- `AGENTS.md` absent from CI checkout — expected, local file, not a violation
- `../.brain/MISTAKES.md` cross-projet path in CLAUDE.md — expected workspace pattern
- Branch `main` = work branch (exception workspace — no staging on this repo) — expected
- `three-brain-out/` directories — Three-Brain log output — expected
- `cygpath` in hook commands — Windows path normalization — expected
- `CREDENTIALS.md` absent from CI (gitignored) — expected
- `INFOS-DEV/` — dev reference notes, not audit scope — expected
- Docker Compose configs and shell scripts — operational, not source code — expected

## Severity — apply strictly

**P0 (blocks PR):**
- Contradictions between `always_loaded` files (e.g., CLAUDE.md declares a stack or constraint
  that conflicts with another always_loaded file)
- Broken references: a file listed in `.agentaudit.yml` does not exist in the repository
- `ci_infra` coherence failures: bucket names in `audit-prompt.md` don't match `.agentaudit.yml`,
  or JSON field names in the sync script diverge from the schema in this prompt
- Broken internal markdown links in `always_loaded` or `rules_docs` files

**P1 (comment only, does not block):**
- `project_state` drift: FONCTIONNALITES.md describes a feature as complete but JOURNAL.md
  or PLAN_DEPLOIEMENT.md shows it as TODO or stale
- Contradictions between `rules_docs` files
- Cross-references between `project_state` files that disagree
- `always_loaded` (CLAUDE.md) references local-only files via @import without noting they are
  local — could mislead a reader who expects those files to be in the repo

**P2 (nit batch, report only):**
- Dates older than 60 days in open TODO items (TODO_SESSION.md)
- Duplicate information across markdown files
- Stale metadata headers (e.g., "Dernière mise à jour" header older than the file content)
- Motionless WIP sections (>60 days unchanged with no progress signal)

## Output format — strict markdown, exact structure

```
# Audit report — <YYYY-MM-DD> — <commit-sha-short>

## P0 findings (<count>)

**[<bucket>] `<file>:<line>`** — <one-sentence summary>

Context A (`<file-A>:<line>`):
> <quoted text, max 5 lines>

Context B (`<file-B>:<line>`):
> <quoted text, max 5 lines>

Why it matters: <one sentence>

---

## P1 findings (<count>)

**[<bucket>] `<file>:<line>`** — <one-sentence summary>

Inconsistency: <description>
Suggested fix: <one-sentence suggestion>

---

## P2 findings (<count>)

- `<file>:<line>` — <nit type>: <description>

---

## Audit metadata

Files scanned by bucket:
- always_loaded: <list>
- rules_docs: <list>
- ci_infra: <list>
- project_state: <list>

Cross-references followed: <N> (broken: <N>)
Files ignored: <list>
```

End the report with exactly this JSON block (last thing in file, no text after):

```json
{
  "schema_version": 1,
  "audit_date": "<ISO date>",
  "commit": "<sha>",
  "project": "arr-stack",
  "findings": [
    {
      "id": "<bucket>/<rel-path>:<sha1(context_a+context_b).slice(0,8)>",
      "project": "arr-stack",
      "bucket": "<always_loaded|rules_docs|ci_infra|project_state>",
      "severity": "<P0|P1|P2>",
      "file": "<rel-path>",
      "line": 0,
      "summary": "<one sentence>",
      "context_a": "<raw quoted text>",
      "context_b": "<raw quoted text>",
      "why_it_matters": "<one sentence>",
      "suggested_fix": null,
      "state": "open",
      "first_seen": "<ISO date>",
      "last_seen": "<ISO date>",
      "pr_url": null
    }
  ]
}
```

## Hard rules

- Never invent findings. An empty `findings: []` array is a valid and expected result.
- Never propose a fix for P0.
- Quote sparingly: max 5 lines per side, paraphrase otherwise.
- Merge findings with the same root cause into one entry.
- Stable finding ID: `<bucket>/<rel-path>:<sha1(context_a+context_b).slice(0,8)>`
  — do NOT include line number in the ID (include `line` in the JSON payload only).
  — `context_a` and `context_b` are the raw quoted strings, not summaries.
  — The sync script recomputes IDs server-side; emit your best effort, the script overrides.
- The closing ```json block must be the LAST content in the report — no text after it.
