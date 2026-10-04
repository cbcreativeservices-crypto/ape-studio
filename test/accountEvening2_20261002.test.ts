/**
 * ACCOUNT + COMMERCE — evening toddler hunt, PASS 2 (2026-10-02).
 *
 * Behaviour where the module loads under Node (settings store on a fake
 * AsyncStorage whose WRITES can throw), source-reading where it needs React
 * Native. Each test failed against the pre-fix file (R2).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
g.__DEV__ = false;
g.__AE2_AS__ = new Map<string, string>();
g.__AE2_FAIL_WRITES__ = false;
g.__AE2_SYNCS__ = [] as unknown[];

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__AE2_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) {
      if (globalThis.__AE2_FAIL_WRITES__) throw new Error('storage full');
      s.set(k, v);
    },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
  };`);
const STUBS: Record<string, string> = {
  'lib/supabase': mod(`export const supabase = { auth: { async getSession() { return { data: { session: null } }; } }, from() { throw new Error('no reads'); } };`),
  'lib/getSessionSafe': mod(`export async function hasSafeSession() { return false; }`),
  'notifications/localSchedule': mod(`
    export function requestLocalNotifSync(s) { globalThis.__AE2_SYNCS__.push(s); }
    export function setLocalSettingsUnreadable() {}`),
  './a11y': mod(`export function applyA11yFromSettings() {} export function resetA11y() {}`),
  'audio/leaveAppMute': mod(`export const MUTE_ON_LEAVE_DEFAULT = true; export function setMuteOnLeave() {}`),
  'notifications/curatedTermLists': mod(`export const HAS_MISUNDERSTOOD_TERMS = false; export const HAS_ODD_TERMS = false;`),
  'account/myUserRow': mod(`export async function myUserRow() { return null; }`),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (context.parentURL?.includes('features/settings/store')) {
      for (const [tail, url] of Object.entries(STUBS)) {
        if (specifier === tail || specifier.endsWith('/' + tail.replace(/^\.\//, ''))) return { url, shortCircuit: true };
      }
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const store = await import('../src/features/settings/store.ts');

test('settings: a device write that throws never rejects, and the reminders still follow the switch', async () => {
  const loaded = await store.loadLocalSettings();
  g.__AE2_FAIL_WRITES__ = true;
  (g.__AE2_SYNCS__ as unknown[]).length = 0;
  try {
    const next = { ...loaded, notifyDailyStudy: !loaded.notifyDailyStudy };
    // Every Settings caller is `void saveLocalSettings(next).then(...)`, no catch.
    await assert.doesNotReject(store.saveLocalSettings(next));
    assert.equal((g.__AE2_SYNCS__ as unknown[]).length, 1, 'the reminder reschedule was skipped');
  } finally {
    g.__AE2_FAIL_WRITES__ = false;
  }
});

test('entitlement: a refresh that applies a tier arms the expires_at recheck, as the derive does', () => {
  const s = read('src/features/commercial/EntitlementProvider.tsx');
  assert.match(s, /armExpiryRef\.current = armExpiryRecheck;/);
  const refresh = s.slice(s.indexOf('const refreshEntitlement = useCallback'), s.indexOf('const setCommercialMode = useCallback'));
  assert.match(refresh, /const tier = academyTierFromRows\(rows\);/);
  assert.match(refresh, /setEntitlementState\(tier\);\s*armExpiryRef\.current\(tier === 'academy' \? accessEndsAt\(rows\) : null\);/);
});

test('push: the token save result is reported, and Weekly says when this phone was not registered', () => {
  const p = read('src/features/notifications/push.ts');
  const once = p.slice(p.indexOf('async function registerAndSavePushTokenOnce'), p.indexOf('function payloadFromResponse'));
  assert.match(once, /if \(!uid\) return \{ token, saved: false \};/);
  assert.match(once, /return \{ token, saved: !error && !!data\?\.length \};/);
  const s = read('src/screens/settings/SettingsScreen.tsx');
  const on = s.slice(s.indexOf('const setWeeklyOn = useCallback'));
  assert.match(on, /const \{ token, saved: tokenSaved \} = await registerAndSavePushTokenChecked\(\);/);
  assert.match(on, /\} else if \(!tokenSaved\) \{\s*\/\/[^\n]*\n[^\n]*\n\s*notify\(/);
});

test('Settings: a weekly-concept category save that fails is put back and reported, not shown as saved', () => {
  const s = read('src/screens/settings/SettingsScreen.tsx');
  const fn = s.slice(s.indexOf('const setCategory = useCallback'), s.indexOf('const weeklyBusyRef'));
  assert.match(fn, /\.then\(\(\) => saveCategorySchedule\(category, next\)\)\s*\.catch\(\(\) => false\)\s*\.then\(\(ok\) => \{/);
  assert.match(fn, /if \(ok\) return;\s*setCatSched\(\(p\) => \(p\[category\] === next \? \{ \.\.\.p, \[category\]: before \} : p\)\);\s*notify\(/);
});
