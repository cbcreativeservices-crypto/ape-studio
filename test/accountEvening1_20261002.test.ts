/**
 * ACCOUNT + COMMERCE — evening toddler hunt, PASS 1 (2026-10-02).
 *
 * Behaviour where the module loads under Node (a fake AsyncStorage whose
 * reads can THROW, a stub Supabase client), source-reading where it needs
 * React Native. Each test failed against the pre-fix file (R2).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__AE1_AS__ = AS;
g.__AE1_FAIL_READS__ = false;
g.__AE1_SUBS__ = { data: null, error: { message: 'offline' } };
g.__AE1_SESSION__ = { user: { id: 'u1' } };

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__AE1_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__AE1_FAIL_READS__) throw new Error('storage read failed');
         return s.has(k) ? s.get(k) : null;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
     };`,
  );
const FAKE_SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(
    `export const supabase = {
       auth: {
         async getSession() { return { data: { session: globalThis.__AE1_SESSION__ } }; },
         async getUser() { return { data: { user: globalThis.__AE1_SESSION__?.user ?? null } }; },
       },
       from() {
         return { select() { return Promise.resolve(globalThis.__AE1_SUBS__); } };
       },
       rpc() { return Promise.resolve({ data: null, error: null }); },
     };`,
  );
const FAKE_PROFILE_API =
  'data:text/javascript,' +
  encodeURIComponent(
    `export async function fetchMyRegistryName() { return null; }
     export async function fetchMyRegistryListing() { return { state: 'none' }; }
     export async function saveMyRegistryName() { return true; }
     export async function setRegistryListing() { return true; }`,
  );
const FAKE_AUTH_API =
  'data:text/javascript,' +
  encodeURIComponent(`export const AUTH_CALL_MS = 15000; export async function ensureSession() { return null; }`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: FAKE_SUPABASE, shortCircuit: true };
    if (specifier === './api' && context.parentURL?.includes('features/profile/')) return { url: FAKE_PROFILE_API, shortCircuit: true };
    if (specifier === '../auth/api' && context.parentURL?.includes('features/commercial/')) return { url: FAKE_AUTH_API, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const pp = await import('../src/features/profile/publicProfile.ts');
const wc = await import('../src/features/notifications/weeklyConcept.ts');
const ca = await import('../src/features/commercial/commercialAuth.ts');

const STORED = {
  name: 'Sam',
  registryName: 'Samantha Reyes',
  email: 'sam@example.com',
  interests: ['Live Sound', 'Mixing'],
  primaryInterest: 'Mixing',
  bio: 'FOH engineer',
  contactConsent: false,
  showInRegistry: false,
};

test('public profile: a keystroke after a FAILED device read never writes blanks over the stored profile', async () => {
  AS.clear();
  AS.set('ape:publicProfile', JSON.stringify(STORED));
  g.__AE1_FAIL_READS__ = true;
  const { profile, deviceReadFailed } = await pp.loadPublicProfileChecked();
  assert.equal(deviceReadFailed, true);
  assert.equal(profile.email, '', 'the screen is shown the empty stand-in');

  // Still unreadable: the typed character must not replace the stored record.
  const baseline = pp.unreadBaseline(profile);
  await pp.savePublicProfile({ ...profile, bio: 'F' }, baseline);
  assert.deepEqual(JSON.parse(AS.get('ape:publicProfile')!), STORED, 'an unreadable save wrote over the stored copy');

  // Readable again: only the field the user changed is laid over the record.
  g.__AE1_FAIL_READS__ = false;
  await pp.savePublicProfile({ ...profile, bio: 'FOH + monitors' }, baseline);
  const after = JSON.parse(AS.get('ape:publicProfile')!);
  assert.equal(after.bio, 'FOH + monitors');
  assert.equal(after.email, 'sam@example.com', 'the device-only contact email was wiped');
  assert.equal(after.name, 'Sam');
  assert.deepEqual(after.interests, ['Live Sound', 'Mixing']);
});

test('public profile: typing BEFORE the load lands lays only the typed field over the stored record', async () => {
  AS.clear();
  AS.set('ape:publicProfile', JSON.stringify(STORED));
  g.__AE1_FAIL_READS__ = false;
  // The screen's first-render baseline: it shows EMPTY until the load lands.
  await pp.savePublicProfile({ ...pp.EMPTY_PUBLIC_PROFILE, bio: 'x' }, pp.unreadBaseline());
  const after = JSON.parse(AS.get('ape:publicProfile')!);
  assert.equal(after.bio, 'x');
  assert.equal(after.email, 'sam@example.com');
  assert.equal(after.registryName, 'Samantha Reyes');
});

test('ProfileScreen saves through the baseline until a load that READ the device copy is applied', () => {
  const s = read('src/screens/profile/ProfileScreen.tsx');
  assert.match(s, /const unreadRef = useRef<UnreadBaseline \| null>\(unreadBaseline\(\)\);/, 'the first render must start in baseline mode');
  assert.match(s, /void savePublicProfile\(pub, unreadRef\.current\);/);
  assert.match(s, /unreadRef\.current = deviceReadFailed \? unreadBaseline\(loaded\) : null;/);
  // Cleared only inside the not-dirty branch (a load dropped for typed edits keeps the baseline).
  const load = s.slice(s.indexOf('void loadPublicProfileChecked()'), s.indexOf('setRegistryVerified(isRegistryStateKnown())'));
  assert.match(load, /if \(!dirtyRef\.current\) \{\s*setPub\(loaded\);\s*unreadRef\.current =/);
});

test('weekly concept: a failed subscriptions read is NULL, never the empty list that seeds the defaults', async () => {
  g.__AE1_SESSION__ = { user: { id: 'u1' } };
  g.__AE1_SUBS__ = { data: null, error: { message: 'offline' } };
  assert.equal(await wc.fetchWeeklySubscriptions(), null);
  g.__AE1_SESSION__ = null; // a stalled getSession reads as no session
  assert.equal(await wc.fetchWeeklySubscriptions(), null);
  g.__AE1_SESSION__ = { user: { id: 'u1' } };
  g.__AE1_SUBS__ = { data: [], error: null };
  assert.deepEqual(await wc.fetchWeeklySubscriptions(), [], 'a real empty answer stays empty');
});

test('Settings writes no weekly-concept schedule from the stand-in defaults', () => {
  const s = read('src/screens/settings/SettingsScreen.tsx');
  // The loader marks the schedule known only from a real read.
  const loader = s.slice(s.indexOf('const loadCatSched = useCallback'), s.indexOf('const logoutPending'));
  assert.match(loader, /if \(!subs\) \{/);
  assert.match(loader, /catSchedKnown\.current = true;/);
  // A single category save refuses while unknown.
  const setCat = s.slice(s.indexOf('const setCategory = useCallback'), s.indexOf('const weeklyBusyRef'));
  assert.match(setCat, /if \(!catSchedKnown\.current\) return;/);
  // The master switch re-reads, and refuses to write the seven rows from defaults.
  const on = s.slice(s.indexOf('const setWeeklyOn = useCallback'), s.indexOf('const rowsOk = await saveAllCategorySchedules(seeded);'));
  assert.match(on, /if \(!catSchedKnown\.current\) \{\s*const loaded = await loadCatSched\(\);\s*if \(!loaded\) \{/);
  assert.match(on, /const seeded = \{ \.\.\.base \};/);
  assert.doesNotMatch(on, /const seeded = \{ \.\.\.catSched \};/);
  // The rows (and their pickers) render only from a real read; a failure shows RETRY.
  assert.match(s, /prefs\?\.notify_weekly_concept && catSchedFailed \?/);
  assert.match(s, /prefs\?\.notify_weekly_concept && catSchedLoaded\s*\? WEEKLY_CONCEPT_CATEGORIES\.map/);
});

test('local reminders: a sync asked for while another runs is run after it, not dropped', () => {
  const s = read('src/features/notifications/localSchedule.ts');
  const fn = s.slice(s.indexOf('export async function syncLocalNotifications'));
  assert.match(fn, /if \(syncing\) \{\s*\/\/[^\n]*\n[^\n]*\n\s*rerunWith = s;\s*return;\s*\}/, 'an overlapping sync is still dropped');
  const fin = fn.slice(fn.lastIndexOf('} finally {'));
  assert.match(fin, /syncing = false;\s*const next = rerunWith;\s*rerunWith = null;\s*if \(next\) \{/);
  assert.match(fin, /void syncLocalNotifications\(next\)\.catch/);
});

test('permission explainer: two taps on ALLOW run the OS request once', () => {
  const s = read('src/features/permissions/PermissionPrompt.tsx');
  assert.doesNotMatch(s, /useState<\(\(r: FlowResult\) => void\) \| null>/, 'the resolver is still state');
  const allow = s.slice(s.indexOf('const onAllow = useCallback'), s.indexOf('const onDecline = useCallback'));
  // Claimed synchronously, before any await.
  assert.match(allow, /const resolve = pendingRef\.current;\s*pendingRef\.current = null;/);
  assert.match(allow, /if \(!resolve\) return;/);
  assert.ok(allow.indexOf('pendingRef.current = null') < allow.indexOf('await setAskMode'), 'claimed after an await');
  const decline = s.slice(s.indexOf('const onDecline = useCallback'), s.indexOf('const promptProps'));
  assert.match(decline, /const resolve = pendingRef\.current;\s*pendingRef\.current = null;/);
});

test('signup: an unreadable glossary record migrates nothing instead of blocking the account', async () => {
  AS.clear();
  g.__AE1_FAIL_READS__ = true;
  try {
    assert.deepEqual(await ca.collectFavoritesMigration(), { favorites: [], recent: [] });
  } finally {
    g.__AE1_FAIL_READS__ = false;
  }
});

test('push registration never rejects (the Weekly switch awaits it after showing ON)', () => {
  const s = read('src/features/notifications/push.ts');
  const fn = s.slice(s.indexOf('export async function registerAndSavePushToken'), s.indexOf('async function registerAndSavePushTokenOnce'));
  assert.match(fn, /try \{\s*return await registerAndSavePushTokenOnce\(\);\s*\} catch/);
  assert.match(fn, /return null;/);
});
