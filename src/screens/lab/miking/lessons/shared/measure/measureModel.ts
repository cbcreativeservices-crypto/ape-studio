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
import { pt } from '../players/playerPose.ts';

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

/* ── the operator READING THE LOG SHEET (art fix round 3, 2026-10-16: the
 *    graded operator stood with "arms hanging"). Both hands hold a clipboard
 *    — the method's log sheet (logSheet.ts: the reference point, the
 *    distance, the chain and its check are written down) — up in front of
 *    the chest, the board leaning away so the sheet faces the eyes. The upper
 *    arms hang close to the body, the elbows bend about 90°, the forearms
 *    rise a little to the board's lower corners. Authored facing +x (side)
 *    or chest toward +v (above), then moved and turned like the plain pose.
 *    Every joint is a drawing default. ── */

const N = SINGER_NECK;
/** The board leans away from the reader this much from level (drawing default). */
const SHEET_TILT = (55 * Math.PI) / 180;
/** A letter-size clipboard: 230 mm across, 320 mm long (drawing default). */
export const CLIPBOARD = { w: 230, len: 320, thick: 14 } as const;
const R_WRIST_SIDE = pt(N.x + 270, N.y + 238);
const R_DIR_SIDE = -0.42;
const READ_SIDE: PlayerPose = {
  ...SINGER_SIDE,
  // The upper arm hangs a little forward of the torso; the forearm rises to the board.
  elbowR: pt(N.x + 34, N.y + 350),
  elbowL: pt(N.x + 20, N.y + 340),
  handR: { wrist: R_WRIST_SIDE, dir: R_DIR_SIDE, kind: 'grip' },
  handL: { wrist: pt(N.x + 256, N.y + 230), dir: R_DIR_SIDE, kind: 'grip' },
};
/** The board's lower edge sits in the near fist (side view, authored frame). */
const SHEET_LOW = pt(R_WRIST_SIDE.u + Math.cos(R_DIR_SIDE) * 78, R_WRIST_SIDE.v + Math.sin(R_DIR_SIDE) * 78);

const NT = SINGER_TOP.neck;
const LT = (right: number, fwd: number) => pt(NT.u - right, NT.v + fwd);
const READ_TOP: PlayerPose = {
  ...SINGER_TOP,
  elbowR: LT(186, 58),
  elbowL: LT(-186, 58),
  handR: { wrist: LT(118, 292), dir: Math.PI / 2 + 0.1, kind: 'grip' },
  handL: { wrist: LT(-118, 292), dir: Math.PI / 2 - 0.1, kind: 'grip' },
};
/** From above: the board's lower edge `fwd` ahead of the collar (the fists' grip). */
const SHEET_FWD_TOP = 330;

/** The operator in profile, reading the log sheet (see above). */
export function operatorSideReading(x: number, groundY: number, facing: 1 | -1): PlayerPose {
  const du = x - SINGER_NECK.x;
  const dv = groundY - FLOOR_Y;
  const f = (q: Pt): Pt => (facing === 1 ? { u: q.u + du, v: q.v + dv } : { u: 2 * x - (q.u + du), v: q.v + dv });
  return mapPose(READ_SIDE, f, facing === -1, { facing, floor: groundY });
}

/** The operator from above, reading the log sheet. */
export function operatorTopReading(x: number, z: number, facing: 1 | -1): PlayerPose {
  const du = x - SINGER_TOP.neck.u;
  const dv = z - SINGER_TOP.neck.v;
  return mapPose(READ_TOP, (q) => ({ u: q.u + du, v: q.v + dv }), false, { facing: facing === 1 ? 0 : Math.PI });
}

/** The clipboard in a reading pose's view: side — its edge-on line from the
 *  lower edge (in the fists) to the top edge (under the clip); above — the
 *  board's four corners in the pose's AUTHORED frame (the art turns it with
 *  the figure) and the clip's end. */
export function sheetOf(pose: PlayerPose): { kind: 'side'; low: Pt; high: Pt } | { kind: 'above'; corners: Pt[]; clip: Pt } {
  if (pose.view === 'side') {
    const s = (pose.facing ?? 1) as number;
    // Undo the authored → placed move from the collar (the pose's neck).
    const dx = pose.neck.u - s * SINGER_SIDE.neck.u;
    const dy = pose.neck.v - SINGER_SIDE.neck.v;
    const at = (q: Pt): Pt => ({ u: dx + s * q.u, v: q.v + dy });
    const high = pt(SHEET_LOW.u + Math.cos(SHEET_TILT) * CLIPBOARD.len, SHEET_LOW.v - Math.sin(SHEET_TILT) * CLIPBOARD.len);
    return { kind: 'side', low: at(SHEET_LOW), high: at(high) };
  }
  const n = pose.neck;
  const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
  const deep = Math.cos(SHEET_TILT) * CLIPBOARD.len;
  const h = CLIPBOARD.w / 2;
  return { kind: 'above', corners: [L(h, SHEET_FWD_TOP), L(-h, SHEET_FWD_TOP), L(-h, SHEET_FWD_TOP + deep), L(h, SHEET_FWD_TOP + deep)], clip: L(0, SHEET_FWD_TOP + deep) };
}

/** The reading operator's collision solid: the standing envelope, reaching
 *  forward (toward `facing`) to the clipboard's far edge. */
export function operatorReadingSolid(x: number, z: number, groundY: number, facing: 1 | -1): Shape3 {
  const reach = SHEET_LOW.u - SINGER_NECK.x + Math.cos(SHEET_TILT) * CLIPBOARD.len + 20;
  return { kind: 'box', min: { x: facing === 1 ? x - 190 : x - reach, y: groundY - 1780, z: z - 230 }, max: { x: facing === 1 ? x + reach : x + 190, y: groundY, z: z + 230 } };
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
