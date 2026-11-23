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
 *
 * ── A KNOWN GUEST COUNTS ON THE DEVICE (owner 2026-11-23) ────────────────────
 *
 * "in the calculator the guest user does get an allowance per week of use".
 * A guest used to be walled ("Create a free account (or sign in) to run
 * calculations"). A KNOWN guest (no session, tier known) now gets the same
 * CALC_WEEKLY_LIMIT a week, counted in this file's device window, exactly as
 * glossaryCap.ts's 'local' backend does for the glossary. There is no account
 * to count against, so mode 'local' NEVER calls calc_consume /
 * calc_usage_status (and never waits out their 8 s deadline). Same key, same
 * never-overwrite-an-unreadable-read rule, same serialized read-modify-write.
 * For a guest the device IS the meter, so `unavailable` is false unless the
 * device read itself failed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';

// Display/fail-open fallback ONLY — the live number is whatever the server
// returns (v_limit in calc_consume / calc_usage_status). Keep the two in step:
// docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL sets the server to 5.
export const CALC_WEEKLY_LIMIT = 5;

/** Who keeps the count (owner 2026-11-23). 'server' — a signed-in free or
 *  lapsed account: the RPCs, with the device window as the floor when the
 *  server cannot answer. 'local' — a KNOWN guest: the device window only,
 *  no RPC. An UNKNOWN tier is never metered as a guest (the screen decides). */
export type CalcMeterMode = 'server' | 'local';

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

/**
 * The device window as last READ or WRITTEN in this app run (wave 2,
 * 2026-10-02). A read that THREW used to answer "no window" — 0 used — and
 * the next calculation wrote `{ used: 1 }` over the stored count: a fresh
 * week of free calculations, and the real window gone. Now an unreadable
 * device window is never written over: the count goes on in memory from
 * what this run last knew (or from zero, for this run only), the stored copy
 * stands, and the next read that succeeds takes over again. Calculators
 * still never break (the fail-open test/calcUsage.test.ts pins), and a run
 * whose storage cannot be read is still capped.
 *
 * No identity fence: the key is on the account wipe's KEEP list (a rate
 * limit, not user memory — clearLocalAccountData), so it does not change
 * hands with the account.
 */
let lastKnown: LocalState | null = null;

/** The stored window; `'unreadable'` when the read itself threw. A missing
 *  or damaged value is "no window" and may be written. */
async function readLocal(): Promise<LocalState | null | 'unreadable'> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(LOCAL_KEY);
  } catch {
    return 'unreadable';
  }
  try {
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
    /* best-effort: the in-memory window (lastKnown) carries it for this run */
  }
}

/** Read-modify-write is serialized: two quick CALCULATE taps offline must
 *  not both read 2 and both write 3. */
let localChain: Promise<unknown> = Promise.resolve();
function serial<T>(run: () => Promise<T>): Promise<T> {
  const p = localChain.then(run);
  localChain = p.catch(() => undefined);
  return p;
}

/** Spend one credit against the DEVICE window: when the server cannot answer
 *  (`provisional`, an account's floor), or as a KNOWN guest's own meter. */
function consumeLocal(provisional: boolean): Promise<CalcUsage> {
  return serial(async () => {
    const now = Date.now();
    const read = await readLocal();
    const unreadable = read === 'unreadable';
    // A failed read is NOT "0 used": go on from what this run last knew, and
    // never write over the stored window.
    const cur = unreadable ? lastKnown : read;
    // An account's fallback stays `unavailable` TRUE throughout: the UI should
    // still say the count is provisional, because it is. What changes is that
    // `allowed` can now be false. A guest's count is the device's own, so it
    // is provisional only when the device read failed.
    const unavailable = provisional || unreadable;
    if (!cur || now - cur.windowStart >= WEEK_MS) {
      const next = { windowStart: now, used: 1 };
      lastKnown = next;
      if (!unreadable) await writeLocal(next);
      return { used: 1, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(now).toISOString(), allowed: true, unavailable };
    }
    if (cur.used >= CALC_WEEKLY_LIMIT) {
      lastKnown = cur;
      return { used: cur.used, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(cur.windowStart).toISOString(), allowed: false, unavailable };
    }
    const next = { windowStart: cur.windowStart, used: cur.used + 1 };
    lastKnown = next;
    if (!unreadable) await writeLocal(next);
    return { used: next.used, limit: CALC_WEEKLY_LIMIT, windowStart: new Date(cur.windowStart).toISOString(), allowed: true, unavailable };
  });
}

/** Read the device window without spending (an account's offline floor, or
 *  a KNOWN guest's own meter). An unreadable window shows what this run last
 *  knew, never a reset. */
function statusLocal(provisional: boolean): Promise<CalcUsage> {
  return serial(async () => {
    const now = Date.now();
    const read = await readLocal();
    const unreadable = read === 'unreadable';
    if (!unreadable) lastKnown = read;
    const cur = lastKnown;
    const unavailable = provisional || unreadable;
    if (!cur || now - cur.windowStart >= WEEK_MS) {
      return { used: 0, limit: CALC_WEEKLY_LIMIT, windowStart: null, allowed: true, unavailable };
    }
    return {
      used: cur.used,
      limit: CALC_WEEKLY_LIMIT,
      windowStart: new Date(cur.windowStart).toISOString(),
      allowed: cur.used < CALC_WEEKLY_LIMIT,
      unavailable,
    };
  });
}

/** Spend one credit for a newly revealed calculation. `mode` 'local' is a
 *  KNOWN guest (owner 2026-11-23): the device window only, never the RPC. */
export async function consumeCalc(mode: CalcMeterMode = 'server'): Promise<CalcUsage> {
  if (mode === 'local') return consumeLocal(false);
  try {
    /**
     * ⛔ BOUNDED (2026-09-23 overnight hunt). This file says at the top that it
     * "mirrors glossaryCap.ts" — and it did, line for line, EXCEPT for the
     * deadline that was later added to the original. The copy drifted, which is
     * why boundedCall.ts now exists instead of a sixth hand-written variant.
     *
     * Unbounded, a stalled connection left CalcWorkspaceScreen's button
     * disabled and reading "CALCULATING…" for the life of the screen — while
     * the answer had been computed locally and was sitting there ready.
     *
     * Rejecting rather than resolving is deliberate: the catch below already
     * falls back to `consumeLocal()`, the device-local window this file is
     * built around. A timeout should take exactly that path.
     */
    const { data, error } = await withDeadline(
      // `async () =>`: the Supabase builder is a thenable, not a Promise.
      async () => await supabase.rpc('calc_consume'),
      'calc_consume',
      8000,
    );
    const row = (data as Row[] | null)?.[0];
    if (error || !row) {
      if (error) console.warn('[calc] calc_consume unavailable, using device window:', error.message);
      return await consumeLocal(true);
    }
    // The RPC returns allowed in its own column via the SETOF row shape.
    return fromRow(row, (row as Row & { allowed?: boolean }).allowed ?? true);
  } catch {
    return await consumeLocal(true);
  }
}

/** Read the current week's usage without spending a credit (for the counter).
 *  `mode` 'local' is a KNOWN guest (owner 2026-11-23): the device window only. */
export async function getCalcStatus(mode: CalcMeterMode = 'server'): Promise<CalcUsage> {
  if (mode === 'local') return statusLocal(false);
  try {
    // Bounded like consumeCalc (bug pass 2026-09-30): a stalled read left the
    // "# / 5" counter missing for the life of the screen; a timeout rejects
    // into the device window below, exactly like an error.
    const { data, error } = await withDeadline(
      async () => await supabase.rpc('calc_usage_status'),
      'calc_usage_status',
      8000,
    );
    const row = (data as Row[] | null)?.[0];
    // Falls back to the DEVICE window rather than a blank "no cap" — the
    // counter vanishing while offline is what made the bypass discoverable.
    if (error || !row) return await statusLocal(true);
    return fromRow(row, row.used < (row.lim ?? CALC_WEEKLY_LIMIT));
  } catch {
    return await statusLocal(true);
  }
}
