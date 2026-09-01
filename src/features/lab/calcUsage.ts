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
 * FAIL-OPEN: if the RPC is missing (SQL not yet run), errors, or the network is
 * down, we return `unavailable: true` with `allowed: true` so calculators never
 * break — enforcement simply switches on once the migration is deployed and
 * reachable. Academy is unlimited and must never call these.
 */
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

const OPEN: CalcUsage = {
  used: 0,
  limit: CALC_WEEKLY_LIMIT,
  windowStart: null,
  allowed: true,
  unavailable: true,
};

/** Spend one credit for a newly revealed calculation. */
export async function consumeCalc(): Promise<CalcUsage> {
  try {
    const { data, error } = await supabase.rpc('calc_consume');
    const row = (data as Row[] | null)?.[0];
    if (error || !row) {
      if (error) console.warn('[calc] calc_consume unavailable:', error.message);
      return OPEN;
    }
    // The RPC returns allowed in its own column via the SETOF row shape.
    return fromRow(row, (row as Row & { allowed?: boolean }).allowed ?? true);
  } catch {
    return OPEN;
  }
}

/** Read the current week's usage without spending a credit (for the counter). */
export async function getCalcStatus(): Promise<CalcUsage> {
  try {
    const { data, error } = await supabase.rpc('calc_usage_status');
    const row = (data as Row[] | null)?.[0];
    if (error || !row) return OPEN;
    return fromRow(row, row.used < (row.lim ?? CALC_WEEKLY_LIMIT));
  } catch {
    return OPEN;
  }
}
