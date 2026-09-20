/**
 * Every server object this app names by string literal must actually exist,
 * and be readable by the role that reads it.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Two overnight audit passes produced the same worst finding twice, in
 * different shapes, and NOTHING in the toolchain could see either:
 *
 *  · The employer apply form invoked an edge function called
 *    `employer-confirm-email` that did not exist in the repo. Every applicant
 *    was told a six-digit code had been sent, and none ever was.
 *  · `public.glossary` and `public.glossary_full_v` had their SELECT grants
 *    revoked. `GlossaryScreen` kept reading them, kept compiling, kept
 *    passing 1710 tests — and every glossary cross-link silently became
 *    "Couldn't load details — tap to retry", permanently, for every user.
 *
 * Both are the same shape: **a string naming a server object, with nothing
 * asserting the object is there.** `tsc` cannot see inside a string. A unit
 * test with a mocked client cannot either — it asserts the call was made, not
 * that the target exists.
 *
 * So the server's shape is snapshotted on disk and asserted against here.
 *
 * ── REGENERATING THE SNAPSHOT ───────────────────────────────────────────────
 *
 * Deliberately manual, so a revoke shows up as a REVIEWABLE DIFF rather than
 * as a silent behaviour change. Run these against the project and rewrite the
 * fixtures:
 *
 *   -- test/fixtures/serverRelations.txt  (name=1 when a client can SELECT)
 *   select c.relname,
 *          bool_or(g.grantee in ('anon','authenticated')
 *                  and g.privilege_type = 'SELECT') as client_select
 *   from pg_class c
 *   left join information_schema.role_table_grants g
 *          on g.table_schema = 'public' and g.table_name = c.relname
 *   where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','v','m')
 *   group by 1;
 *
 *   -- test/fixtures/edgeFunctions.json
 *   `supabase functions list`, or the Management API.
 *
 * If this test fails, the snapshot is probably RIGHT and the code is wrong.
 * Check the live project before editing a fixture to make a test pass.
 */
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import test from 'node:test';

const ROOTS = ['src', 'web/app', 'web/components', 'web/lib', 'supabase/functions'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const FILES = ROOTS.filter((r) => existsSync(r)).flatMap((r) => walk(r));
const rel = (f: string) => f.split(sep).join('/');

/** name → the files that reference it. */
function collect(re: RegExp): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const f of FILES) {
    for (const m of readFileSync(f, 'utf8').matchAll(re)) {
      const k = m[1];
      if (!out.has(k)) out.set(k, []);
      if (!out.get(k)!.includes(rel(f))) out.get(k)!.push(rel(f));
    }
  }
  return out;
}

const RELATIONS = new Map<string, boolean>(
  readFileSync('test/fixtures/serverRelations.txt', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [k, v] = l.split('=');
      return [k, v === '1'] as [string, boolean];
    }),
);

const EDGE: string[] = JSON.parse(readFileSync('test/fixtures/edgeFunctions.json', 'utf8'));

/**
 * Edge functions this repo calls that are NOT deployed, each with the reason
 * it is acceptable. An entry here is a promise that the CALLER FAILS SAFE.
 */
const UNDEPLOYED_OK: Record<string, string> = {
  'employer-issue-code':
    'Written 2026-09-20, awaiting the owner + EMPLOYER_MAIL_FROM. The apply route treats any ' +
    'failure as "no code sent" and the form then shows the honest manual-review branch, so an ' +
    'undeployed function is correct behaviour rather than a lie. See supabase/functions/_DEPLOY_NOTES.md.',
};

/**
 * Relations read without a client SELECT grant, each with the reason.
 * ⛔ Adding a name here is a claim that the read is NOT made by a client.
 */
const NO_CLIENT_SELECT_OK: Record<string, string> = {
  access_codes: 'supabase/functions/admin-codes — runs as service_role in an edge function.',
  notification_concept_deliveries: 'supabase/functions/on-weekly-concept — service_role.',
  user_topic_enrollments:
    'src/features/enrollment/enrollmentStore — the read is a best-effort convenience that ' +
    'treats a 42501 denial and an empty result identically as "not confirmed". Never load-bearing.',
};

test('every edge function this repo invokes is deployed', () => {
  const invoked = collect(/functions\.invoke\(\s*['"]([A-Za-z0-9_-]+)['"]/g);
  for (const [slug, files] of collect(/functions\/v1\/([A-Za-z0-9_-]+)/g)) {
    invoked.set(slug, [...(invoked.get(slug) ?? []), ...files]);
  }
  const bad: string[] = [];
  for (const [slug, files] of invoked) {
    if (EDGE.includes(slug) || slug in UNDEPLOYED_OK) continue;
    bad.push(`${slug} — invoked from ${files.join(', ')}`);
  }
  assert.deepEqual(
    bad,
    [],
    'these edge functions are called but are not deployed. Deploy them, or add them to ' +
      'UNDEPLOYED_OK with the reason the caller fails safe:\n  ' + bad.join('\n  '),
  );
});

test('every relation this repo reads exists', () => {
  const bad: string[] = [];
  for (const [name, files] of collect(/\.from\(\s*['"]([A-Za-z0-9_]+)['"]/g)) {
    if (!RELATIONS.has(name)) bad.push(`${name} — read from ${files.join(', ')}`);
  }
  assert.deepEqual(bad, [], 'no such relation in public:\n  ' + bad.join('\n  '));
});

test('⛔ no client reads a relation it has no SELECT grant on', () => {
  const bad: string[] = [];
  for (const [name, files] of collect(/\.from\(\s*['"]([A-Za-z0-9_]+)['"]/g)) {
    if (RELATIONS.get(name) !== false) continue;
    if (name in NO_CLIENT_SELECT_OK) continue;
    bad.push(`${name} — read from ${files.join(', ')}`);
  }
  assert.deepEqual(
    bad,
    [],
    'anon/authenticated hold no SELECT on these, so the read returns 42501 and the feature ' +
      'silently stops working:\n  ' + bad.join('\n  '),
  );
});

test('the allowlists do not outlive their reasons', () => {
  const invoked = new Set([
    ...collect(/functions\.invoke\(\s*['"]([A-Za-z0-9_-]+)['"]/g).keys(),
    ...collect(/functions\/v1\/([A-Za-z0-9_-]+)/g).keys(),
  ]);
  for (const slug of Object.keys(UNDEPLOYED_OK)) {
    assert.ok(
      invoked.has(slug) && !EDGE.includes(slug),
      `${slug} is in UNDEPLOYED_OK but is now either deployed or no longer called — remove the entry`,
    );
  }
  const read = new Set(collect(/\.from\(\s*['"]([A-Za-z0-9_]+)['"]/g).keys());
  for (const name of Object.keys(NO_CLIENT_SELECT_OK)) {
    assert.ok(
      read.has(name) && RELATIONS.get(name) === false,
      `${name} is in NO_CLIENT_SELECT_OK but is now either granted or no longer read — remove the entry`,
    );
  }
});
