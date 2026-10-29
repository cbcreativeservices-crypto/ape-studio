/**
 * LIVE SERVER ↔ APP MATCH (owner 2026-10-27, after the forgotten My Custom
 * List quiz: Comp A's functions were live, the app never called them, and
 * nothing noticed). docs/live/LIVE_SERVER_SNAPSHOT.json is a read-only copy of
 * what the live server has (refreshed by the nightly reconciliation and at
 * session start when the hook says it is stale).
 *
 *  1. Everything the app / website / edge code CALLS must exist on the server.
 *  2. Everything the server HAS that no code names must be in
 *     docs/live/SERVER_ONLY_ALLOWLIST.json with a reason; a reason that waits
 *     on app work cites its must-do row as [MD:<id>], and "TRIAGE" fails.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const snap = JSON.parse(read('docs/live/LIVE_SERVER_SNAPSHOT.json')) as { functions: string[]; edge_functions: string[] };
const allow = (JSON.parse(read('docs/live/SERVER_ONLY_ALLOWLIST.json')) as { allow: Record<string, string> }).allow;
const mustDo = read('docs/APE_LAUNCH_MUST_DO.md');

function walk(dir: string, out: string[] = []): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(rel);
  }
  return out;
}
const code = ['src', 'web/app', 'web/lib', 'supabase/functions'].flatMap((d) => walk(d)).map((f) => read(f)).join('\n');

test('every rpc() the code calls exists on the live server', () => {
  const called = new Set([...code.matchAll(/\brpc\(\s*['"]([a-z_0-9]+)['"]/g)].map((m) => m[1]));
  const missing = [...called].filter((f) => !snap.functions.includes(f));
  // Written for Comp A to create (must-do row named). Remove each the moment it
  // is live — the snapshot refresh will show it, and a stale entry fails below.
  const KNOWN_MISSING: Record<string, string> = {};
  for (const [f, row] of Object.entries(KNOWN_MISSING)) {
    assert.ok(mustDo.includes(`| ${row} |`), `${f} is excused by must-do ${row}, which is not on the list`);
    assert.ok(!snap.functions.includes(f), `${f} is live now: take it off KNOWN_MISSING`);
  }
  const unexcused = missing.filter((f) => !(f in KNOWN_MISSING));
  assert.deepEqual(unexcused, [], `called but not on the live server: ${unexcused.join(', ')}`);
});

test('every edge function the code calls is deployed', () => {
  const called = new Set(
    [...code.matchAll(/functions\/v1\/([a-z0-9-]+)|functions\.invoke\(\s*['"]([a-z0-9-]+)['"]/g)].map((m) => m[1] ?? m[2]),
  );
  const missing = [...called].filter((f) => !snap.edge_functions.includes(f));
  // employer-issue-code: must-do R2 (Comp A deploy, owner GO). Remove from this
  // list the moment it is deployed — the snapshot refresh will show it.
  const KNOWN_MISSING: Record<string, string> = { 'employer-issue-code': 'R2' };
  for (const [f, row] of Object.entries(KNOWN_MISSING)) {
    assert.ok(mustDo.includes(`| ${row} |`), `${f} is excused by must-do ${row}, which is not on the list`);
  }
  const unexcused = missing.filter((f) => !(f in KNOWN_MISSING));
  assert.deepEqual(unexcused, [], `called but NOT deployed: ${unexcused.join(', ')}`);
});

test('every live function no code names is allow-listed with a real reason', () => {
  const unnamed = snap.functions.filter((f) => !new RegExp(`\\b${f}\\b`).test(code));
  const unlisted = unnamed.filter((f) => !(f in allow));
  assert.deepEqual(unlisted, [], `live on the server, called by nothing, not explained: ${unlisted.join(', ')}`);
  const triage = Object.entries(allow).filter(([, why]) => /TRIAGE/.test(why)).map(([f]) => f);
  assert.deepEqual(triage, [], `allow-list entries still marked TRIAGE: ${triage.join(', ')}`);
  for (const [f, why] of Object.entries(allow)) {
    for (const m of why.matchAll(/\[MD:([A-Za-z0-9.]+)\]/g)) {
      assert.ok(mustDo.includes(`| ${m[1]} |`), `${f} cites must-do ${m[1]}, which is not on the list`);
    }
  }
});

test('an allow-listed function the code now calls must leave the allow-list', () => {
  const stale = Object.keys(allow).filter((f) => new RegExp(`\\b${f}\\b`).test(code));
  assert.deepEqual(stale, [], `now called — remove from SERVER_ONLY_ALLOWLIST: ${stale.join(', ')}`);
});
