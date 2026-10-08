/**
 * Lab 5's stereo-array tool placed in frame G or frame F (Lab 6 group 2):
 * the two capsules of a pair as engine mic poses, for a lesson's STARTING
 * SETUPS (SetupPairData poses) — the array drawn whole, never as lone mics.
 * Pure; tested. `bearing` as frameG.ts: degrees from +x toward +z; the
 * array's face in Lab 5's terms is 90 + bearing (frameG.faceS).
 */
import type { MicPattern, MicPose, SetupPairData, Vec3 } from '../../../engine/model/types.ts';
import { aimOf } from '../ensemble/frameS.ts';
import { arrayCapsules, type ArrayParams, type ArrayPresetId, type Capsule } from '../ensemble/stereoArray.ts';
import { faceS } from './frameG.ts';

const r1 = (x: number) => Math.round(x * 10) / 10;
const poseOf = (c: Capsule): MicPose => {
  const a = aimOf(c.dir);
  return { p: { x: r1(c.p.x), y: r1(c.p.y), z: r1(c.p.z) }, az: r1(a.az), el: r1(a.el) };
};

/** The capsules of an array at `c`, facing `bearing`. */
export function fieldCapsules(id: ArrayPresetId, c: Vec3, bearing: number, params: ArrayParams = {}): Capsule[] {
  return arrayCapsules(id, params, { c, face: faceS(bearing) });
}

/** A pair's two poses (L and R, or Mid and Side). */
export function pairPoses(id: ArrayPresetId, c: Vec3, bearing: number, params: ArrayParams = {}): { A: MicPose; B: MicPose; patA: MicPattern; patB: MicPattern } {
  const caps = fieldCapsules(id, c, bearing, params);
  const A = caps.find((q) => q.route === 'L' || q.route === 'M') ?? caps[0];
  const B = caps.find((q) => q.route === 'R' || q.route === 'S') ?? caps[1];
  return { A: poseOf(A), B: poseOf(B), patA: A.pattern, patB: B.pattern };
}

/** A STARTING SETUP pair from an array: both capsules posed, measured from `zone`. */
export function arraySetup(o: { label: string; id: ArrayPresetId; zone: string; c: Vec3; bearing: number; typeA: string; typeB?: string; params?: ArrayParams; variants?: readonly string[]; line: string; more?: boolean; /** The first capsule IS the zone's start pose (the zone counts as drawn by the pair). */ aOnZone?: boolean }): SetupPairData {
  const p = pairPoses(o.id, o.c, o.bearing, o.params);
  return {
    label: o.label,
    A: o.aOnZone ? { zone: o.zone, typeId: o.typeA, pattern: p.patA } : { zone: o.zone, typeId: o.typeA, pattern: p.patA, pose: p.A },
    B: { zone: o.zone, typeId: o.typeB ?? o.typeA, pattern: p.patB, pose: p.B },
    ...(o.variants ? { variants: o.variants } : {}),
    line: o.line,
    ...(o.more ? { more: true } : {}),
  };
}
