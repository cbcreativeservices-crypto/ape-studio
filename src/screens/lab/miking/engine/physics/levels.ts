/**
 * LEVEL AND SPACING (blueprint §6.3; SOURCES_SHARED.md §4). Pure.
 *
 * levelDiffDb: ideal point source, FAR FIELD. A mic 5 cm from a 56 cm head
 * is in the near field, where this does not hold — the page says so.
 *
 * threeToOne: the plan's §7 definition — the mic-to-mic distance is at least
 * 3× each mic's distance to its own source. −20·log10(3) = −9.54 dB. It is a
 * SPILL guideline for mics on different sources; it does not guarantee phase
 * coherence for an inside/outside pair on one drum (lesson L72).
 */

/** Level at rB relative to rA, dB (doubling → −6.02 dB). */
export function levelDiffDb(rA: number, rB: number): number {
  return 20 * Math.log10(rA / rB);
}

/** Mic spacing ÷ the larger mic-to-source distance (≥ 3 meets 3:1). */
export function threeToOneRatio(dAB: number, rA: number, rB: number): number {
  const m = Math.max(rA, rB);
  return m > 0 ? dAB / m : Infinity;
}

export const THREE_TO_ONE_DB = -20 * Math.log10(3);
