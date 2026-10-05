/**
 * DOCUMENTED ZONES (blueprint §4.7): is a mic inside a zone? Pure; worklets.
 *
 * A zone is measured from ITS OWN reference surface (lesson L39: "presented
 * with their physical reference head"): distance = (p − surface.point) ·
 * normal, signed. A zone's optional radial band is the distance from a named
 * reference line (the beater line, the drum axis). A zone whose source row
 * names an orientation ("on-axis with beater") also tests the AIM: the front
 * axis within `aim.maxOffAxis` of the head it is measured from (review M6).
 * No magnetic snapping: the zone only lights up.
 */
import type { CompiledScene, DocumentedZone, MicPose, RefLine, ReferenceSurface, VariantId } from '../model/types.ts';
import { aimVec, angleBetween, distToLine, dot, len, norm, sub } from './vec.ts';
import { isInside } from './collision.ts';

export type ZoneCtx = {
  scene: CompiledScene;
  surfaces: ReferenceSurface[];
  lines: RefLine[];
  variant: VariantId;
  micTypeId: string;
  mount: string;
};

function findSurface(list: ReferenceSurface[], id: string): ReferenceSurface | null {
  'worklet';
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function findLine(list: RefLine[], id: string): RefLine | null {
  'worklet';
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/** Signed distance of the pose from a surface (NaN when the id is unknown);
 *  from a TARGET point, the plain distance to it. */
export function surfaceDistance(surfaces: ReferenceSurface[], id: string, pose: MicPose): number {
  'worklet';
  const s = findSurface(surfaces, id);
  if (!s) return NaN;
  return s.target ? len(sub(pose.p, s.point)) : dot(sub(pose.p, s.point), s.normal);
}

/** The mic's front axis off its reference: −normal for a plane, the
 *  direction to the point for a TARGET (degrees). */
export function aimOff(s: ReferenceSurface, pose: MicPose): number {
  'worklet';
  const a = aimVec(pose.az, pose.el);
  return s.target ? angleBetween(a, sub(s.point, pose.p)) : angleBetween(a, { x: -s.normal.x, y: -s.normal.y, z: -s.normal.z });
}

/** Distance of the pose from a reference line (NaN when unknown). A line
 *  with an `offset` reads SIGNED: the distance minus the offset (a drum's
 *  centre line with offset = its radius: negative = in over the head). */
export function lineDistance(lines: RefLine[], id: string, pose: MicPose): number {
  'worklet';
  const l = findLine(lines, id);
  if (!l) return NaN;
  // A reference PLANE (Lab 4): the signed distance along its normal.
  if (l.plane) return dot(sub(pose.p, l.point), norm(l.dir)) - (l.offset ?? 0);
  return distToLine(pose.p, l.point, l.dir) - (l.offset ?? 0);
}

/** Does the mic's front axis, followed forward, meet the surface's plane
 *  within `r` of its point? (A ray–disc test; false when it points away.) */
export function aimsAt(s: ReferenceSurface, r: number, pose: MicPose): boolean {
  'worklet';
  const a = aimVec(pose.az, pose.el);
  const den = dot(a, s.normal);
  if (Math.abs(den) < 1e-9) return false;
  const t = dot(sub(s.point, pose.p), s.normal) / den;
  if (t <= 0) return false;
  const hit = { x: pose.p.x + a.x * t, y: pose.p.y + a.y * t, z: pose.p.z + a.z * t };
  const d = sub(hit, s.point);
  return Math.sqrt(dot(d, d)) <= r;
}

/** Inclusive band edges, with 0.01 mm of float slack. */
const EPS = 0.01;

function variantOk(rq: NonNullable<DocumentedZone['requires']>, v: VariantId): boolean {
  'worklet';
  if (rq.variant && rq.variant !== v) return false;
  if (rq.variants) {
    let ok = false;
    for (let i = 0; i < rq.variants.length; i++) if (rq.variants[i] === v) ok = true;
    if (!ok) return false;
  }
  return true;
}

export function inZone(zone: DocumentedZone, ctx: ZoneCtx, pose: MicPose): boolean {
  'worklet';
  const rq = zone.requires;
  if (rq) {
    if (!variantOk(rq, ctx.variant)) return false;
    if (rq.mount && rq.mount !== ctx.mount) return false;
    if (rq.micTypeIds) {
      let ok = false;
      for (let i = 0; i < rq.micTypeIds.length; i++) if (rq.micTypeIds[i] === ctx.micTypeId) ok = true;
      if (!ok) return false;
    }
  }
  const d = surfaceDistance(ctx.surfaces, zone.refSurface, pose);
  if (!(d >= zone.distance.min - EPS && d <= zone.distance.max + EPS)) return false;
  if (zone.side !== 'either') {
    const inside = isInside(ctx.scene, pose.p);
    if (zone.side === 'inside' && !inside) return false;
    if (zone.side === 'outside' && inside) return false;
  }
  if (zone.cone) {
    const s = findSurface(ctx.surfaces, zone.refSurface);
    if (!s) return false;
    const dv = sub(pose.p, s.point);
    const a = angleBetween(dv, s.normal);
    if (a < zone.cone.min - EPS || a > zone.cone.max + EPS) return false;
    if (zone.cone.toward && dot(dv, zone.cone.toward) < 0) return false;
  }
  if (zone.aim) {
    const s = findSurface(ctx.surfaces, zone.refSurface);
    if (!s) return false;
    const off = zone.aim.dir ? angleBetween(aimVec(pose.az, pose.el), zone.aim.dir) : aimOff(s, pose);
    if (off > zone.aim.maxOffAxis + EPS) return false;
    if (zone.aim.minOffAxis != null && off < zone.aim.minOffAxis - EPS) return false;
  }
  if (zone.aimAt) {
    const s = findSurface(ctx.surfaces, zone.aimAt.surface);
    if (!s || !aimsAt(s, zone.aimAt.r, pose)) return false;
  }
  if (zone.near) {
    const q = pose.p;
    const c = zone.near.point;
    const dn = Math.sqrt((q.x - c.x) * (q.x - c.x) + (q.y - c.y) * (q.y - c.y) + (q.z - c.z) * (q.z - c.z));
    if (dn < zone.near.min - EPS || dn > zone.near.max + EPS) return false;
  }
  if (zone.box) {
    const b = zone.box;
    const p = pose.p;
    if (p.x < b.min.x - EPS || p.x > b.max.x + EPS || p.y < b.min.y - EPS || p.y > b.max.y + EPS || p.z < b.min.z - EPS || p.z > b.max.z + EPS) return false;
  }
  if (zone.radial) {
    const r = lineDistance(ctx.lines, zone.radial.line, pose);
    if (!(r === r)) return false;
    if (zone.radial.min != null && r < zone.radial.min - EPS) return false;
    if (zone.radial.max != null && r > zone.radial.max + EPS) return false;
  }
  return true;
}

/** The first zone (lesson order) the pose is in, or null. */
export function zoneFor(zones: DocumentedZone[], ctx: ZoneCtx, pose: MicPose): string | null {
  'worklet';
  for (let i = 0; i < zones.length; i++) if (inZone(zones[i], ctx, pose)) return zones[i].id;
  return null;
}

/** Zones this mic type / variant / mount could ever be in (for the ZONE key). */
export function zonesAvailable(zones: DocumentedZone[], variant: VariantId, micTypeId: string, mount: string): DocumentedZone[] {
  return zones.filter((z) => {
    const rq = z.requires;
    if (!rq) return true;
    if (!variantOk(rq, variant)) return false;
    if (rq.mount && rq.mount !== mount) return false;
    if (rq.micTypeIds && !rq.micTypeIds.includes(micTypeId)) return false;
    return true;
  });
}
