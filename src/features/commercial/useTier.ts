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
import { tierOf, upsellAllowed, type Tier } from './tier';

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
