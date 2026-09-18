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
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entitlement } from './EntitlementProvider';

const KEY = 'ape:ent:lastTier';

type Cached = { uid: string; tier: Entitlement; at: number };

/** Remember a tier the server actually confirmed. Never throws. */
export async function saveLastTier(uid: string | null, tier: Entitlement): Promise<void> {
  // No account, or no standing to remember. Caching 'anonymous' could only ever
  // be used to withhold access, which is the failure this module exists to stop.
  if (!uid || tier === 'anonymous') return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ uid, tier, at: Date.now() } satisfies Cached));
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
export async function loadLastTier(uid: string | null): Promise<Entitlement | null> {
  if (!uid) return null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Cached> | null;
    if (!parsed || parsed.uid !== uid) return null;
    const tier = parsed.tier;
    // Explicitly enumerated rather than cast: this value decides paid access,
    // and a corrupted store must not be able to invent a tier.
    if (tier === 'academy' || tier === 'free' || tier === 'lapsed') return tier;
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
