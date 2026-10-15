/**
 * lastTierCache — remember the last tier the SERVER confirmed, per account.
 *
 * ── WHY (2026-09-18) ─────────────────────────────────────────────────────────
 *
 * EntitlementProvider never downgrades a member on a failed read, and it retries
 * a failed boot read three times. Both are right, and neither helps the case
 * that matters most: a member who opens the app with NO NETWORK AT ALL.
 *
 * At boot the current tier is 'anonymous'. Every retry fails. `resolved` flips
 * true in the `.finally()` so the UI never hangs — and `tierKnown` stays false,
 * because nothing was ever known. `withMembershipPreview` gates on `resolved`,
 * so the member is shown the non-member experience across ~40 paid routes.
 *
 * That is failing CLOSED on an infrastructure error, and it happens in exactly
 * the place this app is for: a venue, a rack room, a basement studio. The
 * customer paid, went to work, and the product locked them out.
 *
 * ── WHY A CACHE AND NOT "FAIL OPEN" ──────────────────────────────────────────
 *
 * Failing open would hand every paid lab to anyone who switches on airplane
 * mode. Failing closed locks out paying members. Neither is acceptable, and the
 * choice is false: we already KNOW what this account was last time the server
 * answered. Honouring that is neither a guess nor a giveaway.
 *
 * So the rule is: a tier the server confirmed is remembered, and used ONLY as
 * the starting point for the account it was confirmed for. Any successful read
 * overwrites it immediately. Nobody is ever granted a tier that was not
 * genuinely theirs at some point.
 *
 * ── WHAT KEEPS IT HONEST ─────────────────────────────────────────────────────
 *
 * • Keyed by auth uid, and a mismatch is ignored — an account switch can never
 *   inherit the previous member's standing.
 * • Written only from a read that produced a DEFINITIVE tier.
 * • Stored under `ape:*`, so `clearLocalAccountData` wipes it on sign-out and
 *   account switch like any other user data. It is deliberately NOT on the KEEP
 *   list.
 * • 'anonymous' is never cached: it is the absence of standing, and caching it
 *   would only ever be used to deny someone.
 *
 * The staleness window is bounded by the next successful read. A membership that
 * lapsed while the device was offline stays honoured until the app next reaches
 * the server — which is the same window in which we could not have known
 * anyway, and erring toward the paying customer is the owner's standing rule.
 *
 * BOUNDED SINCE 2026-10-14 (toddler hunt #4, owner pick): that window used to
 * have no end — a member who never came back online kept access forever. The
 * access END DATE is now remembered with an academy tier, and past it plus a
 * 3-day grace (OFFLINE_GRACE_MS, entitlementExpiry.ts) the remembered tier
 * reads 'lapsed'. Lifetime / no-end grants have no end date and are unchanged.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entitlement } from './EntitlementProvider';
import { softDeadline } from '../../lib/boundedCall';
import { pastOfflineGrace } from './entitlementExpiry';

const KEY = 'ape:ent:lastTier';
/** A local storage read; anything near this is a stall, not a slow answer. */
export const LAST_TIER_READ_MS = 3000;

/** `endsAt` (toddler hunt #4, 2026-10-14): when the confirmed academy access
 *  ENDS (epoch ms), null when it has no known end (lifetime, a no-end code), and
 *  absent on entries written before it was remembered — which keep the old
 *  no-limit behaviour until the next server answer rewrites them. */
type Cached = { uid: string; tier: Entitlement; at: number; endsAt?: number | null };

/** Remember a tier the server actually confirmed. Never throws.
 *  `endsAt` is `accessEndsAt(rows)` for an academy answer (null = no known end). */
export async function saveLastTier(uid: string | null, tier: Entitlement, endsAt: number | null = null): Promise<void> {
  // No account, or no standing to remember. Caching 'anonymous' could only ever
  // be used to withhold access, which is the failure this module exists to stop.
  if (!uid || tier === 'anonymous') return;
  try {
    const entry: Cached = { uid, tier, at: Date.now(), endsAt: tier === 'academy' ? endsAt : null };
    await AsyncStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    /* a cache that cannot be written simply is not used */
  }
}

/**
 * The last confirmed tier FOR THIS ACCOUNT, or null.
 *
 * Returns null on any doubt — no entry, a different account, unreadable
 * storage, or a shape we do not recognise. Null means "start where we always
 * started", so a broken cache costs nothing beyond the old behaviour.
 */
export async function loadLastTier(
  uid: string | null,
  opts: { now?: number; onEndsAt?: (endsAt: number | null) => void } = {},
): Promise<Entitlement | null> {
  // OFFLINE GRACE (toddler hunt #4, 2026-10-14). A remembered academy tier whose
  // access end date passed more than OFFLINE_GRACE_MS ago comes back as
  // lapsed: this phone has not reached the server since the membership known
  // end, so it is no longer treated as a member. Nothing is deleted, and the
  // next server answer (a renewal reads academy again) replaces it. The end
  // date is handed to onEndsAt so the provider can apply the same grace if the
  // app then stays open offline. (An option, not a second export: the
  // provider test harnesses stub this module with these two functions only.)
  const now = opts.now ?? Date.now();
  if (!uid) return null;
  try {
    // ⛔ BOUNDED (hunt 5, 2026-10-03). The provider's boot chain awaits this
    // BEFORE its `.finally()` flips `resolved` — the one setter — so a storage
    // read that never settled left every tier 'unknown' for the whole run:
    // members-only labs on GateHold, Home on its first-paint hold, even after
    // INITIAL_SESSION had produced the tier. A stall reads as "no cache".
    const raw = await softDeadline(() => AsyncStorage.getItem(KEY), null, 'lastTier read', LAST_TIER_READ_MS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Cached> | null;
    if (!parsed || parsed.uid !== uid) return null;
    const tier = parsed.tier;
    // A remembered end date is only ever a finite number; anything else reads
    // as "no known end" (the pre-2026-10-14 behaviour), never as a past date.
    const endsAt = typeof parsed.endsAt === 'number' && Number.isFinite(parsed.endsAt) ? parsed.endsAt : null;
    // Explicitly enumerated rather than cast: this value decides paid access,
    // and a corrupted store must not be able to invent a tier.
    if (tier === 'academy') {
      opts.onEndsAt?.(endsAt);
      return pastOfflineGrace(endsAt, now) ? 'lapsed' : tier;
    }
    if (tier === 'free' || tier === 'lapsed') return tier;
    return null;
  } catch {
    return null;
  }
}

/** Forget it. Used by the account wipe; safe to call at any time. */
export async function clearLastTier(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
