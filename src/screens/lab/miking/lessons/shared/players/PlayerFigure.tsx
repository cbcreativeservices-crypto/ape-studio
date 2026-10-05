/**
 * THE SHARED PLAYER — the drawing (owner art pass 2026-10-05: "the player
 * figure is crude"). A respectful, neutral, adult figure at TRUE size, drawn
 * from a PlayerPose (playerPose.ts) in the view's millimetres, at the Kick's
 * illustration standard:
 *   • body masses built as smooth silhouettes — a tailored long-sleeved shirt
 *     (collar, placket, cuffs), trousers, shoes — each limb a tapered form
 *     joined into ONE outline (path union), never tubes and circles;
 *   • light from the upper left: a gradient for form, a rim highlight on the
 *     lit edge, a darker contour; a soft contact shadow where it rests;
 *   • the head in the house LINE-ART spec (reference_head_icon_spec): one
 *     uniform stroke, bald, brows, nose and mouth, ears, NO eyes; seen from
 *     above, the cranium, the ears and the nose's tip;
 *   • hands with fingers: a picking hand round a pick, a fretting hand's
 *     fingers arched over the board onto the strings (thumb behind the
 *     neck), a hand resting on a steel bar;
 *   • a muted palette (neighbours recede, charter §6): nothing competes with
 *     the instrument, the zones or the mic.
 *
 * TWO LAYERS, so the instrument sits between them:
 *   <PlayerBehind/>   legs, torso, head, the arm that passes behind the neck;
 *   <PlayerInFront/>  the arm over the body and the hands on the strings.
 * Nothing moves (D8). Paths are built once per pose (cached by the pose
 * object) — the pose comes from the instrument's model, so the hands stay
 * inside the keep-outs the mic is stopped by.
 *
 * API (for any string lesson): build a PlayerPose (see guitars/
 * guitarPlayer.ts for the guitars), then
 *   <PlayerBehind pose={pose} />  …the instrument…  <PlayerInFront pose={pose} />
 */
import { BlurMask, Circle, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { BODY, dist, lerp, pt, type Hand, type PlayerPose, type Pt } from './playerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/* ── palette: muted, cool-neutral; light from the upper left ── */
const SHIRT = ['#5d687e', '#465064', '#2f3645'];
const SHIRT_RIM = '#9aa6bd';
const SHIRT_EDGE = '#171a21';
const SHIRT_LINE = '#252a35';
const TROUSER = ['#41454f', '#2d3038', '#1b1d22'];
const TROUSER_RIM = '#767c89';
/** Skin: a neutral lay-figure grey (no complexion is implied). */
const SKIN = ['#8a8f98', '#6e737c', '#52565e'];
const SKIN_RIM = '#b3b8c1';
const SKIN_EDGE = '#24272d';
const SHOE = ['#34353b', '#18191d', '#0b0b0d'];
/** The line-art head (house spec): a light neutral stroke. */
const HEAD_LINE = '#cfd4dc';
const HEAD_FILL = 'rgba(16,18,23,0.8)';
const CHROME = ['#f2f4f8', '#b9bec8', '#6b707b', '#d4d8df'];
const PICK = ['#7a3a1a', '#4a200c'];

/* ── geometry helpers (build time only) ── */

/** A tapered limb: the hull of two circles (a, ra) and (b, rb). */
function capsule(a: Pt, b: Pt, ra: number, rb: number): SkPath {
  const p = make();
  const d = dist(a, b);
  if (d <= Math.abs(ra - rb) + 0.5) {
    const big = ra >= rb ? { c: a, r: ra } : { c: b, r: rb };
    p.addCircle(big.c.u, big.c.v, big.r);
    return p;
  }
  const th = Math.atan2(b.v - a.v, b.u - a.u);
  const ph = Math.acos((ra - rb) / d);
  const deg = 180 / Math.PI;
  const P = (c: Pt, r: number, ang: number) => [c.u + r * Math.cos(ang), c.v + r * Math.sin(ang)] as const;
  const a1 = P(a, ra, th + ph);
  const b1 = P(b, rb, th + ph);
  const a2 = P(a, ra, th - ph);
  p.moveTo(a1[0], a1[1]);
  p.lineTo(b1[0], b1[1]);
  p.arcToOval(Skia.XYWHRect(b.u - rb, b.v - rb, rb * 2, rb * 2), (th + ph) * deg, -2 * ph * deg, false);
  p.lineTo(a2[0], a2[1]);
  p.arcToOval(Skia.XYWHRect(a.u - ra, a.v - ra, ra * 2, ra * 2), (th - ph) * deg, -(360 - 2 * ph * deg), false);
  p.close();
  return p;
}

/** A chain of tapered segments through joints with radii, as one outline. */
function limb(pts: Pt[], rs: number[]): SkPath {
  let out: SkPath | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = capsule(pts[i], pts[i + 1], rs[i], rs[i + 1]);
    out = out ? Skia.Path.MakeFromOp(out, c, PathOp.Union) ?? out : c;
  }
  return out ?? make();
}

function union(...ps: (SkPath | null)[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) {
    if (!p) continue;
    out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  }
  return out ?? make();
}

/** A smooth closed outline through points (Catmull-Rom as cubics). */
function smooth(points: Pt[], tension = 0.5): SkPath {
  const p = make();
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0].u, points[0].v);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    p.cubicTo(p1.u + (p2.u - p0.u) * k, p1.v + (p2.v - p0.v) * k, p2.u - (p3.u - p1.u) * k, p2.v - (p3.v - p1.v) * k, p2.u, p2.v);
  }
  p.close();
  return p;
}

/** An open smooth stroke through points. */
function curve(points: Pt[]): SkPath {
  const p = make();
  p.moveTo(points[0].u, points[0].v);
  if (points.length === 2) {
    p.lineTo(points[1].u, points[1].v);
    return p;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const m = i === points.length - 2 ? points[i + 1] : lerp(points[i], points[i + 1], 0.5);
    p.quadTo(points[i].u, points[i].v, m.u, m.v);
  }
  return p;
}

/** A point in a hand's own frame (x along the hand from the wrist, y across). */
const local = (h: Hand) => {
  const c = Math.cos(h.dir);
  const s = Math.sin(h.dir);
  return (x: number, y: number): Pt => pt(h.wrist.u + x * c - y * s, h.wrist.v + x * s + y * c);
};

/* ── the parts ── */

type Mass = { path: SkPath; ramp: string[]; rim: string; edge: string; box: { u0: number; v0: number; u1: number; v1: number } };
const boxOf = (p: SkPath) => {
  const b = p.getBounds();
  return { u0: b.x, v0: b.y, u1: b.x + b.width, v1: b.y + b.height };
};
const mass = (path: SkPath, ramp: string[], rim: string, edge = SHIRT_EDGE): Mass => ({ path, ramp, rim, edge, box: boxOf(path) });

type Built = {
  behind: Mass[];
  front: Mass[];
  shoes: SkPath[];
  shirtLines: SkPath;
  shirtLinesFront: SkPath;
  buttons: Pt[];
  head: { line: SkPath; fill: SkPath };
  bars: { path: SkPath; box: { u0: number; v0: number; u1: number; v1: number } }[];
  pick: SkPath | null;
  shadow: SkPath | null;
  strap: SkPath | null;
};

/** The front-view head (house line-art spec), centred on c, height ≈ 2r. */
function headFront(c: Pt, r: number, neckV: number): { line: SkPath; fill: SkPath } {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const right = [P(0, -118), P(52, -108), P(77, -70), P(81, -26), P(77, 8), P(71, 42), P(58, 75), P(34, 99), P(0, 108)];
  const outline = [...right, ...right.slice(1, -1).reverse().map((q) => pt(2 * c.u - q.u, q.v))];
  const skull = smooth(outline, 0.55);
  const line = make();
  line.addPath(skull);
  // The neck: a thick, squared column from the jaw to the collar.
  const nb = (neckV - c.v) / k;
  line.addPath(curve([P(-44, 82), P(-47, nb * 0.6), P(-52, nb)]));
  line.addPath(curve([P(44, 82), P(47, nb * 0.6), P(52, nb)]));
  // Ears: an outer helix and a small inner fold, each side.
  for (const s of [-1, 1]) {
    line.addPath(curve([P(s * 78, -6), P(s * 94, -4), P(s * 95, 22), P(s * 86, 44), P(s * 74, 46)]));
    line.addPath(curve([P(s * 84, 6), P(s * 88, 20), P(s * 82, 30)]));
    // Brows.
    line.addPath(curve([P(s * 14, -16), P(s * 30, -24), P(s * 50, -16)]));
    // Nose: a bridge line each side to a small nostril curl.
    line.addPath(curve([P(s * 7, -6), P(s * 9, 18), P(s * 11, 30)]));
    line.addPath(curve([P(s * 4, 38), P(s * 13, 38), P(s * 15, 31)]));
  }
  // Mouth: two strokes.
  line.addPath(curve([P(-22, 60), P(0, 56), P(22, 60)]));
  line.addPath(curve([P(-11, 69), P(0, 73), P(11, 69)]));
  const fill = union(skull, capsule(P(0, 80), P(0, nb - 6), 46 * k, 50 * k));
  return { line, fill };
}

/** The head from above: the cranium, the ears, the nose's tip toward +v. */
function headAbove(c: Pt, r: number): { line: SkPath; fill: SkPath } {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const skull = smooth([P(0, -98), P(62, -80), P(80, -10), P(70, 60), P(36, 92), P(0, 98), P(-36, 92), P(-70, 60), P(-80, -10), P(-62, -80)], 0.55);
  const line = make();
  line.addPath(skull);
  for (const s of [-1, 1]) line.addPath(curve([P(s * 78, -14), P(s * 94, 0), P(s * 92, 22), P(s * 76, 30)]));
  line.addPath(curve([P(-12, 92), P(0, 114), P(12, 92)]));
  return { line, fill: skull };
}

/** A hand (in its own frame), as one outline; `pick` adds a pick's tip. */
function handPath(h: Hand): { path: SkPath; pick: SkPath | null; bar: SkPath | null; thumbBehind: SkPath | null } {
  const L = local(h);
  const W = BODY.handW / 2;
  if (h.kind === 'pick') {
    // A loose fist: the palm, the curled fingers' knuckles, the thumb along
    // the top holding the pick against the side of the index finger.
    const palm = smooth([L(0, -W * 0.72), L(60, -W * 0.95), L(98, -W * 0.82), L(112, -W * 0.2), L(108, W * 0.55), L(82, W * 0.92), L(36, W * 0.86), L(0, W * 0.7)], 0.6);
    const knuckles = [-0.62, -0.2, 0.22, 0.6].map((y, i) => capsule(L(96 - i * 3, y * W), L(118 - i * 6, y * W * 1.02), 13, 12));
    const thumb = capsule(L(38, -W * 0.9), L(104, -W * 0.98), 15, 12);
    const tip = L(122, -W * 1.08);
    const pick = make();
    const a = L(110, -W * 1.2);
    const b = L(114, -W * 0.76);
    pick.moveTo(a.u, a.v);
    pick.lineTo(b.u, b.v);
    pick.lineTo(tip.u + Math.cos(h.dir) * 14, tip.v + Math.sin(h.dir) * 14);
    pick.close();
    return { path: union(palm, thumb, ...knuckles), pick, bar: null, thumbBehind: null };
  }
  if (h.kind === 'fret' && h.board) {
    // The back of the hand below the neck, the fingers arching over the
    // board's edge onto the strings just behind four frets; the thumb's tip
    // shows over the top edge (it is behind the neck).
    const bd = h.board;
    const lowEdge = bd.v + bd.half;
    const tips = bd.tips;
    // Fingertips on the strings (index on a middle string, the others
    // spread across), each finger curled: knuckle below the board's edge, the
    // middle joint over the edge, the tip down onto its string.
    const tipVs = [-0.3, 0.05, 0.32, -0.08].map((t) => bd.v + t * bd.half);
    const knuckleV = lowEdge + 16;
    const lo = Math.min(...tips);
    const hi = Math.max(...tips);
    const palm = smooth(
      [
        pt(h.wrist.u - 34, h.wrist.v + 4),
        pt(lo - 6, knuckleV + 30),
        pt(lo - 2, knuckleV + 2),
        pt((lo + hi) / 2, knuckleV - 6),
        pt(hi + 4, knuckleV),
        pt(hi + 14, knuckleV + 26),
        pt(h.wrist.u + 30, h.wrist.v - 2),
      ],
      0.55,
    );
    const fingers = tips.map((tu, i) => {
      const ku = tu + 4 + (i - 1.5) * 1.5;
      const k = pt(ku, knuckleV);
      const mid = pt(tu + 3, lowEdge + 1);
      const tip = pt(tu, tipVs[i]);
      const r = i === 3 ? 6.4 : 7.4;
      return limb([k, mid, tip], [r + 1.6, r + 0.4, r - 0.8]);
    });
    const tu = (tips[0] + tips[1]) / 2 + 10;
    const thumb = capsule(pt(tu - 8, bd.v - bd.half + 6), pt(tu + 6, bd.v - bd.half - 14), 11, 10);
    return { path: union(palm, ...fingers), pick: null, bar: null, thumbBehind: thumb };
  }
  if (h.kind === 'bar' && h.board) {
    // A steel bar across the strings, the hand resting over it, the fingers
    // curled down in front.
    const bu = h.board.tips[0];
    const bv = h.board.v;
    const bar = h.board.half > 20 ? capsule(pt(bu, bv - h.board.half), pt(bu, bv + h.board.half), 11, 11) : (() => {
      const p = make();
      p.addCircle(bu, bv, h.board.half);
      return p;
    })();
    const centre = h.board.half > 20 ? pt(bu + 8, bv - 2) : pt(bu, bv - 34);
    const palm = limb([h.wrist, lerp(h.wrist, centre, 0.55), centre], [31, 38, 36]);
    const fingersEnd = h.board.half > 20 ? pt(bu + 48, bv + 24) : pt(bu + 34, bv + 6);
    const fingers = limb([pt(centre.u + 18, centre.v - 6), fingersEnd], [17, 13]);
    return { path: union(palm, fingers), pick: null, bar, thumbBehind: null };
  }
  // 'above' / 'rest': the hand seen from its back, fingers together.
  const palm = smooth([L(0, -W * 0.62), L(70, -W * 0.92), L(118, -W * 0.7), L(150, -W * 0.25), L(152, W * 0.28), L(122, W * 0.72), L(66, W * 0.9), L(0, W * 0.64)], 0.6);
  const thumb = capsule(L(30, -W * 0.8), L(82, -W * 1.18), 15, 12);
  return { path: union(palm, thumb), pick: null, bar: null, thumbBehind: null };
}

function buildFront(pose: PlayerPose): Built {
  const n = pose.neck;
  const sR = pose.shoulderR;
  const sL = pose.shoulderL;
  const hipV = (pose.hipR.v + pose.hipL.v) / 2;
  const waistV = n.v + (hipV - n.v) * 0.68;
  // The shirt's body: shoulders sloping from the collar, rounded deltoids,
  // a chest tapering to the waist, the hem over the hips.
  const torso = smooth(
    [
      pt(n.u - 50, n.v - 6),
      pt(sR.u + 40, sR.v - 24),
      pt(sR.u - 26, sR.v + 8),
      pt(sR.u - 34, sR.v + 70),
      pt(sR.u + 14, sR.v + 170),
      pt(n.u - BODY.waistHalf, waistV),
      pt(pose.hipR.u - 62, hipV + 8),
      pt(n.u, hipV + 30),
      pt(pose.hipL.u + 62, hipV + 8),
      pt(n.u + BODY.waistHalf, waistV),
      pt(sL.u - 14, sL.v + 170),
      pt(sL.u + 34, sL.v + 70),
      pt(sL.u + 26, sL.v + 8),
      pt(sL.u - 40, sL.v - 24),
      pt(n.u + 50, n.v - 6),
      pt(n.u, n.v + 14),
    ],
    0.5,
  );
  // The fretting arm (behind the neck): upper arm and forearm, one sleeve.
  const armL = limb([sL, pose.elbowL, pose.handL.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  // The picking arm (over the body).
  const armR = limb([pt(sR.u + 6, sR.v + 6), pose.elbowR, pose.handR.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  // Legs: thighs toward the viewer (seated: the lap and the knees), shins
  // down to the shoes.
  const seated = pose.posture !== 'standing';
  const ankle = (f: Pt) => pt(f.u, f.v - 74);
  const legR = seated ? limb([pose.hipR, pose.kneeR, ankle(pose.footR)], [BODY.thighR, BODY.kneeR, BODY.ankleR]) : limb([pose.hipR, pose.kneeR, ankle(pose.footR)], [BODY.thighR, BODY.kneeR - 4, BODY.ankleR]);
  const legL = seated ? limb([pose.hipL, pose.kneeL, ankle(pose.footL)], [BODY.thighR, BODY.kneeR, BODY.ankleR]) : limb([pose.hipL, pose.kneeL, ankle(pose.footL)], [BODY.thighR, BODY.kneeR - 4, BODY.ankleR]);
  const pelvis = smooth([pt(pose.hipR.u - 70, hipV - 40), pt(pose.hipL.u + 70, hipV - 40), pt(pose.hipL.u + 74, hipV + 30), pt(n.u, hipV + 56), pt(pose.hipR.u - 74, hipV + 30)], 0.5);
  const trousers = union(pelvis, legR, legL);
  const shoes = [pose.footR, pose.footL].map((f, i) => {
    const s = i === 0 ? -1 : 1;
    return smooth([pt(f.u - 52, f.v - 4), pt(f.u - 46, f.v - 62), pt(f.u, f.v - 80), pt(f.u + 46, f.v - 62), pt(f.u + 54 + s * 6, f.v - 4)], 0.45);
  });
  // Shirt details: the collar, the placket and its buttons, the cuffs.
  const lines = make();
  lines.addPath(curve([pt(n.u - 50, n.v - 6), pt(n.u - 20, n.v + 30), pt(n.u, n.v + 44)]));
  lines.addPath(curve([pt(n.u + 50, n.v - 6), pt(n.u + 20, n.v + 30), pt(n.u, n.v + 44)]));
  lines.addPath(curve([pt(n.u, n.v + 44), pt(n.u + 2, waistV), pt(n.u, hipV + 24)]));
  const buttons = [0.22, 0.5, 0.78].map((t) => pt(n.u + 7, n.v + 60 + (hipV - n.v - 60) * t));
  const cuff = (w: Pt, e: Pt) => {
    const t = 40 / Math.max(40, dist(w, e));
    const c = lerp(w, e, t);
    const a = Math.atan2(e.v - w.v, e.u - w.u) + Math.PI / 2;
    const r = BODY.wristR + 6;
    return curve([pt(c.u - Math.cos(a) * r, c.v - Math.sin(a) * r), pt(c.u + Math.cos(a) * r, c.v + Math.sin(a) * r)]);
  };
  lines.addPath(cuff(pose.handL.wrist, pose.elbowL));
  const linesFront = make();
  linesFront.addPath(cuff(pose.handR.wrist, pose.elbowR));
  // A crease at the inside of each elbow.
  linesFront.addPath(curve([lerp(pose.elbowR, pose.handR.wrist, 0.08), lerp(pose.elbowR, pt(sR.u, sR.v), 0.12)]));
  const head = headFront(pose.head.c, pose.head.r, n.v);
  const hR = handPath(pose.handR);
  const hL = handPath(pose.handL);
  const behind: Mass[] = [mass(trousers, TROUSER, TROUSER_RIM), mass(torso, SHIRT, SHIRT_RIM), mass(armL, SHIRT, SHIRT_RIM)];
  if (hL.thumbBehind) behind.push(mass(hL.thumbBehind, SKIN, SKIN_RIM, SKIN_EDGE));
  const front: Mass[] = [mass(armR, SHIRT, SHIRT_RIM), mass(hR.path, SKIN, SKIN_RIM, SKIN_EDGE), mass(hL.path, SKIN, SKIN_RIM, SKIN_EDGE)];
  const bars = [hR.bar, hL.bar].filter((b): b is SkPath => !!b).map((b) => ({ path: b, box: boxOf(b) }));
  // A standing player's strap: from behind the left shoulder down across the
  // chest to the strap button by the neck.
  let strap: SkPath | null = null;
  if (pose.strapTo) {
    const a = pt(sL.u - 46, sL.v - 18);
    const b = pose.strapTo;
    const m = pt((a.u + b.u) / 2 + 26, (a.v + b.v) / 2);
    strap = make();
    const s1 = curve([a, m, b]);
    strap.addPath(s1);
  }
  // A soft shadow under the seated player (the chair is not drawn).
  const shadow = pose.floor !== null ? (() => {
    const p = make();
    p.addOval(Skia.XYWHRect(n.u - 300, pose.floor! - 22, 600, 44));
    return p;
  })() : null;
  return { behind, front, shoes, shirtLines: lines, shirtLinesFront: linesFront, buttons, head, bars, pick: hR.pick, shadow, strap };
}

function buildAbove(pose: PlayerPose): Built {
  const n = pose.neck;
  const sR = pose.shoulderR;
  const sL = pose.shoulderL;
  // The shoulders and back from above: a broad rounded girdle, the chest
  // forward (+v), the shoulder blades behind.
  const torso = smooth(
    [
      pt(sR.u - 40, sR.v - 6),
      pt(sR.u - 10, sR.v - 62),
      pt(n.u - 90, n.v - 112),
      pt(n.u + 90, n.v - 112),
      pt(sL.u + 10, sL.v - 62),
      pt(sL.u + 40, sL.v - 6),
      pt(sL.u + 4, sL.v + 56),
      pt(n.u + 120, n.v + 108),
      pt(n.u, n.v + 122),
      pt(n.u - 120, n.v + 108),
      pt(sR.u - 4, sR.v + 56),
    ],
    0.5,
  );
  const armL = limb([sL, pose.elbowL, pose.handL.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  const armR = limb([pt(sR.u + 8, sR.v + 10), pose.elbowR, pose.handR.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  const seated = pose.posture !== 'standing';
  const thighs = seated ? union(limb([pose.hipR, pose.kneeR], [BODY.thighR, BODY.kneeR + 2]), limb([pose.hipL, pose.kneeL], [BODY.thighR, BODY.kneeR + 2])) : null;
  const shoes = [pose.footR, pose.footL].map((f) => smooth([pt(f.u - 44, f.v - 150), pt(f.u + 44, f.v - 150), pt(f.u + 50, f.v - 40), pt(f.u + 30, f.v + 14), pt(f.u - 30, f.v + 14), pt(f.u - 50, f.v - 40)], 0.5));
  const head = headAbove(pose.head.c, pose.head.r);
  const hR = handPath(pose.handR);
  const hL = handPath(pose.handL);
  const behind: Mass[] = [];
  if (thighs) behind.push(mass(thighs, TROUSER, TROUSER_RIM));
  behind.push(mass(torso, SHIRT, SHIRT_RIM), mass(armL, SHIRT, SHIRT_RIM));
  const front: Mass[] = [mass(armR, SHIRT, SHIRT_RIM), mass(hR.path, SKIN, SKIN_RIM, SKIN_EDGE), mass(hL.path, SKIN, SKIN_RIM, SKIN_EDGE)];
  const bars = [hR.bar, hL.bar].filter((b): b is SkPath => !!b).map((b) => ({ path: b, box: boxOf(b) }));
  const lines = make();
  // The collar seen from above, round the base of the neck.
  lines.addPath(curve([pt(n.u - 70, n.v - 10), pt(n.u, n.v + 34), pt(n.u + 70, n.v - 10)]));
  return { behind, front, shoes: seated ? [] : shoes, shirtLines: lines, shirtLinesFront: make(), buttons: [], head, bars, pick: null, shadow: null, strap: null };
}

const cache = new WeakMap<PlayerPose, Built>();
function built(pose: PlayerPose): Built {
  let b = cache.get(pose);
  if (!b) {
    b = pose.view === 'front' ? buildFront(pose) : buildAbove(pose);
    cache.set(pose, b);
  }
  return b;
}

/** One body mass: form gradient, a rim light on the upper-left edge, contour. */
function MassArt({ m }: { m: Mass }) {
  const { u0, v0, u1, v1 } = m.box;
  return (
    <Group>
      <Path path={m.path}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={m.ramp} />
      </Path>
      <Group clip={m.path}>
        <Path path={m.path} style="stroke" strokeWidth={9} opacity={0.5}>
          <LinearGradient start={vec(u0, v0)} end={vec(u0 + (u1 - u0) * 0.55, v0 + (v1 - v0) * 0.55)} colors={[m.rim, 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
      <Path path={m.path} style="stroke" strokeWidth={2.4} color={m.edge} opacity={0.9} />
    </Group>
  );
}

function Bar({ b }: { b: Built['bars'][number] }) {
  return (
    <Group>
      <Path path={b.path}>
        <LinearGradient start={vec(b.box.u0, b.box.v0)} end={vec(b.box.u1, b.box.v1)} colors={CHROME} />
      </Path>
      <Path path={b.path} style="stroke" strokeWidth={1.4} color="#5d626d" />
    </Group>
  );
}

/** The player BEHIND the instrument: legs, torso, head, the far arm. */
export function PlayerBehind({ pose, dim = 1 }: { pose: PlayerPose; dim?: number }) {
  const b = built(pose);
  return (
    <Group opacity={dim}>
      {b.shadow ? (
        <Path path={b.shadow} color="#000" opacity={0.45}>
          <BlurMask blur={14} style="normal" />
        </Path>
      ) : null}
      {b.shoes.map((s, i) => (
        <Group key={`shoe${i}`}>
          <Path path={s}>
            <LinearGradient start={vec(s.getBounds().x, s.getBounds().y)} end={vec(s.getBounds().x + s.getBounds().width, s.getBounds().y + s.getBounds().height)} colors={SHOE} />
          </Path>
          <Path path={s} style="stroke" strokeWidth={2} color="#55585f" opacity={0.7} />
        </Group>
      ))}
      {b.behind.map((m, i) => (
        <MassArt key={`b${i}`} m={m} />
      ))}
      <Path path={b.shirtLines} style="stroke" strokeWidth={2.2} strokeCap="round" color={SHIRT_LINE} opacity={0.9} />
      {b.buttons.map((q, i) => (
        <Circle key={`btn${i}`} cx={q.u} cy={q.v} r={4} color="#8d97aa" opacity={0.8} />
      ))}
      {b.strap ? (
        <>
          <Path path={b.strap} style="stroke" strokeWidth={46} strokeCap="round" color="#141519" opacity={0.95} />
          <Path path={b.strap} style="stroke" strokeWidth={40} strokeCap="round">
            <LinearGradient start={vec(pose.shoulderL.u - 60, pose.shoulderL.v)} end={vec(pose.shoulderL.u + 60, pose.shoulderL.v + 200)} colors={['#5a3a22', '#3c2615', '#24170c']} />
          </Path>
        </>
      ) : null}
      {/* the head: line art over a quiet translucent interior */}
      <Path path={b.head.fill} color={HEAD_FILL} />
      <Path path={b.head.fill}>
        <RadialGradient c={vec(pose.head.c.u - pose.head.r * 0.4, pose.head.c.v - pose.head.r * 0.5)} r={pose.head.r * 1.4} colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']} />
      </Path>
      <Path path={b.head.line} style="stroke" strokeWidth={4.2} strokeCap="round" strokeJoin="round" color={HEAD_LINE} opacity={0.82} />
    </Group>
  );
}

/** The player IN FRONT of the instrument: the near arm and both hands. */
export function PlayerInFront({ pose, dim = 1 }: { pose: PlayerPose; dim?: number }) {
  const b = built(pose);
  return (
    <Group opacity={dim}>
      {b.bars.map((q, i) => (
        <Bar key={`bar${i}`} b={q} />
      ))}
      {b.front.map((m, i) => (
        <Group key={`f${i}`}>
          {i === 0 ? (
            // The near arm's soft shadow on the instrument under it.
            <Path path={m.path} color="#000" opacity={0.35} transform={[{ translateX: 8 }, { translateY: 12 }]}>
              <BlurMask blur={12} style="normal" />
            </Path>
          ) : null}
          <MassArt m={m} />
        </Group>
      ))}
      <Path path={b.shirtLinesFront} style="stroke" strokeWidth={2.2} strokeCap="round" color={SHIRT_LINE} opacity={0.9} />
      {b.pick ? (
        <Path path={b.pick}>
          <LinearGradient start={vec(b.pick.getBounds().x, b.pick.getBounds().y)} end={vec(b.pick.getBounds().x + 20, b.pick.getBounds().y + 20)} colors={PICK} />
        </Path>
      ) : null}
    </Group>
  );
}
