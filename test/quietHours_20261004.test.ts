/**
 * QUIET HOURS (owner 2026-10-04; server contract by Comp A, live): the window
 * logic, and the local reminder scheduler moving reminders out of it.
 *
 *  - start = end means NO window; a window may cross midnight; the start is
 *    inside, the end is not (a held alert goes out AT the end).
 *  - The scheduler (localSchedule.ts) reads this device's copy of the window
 *    (its quietStore) — the server's default, ON 22:00–07:00, until a read
 *    or save of the server row is mirrored — and books every reminder that
 *    would fire inside it for the window's end.
 *
 * Pure functions directly; the scheduler on a fake AsyncStorage and a fake
 * expo-notifications that records each booking's trigger.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_QUIET,
  clock12,
  inQuietWindow,
  isUnknownTimeZone,
  normalizeHHMM,
  quietActive,
  quietFromRow,
  releaseClock,
  releaseDate,
  releaseWeekly,
} from '../src/features/notifications/quietHours.ts';

const at = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const W = (start: string, end: string, enabled = true) => ({ enabled, start, end });

describe('quiet hours — the window', () => {
  it('a window that crosses midnight (22:00–07:00): late evening and early morning are inside', () => {
    const w = W('22:00', '07:00');
    for (const t of ['22:00', '23:30', '00:00', '03:15', '06:59']) assert.equal(inQuietWindow(at(t), w), true, t);
    for (const t of ['07:00', '07:01', '12:00', '21:59']) assert.equal(inQuietWindow(at(t), w), false, t);
  });

  it('a same-day window (01:00–05:00)', () => {
    const w = W('01:00', '05:00');
    assert.equal(inQuietWindow(at('00:59'), w), false);
    assert.equal(inQuietWindow(at('01:00'), w), true);
    assert.equal(inQuietWindow(at('04:59'), w), true);
    assert.equal(inQuietWindow(at('05:00'), w), false);
    assert.equal(inQuietWindow(at('23:00'), w), false);
  });

  it('start = end means no window at all; a window that is off holds nothing', () => {
    for (let m = 0; m < 1440; m += 7) {
      assert.equal(inQuietWindow(m, W('22:00', '22:00')), false);
      assert.equal(inQuietWindow(m, W('22:00', '07:00', false)), false);
    }
    assert.equal(quietActive(W('07:00', '07:00')), false);
    assert.equal(quietActive(DEFAULT_QUIET), true);
  });

  it('the default is ON, 22:00 to 07:00 (owner ruling)', () => {
    assert.deepEqual(DEFAULT_QUIET, { enabled: true, start: '22:00', end: '07:00' });
  });

  it('server rows: Postgres time text is read; anything missing falls back to the server default', () => {
    assert.deepEqual(quietFromRow({ quiet_enabled: false, quiet_start: '23:30:00', quiet_end: '06:15:00' }), W('23:30', '06:15', false));
    assert.deepEqual(quietFromRow({}), DEFAULT_QUIET);
    assert.deepEqual(quietFromRow(null), DEFAULT_QUIET);
    assert.equal(normalizeHHMM('7:05'), '07:05');
    assert.equal(normalizeHHMM('24:00'), null);
    assert.equal(normalizeHHMM('12:60'), null);
    assert.equal(normalizeHHMM(undefined), null);
  });

  it('the picker rows read in 12-hour time', () => {
    assert.equal(clock12('22:00'), '10:00 PM');
    assert.equal(clock12('07:00'), '7:00 AM');
    assert.equal(clock12('00:30'), '12:30 AM');
    assert.equal(clock12('12:05'), '12:05 PM');
  });

  it('“unknown time zone” is recognised by its code or its words', () => {
    assert.equal(isUnknownTimeZone({ code: '22023', message: 'x' }), true);
    assert.equal(isUnknownTimeZone({ message: 'unknown time zone' }), true);
    assert.equal(isUnknownTimeZone({ code: '42501', message: 'sign in first' }), false);
    assert.equal(isUnknownTimeZone(null), false);
  });
});

describe('quiet hours — moving a reminder out of the window', () => {
  const w = W('22:00', '07:00');
  it('a clock time inside goes to the window end; the next day when the end is past midnight', () => {
    assert.deepEqual(releaseClock(23, 0, w), { hour: 7, minute: 0, dayAdd: 1 });
    assert.deepEqual(releaseClock(22, 0, w), { hour: 7, minute: 0, dayAdd: 1 });
    assert.deepEqual(releaseClock(5, 30, w), { hour: 7, minute: 0, dayAdd: 0 });
    assert.deepEqual(releaseClock(7, 0, w), { hour: 7, minute: 0, dayAdd: 0 }, 'the end itself is outside');
    assert.deepEqual(releaseClock(12, 0, w), { hour: 12, minute: 0, dayAdd: 0 });
    assert.deepEqual(releaseClock(23, 0, W('22:00', '22:00')), { hour: 23, minute: 0, dayAdd: 0 }, 'no window');
  });

  it('a one-shot date: 23:30 → 07:00 the next morning; outside stays the same object', () => {
    const d = new Date(2026, 9, 5, 23, 30);
    const r = releaseDate(d, w);
    assert.equal(r.getDate(), 6);
    assert.equal(r.getHours(), 7);
    assert.equal(r.getMinutes(), 0);
    const noon = new Date(2026, 9, 5, 12, 0);
    assert.equal(releaseDate(noon, w), noon);
    // Across a month end too.
    const r2 = releaseDate(new Date(2026, 9, 31, 22, 15), w);
    assert.equal(r2.getMonth(), 10);
    assert.equal(r2.getDate(), 1);
  });

  it('a weekly reminder late on Saturday moves to Sunday morning (expo weekday 7 → 1)', () => {
    assert.deepEqual(releaseWeekly(7, 23, 0, w), { weekday: 1, hour: 7, minute: 0 });
    assert.deepEqual(releaseWeekly(2, 6, 0, w), { weekday: 2, hour: 7, minute: 0 });
    assert.deepEqual(releaseWeekly(2, 9, 0, w), { weekday: 2, hour: 9, minute: 0 });
  });
});

/* ── The scheduler, for real, on fakes ─────────────────────────────────── */

const g = globalThis as Record<string, unknown>;
g.__DEV__ = false;
g.__QH_AS__ = new Map<string, string>();
g.__QH_BOOKED__ = [] as { identifier: string; trigger: Record<string, unknown> }[];

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__QH_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
  };`);
const STUBS: Record<string, string> = {
  'react-native': mod(`export const Platform = { OS: 'ios' };`),
  'lib/supabase': mod(`export const supabase = {
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads'); },
  };`),
  'lib/getSessionSafe': mod(`export async function hasSafeSession() { return false; } export async function safeUser() { return null; }
    export async function safeSessionResult() { return { result: { data: { session: null } }, timedOut: false }; }`),
  './push': mod(`
    const N = {
      SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
      AndroidImportance: { DEFAULT: 3 },
      async getAllScheduledNotificationsAsync() { return []; },
      async cancelScheduledNotificationAsync() {},
      async scheduleNotificationAsync(r) { globalThis.__QH_BOOKED__.push({ identifier: r.identifier, trigger: r.trigger }); return r.identifier; },
      async setNotificationChannelAsync() {},
      async getPermissionsAsync() { return { status: 'granted' }; },
      async requestPermissionsAsync() { return { status: 'granted' }; },
    };
    export function getNotifications() { return N; }`),
  './curatedTermLists': mod(`export function misunderstoodTerms() { return []; } export function oddTerms() { return []; } export function curatedEntryForDate() { return null; }`),
  'commercial/memberStanding': mod(`export function memberStanding() { return 'member'; }`),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (context.parentURL?.includes('features/notifications/')) {
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

const schedule = await import('../src/features/notifications/localSchedule.ts');

/** Only the fields the scheduler reads; everything off unless switched on. */
function settings(over: Record<string, unknown>) {
  return {
    notifyDailyStudy: false,
    notifyContinue: false,
    continueDays: 3,
    notifyNewTerms: false,
    dailyTerms: false,
    notifyDailyDefinition: false,
    notifyWeeklySummary: false,
    notifyCertProgress: false,
    notifyMisunderstood: false,
    notifyOddTerm: false,
    notifyFreq: { notifyWeeklySummary: 'Saturday', notifyCertProgress: 'Monday' },
    notifyTime: { notifyDailyStudy: '23:00', notifyWeeklySummary: '23:30', notifyCertProgress: '09:00' },
    ...over,
  } as never;
}
const booked = () => g.__QH_BOOKED__ as { identifier: string; trigger: Record<string, unknown> }[];
const trig = (id: string) => booked().find((b) => b.identifier === id)?.trigger;

describe('quiet hours — local reminders follow the window', () => {
  it('nothing mirrored yet: the server default (ON 22:00–07:00) holds a 23:00 daily reminder until 07:00', async () => {
    booked().length = 0;
    await schedule.syncLocalNotifications(settings({ notifyDailyStudy: true, notifyWeeklySummary: true, notifyCertProgress: true }));
    assert.deepEqual([trig('ape.notif.dailyStudy')?.hour, trig('ape.notif.dailyStudy')?.minute], [7, 0]);
    // Saturday 23:30 → Sunday 07:00 (expo weekday 1).
    assert.deepEqual([trig('ape.notif.weeklySummary')?.weekday, trig('ape.notif.weeklySummary')?.hour], [1, 7]);
    // 09:00 Monday is outside the window: unchanged.
    assert.deepEqual([trig('ape.notif.certProgress')?.weekday, trig('ape.notif.certProgress')?.hour], [2, 9]);
  });

  it('quiet hours switched OFF on the server: the reminder keeps its own time', async () => {
    assert.equal(await schedule.rememberQuietWindow({ enabled: false, start: '22:00', end: '07:00' }), true, 'a change');
    assert.equal(await schedule.rememberQuietWindow({ enabled: false, start: '22:00', end: '07:00' }), false, 'the same again is no change');
    booked().length = 0;
    await schedule.syncLocalNotifications(settings({ notifyDailyStudy: true }));
    assert.deepEqual([trig('ape.notif.dailyStudy')?.hour, trig('ape.notif.dailyStudy')?.minute], [23, 0]);
  });

  it('start = end on the server: no window, nothing moves', async () => {
    await schedule.rememberQuietWindow({ enabled: true, start: '23:00', end: '23:00' });
    booked().length = 0;
    await schedule.syncLocalNotifications(settings({ notifyDailyStudy: true }));
    assert.equal(trig('ape.notif.dailyStudy')?.hour, 23);
  });

  it('a chosen window (21:00–06:30): the 23:00 reminder moves to 06:30, and the mirror is what the store kept', async () => {
    await schedule.rememberQuietWindow({ enabled: true, start: '21:00', end: '06:30' });
    assert.deepEqual(await schedule.readQuietWindow(), { enabled: true, start: '21:00', end: '06:30' });
    assert.ok((g.__QH_AS__ as Map<string, string>).has('ape:notif:quietHours'));
    booked().length = 0;
    await schedule.syncLocalNotifications(settings({ notifyDailyStudy: true }));
    assert.deepEqual([trig('ape.notif.dailyStudy')?.hour, trig('ape.notif.dailyStudy')?.minute], [6, 30]);
  });

  it('a window change re-books through the change-gate (the quiet key is part of the slice)', async () => {
    const before = schedule.quietWindowKey();
    await schedule.rememberQuietWindow({ enabled: true, start: '20:00', end: '06:00' });
    assert.notEqual(schedule.quietWindowKey(), before);
  });
});
