/**
 * The bass-map caption on the Room Design plan, in plain words (owner 2026-11-15:
 * "build waves 1 thru 3", D62 adoption plan item RO-02).
 *
 * It used to read "MODE (1,0,0) 34.3 Hz · AXIAL · PRESSURE AT EAR HEIGHT · SHAPE,
 * NOT EXCITATION": acoustician shorthand a beginner cannot read. Now it says which
 * bass note the map shows, in which direction, and what red and blue mean:
 *   "Lowest front-to-back bass note (34.3 Hz)"
 *   "At ear height: red piles up, blue vanishes (shape only)"
 * "(shape only)" keeps the old disclosure: the map draws the note's shape, not how
 * hard the speakers drive it. The frequency is the model's own value, unchanged.
 *
 * Axes follow roomModel.modePressure: nx runs along the LENGTH (front to back),
 * ny across the WIDTH (side to side), nz the HEIGHT (floor to ceiling).
 * [MD:D62]
 */
export type ModeForCaption = { nx: number; ny: number; nz: number; f: number; kind: 'axial' | 'tangential' | 'oblique' };

const ORDINAL = ['', 'Lowest', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

function ordinal(n: number): string {
  return ORDINAL[n] ?? `${n}th`;
}

/** The two caption lines, in reading order. */
export function modeCaptionLines(m: ModeForCaption): [string, string] {
  const hz = `${m.f.toFixed(1)} Hz`;
  let lead: string;
  if (m.kind === 'axial') {
    const [n, dir] = m.nx ? [m.nx, 'front-to-back'] : m.ny ? [m.ny, 'side-to-side'] : [m.nz, 'floor-to-ceiling'];
    lead = `${ordinal(n)} ${dir} bass note`;
  } else if (m.kind === 'tangential') {
    lead = 'Bass note between four surfaces';
  } else {
    lead = 'Bass note between all six surfaces';
  }
  return [`${lead} (${hz})`, 'At ear height: red piles up, blue vanishes (shape only)'];
}
