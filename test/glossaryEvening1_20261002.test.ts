/**
 * GLOSSARY — evening toddler hunt pass 1 (2026-10-02).
 *
 * Two hand-rolled device-local reads in the glossary whose FAILED read became
 * an empty value that the next write put over the stored copy (pattern P1).
 * Both slipped past test/localStoreGuards_20261002 only because the files
 * happen to contain the word "unreadable" in a comment.
 *
 *   1. glossaryCap's guest meter: a throwing read reset a guest's weekly count
 *      to 1 (and wrote it) — a storage hiccup was a fresh fourteen.
 *   2. The Glossary's Recent list: a throwing read (or an open that beat the
 *      read) wrote a one-term list over the stored history. Now on the shared
 *      safe store (features/glossary/recentTerms.ts).
 *
 * Driven for real on a fake AsyncStorage whose reads can be made to throw or
 * held mid-flight; supabase and the device id are stubbed.
 *
 * R2: the meter tests and the GlossaryScreen source test FAILED against the
 * pre-fix files (copied aside, restored, run, put back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__GE1_AS__ = AS;
g.__GE1_FAIL__ = false;
g.__GE1_HOLD__ = null;
g.__GE1_SETS__ = [] as string[];

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__GE1_AS__;
  export default {
    async getItem(k) {
      if (globalThis.__GE1_FAIL__) throw new Error('storage read failed');
      const v = s.has(k) ? s.get(k) : null;
      const h = globalThis.__GE1_HOLD__; if (h) await h;
      return v;
    },
    async setItem(k, v) { globalThis.__GE1_SETS__.push(k); s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
  };`);
const REACT = mod(`
  export function useSyncExternalStore(sub, get) { return get(); }
  export default { useSyncExternalStore };`);
const SUPABASE = mod(`export const supabase = { async rpc() { return { data: null, error: { message: 'no rpc here' } }; } };`);
const DEVICE = mod(`export async function getDeviceId() { return 'device-1'; }`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    if (/lib\/supabase$/.test(specifier)) return stub(SUPABASE);
    if (/account\/deviceIdentity$/.test(specifier)) return stub(DEVICE);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const cap = await import('../src/features/glossary/glossaryCap.ts');
const recent = await import('../src/features/glossary/recentTerms.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
const sets = () => g.__GE1_SETS__ as string[];
function fresh(seed: Record<string, string> = {}): void {
  AS.clear();
  for (const [k, v] of Object.entries(seed)) AS.set(k, v);
  g.__GE1_FAIL__ = false;
  g.__GE1_HOLD__ = null;
  g.__GE1_SETS__ = [];
}

describe('glossary guest meter: a failed read is not a fresh week', () => {
  const KEY = 'ape:glossaryUsageLocal';

  it('[R2] a consume whose read throws fails OPEN and writes nothing over the stored count', async () => {
    const windowStart = Date.now() - 60_000;
    fresh({ [KEY]: JSON.stringify({ windowStart, used: 14 }) });
    g.__GE1_FAIL__ = true;
    const u = await cap.consumeGlossary('local');
    assert.equal(u.allowed, true, 'fail-open: the glossary never breaks on a disk hiccup');
    assert.equal(u.unavailable, true, 'and it says the meter could not be read');
    assert.deepEqual(sets(), [], 'nothing may be written from a read that failed');
    g.__GE1_FAIL__ = false;
    const st = await cap.getGlossaryStatus('local');
    assert.equal(st.used, 14, 'the stored count survived');
    assert.equal(st.allowed, false, 'still out of lookups once the store reads again');
  });

  it('[R2] a status read that throws is unavailable, not an empty week', async () => {
    fresh({ [KEY]: JSON.stringify({ windowStart: Date.now() - 1000, used: 14 }) });
    g.__GE1_FAIL__ = true;
    const st = await cap.getGlossaryStatus('local');
    assert.equal(st.unavailable, true);
  });

  it('[confirm] a damaged value still starts a new window (nothing usable to keep)', async () => {
    fresh({ [KEY]: '{not json' });
    const u = await cap.consumeGlossary('local');
    assert.equal(u.used, 1);
    assert.equal(u.unavailable, false);
    assert.deepEqual(sets(), [KEY]);
  });

  it('[confirm] the normal path still counts and locks at the limit', async () => {
    fresh({ [KEY]: JSON.stringify({ windowStart: Date.now() - 1000, used: 13 }) });
    const a = await cap.consumeGlossary('local');
    assert.equal(a.used, 14);
    assert.equal(a.allowed, true);
    const b = await cap.consumeGlossary('local');
    assert.equal(b.allowed, false);
  });
});

describe('glossary Recent list: on the shared safe store', () => {
  const KEY = recent.RECENT_TERMS_KEY;

  it('the key is the one the signup migration reads', () => {
    assert.equal(KEY, 'ape:glossaryRecent');
    assert.match(
      readFileSync(new URL('../src/features/commercial/commercialAuth.ts', import.meta.url), 'utf8'),
      /const RECENT_KEY = 'ape:glossaryRecent'/,
    );
  });

  it('an open after a FAILED read never writes a one-term list over the history', async () => {
    fresh({ [KEY]: JSON.stringify(['a', 'b', 'c']) });
    g.__GE1_FAIL__ = true;
    await Promise.race([recent.recordRecentTerm('x'), settle()]);
    await settle();
    assert.equal(AS.get(KEY), JSON.stringify(['a', 'b', 'c']), 'the stored history is untouched');
    assert.ok(!sets().includes(KEY));
    // Storage reads again → the queued open lands on the STORED list.
    g.__GE1_FAIL__ = false;
    await recent.recordRecentTerm('y');
    await settle();
    assert.deepEqual(JSON.parse(AS.get(KEY)!), ['y', 'x', 'a', 'b', 'c']);
    assert.deepEqual(recent.getRecentTerms(), ['y', 'x', 'a', 'b', 'c']);
  });

  it('dedupes and caps at 30, newest first', async () => {
    for (let i = 0; i < 40; i++) await recent.recordRecentTerm(`t${i}`);
    await recent.recordRecentTerm('t35');
    const list = recent.getRecentTerms();
    assert.equal(list.length, recent.RECENT_TERMS_CAP);
    assert.equal(list[0], 't35');
    assert.equal(list.filter((x) => x === 't35').length, 1);
  });

  it('[R2] the screen no longer hand-rolls the list', () => {
    const s = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(s, /RECENT_KEY/, 'no direct read or write of ape:glossaryRecent in the screen');
    assert.doesNotMatch(s, /setRecent\(/, 'the list is not component state any more');
    assert.match(s, /from '\.\.\/\.\.\/features\/glossary\/recentTerms'/);
    assert.match(s, /void recordRecentTerm\(id\)/);
    assert.match(s, /const recent = useRecentTerms\(\);/);
    const store = readFileSync(new URL('../src/features/glossary/recentTerms.ts', import.meta.url), 'utf8');
    assert.match(store, /from '\.\.\/storage\/localStore'/);
    assert.doesNotMatch(store, /AsyncStorage/);
  });
});
