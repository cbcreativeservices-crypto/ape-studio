/**
 * Fresh-install update audit (owner handoff "PATA_Claude_Code_OTA_Startup_Handoff", 2026-11-27).
 *
 * 1. The background OTA reload must never restart a quiz, an exam or a purchase in
 *    progress (the reload hold, autoUpdate.ts) — skipped visits keep the update for a later free
 *    background visit or the next cold launch.
 * 2. One low-noise launch diagnostic: embedded vs downloaded vs emergency, and the
 *    bundle's age — enum-shaped props only.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { watchForPendingUpdate, launchEventProps } = await import('../src/features/updates/autoUpdate.ts');
const hold = await import('../src/features/updates/autoUpdate.ts');
const { sanitizeProps } = await import('../src/features/telemetry/scrub.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

function rig(background = false) {
  let fire: (() => void) | null = null;
  let bgFire: (() => void) | null = null;
  let bg = background;
  let t = 0;
  const calls = { reload: 0, bgUnsub: 0 };
  const outcomes: string[] = [];
  const stop = watchForPendingUpdate({
    isEnabled: true,
    pendingNow: () => false,
    onPending: (cb) => { fire = cb; return () => { fire = null; }; },
    isBackground: () => bg,
    onBackground: (cb) => { bgFire = cb; return () => { calls.bgUnsub++; bgFire = null; }; },
    settle: (cb) => cb(),
    reload: async () => { calls.reload++; },
    now: () => t,
    isHeld: hold.isUpdateReloadHeld,
    onOutcome: (o) => outcomes.push(o),
  });
  return {
    calls,
    outcomes,
    stop,
    advance: (ms: number) => { t += ms; },
    found: () => fire?.(),
    goBackground: () => { bg = true; bgFire?.(); },
    comeBack: () => { bg = false; },
  };
}

describe('background OTA reload never restarts a quiz, exam or purchase', () => {
  beforeEach(() => hold.clearUpdateReloadHoldsForTest());

  it('skips a background visit while a quiz holds, and reloads on the next free one', () => {
    const r = rig();
    r.found();
    const release = hold.holdUpdateReload('quiz');
    r.goBackground();
    assert.equal(r.calls.reload, 0, 'the quiz attempt survives leaving the app');
    assert.deepEqual(r.outcomes, ['none', 'waiting', 'held']);
    r.comeBack();
    release();
    r.goBackground();
    assert.equal(r.calls.reload, 1);
    assert.equal(r.outcomes.at(-1), 'reloaded');
  });

  it('a find that lands while in the background during a hold waits for a later visit', () => {
    const r = rig(true);
    const release = hold.holdUpdateReload('exam');
    r.found();
    assert.equal(r.calls.reload, 0);
    r.comeBack();
    release();
    r.goBackground();
    assert.equal(r.calls.reload, 1);
  });

  it('a purchase blocks the reload for the rest of the run, however many visits follow', () => {
    const r = rig();
    r.found();
    hold.blockUpdateReloadForSession('purchase');
    for (let i = 0; i < 3; i++) {
      r.goBackground();
      r.comeBack();
    }
    assert.equal(r.calls.reload, 0);
    assert.equal(r.outcomes.filter((o) => o === 'held').length, 1, "'held' is reported once, not per visit");
  });

  it('released holds leave nothing behind; releasing twice is harmless', () => {
    const a = hold.holdUpdateReload('quiz');
    const b = hold.holdUpdateReload('exam');
    assert.equal(hold.isUpdateReloadHeld(), true);
    a();
    a();
    assert.equal(hold.isUpdateReloadHeld(), true, 'the exam still holds');
    b();
    assert.equal(hold.isUpdateReloadHeld(), false);
  });

  it('without any hold the old behaviour is unchanged: the next background visit reloads once', () => {
    const r = rig();
    r.found();
    r.advance(5 * 60_000);
    r.goBackground();
    r.goBackground();
    assert.equal(r.calls.reload, 1);
  });

  it('the wiring: quiz and exam hold while an attempt is loaded; buy and restore block the run; the watcher reads the hold', () => {
    for (const f of ['src/screens/quiz/QuizScreen.tsx', 'src/screens/exam/FinalExamScreen.tsx']) {
      assert.match(read(f), /if \(!payload\) return;\s*return holdUpdateReload\('(quiz|exam)'\);/, f);
    }
    const p = read('src/features/commercial/purchase.ts');
    assert.match(p, /export async function buyPlan[\s\S]{0,600}blockUpdateReloadForSession\('purchase'\)[\s\S]{0,900}requestPurchase/);
    assert.match(p, /export async function restorePurchases[\s\S]{0,200}blockUpdateReloadForSession\('restore'\)/);
    assert.match(read('src/features/updates/startAutoUpdate.ts'), /isHeld: isUpdateReloadHeld,/);
  });

  it('⛔ still never checks or fetches by itself (the crash class of 2026-09-19)', () => {
    const src = read('src/features/updates/startAutoUpdate.ts');
    assert.doesNotMatch(src, /checkForUpdateAsync\s*\(|fetchUpdateAsync\s*\(/);
  });
});

describe('the once-per-launch diagnostic', () => {
  const now = Date.UTC(2026, 10, 27, 12);

  it('says which bundle runs and how old it is, in props the telemetry scrubber keeps whole', () => {
    const props = launchEventProps({
      isEmbedded: false,
      isEmergency: false,
      channel: 'production',
      createdAt: new Date(Date.UTC(2026, 10, 22, 23, 35)),
      nowMs: now,
    });
    assert.deepEqual(props, { embedded: false, emergency: false, channel: 'production', bundle_age_days: 4 });
    assert.deepEqual(sanitizeProps(props), props, 'nothing is dropped by the whitelist');
  });

  it('a missing date or channel is reported as missing, never guessed', () => {
    const props = launchEventProps({ isEmbedded: true, isEmergency: true, channel: null, createdAt: null, nowMs: now });
    assert.deepEqual(props, { embedded: true, emergency: true, channel: 'none' });
  });

  it('carries no update id and no device identifier', () => {
    const props = launchEventProps({ isEmbedded: false, isEmergency: false, channel: 'production', createdAt: new Date(now), nowMs: now });
    assert.deepEqual(Object.keys(props).sort(), ['bundle_age_days', 'channel', 'embedded', 'emergency']);
  });
});
