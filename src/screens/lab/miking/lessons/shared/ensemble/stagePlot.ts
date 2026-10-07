/**
 * THE STAGE-PLOT READOUTS (group 4) — every number DERIVED, none invented
 * (docs/labs/miking/rhythm_section_band/GEOMETRY_PROPOSAL.md):
 *
 *   spill     how much lower a NEIGHBOUR arrives at a close mic than the
 *             mic's own source, if both were equally loud: by distance
 *             (free-field inverse square, 20·log10(r_neighbour / r_own) —
 *             S-LIVE "When the distance from a sound source doubles, the
 *             sound level decreases by 6dB") and by the mic's ideal pattern
 *             (engine/physics/polar). Straight paths, point sources, no room.
 *   NOM       the gain-before-feedback cost of open mics, 10·log10(NOM)
 *             (S-LIVE: "3dB everytime NOM doubles").
 *   3:1       mic-to-mic at least 3 × the larger mic-to-source distance,
 *             for SEPARATE mics only (stereoArray.threeToOne).
 *
 * Pure; tested (test/mikingLab5Bands.test.ts).
 */
import type { PatternId, Vec3 } from '../../../engine/model/types.ts';
import { gain } from '../../../engine/physics/polar.ts';
import { dist, DEG, sub, unit } from './frameS.ts';
import { threeToOne } from './stereoArray.ts';

/** The free-field level difference for two distances (dB, + = the farther is lower). */
export const byDistanceDb = (rOwn: number, rOther: number): number => 20 * Math.log10(Math.max(1, rOther) / Math.max(1, rOwn));
/** The open-mic cost: each doubling of open mics costs about 3 dB of gain before feedback. */
export const nomDb = (n: number): number => (n <= 1 ? 0 : 10 * Math.log10(n));

/** Below this ideal-pattern gain a direction is "in the null" (no number is printed). */
export const NULL_GAIN = 0.03;

export type SpillMic = { p: Vec3; dir: Vec3; pattern: PatternId };
export type Spill = { rOwn: number; rOther: number; distanceDb: number; patternDb: number | null; totalDb: number | null; offAxis: number };

const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) / DEG;

/** How far below its own source a neighbour arrives at a mic (equal source
 *  levels; straight paths). `patternDb` null = the neighbour is in the
 *  ideal pattern's null. */
export function spill(mic: SpillMic, own: Vec3, other: Vec3): Spill {
  const rOwn = dist(mic.p, own);
  const rOther = dist(mic.p, other);
  const d = unit(mic.dir);
  const aOwn = angle(d, unit(sub(own, mic.p)));
  const aOther = angle(d, unit(sub(other, mic.p)));
  const gOwn = Math.abs(gain(mic.pattern, aOwn));
  const gOther = Math.abs(gain(mic.pattern, aOther));
  const distanceDb = byDistanceDb(rOwn, rOther);
  const patternDb = gOther < NULL_GAIN || gOwn < NULL_GAIN ? null : 20 * Math.log10(gOwn / gOther);
  return { rOwn, rOther, distanceDb, patternDb, totalDb: patternDb == null ? null : distanceDb + patternDb, offAxis: aOther };
}

/** The worst (smallest-margin) neighbour of a mic among `sources`. */
export function worstSpill(mic: SpillMic, own: Vec3, sources: readonly { id: string; label: string; p: Vec3 }[]): { id: string; label: string; s: Spill } | null {
  let best: { id: string; label: string; s: Spill } | null = null;
  for (const q of sources) {
    const s = spill(mic, own, q.p);
    const m = s.totalDb ?? Infinity;
    if (!best || m < (best.s.totalDb ?? Infinity)) best = { id: q.id, label: q.label, s };
  }
  return best;
}

/** 3:1 across a set of separate mics, each with its own source: the closest
 *  call (smallest ratio of mic-to-mic over 3 × the larger mic-to-source). */
export function worstThreeToOne(mics: readonly { key: string; p: Vec3; own: Vec3 }[]): { a: string; b: string; ratio: number; ok: boolean; apart: number; need: number } | null {
  let worst: { a: string; b: string; ratio: number; ok: boolean; apart: number; need: number } | null = null;
  for (let i = 0; i < mics.length; i++)
    for (let j = i + 1; j < mics.length; j++) {
      const A = mics[i];
      const B = mics[j];
      const t = threeToOne(A.p, A.own, B.p, B.own);
      const apart = dist(A.p, B.p);
      const need = 3 * Math.max(dist(A.p, A.own), dist(B.p, B.own));
      if (!worst || t.ratio < worst.ratio) worst = { a: A.key, b: B.key, ratio: t.ratio, ok: t.ok, apart, need };
    }
  return worst;
}
