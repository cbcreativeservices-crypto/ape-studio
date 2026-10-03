/**
 * ACCOUNT + COMMERCE — hunt 6 (2026-10-03).
 *
 * 1. Settings rendered DEFAULT_LOCAL_SETTINGS until its own load landed, and
 *    every row saves the WHOLE object on tap. A toggle tapped in that window
 *    (open a section, tap a switch while the storage read is still queued)
 *    wrote defaults + that one change over the stored record: every reminder
 *    the learner had switched on, haptics, the a11y choices — gone. The store
 *    now takes the copy the screen showed (`unreadShown`) and lays only the
 *    changed fields over the stored record, as it already did after a failed
 *    read; the screen passes it until its load has landed.
 *
 * 2. The reminder scheduler wrote its new-terms bookkeeping record IN THE
 *    MIDDLE of a run, after the sweep had cancelled every `ape.notif.*`
 *    reminder. A refused write (a full or locked device store) threw out of
 *    the run: term of the day, the curated terms and both weekly reminders
 *    were never re-booked, the change-gate (`lastSlice`) then skipped every
 *    retry with the same settings, and the Settings caller's `void` made it an
 *    unhandled rejection. The write now runs after every reminder is booked,
 *    and the two un-awaited entry points catch it.
 *
 * Behaviour on a fake AsyncStorage (store, scheduler), source-reading for the
 * screen. R2: every test fails against the HEAD files.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
g.__DEV__ = false;
g.__AH6_AS__ = new Map<string, string>();

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__AH6_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) {
      if (globalThis.__AH6_REFUSE_REMOVE__) throw new Error('database or disk is full');
      s.delete(k);
    },
    async getAllKeys() { return [...s.keys()]; },
  };`);
const STUBS: Record<string, string> = {
  'lib/supabase': mod(`export const supabase = { auth: { async getSession() { return { data: { session: null } }; } }, from() { throw new Error('no reads'); } };`),
  'lib/getSessionSafe': mod(`export async function hasSafeSession() { return false; }`),
  'notifications/localSchedule': mod(`
    export function requestLocalNotifSync() {}
    export function setLocalSettingsUnreadable() {}`),
  './a11y': mod(`export function applyA11yFromSettings() {} export function resetA11y() {}`),
  'audio/leaveAppMute': mod(`export const MUTE_ON_LEAVE_DEFAULT = true; export function setMuteOnLeave() {}`),
  'notifications/curatedTermLists': mod(`export const MISUNDERSTOOD_TERMS = []; export const ODD_TERMS = [];`),
  'account/myUserRow': mod(`export async function myUserRow() { return null; }`),
  'storage/saveFailureNotice': mod(`export function reportUnhandledSaveFailure() {}`),
};

g.__AH6_BOOKED__ = [] as string[];
const SCHED_STUBS: Record<string, string> = {
  'react-native': mod(`export const Platform = { OS: 'ios' };`),
  'lib/supabase': mod(`export const supabase = {
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads'); },
  };`),
  'lib/getSessionSafe': mod(`export async function hasSafeSession() { return false; } export async function safeUser() { return null; }`),
  './push': mod(`
    const N = {
      SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
      AndroidImportance: { DEFAULT: 3 },
      async getAllScheduledNotificationsAsync() { return []; },
      async cancelScheduledNotificationAsync() {},
      async scheduleNotificationAsync(r) { globalThis.__AH6_BOOKED__.push(r.identifier); return r.identifier; },
      async setNotificationChannelAsync() {},
      async getPermissionsAsync() { return { status: 'granted' }; },
      async requestPermissionsAsync() { return { status: 'granted' }; },
    };
    export function getNotifications() { return N; }`),
  './curatedTermLists': mod(`export const MISUNDERSTOOD_TERMS = []; export const ODD_TERMS = []; export function curatedEntryForDate() { return null; }`),
  'commercial/memberStanding': mod(`export function memberStanding() { return 'member'; }`),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (context.parentURL?.includes('features/notifications/')) {
      for (const [tail, url] of Object.entries(SCHED_STUBS)) {
        if (specifier === tail || specifier.endsWith('/' + tail.replace(/^\.\//, ''))) return { url, shortCircuit: true };
      }
    }
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

test('settings: a toggle tapped before Settings loaded keeps every other stored setting', async () => {
  const AS = g.__AH6_AS__ as Map<string, string>;
  const D = store.DEFAULT_LOCAL_SETTINGS;
  // The learner's real record: reminders on, haptics off, a custom time.
  const stored = {
    ...D,
    haptics: false,
    notifyDailyStudy: true,
    notifyTime: { ...D.notifyTime, notifyDailyStudy: '06:30' },
  };
  AS.set('ape:settings', JSON.stringify(stored));
  // The screen still shows the defaults; the learner taps "Reduce animations".
  const next = { ...D, reduceAnimations: true };
  const written = await store.saveLocalSettings(next, D);
  const after = JSON.parse(AS.get('ape:settings')!);
  assert.equal(after.reduceAnimations, true, 'the tapped change is saved');
  assert.equal(after.haptics, false, 'haptics was put back to the default');
  assert.equal(after.notifyDailyStudy, true, 'a reminder the learner had on was switched off');
  assert.equal(after.notifyTime.notifyDailyStudy, '06:30', 'a chosen delivery time was reset');
  // …and the screen is handed the merged copy to show.
  assert.equal(written?.haptics, false);
  assert.equal(written?.notifyDailyStudy, true);
});

test('Settings screen: every row save passes the shown copy until its load lands', () => {
  const s = read('src/screens/settings/SettingsScreen.tsx');
  assert.equal((s.match(/saveLocalSettings\(next\)/g) ?? []).length, 0, 'a row still saves the stand-in whole');
  assert.equal((s.match(/saveLocalSettings\(next, unreadShown\(\)\)/g) ?? []).length, 3);
  assert.match(s, /localLoaded\.current \? undefined : DEFAULT_LOCAL_SETTINGS/);
  assert.match(s, /const showStored = \(s: LocalSettings\) => \{\s*setLocal\(s\);\s*localLoaded\.current = true;/);
  assert.match(s, /const loaded = await loadLocalSettings\(\);\s*showStored\(loaded\);/);
});

const schedule = await import('../src/features/notifications/localSchedule.ts');

test('reminders: a refused new-terms bookkeeping write never leaves the later reminders unbooked', async () => {
  const D = store.DEFAULT_LOCAL_SETTINGS;
  const s = {
    ...D,
    notifyDailyStudy: true,
    notifyNewTerms: true, // its bookkeeping write is the one the device refuses
    dailyTerms: true,
    notifyWeeklySummary: true,
    notifyCertProgress: true,
  };
  const booked = g.__AH6_BOOKED__ as string[];
  booked.length = 0;
  g.__AH6_REFUSE_REMOVE__ = true;
  try {
    await schedule.syncLocalNotifications(s);
  } catch {
    // The run may still report the refusal to its caller; the bookings are what matter.
  } finally {
    g.__AH6_REFUSE_REMOVE__ = false;
  }
  assert.ok(booked.includes('ape.notif.dailyStudy'));
  assert.ok(booked.some((id) => id.startsWith('ape.notif.dailyTerm.')), 'term of the day was cancelled and never re-booked');
  assert.ok(booked.includes('ape.notif.weeklySummary'), 'the weekly recap was cancelled and never re-booked');
  assert.ok(booked.includes('ape.notif.certProgress'), 'certificate progress was cancelled and never re-booked');
});

test('reminders: the un-awaited entry points catch the run', () => {
  const src = read('src/features/notifications/localSchedule.ts');
  assert.match(src, /void syncLocalNotifications\(s\)\.catch\(\(\) => \{\}\);/);
  assert.match(src, /await syncLocalNotifications\(s\)\.catch\(\(\) => \{\}\);/);
});
