#!/usr/bin/env node
// Sync audit findings from audit-report.md to e-motion-dashboard/data/audit-findings.json
// Usage: node sync-findings-to-dashboard.mjs <audit-report.md>
//
// Required env: GH_TOKEN (alias DASHBOARD_REPO_TOKEN) — PAT with contents:write on e-motion-dashboard
// Optional env: PR_NUMBER, PR_URL, COMMIT_SHA

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DASHBOARD_REPO = 'So6Rallye/e-motion-dashboard';
const FINDINGS_PATH = 'data/audit-findings.json';
const BRANCH = 'staging';

// --- Stable ID computation ---
// Format: <bucket>/<rel-path>:<sha1(key).slice(0,8)>
// key = contextA + NUL + contextB when context is present; summary when both contexts are empty.
// NUL delimiter prevents ("ab","c") from colliding with ("a","bc").
// Line number is NOT part of the ID (included in payload only) for stability across refactors.
function stableId(bucket, relPath, contextA, contextB, summary = '') {
  const hasContext = Boolean((contextA ?? '') || (contextB ?? ''));
  const key = hasContext
    ? String(contextA ?? '') + '\x00' + String(contextB ?? '')
    : String(summary ?? '');
  const hash = createHash('sha1')
    .update(key)
    .digest('hex')
    .slice(0, 8);
  return `${bucket}/${relPath}:${hash}`;
}

// --- Unit tests — run before any sync to prove ID determinism ---
function runTests() {
  let passed = 0;

  // Determinism: same inputs → same ID across calls
  const id1 = stableId('always_loaded', 'CLAUDE.md', 'stack Node.js 22', 'stack Node.js 18');
  const id2 = stableId('always_loaded', 'CLAUDE.md', 'stack Node.js 22', 'stack Node.js 18');
  if (id1 !== id2) throw new Error(`Non-deterministic ID: "${id1}" vs "${id2}"`);
  passed++;

  // Format: bucket/path:8-char-hex
  const parts = id1.split(':');
  if (parts.length < 2) throw new Error(`Bad ID format (no colon): "${id1}"`);
  if (!id1.startsWith('always_loaded/CLAUDE.md:')) throw new Error(`Bad prefix: "${id1}"`);
  if (parts[parts.length - 1].length !== 8) throw new Error(`Hash not 8 chars: "${id1}"`);
  passed++;

  // Null/undefined context with no summary → same as empty string (fallback to summary key)
  const idNull = stableId('hooks', 'settings.json', null, null);
  const idEmpty = stableId('hooks', 'settings.json', '', '');
  if (idNull !== idEmpty) throw new Error(`null/empty mismatch: "${idNull}" vs "${idEmpty}"`);
  passed++;

  // Different contexts → different IDs (collision resistance basic check)
  const idA = stableId('conditional', 'rules/frontend.md', 'foo', 'bar');
  const idB = stableId('conditional', 'rules/frontend.md', 'foo', 'baz');
  if (idA === idB) throw new Error('Different contexts must produce different IDs');
  passed++;

  // bucket/path prefix is preserved verbatim (including slashes in path)
  const idSlash = stableId('project_state', 'docs/anti-patterns.md', 'x', 'y');
  if (!idSlash.startsWith('project_state/docs/anti-patterns.md:')) {
    throw new Error(`Path with slash not preserved: "${idSlash}"`);
  }
  passed++;

  // NUL delimiter prevents ("ab","c") from colliding with ("a","bc")
  const idConcat1 = stableId('always_loaded', 'CLAUDE.md', 'ab', 'c');
  const idConcat2 = stableId('always_loaded', 'CLAUDE.md', 'a', 'bc');
  if (idConcat1 === idConcat2) throw new Error('Delimiter missing: ("ab","c") must differ from ("a","bc")');
  passed++;

  // Null-context findings use summary as discriminator
  const idNoCtxA = stableId('project_state', 'TODO_SESSION.md', null, null, 'stale TODO: rewrite auth');
  const idNoCtxB = stableId('project_state', 'TODO_SESSION.md', null, null, 'stale TODO: migrate DB');
  if (idNoCtxA === idNoCtxB) throw new Error('Null-context findings must differ by summary');
  passed++;

  console.log(`[tests] stableId: ${passed}/7 passed ✓`);
}

// --- Parse audit-report.md and extract the trailing JSON block ---
function extractFindings(reportPath) {
  const content = readFileSync(reportPath, 'utf8');

  // The JSON block is the LAST ```json ... ``` in the file
  const jsonMatch = [...content.matchAll(/```json\s*([\s\S]*?)\s*```/g)].at(-1);
  if (!jsonMatch) {
    console.warn('[extract] No JSON block found in audit report — treating as zero findings');
    return { schema_version: 1, findings: [] };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[1]);
  } catch (e) {
    throw new Error(`[extract] Failed to parse JSON block: ${e.message}`);
  }

  // Recompute stable IDs (override whatever the model emitted — this script is the source of truth)
  const now = new Date().toISOString();
  for (const f of parsed.findings ?? []) {
    f.id = stableId(f.bucket, f.file, f.context_a, f.context_b, f.summary);
    f.state ??= 'open';
    f.first_seen ??= now;
    f.last_seen = now;
    f.state_history ??= [];
    f.pr_url = process.env.PR_URL ?? null;
  }

  return parsed;
}

// --- Fetch existing findings.json from dashboard repo (or return empty scaffold) ---
function fetchExisting() {
  try {
    const raw = execFileSync(
      'gh',
      ['api', `repos/${DASHBOARD_REPO}/contents/${FINDINGS_PATH}?ref=${BRANCH}`],
      { encoding: 'utf8' }
    );
    const meta = JSON.parse(raw);
    const content = Buffer.from(meta.content, 'base64').toString('utf8');
    console.log(`[fetch] Existing file found (sha: ${meta.sha.slice(0, 7)})`);
    return { data: JSON.parse(content), sha: meta.sha };
  } catch {
    console.log('[fetch] No existing file — will create');
    return {
      data: { schema_version: 1, last_run: null, findings: [] },
      sha: null,
    };
  }
}

// --- Merge incoming findings into existing, preserving user-set states ---
// Rules:
//   - New ID → add with state "open"
//   - Existing ID, state "open" → update metadata (summary, context, last_seen)
//   - Existing ID, state "resolved" or "ignored" → re-open + log in state_history
//   - Existing ID, state "approved" or "modify_before_fix" → preserve state, update last_seen
//   - Existing ID, same project, state "open", absent from incoming → auto-resolve (fixed)
//   - Findings from other projects → untouched (project-scoped isolation for multi-project)
function mergeFindings(existing, incoming, runMeta) {
  const byId = new Map();
  for (const f of existing.findings ?? []) {
    byId.set(f.id, { ...f });
  }

  const now = new Date().toISOString();
  const incomingProject = incoming.project ?? runMeta.project;
  const incomingIds = new Set((incoming.findings ?? []).map((f) => f.id));

  for (const f of incoming.findings ?? []) {
    if (byId.has(f.id)) {
      const prev = byId.get(f.id);
      if (prev.state === 'resolved' || prev.state === 'ignored') {
        prev.state_history = [
          ...(prev.state_history ?? []),
          { from: prev.state, to: 'open', ts: now, reason: 'Re-detected in audit run' },
        ];
        prev.state = 'open';
      }
      // Always update live metadata
      prev.last_seen = now;
      prev.pr_url = f.pr_url;
      prev.summary = f.summary;
      prev.context_a = f.context_a;
      prev.context_b = f.context_b;
      prev.why_it_matters = f.why_it_matters;
      prev.line = f.line;
      byId.set(f.id, prev);
    } else {
      byId.set(f.id, f);
    }
  }

  // Auto-resolve open findings from this project that were not detected in the latest run.
  // Findings from other projects are intentionally untouched (multi-project isolation).
  if (incomingProject) {
    for (const [id, f] of byId) {
      if (f.project === incomingProject && !incomingIds.has(id) && f.state === 'open') {
        f.state_history = [
          ...(f.state_history ?? []),
          { from: 'open', to: 'resolved', ts: now, reason: 'Not detected in latest audit run' },
        ];
        f.state = 'resolved';
        byId.set(id, f);
      }
    }
  }

  return {
    schema_version: 1,
    last_run: runMeta,
    findings: [...byId.values()],
  };
}

// --- Push merged JSON to dashboard repo via gh api ---
function pushToDashboard(merged, existingSha) {
  const content = Buffer.from(JSON.stringify(merged, null, 2) + '\n').toString('base64');
  const sha = process.env.COMMIT_SHA?.slice(0, 7) ?? 'unknown';
  const project = merged.last_run?.project ?? 'unknown';
  const message = `audit: sync findings from ${project} @ ${sha}`;

  const body = JSON.stringify({
    message,
    content,
    branch: BRANCH,
    ...(existingSha ? { sha: existingSha } : {}),
  });

  execFileSync(
    'gh',
    ['api', '--method', 'PUT', `repos/${DASHBOARD_REPO}/contents/${FINDINGS_PATH}`, '--input', '-'],
    { input: body, encoding: 'utf8' }
  );

  console.log(`[push] ${DASHBOARD_REPO}/${FINDINGS_PATH} updated (branch: ${BRANCH})`);
}

// --- Main ---
async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error('Usage: node sync-findings-to-dashboard.mjs <audit-report.md>');
    process.exit(1);
  }

  // 1. Unit tests first — abort if any fail
  runTests();

  // 2. Parse incoming report
  const incoming = extractFindings(reportPath);
  console.log(`[extract] ${incoming.findings?.length ?? 0} finding(s) in report`);

  // 3. Fetch existing state
  const { data: existing, sha: existingSha } = fetchExisting();
  console.log(`[fetch] ${existing.findings?.length ?? 0} finding(s) in dashboard`);

  // 4. Merge — project vient du champ "project" du JSON rapport (défini dans .agentaudit.yml)
  const runMeta = {
    project: incoming.project ?? 'unknown',
    commit: process.env.COMMIT_SHA ?? null,
    ts: new Date().toISOString(),
    pr: process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : null,
  };
  const merged = mergeFindings(existing, incoming, runMeta);
  console.log(`[merge] ${merged.findings.length} total finding(s) after merge`);

  // 5. Push (skip if no token — dry-run mode for local testing)
  const hasToken = Boolean(process.env.DASHBOARD_REPO_TOKEN || process.env.GH_TOKEN);
  if (!hasToken) {
    console.warn('[push] No token — dry-run mode, printing merged JSON');
    console.log(JSON.stringify(merged, null, 2));
    return;
  }

  pushToDashboard(merged, existingSha);
}

main().catch(e => {
  console.error(`[fatal] ${e.message}`);
  process.exit(1);
});
