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
import { aimVec, angleBetween, distToLine, dot, sub } from './vec.ts';
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

/** Signed distance of the pose from a surface (NaN when the id is unknown). */
export function surfaceDistance(surfaces: ReferenceSurface[], id: string, pose: MicPose): number {
  'worklet';
  const s = findSurface(surfaces, id);
  return s ? dot(sub(pose.p, s.point), s.normal) : NaN;
}

/** Distance of the pose from a reference line (NaN when unknown). */
export function lineDistance(lines: RefLine[], id: string, pose: MicPose): number {
  'worklet';
  const l = findLine(lines, id);
  return l ? distToLine(pose.p, l.point, l.dir) : NaN;
}

/** Inclusive band edges, with 0.01 mm of float slack. */
const EPS = 0.01;

export function inZone(zone: DocumentedZone, ctx: ZoneCtx, pose: MicPose): boolean {
  'worklet';
  const rq = zone.requires;
  if (rq) {
    if (rq.variant && rq.variant !== ctx.variant) return false;
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
  if (zone.aim) {
    const s = findSurface(ctx.surfaces, zone.refSurface);
    if (!s) return false;
    const off = angleBetween(aimVec(pose.az, pose.el), { x: -s.normal.x, y: -s.normal.y, z: -s.normal.z });
    if (off > zone.aim.maxOffAxis + EPS) return false;
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
    if (rq.variant && rq.variant !== variant) return false;
    if (rq.mount && rq.mount !== mount) return false;
    if (rq.micTypeIds && !rq.micTypeIds.includes(micTypeId)) return false;
    return true;
  });
}

/**
 * Is any edge of this zone DRAWN BY THE LAB (review M5)? The source gives the
 * position in words, but the band's numbers, its off-line limits or its aim
 * tolerance are the lab's drawing of those words. Such a zone is shown as
 * "SOURCED*" with "* edges drawn by the lab" — never as plain SOURCED.
 */
export function zoneEdgesByLab(z: DocumentedZone): boolean {
  if (z.kind !== 'sourced') return false;
  if (z.bandProv && z.bandProv.kind !== 'sourced') return true;
  if (z.radial && z.radial.prov.kind !== 'sourced') return true;
  if (z.aim && z.aim.prov.kind !== 'sourced') return true;
  return false;
}

/** The lab-drawn parts of a zone, in words, for its card. */
export function labDrawnNotes(z: DocumentedZone): string[] {
  const out: string[] = [];
  const say = (p: { kind: string; reason?: string; note?: string }) => (p.kind === 'illustrative' ? p.reason ?? '' : p.note ?? '');
  if (z.bandProv && z.bandProv.kind !== 'sourced') out.push(say(z.bandProv as never));
  if (z.radial && z.radial.prov.kind !== 'sourced') out.push(say(z.radial.prov as never));
  if (z.aim && z.aim.prov.kind !== 'sourced') out.push(`aim: ${say(z.aim.prov as never)}`);
  return out.filter(Boolean);
}
