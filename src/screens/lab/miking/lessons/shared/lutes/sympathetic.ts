/**
 * SYMPATHETIC STRINGS on the IDEAL string model (LESSON_JOURNEY §7: standing
 * waves on a string, pure and tested before it is drawn). Pure arithmetic.
 *
 * A string fixed at both ends has shapes at whole-number multiples of its
 * lowest pitch (stringPhysics.ts). A sympathetic string is never plucked: the
 * bridge passes it the played string's vibration, and it is pushed in step
 * with ITSELF — so it builds up — only at pitches where one of its own shapes
 * sits. Played note at pitch 1 (shapes n = 1, 2, 3 …); a sympathetic string
 * tuned to pitch t (shapes m·t). A pair (n, m) is IN STEP when n and m·t
 * coincide within a tolerance (cents: 1200·log2 of the ratio).
 *
 * What this model leaves out — said in words where it is shown: how strongly
 * the bridge couples them, damping, stiffness, how long each rings, and any
 * level. It says WHICH shapes line up, not how loud anything is.
 */

/** Shapes looked at on each string (the 1st … 8th). */
export const SHAPES_SHOWN = 8;
/** Two pitches this close (cents) count as in step — the lab's tolerance. */
export const IN_STEP_CENTS = 15;

export type InStep = { n: number; m: number; cents: number };

/** Cents between two pitches (positive: b above a). */
export function cents(a: number, b: number): number {
  return 1200 * Math.log2(b / a);
}

/** The shape pairs (played n, sympathetic m) that coincide, lowest first. */
export function inStep(t: number, nMax = SHAPES_SHOWN, mMax = SHAPES_SHOWN, tol = IN_STEP_CENTS): InStep[] {
  const out: InStep[] = [];
  for (let n = 1; n <= nMax; n++) {
    for (let m = 1; m <= mMax; m++) {
      const c = cents(n, m * t);
      if (Math.abs(c) <= tol) out.push({ n, m, cents: c });
    }
  }
  return out.sort((a, b) => a.n - b.n || a.m - b.m);
}

/** An equal-tempered interval of `semis` semitones as a pitch ratio. */
export function etRatio(semis: number): number {
  return Math.pow(2, semis / 12);
}

/** In words, how readily the sympathetic string answers (no level implied):
 *  its LOWEST shape driven by the played note's lowest → it answers most
 *  readily; another early pair → it answers; only high pairs → a little;
 *  none → it barely moves. */
export function answerWord(pairs: InStep[]): 'MOST READILY' | 'READILY' | 'A LITTLE' | 'BARELY' {
  if (pairs.some((p) => p.n === 1 && p.m === 1)) return 'MOST READILY';
  if (pairs.some((p) => p.n <= 2 || p.m <= 2)) return 'READILY';
  if (pairs.length > 0) return 'A LITTLE';
  return 'BARELY';
}

/** The tuning choices the page offers: the sympathetic string's pitch
 *  relative to the played note (12-TET, as a fretted instrument plays it). */
export const TUNINGS: readonly { id: string; label: string; semis: number; blurb: string }[] = [
  { id: 'unison', label: 'SAME NOTE', semis: 0, blurb: 'Tuned to exactly the note being played.' },
  { id: 'octaveUp', label: 'AN OCTAVE ABOVE', semis: 12, blurb: 'Tuned an octave above the played note.' },
  { id: 'octaveDown', label: 'AN OCTAVE BELOW', semis: -12, blurb: 'Tuned an octave below the played note.' },
  { id: 'fifth', label: 'A FIFTH ABOVE', semis: 7, blurb: 'Tuned a fifth above the played note.' },
  { id: 'fourth', label: 'A FOURTH ABOVE', semis: 5, blurb: 'Tuned a fourth above the played note.' },
  { id: 'third', label: 'A MAJOR THIRD ABOVE', semis: 4, blurb: 'Tuned a major third above the played note.' },
  { id: 'semitone', label: 'A SEMITONE ABOVE', semis: 1, blurb: 'Tuned one semitone above the played note.' },
];
