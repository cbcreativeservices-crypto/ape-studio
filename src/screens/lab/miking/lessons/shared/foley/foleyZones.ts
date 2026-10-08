/**
 * A FOLEY STARTING POINT (frame F): every point `d` mm from the active area's
 * centre (a TARGET point — the lessons measure "capsule to the central active
 * footfall area", "the source to the capsule"), in front of the performer and
 * `a` degrees off their front line (any mix of height and bearing — no source
 * gives a height), the mic facing the target within `aimTol`. Drawn as the
 * shared target sector (smallperc/geom targetZone: the cut through the front
 * line in the side view, the cone swept round it from above).
 *
 * The START pose is placed by bearing and elevation (frameF.poseAround) —
 * "in front and/or to the side, only about 15 degrees" — and must lie inside
 * the zone and clear of every keep-out (pinned by the lesson tests and by
 * validateLesson).
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { targetZone } from '../smallperc/geom.ts';
import { offFront, poseAround, v3 } from './frameF.ts';

export type FoleyZoneSpec = {
  id: string;
  label: string;
  band: string;
  kind: 'sourced' | 'trial';
  src: string;
  quote: string;
  surface: string;
  /** The target (the active area's centre); default the origin. */
  c?: Vec3;
  d: [number, number];
  a: [number, number];
  aimTol: number;
  /** The start: distance, bearing (deg toward the performer's right), elevation (deg). */
  start: { d: number; bearing: number; elev: number; aimAt?: Vec3 };
  variants: string[];
  micTypeIds: string[];
  mount?: 'stand' | 'clip';
  bandProv?: Provenance;
  tendency: string;
  checks: string[];
};

export function foleyZone(z: FoleyZoneSpec): DocumentedZone {
  const c = z.c ?? v3(0, 0, 0);
  const base = targetZone({
    id: z.id,
    label: z.label,
    band: z.band,
    kind: z.kind,
    src: z.src,
    quote: z.quote,
    surface: z.surface,
    c,
    n: v3(1, 0, 0),
    side: v3(0, -1, 0),
    d: z.d,
    a: z.a,
    aimTol: z.aimTol,
    variants: z.variants,
    micTypeIds: z.micTypeIds,
    ...(z.mount ? { mount: z.mount } : {}),
    ...(z.bandProv ? { bandProv: z.bandProv } : {}),
    tendency: z.tendency,
    checks: z.checks,
  });
  const start = poseAround(c, z.start.d, z.start.bearing, z.start.elev, z.start.aimAt ?? c);
  const off = offFront(c, start.p);
  if (off < z.a[0] - 0.01 || off > z.a[1] + 0.01) throw new Error(`foleyZone ${z.id}: the start is ${off.toFixed(1)}° off the front line, outside ${z.a[0]}–${z.a[1]}°`);
  return { ...base, start };
}
