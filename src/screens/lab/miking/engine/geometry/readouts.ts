/**
 * READOUTS (blueprint §4.5), measured from the 3-D model — never from pixels.
 * Pure; a worklet (the drag computes them on the UI thread).
 *
 *   distance  (p − surface.point) · surface.normal, signed, mm
 *   radial    distance from the named reference line (e.g. the beater line)
 *   offAxis   angle between the mic's front axis and −normal (0° = aimed
 *             straight at the surface)
 *   inside    within the interior (between the heads, inside the shell)
 *   zoneId    the first documented zone the pose is in (lesson order)
 *   blocked   the solid the assembly enters, or null
 *
 * Ruling §16.12: readouts measure only from SOURCED planes and lines (the
 * batter head, the reso head, the shell axis, the beater line). HEIGHT above
 * the floor is never shown while the floor is a placeholder.
 */
import type { DocumentedZone, MicBody, MicPose, Readouts, RefLine, ReferenceSurface, CompiledScene, VariantId } from '../model/types.ts';
import { aimVec, angleBetween, scale } from './vec.ts';
import { checkAssembly, isInside } from './collision.ts';
import { lineDistance, surfaceDistance, zoneFor } from './zones.ts';

export type ReadoutCtx = {
  scene: CompiledScene;
  surfaces: ReferenceSurface[];
  lines: RefLine[];
  zones: DocumentedZone[];
  variant: VariantId;
  micTypeId: string;
  body: MicBody;
};

export function deriveReadouts(ctx: ReadoutCtx, pose: MicPose, surfaceId: string, lineId: string): Readouts {
  'worklet';
  let normal = { x: 1, y: 0, z: 0 };
  for (let i = 0; i < ctx.surfaces.length; i++) if (ctx.surfaces[i].id === surfaceId) normal = ctx.surfaces[i].normal;
  const blocked = checkAssembly(ctx.scene, pose, ctx.body);
  const zoneId = blocked
    ? null
    : zoneFor(ctx.zones, { scene: ctx.scene, surfaces: ctx.surfaces, lines: ctx.lines, variant: ctx.variant, micTypeId: ctx.micTypeId, mount: ctx.body.mount }, pose);
  return {
    surfaceId,
    distance: surfaceDistance(ctx.surfaces, surfaceId, pose),
    radial: lineDistance(ctx.lines, lineId, pose),
    radialLine: lineId,
    offAxis: angleBetween(aimVec(pose.az, pose.el), scale(normal, -1)),
    inside: isInside(ctx.scene, pose.p),
    zoneId,
    blocked: blocked ? { partId: blocked.partId, label: blocked.label } : null,
  };
}
