/**
 * QUIET HOURS — the PURE half (owner ruling 2026-10-04, server contract by
 * Comp A: docs/CROSS_SESSION_HANDOFF.md "QUIET HOURS are LIVE").
 *
 *  - A member picks a window when alerts are HELD; held alerts arrive,
 *    together, when the window ends. Default ON, 22:00–07:00, in the phone's
 *    time zone. The server holds member alerts and the weekly concept.
 *  - start = end means NO window. A window may cross midnight.
 *  - The app's own LOCAL reminders (localSchedule.ts) cannot be held by the
 *    server, so the scheduler moves any reminder that would fire inside the
 *    window to the window's end, here.
 *
 * Import-free so the node tests load it directly.
 */

/** Times are 'HH:MM', 24-hour, local to the phone's time zone. */
export type QuietWindow = { enabled: boolean; start: string; end: string };

export const DEFAULT_QUIET: QuietWindow = { enabled: true, start: '22:00', end: '07:00' };

/**
 * 'HH:MM' from what the server or a picker gives: 'H:MM', 'HH:MM', or the
 * Postgres `time` text 'HH:MM:SS'. Null for anything else (an out-of-range
 * hour or minute included).
 */
export function normalizeHHMM(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(raw.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Minutes since midnight of an 'HH:MM' (null when it is not one). */
export function minutesOf(hhmm: string): number | null {
  const n = normalizeHHMM(hhmm);
  if (!n) return null;
  return Number(n.slice(0, 2)) * 60 + Number(n.slice(3, 5));
}

/** The window from a `community_notify_prefs_*` row. A missing or unreadable
 *  field falls back to the server's own default for it. */
export function quietFromRow(row: unknown): QuietWindow {
  const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
  return {
    enabled: r.quiet_enabled !== false,
    start: normalizeHHMM(r.quiet_start) ?? DEFAULT_QUIET.start,
    end: normalizeHHMM(r.quiet_end) ?? DEFAULT_QUIET.end,
  };
}

/** True when the window holds anything at all (on, and start ≠ end). */
export function quietActive(w: QuietWindow): boolean {
  const s = minutesOf(w.start);
  const e = minutesOf(w.end);
  return w.enabled && s != null && e != null && s !== e;
}

/**
 * Is minute-of-day `m` (0–1439) inside the window? The start is inside, the
 * end is not (an alert held until 07:00 goes out AT 07:00). start = end, a
 * window that is off, or a malformed time: never.
 */
export function inQuietWindow(m: number, w: QuietWindow): boolean {
  if (!quietActive(w)) return false;
  const s = minutesOf(w.start)!;
  const e = minutesOf(w.end)!;
  const mm = ((Math.floor(m) % 1440) + 1440) % 1440;
  return s < e ? mm >= s && mm < e : mm >= s || mm < e;
}

/**
 * A clock time moved out of the window: unchanged when it is outside;
 * otherwise the window's end, and `dayAdd` 1 when that end falls on the next
 * day (a 23:00 reminder in a 22:00–07:00 window goes out at 07:00 the next
 * morning; a 05:00 one at 07:00 the same morning).
 */
export function releaseClock(hour: number, minute: number, w: QuietWindow): { hour: number; minute: number; dayAdd: 0 | 1 } {
  const m = hour * 60 + minute;
  if (!inQuietWindow(m, w)) return { hour, minute, dayAdd: 0 };
  const e = minutesOf(w.end)!;
  return { hour: Math.floor(e / 60), minute: e % 60, dayAdd: e <= m ? 1 : 0 };
}

/** A one-shot's date moved out of the window (device-local time). */
export function releaseDate(d: Date, w: QuietWindow): Date {
  const r = releaseClock(d.getHours(), d.getMinutes(), w);
  if (r.hour === d.getHours() && r.minute === d.getMinutes() && r.dayAdd === 0) return d;
  const out = new Date(d);
  out.setDate(out.getDate() + r.dayAdd);
  out.setHours(r.hour, r.minute, 0, 0);
  return out;
}

/** A weekly reminder (expo weekday 1 = Sunday … 7 = Saturday) moved out of
 *  the window — the next morning can be the next weekday. */
export function releaseWeekly(weekday: number, hour: number, minute: number, w: QuietWindow): { weekday: number; hour: number; minute: number } {
  const r = releaseClock(hour, minute, w);
  return { weekday: ((weekday - 1 + r.dayAdd) % 7) + 1, hour: r.hour, minute: r.minute };
}

/** '22:00' → '10:00 PM' (the Settings rows and the picker title). */
export function clock12(hhmm: string): string {
  const n = normalizeHHMM(hhmm) ?? '00:00';
  const h = Number(n.slice(0, 2));
  const period = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${n.slice(3, 5)} ${period}`;
}

/**
 * The phone's IANA time zone, sent as `p_tz` with every
 * community_notify_prefs_set call (and once at app start). Null when the
 * engine cannot say — the server then keeps the zone it has.
 */
export function deviceTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === 'string' && /^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(tz) && tz.length <= 64 ? tz : null;
  } catch {
    return null;
  }
}

/** Postgres' "unknown time zone" (the server refused p_tz) — the one error a
 *  save is retried for, without the zone, so a phone with an odd zone name
 *  can still save its other choices. */
export function isUnknownTimeZone(err: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!err) return false;
  return err.code === '22023' || /unknown time zone/i.test(err.message ?? '');
}

export const QUIET_COPY = {
  label: 'Quiet hours',
  hint: 'Alerts wait until this time ends, then arrive together. Messages still come in; only the alert is held.',
  fromLabel: 'FROM',
  toLabel: 'TO',
  fromTitle: 'Quiet hours start',
  toTitle: 'Quiet hours end',
  sameTime: 'Start and end are the same time, so no alerts are held.',
} as const;
