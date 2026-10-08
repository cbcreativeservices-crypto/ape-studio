/**
 * The MEASUREMENT family's scene helpers (frame M placed in scene frame F).
 * Pure: no React — the lessons' geometry files and the tests use them.
 *
 *   aimAt         the (az, el) that points a mic's front from p toward q
 *                 (the engine's aim convention: az 0, el 0 = toward −x)
 *   operator*     the person running the measurement, drawn with the shared
 *                 player figure (the standing adult of the voice family,
 *                 moved and turned) and the collision solid for the same body
 *   measureModel  an InstrumentModel for a scene with no "inside" (no drum
 *                 shell, no port): a measurement scene is a source and the
 *                 space round it
 */
import type { Dim, InstrumentModel, Part, Provenance, Shape3, Variant, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { PlayerPose, Pt, Hand } from '../players/playerPose.ts';
import { SINGER_NECK, SINGER_SIDE, SINGER_TOP, FLOOR_Y } from '../voice/voicePose.ts';

const DEG = Math.PI / 180;

/** The aim (degrees) that points from p toward q. */
export function aimAt(p: Vec3, q: Vec3): { az: number; el: number } {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const dz = q.z - p.z;
  const l = Math.hypot(dx, dy, dz) || 1;
  const el = Math.asin(Math.max(-1, Math.min(1, -dy / l))) / DEG;
  const az = Math.abs(el) > 89.9 ? 0 : Math.atan2(dz, -dx) / DEG;
  return { az, el };
}

export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

/* ── the operator: a standing adult (the shared figure), facing ±x ── */

const mapPt = (p: Pt, f: (q: Pt) => Pt): Pt => f(p);
function mapPose(pose: PlayerPose, f: (q: Pt) => Pt, mirror: boolean, extra: Partial<PlayerPose>): PlayerPose {
  const hand = (h: Hand): Hand => ({ ...h, wrist: f(h.wrist), dir: mirror ? Math.PI - h.dir : h.dir });
  return {
    ...pose,
    head: { c: f(pose.head.c), r: pose.head.r },
    neck: f(pose.neck),
    shoulderR: f(pose.shoulderR),
    shoulderL: f(pose.shoulderL),
    elbowR: f(pose.elbowR),
    elbowL: f(pose.elbowL),
    handR: hand(pose.handR),
    handL: hand(pose.handL),
    hipR: f(pose.hipR),
    hipL: f(pose.hipL),
    kneeR: f(pose.kneeR),
    kneeL: f(pose.kneeL),
    footR: f(pose.footR),
    footL: f(pose.footL),
    ...extra,
  };
}

/** The operator in profile (side view): standing on `groundY` with the
 *  collar at x = `x`, facing +x (`facing` 1) or −x (−1). */
export function operatorSide(x: number, groundY: number, facing: 1 | -1): PlayerPose {
  const du = x - SINGER_NECK.x;
  const dv = groundY - FLOOR_Y;
  const f = (q: Pt): Pt => (facing === 1 ? { u: q.u + du, v: q.v + dv } : { u: 2 * x - (q.u + du), v: q.v + dv });
  return mapPose(SINGER_SIDE, (q) => mapPt(q, f), facing === -1, { facing, floor: groundY });
}

/** The operator from above (plan): the collar at (x, z), the chest facing +x (1) or −x (−1). */
export function operatorTop(x: number, z: number, facing: 1 | -1): PlayerPose {
  const du = x - SINGER_TOP.neck.u;
  const dv = z - SINGER_TOP.neck.v;
  return mapPose(SINGER_TOP, (q) => ({ u: q.u + du, v: q.v + dv }), false, { facing: facing === 1 ? 0 : Math.PI });
}

/** The operator as one collision solid: a standing adult's envelope (a box
 *  about the collar, the floor to the top of the head; drawing default). */
export function operatorSolid(x: number, z: number, groundY: number): Shape3 {
  return { kind: 'box', min: { x: x - 190, y: groundY - 1780, z: z - 230 }, max: { x: x + 190, y: groundY, z: z + 230 } };
}

/** The operator as a part (named on the parts step; the mic is stopped by it). */
export function operatorPart(x: number, z: number, groundY: number, role: string): Part {
  return {
    id: 'op',
    label: 'the person running the measurement',
    short: 'operator',
    role,
    solid: operatorSolid(x, z, groundY),
    prov: ill('drawing default: a standing adult (the shared figure); F11 L35 "a person standing close changes the field"'),
  };
}

/* ── a measurement scene's model ── */

export type MeasureModelOpts = {
  id: string;
  name: string;
  parts: Part[];
  regions: InstrumentModel['regions'];
  surfaces: InstrumentModel['surfaces'];
  lines: InstrumentModel['lines'];
  envelopes?: InstrumentModel['envelopes'];
  variants: Variant[];
  defaultVariant: string;
  views: Partial<Record<ViewId, ViewBox>>;
  viewsByVariant?: InstrumentModel['viewsByVariant'];
  groundY: Dim;
  viewTags?: InstrumentModel['viewTags'];
  aimAzLimit?: number;
  labelMinScale?: number;
  setupFrameMax?: InstrumentModel['setupFrameMax'];
};

/** A scene with nothing to be "inside" of: the interior is empty, no variant has a port. */
export function measureModel(o: MeasureModelOpts): InstrumentModel {
  return {
    id: o.id,
    name: o.name,
    parts: o.parts,
    regions: o.regions,
    surfaces: o.surfaces,
    lines: o.lines,
    envelopes: o.envelopes ?? [],
    variants: o.variants,
    defaultVariant: o.defaultVariant,
    views: o.views,
    ...(o.viewsByVariant ? { viewsByVariant: o.viewsByVariant } : {}),
    ...(o.viewTags ? { viewTags: o.viewTags } : {}),
    ...(o.aimAzLimit ? { aimAzLimit: o.aimAzLimit } : {}),
    ...(o.labelMinScale ? { labelMinScale: o.labelMinScale } : {}),
    ...(o.setupFrameMax ? { setupFrameMax: o.setupFrameMax } : {}),
    yFloor: o.groundY,
    interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
  };
}
