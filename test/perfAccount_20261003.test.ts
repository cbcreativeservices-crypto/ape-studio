/**
 * PERFORMANCE HUNT 2026-10-03 — AREA 8 (ACCOUNT + COMMERCE): receipts.
 *
 * Each test pins the faster structure and FAILED against HEAD 4201f49f (R2:
 * the file was copied aside, `git show HEAD:<path>` written back, this test
 * run, the edit restored and compared byte-for-byte).
 *
 *   A. Term-list icon strips (TermSelectIcons, in every glossary / flashcard /
 *      enrollment / dashboard term list) subscribe to ONE term's membership,
 *      not the whole Set — a tap in one row no longer re-renders every row.
 *      Driven for real against the store with a recording React stub.
 *   B. The bookmark-popup list switcher reads every context's count in ONE
 *      storage trip (multiGet), not one awaited getItem per context.
 *      Driven for real on a fake AsyncStorage that charges per call.
 *   D. Push registration: the account lookup runs beside Expo's token fetch.
 *   E. Settings open: the server prefs read goes out beside the device read.
 *   F. Permission explainer: ALLOW / DECLINE answer before the "always /
 *      never" disk write, not after it.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/* ── fakes ─────────────────────────────────────────────────────────────── */
const g = globalThis as Record<string, any>;
const AS = new Map<string, string>();
g.__PA8_AS__ = AS;
g.__PA8_CALLS__ = 0;
g.__PA8_FAIL_MULTI__ = false;

// Every storage call costs one "trip" (counted) and a real 5 ms wait, the way
// each AsyncStorage call is a native round trip on a phone.
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__PA8_AS__;
     const trip = async () => { globalThis.__PA8_CALLS__ += 1; await new Promise((r) => setTimeout(r, 5)); };
     export default {
       async getItem(k) { await trip(); return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { await trip(); s.set(k, v); },
       async removeItem(k) { await trip(); s.delete(k); },
       async getAllKeys() { await trip(); return [...s.keys()]; },
       async multiGet(keys) {
         await trip();
         if (globalThis.__PA8_FAIL_MULTI__) throw new Error('multiGet failed');
         return keys.map((k) => [k, s.has(k) ? s.get(k) : null]);
       },
     };`,
  );
// A React stub that records what a hook subscribed to, so the test can read
// the SNAPSHOT React would compare between renders.
const FAKE_REACT =
  'data:text/javascript,' +
  encodeURIComponent(
    `export function useSyncExternalStore(subscribe, getSnapshot) { return { subscribe, getSnapshot }; }
     export default { useSyncExternalStore };`,
  );
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null } }; } },
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads in this test'); },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier === 'react') return { url: FAKE_REACT, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const flags = await import('../src/features/flags/flaggedStore.ts');
const settle = () => new Promise((r) => setTimeout(r, 60));

/* ── A ─────────────────────────────────────────────────────────────────── */
test('A · a term row subscribes to its own membership: a tap on ANOTHER row leaves its snapshot unchanged', async () => {
  assert.equal(typeof flags.useInTermList, 'function', 'no per-term hook — every row subscribes to the whole Set');
  assert.equal(typeof flags.useIsBookmarked, 'function', 'no per-term bookmark hook');

  const rowA = flags.useInTermList('known', 'term-a');
  const rowB = flags.useInTermList('known', 'term-b');
  const whole = flags.useTermList('known') as unknown as { getSnapshot: () => unknown };
  await settle(); // hydrated
  const aBefore = rowA.getSnapshot();
  const setBefore = whole.getSnapshot();

  flags.setInTermList('known', 'term-b', true); // the tap — in row B
  await settle();

  // The whole-Set hook hands every subscriber a NEW object: every row re-renders.
  assert.notEqual(whole.getSnapshot(), setBefore);
  // The per-term hook: row A's answer is the same value → React bails out.
  assert.equal(rowA.getSnapshot(), aBefore);
  assert.equal(rowA.getSnapshot(), false);
  // …and the row that changed does see it.
  assert.equal(rowB.getSnapshot(), true);

  const bmA = flags.useIsBookmarked('glossary', 'term-a');
  const bmB = flags.useIsBookmarked('glossary', 'term-b');
  await settle();
  flags.toggleBookmark('glossary', 'term-b');
  await settle();
  assert.equal(bmA.getSnapshot(), false);
  assert.equal(bmB.getSnapshot(), true);
});

test('A · TermSelectIcons reads per-term booleans and is memoized', () => {
  const s = read('src/features/flags/TermSelectIcons.tsx');
  const body = s.slice(s.indexOf('export const TermSelectIcons'), s.indexOf('const styles = StyleSheet.create'));
  assert.match(s, /export const TermSelectIcons = memo\(function TermSelectIcons\(/, 'not memoized');
  assert.match(body, /useIsBookmarked\(bookmarkCtx, id\)/);
  assert.match(body, /useInTermList\('starred', id\)/);
  assert.match(body, /useInTermList\('known', id\)/);
  assert.doesNotMatch(body, /useTermList\(|useBookmarks\(/, 'still subscribed to a whole list');
});

/* ── B ─────────────────────────────────────────────────────────────────── */
test('B · the bookmark contexts are counted in one storage trip, not one per context', async () => {
  AS.clear();
  for (let i = 0; i < 12; i += 1) AS.set(`ape:bm:topic-${i}`, JSON.stringify([`t${i}`, `u${i}`]));
  AS.set('ape:bm:empty', '[]');
  AS.set('ape:bm:corrupt', '{not json');
  AS.set('ape:other', '"x"');

  g.__PA8_CALLS__ = 0;
  const t0 = performance.now();
  const out = await flags.listBookmarkContexts();
  const ms = performance.now() - t0;
  assert.equal(out.length, 12);
  assert.deepEqual(out[0], { ctx: 'topic-0', count: 2 });
  assert.ok(!out.some((o: { ctx: string }) => o.ctx === 'empty' || o.ctx === 'corrupt'), 'empty / corrupt contexts are skipped as before');
  // getAllKeys + one multiGet. HEAD: getAllKeys + 14 sequential getItem.
  assert.equal(g.__PA8_CALLS__, 2, `${g.__PA8_CALLS__} storage trips (${ms.toFixed(0)} ms)`);
});

test('B · a failed batch read falls back to per-key reads with the same answer', async () => {
  g.__PA8_FAIL_MULTI__ = true;
  try {
    const out = await flags.listBookmarkContexts();
    assert.equal(out.length, 12);
  } finally {
    g.__PA8_FAIL_MULTI__ = false;
  }
});

/* ── D ─────────────────────────────────────────────────────────────────── */
test('D · push registration: the account lookup is started before Expo’s token fetch, awaited after it', () => {
  const p = read('src/features/notifications/push.ts');
  const once = p.slice(p.indexOf('async function registerAndSavePushTokenOnce'), p.indexOf('function payloadFromResponse'));
  const start = once.indexOf('const uidP = appUserId();');
  const fetchTok = once.indexOf('getExpoPushTokenAsync');
  const wait = once.indexOf('const uid = await uidP;');
  assert.ok(start > 0 && start < fetchTok && fetchTok < wait, 'lookup not overlapped with the token fetch');
  assert.match(once, /uidP\.catch\(\(\) => \{\}\);/);
  // Started only once permission is granted (no lookup for a denied phone).
  assert.ok(once.indexOf("if (status !== 'granted') return none;") < start);
});

/* ── E ─────────────────────────────────────────────────────────────────── */
test('E · Settings open: the server prefs read is started before the device read is awaited', () => {
  const s = read('src/screens/settings/SettingsScreen.tsx');
  const fn = s.slice(s.indexOf('const reloadPrefs = useCallback'), s.indexOf('const setLocalKey = useCallback'));
  const start = fn.indexOf('const prefsP = fetchNotificationPrefs();');
  const local = fn.indexOf('await loadLocalSettings()');
  assert.ok(start > 0 && start < local, 'prefs read still waits behind the device read');
  assert.match(fn, /const p = await prefsP;/);
});

/* ── F ─────────────────────────────────────────────────────────────────── */
test('F · permission explainer: the answer goes out before the remembered-choice write', () => {
  const s = read('src/features/permissions/PermissionPrompt.tsx');
  const allow = s.slice(s.indexOf('const onAllow = useCallback'), s.indexOf('const onDecline = useCallback'));
  assert.ok(allow.indexOf('void runOs(resolve);') < allow.indexOf('await setAskMode'), 'the OS ask waits on the disk write');
  const decline = s.slice(s.indexOf('const onDecline = useCallback'), s.indexOf('const promptProps'));
  assert.ok(decline.indexOf("resolve('cancelled');") < decline.indexOf('await setAskMode'), 'DECLINE waits on the disk write');
});
