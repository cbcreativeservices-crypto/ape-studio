/**
 * HUNT 11 — AREA 1, HOME + SHELL (2026-10-04).
 *
 * 1. (K1) TopicWelcomeSheet read its seen-flag identity with `getUser()` (an
 *    auth-server round trip) and answered 'guest' whenever it stalled or
 *    failed. A member on a weak connection then read the GUEST flag — never
 *    set for them — and was shown a topic welcome they had already
 *    dismissed, and the dismiss was filed under 'guest'. It now reads the
 *    stored session with `safeSessionResult` and shows nothing when the read
 *    did not answer.
 *
 * R2: this receipt FAILED against HEAD 784bb36f (file copied aside, the HEAD
 * file written back, this test run, the fix restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('1. TopicWelcomeSheet: an unanswered session read is not a guest', () => {
  const src = strip(read('src/features/intro/TopicWelcomeSheet.tsx'));
  // No auth-server round trip, and no fallback that turns "unknown" into 'guest'.
  assert.doesNotMatch(src, /getUser\(/, 'reads the stored session, not getUser()');
  assert.doesNotMatch(src, /safeUser\(/);
  assert.match(src, /safeSessionResult\(supabase\.auth\.getSession\(\), 'TopicWelcomeSheet'\)/);
  const fn = src.slice(src.indexOf('async function currentUid'), src.indexOf('async function fetchWelcome'));
  assert.match(fn, /Promise<string \| null>/, 'currentUid can answer "unknown"');
  assert.match(fn, /if \(timedOut\) return null;/, 'a stalled / unreachable read is unknown');
  assert.match(fn, /catch \{\s*return null;\s*\}/, 'a thrown read is unknown, never guest');
  assert.equal((fn.match(/'guest'/g) ?? []).length, 1, "'guest' only for a read that answered with no session");
  // The effect shows nothing for an unknown identity (no seen-flag read, no fetch).
  assert.match(src, /const uid = await currentUid\(\);\s*if \(!alive \|\| uid == null\) return;/);
});
