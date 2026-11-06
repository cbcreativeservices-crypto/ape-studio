/**
 * Meta measurement, 1.0.1 (plan 2026-11-05, owner-approved). The engine in
 * metaGate.ts runs here against a fake phone: every promise in the plan that
 * can be checked without a real one. This phone has said yes; what happens
 * before a yes is test/metaConsent_20261105 (owner 2026-11-05).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CALM_CHECK_MS,
  CALM_DWELL_MS,
  META_ACTIVATE_EVENT,
  OPEN_GAP_MS,
  buildPurchaseEvent,
  canStartNow,
  createMetaEngine,
  isCalmNow,
  memberGateSettled,
  metaAllowed,
  realActivateReportsOpen,
  regionAllowed,
  type CalmFacts,
  type MemberGateState,
  type MetaDevice,
  type TrackingAnswer,
} from '../src/features/growth/metaGate.ts';
import {
  isRenewalDelivery,
  restoreFailureOf,
  storeChargeFor,
  storeFailureOf,
  verifyFailureOf,
} from '../src/features/commercial/iapProducts.ts';
import { sanitizeProps } from '../src/features/telemetry/scrub.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const require_ = createRequire(import.meta.url);

const CALM: CalmFacts = {
  appActive: true,
  onHome: true,
  labPreviewOpen: false,
  micActive: false,
  overlaysSuppressed: false,
  modalsPresented: 0,
  modalHoldMs: 0,
};

type Call = [string, ...unknown[]];

function phone(over: {
  platform?: string;
  region?: string | null;
  nativeValuesPresent?: boolean;
  telemetryEnabled?: boolean;
  tracking?: TrackingAnswer | null;
  answer?: TrackingAnswer;
  appSessions?: number | null;
  calm?: Partial<CalmFacts>;
  initOk?: boolean;
  /** false: this build has no real activate call. 'throws': the call blew up. */
  activate?: boolean | 'throws';
}) {
  const calls: Call[] = [];
  const timers: { at: number; run: () => void }[] = [];
  let clock = 1_000_000;
  const facts = { calm: { ...CALM, ...over.calm } };
  const trackingAnswer = over.tracking === undefined ? ({ granted: false, status: 'undetermined' } as TrackingAnswer) : over.tracking;
  const device: MetaDevice = {
    gateFacts: () => ({
      platform: over.platform ?? 'ios',
      region: over.region === undefined ? 'US' : over.region,
      nativeValuesPresent: over.nativeValuesPresent ?? true,
      telemetryEnabled: over.telemetryEnabled ?? true,
    }),
    modalFacts: () => ({ modalsPresented: facts.calm.modalsPresented, modalHoldMs: facts.calm.modalHoldMs }),
    calmFacts: () => facts.calm,
    initNative: async () => {
      calls.push(['initNative']);
      return over.initOk ?? true;
    },
    activateApp: () => {
      if (over.activate === 'throws') throw new Error('native call failed');
      if (over.activate === false) return false;
      calls.push(['activate']);
      return true;
    },
    loadSettings: () => ({
      initializeSDK: () => void calls.push(['initializeSDK']),
      setAutoLogAppEventsEnabled: (v) => void calls.push(['autoLog', v]),
      setAdvertiserIDCollectionEnabled: (v) => void calls.push(['adId', v]),
      setAdvertiserTrackingEnabled: async (v) => {
        calls.push(['ate', v]);
        return true;
      },
    }),
    loadLogger: () => {
      calls.push(['loadLogger']);
      return {
        logEvent: (name) => void calls.push(['event', name]),
        logPurchase: (amount, currency, parameters) => void calls.push(['purchase', amount, currency, parameters]),
        flush: () => void calls.push(['flush']),
        setFlushBehavior: (b) => void calls.push(['flushBehavior', b]),
      };
    },
    loadTracking: () =>
      trackingAnswer === null
        ? null
        : {
            isAvailable: () => true,
            getTrackingPermissionsAsync: async () => trackingAnswer,
            requestTrackingPermissionsAsync: async () => {
              calls.push(['ask']);
              return over.answer ?? { granted: true, status: 'granted' };
            },
          },
    appSessions: async () => (over.appSessions === undefined ? 3 : over.appSessions),
    readConsent: async () => 'yes',
    saveConsent: async () => true,
    askConsent: () => {},
    now: () => clock,
    after: (ms, run) => void timers.push({ at: clock + ms, run }),
  };
  const engine = createMetaEngine(device);
  const settle = async () => {
    for (let i = 0; i < 12; i += 1) await Promise.resolve();
  };
  /** Run the clock forward, firing what falls due. */
  const pass = async (ms: number) => {
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
  const names = () => calls.map((c) => c[0]);
  return { engine, calls, names, facts, pass, settle };
}

describe('the region gate', () => {
  it('lets in exactly US, CA and AU', () => {
    for (const r of ['US', 'CA', 'AU', 'us', ' ca ']) assert.equal(regionAllowed(r), true, r);
    for (const r of ['GB', 'IE', 'DE', 'FR', 'NZ', '', ' ', null, undefined]) assert.equal(regionAllowed(r), false, String(r));
  });

  for (const region of ['GB', 'DE', null]) {
    it(`region ${region}: the SDK is never touched, and a purchase goes nowhere`, async () => {
      const p = phone({ region });
      p.engine.noteMemberGate('open');
      p.engine.notePurchase({ plan: 'annual', amount: 59.99, currency: 'USD' });
      await p.pass(60_000);
      assert.equal(p.engine.phase(), 'off');
      assert.deepEqual(p.calls, []);
    });
  }
});

describe('off by default', () => {
  it('every missing condition means off', () => {
    const on = { platform: 'ios', region: 'US', nativeValuesPresent: true, telemetryEnabled: true };
    assert.equal(metaAllowed(on), true);
    assert.equal(metaAllowed({ ...on, platform: 'android' }), true);
    assert.equal(metaAllowed({ ...on, platform: 'web' }), false);
    assert.equal(metaAllowed({ ...on, nativeValuesPresent: false }), false);
    assert.equal(metaAllowed({ ...on, telemetryEnabled: false }), false);
    assert.equal(metaAllowed({ ...on, region: null }), false);
  });

  it('a build without the native values touches nothing', async () => {
    const p = phone({ nativeValuesPresent: false });
    p.engine.noteMemberGate('open');
    await p.pass(60_000);
    assert.equal(p.engine.phase(), 'off');
    assert.deepEqual(p.calls, []);
  });

  it('web touches nothing', async () => {
    const p = phone({ platform: 'web' });
    p.engine.noteMemberGate('open');
    await p.pass(60_000);
    assert.deepEqual(p.calls, []);
  });

  it('a failed Android start stays off and never loads the logger', async () => {
    const p = phone({ platform: 'android', initOk: false });
    p.engine.noteMemberGate('open');
    await p.pass(5_000);
    assert.equal(p.engine.phase(), 'off');
    assert.ok(!p.names().includes('loadLogger'));
  });

  it('app.config.js: no values, no Meta plugin; a partial or malformed pair is no values', () => {
    const config = require_(join(ROOT, 'app.config.js'));
    const run = (env: Record<string, string | undefined>) => {
      const saved = { id: process.env.META_APP_ID, token: process.env.META_CLIENT_TOKEN };
      delete process.env.META_APP_ID;
      delete process.env.META_CLIENT_TOKEN;
      Object.assign(process.env, env);
      const out = config({ config: { plugins: ['x'], extra: { eas: {} } } });
      delete process.env.META_APP_ID;
      delete process.env.META_CLIENT_TOKEN;
      if (saved.id !== undefined) process.env.META_APP_ID = saved.id;
      if (saved.token !== undefined) process.env.META_CLIENT_TOKEN = saved.token;
      return out;
    };
    for (const env of [{}, { META_APP_ID: '123' }, { META_CLIENT_TOKEN: 'x' }, { META_APP_ID: 'abc', META_CLIENT_TOKEN: 'x' }]) {
      const out = run(env);
      assert.deepEqual(out.plugins, ['x']);
      assert.equal(out.extra.metaMeasurement.nativeValuesPresent, false);
      assert.deepEqual(out.extra.eas, {});
    }
    const on = run({ META_APP_ID: '123', META_CLIENT_TOKEN: 'x' });
    assert.equal(on.extra.metaMeasurement.nativeValuesPresent, true);
    const [name, props] = on.plugins[1];
    assert.equal(name, 'react-native-fbsdk-next');
    assert.equal(props.scheme, 'fb123');
    assert.equal(props.autoLogAppEventsEnabled, false);
    assert.equal(props.advertiserIDCollectionEnabled, false);
    assert.equal(props.isAutoInitEnabled, false);
    assert.equal(props.iosUserTrackingPermission, false);
    assert.ok(!JSON.stringify(on.extra).includes('"x"'), 'the token never enters extra');
  });

  it('no Meta value is committed', () => {
    const app = read('app.json');
    assert.ok(!/react-native-fbsdk-next/.test(app), 'the plugin comes from app.config.js only');
    assert.ok(!/FacebookAppID|FacebookClientToken|clientToken/.test(app));
    assert.ok(/^META_APP_ID=$/m.test(read('.env.example')));
    assert.ok(/^META_CLIENT_TOKEN=$/m.test(read('.env.example')));
  });
});

describe('nothing starts during a member gate', () => {
  it('only a settled gate counts', () => {
    assert.equal(memberGateSettled('open'), true);
    assert.equal(memberGateSettled('locked'), true);
    assert.equal(memberGateSettled('checking'), false);
    assert.equal(memberGateSettled('unconfirmed'), false);
    assert.equal(memberGateSettled(null), false);
  });

  for (const gate of ['checking', 'unconfirmed'] as MemberGateState[]) {
    it(`'${gate}': no SDK call and no prompt, however long it lasts`, async () => {
      const p = phone({});
      p.engine.noteMemberGate(gate);
      await p.pass(120_000);
      assert.deepEqual(p.calls, []);
      assert.equal(p.engine.phase(), 'waiting');
    });
  }

  it('starts the moment the gate settles', async () => {
    const p = phone({});
    p.engine.noteMemberGate('checking');
    await p.pass(10_000);
    p.engine.noteMemberGate('locked');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
  });

  it('a popup, or one still fading out, holds the start', async () => {
    assert.equal(canStartNow('open', { modalsPresented: 1, modalHoldMs: 0 }), false);
    assert.equal(canStartNow('open', { modalsPresented: 0, modalHoldMs: 200 }), false);
    const p = phone({ calm: { modalsPresented: 1 } });
    p.engine.noteMemberGate('open');
    await p.pass(30_000);
    assert.deepEqual(p.calls, []);
    p.facts.calm.modalsPresented = 0;
    await p.pass(3_000);
    assert.equal(p.engine.phase(), 'on');
  });
});

describe('what reaches Meta', () => {
  it('iOS start order: initialize, auto logging off, then the logger, then one activate', async () => {
    const p = phone({ tracking: { granted: false, status: 'denied' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    const n = p.names();
    assert.ok(n.indexOf('initializeSDK') < n.indexOf('loadLogger'));
    assert.deepEqual(p.calls.find((c) => c[0] === 'autoLog'), ['autoLog', false]);
    assert.equal(p.calls.filter((c) => c[0] === 'activate').length, 1);
    assert.ok(n.indexOf('loadLogger') < n.indexOf('activate'));
  });

  it('Android start order: the native init comes before the logger is even loaded', async () => {
    const p = phone({ platform: 'android' });
    p.engine.noteMemberGate('open');
    await p.settle();
    const n = p.names();
    assert.ok(n.indexOf('initNative') < n.indexOf('loadLogger'));
    assert.ok(!n.includes('initializeSDK'), 'on Android it only sets a flag');
    assert.deepEqual(p.calls.find((c) => c[0] === 'adId'), ['adId', true]);
    assert.ok(!n.includes('ask'));
  });

  it('a purchase carries the amount, the currency and the plan, and nothing else', async () => {
    const p = phone({ tracking: { granted: true, status: 'granted' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    const note = {
      plan: 'lifetime',
      amount: 99.99,
      currency: 'USD',
      transactionId: 'tx-1',
      email: 'someone@example.com',
      userId: 'abc',
      topic: 'G5',
    } as Parameters<typeof p.engine.notePurchase>[0];
    p.engine.notePurchase(note);
    const sent = p.calls.find((c) => c[0] === 'purchase');
    assert.deepEqual(sent, ['purchase', 99.99, 'USD', { fb_content_id: 'lifetime' }]);
    assert.ok(!JSON.stringify(p.calls).includes('tx-1'), 'no transaction id leaves the phone');
    assert.ok(!JSON.stringify(p.calls).includes('example.com'));
    assert.ok(p.names().includes('flush'));
  });

  it('a purchase before the start finished is held, then sent', async () => {
    const p = phone({});
    p.engine.noteMemberGate('checking');
    p.engine.notePurchase({ plan: 'annual', amount: 59.99, currency: 'CAD' });
    await p.pass(5_000);
    assert.equal(p.calls.filter((c) => c[0] === 'purchase').length, 0);
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.calls.filter((c) => c[0] === 'purchase').length, 1);
  });

  it('no usable store price: nothing is sent, never a guess', () => {
    const base = { plan: 'monthly', amount: 9.99, currency: 'USD' } as const;
    assert.ok(buildPurchaseEvent(base));
    assert.equal(buildPurchaseEvent({ ...base, amount: 0 }), null);
    assert.equal(buildPurchaseEvent({ ...base, amount: Number.NaN }), null);
    assert.equal(buildPurchaseEvent({ ...base, currency: 'usd' }), null);
    assert.equal(buildPurchaseEvent({ ...base, currency: '$' }), null);
    assert.equal(buildPurchaseEvent({ ...base, plan: 'pro' as 'monthly' }), null);
  });

  for (const platform of ['android', 'ios']) {
    it(`${platform}: a return within a minute is the same open`, async () => {
      const p = phone({ platform });
      const opens = () => p.calls.filter((c) => c[0] === 'activate').length;
      p.engine.noteMemberGate('open');
      await p.settle();
      p.engine.noteAppOpen();
      assert.equal(opens(), 1);
      await p.pass(OPEN_GAP_MS);
      p.engine.noteAppOpen();
      assert.equal(opens(), 2);
    });
  }

  it('the source can only ever call the approved surface', () => {
    const src = code('src/features/growth/metaGate.ts') + code('src/features/growth/metaMeasurement.ts');
    for (const banned of [
      'setUserID',
      'setUserData',
      'logProductItem',
      'logPushNotificationOpen',
      'getAdvertiserID',
      'getAnonymousID',
      'getAttributionID',
      'setAutoLogAppEventsEnabled(true)',
      'email',
      'supabase',
      'getSession',
    ]) {
      assert.ok(!src.includes(banned), banned);
    }
    assert.ok(!code('src/features/commercial/purchase.ts').includes('noteMetaPurchase({ plan, amount: charge.amount, currency: charge.currency, key'));
  });

  it('the event names are the approved two', () => {
    const logged = [...code('src/features/growth/metaGate.ts').matchAll(/logger\??\.log(\w+)\(/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(logged)].sort(), ['Event', 'Purchase']);
    assert.equal(META_ACTIVATE_EVENT, 'fb_mobile_activate_app');
  });
});

describe("Meta's real activate call (Option A, owner 2026-11-05)", () => {
  const plain = (p: { calls: Call[] }) => p.calls.filter((c) => c[0] === 'event').length;
  const real = (p: { calls: Call[] }) => p.calls.filter((c) => c[0] === 'activate').length;

  it('iOS: the real call reports the open, so the plain event never goes', async () => {
    const p = phone({ tracking: { granted: false, status: 'denied' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(real(p), 1);
    assert.equal(plain(p), 0);
    await p.pass(OPEN_GAP_MS);
    p.engine.noteAppOpen();
    assert.equal(real(p), 2);
    assert.equal(plain(p), 0, 'not on a return either');
  });

  it('Android: the real call runs for the install report, and the open is one plain event', async () => {
    // With automatic logging off the Android SDK drops its own open (18.3.0:
    // SessionLogger -> InternalAppEventsLogger.logEvent). So this is the only one.
    const p = phone({ platform: 'android' });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(real(p), 1);
    assert.equal(plain(p), 1);
    assert.deepEqual(p.calls.find((c) => c[0] === 'event'), ['event', META_ACTIVATE_EVENT]);
    await p.pass(OPEN_GAP_MS);
    p.engine.noteAppOpen();
    assert.equal(real(p), 2);
    assert.equal(plain(p), 2);
  });

  it('only iOS leaves the open to the real call', () => {
    assert.equal(realActivateReportsOpen('ios'), true);
    assert.equal(realActivateReportsOpen('android'), false);
    assert.equal(realActivateReportsOpen('web'), false);
  });

  it('iOS, a build without the call: exactly one plain event, as before', async () => {
    const p = phone({ activate: false, tracking: { granted: false, status: 'denied' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(plain(p), 1);
  });

  it('a native call that blows up is the plain event, and Meta stays up', async () => {
    const p = phone({ activate: 'throws', tracking: { granted: false, status: 'denied' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.equal(p.engine.phase(), 'on');
    assert.equal(plain(p), 1);
    await p.pass(OPEN_GAP_MS);
    p.engine.noteAppOpen();
    assert.equal(plain(p), 2);
  });

  it('runs after auto logging is off and Android ad id is on, before any held purchase', async () => {
    const p = phone({ platform: 'android' });
    p.engine.notePurchase({ plan: 'annual', amount: 59.99, currency: 'USD' });
    p.engine.noteMemberGate('open');
    await p.settle();
    const n = p.names();
    assert.ok(n.indexOf('autoLog') < n.indexOf('activate'));
    assert.ok(n.indexOf('adId') < n.indexOf('activate'));
    assert.ok(n.indexOf('activate') < n.indexOf('purchase'));
  });

  it('a build without the native values never reaches the call', async () => {
    const p = phone({ nativeValuesPresent: false });
    p.engine.noteMemberGate('open');
    await p.pass(60_000);
    assert.deepEqual(p.calls, []);
  });

  it('the device side hands over the module call, nothing else', () => {
    const src = code('src/features/growth/metaMeasurement.ts');
    assert.match(src, /activateApp: activateMetaApp/);
    assert.match(code('src/features/growth/metaGate.ts'), /logger\?\.logEvent\(META_ACTIVATE_EVENT\)/);
  });

  it('Android native: the call lives in ape-meta-init and needs the Application', () => {
    const kt = code('modules/ape-meta-init/android/src/main/java/expo/modules/apemetainit/ApeMetaInitModule.kt');
    assert.match(kt, /import com\.facebook\.appevents\.AppEventsLogger/);
    assert.match(kt, /AsyncFunction\("activateApp"\)/);
    assert.match(kt, /as\? Application/);
    assert.match(kt, /AppEventsLogger\.activateApp\(application\)/);
  });

  it('iOS native: the module is declared the way ape-dsp declares its own', () => {
    const config = JSON.parse(read('modules/ape-meta-init/expo-module.config.json'));
    assert.deepEqual(config.platforms, ['apple', 'android']);
    assert.deepEqual(config.apple.modules, ['ApeMetaInitModule']);
    assert.deepEqual(config.android.modules, ['expo.modules.apemetainit.ApeMetaInitModule']);
    const pod = read('modules/ape-meta-init/ios/ApeMetaInit.podspec');
    assert.match(pod, /s\.name\s+= 'ApeMetaInit'/);
    assert.match(pod, /s\.dependency 'ExpoModulesCore'/);
    assert.match(pod, /s\.dependency 'FBSDKCoreKit'/);
    const swift = code('modules/ape-meta-init/ios/ApeMetaInitModule.swift');
    assert.match(swift, /public class ApeMetaInitModule: Module/);
    assert.match(swift, /Name\("ApeMetaInit"\)/);
    assert.match(swift, /ApplicationDelegate\.shared\.initializeSDK\(\)/);
    assert.match(swift, /AppEvents\.shared\.activateApp\(\)/);
    assert.match(swift, /\.runOnQueue\(\.main\)/);
  });

  it('the JS side reaches the module on both platforms, never on web', () => {
    const js = code('modules/ape-meta-init/index.ts');
    assert.match(js, /Platform\.OS === 'web' \? null/);
    assert.ok(!/Platform\.OS === 'android' \? requireOptional/.test(js));
  });

  it('what keeps Android from counting twice: auto logging off, and the SDK version that was read', () => {
    // If either fails, re-read SessionLogger and InternalAppEventsLogger first.
    const guards = require_(join(ROOT, 'plugins/withMetaGuards.js'));
    assert.equal(guards.FACEBOOK_SDK_VERSION, '18.3.0');
    assert.match(code('app.config.js'), /autoLogAppEventsEnabled: false/);
    assert.match(code('src/features/growth/metaGate.ts'), /setAutoLogAppEventsEnabled\(false\)/);
  });
});

describe('the Apple prompt', () => {
  it('asks once, on a later run, after a quiet spell on Home', async () => {
    const p = phone({});
    p.engine.noteMemberGate('open');
    await p.settle();
    assert.ok(!p.names().includes('ask'), 'never at the start itself');
    await p.pass(CALM_DWELL_MS - CALM_CHECK_MS);
    assert.ok(!p.names().includes('ask'), 'not before the dwell');
    await p.pass(CALM_DWELL_MS);
    assert.equal(p.calls.filter((c) => c[0] === 'ask').length, 1);
    await p.pass(600_000);
    assert.equal(p.calls.filter((c) => c[0] === 'ask').length, 1);
  });

  it('never on the first run, or when storage could not say', async () => {
    for (const appSessions of [0, 1, null]) {
      const p = phone({ appSessions });
      p.engine.noteMemberGate('open');
      await p.settle();
      await p.pass(600_000);
      assert.ok(!p.names().includes('ask'), String(appSessions));
      assert.equal(p.engine.phase(), 'on', 'the events do not wait for it');
    }
  });

  for (const [what, calm] of [
    ['a popup', { modalsPresented: 1 }],
    ['a popup fading out', { modalHoldMs: 300 }],
    ['anywhere but Home (a lab, an intro video)', { onHome: false }],
    ['a lab preview', { labPreviewOpen: true }],
    ['the microphone in use', { micActive: true }],
    ['the app in the background', { appActive: false }],
  ] as [string, Partial<CalmFacts>][]) {
    it(`not during ${what}`, async () => {
      assert.equal(isCalmNow('open', { ...CALM, ...calm }), false);
      const p = phone({});
      p.engine.noteMemberGate('open');
      await p.settle();
      Object.assign(p.facts.calm, calm);
      await p.pass(600_000);
      assert.ok(!p.names().includes('ask'));
    });
  }

  it('a popup in the quiet spell restarts the wait', async () => {
    const p = phone({});
    p.engine.noteMemberGate('open');
    await p.pass(CALM_DWELL_MS - CALM_CHECK_MS);
    p.facts.calm.modalsPresented = 1;
    await p.pass(CALM_CHECK_MS);
    p.facts.calm.modalsPresented = 0;
    await p.pass(CALM_DWELL_MS - CALM_CHECK_MS);
    assert.ok(!p.names().includes('ask'));
    await p.pass(CALM_DWELL_MS);
    assert.ok(p.names().includes('ask'));
  });

  it('not during a member gate that comes back mid-wait', async () => {
    const p = phone({});
    p.engine.noteMemberGate('open');
    await p.settle();
    p.engine.noteMemberGate('checking');
    await p.pass(120_000);
    assert.ok(!p.names().includes('ask'));
  });

  it('iOS already answered: never asks, and honours the answer', async () => {
    for (const [status, granted] of [
      ['denied', false],
      ['granted', true],
    ] as [string, boolean][]) {
      const p = phone({ tracking: { granted, status } });
      p.engine.noteMemberGate('open');
      await p.pass(600_000);
      assert.ok(!p.names().includes('ask'));
      assert.deepEqual(p.calls.find((c) => c[0] === 'adId'), ['adId', granted]);
      assert.deepEqual(p.calls.find((c) => c[0] === 'ate'), ['ate', granted]);
    }
  });

  it('denied at the prompt: no ad id, and the same events keep going', async () => {
    const p = phone({ answer: { granted: false, status: 'denied' } });
    p.engine.noteMemberGate('open');
    await p.settle();
    await p.pass(CALM_DWELL_MS * 2);
    assert.ok(p.names().includes('ask'));
    assert.ok(!p.calls.some((c) => c[0] === 'adId' && c[1] === true));
    p.engine.notePurchase({ plan: 'annual', amount: 59.99, currency: 'USD' });
    assert.equal(p.calls.filter((c) => c[0] === 'purchase').length, 1);
  });

  it('allowed at the prompt turns ad id collection on', async () => {
    const p = phone({});
    p.engine.noteMemberGate('open');
    await p.settle();
    await p.pass(CALM_DWELL_MS * 2);
    assert.deepEqual(p.calls.filter((c) => c[0] === 'adId').at(-1), ['adId', true]);
  });

  it('no feature can read the answer', () => {
    assert.ok(!/export function \w*[Tt]racking/.test(code('src/features/growth/metaMeasurement.ts')));
    assert.deepEqual(Object.keys(phone({}).engine).sort(), [
      'noteAppOpen',
      'noteConsentWiped',
      'noteMemberGate',
      'notePurchase',
      'offerConsent',
      'phase',
      'withdrawConsent',
    ]);
  });

  it('the wording is the approved Option A, exactly', () => {
    const plugins = JSON.parse(read('app.json')).expo.plugins as unknown[];
    const tt = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-tracking-transparency') as [string, { userTrackingPermission: string }];
    assert.equal(
      tt[1].userTrackingPermission,
      'This helps us see whether our ads brought you to the app. Your lesson progress and study data are not used for this.',
    );
  });
});

describe('the native guards', () => {
  const guards = require_(join(ROOT, 'plugins/withMetaGuards.js'));
  const camera = require_(join(ROOT, 'plugins/withAndroidCameraOptional.js'));

  it('Android: the launch-time init provider is removed', () => {
    const out = guards.removeInitProvider({ manifest: { $: {}, application: [{ $: {} }] } });
    const [p] = out.manifest.application[0].provider;
    assert.equal(p.$['android:name'], 'com.facebook.internal.FacebookInitProvider');
    assert.equal(p.$['tools:node'], 'remove');
    assert.equal(out.manifest.$['xmlns:tools'], 'http://schemas.android.com/tools');
    guards.removeInitProvider(out);
    assert.equal(out.manifest.application[0].provider.length, 1, 'twice is once');
  });

  it('iOS: the launch-time app delegate is left out of Expo autolinking only', () => {
    const podfile = "target 'A' do\n  use_expo_modules!\n\n  config = use_native_modules!(config_command)\nend\n";
    const out = guards.excludeExpoAdapter(podfile);
    assert.ok(out.includes("  use_expo_modules!({ exclude: ['react-native-fbsdk-next'] })\n"));
    assert.ok(out.includes('use_native_modules!(config_command)'), 'the React Native pod stays');
    assert.equal(guards.excludeExpoAdapter(out), out);
  });

  it('iOS: a Podfile the guard cannot patch stops the build', () => {
    assert.throws(() => guards.excludeExpoAdapter("target 'A' do\nend\n"), /use_expo_modules!/);
  });

  it('Android: the SDK version is pinned, not 18.+', () => {
    const out = guards.pinFacebookSdk('buildscript {}\n');
    assert.ok(out.includes(`ext.facebookSdkVersion = '${guards.FACEBOOK_SDK_VERSION}'`));
    assert.equal(guards.pinFacebookSdk(out), out);
  });

  it('Android: the camera is optional, once', () => {
    const out = camera.markCameraOptional(
      camera.markCameraOptional({ manifest: { 'uses-feature': [{ $: { 'android:name': 'android.hardware.microphone' } }] } }),
    );
    const list = out.manifest['uses-feature'].filter((f: { $: Record<string, string> }) => f.$['android:name'] === 'android.hardware.camera');
    assert.equal(list.length, 1);
    assert.equal(list[0].$['android:required'], 'false');
  });

  it('app.json: AD_ID allowed, Privacy Sandbox blocked, both guards on', () => {
    const { expo } = JSON.parse(read('app.json'));
    assert.ok(expo.android.permissions.includes('com.google.android.gms.permission.AD_ID'));
    assert.ok(!expo.android.blockedPermissions.includes('com.google.android.gms.permission.AD_ID'));
    for (const p of ['AD_ID', 'ATTRIBUTION', 'CUSTOM_AUDIENCE', 'TOPICS']) {
      assert.ok(expo.android.blockedPermissions.includes(`android.permission.ACCESS_ADSERVICES_${p}`), p);
    }
    assert.ok(expo.plugins.includes('./plugins/withMetaGuards'));
    assert.ok(expo.plugins.includes('./plugins/withAndroidCameraOptional'));
  });
});

describe('the real phone facts', () => {
  const src = code('src/features/growth/metaMeasurement.ts');

  it('a lab preview counts only while one is open (the store always holds an object)', () => {
    assert.ok(src.includes('labPreviewOpen: getLabPreview().active'));
  });

  it('the region is the device Region setting, and values come from the build', () => {
    assert.match(src, /getLocales\(\)\?\.\[0\]\?\.regionCode/);
    assert.match(src, /metaMeasurement\?\.nativeValuesPresent === true/);
  });

  it('Android init runs before the library is touched, and iOS has none', () => {
    assert.match(src, /Platform\.OS === 'android' \? initializeMetaSdkAndroid\(\) : Promise\.resolve\(true\)/);
  });

  it('the prompt reads the review counters: no new key, no new write', () => {
    assert.ok(src.includes('appSessions: appSessionCount'));
    assert.ok(!src.includes('createLocalStore'));
    assert.ok(!src.includes('AsyncStorage'));
  });
});

describe('lazy loading', () => {
  it('nothing imports the Meta path statically', () => {
    for (const p of ['src/features/commercial/purchase.ts', 'src/features/commercial/PurchaseListenerRoot.tsx']) {
      const src = code(p);
      assert.ok(!/^\s*import[^;]*growth\//m.test(src.replace(/import\('[^']*'\)/g, '')), p);
      assert.ok(src.includes("require('../growth/metaMeasurement')"), p);
    }
  });

  it('the library is reached by sub-path, never its root', () => {
    const src = code('src/features/tools/capture/optionalModule.ts');
    assert.ok(!src.includes("require('react-native-fbsdk-next')"));
    assert.ok(src.includes("require('react-native-fbsdk-next/lib/commonjs/FBSettings')"));
    assert.ok(src.includes("require('react-native-fbsdk-next/lib/commonjs/FBAppEventsLogger')"));
  });
});

describe('purchase events to Aptabase (D98)', () => {
  const src = code('src/features/commercial/purchase.ts');

  it('all four events exist, in the purchase path', () => {
    for (const name of ['purchase_started', 'purchase_completed', 'purchase_failed', 'purchase_restored']) {
      assert.ok(src.includes(`'${name}'`), name);
    }
  });

  it('failures are fixed words: a store message can never travel', () => {
    const leaky = { code: 'unknown', message: 'Card for someone@example.com declined' };
    assert.deepEqual(storeFailureOf(leaky), { stage: 'store', reason: 'store_error' });
    assert.deepEqual(storeFailureOf({ code: 'user-cancelled' }), { stage: 'store', reason: 'cancelled' });
    assert.deepEqual(storeFailureOf({ code: 'E_USER_CANCELLED' }), { stage: 'store', reason: 'cancelled' });
    assert.deepEqual(storeFailureOf({ code: 'deferred-payment' }), { stage: 'store', reason: 'deferred' });
    assert.deepEqual(storeFailureOf({ code: 'E_ALREADY_OWNED' }), { stage: 'store', reason: 'already_owned' });
    assert.deepEqual(storeFailureOf(null), { stage: 'store', reason: 'store_error' });
    assert.deepEqual(verifyFailureOf('receipt_already_linked'), { stage: 'verify', reason: 'linked' });
    assert.deepEqual(verifyFailureOf('anything from a server'), { stage: 'verify', reason: 'not_verified' });
  });

  it('every prop survives the telemetry whitelist', () => {
    for (const f of [storeFailureOf({ code: 'x' }), verifyFailureOf(null), restoreFailureOf('error')!]) {
      const props = { plan: 'unknown', stage: f.stage, reason: f.reason };
      assert.deepEqual(sanitizeProps(props), props);
    }
  });

  it('events carry no message, id or token', () => {
    for (const m of src.matchAll(/trackEvent\('purchase_\w+'(?:, (\{[^}]*\}))?\)/g)) {
      assert.ok(!/\b(message|token|transaction\w*|email|uid|tag)\b/i.test(m[1] ?? ''), m[0]);
    }
  });

  it('a restore is not a sale: only the new-purchase path reaches Meta', () => {
    const restore = src.slice(src.indexOf('export async function restorePurchases'));
    assert.ok(!restore.includes('reportCompleted'));
    assert.ok(!restore.includes('noteMetaPurchase'));
    assert.equal(restoreFailureOf('restored'), null);
    assert.equal(restoreFailureOf('none'), null);
    assert.deepEqual(restoreFailureOf('linked'), { stage: 'restore', reason: 'linked' });
    assert.deepEqual(restoreFailureOf('surprise'), { stage: 'restore', reason: 'error' });
  });

  it('a renewal is not a sale', () => {
    assert.equal(isRenewalDelivery({ reasonIOS: 'renewal' }), true);
    assert.equal(isRenewalDelivery({ transactionReasonIOS: 'RENEWAL' }), true);
    assert.equal(isRenewalDelivery({ reasonIOS: 'purchase' }), false);
    assert.equal(isRenewalDelivery({}), false);
  });

  it('the charge comes from the store, whole or not at all', () => {
    const products = [
      { id: 'academy_monthly', price: 9.99, currency: 'USD' },
      { id: 'academy_annual', price: null, currency: 'USD' },
      { id: 'academy_lifetime', price: 99.99, currency: '' },
    ];
    assert.deepEqual(storeChargeFor(products, 'academy_monthly'), { amount: 9.99, currency: 'USD' });
    assert.equal(storeChargeFor(products, 'academy_annual'), null);
    assert.equal(storeChargeFor(products, 'academy_lifetime'), null);
    assert.equal(storeChargeFor(products, 'nope'), null);
    assert.equal(storeChargeFor([], 'academy_monthly'), null);
  });

  it('completed fires only behind a verified, finished purchase', () => {
    const listener = src.slice(src.indexOf('const result = await validateWithServer(purchase);'));
    const ok = listener.indexOf('if (result.ok)');
    const finish = listener.indexOf('iap.finishTransaction');
    const report = listener.indexOf('reportCompleted(purchase)');
    const caught = listener.indexOf("console.warn('[iap] finishTransaction failed:'");
    assert.ok(ok >= 0 && ok < finish && finish < report && report < caught, 'an unfinished purchase comes back and counts then');
  });

  it('the re-check of an unfinished Android purchase counts the same way', () => {
    const recheck = src.slice(src.indexOf('async function runUnfinishedRecheck'));
    const finish = recheck.indexOf('iap.finishTransaction');
    const report = recheck.indexOf('reportCompleted(p)');
    assert.ok(finish >= 0 && finish < report && report < recheck.indexOf('finished += 1'));
  });

  it('listener and re-check overlapping in one run still count once', () => {
    assert.match(src, /if \(key && countedPurchases\.has\(key\)\) return;/);
  });
});
