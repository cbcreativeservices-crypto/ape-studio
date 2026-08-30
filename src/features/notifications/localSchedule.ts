/**
 * LOCAL notification scheduling — the 7 commercial reminder toggles (S11).
 * These are device-scheduled (expo-notifications calendar/date triggers), no
 * server involvement: the frozen notification_preferences table has no columns
 * for them, and none of them need one. The weekly-concept PUSH pipeline lives
 * in push.ts / the on-weekly-concept edge function and is separate.
 *
 * Entry points:
 *  - requestLocalNotifSync(settings)  — debounced; store.ts calls it on every
 *    saveLocalSettings so ANY toggle/day/time edit reschedules (change-gated).
 *  - syncLocalNotificationsFromStorage() — App.tsx calls it at boot and on
 *    foreground: re-arms the "continue where you left off" idle one-shot,
 *    tops up the daily term/definition queue, and runs the new-terms check.
 *
 * Everything routes through push.ts's guarded getNotifications() — on web, or
 * on a dev client built before the native module, every call here no-ops.
 *
 * Expo SDK 57 API: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
 * (typed triggers via SchedulableTriggerInputTypes; custom `identifier`;
 * WEEKLY weekday is 1 = Sunday … 7 = Saturday.)
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { getNotifications } from './push';
import { dayNameToDow } from './weeklyConcept';
import {
  loadLocalSettings,
  type LocalSettings,
} from '../settings/store';

/** All identifiers this engine owns start with this — the sync sweep cancels
 *  ONLY these, never a notification scheduled by anything else. */
const ID_PREFIX = 'ape.notif.';
const CHANNEL_ID = 'reminders';

const K_TERM_COUNT = 'ape:notif:lastTermCount';
const K_TERM_BATCH = 'ape:notif:termBatch';
const K_PENDING_NEW_TERMS = 'ape:notif:pendingNewTerms';

const TERM_BATCH_TTL_MS = 12 * 60 * 60 * 1000;
/** Foreground re-syncs this close together are skipped (the only thing that
 *  would change is the idle one-shot, whose threshold is measured in days). */
const FOREGROUND_THROTTLE_MS = 5 * 60 * 1000;

type TermRow = { term: string; definition: string; plain_english: string | null };

/* ------------------------------------------------------------------ utils */

function hhmm(raw: string | undefined, fallback: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw ?? '') ?? /^(\d{1,2}):(\d{2})$/.exec(fallback)!;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Next future Date matching day-of-week (0=Sunday) at hour:minute local. */
function nextOccurrence(dow: number, hour: number, minute: number, from = new Date()): Date {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  while (d.getDay() !== dow || d.getTime() <= from.getTime()) {
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
  }
  return d;
}

function truncate(s: string, max = 178): string {
  const clean = (s ?? '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------- daily term/definition content */

/** Random slice of the glossary (server-backed, 3,300+ rows) cached 12 h so a
 *  foreground sync doesn't hit the network every time. Fails soft to null —
 *  callers fall back to generic copy (signed-out users, offline, RLS). */
async function getTermBatch(): Promise<TermRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(K_TERM_BATCH);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; items: TermRow[] };
      if (Date.now() - cached.at < TERM_BATCH_TTL_MS && cached.items?.length >= 14) {
        return cached.items;
      }
    }
  } catch {
    /* fall through to refetch */
  }
  try {
    const { data: cnt } = await supabase.rpc('get_glossary_term_count');
    const total = Number(cnt);
    if (!Number.isFinite(total) || total < 1) return null;
    const off = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 40)));
    const { data, error } = await supabase
      .from('glossary')
      .select('term, definition, plain_english')
      .range(off, off + 39);
    if (error || !data?.length) return null;
    const items = shuffle(data as TermRow[]).slice(0, 14);
    await AsyncStorage.setItem(K_TERM_BATCH, JSON.stringify({ at: Date.now(), items }));
    return items;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------- sync */

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSlice = '';
let lastFullSyncAt = 0;
let syncing = false;

/** The settings that affect scheduling — used to skip no-op resyncs. */
function notifSlice(s: LocalSettings): string {
  return JSON.stringify([
    s.notifyDailyStudy,
    s.notifyContinue,
    s.continueDays,
    s.notifyNewTerms,
    s.dailyTerms,
    s.notifyDailyDefinition,
    s.notifyWeeklySummary,
    s.notifyCertProgress,
    s.notifyFreq,
    s.notifyTime,
  ]);
}

/** Debounced, change-gated — safe to call on EVERY settings save. */
export function requestLocalNotifSync(s: LocalSettings): void {
  const slice = notifSlice(s);
  if (slice === lastSlice) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncLocalNotifications(s);
  }, 1200);
}

/** Boot / foreground entry: loads settings itself, throttled. */
export async function syncLocalNotificationsFromStorage(): Promise<void> {
  if (Date.now() - lastFullSyncAt < FOREGROUND_THROTTLE_MS) return;
  const s = await loadLocalSettings();
  await syncLocalNotifications(s);
}

export async function syncLocalNotifications(s: LocalSettings): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  if (syncing) return; // a sync is a full rebuild — overlapping runs double-book
  syncing = true;
  try {
    lastSlice = notifSlice(s);
    lastFullSyncAt = Date.now();

    const anyOn =
      s.notifyDailyStudy ||
      s.notifyContinue ||
      s.notifyNewTerms ||
      s.dailyTerms ||
      s.notifyDailyDefinition ||
      s.notifyWeeklySummary ||
      s.notifyCertProgress;

    // Sweep our own identifiers first — sync is a full idempotent rebuild.
    const existing = await N.getAllScheduledNotificationsAsync();
    await Promise.all(
      existing
        .filter((r) => r.identifier?.startsWith(ID_PREFIX))
        .map((r) => N.cancelScheduledNotificationAsync(r.identifier)),
    );
    if (!anyOn) return;

    // Android 8+: every notification needs a channel. Android 13+ also gates
    // LOCAL notifications behind the runtime permission, so ask on both OSes.
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Study reminders',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180, 120, 180],
        lightColor: '#ffc64d',
      });
    }
    const perm = await N.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      status = (await N.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') {
      console.warn('[notif] permission not granted — local reminders stay off');
      return;
    }

    const T = N.SchedulableTriggerInputTypes;
    const jobs: Promise<string>[] = [];
    const scheduled: string[] = [];
    const add = (id: string, content: Parameters<typeof N.scheduleNotificationAsync>[0]['content'], trigger: Parameters<typeof N.scheduleNotificationAsync>[0]['trigger']) => {
      scheduled.push(id.slice(ID_PREFIX.length));
      jobs.push(
        N.scheduleNotificationAsync({ identifier: id, content, trigger }).catch((e) => {
          console.warn(`[notif] schedule failed for ${id}:`, e);
          return '';
        }),
      );
    };

    // 1 · Daily study reminder — repeating daily at the chosen time.
    if (s.notifyDailyStudy) {
      const { hour, minute } = hhmm(s.notifyTime.notifyDailyStudy, '08:00');
      add(
        `${ID_PREFIX}dailyStudy`,
        {
          title: 'Study time',
          body: 'Your daily study session is waiting.',
          data: { type: 'local' },
        },
        { type: T.DAILY, hour, minute, channelId: CHANNEL_ID },
      );
    }

    // 2 · Continue where you left off — a one-shot N days out, re-armed on
    // every boot/foreground sync, so it only ever fires after true idleness.
    if (s.notifyContinue) {
      const days = Math.max(1, Math.round(s.continueDays || 3));
      add(
        `${ID_PREFIX}continue`,
        {
          title: 'Pick up where you left off',
          body: `It has been ${days} day${days === 1 ? '' : 's'} — your progress is saved right where you stopped.`,
          data: { type: 'local' },
        },
        { type: T.TIME_INTERVAL, seconds: days * 86400, repeats: false, channelId: CHANNEL_ID },
      );
    }

    // 3 · New term additions — detection happens HERE (at sync, while the app
    // is open): compare the server term count to the last seen count; a rise
    // schedules a one-shot at the user's chosen day+time. The pending one-shot
    // is persisted so the sweep above can re-book it until it fires.
    if (s.notifyNewTerms) {
      const { hour, minute } = hhmm(s.notifyTime.notifyNewTerms, '09:00');
      const dow = dayNameToDow(s.notifyFreq.notifyNewTerms ?? 'Monday');
      let pending: { n: number; fireAt: number } | null = null;
      try {
        const raw = await AsyncStorage.getItem(K_PENDING_NEW_TERMS);
        if (raw) pending = JSON.parse(raw);
        if (pending && pending.fireAt <= Date.now()) pending = null; // already fired
      } catch {
        pending = null;
      }
      try {
        const { data: cnt } = await supabase.rpc('get_glossary_term_count');
        const count = Number(cnt);
        if (Number.isFinite(count) && count > 0) {
          const stored = Number(await AsyncStorage.getItem(K_TERM_COUNT));
          if (Number.isFinite(stored) && stored > 0 && count > stored) {
            const n = (pending?.n ?? 0) + (count - stored);
            pending = { n, fireAt: nextOccurrence(dow, hour, minute).getTime() };
          }
          await AsyncStorage.setItem(K_TERM_COUNT, String(count));
        }
      } catch {
        /* offline — keep any pending as-is */
      }
      if (pending) {
        await AsyncStorage.setItem(K_PENDING_NEW_TERMS, JSON.stringify(pending));
        add(
          `${ID_PREFIX}newTerms`,
          {
            title: 'New glossary terms',
            body: `${pending.n} new term${pending.n === 1 ? ' was' : 's were'} added to the glossary.`,
            data: { type: 'local', dest: 'glossary' },
          },
          { type: T.DATE, date: new Date(pending.fireAt), channelId: CHANNEL_ID },
        );
      } else {
        await AsyncStorage.removeItem(K_PENDING_NEW_TERMS);
      }
    }

    // 4+5 · Daily audio terms / definitions — the next 7 days are booked as
    // individual DATE triggers, each carrying a different real glossary entry
    // (content must be fixed at schedule time; the queue is topped up on every
    // boot/foreground sync). Falls back to generic copy with no server reach.
    if (s.dailyTerms || s.notifyDailyDefinition) {
      const batch = await getTermBatch();
      const termDays = (key: 'dailyTerms' | 'notifyDailyDefinition', offset: number) => {
        const { hour, minute } = hhmm(s.notifyTime[key], '08:00');
        const first = new Date();
        first.setHours(hour, minute, 0, 0);
        if (first.getTime() <= Date.now()) first.setDate(first.getDate() + 1);
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(first);
          d.setDate(d.getDate() + i);
          return { d, row: batch ? batch[(i + offset) % batch.length] : null };
        });
      };
      if (s.dailyTerms) {
        for (const [i, { d, row }] of termDays('dailyTerms', 0).entries()) {
          add(
            `${ID_PREFIX}dailyTerm.${i}`,
            row
              ? {
                  title: `Term of the day: ${row.term}`,
                  body: truncate(row.plain_english || row.definition),
                  data: { type: 'local', dest: 'glossary' },
                }
              : {
                  title: 'Term of the day',
                  body: 'Today’s audio term is waiting in the glossary.',
                  data: { type: 'local', dest: 'glossary' },
                },
            { type: T.DATE, date: d, channelId: CHANNEL_ID },
          );
        }
      }
      if (s.notifyDailyDefinition) {
        // offset 7 → a DIFFERENT slice of the batch than the term-of-the-day,
        // so the definition never spoils that morning's term (or vice versa).
        for (const [i, { d, row }] of termDays('notifyDailyDefinition', 7).entries()) {
          add(
            `${ID_PREFIX}dailyDef.${i}`,
            row
              ? {
                  title: 'Guess the term',
                  body: truncate(row.definition),
                  data: { type: 'local', dest: 'glossary', answer: row.term },
                }
              : {
                  title: 'Guess the term',
                  body: 'Today’s definition is waiting — can you name the term?',
                  data: { type: 'local', dest: 'glossary' },
                },
            { type: T.DATE, date: d, channelId: CHANNEL_ID },
          );
        }
      }
    }

    // 6 · Weekly learning summary — repeating weekly (weekday 1 = Sunday).
    if (s.notifyWeeklySummary) {
      const { hour, minute } = hhmm(s.notifyTime.notifyWeeklySummary, '09:00');
      add(
        `${ID_PREFIX}weeklySummary`,
        {
          title: 'Your weekly recap',
          body: 'See what you covered this week and where to pick up next.',
          data: { type: 'local' },
        },
        {
          type: T.WEEKLY,
          weekday: dayNameToDow(s.notifyFreq.notifyWeeklySummary ?? 'Monday') + 1,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      );
    }

    // 7 · Weekly certificate progress — repeating weekly.
    if (s.notifyCertProgress) {
      const { hour, minute } = hhmm(s.notifyTime.notifyCertProgress, '09:00');
      add(
        `${ID_PREFIX}certProgress`,
        {
          title: 'Certificate check-in',
          body: 'What you finished, what is next, and how far you have to go.',
          data: { type: 'local', dest: 'awards' },
        },
        {
          type: T.WEEKLY,
          weekday: dayNameToDow(s.notifyFreq.notifyCertProgress ?? 'Monday') + 1,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      );
    }

    await Promise.all(jobs);
    console.log(`[notif] scheduled: ${scheduled.join(', ') || '(none)'}`);
  } finally {
    syncing = false;
  }
}
