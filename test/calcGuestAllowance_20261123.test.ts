/**
 * The calculators' guest allowance (owner 2026-11-23, from an iPhone
 * screenshot of "Exposure & Allowable Time" opened while not signed in):
 *
 *   "in the calculator the guest user does get an allowance per week of use"
 *
 * Until then a guest read "Create a free account (or sign in) to run
 * calculations." over a green SIGN IN / CREATE ACCOUNT button and got no
 * calculation at all. Now:
 *   • a KNOWN guest (no session, tier known — the old wall's own condition)
 *     gets CALC_WEEKLY_LIMIT calculations per rolling week, counted on the
 *     DEVICE (calcUsage mode 'local', the glossary's guest rule), behind the
 *     same CALCULATE button and "# / 5" counter;
 *   • the guest path never calls calc_consume / calc_usage_status;
 *   • an UNKNOWN tier keeps "Checking…" / the not-confirmed words;
 *   • members are never metered;
 *   • once the guest's week is used up, the answer stays held with guest
 *     wording (useGuestWording) and the green sign-in button.
 *
 * Driven for real on a fake AsyncStorage (the localStoreWave2Labs harness),
 * plus the screen's source for the wiring.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__CGA_AS__ = AS;
g.__CGA_FAIL_READS__ = false;
g.__CGA_RPC_CALLS__ = [] as string[];
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'cga-stub:async-storage': `const s = globalThis.__CGA_AS__;
    export default {
      async getItem(k) {
        if (globalThis.__CGA_FAIL_READS__) throw new Error('storage read failed');
        return s.has(k) ? s.get(k) : null;
      },
      async setItem(k, v) { s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
    };`,
  // Every RPC is recorded. The server answers "used 0 of 5" so a server-mode
  // call is visible by its number, not only by the log.
  'cga-stub:supabase': `export const supabase = {
    rpc: async (fn) => {
      globalThis.__CGA_RPC_CALLS__.push(fn);
      return { data: [{ used: 0, lim: 5, window_start: '2026-11-23T00:00:00Z', allowed: true }], error: null };
    },
  };`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'cga-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'cga-stub:supabase', shortCircuit: true };
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

const calc = await import('../src/features/lab/calcUsage.ts');
const copy = await import('../src/screens/lab/calc/calcAllowanceCopy.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const SCREEN = read('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
/** The screen with its comments taken out: the comments quote the old wall. */
const CODE = SCREEN.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const KEY = 'ape:calc:usageLocal';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const rpcCalls = () => g.__CGA_RPC_CALLS__ as string[];

/** A clean device, and the module's in-memory window synced to it. */
async function fresh() {
  AS.clear();
  g.__CGA_FAIL_READS__ = false;
  await calc.getCalcStatus('local'); // lastKnown := the (empty) stored window
  (g.__CGA_RPC_CALLS__ as string[]).length = 0;
}

// ── the screen's decision, evaluated from its own source ────────────────────

/** The screen's gate lines, run for real on a given provider state. */
function gateOf(entitlement: string, resolved: boolean, tierKnown: boolean, onboardingSampling = false) {
  const line = (name: string) => {
    const m = SCREEN.match(new RegExp(`const ${name}(?:: \\w+)? = ([^\\n]+);`));
    assert.ok(m, `the screen still declares ${name}`);
    return m![1];
  };
  const body = `
    const guestMetered = ${line('guestMetered')};
    const capped = ${line('capped')};
    const tierUnconfirmed = ${line('tierUnconfirmed')};
    const tierPending = ${line('tierPending')};
    const meterMode = ${line('meterMode')};
    return { guestMetered, capped, tierUnconfirmed, tierPending, meterMode };`;
  // eslint-disable-next-line no-new-func
  return new Function('entitlement', 'resolved', 'tierKnown', 'onboardingSampling', body)(entitlement, resolved, tierKnown, onboardingSampling) as {
    guestMetered: boolean;
    capped: boolean;
    tierUnconfirmed: boolean;
    tierPending: boolean;
    meterMode: 'server' | 'local';
  };
}

describe('who is metered (owner 2026-11-23)', () => {
  it('a KNOWN guest is capped on the device, and not walled', () => {
    const g1 = gateOf('anonymous', true, true);
    assert.equal(g1.capped, true, 'a known guest gets the CALCULATE button and the counter');
    assert.equal(g1.guestMetered, true);
    assert.equal(g1.meterMode, 'local', 'a guest is counted on the device');
    assert.equal(g1.tierPending, false, 'a known guest is not held at "Checking…"');
    // The wall is gone: no sentence, no flag.
    assert.doesNotMatch(CODE, /to run calculations/);
    assert.doesNotMatch(CODE, /Create a free account \(or sign in\)/);
    assert.doesNotMatch(CODE, /\bmustSignIn\b/);
  });

  it('an UNKNOWN tier is neither metered as a guest nor walled: it keeps "Checking…" / the not-confirmed words', () => {
    for (const [resolved, tierKnown] of [
      [false, false],
      [true, false],
    ] as const) {
      const s = gateOf('anonymous', resolved, tierKnown);
      assert.equal(s.guestMetered, false, `resolved=${resolved} tierKnown=${tierKnown}: never treat an UNKNOWN session as a guest`);
      assert.equal(s.capped, false);
      assert.equal(s.tierPending, true, 'the answer is held while the tier is unknown');
    }
    const pending = SCREEN.slice(SCREEN.indexOf(') : tierPending ? ('), SCREEN.indexOf(') : capped && !resultUnlocked ? ('));
    assert.ok(pending.includes('Couldn’t confirm your membership on this device. Check your connection and reopen the app.'));
    assert.match(pending, /'Checking your account…'/);
  });

  it('free and lapsed accounts keep the server meter; onboarding sampling keeps its bypass', () => {
    for (const e of ['free', 'lapsed']) {
      const s = gateOf(e, true, true);
      assert.equal(s.capped, true, e);
      assert.equal(s.meterMode, 'server', `${e} counts on the server`);
    }
    for (const e of ['anonymous', 'free', 'lapsed']) {
      assert.equal(gateOf(e, true, true, true).capped, false, `${e}: the onboarding demo is never metered`);
    }
  });

  it('members are untouched: never capped, never counted, never sold', () => {
    for (const [resolved, tierKnown] of [
      [true, true],
      [true, false],
    ] as const) {
      const s = gateOf('academy', resolved, tierKnown);
      assert.equal(s.capped, false);
      assert.equal(s.guestMetered, false);
      assert.equal(s.tierPending, false);
    }
    assert.match(SCREEN, /const resultUnlocked = !capped \|\| consumedSigs\.has\(inputSig\);/);
    assert.match(SCREEN, /if \(!capped\) return;\s*if \(meterSeenRef\.current !== meterMode\)/, 'no status read for an uncapped reader');
    // No membership sentence where an upsell is not allowed.
    const noSell = { guest: false, upsell: false };
    for (const s of [copy.calcLimitReachedBody(5, noSell), copy.calcLastOneBody(5, noSell), copy.calcHalfwayBody(3, 5, noSell)]) {
      assert.doesNotMatch(s, /membership/i, s);
    }
    assert.equal(copy.calcAllowanceAction(noSell), null);
  });
});

// ── the device meter ────────────────────────────────────────────────────────

describe('calcUsage mode local — a guest counts on the device', () => {
  it('the guest path never calls the RPCs (and never waits out their deadline)', async () => {
    await fresh();
    const t0 = Date.now();
    await calc.getCalcStatus('local');
    await calc.consumeCalc('local');
    await calc.getCalcStatus('local');
    assert.deepEqual(rpcCalls(), [], 'no calc_consume / calc_usage_status for a guest');
    assert.ok(Date.now() - t0 < 2000, 'no 8 s deadline waited out');
    // …while an account still asks the server (the stub answers "0 of 5").
    const acct = await calc.getCalcStatus();
    assert.deepEqual(rpcCalls(), ['calc_usage_status']);
    assert.equal(acct.unavailable, false);
  });

  it('five local credits, then a refusal that spends nothing', async () => {
    await fresh();
    for (let i = 1; i <= calc.CALC_WEEKLY_LIMIT; i++) {
      const u = await calc.consumeCalc('local');
      assert.equal(u.allowed, true, `calculation ${i}`);
      assert.equal(u.used, i);
      assert.equal(u.limit, 5);
      assert.equal(u.unavailable, false, 'the device IS the guest meter, not a provisional count');
    }
    const over = await calc.consumeCalc('local');
    assert.equal(over.allowed, false, 'the sixth is refused');
    assert.equal(over.used, 5);
    assert.equal((JSON.parse(AS.get(KEY) ?? 'null') as { used: number }).used, 5, 'the refusal wrote nothing');
    const st = await calc.getCalcStatus('local');
    assert.equal(st.allowed, false);
    assert.equal(st.used, 5, 'the counter reads 5 / 5');
    assert.deepEqual(rpcCalls(), []);
  });

  it('the window rolls after seven days', async () => {
    await fresh();
    AS.set(KEY, JSON.stringify({ windowStart: Date.now() - WEEK - 1, used: 5 }));
    const st = await calc.getCalcStatus('local');
    assert.equal(st.used, 0, 'a week-old window reads as a fresh week');
    assert.equal(st.allowed, true);
    const u = await calc.consumeCalc('local');
    assert.equal(u.allowed, true);
    assert.equal(u.used, 1);
    const stored = JSON.parse(AS.get(KEY) ?? 'null') as { windowStart: number; used: number };
    assert.equal(stored.used, 1);
    assert.ok(Date.now() - stored.windowStart < 5000, 'the new week starts now');
    // …and six days in, it does NOT roll.
    AS.set(KEY, JSON.stringify({ windowStart: Date.now() - WEEK + 24 * 60 * 60 * 1000, used: 5 }));
    assert.equal((await calc.consumeCalc('local')).allowed, false);
  });

  it('an unreadable device read is never overwritten, and the run stays capped', async () => {
    await fresh();
    const start = Date.now() - 60_000;
    AS.set(KEY, JSON.stringify({ windowStart: start, used: 4 }));
    await calc.getCalcStatus('local'); // this run now knows 4 used
    g.__CGA_FAIL_READS__ = true;
    const u = await calc.consumeCalc('local');
    assert.equal(u.allowed, true, 'the fifth goes through, from what this run knew');
    assert.equal(u.used, 5);
    assert.equal(u.unavailable, true, 'an unreadable device count is flagged provisional');
    assert.deepEqual(JSON.parse(AS.get(KEY) ?? 'null'), { windowStart: start, used: 4 }, 'the stored week was written over');
    assert.equal((await calc.consumeCalc('local')).allowed, false, 'an unreadable device is still capped');
    g.__CGA_FAIL_READS__ = false;
    assert.deepEqual(rpcCalls(), []);
  });

  it('two quick taps both count (the read-modify-write is serialized)', async () => {
    await fresh();
    await Promise.all([calc.consumeCalc('local'), calc.consumeCalc('local')]);
    assert.equal((JSON.parse(AS.get(KEY) ?? 'null') as { used: number }).used, 2);
  });

  it('the key stays on both KEEP lists, so signing in or out hands out no fresh week', () => {
    const src = read('src/features/account/clearLocalAccountData.ts');
    const keep = src.slice(src.indexOf('const GUEST_KEEP'), src.indexOf(']);', src.indexOf('const GUEST_KEEP')));
    assert.match(keep, /'ape:calc:usageLocal',/);
    assert.equal((src.match(/'ape:calc:usageLocal',/g) ?? []).length, 2, 'the account wipe KEEP list and the guest wipe KEEP list');
    assert.match(read('src/features/lab/calcUsage.ts'), /const LOCAL_KEY = 'ape:calc:usageLocal';/);
  });
});

// ── the screen's wiring ─────────────────────────────────────────────────────

describe('the workspace screen (one credit per new result, for a guest too)', () => {
  it('the guest meter is passed to both calls', () => {
    assert.match(SCREEN, /getCalcStatus\(meterMode\)\.then/);
    assert.match(SCREEN, /u = await consumeCalc\(meterMode\);/);
    assert.match(SCREEN, /const meterMode: CalcMeterMode = guestMetered \? 'local' : 'server';/);
  });

  it('the same input set never spends twice; a double tap spends once; errors and refusals cost nothing', () => {
    const fnBody = SCREEN.slice(SCREEN.indexOf('const runCappedCalc = async () => {'), SCREEN.indexOf('u = await consumeCalc(meterMode);'));
    assert.match(fnBody, /if \(!values \|\| !costsACalculation\(\{ computeError, refused \}\) \|\| consuming \|\| consumingRef\.current \|\| consumedSigs\.has\(inputSig\)\) return;/);
    assert.match(fnBody, /consumingRef\.current = true;/);
    assert.match(SCREEN, /setConsumedSigs\(\(s\) => new Set\(s\)\.add\(inputSig\)\);/);
    const err = SCREEN.indexOf(') : computeError ? (');
    const refusal = SCREEN.indexOf(') : refused && (capped || tierPending) ? (');
    const gate = SCREEN.indexOf(') : capped && !resultUnlocked ? (');
    assert.ok(err > 0 && refusal > err && gate > refusal, 'errors, then refusals, before any credit-spending CALCULATE');
    assert.match(SCREEN, /capped && usage \? `\$\{usage\.used\} \/ \$\{usage\.limit\} free calculations this week` : null/);
  });

  it('the halfway and last-one notices reach a guest, in guest words', () => {
    assert.match(SCREEN, /notify\('Heads up — weekly limit', calcHalfwayBody\(u\.used, u\.limit, allowanceReader\)\);/);
    assert.match(SCREEN, /limitDialog\(calcLastOneBody\(u\.limit, allowanceReader\), 'OK'\);/);
    assert.match(SCREEN, /limitDialog\(calcLimitReachedBody\(u\.limit, allowanceReader\), 'Not now'\);\s*return; \/\/ do NOT reveal/);
    assert.match(SCREEN, /if \(action === 'signIn'\) confirmDialog\('Weekly limit reached', body, 'Sign in', signIn, \{ cancelText \}\);/);
    assert.match(SCREEN, /const signIn = afterDialogCloses\(\(\) => [^\n]*\.navigate\('Auth'\)\);/);
  });

  it('the used-up guest state shows the sign-in button and decides its words with useGuestWording', () => {
    assert.match(SCREEN, /const guestWording = useGuestWording\(\)\.guest;/);
    assert.match(SCREEN, /const upsell = useUpsellAllowed\(\);/);
    assert.match(SCREEN, /const allowanceReader = useMemo\(\(\) => \(\{ guest: guestWording && guestMetered, upsell \}\)/);
    assert.match(SCREEN, /const guestUsedUp = allowanceReader\.guest && !!usage && usage\.used >= usage\.limit;/);
    const gate = SCREEN.slice(SCREEN.indexOf(') : capped && !resultUnlocked ? ('));
    const branch = gate.slice(gate.indexOf('{guestUsedUp ? ('), gate.indexOf('Tap CALCULATE to reveal the answer'));
    assert.ok(branch.length > 0, 'the used-up branch sits inside the held-answer state');
    assert.match(branch, /calcGuestUsedUpPanel\(usage\?\.limit \?\? CALC_WEEKLY_LIMIT\)/);
    assert.match(branch, /styles\.signInBtn/);
    assert.match(branch, /\.navigate\('Auth'\)/);
    assert.match(branch, /SIGN IN \/ CREATE ACCOUNT/);
    // …and nowhere BEFORE the first calculation.
    assert.equal((CODE.match(/SIGN IN \/ CREATE ACCOUNT/g) ?? []).length, 1);
  });
});

// ── the words ───────────────────────────────────────────────────────────────

describe('the allowance words', () => {
  const free = { guest: false, upsell: true };
  const guest = { guest: true, upsell: true };

  it('a free account reads exactly what it read before', () => {
    assert.equal(copy.calcLimitReachedBody(5, free), 'You’ve used all 5 free calculations for this week. They reset one week after your first one. Academy membership removes the limit.');
    assert.equal(copy.calcLastOneBody(5, free), 'That was your last free calculation this week (5 of 5). It resets one week after your first one. Academy membership removes the limit.');
    assert.equal(copy.calcHalfwayBody(3, 5, free), 'That’s 3 of 5 free calculations this week. After 5 you’ll wait for the weekly reset, or Academy membership removes the limit.');
    assert.equal(copy.calcAllowanceAction(free), 'membership');
  });

  it('a guest reads the reset and the sign-in line, and no promise of more calculations', () => {
    assert.equal(
      copy.calcLastOneBody(5, guest),
      'That was your last free calculation this week (5 of 5). It resets one week after your first one. You can also sign in or create a free account. Academy membership removes the limit.',
    );
    assert.equal(
      copy.calcLimitReachedBody(5, guest),
      'You’ve used all 5 free calculations for this week. They reset one week after your first one. You can also sign in or create a free account. Academy membership removes the limit.',
    );
    assert.equal(
      copy.calcHalfwayBody(3, 5, guest),
      'That’s 3 of 5 free calculations this week. After 5 you’ll wait for the weekly reset. You can also sign in or create a free account. Academy membership removes the limit.',
    );
    assert.equal(
      copy.calcGuestUsedUpPanel(5),
      'You’ve used all 5 free calculations for this week. They reset one week after your first one. You can also sign in or create a free account.',
    );
    assert.equal(copy.calcAllowanceAction(guest), 'signIn');
    for (const s of [copy.calcLastOneBody(5, guest), copy.calcLimitReachedBody(5, guest), copy.calcHalfwayBody(3, 5, guest), copy.calcGuestUsedUpPanel(5)]) {
      assert.doesNotMatch(s, /five more|more calculations|another \d|adds? \d|gives? you \d/i, s);
    }
  });

  it('no sentence still tells a guest a calculation needs an account', () => {
    assert.equal(read('src/lib/copy.ts').match(/calcFreeAllowance: '([^']+)'/)?.[1], 'Free use also includes 5 calculations a week.');
    assert.match(read('src/features/help/helpContent.ts'), /Free use has weekly limits, with or without an account — 5 calculations and 14 glossary definitions a week/);
    assert.match(read('src/screens/lab/calc/CalcLabScreen.tsx'), /free use includes \$\{CALC_WEEKLY_LIMIT\} calculations a week, with or without an account, and membership removes the limit\./);
    assert.doesNotMatch(read('src/screens/lab/calc/calcScreenGuides.ts'), /On this account, CALCULATE/);
    // Calculator WORKFLOWS stay Academy-only.
    assert.match(read('src/screens/lab/calc/CalcLabScreen.tsx'), /'Workflows are part of Academy membership'/);
    assert.match(read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), /WORKFLOWS ARE AN ACADEMY FEATURE/);
  });
});
