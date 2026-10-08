/**
 * THE BOOTH PLAN AND THE PARTNER'S SPILL — Lab 7b group 1 (B09 commentators;
 * commentators/GEOMETRY_PROPOSAL.md §3). Pure: no React
 * (test/mikingLab7bSpeech.test.ts).
 *
 * TODO(lab7b): this is the MINIMAL plan canvas the build prompt allows while
 * the venue plan builder (lessons/shared/sports/venuePlan.ts, Lab 7b group
 * 2) is not on final-lab: switch the booth to its `booth` preset once it is.
 *
 * The booth (every number a DRAWING DEFAULT): a desk 1.8 × 0.75 m, two seats
 * 0.9 m apart, both commentators facing the field (+x), a sight-line arrow to
 * the play, the partner's turn toward the other commentator, the window, the
 * PA cluster's and the crowd's directions (arrows only).
 *
 * THE SPILL READOUT (DERIVED, "calculated from the drawing"): how much lower
 * the partner's voice arrives at a commentator's mic than their own voice —
 *   by distance:  20·log10(d_partner / d_own)        (inverse square)
 *   by pattern:   −20·log10|g(θ)|  (θ: the partner's mouth off the mic's
 *                 front axis; the ideal first-order pattern, physics/polar)
 * Example (the proposal's): own 25 mm, partner 900 mm → 31 dB by distance
 * alone. Point mouths, free field, no room: a simplified picture — a real
 * booth's reflections carry the partner's voice round any null.
 */
import type { PatternId, Vec3 } from '../../../engine/model/types.ts';
import { gain } from '../../../engine/physics/polar.ts';
import { dd } from '../voice/voiceSpec.ts';
import { turnHead, onTalker, type Talker } from './talkerPose.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/** The booth's record (drawing defaults). */
export const BOOTH = {
  seatGap: dd(900, 'the two commentators’ seats, lip to lip (commentators/GEOMETRY_PROPOSAL §3: drawing default 0.9 m)'),
  deskW: dd(1800, 'the commentary desk’s width (drawing default 1.8 m)'),
  deskD: dd(750, 'the commentary desk’s depth (drawing default 0.75 m)'),
  /** The partner's turn toward the other commentator: default 0°, trial 30–45°. */
  turnTrial: { min: 30, max: 45 },
} as const;

/** The spill of a partner's voice into a mic, against the mic's own talker. */
export type Spill = { own: number; partner: number; distDb: number; offAxis: number; patternDb: number | null; totalDb: number | null };

/** The spill readout for a mic at `p` aimed `aim` (unit), its own talker's
 *  mouth `own`, the partner's mouth `partner`, the mic's ideal pattern. */
export function boothSpill(p: Vec3, aim: Vec3, own: Vec3, partner: Vec3, pattern: PatternId): Spill {
  const dOwn = len(sub(own, p));
  const toP = sub(partner, p);
  const dP = len(toP);
  const distDb = 20 * Math.log10(dP / Math.max(1, dOwn));
  const cos = (toP.x * aim.x + toP.y * aim.y + toP.z * aim.z) / Math.max(1e-9, dP);
  const offAxis = Math.acos(Math.max(-1, Math.min(1, cos))) / DEG;
  // The own talker is (near) on axis: compare the partner's pickup with it.
  const toO = sub(own, p);
  const cosO = (toO.x * aim.x + toO.y * aim.y + toO.z * aim.z) / Math.max(1e-9, dOwn);
  const gO = Math.abs(gain(pattern, Math.acos(Math.max(-1, Math.min(1, cosO))) / DEG));
  const gP = Math.abs(gain(pattern, offAxis));
  const patternDb = gP < 1e-3 ? null : 20 * Math.log10(Math.max(1e-6, gO) / gP);
  return { own: dOwn, partner: dP, distDb, offAxis, patternDb, totalDb: patternDb == null ? null : distDb + patternDb };
}

/** The partner's mouth when they turn `yawDeg` toward (−) or away from (+)
 *  the other commentator — their head turning about its centre. */
export function partnerMouth(partner: Talker, yawDeg: number): Vec3 {
  return onTalker(partner, turnHead(yawDeg, 0).mouth);
}

/** The partner seated `gap` mm to the commentator's right, facing the field. */
export function partnerAt(gap: number): Talker {
  return { id: 'partner', lip: v3(0, 0, gap), facing: 1 };
}
