/**
 * Access / promo code redemption (owner 2026-08-21: a launch feature).
 *
 * Purpose (owner): comp free Academy accounts for key influencers, bulk-granted
 * seats, and temporary event/convention offers. The code is entered on Create
 * Account (or redeemed later from Settings) and applied through ONE server RPC —
 * the client never decides entitlement, it just asks the server to redeem and
 * then re-reads the real entitlement.
 *
 * Backend: `redeem_access_code(p_code text) returns jsonb` (SECURITY DEFINER),
 * plus the `access_codes` / `access_code_redemptions` tables — an owner-run,
 * narrow amendment to the frozen backend (same pattern as the mic catalog).
 * Migration: docs/APE_ACCESS_CODES_2026_08_21.sql. Until the owner runs it, this
 * FAILS OPEN: the account is still created; the code simply reports unavailable.
 *
 * GRANT codes (comp academy) are functional at launch. DISCOUNT codes need the
 * in-app purchase / checkout flow (not built yet), so the server returns
 * `discount_pending` and the client explains it applies at purchase.
 */
import { supabase } from '../../lib/supabase';

export type RedeemStatus =
  | 'granted' // academy access comped (perpetual or time-limited)
  | 'already_active' // caller already has this access / already redeemed
  | 'invalid' // unknown code
  | 'expired' // code past its validity window
  | 'used_up' // code hit its max redemptions
  | 'discount_pending' // a valid discount code, but checkout isn't live yet
  | 'not_authenticated' // no session (must be signed in to redeem)
  | 'unavailable' // RPC missing / transport error — feature not live yet
  | 'error';

export type RedeemResult = {
  ok: boolean; // true only when access was actually granted / already active
  status: RedeemStatus;
  tier: 'academy' | null;
  expiresAt: string | null;
  message: string;
};

const MESSAGES: Record<RedeemStatus, string> = {
  granted: 'Code applied — your Academy access is active.',
  already_active: 'You already have this access — nothing to redeem.',
  invalid: 'That code isn’t recognized. Check it and try again.',
  expired: 'That code has expired.',
  used_up: 'That code has reached its redemption limit.',
  discount_pending: 'That’s a discount code — it’ll apply at checkout when purchasing is available.',
  not_authenticated: 'Sign in or create an account first, then redeem your code.',
  unavailable: 'Code redemption isn’t available yet. Your account is set up — try the code again later.',
  error: 'Couldn’t redeem the code right now. Please try again.',
};

const OK_STATUSES: ReadonlySet<RedeemStatus> = new Set<RedeemStatus>(['granted', 'already_active']);

function result(status: RedeemStatus, extra?: { tier?: 'academy' | null; expiresAt?: string | null; message?: string }): RedeemResult {
  return {
    ok: OK_STATUSES.has(status),
    status,
    tier: extra?.tier ?? (status === 'granted' || status === 'already_active' ? 'academy' : null),
    expiresAt: extra?.expiresAt ?? null,
    message: extra?.message ?? MESSAGES[status],
  };
}

/**
 * Redeem an access/promo code for the CURRENT signed-in user. Never throws;
 * returns a typed result. Safe to call even before the backend migration exists
 * (returns `unavailable`), so it never blocks account creation.
 */
export async function redeemAccessCode(code: string): Promise<RedeemResult> {
  const trimmed = code.trim();
  if (!trimmed) return result('invalid');

  // Must be signed in — redemption writes an entitlement for auth.uid().
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return result('not_authenticated');

  try {
    const { data, error } = await supabase.rpc('redeem_access_code', { p_code: trimmed });
    if (error) {
      // PGRST202 (function missing) = migration not run yet → fail open.
      console.warn('[access-code] redeem_access_code error:', error.message);
      return result('unavailable');
    }
    const payload = (data ?? {}) as { status?: string; tier?: string; expires_at?: string | null; message?: string };
    const status = (payload.status ?? 'error') as RedeemStatus;
    const known: RedeemStatus = status in MESSAGES ? status : 'error';
    return result(known, {
      tier: payload.tier === 'academy' ? 'academy' : undefined,
      expiresAt: payload.expires_at ?? null,
      message: payload.message || undefined,
    });
  } catch (e) {
    console.warn('[access-code] redeem threw:', (e as Error).message);
    return result('unavailable');
  }
}
