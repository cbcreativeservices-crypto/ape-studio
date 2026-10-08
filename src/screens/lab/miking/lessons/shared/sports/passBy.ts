/**
 * THE MOVING-SOURCE (PASS-BY) TOOL — Lab 7 part 2, group 3 (lab7-g6;
 * docs/labs/miking/motorsport_equestrian_aquatic/GEOMETRY_PROPOSAL.md §1).
 * Built once here; B15 and B16 use it on the shared practice room, B17 on
 * its own walk. Pure: no React (test/mikingLab7SportsG3.test.ts).
 *
 * A source travels a path (a polyline in frame P) past fixed mics; a
 * scrubber (0 … 1, by distance along the path) sets where it is. At each
 * position the tool reads (DERIVED, an ideal free-field model — "calculated
 * from the drawing", a simplified picture said once on the page):
 *   • each mic's slant range to the source;
 *   • each mic's level change against ITS OWN closest point on the path:
 *     the inverse-square change, plus — when the mic has a pattern — the
 *     ideal polar gain at the arrival angle (venuePlan.offAxis3);
 *   • the arrival-time difference between mic 1 and mic 0 and the first
 *     notches of their equal-level sum (engine/physics/twoMic, the
 *     calculator's speed of sound) — so a delay set at one point is seen to
 *     be wrong at the next (B13–B17's shared lesson; B16 L255).
 * NO pitch or speed number, ever: "a walking source is not a Doppler speed
 * measurement" (B16 L257). The page says only, in words, that a passing
 * source's pitch rises on approach and falls away — and that the change can
 * also come from the source itself, reflections and the mic's off-axis tone.
 *
 * Aim modes (B16 L63): ACROSS the path (at its middle point) or OBLIQUE —
 * along it, toward the approach — compared from the same approved place.
 */
import type { PatternId } from '../../../engine/model/types.ts';
import { gain } from '../../../engine/physics/polar.ts';
import { deltaTms, notchesHz } from '../../../engine/physics/twoMic.ts';
import { MM, offAxis3, planRange, rangeDb, slantRange, type P2 } from './venuePlan.ts';

/** A fixed mic beside the path: place, capsule height, what it is aimed at
 *  (a plan point at a height), and its pattern (null: level by distance only). */
export type PassMic = { id: string; label: string; at: P2; h: number; aimAt: P2; aimH: number; pattern: PatternId | null };
export type PassCase = { path: readonly P2[]; hSrc: number; mics: readonly PassMic[] };

/** The path's total plan length (m). */
export function pathLength(path: readonly P2[]): number {
  let L = 0;
  for (let i = 0; i + 1 < path.length; i++) L += planRange(path[i], path[i + 1]);
  return L;
}

/** The point at fraction t (0 … 1) of the path's length. */
export function pointAt(path: readonly P2[], t: number): P2 {
  const L = pathLength(path);
  let want = Math.max(0, Math.min(1, t)) * L;
  for (let i = 0; i + 1 < path.length; i++) {
    const seg = planRange(path[i], path[i + 1]);
    if (want <= seg || i + 2 === path.length) {
      const f = seg < 1e-12 ? 0 : Math.min(1, want / seg);
      return { x: path[i].x + (path[i + 1].x - path[i].x) * f, y: path[i].y + (path[i + 1].y - path[i].y) * f };
    }
    want -= seg;
  }
  return path[0];
}

/** The fraction t (0 … 1) of the point on the path nearest a plan point, and
 *  that plan distance (exact per segment). */
export function closestOnPath(path: readonly P2[], q: P2): { t: number; p: P2; d: number } {
  const L = pathLength(path);
  let best = { t: 0, p: path[0], d: Infinity };
  let run = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const f = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / l2));
    const p = { x: a.x + dx * f, y: a.y + dy * f };
    const d = planRange(p, q);
    if (d < best.d - 1e-12) best = { t: L < 1e-12 ? 0 : (run + f * Math.sqrt(l2)) / L, p, d };
    run += Math.sqrt(l2);
  }
  return best;
}

/** A mic's pickup of a source point (linear, relative to 1 m on its axis):
 *  1/r × the ideal polar gain at the arrival angle (no pattern: 1/r). */
export function pickup(m: PassMic, src: P2, hSrc: number): number {
  const r = Math.max(0.05, slantRange(m.at, m.h, src, hSrc));
  const g = m.pattern ? Math.abs(gain(m.pattern, offAxis3(m.at, m.h, m.aimAt, m.aimH, src, hSrc))) : 1;
  return g / r;
}
/** The same in dB. */
export const pickupDb = (m: PassMic, src: P2, hSrc: number): number => 20 * Math.log10(Math.max(1e-6, pickup(m, src, hSrc)));

/** The strongest pickup a mic gets anywhere on the path (sampled finely). */
export function peakPickupDb(c: PassCase, m: PassMic, n = 400): number {
  let best = -Infinity;
  for (let i = 0; i <= n; i++) best = Math.max(best, pickupDb(m, pointAt(c.path, i / n), c.hSrc));
  return best;
}

export type PassReading = {
  src: P2;
  /** Per mic: slant range (m), the off-axis angle (deg), the level change
   *  against its own closest point (dB, inverse square only; + = quieter),
   *  and its pickup against its own loudest point on the path (dB, ≤ 0). */
  mics: { id: string; range: number; offAxis: number; byDistanceDb: number; vsPeakDb: number }[];
  /** Mic 1 against mic 0: + = mic 1 hears it later (ms). NaN with one mic. */
  dtMs: number;
  notches: number[];
};

/** Everything the tool shows with the source at fraction t of the path. */
export function readPass(c: PassCase, t: number, polarity: 1 | -1 = 1, nNotches = 4): PassReading {
  const src = pointAt(c.path, t);
  const mics = c.mics.map((m) => {
    const range = slantRange(m.at, m.h, src, c.hSrc);
    const near = closestOnPath(c.path, m.at);
    const nearRange = slantRange(m.at, m.h, near.p, c.hSrc);
    return {
      id: m.id,
      range,
      offAxis: offAxis3(m.at, m.h, m.aimAt, m.aimH, src, c.hSrc),
      byDistanceDb: rangeDb(nearRange, range),
      vsPeakDb: pickupDb(m, src, c.hSrc) - peakPickupDb(c, m),
    };
  });
  let dtMs = NaN;
  let notches: number[] = [];
  if (mics.length >= 2) {
    dtMs = deltaTms((mics[1].range - mics[0].range) * MM);
    notches = notchesHz(dtMs, polarity, 20000, nNotches);
  }
  return { src, mics, dtMs, notches };
}

/** How far the arrival difference moves over the path (ms): zero only when
 *  the two mics stay equally far from every point of it. */
export function dtSpan(c: PassCase, n = 200): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= n; i++) {
    const d = readPass(c, i / n).dtMs;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  return hi - lo;
}

/** The share of the path (0 … 1) over which a mic's pickup stays within
 *  `withinDb` of its own loudest point — the "useful sector" the aim gives. */
export function usefulShare(c: PassCase, m: PassMic, withinDb = 6, n = 400): number {
  const peak = peakPickupDb(c, m, n);
  let k = 0;
  for (let i = 0; i <= n; i++) if (pickupDb(m, pointAt(c.path, i / n), c.hSrc) >= peak - withinDb) k++;
  return k / (n + 1);
}

/** The words for the pitch: a static note, never a number (B16 L257). */
export const PITCH_NOTE = 'A passing source’s pitch seems to rise as it comes toward a mic and fall as it goes away. A walking source is not a speed measurement, and a change in pitch can also come from the source itself, from reflections and from the mic’s off-axis tone — so the lab draws no pitch number.';
