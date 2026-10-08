/**
 * OPEN MICS AND BLEED — Lab 7 (broadcast speech; panels_press/
 * GEOMETRY_PROPOSAL.md §4). Built once by group 1 (B01 two hosts, B06
 * panels); used by later broadcast lessons. Pure: no React
 * (test/mikingLab7Broadcast.test.ts). It REUSES the Lab 5 stage-plot maths
 * (shared/ensemble/stagePlot.ts: byDistanceDb, nomDb, spill;
 * worstThreeToOne) and the two-mic physics (engine/physics/twoMic.ts).
 *
 * Every talker has their own mic; any mic may be OPEN or MUTED.
 *   bleed matrix   for each mic and each talker: how far the talker's mouth
 *                  is from the mic, and how much lower that talker arrives
 *                  than the mic's OWN talker — by distance (inverse square)
 *                  and by the mic's ideal pattern (null = in the null);
 *   the program sum of one talker's voice through two open mics: their own
 *                  (first) and a neighbour's (later) — Δt, the first comb
 *                  notch and its (illustrative) depth;
 *   NOM            the open mics and their cost in gain before feedback,
 *                  10·log10(NOM) (S-LIVE: "3dB everytime NOM doubles");
 *   3:1            mic-to-mic ≥ 3 × mic-to-own-talker — a NOTE readout only,
 *                  never a pass gate (the lessons call it a heuristic: B01
 *                  L27, B06 L32; owner item "3:1 at a desk: a note").
 * Straight paths, point mouths, free field, no room: a simplified picture.
 */
import type { MicPose, PatternId, Vec3 } from '../../../engine/model/types.ts';
import { aimVec } from '../../../engine/geometry/vec.ts';
import { C20, deltaTms, notchDepthDb, notchesHz } from '../../../engine/physics/twoMic.ts';
import { arrivalAngle, gain } from '../../../engine/physics/polar.ts';
import { byDistanceDb, nomDb, spill, worstThreeToOne } from '../ensemble/stagePlot.ts';

export type PanelTalker = { id: string; label: string; mouth: Vec3 };
export type PanelMic = { id: string; label: string; owner: string; pose: MicPose; pattern: PatternId; open: boolean };

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const ownerOf = (m: PanelMic, talkers: readonly PanelTalker[]) => talkers.find((t) => t.id === m.owner);

/** One cell of the matrix: talker `t` at mic `m`. */
export type BleedCell = {
  mic: string;
  talker: string;
  /** mm from the talker's mouth to the mic's front. */
  r: number;
  /** How much lower than the mic's own talker (dB; 0 on the diagonal):
   *  by distance, by the ideal pattern (null = the talker sits in a null),
   *  and both. */
  distanceDb: number;
  patternDb: number | null;
  totalDb: number | null;
};

/** The matrix: one row per mic, one cell per talker (own talker first is
 *  not assumed — the cell with `talker === mic.owner` is 0 dB). */
export function bleedMatrix(mics: readonly PanelMic[], talkers: readonly PanelTalker[]): BleedCell[][] {
  return mics.map((m) => {
    const own = ownerOf(m, talkers);
    return talkers.map((t) => {
      const r = dist(m.pose.p, t.mouth);
      if (!own || t.id === own.id) return { mic: m.id, talker: t.id, r, distanceDb: 0, patternDb: 0, totalDb: 0 };
      const s = spill({ p: m.pose.p, dir: aimVec(m.pose.az, m.pose.el), pattern: m.pattern }, own.mouth, t.mouth);
      return { mic: m.id, talker: t.id, r, distanceDb: s.distanceDb, patternDb: s.patternDb, totalDb: s.totalDb };
    });
  });
}

/** A talker's voice in the program through their own mic and another open
 *  mic: the later arrival, the first comb notch and how deep it can be. */
export type LeakComb = { talker: string; own: string; other: string; dtMs: number; firstNotchHz: number | null; depthDb: number; levelDb: number | null };

/** Pressure-like weight of a talker at a mic: ideal pattern gain over distance. */
function weight(m: PanelMic, p: Vec3): number {
  return Math.abs(gain(m.pattern, arrivalAngle(m.pose, p))) / Math.max(1, dist(m.pose.p, p));
}

/** Every talker's comb through each OTHER open mic (their own mic open). */
export function leakCombs(mics: readonly PanelMic[], talkers: readonly PanelTalker[]): LeakComb[] {
  const out: LeakComb[] = [];
  for (const t of talkers) {
    const own = mics.find((m) => m.owner === t.id && m.open);
    if (!own) continue;
    for (const o of mics) {
      if (o === own || !o.open) continue;
      const dMm = dist(o.pose.p, t.mouth) - dist(own.pose.p, t.mouth);
      const dtMs = deltaTms(dMm, C20);
      const wA = weight(own, t.mouth);
      const wB = weight(o, t.mouth);
      out.push({
        talker: t.id,
        own: own.id,
        other: o.id,
        dtMs,
        firstNotchHz: notchesHz(dtMs, 1, 20000, 1)[0] ?? null,
        depthDb: notchDepthDb(wA, wB),
        levelDb: wB < 1e-9 ? null : 20 * Math.log10(wA / wB),
      });
    }
  }
  return out;
}

/** The strongest leak (the smallest level difference) — the comb most
 *  likely to be heard; null with fewer than two open mics. */
export function strongestLeak(mics: readonly PanelMic[], talkers: readonly PanelTalker[]): LeakComb | null {
  let best: LeakComb | null = null;
  for (const c of leakCombs(mics, talkers)) {
    const v = c.levelDb ?? Infinity;
    if (!best || v < (best.levelDb ?? Infinity)) best = c;
  }
  return best;
}

/** The open mics and their cost in gain before feedback (dB, about). */
export function openMics(mics: readonly PanelMic[]): { open: number; costDb: number } {
  const open = mics.filter((m) => m.open).length;
  return { open, costDb: nomDb(open) };
}

/** 3:1 across the OPEN mics, each with its own talker — a NOTE only. */
export function threeToOneNote(mics: readonly PanelMic[], talkers: readonly PanelTalker[]): { a: string; b: string; ratio: number; ok: boolean; apart: number; need: number } | null {
  const list = mics.filter((m) => m.open).flatMap((m) => {
    const t = ownerOf(m, talkers);
    return t ? [{ key: m.id, p: m.pose.p, own: t.mouth }] : [];
  });
  return list.length >= 2 ? worstThreeToOne(list) : null;
}

/** The level difference between a talker and a neighbour at one mic, by
 *  distance alone (dB): re-exported for the pages' plain words. */
export const levelByDistance = byDistanceDb;
