/**
 * No Meta in 1.0.1 (owner 2026-11-27, 21:55 PT): "make it clearly compliant
 * with apple", no extra permission screen, "track as little as possible as a
 * promise to my users". iOS and Android the same.
 *
 * Replaces the Meta tests (metaConsent_20261105, metaMeasurement_20261105,
 * metaGuestNoOptIn_20261111). What they pinned that still ships is kept here:
 * the Android camera stays optional, and the Aptabase purchase events (D98).
 *
 * Meta can come back only with a fresh owner decision; this file then goes too.
 *
 * ⚠️ app.json is a fingerprint input: the manifest change lands only with a
 * native build. Confirm the built APK's merged manifest has no AD_ID.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  isRenewalDelivery,
  restoreFailureOf,
  storeFailureOf,
  verifyFailureOf,
} from '../src/features/commercial/iapProducts.ts';
import { sanitizeProps } from '../src/features/telemetry/scrub.ts';

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

const pkg = JSON.parse(read('package.json'));
const { expo } = JSON.parse(read('app.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

describe('no Meta SDK, module, plugin or keys', () => {
  it('no Facebook/Meta dependency, and no Meta-only helper library', () => {
    for (const name of Object.keys(deps)) assert.ok(!/fbsdk|facebook/i.test(name), name);
    // expo-localization was there only for the Meta region gate.
    assert.equal(deps['expo-localization'], undefined);
    assert.equal(deps['expo-tracking-transparency'], undefined);
  });

  it('the lock file carries no Facebook SDK', () => {
    assert.ok(!read('package-lock.json').includes('react-native-fbsdk-next'));
  });

  it('no ape-meta-init module, no withMetaGuards plugin, no growth/meta* files', () => {
    assert.ok(!existsSync(join(ROOT, 'modules/ape-meta-init')));
    assert.ok(!existsSync(join(ROOT, 'plugins/withMetaGuards.js')));
    const growth = join(ROOT, 'src/features/growth');
    if (existsSync(growth)) assert.deepEqual(readdirSync(growth).filter((f) => /^meta/i.test(f)), []);
  });

  it('no Meta keys in the build config or the env example', () => {
    if (existsSync(join(ROOT, 'app.config.js'))) {
      assert.ok(!/META_|fbsdk|facebook|metaMeasurement/i.test(read('app.config.js')));
    }
    assert.ok(!/META_APP_ID|META_CLIENT_TOKEN|fbsdk/i.test(read('.env.example')));
    const appJson = read('app.json');
    assert.ok(!/fbsdk|facebook|withMetaGuards|metaMeasurement/i.test(appJson));
    assert.ok(!expo.plugins.some((p: unknown) => /localization|tracking-transparency|fbsdk/.test(JSON.stringify(p))));
  });

  it('no app code, local module or plugin reaches Meta', () => {
    const files = [
      ...walk(join(ROOT, 'src'), /\.(tsx?|jsx?)$/),
      ...walk(join(ROOT, 'modules'), /\.(kt|java|swift|m|mm|tsx?|podspec|gradle)$/),
      ...walk(join(ROOT, 'plugins'), /\.js$/),
    ];
    const banned =
      /fbsdk|FBSDK|FacebookSdk|facebook\.com|graph\.facebook|AppEventsLogger|ape-meta-init|metaMeasurement|metaGate|metaConsent|advertiserID|AdvertiserID|AutoLogAppEvents|ACCESS_ADSERVICES|gms\.permission\.AD_ID|expo-tracking-transparency|requestTrackingPermissions|ATTrackingManager/;
    for (const f of files) assert.ok(!banned.test(read(f)), f);
  });
});

describe('iOS: no tracking, no ATT', () => {
  it('no NSUserTrackingUsageDescription, no tracking plugin, no tracking domains', () => {
    const ios = expo.ios ?? {};
    assert.equal(ios.infoPlist?.NSUserTrackingUsageDescription, undefined);
    assert.ok(!read('app.json').includes('NSUserTrackingUsageDescription'));
    const manifest = ios.privacyManifests ?? {};
    assert.ok(manifest.NSPrivacyTracking !== true, 'the app never declares tracking');
    assert.deepEqual(manifest.NSPrivacyTrackingDomains ?? [], []);
  });
});

describe('Android: no advertising id in the merged manifest', () => {
  it('AD_ID and the Privacy Sandbox ad ids are blocked (Expo writes tools:node="remove")', () => {
    for (const p of [
      'com.google.android.gms.permission.AD_ID',
      'android.permission.ACCESS_ADSERVICES_AD_ID',
      'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
    ]) {
      assert.ok(expo.android.blockedPermissions.includes(p), p);
      assert.ok(!expo.android.permissions.includes(p), `${p} is never asked for`);
    }
  });

  it('the Expo plugin really turns a blocked name into tools:node="remove"', () => {
    const { AndroidConfig } = require_('expo/config-plugins');
    const manifest = {
      manifest: {
        $: {},
        'uses-permission': [{ $: { 'android:name': 'com.google.android.gms.permission.AD_ID' } }],
      },
    };
    const out = AndroidConfig.Permissions.addBlockedPermissions(manifest, ['com.google.android.gms.permission.AD_ID']);
    const rows = out.manifest['uses-permission'].filter(
      (r: { $: Record<string, string> }) => r.$['android:name'] === 'com.google.android.gms.permission.AD_ID',
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].$['tools:node'], 'remove');
  });

  it('the camera stays optional, once (kept from the Meta tests)', () => {
    assert.ok(expo.plugins.includes('./plugins/withAndroidCameraOptional'));
    const camera = require_(join(ROOT, 'plugins/withAndroidCameraOptional.js'));
    const out = camera.markCameraOptional(
      camera.markCameraOptional({ manifest: { 'uses-feature': [{ $: { 'android:name': 'android.hardware.microphone' } }] } }),
    );
    const list = out.manifest['uses-feature'].filter((f: { $: Record<string, string> }) => f.$['android:name'] === 'android.hardware.camera');
    assert.equal(list.length, 1);
    assert.equal(list[0].$['android:required'], 'false');
  });
});

describe('Settings: no Ad measurement row', () => {
  it('the row and its words are gone', () => {
    const s = read('src/screens/settings/SettingsScreen.tsx');
    assert.ok(!/Ad measurement|AdMeasurement|adMeasurement|META_CONSENT|useMetaConsent/.test(s));
  });

  it('no consent popup copy anywhere in the app', () => {
    for (const f of walk(join(ROOT, 'src'), /\.tsx?$/)) {
      const src = read(f);
      assert.ok(!/Help us measure our ads|tell Meta|I'm 18\+ and agree/.test(src), f);
    }
  });
});

describe('purchase events to Aptabase stay (D98)', () => {
  const src = code('src/features/commercial/purchase.ts');

  it('all four events exist, in the purchase path, and nothing else is told', () => {
    for (const name of ['purchase_started', 'purchase_completed', 'purchase_failed', 'purchase_restored']) {
      assert.ok(src.includes(`'${name}'`), name);
    }
    assert.ok(!/growth\/|Meta/.test(src));
  });

  it('the update-reload block stays in the purchase path', () => {
    assert.match(src, /blockUpdateReloadForSession/);
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

  it('a restore is not a sale', () => {
    const restore = src.slice(src.indexOf('export async function restorePurchases'));
    assert.ok(!restore.includes('reportCompleted'));
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

  it('completed fires only behind a verified, finished purchase', () => {
    const listener = src.slice(src.indexOf('const result = await validateWithServer(purchase);'));
    const ok = listener.indexOf('if (result.ok)');
    const finish = listener.indexOf('iap.finishTransaction');
    const report = listener.indexOf('reportCompleted(purchase)');
    const caught = listener.indexOf("console.warn('[iap] finishTransaction failed:'");
    assert.ok(ok >= 0 && ok < finish && finish < report && report < caught);
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
