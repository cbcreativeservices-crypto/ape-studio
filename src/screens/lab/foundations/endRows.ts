/**
 * What's-left rows for the visit-credited labs F5 owns (Foundations of Sound,
 * Microphone Principles, Speaker Placement, Wave Physics, Room Design) — lab
 * fix round 2026-11-14, phase 2, S2's end-screen API: each unfinished row
 * names ITS missing piece, and the rule every row shares is said once.
 *
 * These labs credit a unit when it is OPENED (by design: the owner's call on
 * one meaning of "done" is pending), so what a row is missing is the visit,
 * and the useful line is what that unit holds: its intro card's
 * WHAT YOU'RE LEARNING sentence.
 */
export function notOpenedDetail(learning: string | undefined): string | undefined {
  const l = learning?.trim();
  if (!l) return undefined;
  return `Not opened yet. Inside: ${l.charAt(0).toLowerCase()}${l.slice(1)}`;
}

/** The once-only HOW A … COUNTS sentence for a visit-credited lab. */
export function visitCounts(noun: 'module' | 'section'): string {
  return `A ${noun} counts once you open it. Jumping to it from the list below counts it too.`;
}
