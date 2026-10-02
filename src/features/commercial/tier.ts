/**
 * tier — the membership standing as a TRI-STATE, not a boolean (pattern
 * catalog 2026-10-02, closer A5 for class P8).
 *
 * The provider boots at `entitlement: 'anonymous'` and stays there until the
 * first server read lands (`resolved`). Every `isGuest = entitlement ===
 * 'anonymous'` therefore reads TRUE for a paying member for the first second
 * of every launch, and every `if (isGuest) return;` written the other way
 * round reads "not a guest" for a real guest in the same window. Both have
 * shipped bugs: a guest's work written to the device, a member told their
 * work is not saved, a guest's empty copy saved over a signed-in learner's
 * real progress, a members-only preview earning credit.
 *
 * With a tri-state the unknown window cannot be mistaken for either answer:
 *
 *   'unknown'  — no read has landed yet. Persist NOTHING, decide NOTHING:
 *                hold the work (features/lab/sessionCarry) and wait.
 *   'preview'  — a members-only preview is active. PREVIEW EARNS NOTHING
 *                (owner 2026-09-01): no save, no credit, no hold.
 *   'guest'    — KNOWN signed out. The house guest rule (owner 2026-08-12):
 *                nothing restored, nothing saved; the work is HELD for the
 *                account signed into in the same session (owner 2026-10-01).
 *   'free'     — a real account without membership ('free' or 'lapsed').
 *   'member'   — academy standing.
 *
 * `resolved`, not `tierKnown`, is the boundary on purpose: the labs' rule
 * (PagedLab, Mastering, Drum Tuning, Room Design) is that a signed-in learner
 * whose membership read FAILED is treated as a guest by the lab and the
 * ledger — which knows the identity — writes their held work to it straight
 * away. An identity ASSERTION ("GUEST — NO ACCOUNT", the Student ID row)
 * still gates on `tierKnown` in the screens that make one.
 *
 * Pure (no React): `tierOf` is tested directly in test/patternP8_20261002.
 * The hook is `useTier()` in ./useTier.ts.
 */
import type { Entitlement } from './EntitlementProvider';

export type Tier = 'unknown' | 'preview' | 'guest' | 'free' | 'member';

/** The tier from the provider's raw state. `preview` wins: a preview is only
 *  ever active for a non-member on a members-only route, and it earns
 *  nothing whatever the tier underneath. */
export function tierOf(entitlement: Entitlement, resolved: boolean, preview = false): Tier {
  if (preview) return 'preview';
  if (!resolved) return 'unknown';
  if (entitlement === 'anonymous') return 'guest';
  if (entitlement === 'academy') return 'member';
  return 'free';
}

/** May this person's work be WRITTEN to the device / their account now?
 *  Only a real account. The unknown window, a guest and a preview all answer
 *  false — the first two HOLD the work (sessionCarry), a preview drops it. */
export function persistAllowed(tier: Tier): boolean {
  return tier === 'free' || tier === 'member';
}

/** The work done now is kept for a sign-in later this session (the ledger's
 *  own `sessionCarryOpen()` adds the sign-out rule). A preview holds nothing. */
export function holdAllowed(tier: Tier): boolean {
  return tier === 'unknown' || tier === 'guest';
}

/** Talk to this person as a guest (the end screen's "sign in before you
 *  close the app" wording, no restore of a stored place). KNOWN only — the
 *  unknown window is neither. */
export function isGuestTier(tier: Tier): boolean {
  return tier === 'guest' || tier === 'preview';
}

/** Membership / upgrade copy may be shown. Never to a member, and never
 *  before the tier is known (a member must not see upsell copy for a second
 *  at boot — owner rule, no marketing to members). */
export function upsellAllowed(tier: Tier): boolean {
  return tier === 'guest' || tier === 'free' || tier === 'preview';
}
