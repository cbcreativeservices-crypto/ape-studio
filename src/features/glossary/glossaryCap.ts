/**
 * Glossary weekly-lookup cap (owner 2026-09-10) — client side of the
 * server-enforced per-rolling-week limit for FREE / LAPSED accounts, plus a
 * device-local mirror for anonymous guests (who have no account to count).
 * The glossary itself stays fully OPEN to every tier; this cap is the only
 * free-tier limit on it. Academy is UNLIMITED and must never be metered.
 *
 * WHAT COUNTS (owner 2026-09-10): opening a definition to view it = +1. The
 * search itself is free — a search plus the first definition opened from it is a
 * single +1; each further definition opened is +1; a definition opened after
 * scrolling the list is +1. (The screen dedupes re-opens within a session so a
 * term already viewed this session is free.)
 *
 * TWO BACKENDS, one shape:
 *   - 'server' — signed-in free/lapsed. glossary_consume / glossary_usage_status
 *     SECURITY-DEFINER RPCs (docs/APE_GLOSSARY_WEEKLY_LIMIT_14_2026_09_10.SQL).
 *   - 'local'  — anonymous / logged-out guests. A device-local rolling-week
 *     window in AsyncStorage (owner ruling: "guests capped too, device-local").
 *
 * FAIL-OPEN: if the RPC is missing (SQL not yet run), errors, the network is
 * down, or device storage is unreadable, we return `unavailable: true` with
 * `allowed: true` so the glossary never breaks — enforcement simply switches on
 * once the migration is deployed / storage is reachable.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

// Display/fail-open fallback ONLY — the live number is whatever the server
// returns (v_limit in glossary_consume / glossary_usage_status). Keep the two
// in step: the SQL above sets the server to 14.
export const GLOSSARY_WEEKLY_LIMIT = 14;

// Client-side warning threshold (Option A, owner 2026-09-10): when `used`
// reaches this, show the "N left" heads-up. 7 used → 7 left of 14. The server
// owns only the hard limit; this is purely the nudge point.
export const GLOSSARY_WARN_AT_USED = 7;

/** The rolling window (7 days). The lock view adds this to `windowStart` to show
 *  the countdown to reset. Kept in step with v_window in the SQL. */
export const GLOSSARY_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type CapMode = 'server' | 'local';

export type GlossaryUsage = {
  used: number;
  limit: number;
  allowed: boolean;
  /** Epoch ms the current window began (server row / local store). null when
   *  unknown (unavailable). resetAt = windowStart + GLOSSARY_WEEK_MS. */
  windowStart: number | null;
  /** True when the server/store was unreachable — treat as no cap (fail-open). */
  unavailable: boolean;
};

const OPEN: GlossaryUsage = {
  used: 0,
  limit: GLOSSARY_WEEKLY_LIMIT,
  allowed: true,
  windowStart: null,
  unavailable: true,
};

// ── SERVER backend (signed-in free / lapsed) ───────────────────────────────
type Row = { used: number; lim: number; window_start: string; allowed?: boolean };

/** Parse the RPC's timestamptz → epoch ms, or null if unparseable. */
function wsMs(window_start: string | null | undefined): number | null {
  if (!window_start) return null;
  const t = Date.parse(window_start);
  return Number.isFinite(t) ? t : null;
}

async function consumeServer(): Promise<GlossaryUsage> {
  try {
    const { data, error } = await supabase.rpc('glossary_consume');
    const row = (data as Row[] | null)?.[0];
    if (error || !row) {
      if (error) console.warn('[glossary] glossary_consume unavailable:', error.message);
      return OPEN;
    }
    return {
      used: row.used,
      limit: row.lim ?? GLOSSARY_WEEKLY_LIMIT,
      allowed: row.allowed ?? true,
      windowStart: wsMs(row.window_start),
      unavailable: false,
    };
  } catch {
    return OPEN;
  }
}

async function statusServer(): Promise<GlossaryUsage> {
  try {
    const { data, error } = await supabase.rpc('glossary_usage_status');
    const row = (data as Row[] | null)?.[0];
    if (error || !row) return OPEN;
    const limit = row.lim ?? GLOSSARY_WEEKLY_LIMIT;
    return { used: row.used, limit, allowed: row.used < limit, windowStart: wsMs(row.window_start), unavailable: false };
  } catch {
    return OPEN;
  }
}

// ── LOCAL backend (anonymous / logged-out guests) ──────────────────────────
// A single device-local rolling-week window. Best-effort: any storage error
// fails OPEN (never blocks a guest because their disk hiccuped).
const LOCAL_KEY = 'ape:glossaryUsageLocal';
const WEEK_MS = GLOSSARY_WEEK_MS;
type LocalState = { windowStart: number; used: number };

async function readLocal(): Promise<LocalState | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LocalState;
    if (s && typeof s.windowStart === 'number' && typeof s.used === 'number') return s;
    return null;
  } catch {
    return null;
  }
}

async function writeLocal(s: LocalState): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch {
    /* device-local best-effort — a failed write just means no persistence */
  }
}

async function consumeLocal(): Promise<GlossaryUsage> {
  const now = Date.now();
  const cur = await readLocal();
  // No window yet, or the rolling week elapsed -> (re)start the count at 1.
  if (!cur || now - cur.windowStart >= WEEK_MS) {
    await writeLocal({ windowStart: now, used: 1 });
    return { used: 1, limit: GLOSSARY_WEEKLY_LIMIT, allowed: true, windowStart: now, unavailable: false };
  }
  // Within the window and already at the cap -> block, do not increment.
  if (cur.used >= GLOSSARY_WEEKLY_LIMIT) {
    return { used: cur.used, limit: GLOSSARY_WEEKLY_LIMIT, allowed: false, windowStart: cur.windowStart, unavailable: false };
  }
  const next: LocalState = { windowStart: cur.windowStart, used: cur.used + 1 };
  await writeLocal(next);
  return { used: next.used, limit: GLOSSARY_WEEKLY_LIMIT, allowed: true, windowStart: cur.windowStart, unavailable: false };
}

async function statusLocal(): Promise<GlossaryUsage> {
  const now = Date.now();
  const cur = await readLocal();
  if (!cur || now - cur.windowStart >= WEEK_MS) {
    return { used: 0, limit: GLOSSARY_WEEKLY_LIMIT, allowed: true, windowStart: null, unavailable: false };
  }
  return {
    used: cur.used,
    limit: GLOSSARY_WEEKLY_LIMIT,
    allowed: cur.used < GLOSSARY_WEEKLY_LIMIT,
    windowStart: cur.windowStart,
    unavailable: false,
  };
}

// ── Unified entry points — the screen picks the backend by tier ────────────

/** Spend one credit for a newly opened definition. */
export function consumeGlossary(mode: CapMode): Promise<GlossaryUsage> {
  return mode === 'server' ? consumeServer() : consumeLocal();
}

/** Read the current week's usage without spending a credit. */
export function getGlossaryStatus(mode: CapMode): Promise<GlossaryUsage> {
  return mode === 'server' ? statusServer() : statusLocal();
}
