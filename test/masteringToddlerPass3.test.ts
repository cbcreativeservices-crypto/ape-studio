/**
 * Mastering Lab — toddler + cat bug pass 3, the final pass (2026-10-01,
 * after pass 2 84d55652). The progress store is exercised for real (a
 * key-value stub whose reads can fail); the screen fixes are pinned by
 * source guards, the reasoning beside each fix in the source.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { data: Map<string, string>; failReads: number };
const g = globalThis as unknown as { __masteringKv3: Kv };
g.__masteringKv3 = { data: new Map(), failReads: 0 };
const STUB = `export default {
  getItem: async (k) => { const kv = globalThis.__masteringKv3; if (kv.failReads > 0) { kv.failReads--; throw new Error('transient'); } return kv.data.has(k) ? kv.data.get(k) : null; },
  setItem: async (k, v) => { globalThis.__masteringKv3.data.set(k, v); },
  removeItem: async (k) => { globalThis.__masteringKv3.data.delete(k); },
};`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: `data:text/javascript,${encodeURIComponent(STUB)}`, shortCircuit: true };
    // The store now imports the shared sign-in hand-off ledger (2026-10-01),
    // an extensionless relative import like the rest of src/.
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const progress = (await import('../src/screens/lab/mastering/masteringProgress.ts')) as Record<string, unknown> & typeof import('../src/screens/lab/mastering/masteringProgress.ts');
const { updateMasteringProgress, setMasteringSaveBlocked } = progress;
const readFailed = progress.masteringReadFailed as ((s: unknown) => boolean) | undefined;
const fromStore = progress.masteringReadFromStore as ((s: unknown) => boolean) | undefined;

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/mastering';
const KEY = 'ape:mastering:v1';
const host = () => strip(read(`${DIR}/MasteringLabScreen.tsx`));
const STORED = JSON.stringify({ modules: { what: { done: true, answers: { t1: true } }, loudness: { done: true, answers: {} }, project: { done: false, answers: {}, checks: ['c1'], qc: ['q1', 'q2'] } }, lastModule: 'loudness', lastStep: 2 });

describe('the save-block flag: a read taken while blocked is never written', () => {
  it('the store unblocking between a blocked read and its write (the tier landing, a sign-in) does not write the empty stand-in', async () => {
    const kv = g.__masteringKv3;
    kv.data.set(KEY, STORED);
    setMasteringSaveBlocked(true);
    await updateMasteringProgress((s) => {
      // The flag flips between the read and the write (render-time setter).
      setMasteringSaveBlocked(false);
      s.lastStep = 3;
    });
    assert.equal(kv.data.get(KEY), STORED, 'the blocked read\'s empty copy was written over two banked modules');
    // The next (unblocked) update reads and writes the real copy.
    const s = await updateMasteringProgress((p) => {
      p.lastStep = 1;
    });
    assert.equal(s.modules.what?.done, true);
    assert.equal(JSON.parse(kv.data.get(KEY)!).lastStep, 1);
  });
});

describe('a failed read is told apart from the learner\'s progress', () => {
  it('masteringReadFailed / masteringReadFromStore name a failed read and a blocked one', async () => {
    assert.equal(typeof readFailed, 'function', 'masteringProgress exports masteringReadFailed');
    assert.equal(typeof fromStore, 'function', 'masteringProgress exports masteringReadFromStore');
    const kv = g.__masteringKv3;
    kv.data.set(KEY, STORED);
    setMasteringSaveBlocked(false);
    kv.failReads = 1;
    const failed = await updateMasteringProgress(() => {});
    assert.equal(readFailed!(failed), true);
    assert.equal(fromStore!(failed), false);
    const ok = await updateMasteringProgress(() => {});
    assert.equal(readFailed!(ok), false);
    assert.equal(fromStore!(ok), true);
    setMasteringSaveBlocked(true);
    const blocked = await updateMasteringProgress(() => {});
    assert.equal(readFailed!(blocked), false);
    assert.equal(fromStore!(blocked), false);
    setMasteringSaveBlocked(false);
    assert.equal(kv.data.get(KEY), STORED);
  });
});

describe('host: one failed first read no longer hides credit for the whole visit', () => {
  it('a failed read is retried (a few tries) instead of landing an empty copy; the pre-load work is still held for the retry', () => {
    const h = host();
    assert.match(h, /if \(!wasBlocked && masteringReadFailed\(s\) && readRetriesRef\.current < 3\) \{\s*readRetriesRef\.current\+\+;/);
    assert.match(h, /setReadRetry\(\(r\) => r \+ 1\);/);
    assert.match(h, /\}, \[resolved, loaded, blocked, readRetry\]\);/);
    // The retry check comes BEFORE anything is marked done.
    const then = h.slice(h.indexOf('masteringReadFailed(s)'));
    assert.ok(then.indexOf('return;') < then.indexOf('loadedBlockedRef.current = wasBlocked;'));
    assert.ok(then.indexOf('return;') < then.indexOf('preAnswersRef.current = {};'));
    assert.ok(then.indexOf('return;') < then.indexOf('setLoaded(true);'));
    // The timer dies with the screen.
    assert.match(h, /if \(retryTimerRef\.current != null\) clearTimeout\(retryTimerRef\.current\);\s*retryTimerRef\.current = null;\s*\},\s*\[\],/);
  });
  it('Module 8 ticks made while the first read was in flight are written with the merged lists', () => {
    assert.match(host(), /if \(!wasBlocked && \(pre\.checks\.length \|\| pre\.qc\.length\)\) \{\s*void updateMasteringProgress\(\(st\) => carryPreLoad\(st, \{ answers: \{\}, checks, qc \}\)\);/);
  });
});

describe("host: a module open keeps Module 8's lists when its read is not the learner's progress", () => {
  it('openModule skips the project lists (and qcComplete) for a failed or blocked read', () => {
    const h = host();
    const open = h.slice(h.indexOf('const openModule = useCallback'), h.indexOf('const onAnswered = useCallback'));
    assert.match(open, /if \(projectRev !== projectRevRef\.current\) return;\s*if \(!masteringReadFromStore\(s\)\) return;\s*const p = s\.modules\.project;\s*setProject/);
  });
  it('a practice reset still empties the lists itself (a guest\'s blocked read no longer does it)', () => {
    const h = host();
    const reset = h.slice(h.indexOf('const doReset = () =>'), h.indexOf('const confirmReset'));
    assert.match(reset, /projectRevRef\.current\+\+;\s*setProject\(\{ checks: \[\], qc: \[\] \}\);\s*setQcComplete\(false\);\s*openModule\('what', 0\);/);
  });
});

describe('PRACTICE deck: a record arriving after the deck mounts', () => {
  it('until the learner touches the deck, it follows the record to the first open card', () => {
    const kit = strip(read(`${DIR}/kit.tsx`));
    assert.match(kit, /const firstOpen = scenarios\.findIndex\(\(s\) => !\(s\.id in recorded\)\);\s*useEffect\(\(\) => \{\s*if \(!touchedRef\.current && firstOpen >= 0\) setCur\(firstOpen\);\s*\}, \[firstOpen\]\);/);
    assert.match(kit, /onAnswered=\{\(ok\) => \{ touchedRef\.current = true; onAnswered\(s\.id, ok\); \}\}/);
    assert.match(kit, /label="‹ PREV CARD" onPress=\{\(\) => \{ touchedRef\.current = true;/);
    assert.match(kit, /label="NEXT CARD ›" onPress=\{\(\) => \{ touchedRef\.current = true;/);
  });
});

describe('▶ DRAW MIX: the 10 s render never runs inside the press, and a second tap is ignored', () => {
  it('useDrawProgramme marks DRAWING, renders on a timer, refuses while busy, and is cancelled on close', () => {
    const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
    const fn = hook.slice(hook.indexOf('export function useDrawProgramme'), hook.indexOf('export function useMasterPlayback'));
    assert.match(fn, /if \(busyRef\.current\) return;\s*busyRef\.current = true;\s*setDrawing\(true\);\s*timerRef\.current = setTimeout\(/);
    assert.match(fn, /programme\(\);\s*onDrawnRef\.current\(\);/);
    assert.match(fn, /if \(timerRef\.current != null\) clearTimeout\(timerRef\.current\);/);
    assert.match(fn, /if \(!drawing\) busyRef\.current = false;/);
    for (const f of ['mod4Tools.tsx', 'mod6Loudness.tsx']) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.match(s, /const draw = useDrawProgramme\(/, f);
      assert.match(s, /label: draw\.drawing \? '… DRAWING' : '▶ DRAW MIX', onPress: draw\.draw/, f);
      assert.doesNotMatch(s, /drawMix/, f);
    }
  });
});
