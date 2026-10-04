/**
 * crossLinkCharge — what a tap on a cross-link inside a definition costs
 * (owner ruling 2026-10-04).
 *
 * Owner, verbatim: "before opening the crosslinked other glossary term from the
 * link in the description, warn that opening the new term link will count as
 * another credit. the user can decide then to close or go to the other term and
 * use the credit."
 *
 * This REPLACES the 2026-09-10 design, where a cross-link hop was free and
 * showed only the browse view's 120-character opening. A METERED reader (a
 * known non-member, `useMemberGate() === 'locked'`) is now asked first, and
 * OPEN charges the hop exactly like any other metered open (the gateway read,
 * or the fallback meter) and shows the full definition.
 *
 * Never asked and never charged (governance D50, owner rulings 2026-10-03):
 *   - members ('open'), and a member whose check is 'checking' / 'unconfirmed';
 *   - a term this reader already opened this session (free for the session,
 *     including a re-open after a timed-out read);
 *   - the Start Here lab's starter words and other `preloaded` popup entries —
 *     GlossaryTermPopup renders plain text with no cross-links at all.
 *
 * Pure, so the decision and the words are tested directly.
 */

export type CrossLinkPlan =
  /** Not metered: hop as before, no dialog, no charge. */
  | 'free-hop'
  /** Metered, but this term is already paid for this session: open it (the
   *  session cache answers, nothing is charged), no dialog. */
  | 'open-paid'
  /** Metered and the week is known to be used up: go straight to the existing
   *  limit-reached handling (the lock), never a dialog that then fails. */
  | 'open-limit'
  /** Metered, new term: ask first. */
  | 'ask';

export function crossLinkPlan(a: {
  /** The reader is metered right now (a known non-member on a metered path). */
  metered: boolean;
  /** This reader already opened (and paid for) this term this session. */
  alreadyOpened: boolean;
  /** Lookups left this week, or null when the count is not known. */
  left: number | null;
}): CrossLinkPlan {
  if (!a.metered) return 'free-hop';
  if (a.alreadyOpened) return 'open-paid';
  if (a.left !== null && a.left <= 0) return 'open-limit';
  return 'ask';
}

/** Lookups left, only when both numbers are real; otherwise null (unknown). */
export function lookupsLeft(count: { used: number; limit: number } | null): number | null {
  if (!count) return null;
  const { used, limit } = count;
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  return Math.max(0, Math.floor(limit - used));
}

export const CROSS_LINK_OPEN = 'Open (uses 1 lookup)';
export const CROSS_LINK_CANCEL = 'Cancel';

export function crossLinkTitle(term: string): string {
  return `Open “${term}”?`;
}

/** The count sentence only when the count is known. */
export function crossLinkBody(left: number | null): string {
  const base = 'Opening this term uses 1 definition lookup.';
  return left === null ? base : `${base} You have ${left} left this week.`;
}
