/**
 * useTier — the live tri-state tier for a screen (see ./tier.ts).
 *
 * One hook in place of the two-state `resolved && entitlement ===
 * 'anonymous'` every lab host spelled out by hand: the entitlement provider
 * plus the members-only preview flag, folded into a `Tier` that cannot read
 * "guest" or "member" while the answer is still unknown.
 */
import { useEntitlement } from './EntitlementProvider';
import { useLabPreview } from '../lab/labPreviewStore';
import { guestWordingOf, memberGateOf, tierOf, upsellAllowed, type MemberGate, type Tier } from './tier';

export function useTier(): Tier {
  const { entitlement, resolved } = useEntitlement();
  const preview = useLabPreview().active;
  return tierOf(entitlement, resolved, preview);
}

/** May this screen show "free" / membership / upgrade copy? Only once a read
 *  has actually produced the tier (`tierKnown`) — a member whose read failed
 *  is never marketed to (final round A, 2026-10-02). See `upsellAllowed`. */
export function useUpsellAllowed(): boolean {
  const { tierKnown } = useEntitlement();
  return upsellAllowed(useTier(), tierKnown);
}

/** The members-only gate's honest state for a screen (tier sweep 2026-10-03):
 *  'open' | 'locked' | 'checking' | 'unconfirmed'. See `memberGateOf`. */
export function useMemberGate(): MemberGate {
  const { entitlement, resolved, tierKnown, tierReadFailed } = useEntitlement();
  return memberGateOf(tierOf(entitlement, resolved), tierKnown, tierReadFailed);
}

/** The ONE place a screen decides whether to SAY "you are not signed in" /
 *  "won't be saved without an account" (tier sweep 2026-10-03): a KNOWN guest
 *  (or a members-only preview) only. `account` names the honest middle state
 *  for a learner the resolved-based tier calls 'guest' but no read confirmed:
 *  'checking' while the provider retries, 'unconfirmed' once it gave up.
 *  Wording only — the labs' hold / carry / save-block rules stay on
 *  `isGuestTier(useTier())` (useLabEndGuest), unchanged. */
export function useGuestWording(): { guest: boolean; account?: 'checking' | 'unconfirmed' } {
  const { tierKnown, tierReadFailed } = useEntitlement();
  // 'unknown' (before the first read) reads 'checking' — never "saved".
  return guestWordingOf(useTier(), tierKnown, tierReadFailed);
}
