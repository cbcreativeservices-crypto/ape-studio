/**
 * Toddler pass 2026-10-13 — Area 5 (Miking, Mixing, Mastering, Drum Tuning,
 * Tuning, Sound Systems, Production, Start Here) and the training-credit
 * hooks that landed today (f743665e).
 *
 * Run for real against an in-memory AsyncStorage and a stubbed
 * `mark_lab_complete` (same harness as trainingCompletion_20261013):
 *   1. DOUBLE COMPLETION: the same key reported / retried while its first
 *      call is still out goes to the server ONCE (was 2–4×).
 *   2. ACCOUNT SWITCH MID-BACKFILL: keys read from the departing account's
 *      stores are never recorded for the account signed into while the scan
 *      ran — and that account still gets its OWN scan.
 *   3. The backfill is no store-review "success moment".
 *   4. START OVER (PRACTICE) in Mixing: pages banked to the account
 *      (mxb_/mxa_) still read CREDITED (source pins — PagedLab is React).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string>; onGet: ((k: string) => void) | null };
const kv: Kv = { map: new Map(), onGet: null };
type Rpc = { calls: string[]; delayMs: number };
const rpc: Rpc = { calls: [], delayMs: 0 };
const review = { calls: 0 };
const g = globalThis as unknown as { __tdKv: Kv; __tdRpc: Rpc; __tdReview: typeof review; __DEV__: boolean };
g.__tdKv = kv;
g.__tdRpc = rpc;
g.__tdReview = review;
g.__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__tdKv; export default {
    getItem: async (k) => { if (s.onGet) s.onGet(k); return s.map.has(k) ? s.map.get(k) : null; },
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `export const supabase = { rpc: async (_fn, args) => {
    const r = globalThis.__tdRpc; r.calls.push(args.p_lab_key);
    if (r.delayMs) await new Promise((res) => setTimeout(res, r.delayMs));
    return { data: { ok: true }, error: null };
  } };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => { globalThis.__tdReview.calls++; return false; };`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'td-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'td-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'td-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'td-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('td-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('td-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async (n = 8) => {
  for (let i = 0; i < n; i++) await tick();
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const signal = await import('../src/features/lab/trainingSignal.ts');
const carry = await import('../src/features/lab/sessionCarry.ts');
const completion = await import('../src/features/lab/labCompletion.ts');
const tc = await import('../src/features/lab/trainingCompletion.ts');
const miking = await import('../src/screens/lab/miking/engine/progress/mikingProgress.ts');
const { PAGE_IDS } = await import('../src/screens/lab/miking/engine/model/types.ts');
signal.setTrainingSink(completion.markTrainingDone);

function wipeDevice(): void {
  for (const k of [...kv.map.keys()]) if (k.startsWith('ape:')) kv.map.delete(k);
  completion.resetLocal();
  miking.resetMikingLocal();
}
async function authEvent(identity: string, wipe: boolean): Promise<void> {
  carry.noteSessionIdentity(identity);
  if (wipe) wipeDevice();
  await carry.settleSessionCarry();
  await settle();
}
const sentTo = (key: string) => rpc.calls.filter((k) => k === key).length;

describe('double completion (toddler: FINISH twice, report + retries at sign-in)', () => {
  it('one mark_lab_complete per key while the first call is out', async () => {
    await authEvent('m1', true);
    await settle(20);
    rpc.calls.length = 0;
    rpc.delayMs = 30;
    signal.reportTrainingComplete('tr_mastering');
    signal.reportTrainingComplete('tr_mastering');
    await settle();
    // The retries a sign-in runs at the same moment (hydrate / settle / backfill).
    await Promise.all([completion.retryUnsentLabCredit(), completion.retryUnsentLabCredit()]);
    await wait(60);
    rpc.delayMs = 0;
    assert.equal(sentTo('tr_mastering'), 1);
    assert.equal(completion.isLabCreditSent('tr_mastering'), true);
  });
});

describe('account switch while the backfill scans', () => {
  it('A’s keys never land in B; B still gets its own scan', async () => {
    await authEvent('A', true);
    await settle(20);
    rpc.calls.length = 0;
    // Account A's device: a finished Miking lesson (read FIRST by the scan).
    kv.map.set('ape:miking:v1', JSON.stringify({ v: 1, lessons: { C06a: { done: [...PAGE_IDS], answers: {}, interactive: [] } } }));
    miking.resetMikingLocal();
    let second: Promise<void> | null = null;
    // A reads on; mid-scan (at the Mastering read) A signs out and B signs in.
    kv.onGet = (k) => {
      if (k !== 'ape:mastering:v1' || second) return;
      carry.noteSessionIdentity('B');
      wipeDevice();
      // B's own device data, and B's settle starting its backfill.
      kv.map.set('ape:mixing-beg:v1', JSON.stringify({ completed: [0], lastPage: 0, done: false }));
      second = tc.backfillTrainingCompletion();
    };
    const first = tc.backfillTrainingCompletion();
    await first;
    assert.ok(second, 'the switch happened mid-scan');
    await second;
    kv.onGet = null;
    await settle(20);
    assert.equal(completion.isLabDone('mk_C06a'), false, 'A’s lesson is not in B’s record');
    assert.equal(sentTo('mk_C06a'), 0, 'and was never sent as B');
    assert.equal(completion.isLabDone('mxb_mix'), true, 'B’s own scan ran');
    // B's device settles (the wipe is done) → B's credit goes.
    await carry.settleSessionCarry();
    await settle(20);
    assert.equal(sentTo('mxb_mix'), 1);
    assert.equal(sentTo('mk_C06a'), 0);
  });
});

describe('the backfill is no store-review success moment', () => {
  it('a sign-in backfill does not call noteHighValueEvent; a live completion does', async () => {
    await authEvent('C', true);
    await settle(20);
    kv.map.set('ape:tuning:v1', JSON.stringify({ completed: [0, 1], lastChapter: 1, done: true, mathView: false }));
    review.calls = 0;
    await tc.backfillTrainingCompletion();
    await settle();
    assert.equal(completion.isLabDone('tr_tuning'), true);
    assert.equal(review.calls, 0, 'backfill: quiet');
    signal.reportTrainingComplete('tr_drum_tuning');
    await settle();
    assert.equal(review.calls, 1, 'a live lab completion still counts');
  });
});

describe('lab screens (source pins — React Native screens)', () => {
  it('Mastering / Drum / Miking: NEXT between READ steps opens the next one at the top (keyed per step)', () => {
    for (const f of ['src/screens/lab/mastering/steps.tsx', 'src/screens/lab/drumtuning/steps.tsx', 'src/screens/lab/miking/engine/steps.tsx']) {
      assert.ok(read(f).includes('return host ? <Fragment key={s.key}>{host.readWrap(body)}</Fragment> :'), f);
    }
  });
  it('Miking: the Observation Sheet fields are not hidden under the iOS keyboard', () => {
    assert.match(read('src/screens/lab/miking/MikingLessonScreen.tsx'), /const readWrap = \(body: ReactNode\) => \(\s*<ScrollView [^>]*automaticallyAdjustKeyboardInsets>/);
  });
  it('Miking hub: never "0 of 8" before the record is read or when it cannot be', () => {
    const s = read('src/screens/lab/miking/MikingHubScreen.tsx');
    assert.ok(s.includes('const known = hydrated && !unreadable;'));
    assert.ok(s.includes("const count = known ? String(n) : '—';"));
    assert.ok(s.includes('{`${count} of ${PAGE_IDS.length} pages`}'));
  });
  it('Start Here: a guest START OVER lets go of the held ticks and never removes the device copy', () => {
    const s = read('src/screens/startHere/StartHereScreen.tsx');
    assert.ok(s.includes('if (noAccountRef.current || loadedAsGuestRef.current) forgetHeldPaged(START_HERE_ID);\n    else void resetPagedProgress(START_HERE_ID);'));
  });
  it('Understanding check: the pass fires once, from an effect — never inside a state updater', () => {
    const s = read('src/components/LabUnderstandingCheck.tsx');
    const choose = s.slice(s.indexOf('const choose = useCallback('), s.indexOf('// The pass fires from an EFFECT'));
    assert.ok(!choose.includes('onPassed()'), 'not in the updater');
    assert.match(s, /useEffect\(\(\) => \{\s*if \(!done \|\| fired\) return;\s*setFired\(true\);\s*onPassed\(\);\s*\}, \[done, fired, onPassed\]\);/);
  });
  it('Production stage: a return to the screen re-reads the project (never writes over newer answers)', () => {
    const s = read('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.ok(s.includes("navigation.addListener('blur'"));
    assert.ok(s.includes("navigation.addListener('focus'"));
    assert.ok(s.includes('if (!all || pendingWritesRef.current > 0 || seq !== writeSeqRef.current) return;'));
    assert.equal((s.match(/pendingWritesRef\.current\+\+;/g) ?? []).length, 2, 'both writes counted');
  });
  it('Production credit: a wholly N/A stage counts as done (as the packet and meter say), but an all-N/A plan does not', () => {
    const s = read('src/features/production/complete.ts');
    assert.ok(s.includes("return states.every((st) => st === 'complete' || st === 'na') && states.includes('complete');"));
  });
});

describe('Mixing: START OVER (PRACTICE) never shows banked credit as missing', () => {
  it('both Mixing screens pass their page keys; PagedLab reads them into the end screen / strip', () => {
    for (const [f, lab] of [['src/screens/lab/mixing/BeginningMixingLabScreen.tsx', 'beg'], ['src/screens/lab/mixing/AdvancedMixingLabScreen.tsx', 'adv']] as const) {
      const s = read(f);
      assert.ok(s.includes(`const PAGE_KEYS = PAGES.map((_, i) => mixingPageKeyAt('${lab}', i));`), f);
      assert.ok(s.includes('pageCreditKeys={PAGE_KEYS}'), f);
    }
    const p = read('src/screens/lab/kit/PagedLab.tsx');
    assert.ok(p.includes('const bankedPageKeys = useLabKeysDone(pageCreditKeys);'));
    assert.ok(p.includes('(!!pageCreditKeys[i] && bankedPageKeys.has(pageCreditKeys[i]))'));
  });
});
