/**
 * THE CAMERA FRAME — Lab 7 (broadcast). Built once by group 2 (B04 boom and
 * camera, B02 news anchors, B05 body-worn); group 3 (B03 field reporters,
 * B08 audience) imports it, and the later sports lessons (B10–B13) will.
 * Pure: no React, so the tests reach it (test/mikingLab7BodyCamera.test.ts).
 *
 * Research: docs/labs/miking/boom_camera/GEOMETRY_PROPOSAL.md §1 (the CAMERA
 * FRAME tool) and SOURCES.md. No source gives a lens angle, a camera distance
 * or a frame margin: every camera, preset and clearance here is a DRAWING
 * DEFAULT (owner list "lens presets"). The geometry built on them is DERIVED
 * (the frame is a pyramid from the lens; a mic is in the shot or it is not).
 * It generalises the location kit's frame (shared/field/location.ts, Lab 6
 * F09: a camera looking along −x, its edges given where they cross the
 * talker's plane) to a camera aimed anywhere; `toLocationFrame` converts back
 * so the location kit's FrameLines art and headroomKeepOut stay reusable.
 *
 * FRAME. The scene's frame (frame V of the lesson's talker: +x out of the
 * mouth, +y DOWN, +z to the talker's right, mm).
 *
 * EXPORTS (the API group 3 and the later lessons import):
 *   BroadcastCamera        a lens point, where it looks (yaw in plan, tilt),
 *                          its vertical angle of view and its aspect (16:9);
 *   cameraAxes(cam)        its forward, right and up unit vectors;
 *   cameraLooking(...)     a camera at a lens point aimed at a target;
 *   SHOT_PRESETS / ShotPresetId   'close' (head and shoulders) and 'wide'
 *                          (the talker to the waist, room round them) — where
 *                          the frame's top and bottom edges cross the talker;
 *   cameraForShot(...)     a camera at a lens point framing a talker for a
 *                          preset (or any top / bottom you give it);
 *   frameCoords(cam, p)    a point in the camera's terms: forward distance,
 *                          and its angles across and up from the lens axis;
 *   frameClearance(cam, p) how far OUTSIDE the frame a point is (mm, + =
 *                          outside, − = inside; behind the lens = +∞);
 *   inShot / outsideFrame  the test: in the picture, or clear of it by a
 *                          margin (a mic tip, a pole, an operator);
 *   segmentClearance       the least clearance along a segment (a pole);
 *   frameHalfExtents       the frame's half width and half height at a
 *                          forward distance;
 *   frameEdgeRays          the edge rays from the lens in a view (side: top
 *                          and bottom; top: left and right) — for drawing;
 *   boomOutside / boomAbove / boomBelow / boomSide
 *                          a boom's starting point: on a line from the mouth,
 *                          the nearest point that sits `clearance` mm outside
 *                          the frame, aimed back at the mouth — "as close as
 *                          the frame allows" (DERIVED);
 *   cameraBody(cam)        the camera body as a box (a collision solid);
 *   cameraShoe(cam)        the shoe a camera mic clamps to (a Rim);
 *   cameraMic(cam, ...)    a mic on the camera's shoe: it moves with the
 *                          camera, aimed where the lens points;
 *   headroomFan / sideFan / footFan   the parts of the shot a boom must keep
 *                          out of, as collision keep-outs ('fan' solids): the
 *                          slice above the head, beside the talker, below
 *                          the talker's visible body;
 *   toLocationFrame(cam)   the location kit's CameraFrame (a camera looking
 *                          along −x only).
 * Light and shadow are words only (no light model).
 */
import type { Shape3, Vec3 } from '../../../engine/model/types.ts';
import type { CameraFrame } from '../field/location.ts';

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const add = (a: Vec3, b: Vec3): Vec3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const scale = (a: Vec3, k: number): Vec3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: Vec3) => Math.sqrt(dot(a, a));
const unit = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};

/** The usual picture: 16:9 (a drawing default — no camera is specified). */
export const CAMERA_ASPECT = 16 / 9;

/**
 * A camera: the lens point, where it looks — `yawDeg` in plan from +x toward
 * +z (180 = looking along −x, at a talker facing +x), `tiltDeg` up from level
 * (+ up, y is down) — its VERTICAL angle of view and its aspect (width ÷
 * height). Every number is a drawing default.
 */
export type BroadcastCamera = { lens: Vec3; yawDeg: number; tiltDeg: number; vFovDeg: number; aspect: number };

/** The camera's forward, right and up unit vectors (right = the picture's
 *  right as the operator sees it; up = the picture's top). */
export function cameraAxes(cam: BroadcastCamera): { fwd: Vec3; right: Vec3; up: Vec3 } {
  const a = cam.yawDeg * DEG;
  const t = cam.tiltDeg * DEG;
  const h = v3(Math.cos(a), 0, Math.sin(a));
  const U = v3(0, -1, 0);
  const fwd = add(scale(h, Math.cos(t)), scale(U, Math.sin(t)));
  const up = add(scale(h, -Math.sin(t)), scale(U, Math.cos(t)));
  // right = up × fwd (this frame — x out, y down, z right — makes fwd × up
  // the LEFT): for a camera looking along −x it is −z, the talker's left,
  // the operator's right.
  const right = v3(up.y * fwd.z - up.z * fwd.y, up.z * fwd.x - up.x * fwd.z, up.x * fwd.y - up.y * fwd.x);
  return { fwd, right: unit(right), up };
}

/** The horizontal angle of view from the vertical one and the aspect. */
export function hFovDeg(cam: BroadcastCamera): number {
  return (2 * Math.atan(Math.tan((cam.vFovDeg * DEG) / 2) * cam.aspect)) / DEG;
}

/** A camera at `lens` aimed straight at `target`. */
export function cameraLooking(lens: Vec3, target: Vec3, vFovDeg: number, aspect = CAMERA_ASPECT): BroadcastCamera {
  const d = sub(target, lens);
  const yawDeg = Math.atan2(d.z, d.x) / DEG;
  const tiltDeg = Math.atan2(-d.y, Math.hypot(d.x, d.z)) / DEG;
  return { lens, yawDeg, tiltDeg, vFovDeg, aspect };
}

/**
 * SHOT PRESETS — where the frame's top and bottom edges cross the talker's
 * vertical plane, relative to the lip point (y down, mm). Drawing defaults:
 *   close  head and shoulders: 100 mm of room above the head, the bottom at
 *          the upper chest (the location kit's close shot, location.SHOTS);
 *   wide   the talker to the waist with room round them: 250 mm above the
 *          head, the bottom 76 cm below the lips (a seated talker's desk top
 *          is in it; a standing talker is cut at the waist).
 */
export type ShotPresetId = 'close' | 'wide';
export const SHOT_PRESETS: Readonly<Record<ShotPresetId, { label: string; words: string; top: number; bottom: number }>> = {
  close: { label: 'CLOSE', words: 'head and shoulders', top: -270, bottom: 330 },
  wide: { label: 'WIDE', words: 'to the waist, room round them', top: -420, bottom: 760 },
};
export const SHOT_PRESET_IDS: readonly ShotPresetId[] = ['close', 'wide'];

/**
 * A camera at `lens` framing a talker whose lip point is `lip`: aimed in plan
 * at `centre` (default the lip point — a two-shot passes the point between
 * two talkers), tilted so the frame's top and bottom edges cross the talker's
 * vertical plane at lip.y + top and lip.y + bottom; 16:9. A shot, not a lens
 * number (no source gives one).
 */
export function cameraForShot(lens: Vec3, lip: Vec3, shot: { top: number; bottom: number }, centre: Vec3 = lip, aspect = CAMERA_ASPECT): BroadcastCamera {
  const yawDeg = Math.atan2(centre.z - lens.z, centre.x - lens.x) / DEG;
  const D = Math.hypot(lip.x - lens.x, lip.z - lens.z);
  const up = (y: number) => Math.atan2(lens.y - y, D) / DEG;
  const a = up(lip.y + shot.top);
  const b = up(lip.y + shot.bottom);
  return { lens, yawDeg, tiltDeg: (a + b) / 2, vFovDeg: a - b, aspect };
}

/** A point in the camera's terms: `f` forward of the lens, and the angles
 *  (deg) across (+ = picture right) and up from the lens axis. */
export function frameCoords(cam: BroadcastCamera, p: Vec3): { f: number; across: number; up: number; aDeg: number; uDeg: number } {
  const { fwd, right, up } = cameraAxes(cam);
  const w = sub(p, cam.lens);
  const f = dot(w, fwd);
  const across = dot(w, right);
  const upd = dot(w, up);
  return { f, across, up: upd, aDeg: Math.atan2(across, f) / DEG, uDeg: Math.atan2(upd, f) / DEG };
}

/** The frame's half width and half height at forward distance `f`. */
export function frameHalfExtents(cam: BroadcastCamera, f: number): { halfW: number; halfH: number } {
  const th = Math.tan((cam.vFovDeg * DEG) / 2);
  return { halfW: f * th * cam.aspect, halfH: f * th };
}

/**
 * How far OUTSIDE the frame `p` is, mm: the largest signed distance to the
 * frame's four side planes (+ = outside that plane). Inside the picture it is
 * negative (how deep inside the nearest edge). A point behind the lens is
 * never in the picture: +∞. The distance to the pyramid is at least this.
 */
export function frameClearance(cam: BroadcastCamera, p: Vec3): number {
  const { fwd, right, up } = cameraAxes(cam);
  const w = sub(p, cam.lens);
  const f = dot(w, fwd);
  if (f <= 0) return Infinity;
  const hv = (cam.vFovDeg * DEG) / 2;
  const hh = Math.atan(Math.tan(hv) * cam.aspect);
  const r = dot(w, right);
  const u = dot(w, up);
  // A side plane through the lens, its outward normal n = −sin·fwd + cos·side.
  const plane = (s: number, half: number) => -Math.sin(half) * f + Math.cos(half) * s;
  return Math.max(plane(u, hv), plane(-u, hv), plane(r, hh), plane(-r, hh));
}

/** In the picture (deeper than `margin` inside every edge when margin < 0). */
export function inShot(cam: BroadcastCamera, p: Vec3, margin = 0): boolean {
  return frameClearance(cam, p) < margin;
}
/** Clear of the picture by at least `margin` mm (a mic tip, a pole, a stand). */
export function outsideFrame(cam: BroadcastCamera, p: Vec3, margin = 0): boolean {
  return frameClearance(cam, p) >= margin;
}
/** The least clearance along a segment a → b, sampled every 20 mm (a boom
 *  pole, a stand's column: every part of it counts, not just the mic). */
export function segmentClearance(cam: BroadcastCamera, a: Vec3, b: Vec3): number {
  const n = Math.max(1, Math.ceil(len(sub(b, a)) / 20));
  let m = Infinity;
  for (let k = 0; k <= n; k++) m = Math.min(m, frameClearance(cam, add(a, scale(sub(b, a), k / n))));
  return m;
}

/** The frame's edge rays in a view, from the lens to `reach` mm out: from the
 *  side (u = x, v = y) the top and bottom edges in the camera's vertical
 *  plane; from above (u = x, v = z) the left and right edges at the lens's
 *  height. For drawing (CameraArt.tsx). */
export function frameEdgeRays(cam: BroadcastCamera, view: 'side' | 'top', reach: number): { a: Vec3; b: Vec3; edge: 'top' | 'bottom' | 'left' | 'right' }[] {
  const { fwd, right, up } = cameraAxes(cam);
  const hv = (cam.vFovDeg * DEG) / 2;
  const hh = Math.atan(Math.tan(hv) * cam.aspect);
  const ray = (side: Vec3, half: number, k: 1 | -1) => unit(add(scale(fwd, Math.cos(half)), scale(side, k * Math.sin(half))));
  const out = (d: Vec3, edge: 'top' | 'bottom' | 'left' | 'right') => ({ a: cam.lens, b: add(cam.lens, scale(d, reach)), edge });
  if (view === 'side') return [out(ray(up, hv, 1), 'top'), out(ray(up, hv, -1), 'bottom')];
  // From above: the side edges through the middle of the picture (drawn in
  // plan, u = x, v = z).
  return [out(ray(right, hh, 1), 'right'), out(ray(right, hh, -1), 'left')];
}

/** The camera's body as a box behind the lens point (a drawing default: 32
 *  cm long, 19 cm tall, 16 cm wide — the location kit's camera), for a
 *  camera looking along −x: the model's collision solid and the art's rig. */
export function cameraBody(cam: BroadcastCamera): { min: Vec3; max: Vec3 } {
  const L = cam.lens;
  return { min: v3(L.x - 10, L.y - 95, L.z - 80), max: v3(L.x + 310, L.y + 95, L.z + 80) };
}

/* ── the boom's starting point ── */

export type BoomStart = { p: Vec3; d: number; aim: Vec3 };

/**
 * On the line from `mouth` along the unit direction `dir`, the NEAREST point
 * (from `minD`, in 5 mm steps, up to `maxD`) that sits at least `clearance`
 * mm outside the frame — "as close as the frame allows" — aimed back at the
 * mouth. `ok` false when nothing on the line clears (the start is maxD).
 */
export function boomOutside(cam: BroadcastCamera, mouth: Vec3, dir: Vec3, clearance = 150, minD = 60, maxD = 3000): BoomStart & { ok: boolean } {
  const u = unit(dir);
  for (let d = Math.ceil(minD / 5) * 5; d <= maxD; d += 5) {
    const p = add(mouth, scale(u, d));
    if (frameClearance(cam, p) >= clearance) return { p, d, aim: scale(u, -1), ok: true };
  }
  return { p: add(mouth, scale(u, maxD)), d: maxD, aim: scale(u, -1), ok: false };
}

/** The direction from the mouth toward the camera in plan, turned `planDeg`
 *  about the vertical (+ toward the talker's right, +z) and raised `elevDeg`
 *  (+ up). */
export function towardCamera(cam: BroadcastCamera, mouth: Vec3, elevDeg: number, planDeg = 0): Vec3 {
  const a = Math.atan2(cam.lens.z - mouth.z, cam.lens.x - mouth.x) + planDeg * DEG;
  const e = elevDeg * DEG;
  return v3(Math.cos(e) * Math.cos(a), -Math.sin(e), Math.cos(e) * Math.sin(a));
}

/** Above the frame and a little in front, aimed down at the mouth (45° is
 *  the lab's default: overhead and slightly in front). */
export function boomAbove(cam: BroadcastCamera, mouth: Vec3, opts: { clearance?: number; elevDeg?: number; planDeg?: number } = {}): BoomStart & { ok: boolean } {
  return boomOutside(cam, mouth, towardCamera(cam, mouth, opts.elevDeg ?? 45, opts.planDeg ?? 0), opts.clearance ?? 150);
}
/** Below the frame, aimed up at the mouth ("below if the top of the frame,
 *  the light or the set block overhead"). */
export function boomBelow(cam: BroadcastCamera, mouth: Vec3, opts: { clearance?: number; elevDeg?: number; planDeg?: number } = {}): BoomStart & { ok: boolean } {
  return boomOutside(cam, mouth, towardCamera(cam, mouth, -(opts.elevDeg ?? 40), opts.planDeg ?? 0), opts.clearance ?? 150);
}
/** Beside the frame at about mouth height (a conditional start): `side` +1 =
 *  toward the talker's right, −1 their left; `planDeg` how far round from
 *  the camera's line (default 70°), a little raised. */
export function boomSide(cam: BroadcastCamera, mouth: Vec3, opts: { clearance?: number; side?: 1 | -1; planDeg?: number; elevDeg?: number } = {}): BoomStart & { ok: boolean } {
  const s = opts.side ?? -1;
  return boomOutside(cam, mouth, towardCamera(cam, mouth, opts.elevDeg ?? 10, s * (opts.planDeg ?? 70)), opts.clearance ?? 150);
}

/** The camera's accessory shoe on top of the body, 20 cm behind the lens
 *  point (a drawing default): the grip a camera mic's mount clamps to. */
export function cameraShoe(cam: BroadcastCamera): Vec3 {
  const { fwd, up } = cameraAxes(cam);
  return add(add(cam.lens, scale(up, 95)), scale(fwd, -200));
}

/** A mic on the camera's shoe: `above` mm over the lens axis and `back` mm
 *  behind the lens — it moves with the camera, aimed where the lens points.
 *  (A drawing default: no mount is specified.) */
export function cameraMic(cam: BroadcastCamera, opts: { above?: number; back?: number } = {}): { p: Vec3; aim: Vec3 } {
  const { fwd, up } = cameraAxes(cam);
  const p = add(add(cam.lens, scale(up, opts.above ?? 115)), scale(fwd, -(opts.back ?? 40)));
  return { p, aim: fwd };
}

/* ── keep-outs: the parts of the shot a boom stays out of ── */

/** A 'fan' in the camera's vertical plane between two directions from the
 *  lens (both in that plane), reaching `reach` mm, `halfW` mm either side. */
function verticalFan(cam: BroadcastCamera, d1: Vec3, d2: Vec3, reach: number, halfW: number): Shape3 {
  const { right } = cameraAxes(cam);
  const a = unit(d1);
  const b = unit(d2);
  const u = unit(add(a, b));
  const v = unit(v3(right.y * u.z - right.z * u.y, right.z * u.x - right.x * u.z, right.x * u.y - right.y * u.x));
  const ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / 2;
  return { kind: 'fan', c: cam.lens, axis: right, u, v, r: reach, ang, halfW, round: 0 };
}

/** The camera's vertical plane through a point: the direction from the lens
 *  to `p`, flattened into that plane. */
function inVerticalPlane(cam: BroadcastCamera, p: Vec3): Vec3 {
  const { right } = cameraAxes(cam);
  const w = sub(p, cam.lens);
  return sub(w, scale(right, dot(w, right)));
}

/**
 * THE HEADROOM: the slice of the shot between the ray to the top of the
 * talker's head (`headTop`) and the frame's top edge, from the lens to
 * `beyond` mm past the talker, as wide as the frame is at the talker. A boom
 * that dips into it shows in the picture. (A fan: a simplified picture of
 * the pyramid, as wide at the camera as at the talker.)
 */
export function headroomFan(cam: BroadcastCamera, headTop: Vec3, beyond = 900): Shape3 {
  const { fwd, up } = cameraAxes(cam);
  const hv = (cam.vFovDeg * DEG) / 2;
  const topEdge = add(scale(fwd, Math.cos(hv)), scale(up, Math.sin(hv)));
  const f = frameCoords(cam, headTop).f;
  return verticalFan(cam, inVerticalPlane(cam, headTop), topEdge, f + beyond, frameHalfExtents(cam, f).halfW);
}
/**
 * BELOW THE TALKER'S VISIBLE BODY: between the frame's bottom edge and the
 * ray to `low` (the lowest point of the talker the shot is about — the chin,
 * the chest), stopping `stop` mm in front of the talker, so a mic worn on the
 * chest is not in it. A boom brought from below stays under this slice.
 */
export function footFan(cam: BroadcastCamera, low: Vec3, stop = 150): Shape3 {
  const { fwd, up } = cameraAxes(cam);
  const hv = (cam.vFovDeg * DEG) / 2;
  const botEdge = add(scale(fwd, Math.cos(hv)), scale(up, -Math.sin(hv)));
  const f = frameCoords(cam, low).f;
  return verticalFan(cam, inVerticalPlane(cam, low), botEdge, Math.max(0, f - stop), frameHalfExtents(cam, f).halfW);
}
/**
 * BESIDE THE TALKER: the slice of the shot between the frame's left or right
 * edge (`side` +1 = toward the talker's right, +z for a camera looking along
 * −x) and the talker's shoulder `halfBody` mm off the axis, from the lens to
 * `beyond` mm past the talker, as tall as the frame at the talker.
 */
export function sideFan(cam: BroadcastCamera, talker: Vec3, side: 1 | -1, halfBody = 260, beyond = 900): Shape3 {
  const { fwd, right, up } = cameraAxes(cam);
  const fc = frameCoords(cam, talker);
  // The talker's right is the camera's left when they face each other.
  const s = -side;
  const hh = Math.atan(Math.tan((cam.vFovDeg * DEG) / 2) * cam.aspect);
  const edge = add(scale(fwd, Math.cos(hh)), scale(right, s * Math.sin(hh)));
  const body = add(scale(fwd, fc.f), scale(right, fc.across + s * halfBody));
  const a = unit(edge);
  const b = unit(body);
  const u = unit(add(a, b));
  const v = unit(v3(up.y * u.z - up.z * u.y, up.z * u.x - up.x * u.z, up.x * u.y - up.y * u.x));
  const ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / 2;
  return { kind: 'fan', c: cam.lens, axis: up, u, v, r: fc.f + beyond, ang, halfW: frameHalfExtents(cam, fc.f).halfH, round: 0 };
}

/** The location kit's frame (shared/field/location.ts) for a camera looking
 *  along −x (yaw 180°): where its top and bottom edges cross x = 0, and its
 *  half width there — so FrameLines and headroomKeepOut can draw and test it. */
export function toLocationFrame(cam: BroadcastCamera): CameraFrame {
  const { fwd, up } = cameraAxes(cam);
  const hv = (cam.vFovDeg * DEG) / 2;
  const edgeY = (k: 1 | -1) => {
    const d = add(scale(fwd, Math.cos(hv)), scale(up, k * Math.sin(hv)));
    // Along the edge ray to x = 0.
    const t = (0 - cam.lens.x) / d.x;
    return cam.lens.y + d.y * t;
  };
  const f = Math.abs(cam.lens.x) / Math.max(1e-9, Math.abs(fwd.x));
  return { lens: cam.lens, top: edgeY(1), bottom: edgeY(-1), halfWidth: frameHalfExtents(cam, f).halfW };
}
