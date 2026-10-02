/**
 * HOME + SHELL — evening toddler hunt, pass 1 (2026-10-02).
 *
 * 1. attractStore: a storage READ that throws must not become the all-false
 *    defaults that noteHomeSeen() (every Home view) then SAVES over the stored
 *    record. Driven for real on a fake AsyncStorage whose reads can throw.
 * 2. StartHereScreen: a copy loaded AS A GUEST is never saved whole (the
 *    PagedLab rule) — a signed-in learner whose tier read failed would have
 *    had their stored ticks replaced by the empty guest copy on a CONTINUE in
 *    the gap before the re-read; and ticks made before the tier was known are
 *    held for the sign-in hand-off. Source-reading (a 500-line React screen).
 *
 * R2: both FAILED against the files as they were at 86f4a4d2 (copied aside,
 * restored, run, put back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__HSE1_AS__ = AS;
g.__HSE1_FAIL__ = false;
g.__HSE1_SETS__ = [] as string[];

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__HSE1_AS__;
  export default {
    async getItem(k) { if (globalThis.__HSE1_FAIL__) throw new Error('storage read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { globalThis.__HSE1_SETS__.push(k); s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
  };`);
const REACT = mod(`
  export function useState(v) { return [typeof v === 'function' ? v() : v, () => {}]; }
  export function useEffect(fn) { fn(); }
  export default { useState, useEffect };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

const KEY = 'ape:homeAttract2';
const STORED = { exploreDone: true, aboutDone: true, enrolledOnce: true, deckNextDone: true, firstSeenAt: 1_700_000_000_000 };
AS.set(KEY, JSON.stringify(STORED));
g.__HSE1_FAIL__ = true; // the very first read of this launch throws

const attract = await import('../src/features/onboarding/attractStore.ts');

describe('attractStore: a failed read is never saved over the stored cues', () => {
  it('[R2] noteHomeSeen / the marks write NOTHING while the record could not be read, and every cue stays quiet', async () => {
    attract.noteHomeSeen();
    attract.markExploreOpened();
    await settle();
    assert.deepEqual(g.__HSE1_SETS__, [], 'nothing may be written over a record that was never read');
    assert.deepEqual(JSON.parse(AS.get(KEY) as string), STORED, 'the stored cues are intact');
    const flags = attract.useHomeAttract();
    assert.equal(flags.explore || flags.about || flags.enrollments || flags.deckNext, false, 'unknown is quiet');
    assert.equal(attract.useAboutOpened(), true, 'unknown reads as opened (quiet)');
  });

  it('reads again on the next action once storage answers, and keeps the stored record', async () => {
    g.__HSE1_FAIL__ = false;
    attract.noteHomeSeen();
    await settle();
    // firstSeenAt was already set, so the stamp is a no-op; nothing reset.
    assert.deepEqual(JSON.parse(AS.get(KEY) as string), STORED);
    const flags = attract.useHomeAttract();
    assert.equal(flags.explore, false, 'Explore was opened long ago — no ring');
    assert.equal(flags.enrolledOnce, true, 'the green Enrollments chip stays');
  });
});

describe('StartHereScreen: a guest-loaded copy is never saved over the account', () => {
  const src = readFileSync(fileURLToPath(new URL('../src/screens/startHere/StartHereScreen.tsx', import.meta.url)), 'utf8');
  const persistFn = src.slice(src.indexOf('const persist = useCallback('), src.indexOf('// ── the one tone voice'));

  it('[R2] the save is refused while the copy on screen was loaded as a guest; the deltas are held instead', () => {
    assert.match(persistFn, /if \(!noAccountRef\.current && loadedRef\.current && !loadedAsGuestRef\.current\) void savePagedProgress\(START_HERE_ID, next\);/);
    assert.match(persistFn, /else if \(noAccountRef\.current \|\| loadedAsGuestRef\.current\) holdDeltas\(base, next\);/);
  });

  it('[R2] every load records whether it loaded as a guest, and a guest first load holds the ticks made before it', () => {
    const load = src.slice(src.indexOf('void loadPagedProgress(START_HERE_ID).then('), src.indexOf('const persist = useCallback('));
    assert.match(load, /loadedAsGuestRef\.current = noAccountRef\.current;/);
    assert.match(load, /if \(first\) holdDeltas\(\{ completed: \[\], lastPage: 0, done: false \}, progressRef\.current\);/);
  });
});
