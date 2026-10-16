/**
 * PLAN FOOTPRINTS — the shared, pure (no Skia) footprints of the objects the
 * Miking plans draw from above, in plan mm (owner 2026-10-15: "no collisions
 * or impossible layering in ANY plan"). Each plan family builds its objects'
 * footprints here from the SAME constants its drawing uses; the plans keep
 * their labels clear of them (StaticLabels `clearOf`), and
 * test/mikingPlanCollisions_20261015.test.ts checks that no two objects
 * overlap and no cable runs through an object.
 *
 * `group`: parts of ONE physical assembly (a kit's drums under its cymbals,
 * a player on their chair holding the instrument) — they may overlap each
 * other, as real stacking does. Anything else that overlaps must be named in
 * the test's allowlist with its reason.
 */
import type { Vec3, Wedge } from '../../engine/model/types.ts';
import { KICK_GEOM } from '../m01Kick/geometry.ts';
import { KIT, KIT_DRUMS, PLAN_HARDWARE } from './kitPlanModel.ts';
import { KIT_PLACED_CYMBALS } from './cymbals/cymbalSpec.ts';
import { CHAIR_MM, chairRect } from '../../../../../features/lab/audienceChairsModel.ts';

export type PlanPt = { u: number; v: number };
export type PlanRect = { u0: number; u1: number; v0: number; v1: number };
/** `kind`: what the object is (wedge, amp, kit piece, chair, zone…).
 *  `zone`: a floor marking (a keep-clear hatch, a rug, a riser) — objects of
 *  its own group may stand in it, nothing else. */
export type PlanFoot = PlanRect & { id: string; kind: string; group?: string; zone?: boolean };
export type PlanCable = { id: string; kind: string; pts: PlanPt[]; from?: string; to?: string };

export const WEDGE_FOOT = { w: 600, d: 420 } as const;

export function rectsOverlap(a: PlanRect, b: PlanRect, gap = 0): boolean {
  return a.u0 < b.u1 + gap && b.u0 < a.u1 + gap && a.v0 < b.v1 + gap && b.v0 < a.v1 + gap;
}
export function overlapArea(a: PlanRect, b: PlanRect): number {
  return Math.max(0, Math.min(a.u1, b.u1) - Math.max(a.u0, b.u0)) * Math.max(0, Math.min(a.v1, b.v1) - Math.max(a.v0, b.v0));
}
export function rectOfCircle(c: PlanPt, r: number): PlanRect {
  return { u0: c.u - r, u1: c.u + r, v0: c.v - r, v1: c.v + r };
}
/** The axis-aligned box of a `along` (in the facing direction) × `across`
 *  rectangle centred at c and turned to `angle` (radians). */
export function rectAround(c: PlanPt, along: number, across: number, angle = 0): PlanRect {
  const ca = Math.abs(Math.cos(angle));
  const sa = Math.abs(Math.sin(angle));
  const hu = (along / 2) * ca + (across / 2) * sa;
  const hv = (along / 2) * sa + (across / 2) * ca;
  return { u0: c.u - hu, u1: c.u + hu, v0: c.v - hv, v1: c.v + hv };
}
export function shift(r: PlanRect, du: number, dv: number): PlanRect {
  return { u0: r.u0 + du, u1: r.u1 + du, v0: r.v0 + dv, v1: r.v1 + dv };
}
export function rectOfPts(pts: readonly PlanPt[]): PlanRect {
  return { u0: Math.min(...pts.map((p) => p.u)), u1: Math.max(...pts.map((p) => p.u)), v0: Math.min(...pts.map((p) => p.v)), v1: Math.max(...pts.map((p) => p.v)) };
}
export function foot(id: string, kind: string, r: PlanRect, extra: { group?: string; zone?: boolean } = {}): PlanFoot {
  return { id, kind, u0: r.u0, u1: r.u1, v0: r.v0, v1: r.v1, ...extra };
}

/** A floor wedge (the shared 2-way wedge, 600 × 420) at `p` facing `faces`. */
export function wedgeFoot(w: Pick<Wedge, 'id' | 'p' | 'faces'>, offset: Vec3 = { x: 0, y: 0, z: 0 }): PlanFoot {
  const ang = Math.atan2(w.faces.z, w.faces.x);
  return foot(w.id, 'wedge', rectAround({ u: w.p.x + offset.x, v: w.p.z + offset.z }, WEDGE_FOOT.d, WEDGE_FOOT.w, ang));
}

/** Audience chairs (audienceChairs makeChairsTop), one footprint each. */
export function chairFoots(at: readonly { x: number; y: number; rotation: number }[], prefix = 'chair'): PlanFoot[] {
  void CHAIR_MM;
  return at.map((c, i) => foot(`${prefix}${i}`, 'audienceChair', chairRect(c), { group: 'audience' }));
}

/**
 * The shared five-piece kit from above (kitScene KitTop / KitPlan), its
 * pieces in plan mm with the kit's origin (the kick's batter head) at `at`:
 * every drum, cymbal (the cymbals overhang the drums — real stacking, one
 * group), the throne with the drummer, the pedals and the boom-stand feet.
 */
export function kitPieceFoots(at: PlanPt, group = 'kit'): PlanFoot[] {
  const out: PlanFoot[] = [];
  const P = (u: number, v: number) => ({ u: u + at.u, v: v + at.v });
  out.push(foot(`${group}:kick`, 'kitPiece', { u0: at.u + KICK_GEOM.pedal.x0, u1: at.u + KICK_GEOM.hoopX.reso[1], v0: at.v - KICK_GEOM.hoopOut, v1: at.v + KICK_GEOM.hoopOut }, { group }));
  for (const [id, d] of Object.entries(KIT_DRUMS)) out.push(foot(`${group}:${id}`, 'kitPiece', rectOfCircle(P(d.c.x, d.c.z), d.spec.d.mm / 2 + 25), { group }));
  for (const [id, c] of Object.entries(KIT_PLACED_CYMBALS)) out.push(foot(`${group}:${id}`, 'kitPiece', rectOfCircle(P(c.c.x, c.c.z), c.spec.d.mm / 2), { group }));
  out.push(foot(`${group}:throne`, 'kitPiece', rectOfCircle(P(KIT.throne.c.u, KIT.throne.c.v), KIT.throne.r + 120), { group }));
  // the seated drummer (shoulders and knees round the throne) — the player's space
  out.push(foot(`${group}:drummer`, 'player', rectOfPts(KIT.playerSpace.map((q) => P(q.u, q.v))), { group }));
  for (const f of Object.values(PLAN_HARDWARE.booms)) out.push(foot(`${group}:boom${f.u}`, 'kitPiece', rectOfCircle(P(f.u, f.v), 125), { group }));
  return out;
}
/** The shared kit's footprints turned a quarter (`quarter` = +1: the drummer
 *  faces +v, down the screen — the plans with the audience below) about its
 *  origin, then moved to `at`. */
export function kitPieceFootsTurned(at: PlanPt, quarter: 1 | -1, group = 'kit'): PlanFoot[] {
  return kitPieceFoots({ u: 0, v: 0 }, group).map((f) => {
    const r = quarter > 0 ? { u0: -f.v1, u1: -f.v0, v0: f.u0, v1: f.u1 } : { u0: f.v0, u1: f.v1, v0: -f.u1, v1: -f.u0 };
    return { ...f, u0: r.u0 + at.u, u1: r.u1 + at.u, v0: r.v0 + at.v, v1: r.v1 + at.v };
  });
}

/** The kit's overall plan box (all its pieces), for a quick clearance. */
export function unionRect(fs: readonly PlanRect[]): PlanRect {
  return { u0: Math.min(...fs.map((f) => f.u0)), u1: Math.max(...fs.map((f) => f.u1)), v0: Math.min(...fs.map((f) => f.v0)), v1: Math.max(...fs.map((f) => f.v1)) };
}

/** True when the plan rect (mm) holds none of these footprints and no cable
 *  runs through it — the plans' labels use it (fitLabels `clearOf`) so no
 *  word sits on an object or on a cable (expert review 2026-10-15: HEADPHONE
 *  MIX and CONTROL ROOM were printed across the feed lanes). Zones (floor
 *  markings) do not block words. */
export function clearOfFoots(fs: readonly PlanFoot[], cables: readonly PlanCable[] = []): (u0: number, v0: number, u1: number, v1: number) => boolean {
  const solid = fs.filter((f) => !f.zone);
  const segs = cables.flatMap((k) => k.pts.slice(1).map((q, i) => [k.pts[i], q] as const));
  return (u0, v0, u1, v1) => !solid.some((f) => u0 < f.u1 && f.u0 < u1 && v0 < f.v1 && f.v0 < v1) && !segs.some(([p, q]) => segmentHitsRect(p, q, { u0, u1, v0, v1 }));
}

/** Does the segment p→q pass through the rect's interior (shrunk by `inset`)? */
export function segmentHitsRect(p: PlanPt, q: PlanPt, r: PlanRect, inset = 0): boolean {
  const R = { u0: r.u0 + inset, u1: r.u1 - inset, v0: r.v0 + inset, v1: r.v1 - inset };
  if (R.u0 >= R.u1 || R.v0 >= R.v1) return false;
  let t0 = 0;
  let t1 = 1;
  const du = q.u - p.u;
  const dv = q.v - p.v;
  const tests: [number, number][] = [
    [-du, p.u - R.u0],
    [du, R.u1 - p.u],
    [-dv, p.v - R.v0],
    [dv, R.v1 - p.v],
  ];
  for (const [pp, qq] of tests) {
    if (pp === 0) {
      if (qq <= 0) return false;
    } else {
      const t = qq / pp;
      if (pp < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t1 - t0 > 1e-6;
}

/** Do two segments cross or touch? */
export function segmentsCross(a: PlanPt, b: PlanPt, c: PlanPt, d: PlanPt): boolean {
  const o = (p: PlanPt, q: PlanPt, r: PlanPt) => Math.sign((q.u - p.u) * (r.v - p.v) - (q.v - p.v) * (r.u - p.u));
  const o1 = o(a, b, c);
  const o2 = o(a, b, d);
  const o3 = o(c, d, a);
  const o4 = o(c, d, b);
  if (o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0) return true;
  const on = (p: PlanPt, q: PlanPt, r: PlanPt) => Math.min(p.u, q.u) - 1e-6 <= r.u && r.u <= Math.max(p.u, q.u) + 1e-6 && Math.min(p.v, q.v) - 1e-6 <= r.v && r.v <= Math.max(p.v, q.v) + 1e-6;
  if (o1 === 0 && on(a, b, c)) return true;
  if (o2 === 0 && on(a, b, d)) return true;
  if (o3 === 0 && on(c, d, a)) return true;
  if (o4 === 0 && on(c, d, b)) return true;
  return o1 !== o2 && o3 !== o4;
}

/** The smallest distance between two segments. */
export function segmentGap(a: PlanPt, b: PlanPt, c: PlanPt, d: PlanPt): number {
  if (segmentsCross(a, b, c, d)) return 0;
  const pd = (p: PlanPt, q: PlanPt, r: PlanPt) => {
    const du = r.u - q.u;
    const dv = r.v - q.v;
    const l2 = du * du + dv * dv || 1;
    const t = Math.max(0, Math.min(1, ((p.u - q.u) * du + (p.v - q.v) * dv) / l2));
    return Math.hypot(p.u - (q.u + t * du), p.v - (q.v + t * dv));
  };
  return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b));
}

/** Places for an object's name round its footprint, just clear of it at the
 *  plan's scale `s` (px per mm ÷ the text scale; the words sit 7 px above / 5 px below their
 *  anchor, with 3 px of air): below, right, left, above. The label layout
 *  tries them in order before it falls back to free space with a leader. */
export function labelPlaces(r: PlanRect, s: number): { u: number; v: number; align: 'left' | 'center' | 'right' }[] {
  const k = 1 / Math.max(1e-6, s);
  const cu = (r.u0 + r.u1) / 2;
  const cv = (r.v0 + r.v1) / 2;
  return [
    { u: cu, v: r.v1 + 11 * k, align: 'center' },
    { u: r.u1 + 5 * k, v: cv + 1 * k, align: 'left' },
    { u: r.u0 - 5 * k, v: cv + 1 * k, align: 'right' },
    { u: cu, v: r.v0 - 9 * k, align: 'center' },
  ];
}
