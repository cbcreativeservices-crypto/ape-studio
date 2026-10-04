/**
 * STUDY area, toddler hunt 7 (2026-10-03).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed files
 * were copied aside, the HEAD ones written back, this file run, the fixes put
 * back and checked with cmp).
 *
 *   1. features/enrollment/enrollmentStore.ts — scheduleServerSync pushed
 *      `store.get()` to `sync_my_enrollments` (which REPLACES the server
 *      master list) without checking the list had been READ. A tap while the
 *      stored list was unreadable still armed the sync — `commit` saw its edit
 *      run when the store showed the queued tap on the empty placeholder — so
 *      the push carried that one tap and every other enrolled topic then
 *      raised `not_enrolled` on the server; the pull before it also took the
 *      empty placeholder for an untouched seed and queued a replace. The sync
 *      now reads again first and, still unreadable, goes to the retry backoff.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// ── Behavioural harness for (1): a signed-in session, a recording rpc, and a
// device whose stored enrollment list cannot be READ.
const fake = new Map<string, string>();
const g = globalThis as Record<string, unknown>;
g.__H7_STORE__ = fake;
g.__H7_UNREADABLE__ = new Set<string>(['ape:enrollmentList']);
g.__H7_RPC__ = [] as { fn: string; args: unknown }[];
const STORAGE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`const s = globalThis.__H7_STORE__; const bad = globalThis.__H7_UNREADABLE__;
  export default {
    async getItem(k) { if (bad.has(k)) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) { s.delete(k); },
  };`);
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: { user: { id: 'u1' } } } }; } },
    async rpc(fn, args) { globalThis.__H7_RPC__.push({ fn, args }); return { data: null, error: null }; },
    from() { return { select() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; },
  };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

test('a tap on an UNREADABLE enrollment list never replaces the server master list', async () => {
  const es = await import('../src/features/enrollment/enrollmentStore.ts');
  void es.addTopic(4200); // ENROLL tapped; the stored list's read fails
  es.getEnrollment(); // a screen renders the list (shows the queued tap)
  await new Promise((r) => setTimeout(r, 1300)); // past the 800 ms sync delay
  const pushes = (g.__H7_RPC__ as { fn: string; args: unknown }[]).filter((c) => c.fn === 'sync_my_enrollments');
  es.resetLocal(); // cancel any armed retry so the run ends
  assert.deepEqual(pushes, [], `pushed an unread list over the server: ${JSON.stringify(pushes)}`);
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('enrollment server sync never pushes or reconciles an unread list', () => {
  const s = code('src/features/enrollment/enrollmentStore.ts');
  const body = s.slice(s.indexOf('function scheduleServerSync('), s.indexOf('async function hydrate()'));
  assert.ok(body.length > 0, 'scheduleServerSync missing');
  const read = body.indexOf('await store.hydrate();');
  const guard = body.indexOf("if (!store.isHydrated()) throw new Error('enrollment list could not be read');");
  assert.ok(read > 0, 'the sync must read the stored list first');
  assert.ok(guard > read, 'an unreadable list must stop the sync (into the retry backoff)');
  assert.ok(guard < body.indexOf('reconcileFromServer(gen)'), 'guard must precede the pull');
  assert.ok(guard < body.indexOf("supabase.rpc('sync_my_enrollments'"), 'guard must precede the push');
  // …and the guard throws INTO the bounded retry, not out of the timer.
  assert.ok(body.indexOf('} catch (e) {') > guard, 'the throw must land in the retry catch');
});

/*
 *   2. screens/enrollment/EnrollmentScreen.tsx — My Enrollment said "No topics
 *      yet — open BROWSE & ADD below to enroll in your first one." whenever
 *      the list was empty, which is also what `useEnrollment()` answers while
 *      the stored list is still being read and after that read FAILED (D51: a
 *      failed read is never shown as empty). enrollmentStore now exposes the
 *      read state; the screen says loading / could not be read / truly empty.
 */
test('enrollmentStore exposes loading / unreadable / read', () => {
  const s = code('src/features/enrollment/enrollmentStore.ts');
  assert.match(s, /export type EnrollmentReadState = 'loading' \| 'unreadable' \| 'read';/);
  assert.match(
    s,
    /return store\.isHydrated\(\) \? 'read' : store\.isUnreadable\(\) \? 'unreadable' : 'loading';/,
  );
  assert.match(
    s,
    /export function useEnrollmentReadState\(\): EnrollmentReadState \{\s*return useSyncExternalStore\(store\.subscribe, enrollmentReadState, enrollmentReadState\);\s*\}/,
  );
});

test('My Enrollment never shows an unread list as "No topics yet"', () => {
  const s = code('src/screens/enrollment/EnrollmentScreen.tsx');
  // wrap-up 2026-10-04: the bundles' read state joins the topics' — the
  // topics' unreadable / loading still decide `enrollRead` on their own.
  assert.match(s, /const enrollTopicsRead = useEnrollmentReadState\(\);/);
  assert.match(s, /const enrollRead =\s*enrollTopicsRead === 'unreadable' \|\| [^?]*\?\s*'unreadable'\s*:\s*enrollTopicsRead === 'loading' \|\| [^?]*\?\s*'loading'\s*:\s*'read';/);
  const at = s.indexOf("'No topics yet — open BROWSE & ADD below to enroll in your first one.'");
  assert.ok(at > 0, 'empty copy missing');
  const before = s.slice(Math.max(0, at - 500), at);
  assert.match(before, /enrollRead === 'unreadable'\s*\?\s*'Your enrolled topics could not be read from this device just now/);
  assert.match(before, /enrollRead === 'loading'\s*\?\s*'Loading your topics…'/);
});
