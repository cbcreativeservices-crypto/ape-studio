/**
 * Settings — S11. Two backends:
 *  - Device/accessibility settings → AsyncStorage (local, immediate).
 *  - Notification toggles → notification_preferences (own row, created by
 *    register_student; the 6 LIVE columns only — r7/F-6 and C-5 exclusions).
 * Immediate writes, no Save button (locked). Color-blind mode (D-1): the
 * design omits it, but the locked S11 spec requires a 5-option selector.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { requestLocalNotifSync } from '../notifications/localSchedule';

export type ColorBlindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
export const COLOR_BLIND_MODES: { key: ColorBlindMode; label: string }[] = [
  { key: 'off', label: 'Off' },
  { key: 'protanopia', label: 'Protan' },
  { key: 'deuteranopia', label: 'Deutan' },
  { key: 'tritanopia', label: 'Tritan' },
  { key: 'monochrome', label: 'Mono' },
];

export type FontSize = 13 | 16 | 19 | 24;
export const FONT_SIZES: FontSize[] = [13, 16, 19, 24];

export type LocalSettings = {
  darkMode: boolean; // dark is the only shipped theme; stored for spec parity
  fontSize: FontSize;
  highContrast: boolean;
  colorBlind: ColorBlindMode;
  reduceAnimations: boolean;
  haptics: boolean;
  // Release the microphone the instant the app is backgrounded while inside a
  // live measurement tool (rev 24). ON (default) = privacy-first: the mic stops
  // immediately and re-acquires (a moment to re-warm) when you return. OFF =
  // keep the warm session alive in the background for an instant resume.
  micReleaseOnBackground: boolean;
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
  // Per-notification schedule (device-local; scheduling wires later). Keyed by
  // the toggle key. `notifyFreq` now holds the DAY (for weekly/new-terms), and
  // `notifyTime` the specific delivery time as "HH:MM" 24h (user request
  // 2026-07-23 — replaces the Morning/Midday/Evening presets). `notifyContinue`
  // uses `continueDays` instead.
  notifyFreq: Record<string, string>;
  notifyTime: Record<string, string>;
};

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  darkMode: true,
  fontSize: 16,
  highContrast: false,
  colorBlind: 'off',
  reduceAnimations: false,
  haptics: true,
  micReleaseOnBackground: true,
  notifyDailyStudy: false,
  notifyContinue: false,
  continueDays: 3,
  notifyNewTerms: false,
  dailyTerms: false,
  notifyDailyDefinition: false,
  notifyWeeklySummary: false,
  notifyCertProgress: false,
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
  key: 'notifyDailyStudy' | 'notifyContinue' | 'notifyNewTerms' | 'dailyTerms' | 'notifyDailyDefinition' | 'notifyWeeklySummary' | 'notifyCertProgress';
  label: string;
  hint: string;
}[] = [
  // Copy pass 2026-08-30: hints are third-person descriptions, one line each
  // (they are always visible now, so length matters); "Term of the day" and
  // "Definition of the day" read as the matched pair they actually are.
  { key: 'notifyDailyStudy', label: 'Study reminder', hint: 'A daily nudge to open the app.' },
  { key: 'notifyContinue', label: 'Come back reminder', hint: 'After a stretch of days without opening the app.' },
  { key: 'notifyNewTerms', label: 'New glossary terms', hint: 'When new terms are added to the glossary.' },
  { key: 'dailyTerms', label: 'Term of the day', hint: 'One audio term, every day.' },
  { key: 'notifyDailyDefinition', label: 'Definition of the day', hint: 'A definition — you name the term.' },
  { key: 'notifyWeeklySummary', label: 'Weekly recap', hint: 'What you studied this week.' },
  { key: 'notifyCertProgress', label: 'Certificate progress', hint: 'How close you are to your next certificate.' },
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
  notifyNewTerms: { mode: 'dayTime', label: 'When delivered' },
  dailyTerms: { mode: 'time', label: 'When each day' },
  notifyDailyDefinition: { mode: 'time', label: 'When each day' },
  notifyWeeklySummary: { mode: 'dayTime', label: 'When each week' },
  notifyCertProgress: { mode: 'dayTime', label: 'When each week' },
};

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

export async function loadLocalSettings(): Promise<LocalSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const merged = raw ? { ...DEFAULT_LOCAL_SETTINGS, ...JSON.parse(raw) } : DEFAULT_LOCAL_SETTINGS;
    hapticsOn = merged.haptics;
    micReleaseOnBg = merged.micReleaseOnBackground;
    return merged;
  } catch {
    return DEFAULT_LOCAL_SETTINGS;
  }
}

export async function saveLocalSettings(s: LocalSettings): Promise<void> {
  hapticsOn = s.haptics;
  micReleaseOnBg = s.micReleaseOnBackground;
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
  // Reschedule the local reminders whenever their settings change (debounced
  // and change-gated inside — a haptics toggle costs nothing here).
  requestLocalNotifSync(s);
}

/** Reset the synchronous mirrors to defaults on account switch — low-level code
 *  reads these without an async load, so without this the next user would see the
 *  previous user's haptics / mic-release setting until Settings is re-opened.
 *  The persisted `ape:settings` key is removed by the `ape:*` sweep. */
export function resetLocal(): void {
  hapticsOn = DEFAULT_LOCAL_SETTINGS.haptics;
  micReleaseOnBg = DEFAULT_LOCAL_SETTINGS.micReleaseOnBackground;
}

/* ---- notification preferences (server row) ---- */

export type NotificationPrefs = {
  push_enabled: boolean;
  email_enabled: boolean;
  notify_weekly_concept: boolean;
  notify_trophy: boolean;
  notify_badge: boolean;
  notify_quiz_unlock: boolean;
  notify_method_complete: boolean;
};

// Server-backed transport toggles ONLY. The event toggles (Trophy/Badge/Quiz/
// Method) are removed from the UI — not valid in the commercial version (user
// request 2026-07-18); their frozen columns simply go unused.
// "Phone notifications", not "Push": it is the MASTER switch for everything
// this device sends, including the 7 local reminders below (owner-approved
// 2026-08-30 — the old label promised something it did not do).
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
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, notify_weekly_concept, notify_trophy, notify_badge, notify_quiz_unlock, notify_method_complete')
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
  const { data: user } = await supabase.from('users').select('id').single();
  if (!user) return false;
  const { error } = await supabase
    .from('notification_preferences')
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
  if (error) console.warn('[settings] pref update failed:', error.message);
  return !error;
}
