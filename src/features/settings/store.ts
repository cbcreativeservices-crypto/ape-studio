/**
 * Settings — S11. Two backends:
 *  - Device/accessibility settings → AsyncStorage (local, immediate).
 *  - Notification toggles → notification_preferences (own row, created by
 *    register_student; the 6 LIVE columns only — r7/F-6 and C-5 exclusions).
 * Immediate writes, no Save button (locked).
 *
 * TEXT SIZE, CONTRAST AND COLOUR-BLIND MODE ARE NOT STORED HERE (owner
 * 2026-08-30 ruling, cleanup 2026-08-31). They defer to the phone: RN already
 * scales every Text with the OS font setting, contrast and colour filters are
 * system-wide, and the amplitude ramp cannot be re-visualised for colour
 * blindness because the ramp carries meaning. The S11 spec's 5-option
 * colour-blind selector is deliberately NOT implemented — it would have been a
 * promise we cannot keep.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { hasSafeSession } from '../../lib/getSessionSafe';
import { requestLocalNotifSync, setLocalSettingsUnreadable } from '../notifications/localSchedule';
import { applyA11yFromSettings, resetA11y } from './a11y';
import { MUTE_ON_LEAVE_DEFAULT, setMuteOnLeave } from '../audio/leaveAppMute';
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

export type LocalSettings = {
  reduceAnimations: boolean;
  haptics: boolean;
  // Release the microphone the instant the app is backgrounded while inside a
  // live measurement tool (rev 24). ON (default) = privacy-first: the mic stops
  // immediately and re-acquires (a moment to re-warm) when you return. OFF =
  // keep the warm session alive in the background for an instant resume.
  micReleaseOnBackground: boolean;
  // "Mute audio when I leave the app" (owner 2026-10-01). ON (default, the
  // 2026-09-17 behaviour) = backgrounding stops every sound AND locks the audio
  // output gate. OFF = backgrounding still stops every sound but leaves output
  // on for the return. Mirrored synchronously into features/audio/leaveAppMute.
  muteAudioOnLeave: boolean;
  // COMMERCIAL notification set (user request 2026-07-18). Device-local intent
  // flags — notification_preferences (server) is FROZEN and has no columns for
  // these, so they live in AsyncStorage. Scheduling is LOCAL (expo-notifications,
  // wired 2026-08-29): saveLocalSettings feeds localSchedule.ts, which owns the
  // device-side calendar/date triggers. No server jobs needed.
  notifyDailyStudy: boolean; // 1 — daily study reminders
  notifyContinue: boolean; // 2 — "continue where you left off" after N idle days
  continueDays: number; // 2's threshold — days of no use before it triggers
  notifyNewTerms: boolean; // 3 — new term additions
  dailyTerms: boolean; // 4 — daily audio terms
  notifyDailyDefinition: boolean; // 5 — daily audio definitions (guess the term)
  notifyWeeklySummary: boolean; // 6 — weekly learning summaries
  notifyCertProgress: boolean; // 7 — weekly certificate progress updates
  // Curated daily term buckets (owner 2026-09-01) — content ships in
  // curatedTermLists.ts; the rows hide while the lists are empty.
  notifyMisunderstood: boolean; // 8 — commonly misunderstood term, daily
  notifyOddTerm: boolean; // 9 — odd / uncommon audio term, daily
  // Per-notification schedule (device-local; scheduling wires later). Keyed by
  // the toggle key. `notifyFreq` now holds the DAY (for weekly/new-terms), and
  // `notifyTime` the specific delivery time as "HH:MM" 24h (user request
  // 2026-07-23 — replaces the Morning/Midday/Evening presets). `notifyContinue`
  // uses `continueDays` instead.
  notifyFreq: Record<string, string>;
  notifyTime: Record<string, string>;
};

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  reduceAnimations: false,
  haptics: true,
  micReleaseOnBackground: true,
  muteAudioOnLeave: MUTE_ON_LEAVE_DEFAULT,
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
  // Day-of-week for the day+time notifications (weekly + new terms).
  notifyFreq: {
    notifyNewTerms: 'Monday',
    notifyWeeklySummary: 'Monday',
    notifyCertProgress: 'Monday',
  },
  // Specific delivery time per notification, "HH:MM" 24h.
  notifyTime: {
    notifyDailyStudy: '08:00',
    dailyTerms: '08:00',
    notifyDailyDefinition: '08:00',
    // Spread across the day so the buckets never stack on the 08:00 pair.
    notifyMisunderstood: '12:00',
    notifyOddTerm: '17:00',
    notifyNewTerms: '09:00',
    notifyWeeklySummary: '09:00',
    notifyCertProgress: '09:00',
  },
};

/** Days of the week (full name stored; short label shown). */
export const NOTIFY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export function shortDay(d: string): string {
  return d.slice(0, 3);
}
/** "HH:MM" 24h → "h:mm AM/PM" for display. */
export function formatClock(hhmm: string): string {
  const [h, m] = (hhmm || '08:00').split(':').map((n) => parseInt(n, 10));
  const hh = Number.isFinite(h) ? h : 8;
  const mm = Number.isFinite(m) ? m : 0;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

/** The 7 commercial notification toggles (device-local), in display order.
 *  `continueDays` (the threshold for #2) is edited by its own stepper. */
export const COMMERCIAL_NOTIFY_ROWS: {
  key:
    | 'notifyDailyStudy'
    | 'notifyContinue'
    | 'notifyNewTerms'
    | 'dailyTerms'
    | 'notifyDailyDefinition'
    | 'notifyWeeklySummary'
    | 'notifyCertProgress'
    | 'notifyMisunderstood'
    | 'notifyOddTerm';
  label: string;
  hint: string;
}[] = [
  // Copy pass 2026-08-30: hints are third-person descriptions, one line each
  // (they are always visible now, so length matters); "Term of the day" and
  // "Definition of the day" read as the matched pair they actually are.
  { key: 'notifyDailyStudy', label: 'Study reminder', hint: 'A daily nudge to open the app.' },
  { key: 'notifyContinue', label: 'Come back reminder', hint: 'After a stretch of days without opening the app.' },
  // NEW COPY — owner review (monthly cadence, owner 2026-09-01).
  { key: 'notifyNewTerms', label: 'New glossary terms', hint: 'On the 1st of the month, when terms have been added since you last looked.' },
  { key: 'dailyTerms', label: 'Term of the day', hint: 'One audio term, every day.' },
  { key: 'notifyDailyDefinition', label: 'Definition of the day', hint: 'A definition — you name the term.' },
  { key: 'notifyWeeklySummary', label: 'Weekly recap', hint: 'What you studied this week.' },
  { key: 'notifyCertProgress', label: 'Certificate progress', hint: 'How close you are to your next certificate.' },
  // Curated daily buckets (owner 2026-09-01) — a toggle with no content behind
  // it would be a dead switch, so these rows appear only once the lists have
  // entries (see curatedTermLists.ts). BOTH BUCKETS LANDED 2026-09-01 with
  // 1,095 entries each, so both rows render today; the guards stay as the
  // safety net, not as a description of the current state.
  // NEW COPY — owner review.
  // Asked of the cheap index, so the ~450 KB of lists is not loaded at boot
  // just to answer it (perf decision B, 2026-10-04).
  ...(HAS_MISUNDERSTOOD_TERMS
    ? [{ key: 'notifyMisunderstood' as const, label: 'Misunderstood term', hint: 'A commonly misunderstood term, set straight — daily.' }]
    : []),
  ...(HAS_ODD_TERMS
    ? [{ key: 'notifyOddTerm' as const, label: 'Odd term of the day', hint: 'A rare or odd audio term you may never have met.' }]
    : []),
];

export type CommercialNotifyKey = (typeof COMMERCIAL_NOTIFY_ROWS)[number]['key'];

/** Schedule editor shown when a notification is ON (user request 2026-07-23):
 *   - 'idleDays' → the days-of-no-use stepper (notifyContinue only).
 *   - 'time'     → pick a specific time of day (stored in notifyTime).
 *   - 'dayTime'  → pick a day of week (notifyFreq) AND a time (notifyTime).
 *  Editing opens a popup from a button on the row's right (one line). */
export type NotifyFreqMode = 'idleDays' | 'time' | 'dayTime';
export const NOTIFY_FREQ: Record<CommercialNotifyKey, { mode: NotifyFreqMode; label: string }> = {
  notifyDailyStudy: { mode: 'time', label: 'When each day' },
  notifyContinue: { mode: 'idleDays', label: 'Remind me after this many days of no use' },
  // Monthly on the 1st (owner 2026-09-01) — only the TIME is choosable now.
  notifyNewTerms: { mode: 'time', label: 'Delivery time on the 1st' },
  dailyTerms: { mode: 'time', label: 'When each day' },
  notifyDailyDefinition: { mode: 'time', label: 'When each day' },
  notifyWeeklySummary: { mode: 'dayTime', label: 'When each week' },
  notifyCertProgress: { mode: 'dayTime', label: 'When each week' },
  notifyMisunderstood: { mode: 'time', label: 'When each day' },
  notifyOddTerm: { mode: 'time', label: 'When each day' },
};

// eslint-disable-next-line import/order -- leaf data module (no cycle; see localSchedule's cycle note)
import { HAS_MISUNDERSTOOD_TERMS, HAS_ODD_TERMS } from '../notifications/curatedTermLists';

import { myUserRow } from '../account/myUserRow';
const KEY = 'ape:settings';

// Synchronous mirrors so low-level, non-React code can honour these toggles
// without an async read: haptics (SwitchButton, Booth 2026-07-11 #4) and the
// mic background-release setting (the tool engine's AppState handler, rev 24).
let hapticsOn = DEFAULT_LOCAL_SETTINGS.haptics;
export function hapticsEnabled(): boolean {
  return hapticsOn;
}
let micReleaseOnBg = DEFAULT_LOCAL_SETTINGS.micReleaseOnBackground;
export function micReleaseOnBackgroundEnabled(): boolean {
  return micReleaseOnBg;
}

/**
 * GENERATION FENCE (night bug pass 1, 2026-10-01). Loads run on every
 * foreground (App.tsx), on every tier change (EntitlementProvider) and on
 * opening Settings; a load's AsyncStorage read is queued BEHIND nothing it
 * cares about, so a save or an account reset that happens while it is in
 * flight is overtaken: the load's continuation then re-applied the blob it read
 * BEFORE them to the synchronous mirrors. "Mute audio when I leave the app"
 * switched off a moment after returning to the app read ON again at the next
 * background (until the next foreground), and an account switch could re-apply
 * the PREVIOUS account's settings over the reset. A load that has been
 * overtaken now applies nothing and answers with what superseded it.
 */
let settingsGen = 0;
/** What the latest save wrote (null after a reset = the defaults). */
let lastWritten: LocalSettings | null = null;

/**
 * ⛔ A READ THAT THREW IS NOT "NOTHING SAVED" (wave 2, 2026-10-02).
 *
 * The load used to answer DEFAULT_LOCAL_SETTINGS for a read that failed, the
 * same as for a fresh install. Two things then wrote those defaults over the
 * real record: the first toggle in Settings (the screen saves the WHOLE object
 * it was given — one tap put every other setting back to default), and the
 * boot/tier-change reschedule in EntitlementProvider, which handed the
 * defaults to the notification scheduler and cancelled every reminder the
 * user had switched on.
 *
 * Now: the load answers the last settings it KNEW (defaults only when it has
 * never known any) and remembers that the read failed. The scheduler is told
 * to leave the device schedule alone until a read succeeds. A save made
 * meanwhile reads again first: if the record is readable now, only the fields
 * the user actually changed are laid over it; if it is still unreadable the
 * choice applies for this session and nothing is written over the stored copy.
 */
let readFailed = false;
/** The settings as last read or saved — what the screen was shown. */
let lastKnown: LocalSettings | null = null;

function parseStored(raw: string | null): LocalSettings {
  // Absent = a fresh install. Garbled JSON = nothing usable: defaults, as before.
  if (!raw) return DEFAULT_LOCAL_SETTINGS;
  try {
    return { ...DEFAULT_LOCAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LOCAL_SETTINGS;
  }
}

/** Lay over `stored` only what differs between `next` and what the screen was
 *  `shown` — per entry for the two schedule maps. */
function applyChanges(stored: LocalSettings, shown: LocalSettings, next: LocalSettings): LocalSettings {
  const out: Record<string, unknown> = { ...stored };
  const st = stored as unknown as Record<string, unknown>;
  const sh = shown as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(next)) {
    if (k === 'notifyFreq' || k === 'notifyTime') {
      const map = { ...((st[k] as Record<string, string> | undefined) ?? {}) };
      const was = (sh[k] as Record<string, string> | undefined) ?? {};
      for (const [e, ev] of Object.entries(v as Record<string, string>)) if (was[e] !== ev) map[e] = ev;
      out[k] = map;
    } else if (JSON.stringify(sh[k]) !== JSON.stringify(v)) {
      out[k] = v;
    }
  }
  return out as LocalSettings;
}

export async function loadLocalSettings(): Promise<LocalSettings> {
  const gen = settingsGen;
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    if (gen !== settingsGen) return lastWritten ?? DEFAULT_LOCAL_SETTINGS;
    // READ failed — see `readFailed`. The mirrors keep what they hold.
    readFailed = true;
    setLocalSettingsUnreadable(true);
    return lastKnown ?? DEFAULT_LOCAL_SETTINGS;
  }
  if (gen !== settingsGen) return lastWritten ?? DEFAULT_LOCAL_SETTINGS;
  const merged = parseStored(raw);
  readFailed = false;
  setLocalSettingsUnreadable(false);
  lastKnown = merged;
  try {
    hapticsOn = merged.haptics;
    micReleaseOnBg = merged.micReleaseOnBackground;
    setMuteOnLeave(merged.muteAudioOnLeave);
    applyA11yFromSettings(merged); // font size / contrast / colour / motion
  } catch {
    // a mirror that throws must not turn a good read into a failed one
  }
  return merged;
}

/** Resolves to the settings AS WRITTEN when a recovered read laid only the
 *  changed fields over the stored record — the screen must show that copy,
 *  not the defaults it had for the untouched fields (pattern hunt wave 3,
 *  2026-10-02). Null when what was asked for is what was written, or when
 *  nothing was written (still unreadable, or overtaken by a newer save).
 *
 *  `unreadShown` (hunt 6, 2026-10-03): the caller's copy is NOT the stored
 *  record yet — Settings renders the defaults until its own load lands, and a
 *  toggle tapped in that window handed over defaults + one change, which was
 *  written WHOLE over every other stored setting (reminders, haptics, a11y).
 *  Given the copy the screen showed, only the changed fields are laid over the
 *  stored record, exactly as after a failed read. */
export async function saveLocalSettings(s: LocalSettings, unreadShown?: LocalSettings): Promise<LocalSettings | null> {
  settingsGen += 1;
  lastWritten = s;
  const gen = settingsGen;
  let recovered = false;
  if (readFailed || unreadShown) {
    const shown = unreadShown ?? lastKnown ?? DEFAULT_LOCAL_SETTINGS;
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(KEY);
    } catch {
      // Still unreadable: honour the choice for this session, write nothing
      // over the stored record.
      if (gen === settingsGen) {
        hapticsOn = s.haptics;
        micReleaseOnBg = s.micReleaseOnBackground;
        setMuteOnLeave(s.muteAudioOnLeave);
        applyA11yFromSettings(s);
      }
      return null;
    }
    // A newer save (it carries this one's change too) or a reset overtook it.
    if (gen !== settingsGen) return null;
    s = applyChanges(parseStored(raw), shown, s);
    recovered = true;
    lastWritten = s;
    readFailed = false;
    setLocalSettingsUnreadable(false);
  }
  lastKnown = s;
  hapticsOn = s.haptics;
  micReleaseOnBg = s.micReleaseOnBackground;
  setMuteOnLeave(s.muteAudioOnLeave);
  applyA11yFromSettings(s); // live — the UI restyles as the chip is tapped
  // NEVER REJECTS (evening hunt 2, 2026-10-02). Every Settings caller is a
  // `void saveLocalSettings(next).then(...)` with no catch, so a write that
  // threw (storage full, a locked DB on Android) was an unhandled rejection
  // per tap — and it skipped the reschedule below, so a reminder switched OFF
  // kept firing while the switch read off. The choice applies for this
  // session either way (the mirrors above are already set).
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('[settings] device write failed — applies for this session only:', (e as Error)?.message);
    // …and the USER is told (owner ruling 2026-10-03: "if it fails the user
    // needs to know"): every Settings row saves on tap, so the shared,
    // rate-limited notice — not one per tap. A wipe or a newer save meanwhile
    // (the generation moved) is not this write's failure to report.
    if (gen === settingsGen) reportUnhandledSaveFailure();
  }
  // Reschedule the local reminders whenever their settings change (debounced
  // and change-gated inside — a haptics toggle costs nothing here).
  requestLocalNotifSync(s);
  return recovered ? s : null;
}

/** Reset the synchronous mirrors to defaults on account switch — low-level code
 *  reads these without an async load, so without this the next user would see the
 *  previous user's haptics / mic-release setting until Settings is re-opened.
 *  The persisted `ape:settings` key is removed by the `ape:*` sweep. */
export function resetLocal(): void {
  settingsGen += 1;
  lastWritten = null;
  lastKnown = null;
  readFailed = false;
  setLocalSettingsUnreadable(false);
  hapticsOn = DEFAULT_LOCAL_SETTINGS.haptics;
  micReleaseOnBg = DEFAULT_LOCAL_SETTINGS.micReleaseOnBackground;
  setMuteOnLeave(DEFAULT_LOCAL_SETTINGS.muteAudioOnLeave);
  resetA11y();
}

/* ---- notification preferences (server row) ---- */

export type NotificationPrefs = {
  push_enabled: boolean;
  email_enabled: boolean;
  notify_weekly_concept: boolean;
  notify_trophy: boolean;
  notify_quiz_unlock: boolean;
  notify_method_complete: boolean;
};

// Server-backed transport toggles ONLY. The event toggles (Trophy/Badge/Quiz/
// Method) are removed from the UI — not valid in the commercial version (user
// request 2026-07-18); their frozen columns simply go unused.
// "Phone notifications", not "Push": it is the MASTER switch for everything
// this device sends, including the local reminders in COMMERCIAL_NOTIFY_ROWS
// above (owner-approved 2026-08-30 — the old label promised something it did
// not do). That list is 7 fixed rows + 2 that appear only once the curated
// buckets have entries; both buckets landed 2026-09-01 (1,095 entries each),
// so it currently renders 9. Count the array, don't re-hardcode a number.
export const NOTIFICATION_ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'push_enabled', label: 'Phone notifications', hint: 'Alerts on this device. Required for everything below.' },
  { key: 'email_enabled', label: 'Email', hint: 'The full weekly concept card, to your account email.' },
];

/** DEV+WEB preview seam: the Settings harness has no session, so the real
 *  fetch returns null and every control renders disabled. Setting this lets
 *  the harness show the screen in its signed-in state. Never set in a build. */
let devPrefsOverride: NotificationPrefs | null = null;
export function __setDevPrefsOverride(p: NotificationPrefs | null): void {
  if (__DEV__) devPrefsOverride = p;
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs | null> {
  if (__DEV__ && devPrefsOverride) return devPrefsOverride;
  // Member-only table: without a session the read can only 401.
  if (!(await hasSafeSession(supabase.auth.getSession(), 'fetchNotificationPrefs'))) return null;
  /**
   * ⛔ SAY WHOSE ROW (2026-09-30 day pass) — the myUserRow lesson. The table
   * carries `admin_all_notif_prefs` (ALL, is_admin()), so for an ADMIN this
   * unfiltered read returned every member's row and `.maybeSingle()` failed:
   * Settings told the owner "Couldn't load your notification settings" on
   * every visit. The update below already filters on user_id.
   */
  const me = await myUserRow<{ id: string }>('id');
  if (!me) return null;
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, notify_weekly_concept, notify_trophy, notify_quiz_unlock, notify_method_complete')
    .eq('user_id', me.id)
    .maybeSingle();
  if (error) {
    console.warn('[settings] prefs fetch failed:', error.message);
    return null;
  }
  if (!data) return null;
  const prefs = data as NotificationPrefs;
  // Default AFTER the spread: a spread-first default is silently discarded
  // (TS2783). Applies when the column is absent or null on an older row.
  return { ...prefs, notify_weekly_concept: prefs.notify_weekly_concept ?? false };
}

/** Immediate single-toggle write; returns false on failure (caller reverts). */
export async function updateNotificationPref(
  key: keyof NotificationPrefs,
  value: boolean,
): Promise<boolean> {
  const user = await myUserRow<{ id: string }>('id');
  if (!user) return false;
  /**
   * ⛔ A NO-MATCH UPDATE IS NOT AN ERROR. PostgREST returns no error for an
   *    UPDATE that matched zero rows, so `!error` reported success for a write
   *    that changed nothing. SettingsScreen only reverts on `ok === false`, so
   *    the toggle stayed latched ON, `push_enabled` mirrored "on" into the
   *    device scheduler, the server row never changed, nothing was ever sent —
   *    and the switch silently flipped back on the next visit to Settings.
   *
   *    Both siblings were already fixed for this exact failure: push.ts:162
   *    ("A no-match update is NOT an error") and weeklyConcept.ts:174. This
   *    one was missed. `.select()` makes the row count observable.
   */
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select('user_id');
  if (error) console.warn('[settings] pref update failed:', error.message);
  // No account id in the log (personal-data rule; see EntitlementProvider).
  else if (!data?.length) console.warn('[settings] pref update matched no row');
  return !error && !!data?.length;
}
