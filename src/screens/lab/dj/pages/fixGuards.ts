/**
 * fixGuards — small pure helpers from the lab fix round of 2026-11-14 (F2),
 * kept out of the .tsx pages so test/labFixes_20261114_F2 reaches them.
 *
 *  - `beatOffsetText`: Screen 10's "B vs A" in beats. At two decimals a
 *    passing 0.058 and a failing 0.063 both read "+0.06 beat" (the pass mark
 *    is 1/16 = 0.0625), so the learner saw the same number pass and fail.
 *    Three decimals keep every passing value at or under 0.062 and every
 *    failing one at or over 0.063.
 *  - `trimStillHot`: Screen 24's hot-trim fault is repaired at +3 dB or less
 *    (djCapstone TRIM_HOT). Between that and the point where the channel
 *    clips, THE ROOM read MUSIC while the fault stayed open — the page says
 *    so in words now.
 */

/** Screen 10's pass mark for "Line the beats up": a sixteenth of a beat. */
export const BEAT_PASS = 1 / 16;

export function beatAligned(off: number): boolean {
  return Math.abs(off) < BEAT_PASS;
}

/** "+0.058 beat" / "−0.440 beat". */
export function beatOffsetText(off: number): string {
  return `${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(3)} beat`;
}

/** Screen 14: which of deck B's key settings the LAB set, not the learner.
 *  The fault starts with key lock ON and a key shift of +1, so "Lock the key"
 *  and "Shift the key a step" ticked the moment it started — two free ticks
 *  (lab fix round 2026-11-14, F2). A goal counts once the learner has set
 *  that control themselves: KEY LOCK pressed, a KEY SHIFT picked. */
export type KeyStaged = { lock: boolean; shift: boolean };
export const KEY_STAGED_NONE: KeyStaged = { lock: false, shift: false };

export function keyStagedAfter(s: KeyStaged, ev: 'faultStart' | 'lockToggle' | 'shiftPick'): KeyStaged {
  if (ev === 'faultStart') return { lock: true, shift: true };
  if (ev === 'lockToggle') return { ...s, lock: false };
  return { ...s, shift: false };
}

/** The hot trim's repair line (djCapstone TRIM_HOT `fixed`). */
export const TRIM_FIXED_DB = 3;

/** True while channel 1's trim is above the repair line but the channel is
 *  no longer clipping: the room sounds clean, the fault is not yet repaired. */
export function trimStillHot(trimDb: number, channelClipping: boolean): boolean {
  return trimDb > TRIM_FIXED_DB && !channelClipping;
}
