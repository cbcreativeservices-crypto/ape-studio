/**
 * The octave elevator's floors (Tuning ch3 "Your turn" and ch13 FOLD), pure so
 * a node test can run them (owner 2026-11-25, audit B16).
 *
 * The elevator draws three floors: BELOW (r < 1), the comparison octave
 * (1 ≤ r < 2) and ABOVE (r ≥ 2). A press the wrong way (×2 on 9/4) used to
 * change the number but not the tile: everything ≥ 2 shared ABOVE. Now each
 * ratio also has its octave floor, n = ⌊log2 r⌋ (0 = the comparison octave,
 * 1 = one octave above, −1 = one below…). The tile stays in its drawn floor
 * but every press past the outer floors moves it a further step toward the
 * outer edge (two steps, then it rests at the edge) and the tile names how
 * many octaves away it is, so each ×2 / ÷2 visibly changes the glass.
 */
export type ElevatorRegion = 0 | 1 | 2;

/** Which drawn floor: 0 = below (r < 1), 1 = comparison octave, 2 = above (r ≥ 2). */
export function elevatorRegion(r: number): ElevatorRegion {
  return r < 1 ? 0 : r < 2 ? 1 : 2;
}

/** Octaves from the comparison octave: ⌊log2 r⌋ (exact for powers of two). */
export function elevatorOctave(r: number): number {
  if (!(r > 0)) return 0;
  const n = Math.floor(Math.log2(r));
  // Guard the float edge (log2 of an exact power of two is exact in JS, but a
  // value a hair under one must not read a floor lower).
  return Math.pow(2, n + 1) <= r ? n + 1 : n;
}

/** The tile's extra shift toward the outer edge of its floor, in steps (0, 1 or 2). */
export function elevatorBeyondSteps(r: number): number {
  const n = elevatorOctave(r);
  return n >= 2 ? Math.min(2, n - 1) : n <= -2 ? Math.min(2, -n - 1) : 0;
}

/** The tile's octave tag, only past the drawn floors: "▲ 2 oct", "▼ 3 oct"; '' otherwise. */
export function elevatorTag(r: number): string {
  const n = elevatorOctave(r);
  return n >= 2 ? `▲ ${n} oct` : n <= -2 ? `▼ ${-n} oct` : '';
}
