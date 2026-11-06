/**
 * Meta measurement is strictly opt-in (owner 2026-11-05). The engine in
 * metaGate.ts runs against a fake phone, and the real consent store and the
 * real account wipe run on a fake AsyncStorage.
 *
 * The rules: off for everyone until this person says yes on this device; one
 * popup, asked once, at the Apple prompt's calm moment; the Apple prompt only
 * after a yes; a Settings row that stops logging at once; a key the wipe takes;
 * a failed read is off. The region gate and every older guard stay.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ── a fake phone's storage, and the real wipe on top of it ─────────────────
const AS = new Map<string, string>();
const disk = { failReads: false, failWrites: false };
const g = globalThis as Record<string, unknown>;
g.__MC_AS__ = AS;
g.__MC_DISK__ = disk;
g.__DEV__ = false;

const dataMod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = dataMod(`
  const s = globalThis.__MC_AS__;
  const d = globalThis.__MC_DISK__;
  export default {
    async getItem(k) { if (d.failReads) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { if (d.failWrites) throw new Error('write failed'); s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
    async multiRemove(ks) { for (const k of ks) s.delete(k); },
  };`);
const REACT = dataMod(`
  export function useSyncExternalStore(sub, snap) { return snap(); }
  export function useEffect(fn) { fn(); }
  export function useState(v) { return [v, () => {}]; }
  export default { useSyncExternalStore, useEffect, useState };`);

const WIPE = 'src/features/account/clearLocalAccountData.ts';
const WIPE_URL = pathToFileURL(join(ROOT, WIPE)).href;
const WIPE_SRC = read(WIPE);
function stubFor(spec: string): string {
  const esc = spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const m = WIPE_SRC.match(new RegExp(`import \\{([^}]+)\\} from '${esc}'`));
  const names = (m?.[1] ?? '').split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean);
  return dataMod(names.map((n) => `export function ${n}() {}`).join('\n'));
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const short = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return short(FAKE_AS);
    if (specifier === 'react') return short(REACT);
    if (context.parentURL === WIPE_URL && specifier.startsWith('.') && specifier !== '../storage/localStoreRegistry') {
      return short(stubFor(specifier));
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(c))) return short(c.href);
      }
    }
    return nextResolve(specifier, context);
  },
});

const gateMod = await import('../src/features/growth/metaGate.ts');
const consentStore = await import('../src/features/growth/metaConsentStore.ts');
const wipe = await import('../src/features/account/clearLocalAccountData.ts');
const {
  CALM_CHECK_MS,
  CALM_DWELL_MS,
  META_CONSENT_BODY,
  META_CONSENT_NO,
  META_CONSENT_ROW_HINT,
  META_CONSENT_ROW_LABEL,
  META_CONSENT_TITLE,
  META_CONSENT_YES,
  createMetaEngine,
} = gateMod;
type MetaDevice = import('../src/features/growth/metaGate.ts').MetaDevice;
type CalmFacts = import('../src/features/growth/metaGate.ts').CalmFacts;
type ConsentChoice = import('../src/features/growth/metaGate.ts').ConsentChoice;
type ConsentRead = import('../src/features/growth/metaGate.ts').ConsentRead;
type TrackingAnswer = import('../src/features/growth/metaGate.ts').TrackingAnswer;

const KEY = 'ape:metaConsent';
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
};
const files = walk(join(ROOT, 'src'));
const CALM: CalmFacts = {
  appActive: true,
  onHome: true,
  labPreviewOpen: false,
  micActive: false,
  overlaysSuppressed: false,
  modalsPresented: 0,
  modalHoldMs: 0,
};
const LONG = CALM_DWELL_MS + CALM_CHECK_MS * 2;
const SALE = { plan: 'annual', amount: 59.99, currency: 'USD' } as const;

type Saved = { value: ConsentRead };

/** One launch of a fake phone. Pass the same `saved` to launch it again. */
function phone(
  over: {
    saved?: Saved;
    platform?: string;
    region?: string | null;
    appSessions?: number | null;
    calm?: Partial<CalmFacts>;
    tracking?: TrackingAnswer;
    saveOk?: boolean;
    /** How the popup gets answered; left undefined it stays up, unanswered. */
    choice?: ConsentChoice;
    readThrows?: boolean;
  } = {},
) {
  const calls: [string, ...unknown[]][] = [];
  const timers: { at: number; run: () => void }[] = [];
  let clock = 1_000_000;
  const saved = over.saved ?? { value: 'unset' as ConsentRead };
  const facts = { calm: { ...CALM, ...over.calm } };
  const popup: { done: ((c: ConsentChoice) => void) | null; choice: ConsentChoice | undefined } = {
    done: null,
    choice: over.choice,
  };
  const device: MetaDevice = {
    gateFacts: () => ({
      platform: over.platform ?? 'ios',
      region: over.region === undefined ? 'US' : over.region,
      nativeValuesPresent: true,
      telemetryEnabled: true,
    }),
    modalFacts: () => ({ modalsPresented: facts.calm.modalsPresented, modalHoldMs: facts.calm.modalHoldMs }),
    calmFacts: () => facts.calm,
    initNative: async () => {
      calls.push(['initNative']);
      return true;
    },
    loadSettings: () => {
      calls.push(['loadSettings']);
      return {
        initializeSDK: () => void calls.push(['initializeSDK']),
        setAutoLogAppEventsEnabled: (v) => void calls.push(['autoLog', v]),
        setAdvertiserIDCollectionEnabled: (v) => void calls.push(['adId', v]),
        setAdvertiserTrackingEnabled: async (v) => {
          calls.push(['ate', v]);
          return true;
        },
      };
    },
    loadLogger: () => {
      calls.push(['loadLogger']);
      return {
        logEvent: (name) => void calls.push(['event', name]),
        logPurchase: (amount, currency) => void calls.push(['purchase', amount, currency]),
        flush: () => void calls.push(['flush']),
        setFlushBehavior: (b) => void calls.push(['flushBehavior', b]),
      };
    },
    loadTracking: () => ({
      isAvailable: () => true,
      getTrackingPermissionsAsync: async () => over.tracking ?? { granted: false, status: 'undetermined' },
      requestTrackingPermissionsAsync: async () => {
        calls.push(['applePrompt']);
        return { granted: true, status: 'granted' };
      },
    }),
    appSessions: async () => (over.appSessions === undefined ? 3 : over.appSessions),
    readConsent: async () => {
      calls.push(['readConsent']);
      if (over.readThrows) throw new Error('read failed');
      return saved.value;
    },
    saveConsent: async (answer) => {
      calls.push(['saveConsent', answer]);
      if (over.saveOk === false) return false;
      saved.value = answer;
      return true;
    },
    askConsent: (done) => {
      calls.push(['popup']);
      popup.done = done;
      if (popup.choice) done(popup.choice);
    },
    now: () => clock,
    after: (ms, run) => void timers.push({ at: clock + ms, run }),
  };
  const engine = createMetaEngine(device);
  const settle = async () => {
    for (let i = 0; i < 30; i += 1) await Promise.resolve();
  };
  const pass = async (ms: number) => {
    await settle(); // the answer is read first: its timers exist only after that
    const end = clock + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers[0];
      if (!next || next.at > end) break;
      timers.shift();
      clock = next.at;
      next.run();
      await settle();
    }
    clock = end;
    await settle();
  };
  const count = (name: string) => calls.filter((c) => c[0] === name).length;
  const sdkTouched = () =>
    calls.some((c) => ['initNative', 'loadSettings', 'initializeSDK', 'loadLogger', 'event', 'purchase', 'flush'].includes(c[0]));
  /** Everything that would ever leave the phone. */
  const sent = () => calls.filter((c) => c[0] === 'event' || c[0] === 'purchase' || c[0] === 'flush').length;
  return { engine, calls, saved, facts, popup, pass, settle, count, sdkTouched, sent };
}

describe('off by default', () => {
  it('a fresh phone in a Meta region starts nothing and shows no Apple prompt', async () => {
    const p = phone();
    p.engine.noteMemberGate('open');
    await p.pass(600_000);
    assert.equal(p.sdkTouched(), false);
    assert.equal(p.count('applePrompt'), 0);
    assert.notEqual(p.engine.phase(), 'on');
  });

  it('events on a phone that has not said yes go nowhere', async () => {
    const p = phone();
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.noteAppOpen();
    p.engine.notePurchase(SALE);
    await p.pass(600_000);
    assert.equal(p.sdkTouched(), false);
  });

  it('a stored yes starts as before, and only then', async () => {
    const p = phone({ saved: { value: 'yes' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(p.count('event'), 1);
    assert.equal(p.count('popup'), 0, 'a yes is not asked again');
  });
});

describe('no prompt or start before a yes', () => {
  it('the popup comes before anything from Meta, and the Apple prompt after the yes', async () => {
    const p = phone({ choice: 'yes' });
    p.engine.noteMemberGate('open');
    await p.pass(LONG);
    const names = p.calls.map((c) => c[0]);
    assert.ok(names.includes('popup'));
    assert.ok(names.indexOf('popup') < names.indexOf('saveConsent'));
    assert.ok(names.indexOf('saveConsent') < names.indexOf('initNative'));
    assert.equal(p.engine.phase(), 'on');
    await p.pass(LONG);
    assert.ok(names.indexOf('popup') < p.calls.map((c) => c[0]).indexOf('applePrompt'));
    assert.equal(p.count('applePrompt'), 1);
  });

  it('a purchase from before the yes is not sent after it', async () => {
    const p = phone();
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.notePurchase(SALE);
    await p.pass(LONG);
    p.popup.done?.('yes');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(p.count('purchase'), 0);
  });

  it('a purchase landing while the answer is still being read waits for it', async () => {
    const no = phone({ saved: { value: 'no' } });
    no.engine.noteMemberGate('checking');
    no.engine.notePurchase(SALE);
    no.engine.noteMemberGate('open');
    await no.pass(60_000);
    assert.equal(no.sdkTouched(), false);
    const yes = phone({ saved: { value: 'yes' } });
    yes.engine.noteMemberGate('checking');
    yes.engine.notePurchase(SALE);
    yes.engine.noteMemberGate('open');
    await yes.settle();
    assert.equal(yes.count('purchase'), 1);
  });

  it('a yes the phone could not keep starts nothing', async () => {
    const p = phone({ choice: 'yes', saveOk: false });
    p.engine.noteMemberGate('open');
    await p.pass(LONG * 2);
    assert.equal(p.count('saveConsent'), 1);
    assert.equal(p.sdkTouched(), false);
    assert.equal(p.count('applePrompt'), 0);
  });

  it('never on the first app open, or when the count could not be read', async () => {
    for (const appSessions of [0, 1, null]) {
      const p = phone({ appSessions });
      p.engine.noteMemberGate('open');
      await p.pass(600_000);
      assert.equal(p.count('popup'), 0, String(appSessions));
    }
  });

  it('not before the quiet dwell on Home', async () => {
    const p = phone();
    p.engine.noteMemberGate('open');
    await p.pass(CALM_DWELL_MS - CALM_CHECK_MS);
    assert.equal(p.count('popup'), 0);
    await p.pass(CALM_DWELL_MS);
    assert.equal(p.count('popup'), 1);
  });

  for (const [what, calm] of [
    ['a popup', { modalsPresented: 1 }],
    ['a popup fading out', { modalHoldMs: 300 }],
    ['a lab or anywhere but Home', { onHome: false }],
    ['a lab preview', { labPreviewOpen: true }],
    ['the microphone in use', { micActive: true }],
    ['low light', { overlaysSuppressed: true }],
    ['the app in the background', { appActive: false }],
  ] as [string, Partial<CalmFacts>][]) {
    it(`not during ${what}`, async () => {
      const p = phone({ calm });
      p.engine.noteMemberGate('open');
      await p.pass(600_000);
      assert.equal(p.count('popup'), 0);
    });
  }

  for (const gate of ['checking', 'unconfirmed'] as const) {
    it(`not during a member gate that is ${gate}`, async () => {
      const p = phone();
      p.engine.noteMemberGate(gate);
      await p.pass(600_000);
      assert.equal(p.count('popup'), 0);
    });
  }

  it('asked once in a launch, however often the gate changes', async () => {
    const p = phone();
    p.engine.noteMemberGate('checking');
    await p.settle();
    p.engine.noteMemberGate('open');
    p.engine.noteMemberGate('locked');
    await p.pass(LONG * 3);
    assert.equal(p.count('popup'), 1);
  });
});

describe('No is permanent', () => {
  it('saved, stays off, no Apple prompt, and no later launch asks', async () => {
    const first = phone({ choice: 'no' });
    first.engine.noteMemberGate('open');
    await first.pass(LONG);
    assert.equal(first.count('popup'), 1);
    assert.deepEqual(first.calls.find((c) => c[0] === 'saveConsent'), ['saveConsent', 'no']);
    await first.pass(600_000);
    assert.equal(first.sdkTouched(), false);
    assert.equal(first.count('applePrompt'), 0);

    for (let launch = 0; launch < 3; launch += 1) {
      const next = phone({ saved: first.saved });
      next.engine.noteMemberGate('open');
      await next.pass(600_000);
      assert.equal(next.count('popup'), 0);
      assert.equal(next.sdkTouched(), false);
      assert.equal(next.count('applePrompt'), 0);
    }
  });
});

describe('closing the popup without a choice', () => {
  it('saves nothing, starts nothing, is not asked again this launch', async () => {
    const p = phone({ choice: 'dismissed' });
    p.engine.noteMemberGate('open');
    await p.pass(LONG);
    assert.equal(p.count('popup'), 1);
    assert.equal(p.count('saveConsent'), 0);
    p.engine.noteMemberGate('locked');
    await p.pass(600_000);
    assert.equal(p.count('popup'), 1);
    assert.equal(p.sdkTouched(), false);
    assert.equal(p.count('applePrompt'), 0);
    assert.equal(p.saved.value, 'unset');
  });

  it('a later launch may ask, since nobody answered', async () => {
    const first = phone({ choice: 'dismissed' });
    first.engine.noteMemberGate('open');
    await first.pass(LONG);
    const next = phone({ saved: first.saved });
    next.engine.noteMemberGate('open');
    await next.pass(LONG);
    assert.equal(next.count('popup'), 1);
  });

  it('the scrim and both BACK paths run onDismiss; the No button runs onCancel', () => {
    const dialog = code('src/components/AppDialog.tsx');
    assert.match(dialog, /styles\.scrim\} onPress=\{\(\) => resolve\('dismiss'\)\}/);
    assert.match(dialog, /onBack: \(\) => resolve\('dismiss'\)/);
    assert.match(dialog, /onRequestClose=\{\(\) => resolve\('dismiss'\)\}/);
    assert.match(dialog, /accessibilityLabel=\{req\.cancelText \?\? 'Cancel'\}/);
    assert.match(dialog, /which === 'dismiss'\s*\? \(req\.onDismiss \?\? req\.onCancel\)/);
    assert.match(code('src/lib/confirm.ts'), /onDismiss: opts\?\.onDismiss/);
    const m = code('src/features/growth/metaMeasurement.ts');
    assert.match(m, /onCancel: \(\) => done\('no'\)/);
    assert.match(m, /onDismiss: \(\) => done\('dismissed'\)/);
  });

  it('every other dialog still treats the scrim and BACK as Cancel', () => {
    assert.match(code('src/components/AppDialog.tsx'), /req\.onDismiss \?\? req\.onCancel/);
    const askers = files.filter((f) => /(confirmDialog|showAppDialog)\(/.test(code(f)) && /onDismiss: (?!opts)/.test(code(f)));
    assert.deepEqual(askers, ['src/features/growth/metaMeasurement.ts']);
  });
});

describe('Settings off stops events', () => {
  async function running(platform = 'ios') {
    const p = phone({ saved: { value: 'yes' }, platform, tracking: { granted: true, status: 'granted' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    return p;
  }

  it('logging stops in the same tick, before anything is saved', async () => {
    const p = await running();
    const before = p.sent();
    p.engine.withdrawConsent();
    assert.notEqual(p.engine.phase(), 'on', 'at once, not after the write');
    p.engine.notePurchase(SALE);
    p.engine.noteAppOpen();
    await p.pass(600_000);
    assert.equal(p.sent(), before, 'nothing logged, nothing flushed');
    assert.equal(p.saved.value, 'no');
  });

  it('what an already-started SDK allows is switched off too', async () => {
    for (const platform of ['ios', 'android']) {
      const p = await running(platform);
      p.engine.withdrawConsent();
      assert.deepEqual(p.calls.find((c) => c[0] === 'flushBehavior'), ['flushBehavior', 'explicit_only'], platform);
      assert.deepEqual(p.calls.filter((c) => c[0] === 'adId').at(-1), ['adId', false], platform);
      assert.deepEqual(p.calls.filter((c) => c[0] === 'ate').at(-1), ['ate', false], platform);
    }
  });

  it('a late Apple answer cannot turn ad id collection back on', async () => {
    const p = phone({ saved: { value: 'yes' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.withdrawConsent();
    await p.pass(600_000);
    assert.equal(p.count('applePrompt'), 0, 'the waiting prompt is called off');
    assert.deepEqual(p.calls.filter((c) => c[0] === 'adId').at(-1), ['adId', false]);
  });

  it('switching off during the start: the SDK work stops where it is', async () => {
    const p = phone({ saved: { value: 'yes' }, platform: 'android' });
    p.engine.noteMemberGate('open');
    for (let i = 0; i < 4 && p.engine.phase() !== 'starting'; i += 1) await Promise.resolve();
    assert.equal(p.engine.phase(), 'starting');
    p.engine.withdrawConsent();
    await p.pass(60_000);
    assert.equal(p.count('event'), 0);
    assert.equal(p.count('loadLogger'), 0);
  });

  it('the SDK does not start on later launches', async () => {
    const p = await running();
    p.engine.withdrawConsent();
    await p.settle();
    const next = phone({ saved: p.saved });
    next.engine.noteMemberGate('open');
    await next.pass(600_000);
    assert.equal(next.sdkTouched(), false);
    assert.equal(next.count('popup'), 0);
  });

  it('turning on shows the same popup and starts only on its yes', async () => {
    const p = phone({ saved: { value: 'no' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    assert.equal(p.count('popup'), 1);
    assert.equal(p.sdkTouched(), false, 'tapping the switch is not the yes');
    p.popup.done?.('yes');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(p.saved.value, 'yes');
  });

  it('turning on and closing the popup changes nothing', async () => {
    const p = phone({ saved: { value: 'no' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    p.popup.done?.('dismissed');
    await p.settle();
    assert.equal(p.saved.value, 'no');
    assert.equal(p.sdkTouched(), false);
  });

  it('off then on in one launch: the SDK is not started twice, and sending comes back', async () => {
    const p = await running();
    p.engine.withdrawConsent();
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    p.popup.done?.('yes');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(p.count('initializeSDK'), 1);
    assert.equal(p.count('loadLogger'), 1);
    assert.deepEqual(p.calls.filter((c) => c[0] === 'flushBehavior').at(-1), ['flushBehavior', 'auto']);
    p.engine.notePurchase(SALE);
    assert.equal(p.count('purchase'), 1);
  });
});

describe('a person with no account', () => {
  it('a known guest is never asked: their No could not be kept', async () => {
    const p = phone();
    p.engine.noteMemberGate('locked', true);
    await p.pass(600_000);
    assert.equal(p.count('popup'), 0);
    assert.equal(p.sdkTouched(), false);
  });

  it('a guest launch never starts on a stored yes the launch wipe is about to take', async () => {
    const p = phone({ saved: { value: 'yes' } });
    p.engine.noteMemberGate('locked', true);
    await p.pass(600_000);
    assert.equal(p.sdkTouched(), false);
  });

  it('a guest who says yes in Settings is on for this launch', async () => {
    const p = phone();
    p.engine.noteMemberGate('locked', true);
    await p.settle();
    p.engine.offerConsent();
    await p.settle();
    p.popup.done?.('yes');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
  });

  it('an unknown session is not a guest: known only from a settled locked gate', () => {
    const root = code('src/features/commercial/PurchaseListenerRoot.tsx');
    assert.match(root, /const knownGuest = gate === 'locked' && tier === 'guest';/);
    assert.match(root, /noteMemberGate\(gate, knownGuest\)/);
    assert.match(root, /\}, \[gate, knownGuest\]\);/);
  });
});

describe('the real store', () => {
  beforeEach(() => {
    AS.clear();
    disk.failReads = false;
    disk.failWrites = false;
    wipe.resetAllLocalStores();
  });

  it('an empty phone reads unset, never yes', async () => {
    assert.equal(await consentStore.readMetaConsent(), 'unset');
  });

  it('keeps the answer under the ape: key the owner asked for', async () => {
    assert.equal(await consentStore.saveMetaConsent('yes'), true);
    assert.equal(await consentStore.readMetaConsent(), 'yes');
    assert.deepEqual(JSON.parse(AS.get(KEY) ?? 'null'), { answer: 'yes' });
    await consentStore.saveMetaConsent('no');
    assert.equal(await consentStore.readMetaConsent(), 'no');
  });

  it('an unreadable store is off, takes no write, and leaves nothing queued', async () => {
    AS.set(KEY, JSON.stringify({ answer: 'yes' }));
    wipe.resetAllLocalStores();
    disk.failReads = true;
    assert.equal(await consentStore.readMetaConsent(), 'unreadable');
    assert.equal(await consentStore.saveMetaConsent('no'), false);
    disk.failReads = false;
    assert.equal(await consentStore.readMetaConsent(), 'yes', 'the stored copy was not written over');
  });

  it('unreadable never starts Meta and never asks', async () => {
    const p = phone({ saved: { value: 'unreadable' } });
    p.engine.noteMemberGate('open');
    await p.pass(600_000);
    assert.equal(p.sdkTouched(), false);
    assert.equal(p.count('popup'), 0);
    const thrown = phone({ readThrows: true });
    thrown.engine.noteMemberGate('open');
    await thrown.pass(600_000);
    assert.equal(thrown.sdkTouched(), false);
    assert.equal(thrown.count('popup'), 0);
  });

  it('a garbled record is never a yes', async () => {
    AS.set(KEY, JSON.stringify({ answer: 'maybe' }));
    wipe.resetAllLocalStores();
    assert.equal(await consentStore.readMetaConsent(), 'unset');
    assert.equal(AS.get(`${KEY}:damaged`), JSON.stringify({ answer: 'maybe' }));
  });

  it('a yes the phone refused is not left showing as a yes', async () => {
    await consentStore.readMetaConsent();
    disk.failWrites = true;
    assert.equal(await consentStore.saveMetaConsent('yes'), false);
    disk.failWrites = false;
    assert.notEqual(await consentStore.readMetaConsent(), 'yes');
    assert.equal(AS.has(KEY) && JSON.parse(AS.get(KEY) ?? '{}').answer === 'yes', false);
  });
});

describe('the wipe clears it', () => {
  beforeEach(() => {
    AS.clear();
    disk.failReads = false;
    disk.failWrites = false;
    wipe.resetAllLocalStores();
  });

  for (const [what, opts] of [
    ['an account switch', undefined],
    ['the guest wipe', { total: true }],
  ] as [string, { total: true } | undefined][]) {
    it(`${what} removes the answer and its set-aside copy`, async () => {
      await consentStore.saveMetaConsent('yes');
      AS.set(`${KEY}:damaged`, 'x');
      await wipe.clearLocalAccountData(opts);
      wipe.resetAllLocalStores();
      assert.equal(AS.has(KEY), false);
      assert.equal(AS.has(`${KEY}:damaged`), false);
      assert.equal(await consentStore.readMetaConsent(), 'unset');
    });
  }

  it('the key is on no keep list and uses no kept prefix', () => {
    assert.equal(wipe.keepsThroughWipe(KEY), false);
    assert.equal(wipe.keepsThroughWipe(KEY, { total: true }), false);
    assert.ok(!WIPE_SRC.includes('metaConsent'));
    assert.ok(!KEY.startsWith('ape:onboarding:') && !KEY.startsWith('ape:intro:') && !KEY.startsWith('ape:coach:'));
  });

  it('the wipe stops a running session at once, and the next person starts off', async () => {
    const p = phone({ saved: { value: 'yes' } });
    consentStore.noteMetaConsentWipe(() => p.engine.noteConsentWiped());
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    const before = p.sent();
    wipe.resetAllLocalStores();
    consentStore.noteMetaConsentWipe(() => {});
    p.engine.notePurchase(SALE);
    p.engine.noteAppOpen();
    p.engine.noteMemberGate('open');
    await p.pass(600_000);
    assert.equal(p.sent(), before);
    assert.equal(p.count('popup'), 0, 'not asked over the end of this launch');
  });

  it('metaMeasurement listens for the wipe', () => {
    assert.match(code('src/features/growth/metaMeasurement.ts'), /noteMetaConsentWipe\(\(\) => engine\.noteConsentWiped\(\)\);/);
  });
});

describe('the region gate still applies', () => {
  for (const region of ['GB', 'DE', null]) {
    it(`region ${region}: not read, not asked, not started, even with a stored yes`, async () => {
      const p = phone({ region, saved: { value: 'yes' } });
      p.engine.noteMemberGate('open');
      p.engine.notePurchase(SALE);
      await p.pass(600_000);
      assert.deepEqual(p.calls, []);
      assert.equal(p.engine.phase(), 'off');
    });
  }

  it('web: not read, not asked, not started', async () => {
    const p = phone({ platform: 'web', saved: { value: 'yes' } });
    p.engine.noteMemberGate('open');
    await p.pass(600_000);
    assert.deepEqual(p.calls, []);
  });

  it('a yes does not get round any other guard: a popup still holds the start', async () => {
    const p = phone({ saved: { value: 'yes' }, calm: { modalsPresented: 1 } });
    p.engine.noteMemberGate('open');
    await p.pass(30_000);
    assert.equal(p.sdkTouched(), false);
    p.facts.calm.modalsPresented = 0;
    await p.pass(3_000);
    assert.equal(p.engine.phase(), 'on');
  });
});

describe('the wording and the Settings row', () => {
  const settings = code('src/screens/settings/SettingsScreen.tsx');
  const measurement = code('src/features/growth/metaMeasurement.ts');

  it('the popup is the approved text, exactly', () => {
    assert.equal(META_CONSENT_TITLE, 'Help us measure our ads?');
    assert.equal(
      META_CONSENT_BODY,
      'If you are 18 or older, you can let us tell Meta when the app is opened or a membership is bought, so we can see which ads work. Your lesson progress and study data are not included. You can change this any time in Settings.',
    );
    assert.equal(META_CONSENT_YES, "I'm 18+ and agree");
    assert.equal(META_CONSENT_NO, 'No thanks');
  });

  it('the row says what it does, in one plain line', () => {
    assert.equal(META_CONSENT_ROW_LABEL, 'Ad measurement');
    assert.match(META_CONSENT_ROW_HINT, /tell Meta when the app is opened or a membership is bought/);
  });

  it('one popup, in the house dialog, used by both paths; never a raw Alert', () => {
    assert.match(measurement, /confirmDialog\(META_CONSENT_TITLE, META_CONSENT_BODY, META_CONSENT_YES,/);
    assert.equal((measurement.match(/confirmDialog\(/g) ?? []).length, 1);
    assert.ok(!measurement.includes('Alert'));
    assert.ok(!code('src/features/growth/metaGate.ts').includes('Alert'));
    assert.match(measurement, /engine\.offerConsent\(\)/);
    assert.ok(!/META_CONSENT_(TITLE|BODY|YES)/.test(settings), 'Settings shows no second copy of the question');
  });

  it('the row shows only behind the Meta gate, never on web', () => {
    assert.match(settings, /if \(Platform\.OS === 'web'\) return;\s+try \{\s+const meta = require\('\.\.\/\.\.\/features\/growth\/metaMeasurement'\)/);
    assert.match(settings, /setAdMeasurementRow\(meta\.adMeasurementAvailable\(\)\);/);
    assert.match(settings, /\{adMeasurementRow \? <AdMeasurementRow \/> : null\}/);
    assert.match(settings, /useState\(false\);\s+useEffect\(\(\) => \{\s+if \(Platform\.OS === 'web'\) return;/);
    assert.match(measurement, /export function adMeasurementAvailable\(\): boolean \{\s+if \(Platform\.OS === 'web'\) return false;[\s\S]*?metaAllowed\(device\.gateFacts\(\)\)/);
  });

  it('the switch waits for the read and shows only the saved answer', () => {
    assert.match(settings, /<Toggle on=\{consent\.on\} disabled=\{!consent\.ready\}/);
    assert.match(settings, /consent\.unreadable \? META_CONSENT_ROW_UNREADABLE : META_CONSENT_ROW_HINT/);
    assert.match(settings, /if \(on\) meta\.askAdMeasurement\(\);\s+else meta\.stopAdMeasurement\(\);/);
  });
});

describe('no feature can read the answer, and it all stays lazy', () => {
  it('the store has two readers: the device side, and the row', () => {
    const users = files.filter((f) => !f.endsWith('metaConsentStore.ts') && code(f).includes('metaConsentStore'));
    assert.deepEqual(users.sort(), ['src/features/growth/metaMeasurement.ts', 'src/screens/settings/SettingsScreen.tsx']);
  });

  it('only the store touches the key', () => {
    const users = files.filter((f) => read(f).includes(KEY));
    assert.deepEqual(users, ['src/features/growth/metaConsentStore.ts']);
  });

  it('the engine hands out no answer', () => {
    const e = phone().engine as unknown as Record<string, unknown>;
    assert.deepEqual(Object.keys(e).sort(), [
      'noteAppOpen',
      'noteConsentWiped',
      'noteMemberGate',
      'notePurchase',
      'offerConsent',
      'phase',
      'withdrawConsent',
    ]);
    assert.ok(!/export function \w*[Cc]onsent/.test(code('src/features/growth/metaMeasurement.ts')));
  });

  it('metaGate.ts stays import-free, so this file can run it directly', () => {
    assert.ok(!/^\s*import /m.test(code('src/features/growth/metaGate.ts')));
  });

  it('the store is written on createLocalStore, with no direct storage', () => {
    const src = code('src/features/growth/metaConsentStore.ts');
    assert.match(src, /createLocalStore<ConsentRecord>\(\{/);
    assert.ok(!src.includes('AsyncStorage'));
    assert.ok(!src.includes('react-native'));
  });

  it('nothing in the app-start path imports the Meta files statically', () => {
    for (const p of ['src/features/commercial/PurchaseListenerRoot.tsx', 'src/features/commercial/purchase.ts']) {
      assert.ok(!/^\s*import[^;]*growth\//m.test(code(p).replace(/import\('[^']*'\)/g, '')), p);
    }
    const settings = code('src/screens/settings/SettingsScreen.tsx').replace(/import\('[^']*'\)/g, '');
    assert.ok(!/^\s*import[^;]*growth\/metaMeasurement/m.test(settings), 'the row reaches it on demand');
    assert.match(read('src/navigation/RootNavigator.tsx'), /Settings: lazyScreen\(\(\) => require\('\.\.\/screens\/settings\/SettingsScreen'\)/);
  });
});
