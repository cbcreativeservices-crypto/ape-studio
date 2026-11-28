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

/**
 * The card's presentation order, SEEDED by the question and its options
 * (checker C3 O-2, 2026-11-14: on a first visit the options re-shuffled by
 * themselves seconds after GOT IT, because a remount re-ran Math.random). The
 * same question always shows the same order, so a remount can never reorder
 * the options under a finger or wipe the sense of a pick; different questions
 * still get different orders, so the right answer is not parked in one slot.
 */
export function seededOrder(question: string, options: readonly string[]): number[] {
  let h = 2166136261 >>> 0; // FNV-1a over the question and its options
  const text = `${question}\u0000${options.join('\u0000')}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // mulberry32 from that seed
  let a = h || 1;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const idx = options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
