/**
 * The wrong-answer line of the shared CHECK YOURSELF card (foundations/bits
 * CheckQuestion) — pure, so it is testable (lab fix round 2026-11-14, SHARED
 * check card: a reason per wrong option). `why` is keyed by the AUTHORED
 * option index (the card shuffles only the presentation order). A card
 * without `why` (or without an entry for this option) keeps today's text:
 * its `wrongHint`, else "Not quite — try again."
 */
export function checkWrongText(spec: { why?: Record<number, string>; wrongHint?: string }, picked: number): string {
  return spec.why?.[picked] ?? spec.wrongHint ?? 'Not quite — try again.';
}

/**
 * The miss rule of the shared card (owner-approved row 4, "per-option reasons
 * and the answer only after a second miss"; S2's LabUnderstandingCheck rule):
 *  - first miss: that option's reason only;
 *  - a second, DIFFERENT wrong option: its reason PLUS the explanation;
 *  - the same wrong option twice counts as one miss.
 * `misses` is the list of distinct wrong options picked so far.
 */
export function addMiss(misses: readonly number[], picked: number, correctIdx: number): number[] {
  if (picked === correctIdx || misses.includes(picked)) return [...misses];
  return [...misses, picked];
}
export function showRevealAfterMisses(misses: readonly number[]): boolean {
  return misses.length >= 2;
}
