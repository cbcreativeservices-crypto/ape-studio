/**
 * Wave 2 of the shared safe store (pattern catalog 2026-10-02, closer A2) —
 * the lab records and lab preferences:
 *
 *   • features/soundsystems/progress.ts → createLocalStore. A read that THREW
 *     used to start the record empty and mark it hydrated, so the next solved
 *     fault saved a one-item record over every fault, capstone and exercise
 *     (P1); a read in flight across the account wipe put the departing
 *     learner's record back, and the next mark saved it to the next account
 *     (P3).
 *   • features/lab/calcUsage.ts (in place). A read that threw read as "0
 *     used" and the next offline calculation wrote `{ used: 1 }` over the
 *     stored week (P1: a reset limit); a run whose storage could not be read
 *     was never capped; two quick offline calculations both read the same
 *     count (an unserialized read-modify-write).
 *   • features/lab/amplitudeOrientation.ts (in place). A read in flight when
 *     the learner replayed the orientation landed after it and marked it
 *     completed again (P3).
 *   • screens/lab/drumtuning/drumProgress.ts (in place). An update tapped
 *     under the departing account read that account's copy before the sweep
 *     and saved it back after it (P3).
 *   • the screens/lab step stores (Cable / Foundations / Mic Selection), the
 *     Cymatics experiment ticks and the Mixing priorities → createLocalStore;
 *     the Mixing focal point and RackUnit's "hide the display" (in place).
 *     React Native screens — receipts by source.
 *
 * R2: every behavioural test below was run against copies of the files
 * before this change and FAILED (the report records it). Driven for real on a
 * fake AsyncStorage whose reads can THROW or be HELD mid-flight.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__W2L_AS__ = AS;
g.__W2L_FAIL_READS__ = false;
g.__W2L_HOLD__ = null;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'w2l-stub:async-storage': `const s = globalThis.__W2L_AS__;
    export default {
      async getItem(k) {
        // Reads NOW, answers once the hold (if any) resolves — a read already
        // in flight when the wipe lands, as on a real device.
        if (globalThis.__W2L_FAIL_READS__) throw new Error('storage read failed');
        const v = s.has(k) ? s.get(k) : null;
        const h = globalThis.__W2L_HOLD__; if (h) await h;
        return v;
      },
      async setItem(k, v) { s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
      async multiRemove(ks) { for (const k of ks) s.delete(k); },
      async getAllKeys() { return [...s.keys()]; },
    };`,
  // The calculator meter's server is down: every test here is the device window.
  'w2l-stub:supabase': `export const supabase = {
    rpc: async () => ({ data: null, error: { message: 'offline' } }),
    auth: { async getSession() { return { data: { session: null } }; } },
  };`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'w2l-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'w2l-stub:supabase', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url in STUBS) return { format: 'module', shortCircuit: true, source: STUBS[url] };
    return nextLoad(url, context);
  },
});

const ss = await import('../src/features/soundsystems/progress.ts');
const calc = await import('../src/features/lab/calcUsage.ts');
const drum = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function holdReads(): () => void {
  let release!: () => void;
  g.__W2L_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    g.__W2L_HOLD__ = null;
    release();
  };
}
function fresh() {
  AS.clear();
  g.__W2L_FAIL_READS__ = false;
  g.__W2L_HOLD__ = null;
  ss.setSoundSystemsSaveBlocked(false);
  ss.resetLocal();
  drum.setDrumSaveBlocked(false);
}
const json = (k: string) => JSON.parse(AS.get(k) ?? 'null') as Record<string, unknown> | null;

// ── Sound Systems Lab record ────────────────────────────────────────────────

const SSK = 'ape:soundsystems:v1';
const ssRecord = (faults: string[], capstones: string[]) => JSON.stringify({ faults, forward: [], capstones, route: [], operate: [] });

describe('soundsystems/progress — on the shared safe store', () => {
  it('a read in flight across the account wipe lands nowhere (P3)', async () => {
    // NOT fresh(): the boot read is the one that races the wipe, so this runs
    // before anything has read the record in this process.
    AS.clear();
    AS.set(SSK, ssRecord(['departing'], ['departing-cap']));
    const release = holdReads();
    void ss.resetSoundSystemsLists(['operate']); // starts the read
    await settle();
    // The wipe: the sweep, then the stores' reset.
    AS.delete(SSK);
    ss.resetLocal();
    release();
    await settle();
    assert.equal(AS.get(SSK), undefined, "the departing learner's record was written back after the wipe");
    ss.markRouteDone('r1');
    await settle();
    assert.deepEqual(ss.getSoundSystemsProgress().faults, []);
    assert.deepEqual(json(SSK)?.route, ['r1']);
    assert.deepEqual(json(SSK)?.faults, [], "the next account received the departing learner's faults");
  });

  it('a read that THREW is never saved over; the mark lands on the stored record once a read succeeds (P1)', async () => {
    fresh();
    AS.set(SSK, ssRecord(['f0'], ['c0']));
    g.__W2L_FAIL_READS__ = true;
    ss.markFaultSolved('f1', false);
    await settle();
    assert.deepEqual(json(SSK)?.faults, ['f0'], 'a one-item record was saved over every stored fault');
    assert.deepEqual(json(SSK)?.capstones, ['c0']);
    g.__W2L_FAIL_READS__ = false;
    ss.markCapstonePassed('c1');
    await settle();
    assert.deepEqual(json(SSK)?.faults, ['f0', 'f1']);
    assert.deepEqual(json(SSK)?.capstones, ['c0', 'c1']);
  });

  it('a guest still writes nothing, sees their session, and a hub reset still clears (behaviour kept)', async () => {
    fresh();
    AS.set(SSK, ssRecord(['f0'], []));
    ss.setSoundSystemsSaveBlocked(true);
    ss.markOperateDone('o1');
    await settle();
    assert.deepEqual(ss.getSoundSystemsProgress().operate, ['o1']);
    assert.deepEqual(ss.getSoundSystemsProgress().faults, ['f0']);
    assert.deepEqual(json(SSK)?.operate, []);
    ss.setSoundSystemsSaveBlocked(false);
    await ss.resetSoundSystemsProgress();
    assert.equal(AS.get(SSK), undefined);
    assert.deepEqual(ss.getSoundSystemsProgress().operate, []);
  });
});

// ── the offline calculator meter ────────────────────────────────────────────

const CK = 'ape:calc:usageLocal';

describe('calcUsage — a failed read is never "0 used"', () => {
  it('an unreadable device window is never written over (the limit is not reset)', async () => {
    fresh();
    const start = Date.now() - 60_000;
    AS.set(CK, JSON.stringify({ windowStart: start, used: 4 }));
    g.__W2L_FAIL_READS__ = true;
    const u = await calc.consumeCalc();
    assert.equal(u.unavailable, true);
    assert.equal(u.allowed, true, 'calculators never break (fail-open by design)');
    assert.deepEqual(JSON.parse(AS.get(CK) ?? 'null'), { windowStart: start, used: 4 }, 'the stored week was reset to one use');
    g.__W2L_FAIL_READS__ = false;
    assert.equal((await calc.consumeCalc()).used, 5, 'the stored count takes over again');
    assert.equal((await calc.consumeCalc()).allowed, false);
  });

  it('a run whose storage cannot be read is still capped', async () => {
    fresh();
    await calc.getCalcStatus(); // a successful read: nothing stored
    g.__W2L_FAIL_READS__ = true;
    for (let i = 1; i <= calc.CALC_WEEKLY_LIMIT; i++) {
      assert.equal((await calc.consumeCalc()).allowed, true, `calculation ${i}`);
    }
    const over = await calc.consumeCalc();
    assert.equal(over.allowed, false, 'an unreadable device window gave unlimited offline calculations');
    assert.equal((await calc.getCalcStatus()).used, calc.CALC_WEEKLY_LIMIT, 'the counter must not read 0 while unreadable');
    assert.equal(AS.get(CK), undefined, 'nothing written from an unreadable window');
  });

  it('two quick offline calculations both count', async () => {
    fresh();
    await calc.getCalcStatus();
    await Promise.all([calc.consumeCalc(), calc.consumeCalc()]);
    assert.equal((JSON.parse(AS.get(CK) ?? 'null') as { used: number }).used, 2, 'both read the same count and wrote the same next value');
  });
});

// ── the amplitude orientation flag ──────────────────────────────────────────

describe('amplitudeOrientation — the replay is not undone by a late read', () => {
  it('a read in flight when the learner replays lands nowhere (P3)', async () => {
    fresh();
    AS.set('ape:intro:amplitudeOrientation', '1');
    const release = holdReads();
    // The import-time read starts now and is held.
    const amp = await import('../src/features/lab/amplitudeOrientation.ts');
    await settle();
    amp.resetAmplitudeOrientation(); // Settings → "Reset onboarding hints"
    release();
    await settle();
    assert.equal(amp.hasCompletedAmplitudeOrientation(), false, 'the replay was undone by the read that started before it');
    amp.markAmplitudeOrientationComplete();
    await settle();
    assert.equal(amp.hasCompletedAmplitudeOrientation(), true);
    assert.equal(AS.get('ape:intro:amplitudeOrientation'), '1');
  });
});

// ── the Drum Tuning Lab record ──────────────────────────────────────────────

const DK = 'ape:drumtuning:v1';

describe('drumProgress — a generation fence across the account wipe', () => {
  it("an update tapped under the departing account never writes that account's copy back after the wipe (P3)", async () => {
    fresh();
    AS.set(DK, JSON.stringify({ modules: {}, notes: [], lastStep: 2 }));
    const release = holdReads();
    const p = drum.updateDrumProgress((s) => {
      s.lastStep = 5;
    });
    await settle();
    // The wipe: the sweep, then every registered store's reset.
    AS.delete(DK);
    registry.resetRegisteredLocalStores();
    release();
    await p;
    await settle();
    assert.equal(AS.get(DK), undefined, "the departing account's drum record was written back after the wipe");
  });

  it('a failed read is still never written over, and a plain update still saves (behaviour kept)', async () => {
    fresh();
    AS.set(DK, JSON.stringify({ modules: {}, notes: [], lastStep: 2 }));
    g.__W2L_FAIL_READS__ = true;
    await drum.updateDrumProgress((s) => {
      s.lastStep = 7;
    });
    assert.equal(json(DK)?.lastStep, 2);
    g.__W2L_FAIL_READS__ = false;
    await drum.updateDrumProgress((s) => {
      s.lastStep = 7;
    });
    assert.equal(json(DK)?.lastStep, 7);
  });
});

// ── the screens (React Native — receipts by source) ─────────────────────────

describe('screens/lab — the storage parts', () => {
  for (const [file, len] of [
    ['src/screens/lab/cable/CableLabScreen.tsx', 'CABLE_LESSONS.length'],
    ['src/screens/lab/foundations/FoundationsCourseScreen.tsx', 'STEPS.length'],
    ['src/screens/lab/micselect/MicSelectLabScreen.tsx', 'STEPS.length'],
  ] as const) {
    it(`${file.split('/').pop()}: the resume point is on the shared safe store; a failed read restores and writes nothing`, () => {
      const s = read(file);
      assert.doesNotMatch(s, /AsyncStorage/);
      assert.match(s, /const stepStore = createLocalStore<number \| null>\(\{\s*key: STEP_KEY,/);
      assert.match(s, /serialize: \(n\) => \(n == null \? null : String\(n\)\),/, 'stored as the bare number, as before');
      assert.match(s, /void stepStore\.hydrate\(\)\.then\(/);
      assert.match(s, /!stepStore\.isHydrated\(\)\) return;/, 'a failed read must not restore');
      assert.match(s, new RegExp(`n != null && n > 0 && n < ${len.replace('.', '\\.')}`));
      assert.match(s, /if \(!noAccountRef\.current\) void stepStore\.set\(n\);/, 'guests never persist');
    });
  }

  it('Cymatics ticks: on the shared safe store; a tick decides from what is seen and lands on the hydrated series', () => {
    const s = read('src/screens/lab/cymatics/ExperimentWell.tsx');
    assert.doesNotMatch(s, /AsyncStorage/);
    assert.match(s, /const ticksStore = createLocalStore<HeldTicks>\(\{\s*key: TICKS_KEY,/);
    assert.match(s, /throw new Error\('not a tick series'\)/, 'a damaged blob is set aside, not trusted');
    assert.match(s, /const on = !done\.includes\(i\);\s*void ticksStore\.mutate\(\(a\) => \(\{ \.\.\.a, \[experiment\.id\]: withTick\(a\[experiment\.id\] \?\? \[\], i, on\) \}\)\);/);
    assert.match(s, /holdSessionWork<HeldTicks>\(CARRY_KEY, \(prev\) => withHeldTick\(prev, experiment\.id, i, on\), \{ guestOnly: true \}\);/, 'the guest carry is kept');
    // 2026-10-04 (smallFixes): what the ledger holds when the writer runs.
    assert.match(s, /registerSessionCarry<HeldTicks>\(CARRY_KEY, \(held\) => ticksStore\.mutate\(\(all\) => mergeHeldTicks\(all, peekSessionWork<HeldTicks>\(CARRY_KEY\) \?\? held\)\)\);/);
  });

  it('Mixing: the priorities are an edit of the STORED list; the focal point re-reads after a failed read', () => {
    const s = read('src/screens/lab/mixing/kit.tsx');
    assert.doesNotMatch(s, /AsyncStorage\.(getItem|setItem)\(PRIORITIES_KEY/);
    assert.match(s, /const add = !prioritiesStore\.get\(\)\.includes\(id\);\s*void prioritiesStore\.mutate\(\(list\) => togglePriority\(list, id, add\)\);/);
    assert.match(s, /prioritiesStore\.reset\(\);/, 'the wipe is a new generation');
    assert.match(s, /\.catch\(\(\) => \{\s*focalUnreadable = true;\s*\}\);/);
    assert.match(s, /if \(focalUnreadable && !focalTouched\) readFocal\(\);/);
  });

  it('RackUnit: a toggle made while the read was out is not undone by it', () => {
    const s = read('src/screens/lab/rack/RackUnit.tsx');
    const load = s.slice(s.indexOf('AsyncStorage.getItem(STAGE_COLLAPSED_KEY)'), s.indexOf('const toggleStage'));
    assert.match(load, /\.then\(\(v\) => \{[\s\S]*?if \(stageCollapsedCache != null\) return;\s*stageCollapsedCache = v === '1';/);
  });

  it('every lab store that carried guest work still does (sessionCarry)', () => {
    const p = read('src/features/soundsystems/progress.ts');
    assert.match(p, /holdSessionWork<Partial<SoundSystemsProgress>>\(CARRY_KEY, \(prev\) => withHeldItem\(prev, list, id\)\);/);
    assert.match(p, /registerSessionCarry<Partial<SoundSystemsProgress>>\(CARRY_KEY, \(h\) => store\.mutate\(\(s\) => mergeSoundSystemsProgress\(s, h\)\)\);/);
    const d = read('src/screens/lab/drumtuning/drumProgress.ts');
    assert.match(d, /if \(blocked\) holdSessionWork<DrumProgressState>\(CARRY_KEY,/);
    assert.match(d, /registerSessionCarry<DrumProgressState>\(CARRY_KEY,/);
  });
});
