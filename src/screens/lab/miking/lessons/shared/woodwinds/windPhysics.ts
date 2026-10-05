/**
 * HOW A WOODWIND SOUNDS — the physics the drawings show (LESSON_JOURNEY §7,
 * "air columns": open/closed pipe standing waves; "sound leaves from the
 * first open holes", the Lab 3 correction). Pure, tested
 * (test/mikingWoodwinds.test.ts). FULLY SILENT: nothing here is ever played.
 *
 *   • A NOTE k (semitones above the instrument's lowest) sounds on one
 *     resonance of the tube that ends at its FIRST OPEN HOLE — the hole
 *     nearest the player that is open; with every hole closed, at the foot
 *     or the bell. Up a semitone, that tube is 2^(−1/12) as long, so the first
 *     open hole moves TOWARD the player as the pitch rises (UNSW: the flute
 *     "behaves almost as though it were 'sawn off' at a point not far below
 *     the first open hole"; Yamaha, the bassoon: "sound emerges from farther
 *     down the instrument as the pitch becomes higher" — down its folded bore).
 *   • REGISTERS: a flute (a pipe open at both ends), an oboe and a bassoon
 *     (cones) sound every harmonic and overblow an OCTAVE; a clarinet (a
 *     cylinder closed at the reed) sounds odd harmonics most strongly in its
 *     low register and overblows a TWELFTH.
 *   • The standing wave of resonance n along the sounding length L (x from
 *     the player's end):
 *       open at both ends   p ∝ sin(nπx/L)              (n = 1, 2, 3 …)
 *       closed at the reed  p ∝ cos((2n−1)πx/(2L))      (odd harmonics)
 *       a cone from its tip p ∝ sin(nπx/L)/(nπx/L)      (n = 1, 2, 3 …)
 *     — the ideal textbook pipes, a simplified picture (no end corrections,
 *     no tone-hole lattice).
 *   • The TONE-HOLE CUTOFF: partials below it leave mostly by the first open
 *     hole(s); partials above it travel on past the open holes and leave by
 *     further holes and the bell (PL-2010, oboe §4.2) — so even a low note's
 *     upper partials reach the bell.
 */
import { endWordOf, holeS, midiHz, midiName, type Bore, type WindSpec } from './windSpec.ts';

/** The highest note index the lesson's NOTE control reaches. */
export function topNote(spec: WindSpec): number {
  return spec.registers[spec.registers.length - 1].to;
}

export type NoteState = {
  k: number;
  midi: number;
  name: string;
  hz: number;
  /** The register's resonance (1 = the lowest resonance of the sounding tube). */
  n: number;
  /** The harmonic number sounded (closed pipe: 2n − 1). */
  harmonic: number;
  register: string;
  /** The first open hole (0 = none: the foot or the bell sounds). */
  hole: number;
  /** Where the sounding tube ends, in s (the first open hole, or the end). */
  endS: number;
  /** The sounding length from the player's end (mm, ideal). */
  L: number;
};

export function noteState(spec: WindSpec, kIn: number): NoteState {
  const k = Math.max(0, Math.min(topNote(spec), Math.round(kIn)));
  const reg = spec.registers.find((r) => k >= r.from && k <= r.to) ?? spec.registers[0];
  const hole = k - reg.shift;
  const start = spec.family === 'edge' ? 0 : 0;
  const endS = hole <= 0 ? spec.end : holeS(spec, hole);
  const midi = spec.lowest.midi + k;
  return {
    k,
    midi,
    name: midiName(midi),
    hz: midiHz(midi),
    n: reg.n,
    harmonic: spec.bore === 'closed' ? 2 * reg.n - 1 : reg.n,
    register: reg.name,
    hole: Math.max(0, hole),
    endS,
    L: endS - start,
  };
}

/** The pressure standing wave of resonance n at x along a sounding length L
 *  (−1 … 1; x = 0 at the player's end). */
export function pressure(bore: Bore, n: number, x: number, L: number): number {
  const t = Math.max(0, Math.min(1, x / L));
  if (bore === 'open') return Math.sin(n * Math.PI * t);
  if (bore === 'closed') return Math.cos(((2 * n - 1) * Math.PI * t) / 2);
  const a = n * Math.PI * t;
  return a < 1e-6 ? 1 : Math.sin(a) / a;
}

/** Where the pressure stays still (a NODE) along the sounding length, as
 *  fractions of L (0 … 1). The open end is always one. */
export function pressureNodes(bore: Bore, n: number): number[] {
  const out: number[] = [];
  if (bore === 'closed') for (let j = 0; j < n; j++) out.push((2 * j + 1) / (2 * n - 1));
  else for (let j = bore === 'open' ? 0 : 1; j <= n; j++) out.push(j / n);
  return out;
}

/** The harmonics a resonance series contains (×f1): open pipes and cones all
 *  of them; a closed cylinder the odd ones. */
export function seriesOf(bore: Bore, count: number): number[] {
  return Array.from({ length: count }, (_, i) => (bore === 'closed' ? 2 * i + 1 : i + 1));
}

/** How the overblown register sits above the low one: an octave (×2) or a
 *  twelfth (×3). */
export function overblowRatio(bore: Bore): 2 | 3 {
  return bore === 'closed' ? 3 : 2;
}

/** Which of a note's partials (×hz) lie below the tone-hole cutoff — they
 *  leave mostly by the first open holes; the rest travel on toward the bell.
 *  null: no measured cutoff for this instrument. */
export function partialsBelowCutoff(spec: WindSpec, hz: number, upTo = 12): number | null {
  if (spec.cutoff.hz == null) return null;
  let c = 0;
  for (let h = 1; h <= upTo; h++) if (h * hz < spec.cutoff.hz) c++;
  return c;
}

/** Where a note's sound leaves the instrument, as words for the bezel. */
export function exitWords(spec: WindSpec, st: NoteState): { main: string; also: string } {
  const endWord = `the ${endWordOf(spec)}`;
  const main = st.hole === 0 ? endWord.toUpperCase() : `HOLE ${st.hole}`;
  const also = spec.family === 'edge' ? 'and the embouchure hole' : st.hole === 0 ? 'every hole closed' : `upper partials on toward ${endWord}`;
  return { main, also };
}
