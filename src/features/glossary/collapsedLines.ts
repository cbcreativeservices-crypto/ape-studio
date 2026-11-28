/**
 * How many lines a COLLAPSED glossary row shows.
 *
 * This one ternary is the free-tier boundary, which is why it is a named,
 * tested rule and not an inline expression.
 *
 * Bug hunt 2026-09-13: the collapsed row printed the COMPLETE definition in
 * LIST view (the default), while the weekly allowance is charged only when a
 * row is EXPANDED. A guest could therefore scroll all 26,855 definitions in
 * full and spend none of their fourteen — so "Free use includes 14 definitions
 * a week", which About, the paywall, the upgrade sheet and the Auth guest line
 * all say, was not true of the app. Owner's ruling: make the app match the
 * copy. A preview identifies the term; reading it spends a lookup.
 *
 * ⚠️ `capped` is the gate, NOT `isMember` and NOT "is a guest".
 * `capped = meterKnown` (a KNOWN non-member) — the SAME predicate
 * gateDefinitionOpen charges against. Anything else and the two disagree:
 *  • gate on !isMember alone and rows clamp before entitlement resolves, so a
 *    paying member sees a truncated glossary for a frame on every cold start;
 *  • gate on "guest" and a signed-in FREE account reads everything for nothing,
 *    which is the hole this closes wearing a different hat.
 */
export const COLLAPSED_PREVIEW_LINES = 2;

export function collapsedDefinitionLines(
  cardView: boolean,
  capped: boolean,
): number | undefined {
  // CARDS has always been a 2-line grid tile — that clamp is layout, not
  // metering, and applies to members too.
  if (cardView) return COLLAPSED_PREVIEW_LINES;
  // LIST: clamp only a reader who is actually being metered.
  return capped ? COLLAPSED_PREVIEW_LINES : undefined;
}

/**
 * The Glossary's one-time hint, worded for what a tap does in the view the
 * reader is in (owner 2026-11-20: "it says tap a term … but it only works once
 * a user goes into full screen"). A member's LIST row already prints the whole
 * definition, so "expand the complete definition" promised something the tap
 * never visibly did; there a tap opens the term's learning levels.
 */
export function glossaryCoachText(cardView: boolean, capped: boolean): string {
  if (cardView) return 'Tap a card to open its complete definition';
  if (collapsedDefinitionLines(false, capped) !== undefined) {
    return 'Tap a term to expand or collapse the complete definition';
  }
  return 'Tap a term to open or close its learning levels';
}
