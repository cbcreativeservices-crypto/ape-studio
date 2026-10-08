/**
 * THE LOCATION KIT — Lab 6 group 6 (F09 Location Speech and Practical Sounds;
 * built once, shared with Lab 7's boom and body-mic lessons B04/B05). Pure:
 * no React, so the tests reach it (test/mikingLab6Spatial.test.ts).
 *
 * Research: docs/labs/miking/location_speech/SOURCES.md and
 * GEOMETRY_PROPOSAL.md; the shared keys in measurement_mics/SOURCES.md §0.
 * Internal record only — learner text names no source (owner ruling
 * 2026-10-04).
 *
 * FRAME. A talker is in frame V (shared/voice/voiceSpec.ts): the LIP POINT at
 * the origin, +x straight out of the mouth, +y DOWN, +z to the talker's
 * right, millimetres. The camera faces the talker from +x, looking along −x.
 *
 * WHAT IS HERE
 *   • the three location MOUNT KINDS and how each maps onto the engine's
 *     mounts: a BOOM pole held by an operator (an engine 'clip' whose grip is
 *     the operator's front hand — the pole's reach a drawing default), a
 *     BODY mic clipped to clothing (an engine 'clip' on the sternum: it
 *     follows the TORSO, not the head), a PLANT mic fixed in a prop (an
 *     engine 'surface' mount on that prop);
 *   • the CAMERA FRAME: its top and bottom edges as lines from the lens, the
 *     shot sizes (drawing defaults), the HEADROOM keep-out (the slice of the
 *     shot above the talker's head, where a boom shows in the picture), and
 *     the boom's starting point just above the frame line, aimed at the mouth;
 *   • the OVERHEAD POWER-LINE keep-out: at least 3 m (10 ft) — SAFETY, exact
 *     (OSHA-ELEC "Stay at least 10 feet away from overhead power lines");
 *   • LIGHTNING: wait 30 minutes after the last lightning or thunder
 *     (NWS-LTG) — the number the pages say;
 *   • a HEAD TURN: where the mouth goes when the talker turns, and what each
 *     mic then reads (distance, angle off the mouth's axis) — a boom must be
 *     re-aimed, a body mic stays on the chest.
 */
import type { MountKind, Shape3, Vec3 } from '../../../engine/model/types.ts';

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: Vec3) => Math.sqrt(dot(a, a));
const angle = (a: Vec3, b: Vec3) => {
  const la = len(a);
  const lb = len(b);
  if (la < 1e-9 || lb < 1e-9) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (la * lb)))) / DEG;
};

/* ── SAFETY (exact, plain words on screen) ── */

/** Overhead power lines: keep the pole AND the mic at least this far away.
 *  OSHA-ELEC: "Stay at least 10 feet away from overhead power lines." 10 ft
 *  is 3.05 m; the app says "at least 3 m (10 ft)" — farther if the voltage is
 *  not known, and if clearance cannot be judged, the pole stays down. */
export const POWER_LINE_CLEARANCE = { mm: 3000, ft: 10, src: 'OSHA-ELEC', quote: 'Stay at least 10 feet away from overhead power lines.' } as const;
/** Lightning: shelter at once when thunder is heard; wait this long after the
 *  last lightning or thunder (NWS-LTG). */
export const LIGHTNING = {
  waitMin: 30,
  src: 'NWS-LTG',
  quote: 'If the sky looks threatening or if you hear thunder, get inside a safe place immediately … Wait 30 minutes after the last lightning or thunder before going back outside.',
} as const;
/** The words every Lab 6 group 6 page uses for the two outdoor safety rules
 *  (one source, so F09 and F10 can never drift apart). */
export const SAFETY_WORDS = {
  powerLine: `Keep the boom pole, the stands and every mic at least 3 m (${POWER_LINE_CLEARANCE.ft} ft) from overhead power lines — farther if you do not know the voltage. If you cannot be sure of the clearance, do not raise the pole: ask the site’s qualified people.`,
  lightning: `If you hear thunder or see lightning, stop and get inside a safe place at once — do not stay to finish a take. Wait ${LIGHTNING.waitMin} minutes after the last lightning or thunder before going back out.`,
} as const;

/* ── MOUNT KINDS ── */

export type LocationMount = 'boom' | 'body' | 'plant';
/** Each location mount: the engine mount it is built on, what it moves with,
 *  and its plain words. */
export const LOCATION_MOUNTS: Readonly<Record<LocationMount, { engine: MountKind; follows: 'operator' | 'torso' | 'prop'; words: string }>> = {
  boom: { engine: 'clip', follows: 'operator', words: 'On a boom pole, held by an operator outside the frame, aimed at the mouth' },
  body: { engine: 'clip', follows: 'torso', words: 'Clipped to clothing on the chest — it moves with the torso, not the head' },
  plant: { engine: 'surface', follows: 'prop', words: 'Fixed in a prop or a piece of the set, aimed at one mark or action' },
};

/* ── THE OVERHEAD POWER LINE ── */

/** A conductor as a straight segment a → b (frame V, mm). */
export type OverheadLine = { a: Vec3; b: Vec3 };

/** The keep-out round a line: every point within the clearance (a capsule). */
export function powerLineKeepOut(line: OverheadLine, clearance: number = POWER_LINE_CLEARANCE.mm): Shape3 {
  return { kind: 'capsule', a: line.a, b: line.b, r: clearance };
}
/** The distance from a point to the line (mm). */
export function lineClearance(p: Vec3, line: OverheadLine): number {
  const d = sub(line.b, line.a);
  const L2 = dot(d, d);
  const t = L2 > 0 ? Math.max(0, Math.min(1, dot(sub(p, line.a), d) / L2)) : 0;
  return len(sub(p, v3(line.a.x + d.x * t, line.a.y + d.y * t, line.a.z + d.z * t)));
}
/** The nearest a straight pole (p → q) comes to the line (mm), sampled every
 *  20 mm — the pole counts as much as the mic. */
export function poleClearance(p: Vec3, q: Vec3, line: OverheadLine): number {
  const n = Math.max(1, Math.ceil(len(sub(q, p)) / 20));
  let m = Infinity;
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    m = Math.min(m, lineClearance(v3(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, p.z + (q.z - p.z) * t), line));
  }
  return m;
}
export const clearOfLine = (p: Vec3, line: OverheadLine, clearance: number = POWER_LINE_CLEARANCE.mm) => lineClearance(p, line) >= clearance;

/* ── THE CAMERA FRAME (the vertical plane through the lens and the talker) ── */

/**
 * The camera at `lens`, looking along −x at a talker whose lips are at x = 0.
 * The frame is given by where its TOP and BOTTOM edges cross the talker's
 * plane (x = 0) and its HALF-WIDTH there: a shot size, not a lens number (a
 * drawing default — no source gives one). Its edges are straight lines from
 * the lens.
 */
export type CameraFrame = { lens: Vec3; top: number; bottom: number; halfWidth: number };

/** The top edge's height (y) at horizontal position x. */
export function frameTopY(f: CameraFrame, x: number): number {
  return f.top + (f.lens.y - f.top) * (x / f.lens.x);
}
export function frameBottomY(f: CameraFrame, x: number): number {
  return f.bottom + (f.lens.y - f.bottom) * (x / f.lens.x);
}
/** The frame's half-width at horizontal position x (plan). */
export function frameHalfWidthAt(f: CameraFrame, x: number): number {
  return f.halfWidth * Math.max(0, 1 - x / f.lens.x);
}
/** Is the point inside the shot? (between the lens and past the talker). */
export function inFrame(f: CameraFrame, p: Vec3): boolean {
  if (p.x >= f.lens.x) return false;
  return p.y >= frameTopY(f, p.x) && p.y <= frameBottomY(f, p.x) && Math.abs(p.z - f.lens.z) <= frameHalfWidthAt(f, p.x);
}
/** How far a point sits ABOVE the frame's top edge (mm, + = above, out of shot). */
export function aboveFrame(f: CameraFrame, p: Vec3): number {
  return frameTopY(f, p.x) - p.y;
}

/**
 * THE HEADROOM KEEP-OUT: the slice of the shot between the ray to the top of
 * the talker's head and the frame's top edge — the part of the picture a
 * boom dips into when it is "in shot". A 'sweep' about the lens in the x–y
 * plane (angles from +x toward +y: the rays toward the talker point along −x,
 * so both lie in (−180°, −90°) for a camera at about head height), from r0
 * (clear of a mic on the camera) to r1 (past the talker), ± the frame's
 * half-width across. Below the head the shot holds the talker, a body mic
 * and a handheld — those may be in the picture; above it, nothing of the mic
 * kit may be.
 */
export function headroomKeepOut(f: CameraFrame, headTopY: number, r0 = 400, beyond = 900): Shape3 {
  const ang = (y: number) => Math.atan2(y - f.lens.y, 0 - f.lens.x);
  const a = ang(headTopY);
  const b = ang(f.top);
  return { kind: 'sweep', pivot: f.lens, r0, r1: f.lens.x + beyond, a0: Math.min(a, b), a1: Math.max(a, b), halfW: f.halfWidth };
}

/**
 * SHOT SIZES (drawing defaults — no source gives one): where the frame's top
 * and bottom edges cross the talker's plane, relative to frame V. The head's
 * top is about 168 mm above the lips on the shared figure.
 *   close  head and shoulders: 100 mm of headroom, the bottom at the upper chest;
 *   medium the talker to the waist: 150 mm of headroom;
 *   wide   the whole talker, head to floor, with room above.
 * Each is 16:9 (the half-width from the height).
 */
export type ShotId = 'close' | 'medium' | 'wide';
export const SHOTS: Readonly<Record<ShotId, { label: string; words: string; top: number; bottom: number }>> = {
  close: { label: 'CLOSE', words: 'head and shoulders', top: -270, bottom: 330 },
  medium: { label: 'MEDIUM', words: 'the talker to the waist', top: -320, bottom: 700 },
  wide: { label: 'WIDE', words: 'the whole talker, head to feet', top: -620, bottom: 1620 },
};
export const SHOT_IDS: readonly ShotId[] = ['close', 'medium', 'wide'];

/** A frame for a shot size from a lens (16:9). */
export function frameForShot(lens: Vec3, shot: ShotId): CameraFrame {
  const s = SHOTS[shot];
  return { lens, top: s.top, bottom: s.bottom, halfWidth: ((s.bottom - s.top) * 16) / 9 / 2 };
}

/**
 * THE BOOM'S STARTING POINT for a frame: on the line from the mouth up toward
 * the camera at `elevDeg` above the mouth's axis, the nearest point that sits
 * `clearance` mm above the frame's top edge — "as close as the frame allows",
 * aimed back down at the mouth. The proposal's drawing default is 150 mm of
 * clearance; the elevation is the lab's (45°: overhead and a little in front).
 * The clearance is kept by the mic's TIP. Owner 2026-10-08 (L6A): a shotgun
 * is read to its CAPSULE, `capsule` mm behind the tip on the same line — so
 * `p` and `d` are the capsule's place and its distance from the lips, and
 * `tip` is the tube's end (`capsule` 0: a mic whose capsule is at its front).
 */
export function boomStart(f: CameraFrame, opts: { clearance?: number; elevDeg?: number; capsule?: number } = {}): { p: Vec3; d: number; aim: Vec3; tip: Vec3 } {
  const C = opts.clearance ?? 150;
  const e = (opts.elevDeg ?? 45) * DEG;
  const c = Math.cos(e);
  const s = Math.sin(e);
  // −d·s ≤ top(d·c) − C, top(x) = T + (Ly − T)·x/Lx  ⇒  d ≥ (C − T) / (s + (Ly − T)·c/Lx)
  const T = f.top;
  const d = Math.max(0, (C - T) / (s + ((f.lens.y - T) * c) / f.lens.x));
  const dd = Math.ceil(d / 5) * 5;
  const k = opts.capsule ?? 0;
  const tip = v3(dd * c, -dd * s, 0);
  const p = v3((dd + k) * c, -(dd + k) * s, 0);
  return { p, d: dd + k, aim: v3(-c, s, 0), tip };
}

/* ── THE HEAD TURN ── */

/**
 * The talker turns the head by `yawDeg` (+ toward their right, +z) about a
 * vertical axis through `pivot` (the head's centre over the neck — a drawing
 * default). The mouth moves on a circle round it and the mouth's axis turns
 * with it; the chest — and a mic clipped to it — does not.
 */
export function turnedMouth(yawDeg: number, pivot: Vec3, lip: Vec3 = v3(0, 0, 0)): { mouth: Vec3; dir: Vec3 } {
  const a = yawDeg * DEG;
  const rx = lip.x - pivot.x;
  const rz = lip.z - pivot.z;
  const mouth = v3(pivot.x + rx * Math.cos(a) - rz * Math.sin(a), lip.y, pivot.z + rx * Math.sin(a) + rz * Math.cos(a));
  return { mouth, dir: v3(Math.cos(a), 0, Math.sin(a)) };
}

/** What a mic reads from a (turned) mouth: its distance, how far it sits off
 *  the mouth's axis, and — given its own aim — how far it now points off the
 *  mouth (null for a mic with no aim to keep, an omni body mic). */
export function micToMouth(p: Vec3, aim: Vec3 | null, mouth: Vec3, dir: Vec3): { d: number; offAxis: number; aimErr: number | null } {
  const toMic = sub(p, mouth);
  return { d: len(toMic), offAxis: angle(dir, toMic), aimErr: aim ? angle(aim, sub(mouth, p)) : null };
}

/** The free-field level change between two distances (dB, inverse square):
 *  a DERIVED estimate the pages print with "about". */
export function distanceDb(near: number, far: number): number {
  return 20 * Math.log10(far / near);
}
