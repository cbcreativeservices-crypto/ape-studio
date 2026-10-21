/**
 * armGeometry — the turntable's TONEARM as pure geometry (no React Native:
 * tests reach it): its own frame, its rest pose, the angle that puts the
 * stylus on a groove radius, the angle the drawing turns it to as the track
 * plays, its POSE (on the record / at rest / swung clear — the one answer the
 * top and side views both draw), the section of the record under its line
 * (the side view), and every part's box (the halos, the label obstacles). The drawing
 * (art/TurntableTop) turns the arm with armAngleAt; the halos and callouts
 * derive from the SAME function, so they ride the arm (visual review 2,
 * blocker 3; test/djStage2Review2.test.ts pins it).
 */
import { GROOVE, TT, type Pt } from './boothGeometry.ts';

export type TurntablePart = 'platter' | 'slipmat' | 'tonearm' | 'headshell' | 'counterweight' | 'startStop' | 'speed' | 'pitch';

const DEG = Math.PI / 180;

/* ── the arm, in its own frame (pivot at the origin, arm along +y) ───── */

export const AX = { x: -Math.sin(TT.arm.offsetDeg * DEG), y: Math.cos(TT.arm.offsetDeg * DEG) };
export const L = TT.arm.effective;
/** Headshell collar (where the tube ends) and front, local mm. */
export const COLLAR = { x: -30 * AX.x, y: L - 30 * AX.y };
export const TUBE = {
  p0: { x: 0, y: 6 },
  p1: { x: -16, y: 78 },
  p2: { x: COLLAR.x - 58 * AX.x, y: COLLAR.y - 58 * AX.y },
  p3: COLLAR,
};
export const cubicAt = (t: number) => {
  const u = 1 - t;
  const { p0, p1, p2, p3 } = TUBE;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
};
/** The point of the tube the rest clip holds. */
export const REST_T = 0.6;
/** A local arm point → plinth mm, with the arm turned `ang`. */
export function armToWorld(p: Pt, ang: number): Pt {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: TT.armPivot.x + p.x * c - p.y * s, y: TT.armPivot.y + p.x * s + p.y * c };
}
/** Where the parts of the arm are with it at rest (callouts, halos). */
export const ARM_AT_REST = {
  stylus: armToWorld({ x: 0, y: L }, 0),
  headshell: armToWorld({ x: COLLAR.x + 14 * AX.x, y: COLLAR.y + 14 * AX.y }, 0),
  tube: armToWorld(cubicAt(0.45), 0),
  rest: armToWorld(cubicAt(REST_T), 0),
  counterweight: armToWorld({ x: 0, y: -TT.arm.stub + 12 }, 0),
};

/** The arm angle that puts the stylus `r` mm from the spindle (closed form
 *  of |pivot + L·u(a) − spindle| = r; a worklet). */
const ARM_DX = TT.armPivot.x - TT.platter.cx;
const ARM_DY = TT.armPivot.y - TT.platter.cy;
const ARM_L = TT.arm.effective;
function angleForRadius(r: number): number {
  'worklet';
  const R = Math.sqrt(ARM_DX * ARM_DX + ARM_DY * ARM_DY);
  const phi = Math.atan2(ARM_DX, ARM_DY);
  const K = (r * r - R * R - ARM_L * ARM_L) / (2 * ARM_L);
  const c = Math.max(-1, Math.min(1, K / R));
  return Math.acos(c) - phi;
}
/** The same, callable from tests and JS. */
export const armAngleForRadius = (r: number): number => angleForRadius(r);

/** The arm's parts in their OWN frame (pivot at the origin, the arm at rest
 *  along +y): the points the halos and the callouts hang on. */
export const ARM_LOCAL = {
  headshell: { x: COLLAR.x + 14 * AX.x, y: COLLAR.y + 14 * AX.y },
  counterweight: { x: 0, y: -TT.arm.stub + 12 },
  stylus: { x: 0, y: L },
} as const;

/**
 * The arm's angle as the DRAWING turns it (radians about the pivot): 0 at
 * rest; playing, the angle that puts the stylus on the groove the track has
 * reached (lead-in → run-out). The same formula the arm's per-frame
 * transform uses, so a halo or a callout derived from it stays on the arm
 * (visual review 2, blocker 3).
 */
export function armAngleAt(posSec: number, totalSec: number, spinning: boolean): number {
  'worklet';
  if (!spinning) return 0;
  const f = Math.max(0, Math.min(1, posSec / Math.max(1e-6, totalSec)));
  return angleForRadius(GROOVE.leadIn - (GROOVE.leadIn - GROOVE.runOut) * f);
}

/** Where an arm part is (plinth mm) with the arm turned `ang`. */
export const armPartAt = (part: keyof typeof ARM_LOCAL, ang: number): Pt => armToWorld(ARM_LOCAL[part], ang);

/* ── the arm's POSE: one answer for every view of it (grade 2026-10-19) ── */

/**
 * Where the arm is when its stylus is NOT on the record:
 *   'rest'  — in its rest clip (a deck nobody has played yet: Screen 2);
 *   'clear' — lifted and swung just past the platter's rim, floating free
 *             (balancing the arm, Screen 17).
 * A DJ turntable has NO auto-return: a stopped platter leaves the stylus in
 * the groove it was in. Only the DJ moves the arm.
 */
export type ArmAway = 'rest' | 'clear';
/** Swung clear: the stylus 185 mm from the spindle — 19 mm past the
 *  platter's rim (Ø 332), over the bare plinth. */
export const ARM_CLEAR_R = 185;
export const ARM_CLEAR_ANGLE = angleForRadius(ARM_CLEAR_R);
export const armAwayAngle = (away: ArmAway): number => {
  'worklet';
  return away === 'clear' ? ARM_CLEAR_ANGLE : 0;
};
/** The arm's angle (top view) for a pose: on the record, the groove the
 *  track has reached (whether or not the platter turns); off it, away. */
export function armPoseAngle(on: boolean, away: ArmAway, posSec: number, totalSec: number): number {
  'worklet';
  return on ? armAngleAt(posSec, totalSec, true) : armAwayAngle(away);
}
/** An arm move, in BOTH views: the cue lift first, then the swing. */
export const ARM_MOVE = { liftMs: 280, swingMs: 820, lowerMs: 650 } as const;

/**
 * The record and the platter UNDER THE ARM'S LINE (the side view's section),
 * as distances from the pivot along the pivot → stylus line (mm; the stylus
 * is at u = L). A disc of radius R is crossed where the line passes within R
 * of the spindle. null = the line misses it. Pure (a worklet).
 */
export function armSection(ang: number): { record: [number, number] | null; platter: [number, number] | null; label: [number, number] | null; cue: number } {
  'worklet';
  const dx = -Math.sin(ang);
  const dy = Math.cos(ang);
  const cx = TT.platter.cx - TT.armPivot.x;
  const cy = TT.platter.cy - TT.armPivot.y;
  const t = cx * dx + cy * dy;
  const h2 = cx * cx + cy * cy - t * t;
  const span = (R: number): [number, number] | null => (h2 < R * R ? [t - Math.sqrt(R * R - h2), t + Math.sqrt(R * R - h2)] : null);
  // the cue lever, projected on the line (its bar reaches under the tube)
  const cue = (TT.lift.x - TT.armPivot.x) * dx + (TT.lift.y - TT.armPivot.y) * dy;
  return { record: span(TT.record.d / 2), platter: span(TT.platter.d / 2), label: span(TT.record.label / 2), cue };
}

/** The SIDE VIEW's frame (mm; x right, y DOWN, the plinth's top at y = 0):
 *  the stylus at x = 34 with the pivot an effective length behind it, so a
 *  point u mm from the pivot along the arm's line is at x = pivotX − u. */
export const ARM_SIDE = {
  stylusX: 34,
  pivotX: 34 + 230,
  /** The record's top surface; the tube's centre line (parallel at play). */
  recTop: -21,
  tubeY: -43,
  L: 230,
  /** The stack on the plinth: the platter's top, the slipmat, the record. */
  platterTop: -16,
  matTop: -19,
} as const;

/** The stylus's distance from the spindle (mm) with the arm turned `ang`. */
export function stylusRadius(ang: number): number {
  const s = armToWorld({ x: 0, y: L }, ang);
  return Math.hypot(s.x - TT.platter.cx, s.y - TT.platter.cy);
}

export function turntablePartBox(p: TurntablePart, armAngle = 0): { x: number; y: number; w: number; h: number; round?: boolean } {
  const P = TT.platter;
  const A = { headshell: armPartAt('headshell', armAngle), counterweight: armPartAt('counterweight', armAngle) };
  switch (p) {
    case 'platter': return { x: P.cx - P.d / 2 - 4, y: P.cy - P.d / 2 - 4, w: P.d + 8, h: P.d + 8, round: true };
    case 'slipmat': return { x: P.cx - TT.record.d / 2 - 2, y: P.cy - TT.record.d / 2 - 2, w: TT.record.d + 4, h: TT.record.d + 4, round: true };
    case 'tonearm': return { x: TT.armPivot.x - 30, y: TT.armPivot.y - 30, w: 60, h: L + 30 };
    case 'headshell': return { x: A.headshell.x - 20, y: A.headshell.y - 24, w: 40, h: 48, round: true };
    case 'counterweight': return { x: A.counterweight.x - 18, y: A.counterweight.y - 20, w: 36, h: 40, round: true };
    case 'startStop': return { x: TT.startStop.x - 4, y: TT.startStop.y - 4, w: TT.startStop.w + 8, h: TT.startStop.h + 8 };
    case 'speed': return { x: TT.speed33.x - 4, y: TT.speed33.y - 4, w: TT.speed45.x + TT.speed45.w - TT.speed33.x + 8, h: TT.speed33.h + 8 };
    case 'pitch': return { x: TT.pitch.x - 14, y: TT.pitch.top - 12, w: 28, h: TT.pitch.len + 24 };
  }
}

/** The parts that move with the arm: their halos ride its transform. */
export const ARM_HALOS: readonly TurntablePart[] = ['headshell', 'counterweight'];

/** Every control's box — the labels' obstacles. */
export const TT_PARTS: readonly TurntablePart[] = ['tonearm', 'headshell', 'counterweight', 'startStop', 'speed', 'pitch'];

