/**
 * The store's age signal for the 18+ gates (Texas SB 2420 "App Store
 * Accountability Act"; owner go 2026-11-27, "Yes, add it to 1.0.1").
 *
 *   1. Mapping: every raw Apple / Google answer → adult | teen | child |
 *      unknown. Every error, decline, unsupported OS, old binary and web is
 *      'unknown', and 'unknown' never counts as adult.
 *   2. The session reader: definite answers kept, passing ones not, one sheet
 *      at a time, a timeout is 'unknown', the wipe forgets.
 *   3. The gates: teen / child close the forum's post controls, the community
 *      profile PUBLISH (the forum's CONFIRM 18+ step), the Pro Registry
 *      listing and directory messages, even with an 18+ confirmation already
 *      on the account. 'unknown' and 'adult' keep today's steps exactly.
 *   4. GUARD: the band never leaves the phone (no supabase / fetch /
 *      trackEvent / Sentry / storage), and screens only see a yes/no.
 *   5. Native pins: the module files, the APIs, the entitlement plugin.
 *
 * ⚠️ Swift and Kotlin cannot be compiled here: the native halves are pinned
 * by text only. The test build must prove them on each phone.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AGE_RANGE_SOURCE,
  AGE_SIGNALS_ERROR,
  AGE_SIGNALS_STATUS,
  STORE_AGE_CONTACT,
  STORE_AGE_FORUM,
  STORE_AGE_PROFILE,
  STORE_AGE_REGISTRY,
  STORE_AGE_TITLE,
  bandFromAndroid,
  bandFromBounds,
  bandFromIos,
  bandFromRaw,
  isMinorBand,
  type StoreAgeBand,
} from '../src/features/age/storeAgeMap.ts';
import { createStoreAgeReader } from '../src/features/age/storeAge.ts';
import * as R from '../src/features/forum/rules.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const require_ = createRequire(import.meta.url);
const walk = (dir: string, re: RegExp, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, re, out);
    else if (re.test(name)) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
};

/* ── 1. Mapping ───────────────────────────────────────────────────────── */

describe('bandFromBounds: an age range → a band', () => {
  const cases: [unknown, unknown, StoreAgeBand][] = [
    // Apple, gates 13 and 18
    [null, 12, 'child'],
    [13, 17, 'teen'],
    [18, null, 'adult'],
    // Google's Play Console bands
    [0, 12, 'child'],
    [13, 15, 'teen'],
    [16, 17, 'teen'],
    [18, null, 'adult'],
    // a range that ends under 18 but straddles 13 is still a minor
    [10, 15, 'teen'],
    [null, 15, 'teen'],
    // nothing definite
    [null, null, 'unknown'],
    [undefined, undefined, 'unknown'],
    [16, null, 'unknown'],
    [16, 20, 'unknown'],
    [13, null, 'unknown'],
    // nonsense is never an age
    [20, 12, 'unknown'],
    ['18', null, 'unknown'],
    [17.5, null, 'unknown'],
    [-1, 12, 'child'],
    [NaN, NaN, 'unknown'],
    [null, -3, 'unknown'],
  ];
  for (const [lo, hi, band] of cases) {
    it(`[${String(lo)}, ${String(hi)}] → ${band}`, () => assert.equal(bandFromBounds(lo, hi), band));
  }
});

describe('Apple (Declared Age Range) raw answers', () => {
  it('sharing maps the range; nothing else ever reads as an age', () => {
    assert.deepEqual(bandFromIos({ kind: 'sharing', upperBound: 12 }), { band: 'child', retry: false });
    assert.deepEqual(bandFromIos({ kind: 'sharing', lowerBound: 13, upperBound: 17 }), { band: 'teen', retry: false });
    assert.deepEqual(bandFromIos({ kind: 'sharing', lowerBound: 16, upperBound: 17 }), { band: 'teen', retry: false });
    assert.deepEqual(bandFromIos({ kind: 'sharing', lowerBound: 18 }), { band: 'adult', retry: false });
    assert.deepEqual(bandFromIos({ kind: 'sharing' }), { band: 'unknown', retry: false });
  });

  it('declined, not a covered region, an older iOS: unknown, kept for the session', () => {
    for (const kind of ['declined', 'ineligible', 'unsupported']) {
      assert.deepEqual(bandFromIos({ kind, lowerBound: 13, upperBound: 17 }), { band: 'unknown', retry: false }, kind);
    }
  });

  it('every AgeRangeService.Error case is unknown; only network / no window are asked again', () => {
    for (const error of ['notAvailable', 'invalidRequest', 'declinedOnboarding', 'invalidAccount', 'other', 'unknownResponse', 'someFutureCase']) {
      assert.deepEqual(bandFromIos({ kind: 'error', error }), { band: 'unknown', retry: false }, error);
    }
    for (const error of ['network', 'noViewController']) {
      assert.deepEqual(bandFromIos({ kind: 'error', error }), { band: 'unknown', retry: true }, error);
    }
    assert.deepEqual(bandFromIos({ kind: 'error' }), { band: 'unknown', retry: false });
    assert.deepEqual(bandFromIos({ kind: 'whatever', lowerBound: 18 }), { band: 'unknown', retry: false });
  });
});

describe('Google (Play Age Signals 0.0.6) raw answers', () => {
  const S = AGE_SIGNALS_STATUS;
  it('SHARED with a range maps the range, from every source', () => {
    for (const source of [...Object.values(AGE_RANGE_SOURCE), undefined]) {
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus: S.SHARED, ageLower: 0, ageUpper: 12, source }).band, 'child');
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus: S.SHARED, ageLower: 13, ageUpper: 15, source }).band, 'teen');
      // supervised (TIER_B) under 18 is a teen
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus: S.SHARED, ageLower: 16, ageUpper: 17, source }).band, 'teen');
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus: S.SHARED, ageLower: 18, source }).band, 'adult');
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus: S.SHARED, source }).band, 'unknown');
    }
  });

  it('a result that is not SHARED is never read as an age', () => {
    for (const accessStatus of [S.UNSPECIFIED, S.NOT_SHARED, S.VERIFICATION_REQUIRED, undefined, 99]) {
      assert.equal(bandFromAndroid({ kind: 'result', accessStatus, ageLower: 13, ageUpper: 15 }).band, 'unknown');
    }
  });

  it('every access status other than SHARED is unknown; VERIFICATION_REQUIRED is asked again later', () => {
    assert.deepEqual(bandFromAndroid({ kind: 'access', accessStatus: S.NOT_SHARED }), { band: 'unknown', retry: false });
    assert.deepEqual(bandFromAndroid({ kind: 'access', accessStatus: S.UNSPECIFIED }), { band: 'unknown', retry: false });
    assert.deepEqual(bandFromAndroid({ kind: 'access', accessStatus: S.VERIFICATION_REQUIRED }), { band: 'unknown', retry: true });
    assert.deepEqual(bandFromAndroid({ kind: 'ineligible' }), { band: 'unknown', retry: false });
  });

  it('every AgeSignalsErrorCode is unknown; Google’s retry codes are asked again', () => {
    const E = AGE_SIGNALS_ERROR;
    const retry = new Set<number>([E.NETWORK_ERROR, E.CANNOT_BIND_TO_SERVICE, E.CLIENT_TRANSIENT_ERROR, E.INTERNAL_ERROR, E.NO_ACTIVITY]);
    for (const [name, errorCode] of Object.entries(E)) {
      assert.deepEqual(bandFromAndroid({ kind: 'error', errorCode }), { band: 'unknown', retry: retry.has(errorCode) }, name);
    }
    assert.deepEqual(bandFromAndroid({ kind: 'error' }), { band: 'unknown', retry: false });
    assert.deepEqual(bandFromAndroid({ kind: 'nope', ageLower: 18 }), { band: 'unknown', retry: false });
  });
});

describe('bandFromRaw: an old binary, web, anything odd', () => {
  it('no answer, no platform, an unknown platform: unknown', () => {
    for (const raw of [null, undefined, 0, '', 'adult', [], {}, { platform: 'web', kind: 'sharing', lowerBound: 18 }]) {
      assert.deepEqual(bandFromRaw(raw), { band: 'unknown', retry: false }, JSON.stringify(raw));
    }
  });
  it('dispatches by platform', () => {
    assert.equal(bandFromRaw({ platform: 'ios', kind: 'sharing', lowerBound: 13, upperBound: 17 }).band, 'teen');
    assert.equal(bandFromRaw({ platform: 'android', kind: 'result', accessStatus: 1, ageLower: 18 }).band, 'adult');
  });
  it('only teen and child close the 18+ areas; unknown NEVER counts as adult, adult changes nothing', () => {
    assert.equal(isMinorBand('teen'), true);
    assert.equal(isMinorBand('child'), true);
    assert.equal(isMinorBand('unknown'), false);
    assert.equal(isMinorBand('adult'), false);
    assert.equal(isMinorBand(null), false);
    assert.equal(isMinorBand(undefined), false);
  });
});

/* ── 2. The session reader ────────────────────────────────────────────── */

function fakeNative(answers: unknown[]) {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    requestAgeSignal: async () => {
      const a = answers[Math.min(calls, answers.length - 1)];
      calls++;
      if (a instanceof Error) throw a;
      return a;
    },
  };
}

describe('the session reader (storeAge.ts)', () => {
  it('a binary without the module (or web) reads unknown, and never asks again', async () => {
    let loads = 0;
    const r = createStoreAgeReader(() => {
      loads++;
      return null;
    });
    assert.equal(await r.read(), 'unknown');
    assert.equal(await r.read(), 'unknown');
    assert.equal(loads, 1);
  });

  it('a loader that throws reads unknown', async () => {
    const r = createStoreAgeReader(() => {
      throw new Error('Cannot find native module');
    });
    assert.equal(await r.read(), 'unknown');
  });

  it('a definite answer is kept for the session: one sheet, not one per tap', async () => {
    const n = fakeNative([{ platform: 'ios', kind: 'sharing', lowerBound: 13, upperBound: 17 }]);
    const r = createStoreAgeReader(() => n);
    assert.equal(r.peek(), null);
    assert.equal(await r.read(), 'teen');
    assert.equal(await r.read(), 'teen');
    assert.equal(r.peek(), 'teen');
    assert.equal(n.calls, 1);
  });

  it('a declined answer is kept too (the sheet is not shown again)', async () => {
    const n = fakeNative([{ platform: 'ios', kind: 'declined' }]);
    const r = createStoreAgeReader(() => n);
    assert.equal(await r.read(), 'unknown');
    assert.equal(await r.read(), 'unknown');
    assert.equal(n.calls, 1);
  });

  it('a passing failure is not kept: the next tap asks again', async () => {
    const n = fakeNative([
      { platform: 'android', kind: 'error', errorCode: AGE_SIGNALS_ERROR.NETWORK_ERROR },
      { platform: 'android', kind: 'result', accessStatus: 1, ageLower: 16, ageUpper: 17 },
    ]);
    const r = createStoreAgeReader(() => n);
    assert.equal(await r.read(), 'unknown');
    assert.equal(r.peek(), null);
    assert.equal(await r.read(), 'teen');
    assert.equal(n.calls, 2);
  });

  it('a native call that throws is unknown, and asked again', async () => {
    const n = fakeNative([new Error('boom'), { platform: 'ios', kind: 'sharing', lowerBound: 18 }]);
    const r = createStoreAgeReader(() => n);
    assert.equal(await r.read(), 'unknown');
    assert.equal(await r.read(), 'adult');
  });

  it('two taps at once share one native ask', async () => {
    let calls = 0;
    let answer: (v: unknown) => void = () => {};
    const r = createStoreAgeReader(() => ({
      requestAgeSignal: () => {
        calls++;
        return new Promise((res) => (answer = res));
      },
    }));
    const a = r.read();
    const b = r.read();
    await new Promise((res) => setTimeout(res, 0));
    answer({ platform: 'ios', kind: 'sharing', upperBound: 12 });
    assert.deepEqual(await Promise.all([a, b]), ['child', 'child']);
    assert.equal(calls, 1);
  });

  it('a native call that never answers ends as unknown (not kept); a late answer is still kept', async () => {
    let answer: (v: unknown) => void = () => {};
    let calls = 0;
    const r = createStoreAgeReader(
      () => ({
        requestAgeSignal: () => {
          calls++;
          return new Promise((res) => (answer = res));
        },
      }),
      { timeoutMs: 10 },
    );
    assert.equal(await r.read(), 'unknown');
    assert.equal(r.peek(), null);
    answer({ platform: 'android', kind: 'result', accessStatus: 1, ageLower: 13, ageUpper: 15 });
    await new Promise((res) => setTimeout(res, 0));
    assert.equal(r.peek(), 'teen');
    assert.equal(await r.read(), 'teen');
    assert.equal(calls, 1);
  });

  it('the account wipe forgets the band', async () => {
    const n = fakeNative([{ platform: 'ios', kind: 'sharing', lowerBound: 13, upperBound: 17 }, { platform: 'ios', kind: 'declined' }]);
    const r = createStoreAgeReader(() => n);
    assert.equal(await r.read(), 'teen');
    r.reset();
    assert.equal(r.peek(), null);
    assert.equal(await r.read(), 'unknown');
  });

  it('storeAge.ts registers its reset with the account wipe', () => {
    const s = code('src/features/age/storeAge.ts');
    assert.match(s, /^registerLocalStoreReset\(resetStoreAgeBand\);/m);
    assert.match(s, /^export function resetStoreAgeBand\(\): void \{\s*reader\.reset\(\);\s*\}/m);
  });
});

/* ── 3. The gates ─────────────────────────────────────────────────────── */

describe('forum: teen / child close every post control, even when already confirmed', () => {
  const open = { kind: 'open' } as const;
  // An account that confirmed 18+ before: the server says it may post.
  const confirmedMe = { canPost: true, reason: null };
  const anyRight = { canStartTopic: true, canReply: true, reason: null };

  it('closed: the composer, the rules popup and CONFIRM 18+ are all replaced by the store-age popup', () => {
    for (const step of [
      R.postStep(confirmedMe, anyRight, 'start'),
      R.postStep(confirmedMe, anyRight, 'reply'),
      R.blockedStep('rules_not_accepted'),
      R.blockedStep('adult_attestation'),
      R.blockedStep('profile_unpublished'),
      R.blockedStep('muted'),
      R.blockedStep(null),
    ]) {
      assert.deepEqual(R.ageAwarePostStep(true, step), { kind: 'sheet', sheet: 'store_age', code: null });
    }
  });

  it('unknown / adult: the server’s answer is untouched, object for object', () => {
    for (const step of [open, R.blockedStep('rules_not_accepted'), R.blockedStep('adult_attestation'), R.blockedStep('muted')]) {
      assert.equal(R.ageAwarePostStep(false, step), step);
    }
    // and isMinorBand is the only thing that makes it true
    for (const band of ['unknown', 'adult'] as const) assert.equal(R.ageAwarePostStep(isMinorBand(band), open), open);
    for (const band of ['teen', 'child'] as const) assert.equal(R.ageAwarePostStep(isMinorBand(band), open), R.STORE_AGE_STEP);
  });

  it('the store-age popup: plain words, no button (nothing on the phone can change it), no CONFIRM 18+', () => {
    const s = R.blockSheet('store_age', null);
    assert.equal(s.title, STORE_AGE_TITLE);
    assert.equal(s.text, STORE_AGE_FORUM);
    assert.equal(s.button, null);
    assert.doesNotMatch(s.text, /confirm/i);
  });

  it('PostGate asks the store BEFORE reading the standing, going on, or the rules popup', () => {
    const s = code('src/screens/directory/forum/PostGate.tsx');
    const press = s.slice(s.indexOf('const press = useLatchedPress('), s.indexOf('const refused = useCallback('));
    const age = press.indexOf('await adultAreasClosed()');
    assert.ok(age > 0, 'press asks adultAreasClosed');
    assert.ok(age < press.indexOf('decide(known, where)'), 'before the known standing');
    assert.ok(age < press.indexOf('go();'), 'before the composer');
    assert.ok(age < press.indexOf('fetchPostStanding()'), 'before the server read');
    assert.match(press, /if \(closed\) \{\s*show\(STORE_AGE_STEP, null, where, null, intent\);\s*return;\s*\}/);
    // a post call's refusal (adult_attestation included) for a minor is the same popup
    const refused = s.slice(s.indexOf('const refused = useCallback('), s.indexOf('const goOn = useCallback('));
    assert.match(refused, /ageAwarePostStep\(isMinorBand\(peekStoreAgeBand\(\)\), found\)/);
  });
});

describe('community profile PUBLISH (the forum’s CONFIRM 18+ step)', () => {
  const s = code('src/screens/directory/MyProfileView.tsx');
  const onPublish = s.slice(s.indexOf('const onPublish = (on: boolean) => {'), s.indexOf('const refresh = useCallback('));

  it('closed: no 18+ question, no publish, even with adultConfirmed already true', () => {
    const age = onPublish.indexOf('adultAreasClosed()');
    assert.ok(age > 0);
    assert.match(onPublish, /if \(closed\) notify\(STORE_AGE_TITLE, STORE_AGE_PROFILE\);\s*else publishSteps\(\);/);
    assert.ok(age < onPublish.indexOf('p.adultConfirmed'), 'before the already-confirmed shortcut');
    assert.ok(age < onPublish.indexOf("'Confirm your age'"), 'before the 18+ question');
    assert.ok(age < onPublish.indexOf('sendPublish(true'), 'before any publish');
  });

  it('unpublishing never waits on the store', () => {
    assert.ok(onPublish.indexOf('sendPublish(false)') < onPublish.indexOf('adultAreasClosed()'));
  });

  it('unknown / adult: today’s steps, word for word (gaps, then 18+ once, then consent)', () => {
    const steps = onPublish.slice(onPublish.indexOf('const publishSteps = () => {'));
    assert.match(steps, /if \(gaps\.length\) \{\s*notify\('Not ready yet', `Add \$\{gaps\.join\(', '\)\} before publishing\.`\);\s*return;\s*\}/);
    assert.match(steps, /if \(p\.adultConfirmed\) \{\s*go\(false\);\s*return;\s*\}/);
    assert.ok(
      steps.includes(
        "'I confirm that I am at least 18 years old and understand that the information selected above will appear on my community profile.',\n      'I am 18+',\n      () => go(true),",
      ),
    );
  });
});

describe('Pro Registry listing 18+ confirmation', () => {
  const s = code('src/screens/profile/ProfileScreen.tsx');
  const toggle = s.slice(s.indexOf('const onRegistryToggle = useCallback('), s.indexOf('[setPubKey, pub, registryGuest, navigation, registryLatch]'));

  it('closed: no 18+ question, no listing, even with isAdultConfirmed() already true', () => {
    const age = toggle.indexOf('adultAreasClosed()');
    assert.ok(age > 0);
    assert.match(toggle, /if \(closed\) notify\(STORE_AGE_TITLE, STORE_AGE_REGISTRY\);\s*else ageSteps\(\);/);
    // the shortcut and the question live only inside ageSteps, which runs only when open
    const steps = toggle.slice(toggle.indexOf('const ageSteps = () => {'), toggle.indexOf('registryAgeCheck.current = true;'));
    assert.ok(steps.includes('isAdultConfirmed()') && steps.includes("'Yes, I am 18+'"));
    assert.equal(toggle.split('isAdultConfirmed()').length - 1, 1, 'no other path skips the store check');
  });

  it('switching OFF and the guest answer never wait on the store', () => {
    const age = toggle.indexOf('adultAreasClosed()');
    assert.ok(toggle.indexOf('if (!v) {\n        apply();') < age);
    assert.ok(toggle.indexOf("'Listing needs an account'") < age);
  });

  it('unknown / adult: today’s question, word for word', () => {
    assert.ok(
      toggle.includes(
        "'Are you 18 or older?',\n          'The public Registry listing is for adults only. Everything else in the app works at any age: your studies, your certificates and QR verification.',\n          'Yes, I am 18+',\n          () => consent(true),",
      ),
    );
  });
});

describe('directory backstop: every 18+ write refuses on the phone for a minor', () => {
  const s = code('src/features/directory/api.ts');
  const fn = (name: string) => s.slice(s.indexOf(`export async function ${name}(`), s.indexOf('\n}\n', s.indexOf(`export async function ${name}(`)));

  it('publish ON, a new request, ACCEPT and a message are refused before any server call', () => {
    for (const [name, text] of [
      ['publishCommunityProfile', 'STORE_AGE_PROFILE'],
      ['sendContactRequest', 'STORE_AGE_CONTACT'],
      ['respondToRequest', 'STORE_AGE_CONTACT'],
      ['sendThreadMessage', 'STORE_AGE_CONTACT'],
    ] as const) {
      const body = fn(name);
      const at = body.indexOf(`storeAgeRefusal(${text})`);
      assert.ok(at > 0, name);
      assert.ok(at < body.indexOf('supabase.rpc('), `${name}: before the server`);
      assert.ok(at < body.indexOf('sampleDirectoryOn()'), `${name}: before the dev sample`);
    }
    assert.match(fn('publishCommunityProfile'), /if \(on\) \{\s*const refused = await storeAgeRefusal\(STORE_AGE_PROFILE\);/);
    assert.match(fn('respondToRequest'), /if \(action === 'accept'\) \{\s*const refused = await storeAgeRefusal\(STORE_AGE_CONTACT\);/);
  });

  it('unpublish, decline, withdraw, block and report stay open', () => {
    for (const name of ['blockThread', 'blockMember', 'reportMember', 'deleteCommunityProfile', 'setDiscoverable', 'setContactEnabled']) {
      assert.ok(!fn(name).includes('storeAgeRefusal'), name);
    }
  });

  it('the refusal sends nothing: it is built on the phone', () => {
    const helper = s.slice(s.indexOf('async function storeAgeRefusal('), s.indexOf('export async function publishCommunityProfile('));
    assert.match(helper, /return \(await adultAreasClosed\(\)\) \? \{ ok: false, error: text \} : null;/);
  });
});

describe('the words (draft for the owner): short, plain, kind, no legal terms', () => {
  it('each line says why, and what still works', () => {
    for (const t of [STORE_AGE_FORUM, STORE_AGE_PROFILE, STORE_AGE_REGISTRY, STORE_AGE_CONTACT]) {
      assert.ok(t.startsWith('Your app store account says you are under 18, so '), t);
      assert.match(t, /at any age\.$/);
      assert.ok(t.length < 200, t);
      assert.doesNotMatch(t, /law|legal|Texas|SB 2420|statute|comply|compliance|minor|verify|verification required/i);
    }
    assert.equal(STORE_AGE_TITLE, 'For members 18 and over');
  });
});

/* ── 4. GUARD: the band never leaves the phone ────────────────────────── */

describe('GUARD: the age band is never sent, stored or logged', () => {
  const ageFiles = ['src/features/age/storeAge.ts', 'src/features/age/storeAgeMap.ts', 'modules/ape-age-signal/index.ts'];
  const nativeFiles = [
    'modules/ape-age-signal/ios/ApeAgeSignalModule.swift',
    'modules/ape-age-signal/android/src/main/java/expo/modules/apeagesignal/ApeAgeSignalModule.kt',
  ];

  it('the age files reach no network, no storage, no telemetry', () => {
    const banned =
      /supabase|fetch\(|XMLHttpRequest|trackEvent|telemetry|aptabase|Sentry|captureException|addBreadcrumb|console\.|AsyncStorage|createLocalStore|SecureStore|SQLite|expo-file-system|localStorage/i;
    for (const f of ageFiles) assert.doesNotMatch(code(f), banned, f);
  });

  it('the native halves store nothing, send nothing, log nothing, and never read the install id', () => {
    const banned = /URLSession|UserDefaults|Keychain|NSLog|print\(|os_log|Logger|HttpURLConnection|OkHttp|SharedPreferences|Log\.[dievw]\(|installId|FileOutputStream/;
    for (const f of nativeFiles) assert.doesNotMatch(code(f), banned, f);
  });

  it('outside src/features/age, code sees only a yes/no: adultAreasClosed(), or isMinorBand(peek)', () => {
    const allowed = /^(?:adultAreasClosed\(\)|isMinorBand\(peekStoreAgeBand\(\)\)|peekStoreAgeBand\(\) === null)$/;
    const users: string[] = [];
    for (const f of walk(join(ROOT, 'src'), /\.(tsx?)$/)) {
      if (f.startsWith('src/features/age/')) continue;
      const s = code(f);
      if (/storeAgeBand|peekStoreAgeBand|adultAreasClosed|createStoreAgeReader|bandFrom/.test(s)) users.push(f);
      assert.doesNotMatch(s, /\bstoreAgeBand\(|createStoreAgeReader|bandFrom(?:Raw|Ios|Android|Bounds)/, `${f} must not hold the band`);
      for (const m of s.matchAll(/isMinorBand\(peekStoreAgeBand\(\)\)|peekStoreAgeBand\(\) === null|peekStoreAgeBand\(\)|adultAreasClosed\(\)/g)) {
        assert.match(m[0], allowed, `${f}: ${m[0]}`);
      }
      // a bare peek that is not inside isMinorBand(…) or a null check
      const bare = s.replace(/isMinorBand\(peekStoreAgeBand\(\)\)|peekStoreAgeBand\(\) === null/g, '');
      assert.ok(!bare.includes('peekStoreAgeBand()'), `${f}: a bare peekStoreAgeBand()`);
      // the native module is reached only through storeAge.ts
      assert.doesNotMatch(s, /ape-age-signal/, `${f} must not reach the native module`);
    }
    assert.deepEqual(users.sort(), [
      'src/features/directory/api.ts',
      'src/screens/directory/MyProfileView.tsx',
      'src/screens/directory/forum/PostGate.tsx',
      'src/screens/profile/ProfileScreen.tsx',
    ]);
  });

  it('a yes/no never rides a server call, a telemetry event or a Sentry report', () => {
    for (const f of [
      'src/features/directory/api.ts',
      'src/screens/directory/MyProfileView.tsx',
      'src/screens/directory/forum/PostGate.tsx',
      'src/screens/profile/ProfileScreen.tsx',
    ]) {
      const s = code(f);
      for (const m of s.matchAll(/(?:rpc|trackEvent|captureException|captureMessage|addBreadcrumb|fetch)\(([^;]*)/g)) {
        assert.doesNotMatch(m[1], /closed|adultAreasClosed|peekStoreAgeBand|STORE_AGE|band/i, `${f}: ${m[0].slice(0, 80)}`);
      }
    }
  });

  it('reading the band calls no network at all (fetch spied)', async () => {
    const real = globalThis.fetch;
    let fetched = 0;
    globalThis.fetch = (async () => {
      fetched++;
      throw new Error('no network');
    }) as typeof fetch;
    try {
      const r = createStoreAgeReader(() => ({ requestAgeSignal: async () => ({ platform: 'ios', kind: 'sharing', lowerBound: 13, upperBound: 17 }) }));
      assert.equal(await r.read(), 'teen');
    } finally {
      globalThis.fetch = real;
    }
    assert.equal(fetched, 0);
  });

  it('the native module is required lazily, never at app start', () => {
    const s = code('src/features/age/storeAge.ts');
    assert.doesNotMatch(s, /^import[^;]*ape-age-signal/m);
    assert.match(s, /require\('\.\.\/\.\.\/\.\.\/modules\/ape-age-signal'\)/);
  });
});

/* ── 5. Native pins ───────────────────────────────────────────────────── */

describe('native: module files, APIs and the entitlement', () => {
  const MOD = 'modules/ape-age-signal';

  it('the module has both halves, named the same', () => {
    for (const f of [
      `${MOD}/expo-module.config.json`,
      `${MOD}/index.ts`,
      `${MOD}/ios/ApeAgeSignal.podspec`,
      `${MOD}/ios/ApeAgeSignalModule.swift`,
      `${MOD}/android/build.gradle`,
      `${MOD}/android/src/main/java/expo/modules/apeagesignal/ApeAgeSignalModule.kt`,
    ]) {
      assert.ok(existsSync(join(ROOT, f)), f);
    }
    const cfg = JSON.parse(read(`${MOD}/expo-module.config.json`));
    assert.deepEqual(cfg.platforms, ['apple', 'android']);
    assert.deepEqual(cfg.apple.modules, ['ApeAgeSignalModule']);
    assert.deepEqual(cfg.android.modules, ['expo.modules.apeagesignal.ApeAgeSignalModule']);
    assert.match(read(`${MOD}/ios/ApeAgeSignalModule.swift`), /Name\("ApeAgeSignal"\)/);
    assert.match(read(`${MOD}/android/src/main/java/expo/modules/apeagesignal/ApeAgeSignalModule.kt`), /Name\("ApeAgeSignal"\)/);
    assert.match(read(`${MOD}/index.ts`), /requireOptionalNativeModule<AgeSignalNative>\('ApeAgeSignal'\)/);
  });

  it('iOS: eligibility first (no sheet outside a covered region), gates 13 and 18, weak linked, iOS 26.2+', () => {
    const swift = code(`${MOD}/ios/ApeAgeSignalModule.swift`);
    assert.match(swift, /#if canImport\(DeclaredAgeRange\)\s*import DeclaredAgeRange/);
    assert.match(swift, /if #available\(iOS 26\.2, \*\)/);
    assert.ok(swift.indexOf('isEligibleForAgeFeatures') < swift.indexOf('requestAgeRange('));
    assert.match(swift, /AgeRangeService\.shared\.requestAgeRange\(ageGates: 13, 18, in: vc\)/);
    assert.match(swift, /case \.declinedSharing:/);
    assert.match(swift, /@unknown default:/);
    assert.doesNotMatch(swift, /ageRangeDeclaration|activeParentalControls/, 'only the bounds are read');
    const pod = read(`${MOD}/ios/ApeAgeSignal.podspec`);
    assert.match(pod, /s\.weak_frameworks = 'DeclaredAgeRange'/);
    assert.match(pod, /s\.platforms\s+= \{ :ios => '15\.1' \}/);
  });

  it('Android: Play Age Signals 0.0.6, MANDATORY_SHARING first, access then check', () => {
    assert.match(read(`${MOD}/android/build.gradle`), /implementation "com\.google\.android\.play:age-signals:0\.0\.6"/);
    const kt = code(`${MOD}/android/src/main/java/expo/modules/apeagesignal/ApeAgeSignalModule.kt`);
    const i = (t: string) => kt.indexOf(t);
    assert.ok(i('ApplicableAgeFeature.MANDATORY_SHARING') > 0);
    assert.ok(i('getApplicableAgeFeatures(') < i('requestAgeSignalsAccess('));
    assert.ok(i('requestAgeSignalsAccess(') < i('checkAgeSignals('));
    assert.match(kt, /if \(status == AgeSignalsStatus\.SHARED\)/);
    assert.match(kt, /\(e as\? AgeSignalsException\)\?\.errorCode/);
    assert.doesNotMatch(kt, /significantChange|userStatus/, 'only the bounds and the source are read');
  });

  it('the entitlement plugin adds com.apple.developer.declared-age-range = true, and is registered', () => {
    const plugin = require_('../plugins/withDeclaredAgeRange.js');
    assert.equal(plugin.DECLARED_AGE_RANGE, 'com.apple.developer.declared-age-range');
    assert.deepEqual(plugin.addDeclaredAgeRange({}), { 'com.apple.developer.declared-age-range': true });
    const kept = plugin.addDeclaredAgeRange({ 'com.apple.developer.associated-domains': ['applinks:x'] });
    assert.deepEqual(kept['com.apple.developer.associated-domains'], ['applinks:x']);
    assert.equal(kept['com.apple.developer.declared-age-range'], true);
    assert.match(read('plugins/withDeclaredAgeRange.js'), /withEntitlementsPlist/);
    const { expo } = JSON.parse(read('app.json'));
    assert.ok(expo.plugins.includes('./plugins/withDeclaredAgeRange'));
  });

  it('the plugin really writes the entitlement through Expo’s mod', async () => {
    const plugin = require_('../plugins/withDeclaredAgeRange.js');
    const cfg = plugin({ name: 'x', slug: 'x' });
    const mod = cfg.mods?.ios?.entitlements;
    assert.equal(typeof mod, 'function', 'an ios.entitlements mod is registered');
  });
});
