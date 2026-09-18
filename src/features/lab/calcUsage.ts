/**
 * Calculator weekly-usage cap (owner 2026-08-13; allowance set to 5 by the
 * owner 2026-09-01) — client side of the server-enforced per-rolling-week
 * limit for FREE and LAPSED accounts. The lab itself is always OPEN to every
 * tier; this cap is the only free-tier limit.
 *
 * The count lives on the server (docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.sql):
 *   - calc_consume()      spends one credit when a capped user reveals a NEW
 *                         result (the CALCULATE button). Returns the post-state.
 *   - calc_usage_status() read-only, powers the "# / N" counter.
 *
 * ── THE SERVER IS THE METER, AND THE DEVICE IS THE FLOOR (2026-09-18) ────────
 *
 * Calculators compute LOCALLY — the RPC is only the counter. So the old
 * unconditional fail-open meant a free account in aeroplane mode got UNLIMITED
 * calculations, forever, with no counter and no paywall: swipe down the control
 * centre and the cap on the app's largest paid boundary (53 workspaces) simply
 * stops existing. Worse, the counter DISAPPEARED while bypassed, which is what
 * makes it discoverable rather than theoretical.
 *
 * So an unreachable server now falls back to a DEVICE-LOCAL rolling-week count,
 * exactly as `features/glossary/glossaryCap.ts` already does for guests. It is
 * not tamper-proof — nothing on the device can be — but it is no longer
 * defeated by a switch every phone has on its home screen.
 *
 * It stays fail-SOFT in the way that matters: the local window is only ever
 * consulted when the server cannot answer, the server's number always wins when
 * it can, and `unavailable` is still reported so the UI can say the count is
 * provisional. Academy is unlimited and must never call these.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';

// Display/fail-open fallback ONLY — the live number is whatever the server
// returns (v_limit in calc_consume / calc_usage_status). Keep the two in step:
// docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL sets the server to 5.
export const CALC_WEEKLY_LIMIT = 5;

export type CalcUsage = {
  used: number;
  limit: number;
  windowStart: string | null;
  allowed: boolean;
  /** True when the server was unreachable / the RPC is absent — treat as no cap. */
  unavailable: boolean;
};

type Row = { used: number; lim: number; window_start: string };

const fromRow = (r: Row, allowed: boolean): CalcUsage => ({
  used: r.used,
  limit: r.lim ?? CALC_WEEKLY_LIMIT,
  windowStart: r.window_start ?? null,
  allowed,
  unavailable: false,
});

/* ── device-local fallback window ────────────────────────────────────────────
   Mirrors glossaryCap.ts's guest window. Used ONLY when the server cannot
   answer; any successful RPC supersedes it. */
const LOCAL_KEY = 'ape:calc:usageLocal';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
type LocalState = { windowStart: number; used: number };

async function readLocal(): Promise<LocalState | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LocalState> | null;
    if (!p || typeof p.windowStart !== 'number' || typeof p.used !== 'number') return null;
    return { windowStart: p.windowStart, used: p.used };
  } catch {
    return null;
  }
}

async function writeLocal(s: LocalState): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch {
    /* best-effort: a device that cannot persist falls back to the old behaviour */
  }
}

/** Spend one credit against the DEVICE window, when the server cannot answer. */
async function consumeLocal(): Promise<CalcUsage> {
  const now = Date.now();
  const cur = await readLocal();
  // `unavailable` stays TRUE throughout: the UI should still say the count is
  // provisional, because it is. What changes is that `allowed` can now be false.
  if (!cur || now - cur.windowStart >= WEEK_MS) {
    await writeLocal({ windowStart: now, used: 1 });
    return { used: 1, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(now).toISOString(), allowed: true, unavailable: true };
  }
  if (cur.used >= CALC_WEEKLY_LIMIT) {
    return { used: cur.used, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(cur.windowStart).toISOString(), allowed: false, unavailable: true };
  }
  const next = { windowStart: cur.windowStart, used: cur.used + 1 };
  await writeLocal(next);
  return { used: next.used, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(cur.windowStart).toISOString(), allowed: true, unavailable: true };
}

/** Read the device window without spending, when the server cannot answer. */
async function statusLocal(): Promise<CalcUsage> {
  const now = Date.now();
  const cur = await readLocal();
  if (!cur || now - cur.windowStart >= WEEK_MS) {
    return { used: 0, limit: CALC_WEEKLY_LIMIT, windowStart: null, allowed: true, unavailable: true };
  }
  return {
    used: cur.used,
    limit: CALC_WEEKLY_LIMIT,
    windowStart: new Date(cur.windowStart).toISOString(),
    allowed: cur.used < CALC_WEEKLY_LIMIT,
    unavailable: true,
  };
}

/** Spend one credit for a newly revealed calculation. */
export async function consumeCalc(): Promise<CalcUsage> {
  try {
    const { data, error } = await supabase.rpc('calc_consume');
    const row = (data as Row[] | null)?.[0];
    if (error || !row) {
      if (error) console.warn('[calc] calc_consume unavailable, using device window:', error.message);
      return await consumeLocal();
    }
    // The RPC returns allowed in its own column via the SETOF row shape.
    return fromRow(row, (row as Row & { allowed?: boolean }).allowed ?? true);
  } catch {
    return await consumeLocal();
  }
}

/** Read the current week's usage without spending a credit (for the counter). */
export async function getCalcStatus(): Promise<CalcUsage> {
  try {
    const { data, error } = await supabase.rpc('calc_usage_status');
    const row = (data as Row[] | null)?.[0];
    // Falls back to the DEVICE window rather than a blank "no cap" — the
    // counter vanishing while offline is what made the bypass discoverable.
    if (error || !row) return await statusLocal();
    return fromRow(row, row.used < (row.lim ?? CALC_WEEKLY_LIMIT));
  } catch {
    return await statusLocal();
  }
}
