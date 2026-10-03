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
 * Every code is a GRANT code (comp academy). There are no discount codes (owner
 * 2026-09-25: "there are no discount codes. just codes."); the app has no
 * message for the server's old `discount_pending` answer, so if one ever came
 * back it falls through to 'error'. Computer A was asked to drop the
 * 'discount' kind from access_codes.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { withDeadline } from '../../lib/boundedCall';
import { isRealAccount } from './realAccount';

export type RedeemStatus =
  | 'granted' // academy access comped (perpetual or time-limited)
  | 'already_active' // caller already has this access / already redeemed
  | 'invalid' // unknown code
  | 'expired' // code past its validity window
  | 'used_up' // code hit its max redemptions
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
  invalid: 'That code isn’t recognized. Check it, including the dashes (-), and try again.',
  expired: 'That code has expired.',
  used_up: 'That code has reached its redemption limit.',
  not_authenticated: 'Sign in or create an account first, then redeem your code.',
  // `unavailable` is returned for ANY RPC error and any thrown exception,
  // including a plain network drop — and it is shown from Settings → Redeem
  // too, where "your account is set up" is nonsense to someone who already
  // has one. Say what we actually know: we could not reach the server.
  unavailable:
    'We couldn’t reach the Academy to check that code. Your code has not been used — try it again in a moment.',
  error: 'Couldn’t redeem the code right now. Please try again.',
};

/** A code was GRANTED but the device's tier read did not come back as a
 *  member (final round A, 2026-10-02). Settings said "your Academy access is
 *  active" while the app stayed locked. The second sentence is the Paywall's
 *  owner-ratified restore wording for the same situation, reused verbatim. */
export const REDEEM_GRANTED_NOT_REFRESHED =
  'Your code was accepted and your membership is recorded. We couldn’t refresh your access on this device yet — it will unlock shortly, or restart the app.';

/** The session read stalled or failed, so we do not know who is signed in —
 *  never "sign in first" to someone who may well be (final round D). */
export const SESSION_UNREACHED_MESSAGE =
  'We couldn’t reach your account just now — check your connection and try again.';

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
  // ⚠️ An anonymous device key is a session but not an account. Redeeming
  // against it would write the entitlement to a uid the nightly purge deletes
  // in seven days — the user would redeem and then silently lose it.
  // A STALLED or failed session read is not "signed out" (final round D,
  // 2026-10-03): a signed-in member was told to sign in. Nothing was sent, so
  // the code is untouched — say what happened and let them retry.
  const { result: got, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'accessCode');
  if (timedOut) return result('error', { message: SESSION_UNREACHED_MESSAGE });
  const sess = got.data;
  if (!isRealAccount(sess.session)) return result('not_authenticated');

  try {
    // BOUNDED (bug pass 3, 2026-09-30): a stalled RPC left Settings' REDEEM
    // spinning with no Cancel (iOS has no BACK) and Create Account on its
    // spinner after the account already existed. A stall is NOT 'unavailable'
    // — that copy promises the code was not used, and after a timeout we do
    // not know — so it answers 'error' ("try again"; a used code then reads
    // "already active").
    const { data, error } = await withDeadline(
      async () => await supabase.rpc('redeem_access_code', { p_code: trimmed }),
      'redeem_access_code',
    );
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
    const message = (e as Error)?.message ?? '';
    console.warn('[access-code] redeem threw:', message);
    return result(/redeem_access_code timeout/.test(message) ? 'error' : 'unavailable');
  }
}
