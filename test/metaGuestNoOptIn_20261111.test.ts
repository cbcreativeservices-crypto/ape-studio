/**
 * A guest can never opt in to Meta (owner 2026-11-11).
 *
 * Before: the Settings "Ad measurement" row showed wherever the Meta gate was
 * open, whatever the tier, and a known guest who switched it on was asked and,
 * on a yes, Meta ran for that launch. Now:
 *   • the row shows only for a SIGNED-IN tier (useTier(): 'free' | 'member'),
 *     so a known guest never sees it and an unknown session does not see it yet;
 *   • the engine asks nothing for a known guest, even through offerConsent,
 *     and a yes that lands after the session became a known guest is not kept;
 *   • a stored yes never starts Meta for a known guest;
 *   • an UNKNOWN session is not a guest: it is asked if Settings asks, but
 *     nothing starts until the gate settles.
 *
 * metaGate.ts is import-free, so it runs here directly against a fake phone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const { createMetaEngine } = await import('../src/features/growth/metaGate.ts');
const { tierOf } = await import('../src/features/commercial/tier.ts');
type MetaDevice = import('../src/features/growth/metaGate.ts').MetaDevice;
type ConsentChoice = import('../src/features/growth/metaGate.ts').ConsentChoice;
type ConsentRead = import('../src/features/growth/metaGate.ts').ConsentRead;

function phone(saved: ConsentRead = 'unset') {
  const calls: string[] = [];
  const store = { value: saved };
  const popup: { done: ((c: ConsentChoice) => void) | null } = { done: null };
  const device: MetaDevice = {
    gateFacts: () => ({ platform: 'android', region: 'US', nativeValuesPresent: true, telemetryEnabled: true }),
    modalFacts: () => ({ modalsPresented: 0, modalHoldMs: 0 }),
    calmFacts: () => ({
      modalsPresented: 0,
      modalHoldMs: 0,
      appActive: true,
      onHome: true,
      labPreviewOpen: false,
      micActive: false,
      overlaysSuppressed: false,
    }),
    initNative: async () => (calls.push('initNative'), true),
    activateApp: () => (calls.push('activate'), true),
    loadSettings: () => {
      calls.push('loadSettings');
      return {
        initializeSDK: () => void calls.push('initializeSDK'),
        setAutoLogAppEventsEnabled: () => {},
        setAdvertiserIDCollectionEnabled: () => {},
        setAdvertiserTrackingEnabled: async () => true,
      };
    },
    loadLogger: () => {
      calls.push('loadLogger');
      return {
        logEvent: () => void calls.push('event'),
        logPurchase: () => void calls.push('purchase'),
        flush: () => void calls.push('flush'),
        setFlushBehavior: () => {},
      };
    },
    loadTracking: () => null,
    appSessions: async () => 3,
    readConsent: async () => store.value,
    saveConsent: async (answer) => {
      calls.push(`save:${answer}`);
      store.value = answer;
      return true;
    },
    askConsent: (done) => {
      calls.push('popup');
      popup.done = done;
    },
    now: () => 0,
    // Timers never fire here: only the Settings path (offerConsent) can ask.
    after: () => {},
  };
  const engine = createMetaEngine(device);
  const settle = async () => {
    for (let i = 0; i < 30; i += 1) await Promise.resolve();
  };
  const count = (name: string) => calls.filter((c) => c === name).length;
  const sdkTouched = () => calls.some((c) => ['initNative', 'loadSettings', 'loadLogger', 'activate', 'event', 'purchase', 'flush'].includes(c));
  return { engine, calls, store, popup, settle, count, sdkTouched };
}

describe('the engine: a known guest never opts in', () => {
  it('offerConsent is a no-op for a known guest: no popup, nothing saved, nothing started', async () => {
    const p = phone();
    p.engine.noteMemberGate('locked', true);
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    assert.equal(p.count('popup'), 0);
    assert.ok(!p.calls.some((c) => c.startsWith('save:')));
    assert.equal(p.store.value, 'unset');
    assert.equal(p.sdkTouched(), false);
    assert.notEqual(p.engine.phase(), 'on');
  });

  it('a stored yes does not start Meta for a known guest, and Settings still asks nothing', async () => {
    const p = phone('yes');
    p.engine.noteMemberGate('locked', true);
    await p.settle();
    assert.equal(p.sdkTouched(), false);
    p.engine.offerConsent();
    await p.settle();
    assert.equal(p.count('popup'), 0);
    assert.equal(p.sdkTouched(), false);
  });

  it('a popup opened while signed in, answered yes after the session became a known guest, is not kept', async () => {
    const p = phone();
    p.engine.noteMemberGate('locked', false); // a signed-in free account
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    assert.equal(p.count('popup'), 1);
    p.engine.noteMemberGate('locked', true); // signed out: now a known guest
    await p.settle();
    p.popup.done?.('yes');
    await p.settle();
    assert.ok(!p.calls.includes('save:yes'));
    assert.equal(p.store.value, 'unset');
    assert.equal(p.sdkTouched(), false);
  });

  it('a signed-in account is still asked from Settings, and its yes starts Meta (control)', async () => {
    for (const [gate, label] of [['open', 'member'], ['locked', 'free account']] as const) {
      const p = phone();
      p.engine.noteMemberGate(gate, false);
      await p.settle();
      p.engine.offerConsent();
      await p.settle();
      assert.equal(p.count('popup'), 1, label);
      p.popup.done?.('yes');
      await p.settle();
      assert.equal(p.store.value, 'yes', label);
      assert.equal(p.engine.phase(), 'on', label);
    }
  });

  it('an UNKNOWN session is not a guest, and nothing starts until the gate settles', async () => {
    const p = phone();
    p.engine.noteMemberGate('checking', false);
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    assert.equal(p.count('popup'), 1, 'an unknown session is not refused as a guest');
    p.popup.done?.('yes');
    await p.settle();
    assert.equal(p.sdkTouched(), false, 'a checking gate starts nothing');
    assert.notEqual(p.engine.phase(), 'on');
    p.engine.noteMemberGate('open', false);
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
  });

  it('the source: the guest refusals are in the engine, and the per-launch guest yes is gone', () => {
    const gate = code('src/features/growth/metaGate.ts');
    assert.match(gate, /const consentGiven = \(\) => consent === 'yes' && !knownGuest;/);
    assert.match(gate, /offerConsent\(\) \{\s+if \(knownGuest\) return;\s+ask\(\);/);
    assert.match(gate, /const ask = \(\) => \{\s+if \(knownGuest\) return;/);
    assert.ok(!gate.includes('yesThisLaunch'));
  });
});

describe('Settings: the row is gated on a signed-in tier', () => {
  const settings = code('src/screens/settings/SettingsScreen.tsx');

  it('the row needs both the Meta gate and a signed-in tier from useTier()', () => {
    assert.match(settings, /import \{ useTier \} from '\.\.\/\.\.\/features\/commercial\/useTier';/);
    assert.match(settings, /const accountTier = useTier\(\);/);
    assert.match(settings, /const adMeasurementSignedIn = accountTier === 'free' \|\| accountTier === 'member';/);
    assert.match(settings, /\{adMeasurementRow && adMeasurementSignedIn \? <AdMeasurementRow \/> : null\}/);
    assert.equal((settings.match(/<AdMeasurementRow \/>/g) ?? []).length, 1, 'one place renders the row');
  });

  it('that rule hides the row for a known guest and for an unknown session, and shows it for an account', () => {
    const rhs = settings.match(/const adMeasurementSignedIn = (.+);/)?.[1];
    assert.ok(rhs);
    const shows = new Function('accountTier', `return ${rhs};`) as (t: string) => boolean;
    // Before the first read lands the provider says 'anonymous': unknown, not a guest.
    assert.equal(shows(tierOf('anonymous', false)), false, 'unknown session: not yet');
    assert.equal(shows(tierOf('anonymous', true)), false, 'known guest: never');
    assert.equal(shows(tierOf('free', true)), true, 'free account');
    assert.equal(shows(tierOf('lapsed', true)), true, 'lapsed account');
    assert.equal(shows(tierOf('academy', true)), true, 'member');
    assert.equal(shows('preview'), false, 'a members-only preview is not an account answer');
  });
});
