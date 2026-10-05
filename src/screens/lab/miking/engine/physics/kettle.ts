/**
 * HOW IT SOUNDS — a head over a KETTLE (timpani), for drawing (LESSON_JOURNEY
 * §7: "Timpani: the measured principal ratios, already in the Cymatics
 * model"). Pure; tested. No new physics: the shapes are the ideal clamped
 * membrane's (engine/physics/membrane.ts — the bowl does not change where the
 * still lines are), and the PITCH RATIOS are the Cymatics Lab's kettle model
 * (features/cymatics/membrane.ts `membraneModes` with `kettle: true`), called,
 * never copied:
 *
 *   the air in the bowl and the radiation loading pull the (n,1) "principal"
 *   shapes toward 1 : 1.5 : 2 : 2.5 against the (1,1) shape — near-harmonic,
 *   which is why a timpani has a clear pitch; (0,1) sits a little below (1,1)
 *   and is damped by the bowl.
 *
 * Ratios here are against (1,1) (the timpani's pitch), not the lowest shape.
 * The measured ratios come from published measurements on real kettledrums
 * (internal record: timpani/SOURCES.md and the Cymatics model's header).
 */
import { DEFAULT_MEMBRANE, membraneModes } from '../../../../../features/cymatics/membrane';
import { J_ZEROS } from '../../../../../features/cymatics/faraday';
import { stillWords, type HeadShape } from './membrane.ts';

/** The five shapes the timpani lesson steps through: the damped (0,1) and
 *  the principal (1,1)…(4,1) series, in rising pitch. */
const PICK: readonly [number, number][] = [
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
];

export const KETTLE_SHAPES: readonly HeadShape[] = (() => {
  const modes = membraneModes({ ...DEFAULT_MEMBRANE, kettle: true, diameterMm: 736.6 }, 40);
  const hz = (n: number, s: number) => modes.find((m) => m.n === n && m.s === s)?.hz ?? NaN;
  const ref = hz(1, 1);
  return PICK.map(([n, s]) => {
    const j = J_ZEROS[n][s - 1];
    return { n, s, j, ratio: hz(n, s) / ref, label: `(${n},${s})`, still: stillWords(n, s) };
  }).sort((a, b) => a.ratio - b.ratio);
})();
