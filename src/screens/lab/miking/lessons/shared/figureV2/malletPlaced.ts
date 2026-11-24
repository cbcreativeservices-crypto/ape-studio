/**
 * FIGURE V2 — CAN THE APPROVED MALLET HAND BE PLACED ON A PLAYER'S ARM, SIDE VIEW? (2026-11-24)
 *
 * The approved hand (malletHandBack.tsx, owner: "Mallet hand passes") is drawn with a STRAIGHT wrist: the shaft runs
 * 15° below the forearm's line. Placed on a lesson, its fulcrum goes on the lesson's grip point and its shaft on the
 * lesson's shaft (nothing the lesson measures moves), so the forearm's direction on the page is fixed by the drawing.
 * This asks whether an arm from the lesson's shoulder can come in along that direction: the elbow on the drawing's
 * forearm line, the upper arm reaching it (300 mm; on the page up to 15 % longer, as the boom hands allow), the
 * forearm 60–100 % of its 290 mm on the page (turned into depth). If not, it reports the reachable forearm direction
 * nearest the needed one and the wrist bend the drawing would need there: the hand is NOT placed (owner rule:
 * report the numbers, never force it).
 *
 * OWNER 2026-11-24, "Raise the hands" (M06 timpani, M07a concert bass drum): the grip points may move. The mallet's
 * head stays where the lesson has it and the shaft keeps its real length; malletGripFor finds the grip on that length
 * where the drawing's straight wrist sits on the most natural arm (forearm nearest level, the elbow near the side);
 * the lessons carry the numbers it found (the tests check them against it). malletSidePlan then draws that arm.
 * No React here: the drawing's constants only.
 */
import { MALLET_HAND_CUFF, MALLET_SHAFT_TILT } from './malletHandBack';
import { add, dot, mul, P, sub, unit, type Pt } from './geom.ts';
import { STICK_ARM, stickArm3, stickSidePlan, twoBone, type StickArm3 } from './playersStick.ts';
import { stickHold } from './grip.ts';
import { placeHand } from './authoredHands.ts';
import { armPlan, type SidePlan } from './sidePlan.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import type { CastMember } from './cast';

type V3 = { x: number; y: number; z: number };

/** The most the wrist may differ from straight and still count as the approved drawing (degrees). */
export const MALLET_BEND_MAX = 8;
const UPPER_SLACK = 1.15;
const FORE_MIN = 0.6;

export type MalletFit = {
  fits: boolean;
  /** The lesson's shaft on the page, fulcrum → head (degrees; + = down the page). */
  shaftDeg: number;
  /** The forearm direction (elbow → wrist) the drawing needs, and the reachable one nearest it. */
  needForeDeg: number;
  bestForeDeg: number;
  /** The wrist bend the drawing would need on the nearest reachable arm (0 = straight). */
  bendDeg: number;
  /** The hand's placement (for MalletHandBack) and its cuff on the page. */
  at: { x: number; y: number; rot: number; mirror: boolean };
  cuff: Pt;
  /** The elbow for a straight wrist (when it fits). */
  elbow: Pt | null;
  why: string;
};

const deg = (a: number) => (a * 180) / Math.PI;
const wrapDeg = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** The approved drawing on the page for a grip point and a shaft angle: its rotation, its cuff, the forearm's way. */
function drawingAt(F: Pt, ang: number, mirror: boolean) {
  const m = mirror ? -1 : 1;
  const rot = mirror ? ang - Math.PI + MALLET_SHAFT_TILT : ang - MALLET_SHAFT_TILT;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  const toPage = (q: Pt) => P(F.u + q.u * m * co - q.v * si, F.v + q.u * m * si + q.v * co);
  return { rot, cuff: toPage(MALLET_HAND_CUFF), df: P(m * co, m * si) };
}

/** A mallet arm re-posed for the approved drawing (owner 2026-11-24, "Raise the hands"). */
export type MalletArmPose = {
  /** The grip point (the drawing's fulcrum) and the mallet's head (unchanged). */
  grip: V3;
  head: V3;
  /** The arm in 3-D: the elbow, and the wrist at the drawing's cuff. */
  elbow: V3;
  wrist: V3;
  /** The forearm on the page (elbow → wrist, degrees; 0 = level toward +x) and its tilt from level. */
  foreDeg: number;
  tiltDeg: number;
  /** The shaft on the page (grip → head, degrees). */
  shaftDeg: number;
  /** The upper arm's and forearm's 3-D lengths (mm). */
  upper: number;
  fore: number;
  /** How far forward of the shoulder the elbow is (mm, along the way the player faces) and below it. */
  elbowFwd: number;
  elbowDown: number;
};

/**
 * THE GRIP THAT LETS THE APPROVED HAND SIT ON A NATURAL ARM. The mallet's head stays where the lesson has it and the
 * shaft keeps its real length (`shaft`, grip → head centre, 3-D); the grip moves round the head on that length (at
 * depth `gripZ`). For each grip the drawing's straight wrist fixes the forearm's line on the page; the elbow goes on
 * it (forearm 290 mm, the upper arm 300 mm from the lesson's shoulder, both true 3-D lengths). Of every grip that
 * reaches, the one whose forearm is nearest LEVEL, the elbow near the side (not reaching forward), the forearm
 * nearest the picture's plane. Null: none reaches.
 */
export function malletGripFor(o: { head: V3; shaft: number; gripZ: number; shoulder: V3; mirror: boolean }): MalletArmPose | null {
  const dz = o.head.z - o.gripZ;
  const Ls2 = Math.sqrt(Math.max(0, o.shaft * o.shaft - dz * dz));
  let best: { score: number; pose: MalletArmPose } | null = null;
  for (let k = -880; k <= 880; k++) {
    // (the shaft's angle, grip → head: toward the way the player faces)
    const a0 = (k / 10) * (Math.PI / 180);
    const ang = o.mirror ? Math.PI - a0 : a0;
    const grip = { x: o.head.x - Math.cos(ang) * Ls2, y: o.head.y - Math.sin(ang) * Ls2, z: o.gripZ };
    const hit = armAt(grip, o.head, o.shoulder, o.mirror);
    if (hit && (!best || hit.score < best.score)) best = hit;
  }
  return best ? best.pose : null;
}

/** The arm for the approved drawing on a GIVEN grip (the lesson's grip point): null if no arm reaches it. */
export function malletArmAt(grip: V3, head: V3, shoulder: V3, mirror: boolean): MalletArmPose | null {
  return armAt(grip, head, shoulder, mirror)?.pose ?? null;
}

function armAt(grip: V3, head: V3, S: V3, mirror: boolean): { score: number; pose: MalletArmPose } | null {
  const facing = mirror ? -1 : 1;
  const U = STICK_ARM.upper;
  const Fo = STICK_ARM.fore;
  const F = P(grip.x, grip.y);
  const ang = Math.atan2(head.y - grip.y, head.x - grip.x);
  const d = drawingAt(F, ang, mirror);
  const W = d.cuff;
  let best: { score: number; pose: MalletArmPose } | null = null;
  for (let t = Fo; t >= Fo * FORE_MIN; t -= 0.25) {
    const E = P(W.u - d.df.u * t, W.v - d.df.v * t);
    const zr = Math.sqrt(Math.max(0, Fo * Fo - t * t));
    for (const sg of [-1, 1]) {
      const Ez = grip.z + sg * zr;
      const up = Math.hypot(E.u - S.x, E.v - S.y, Ez - S.z);
      if (Math.abs(up - U) > 1) continue;
      const foreDeg = deg(Math.atan2(d.df.v, d.df.u));
      const tilt = deg(Math.atan2(Math.abs(d.df.v), Math.abs(d.df.u)));
      const fwd = (E.u - S.x) * facing;
      // (the elbow near the side: from just behind the shoulder to ≈ 15 cm in front of it; the forearm near the
      // picture's plane; the upper arm its own length)
      const score = tilt + 0.08 * Math.max(0, fwd - 150) + 0.08 * Math.max(0, -40 - fwd) + 0.02 * (Fo - t) + 0.01 * Math.abs(Ez - S.z) + 0.05 * Math.abs(up - U);
      if (!best || score < best.score)
        best = {
          score,
          pose: { grip, head, elbow: { x: E.u, y: E.v, z: Ez }, wrist: { x: W.u, y: W.v, z: grip.z }, foreDeg, tiltDeg: tilt, shaftDeg: deg(ang), upper: up, fore: Math.hypot(t, zr), elbowFwd: fwd, elbowDown: E.v - S.y },
        };
    }
  }
  return best;
}

/** Where MalletHandBack goes for a grip and a head on the page (its fulcrum on the grip, its shaft on the lesson's). */
export function malletHandAt(grip: { x: number; y: number }, head: { x: number; y: number }, mirror: boolean): { x: number; y: number; rot: number; mirror: boolean } {
  const ang = Math.atan2(head.y - grip.y, head.x - grip.x);
  return { x: grip.x, y: grip.y, rot: drawingAt(P(grip.x, grip.y), ang, mirror).rot, mirror };
}

/** Side view (u = x, v = y). `mirror`: the left hand (forearm from the right). */
export function malletSideFit(o: { fulcrum: V3; head: V3; shoulder: V3; mirror: boolean; /** (default 1.15) 1: the upper arm never longer on the page than it is */ upperSlack?: number }): MalletFit {
  const F = P(o.fulcrum.x, o.fulcrum.y);
  const H = P(o.head.x, o.head.y);
  const S = P(o.shoulder.x, o.shoulder.y);
  const ang = Math.atan2(H.v - F.v, H.u - F.u);
  const m = o.mirror ? -1 : 1;
  // (as malletHandRotFor / malletHandToPage)
  const rot = o.mirror ? ang - Math.PI + MALLET_SHAFT_TILT : ang - MALLET_SHAFT_TILT;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  const toPage = (q: Pt) => P(F.u + q.u * m * co - q.v * si, F.v + q.u * m * si + q.v * co);
  const W = toPage(MALLET_HAND_CUFF);
  const df = P(m * co, m * si);
  const need = Math.atan2(df.v, df.u);
  const upperMax = STICK_ARM.upper * (o.upperSlack ?? UPPER_SLACK);
  // the straight wrist: the elbow on the drawing's forearm line
  let elbow: Pt | null = null;
  for (let t = STICK_ARM.fore; t >= STICK_ARM.fore * FORE_MIN; t -= 2) {
    const E = P(W.u - df.u * t, W.v - df.v * t);
    if (Math.hypot(E.u - S.u, E.v - S.v) <= upperMax) {
      elbow = E;
      break;
    }
  }
  // the nearest reachable forearm direction (every elbow the two bones allow on the page)
  let best = NaN;
  let bend = Infinity;
  for (let k = 0; k < 720; k++) {
    const phi = (k * Math.PI) / 360;
    for (let t = STICK_ARM.fore; t >= STICK_ARM.fore * FORE_MIN; t -= 4) {
      const E = P(W.u - Math.cos(phi) * t, W.v - Math.sin(phi) * t);
      if (Math.hypot(E.u - S.u, E.v - S.v) > upperMax) continue;
      const b = Math.abs(wrapDeg(deg(phi - need)));
      if (b < bend) {
        bend = b;
        best = phi;
      }
    }
  }
  const fits = !!elbow || bend <= MALLET_BEND_MAX;
  const why = fits
    ? 'the forearm comes in along the drawing’s own line'
    : Number.isNaN(best)
      ? 'the drawing’s wrist lies out of the arm’s reach from this shoulder'
      : `the drawing needs the forearm at ${deg(need).toFixed(0)}°; the nearest an arm from this shoulder reaches is ${deg(best).toFixed(0)}° — a ${bend.toFixed(0)}° bend at the wrist`;
  return { fits, shaftDeg: deg(ang), needForeDeg: deg(need), bestForeDeg: deg(best), bendDeg: elbow ? 0 : bend, at: { x: F.u, y: F.v, rot, mirror: o.mirror }, cuff: W, elbow, why };
}

/* ── the arm and the side plan for the approved hand ── */

/** The re-posed arm as the players' 3-D arm: the side view and the view from above read the same elbow; the
 *  drummer's 3-D hold on the shaft is what the view from above draws (his fist from above). */
export function malletStickArm(hand: 'R' | 'L', p: MalletArmPose, shoulder: V3, out: V3): StickArm3 {
  const hold = stickHold({ hand, elbow: p.elbow, wrist: p.wrist, fulcrum: p.grip, bead: p.head });
  const n = Math.hypot(out.x, out.y, out.z) || 1;
  return { hand, shoulder, elbow: p.elbow, wrist: p.wrist, hold, reach: true, out: { x: out.x / n, y: out.y / n, z: out.z / n } };
}

/** How far the sleeve's mouth sits past the drawing's cuff rim toward the hand (mm), as the pole hands. */
const MALLET_CUFF_IN = 2;
const sideCache = new WeakMap<SidePlan, SidePlan>();

/**
 * The side view with the APPROVED MALLET HAND on the near arm (the pose's R arm, on the camera's side): the plan is
 * the players' (stickSidePlan: the head, body, legs, the far arm and its fist as they were), its near arm replaced
 * by a straight-wrist arm as the pole hands have it — the sleeve from the lesson's shoulder through the re-posed
 * elbow, laid along the drawing's own forearm line, its mouth on the drawing's cuff rim. That arm has NO hand of its
 * own: the caller draws MalletHandBack (sleeve off, the scene's scale) in the near stick's place, between the cuff's
 * far and near rims, over the lesson's own mallet.
 */
export function malletSidePlan(pose: PlayerPose, who: CastMember, o: { near: StickArm3; nearPose: MalletArmPose; far?: StickArm3 | null; nod?: number }): SidePlan {
  const base = stickSidePlan(pose, who, { near: o.near, far: o.far ?? null, ...(o.nod ? { nod: o.nod } : {}) });
  const hit = sideCache.get(base);
  if (hit) return hit;
  const p = o.nearPose;
  const E = P(p.elbow.x, p.elbow.y);
  const W = P(p.wrist.x, p.wrist.y);
  const df = unit(sub(W, E));
  const B = who.body;
  const build = B ? { one: true, k: B.shoulder, fore: B.limb } : { one: true };
  // (the forearm's tilt toward the camera, +z: whether the cuff's opening shows)
  const tilt = (p.wrist.z - p.elbow.z) / (p.fore || 1);
  const plan = (w: Pt) => armPlan(pose.shoulderR, E, w, null, false, null, tilt, null, false, build);
  const a0 = plan(W);
  const offs = dot(sub(a0.opening.e.c, W), df);
  const near = plan(add(W, mul(df, MALLET_CUFF_IN - offs)));
  const out: SidePlan = { ...base, arms: { ...base.arms, near } };
  sideCache.set(base, out);
  return out;
}

/**
 * (owner 2026-11-24 on the timpanist's left arm: "look like a broken arm") A FAR hand that shows its PALM to the
 * camera keeps the drummer's palm-side fist ('palmThumb', placed by its shaft as sidePlan places it) — but its elbow is
 * chosen so the forearm runs STRAIGHT into that fist: the side plan turns a forearm toward its drawn hand's axis, and
 * an elbow far off that axis drew the forearm as a bent banana with the wrist's bend hidden in it. Here the elbow is
 * found on the arm's own 3-D circle (upper arm 300, forearm 290 from the lesson's shoulder to the fist's wrist), below
 * the shoulder, where the forearm's line on the page meets the fist's axis — the wrist straight, the forearm as near
 * level as that allows, the elbow not reaching far forward. `drawShift`: the side plan's own shift of a standing
 * cast member's drawn elbow (sidePlan: −28 mm along the way the person faces).
 */
export function palmFistArm(o: { grip: V3; head: V3; shoulder: V3; out: V3; fwd: V3; level?: number; drawShift?: number }): { arm: StickArm3; bendDeg: number; foreDeg: number; elbowDown: number; elbowFwd: number } {
  const arm = stickArm3({ hand: 'L', fulcrum: o.grip, bead: o.head, shoulder: o.shoulder, out: o.out, fwd: o.fwd, level: o.level ?? 0.6 });
  const h = arm.hold;
  const d = h.dir;
  const Q = (k: number) => P(o.grip.x + d.x * k, o.grip.y + d.y * k);
  const sx = Math.max(0.45, Math.min(1, Math.hypot(h.sk.frame.x.x, h.sk.frame.x.y)));
  const pl = placeHand('palmThumb', P(h.poseWrist.x, h.poseWrist.y), Q(0), Q(-116), Q(290), sx);
  const hx = deg(Math.atan2(pl.ex.v, pl.ex.u));
  const W3 = { x: pl.wrist.u, y: pl.wrist.v, z: h.poseWrist.z };
  const S = o.shoulder;
  const shift = (o.drawShift ?? -28) * (o.fwd.x >= 0 ? 1 : -1);
  let best: { sc: number; E: V3; bend: number; ch: number } | null = null;
  for (let p = 0; p < 360; p += 3) {
    const pr = (p * Math.PI) / 180;
    const tb = twoBone(S, W3, { x: Math.sin(pr), y: Math.cos(pr), z: -0.3 });
    if (!tb.reach) continue;
    const E = tb.elbow;
    const ch = deg(Math.atan2(W3.y - E.y, W3.x - (E.x + shift)));
    const bend = Math.abs(wrapDeg(ch - hx));
    const below = E.y - S.y;
    const fwd = (E.x - S.x) * (o.fwd.x >= 0 ? 1 : -1);
    if (below < 120) continue;
    const sc = bend + 0.3 * Math.abs(ch) + 0.2 * Math.max(0, fwd - 200);
    if (!best || sc < best.sc) best = { sc, E, bend, ch };
  }
  if (!best) return { arm, bendDeg: NaN, foreDeg: NaN, elbowDown: arm.elbow.y - S.y, elbowFwd: arm.elbow.x - S.x };
  return { arm: { ...arm, elbow: best.E }, bendDeg: best.bend, foreDeg: best.ch, elbowDown: best.E.y - S.y, elbowFwd: (best.E.x - S.x) * (o.fwd.x >= 0 ? 1 : -1) };
}
