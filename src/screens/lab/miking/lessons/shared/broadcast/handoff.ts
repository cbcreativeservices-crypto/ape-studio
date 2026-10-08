/**
 * THE HANDOFF — Lab 7b group 1 (B10 sideline and post-event interviews;
 * sideline_interviews/GEOMETRY_PROPOSAL.md §1–3). Pure: no React
 * (test/mikingLab7bSpeech.test.ts). Reusable by B11 and B17.
 *
 * One handheld shared by a reporter and a guest: the reporter asks, MOVES
 * the mic to the guest, PAUSES, and the guest answers — the mic arrives
 * before the answer starts. A static TIMELINE (no clock runs: a strip of
 * four phases) and the levels it implies (DERIVED, inverse square only — a
 * simplified picture):
 *
 *   levelDb(mic, speaker, other)   how much louder the speaking mouth is at
 *                                  the mic than the other mouth;
 *   betweenDrop(close, mid)        the anti-example: a mic left between the
 *                                  two mouths hears the speaker this much
 *                                  lower than a mic close to them —
 *                                  20·log10(d_mid / d_close);
 *   handoffOk(t)                   the mic is at the guest before the answer
 *                                  starts (the move ends no later than the
 *                                  answer's first syllable);
 *   lostSyllables(t)               how long the answer runs at the WRONG
 *                                  mouth's distance when the move is late.
 * The phase lengths are drawing defaults (seconds on a strip, not a clock).
 */
import type { Vec3 } from '../../../engine/model/types.ts';

const len = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** How much louder (dB) the speaking mouth arrives at the mic than the other
 *  mouth — by distance alone. */
export function levelDb(mic: Vec3, speaker: Vec3, other: Vec3): number {
  return 20 * Math.log10(len(mic, other) / Math.max(1, len(mic, speaker)));
}

/** The level lost by a mic left between the mouths, against a close mic. */
export function betweenDrop(close: number, mid: number): number {
  return 20 * Math.log10(mid / Math.max(1, close));
}

/** The mid-point between two mouths (where a mic "left between" sits). */
export function between(a: Vec3, b: Vec3): Vec3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/** The four phases on the strip (seconds from the question's start: drawing
 *  defaults). `moveStart` and `moveDur` say when the mic travels. */
export type Handoff = { questionEnd: number; moveStart: number; moveDur: number; answerStart: number; answerEnd: number };
export const HANDOFF_ON_TIME: Handoff = { questionEnd: 3, moveStart: 3, moveDur: 0.6, answerStart: 4, answerEnd: 9 };
export const HANDOFF_LATE: Handoff = { questionEnd: 3, moveStart: 4.2, moveDur: 0.6, answerStart: 4, answerEnd: 9 };
export const HANDOFF_EARLY: Handoff = { questionEnd: 3, moveStart: 2.4, moveDur: 0.6, answerStart: 4, answerEnd: 9 };

/** The mic is at the guest before the answer's first syllable. */
export function handoffOk(h: Handoff): boolean {
  return h.moveStart + h.moveDur <= h.answerStart && h.moveStart >= h.questionEnd - 0.05;
}
/** Seconds of the answer heard at the wrong distance (the move late). */
export function lostSyllables(h: Handoff): number {
  return Math.max(0, h.moveStart + h.moveDur - h.answerStart);
}
/** Seconds of the QUESTION's end heard at the wrong distance (moved early). */
export function clippedQuestion(h: Handoff): number {
  return Math.max(0, h.questionEnd - h.moveStart);
}
