/**
 * Which half of an "A → B" clip is sounding (owner 2026-11-25, audit B20;
 * Tuning ch6 Comma and ch10 Equal). The A → B clip is A, a 0.35 s silence,
 * then B (tuningRender `concatWithGap`), so the highlight follows the sound:
 * A's notes light first, B's from the middle of the silence. Both halves
 * used to stay lit for the whole clip.
 */
import { useEffect, useState } from 'react';

/** The silence between A and B in an A → B clip (tuningRender concatWithGap's default). */
export const AB_GAP_S = 0.35;

/** Seconds of a renderSequence clip: n notes, each `noteS` plus its `gapS`. */
export function sequenceSeconds(n: number, noteS: number, gapS = 0.05): number {
  return n * (noteS + gapS);
}

/** When the highlight moves from A to B: the middle of the silence, in ms. */
export function abSwitchMs(firstSeconds: number, gapSeconds = AB_GAP_S): number {
  return (firstSeconds + gapSeconds / 2) * 1000;
}

/** 'a' then 'b' while an A → B clip plays (from when the player reports it
 *  sounding); null when it is not playing an A → B clip. */
export function useAbHalf(playingAb: boolean, firstSeconds: number): 'a' | 'b' | null {
  const [half, setHalf] = useState<'a' | 'b' | null>(null);
  const ms = abSwitchMs(firstSeconds);
  useEffect(() => {
    if (!playingAb) {
      setHalf(null);
      return;
    }
    setHalf('a');
    const t = setTimeout(() => setHalf('b'), ms);
    return () => clearTimeout(t);
  }, [playingAb, ms]);
  return playingAb ? half ?? 'a' : null;
}
