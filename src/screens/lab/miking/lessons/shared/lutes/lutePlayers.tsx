/**
 * The PLAYER round a lute, as a muted figure (charter §6: neighbours recede)
 * — the house line-art bald head (reference_head_icon_spec), the torso, the
 * arms and hands, the legs: on a chair for the oud, cross-legged on the floor
 * for the sitar and the veena. Drawn from the scene's fit (luteModel.ts), the
 * same numbers the keep-outs are built from. Nothing moves (D8).
 *
 * The LOOK is the shared player's (players/PlayerFigure, clarity pass
 * 2026-10-05): every body mass painted with FigureMass (form gradient, lit rim,
 * core shadow, contour), the hands with fingers (handShape), the head as one
 * more skin mass (FigureHead) — so a lute player reads like the guitar family's players.
 * The geometry below is unchanged: the same joints, the same widths.
 */
import { BlurMask, Group, Line, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { ViewId } from '../../../engine/model/types.ts';
import { bowlPoints, type LuteFit, type LuteScene } from './luteModel.ts';
import { curve, DEG, ep, make, PAL, rr, type Pt, type SkPath } from './luteDraw';
import { FIGURE_TONES, FigureMass, handShape, FigureHead, headAbove, headFront, intoCollar, limb as limbPath, SLEEVE, splitArm, type GarmentBox, type HeadPaths } from '../players/PlayerFigure';

/** The figure's own head (FigureHead: one skin mass, the same look as the
 *  body). Front: facing the audience, its neck down to `neckY` (default just
 *  below the jaw). Above: the cranium, the ears and the nose's tip toward +v. */
export function Head({ cx, cy, r, above = false, neckY }: { cx: number; cy: number; r: number; above?: boolean; neckY?: number }) {
  const head = useMemo(() => (above ? headAbove({ u: cx, v: cy }, r) : headFront({ u: cx, v: cy }, r, neckY ?? cy + r * 1.35)), [cx, cy, r, above, neckY]);
  return <FigureHead fill={head.fill} />;
}

/** An arm (a sleeve) through joints, `w` wide: one tapered outline. */
export function Limb({ pts, w }: { pts: Pt[]; w: number }) {
  const path = useMemo(() => limbPath(pts.map(([u, v]) => ({ u, v })), pts.map((_, i) => (w / 2) * (1 - (0.18 * i) / Math.max(1, pts.length - 1)))), [pts, w]);
  return <FigureMass path={path} tone="shirt" />;
}

/** A hand seen from its back, the fingers together, pointing `rot`°. */
export function Hand({ x, y, r, rot = 0, fore }: { x: number; y: number; r: number; rot?: number; /** The forearm's direction in the view (rad): the wrist leaves its cuff. */ fore?: number }) {
  const h = useMemo(() => {
    const dir = rot * DEG;
    // The shared hand is true size (about 15 cm long): scaled to this
    // figure's hand radius so the drawing's proportions are kept.
    const k = r / 40;
    const hs = handShape({ wrist: { u: -70, v: 0 }, dir: 0, kind: 'rest' }, fore === undefined ? undefined : fore - dir);
    return { hs, k, dir };
  }, [r, rot, fore]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: h.dir }, { scale: h.k }]}>
      <FigureMass path={h.hs.path} tone="skin" contour={2} />
      <Path path={h.hs.lines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} />
    </Group>
  );
}

/** Fingers laid across a neck at `at` (view coords), the neck running along `dir`. */
export function Fingers({ at, dir, across, n = 3 }: { at: Pt; dir: Pt; across: number; n?: number }) {
  const l = Math.hypot(dir[0], dir[1]) || 1;
  const d: Pt = [dir[0] / l, dir[1] / l];
  const a = Math.atan2(d[1], d[0]);
  const p = useMemo(() => {
    let out: SkPath | null = null;
    for (let k = 0; k < n; k++) {
      const f = limbPath(
        [
          { u: -k * 24, v: across / 2 },
          { u: -k * 24 - 2, v: 0 },
          { u: -k * 24, v: -across / 2 },
        ],
        [8.5, 8, 7],
      );
      out = out ? Skia.Path.MakeFromOp(out, f, PathOp.Union) ?? out : f;
    }
    return out ?? make();
  }, [n, across]);
  return (
    <Group transform={[{ translateX: at[0] }, { translateY: at[1] }, { rotate: a }]}>
      <FigureMass path={p} tone="skin" contour={1.8} />
    </Group>
  );
}

/* ═══════════════════════ the body (figure pass 2, 2026-10-15) ═══════════════════════ */

/*
 * THE LUTE PLAYER'S BODY, built at the house figure standard (PlayerFigure's
 * buildFront / buildAbove shaping) on the scene's joints (luteModel.ts fit —
 * nothing there moves):
 *   • ONE SHIRT (owner 2026-10-15: "shoulder transitions from shirt sleeves to
 *     the shirt body look very unnatural … plug and position interchangeable
 *     limbs"): the body — the trapezius sloping from the neck to the point of
 *     the shoulder, the chest, the waist, tucked in at the belt — and both
 *     sleeves shaded in one light (FigureMass `box`); each sleeve grows out of
 *     its deltoid with no line inside the shoulder (`quiet`), and where it lies
 *     over the shirt body its edge is a soft fold (`soft`), never an outline.
 *   • The neck goes INTO the collar (intoCollar).
 *   • The arms are the shared anatomical arm (armPath, SLEEVE widths): the
 *     upper arm, the elbow's point and crook, the forearm's swell, the cuff,
 *     the bare wrist — the upper arm painted behind the instrument, the
 *     forearm over it (the same outline clipped at the elbow: no seam).
 *   • ONE TROUSER MASS: on a chair (oud) the pelvis, both thighs coming toward
 *     the viewer to the knees, the shins down to the shoes; cross-legged on the
 *     floor (sitar, veena) the pelvis, both thighs out to the knees and the
 *     shins crossing in front of the body, the near shin drawn over the far
 *     one, the near bare foot lying on the floor under the far knee (the
 *     sitar's under the gourd, which rests on its sole), the far foot tucked
 *     behind. No knee ovals.
 */

export type LuteArmOpts = { fretDir: Pt; across: number; pluckRot: number };
const UPPER_ARM = 310; // shoulder joint → elbow, an adult (mm)

type V3 = { x: number; y: number; z: number };
const P = (q: Pt) => ({ u: q[0], v: q[1] });
const disc = (c: Pt, r: number): SkPath => {
  const p = make();
  p.addCircle(c[0], c[1], r);
  return p;
};
const rect = (x0: number, y0: number, x1: number, y1: number): SkPath => {
  const p = make();
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
};
function U(...ps: (SkPath | null | undefined)[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) {
    if (!p) continue;
    out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  }
  return out ?? make();
}
const I = (a: SkPath, b: SkPath): SkPath => Skia.Path.MakeFromOp(a, b, PathOp.Intersect) ?? make();
const Dif = (a: SkPath, b: SkPath): SkPath => Skia.Path.MakeFromOp(a, b, PathOp.Difference) ?? a;
/** A smooth closed outline (Catmull-Rom as cubics: the figure's own curve). */
function cr(points: Pt[], tension = 0.5): SkPath {
  const p = make();
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  p.close();
  return p;
}
function boxOf(...ps: SkPath[]): GarmentBox {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of ps) {
    const r = p.getBounds();
    if (r.width <= 0 && r.height <= 0) continue;
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.width);
    y1 = Math.max(y1, r.y + r.height);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** The pluck hand's wrist in the view (the Hand's wrist at −70 mm along it). */
function pluckWrist(pH: Pt, rot: number): Pt {
  const a = rot * DEG;
  return [pH[0] - 70 * Math.cos(a), pH[1] - 70 * Math.sin(a)];
}

/**
 * The fretting arm's DRAWN elbow (a pure drawing value: the fretting elbow
 * feeds no keep-out or solid; the plan's footprint already spans it). The
 * oud's fit put it 484 mm from the shoulder — an upper arm half as long again
 * as an adult's, the elbow hanging at the hip with the forearm folded back up
 * to the neck. Drawn instead as an oud player holds it: the elbow a little out
 * from the side and forward of the shoulder, an adult upper arm's length
 * (≈ 310 mm) from it, the forearm rising from there under the neck.
 */
function fretElbow(f: LuteFit): V3 {
  const s = f.shoulderL;
  const e = f.elbowL;
  if (Math.hypot(e.x - s.x, e.y - s.y, e.z - s.z) <= UPPER_ARM * 1.12) return e;
  const dx = 140;
  const dz = 140;
  return { x: s.x + dx, y: s.y + Math.sqrt(UPPER_ARM * UPPER_ARM - dx * dx - dz * dz), z: s.z + dz };
}

/** The hips and the cross-legged ankles (drawing values, engine frame). */
function lowerBody(sc: LuteScene) {
  const f = sc.fit;
  const hz = f.head.c.z + 70;
  const hipR: V3 = { x: f.head.c.x - 112, y: f.hipY, z: hz };
  const hipL: V3 = { x: f.head.c.x + 112, y: f.hipY, z: hz };
  if (f.seat === 'chair') return { hipR, hipL, near: null };
  if (sc.kind === 'sitar') {
    // The LEFT shin in front, its foot sole-up under the gourd's lowest point
    // (the gourd rests on it: the floor is that foot below the gourd); the
    // right foot tucked behind it, under the left thigh.
    const g = sc.sitar!.gourd;
    const lo = bowlPoints(g.cx, g.a, g.c, g.zc, 0, 10)
      .map((p) => sc.posture.P(p))
      .reduce((a, b) => (b.y > a.y ? b : a));
    const near: V3 = { x: lo.x + 110, y: sc.floorY - 34, z: lo.z };
    const far: V3 = { x: f.kneeL.x - 310, y: sc.floorY - 44, z: lo.z - 70 };
    return { hipR, hipL, near: { side: 'L' as const, ankle: near, farAnkle: far } };
  }
  // The veena: the RIGHT shin in front (the resonator stands on the floor at
  // the right), its foot under the left knee; the left foot tucked behind.
  const near: V3 = { x: f.kneeL.x - 200, y: sc.floorY - 36, z: f.kneeR.z - 90 };
  const far: V3 = { x: f.kneeR.x + 200, y: sc.floorY - 44, z: f.kneeR.z - 160 };
  return { hipR, hipL, near: { side: 'R' as const, ankle: near, farAnkle: far } };
}

/** A trouser leg from the knee to the ankle, its hem cut square across the
 *  ankle (the bare foot leaves it there), never a rounded stump. */
function shinTo(k: Pt, a: Pt, rk: number, ra: number): SkPath {
  const l = Math.hypot(a[0] - k[0], a[1] - k[1]) || 1;
  const d: Pt = [(a[0] - k[0]) / l, (a[1] - k[1]) / l];
  const n: Pt = [-d[1], d[0]];
  const full = limbPath([P(k), P(a), P([a[0] + d[0] * 40, a[1] + d[1] * 40])], [rk, ra, ra]);
  const B = 3000;
  const h: Pt = [a[0] + d[0] * 8, a[1] + d[1] * 8];
  const cut = make();
  const c4: Pt[] = [
    [h[0] + n[0] * B, h[1] + n[1] * B],
    [h[0] - n[0] * B, h[1] - n[1] * B],
    [h[0] - n[0] * B - d[0] * B, h[1] - n[1] * B - d[1] * B],
    [h[0] + n[0] * B - d[0] * B, h[1] + n[1] * B - d[1] * B],
  ];
  cut.moveTo(c4[0][0], c4[0][1]);
  for (const c of c4.slice(1)) cut.lineTo(c[0], c[1]);
  cut.close();
  return I(full, cut);
}

/** A bare foot in profile lying on the floor (front view): the ankle at `a`,
 *  the toes toward `s` (±1 along u), the sole at the bottom. ≈ 255 mm heel to
 *  toe, ≈ 72 mm high at the instep. */
function footSide(a: Pt, s: number): { path: SkPath; lines: SkPath } {
  const L = (x: number, y: number): Pt => [a[0] + s * x, a[1] + y];
  const path = cr([L(-24, -36), L(14, -34), L(70, -22), L(140, -8), L(184, -2), L(206, 6), L(212, 18), L(204, 30), L(150, 33), L(90, 28), L(40, 30), L(-10, 34), L(-42, 24), L(-50, 2), L(-40, -22)], 0.5);
  const lines = make();
  // The toes' clefts and the big toe's nail; the ankle bone.
  for (const x of [168, 182, 194]) lines.addPath(curve([L(x, 30), L(x + 3, 22)]));
  lines.addPath(curve([L(196, -1), L(206, 4), L(207, 12)]));
  lines.addPath(curve([L(-6, -10), L(4, -2), L(-4, 6)]));
  return { path, lines };
}

/** A bare foot from above (the top view): the heel at the ankle `a`, the toes
 *  toward `s` along u; `bigToe` the side (±1 along v) of the big toe. The
 *  foot ≈ 255 mm long, ≈ 98 mm across the ball: the heel, the arch, the ball,
 *  then five toes — the big toe broad and longest, the others shorter and
 *  narrower toward the little toe, each with its nail. */
function footAbove(a: Pt, s: number, bigToe: number): { path: SkPath; lines: SkPath } {
  const L = (x: number, y: number): Pt => [a[0] + s * x, a[1] + bigToe * y];
  const body = cr([L(-50, 4), L(-40, -26), L(0, -38), L(80, -42), L(160, -50), L(184, -44), L(190, 0), L(180, 34), L(160, 46), L(90, 36), L(10, 34), L(-38, 28)], 0.5);
  // Toes: base (x, y), length, radius — big toe first.
  const toes: [number, number, number, number][] = [
    [176, -32, 46, 15],
    [178, -8, 36, 10.5],
    [174, 10, 32, 9.5],
    [168, 26, 28, 9],
    [158, 40, 22, 8],
  ];
  const lines = make();
  const tp = toes.map(([x, y, l, r], i) => {
    const ang = (i - 1) * 0.07;
    const tip: Pt = L(x + l * Math.cos(ang), y + l * Math.sin(ang));
    const nail: Pt = L(x + l * Math.cos(ang) - r * 0.9, y + l * Math.sin(ang));
    lines.addPath(curve([L(x + l * 0.62, y - r * 0.55), nail, L(x + l * 0.62, y + r * 0.55)]));
    return limbPath([P(L(x - 8, y)), P(tip)], [r + 1, r * 0.9]);
  });
  return { path: U(body, ...tp), lines };
}

type ArmGeo = { path: SkPath; foreSide: SkPath; cap: SkPath | null; root: Pt };
type BodyGeo = {
  shirt: SkPath;
  /** The shirt body and both sleeves: one garment, one outline. */
  shirtAll: SkPath;
  /** The shirt body where no sleeve lies over it (the collar, the belt). */
  bodyOnly: SkPath;
  garment: GarmentBox;
  armR: ArmGeo;
  armL: ArmGeo;
  foreR: number;
  foreL: number;
  trousers: SkPath;
  trouserBox: GarmentBox;
  /** The near shin over the far leg (cross-legged): full contour, its knee quiet. */
  nearShin: { path: SkPath; quiet: SkPath } | null;
  feet: { path: SkPath; lines: SkPath; far: boolean }[];
  shoes: SkPath[];
  shirtLines: SkPath;
  belt: SkPath | null;
  head: HeadPaths;
};

const geoCache = new WeakMap<LuteScene, Map<string, BodyGeo>>();
function bodyGeo(sc: LuteScene, view: ViewId, o: LuteArmOpts): BodyGeo {
  const key = `${view}|${o.fretDir[0].toFixed(3)},${o.fretDir[1].toFixed(3)}|${o.across}|${o.pluckRot}`;
  let m = geoCache.get(sc);
  if (!m) {
    m = new Map();
    geoCache.set(sc, m);
  }
  const hit = m.get(key);
  if (hit) return hit;
  const g = view === 'side' ? frontBody(sc, o) : aboveBody(sc, o);
  m.set(key, g);
  return g;
}

function arms(sc: LuteScene, view: ViewId, o: LuteArmOpts, rootR: Pt, rootL: Pt) {
  const f = sc.fit;
  const eR = ep(view, f.elbowR);
  const eL = ep(view, fretElbow(f));
  const wR = pluckWrist(ep(view, f.pluckHand), o.pluckRot);
  const wL = fretWrist(ep(view, f.fretHand), o.fretDir, o.across);
  const R = splitArm(P(rootR), P(eR), P(wR), SLEEVE);
  const L = splitArm(P(rootL), P(eL), P(wL), SLEEVE);
  // The fretting forearm comes to the neck from BELOW it (the hand under the
  // neck, its fingers over the board): only the part past the neck's lower
  // edge (the fit's fret-hand point lies on it) is in front of the
  // instrument; the rest passes behind the neck.
  const fH = ep(view, f.fretHand);
  const dl = Math.hypot(o.fretDir[0], o.fretDir[1]) || 1;
  const d: Pt = [o.fretDir[0] / dl, o.fretDir[1] / dl];
  const nn: Pt = [-d[1], d[0]];
  const B = 4000;
  const q = (a: number, b: number): Pt => [fH[0] + d[0] * a + nn[0] * b, fH[1] + d[1] * a + nn[1] * b];
  const below = make();
  const c4 = [q(-B, 0), q(B, 0), q(B, B), q(-B, B)];
  below.moveTo(c4[0][0], c4[0][1]);
  for (const c of c4.slice(1)) below.lineTo(c[0], c[1]);
  below.close();
  L.foreSide = I(L.foreSide, below);
  return { R, L, foreR: Math.atan2(wR[1] - eR[1], wR[0] - eR[0]), foreL: Math.atan2(wL[1] - eL[1], wL[0] - eL[0]) };
}

/** The scene from the FRONT (the engine's side view: u = x, v = y). */
function frontBody(sc: LuteScene, o: LuteArmOpts): BodyGeo {
  const f = sc.fit;
  const view: ViewId = 'side';
  const hc = ep(view, f.head.c);
  const sR = ep(view, f.shoulderR);
  const sL = ep(view, f.shoulderL);
  const n: Pt = [hc[0], sR[1] - 22]; // the base of the neck
  const lb = lowerBody(sc);
  const hipR = ep(view, lb.hipR);
  const hipL = ep(view, lb.hipL);
  const hipV = f.hipY;
  const waistV = n[1] + (hipV - n[1]) * 0.68;
  const R = (x: number, y: number): Pt => [sR[0] - x, sR[1] + y];
  const Lf = (x: number, y: number): Pt => [sL[0] + x, sL[1] + y];
  // The shirt's body: the trapezius ≈ 17° from the side of the neck to the
  // point of the shoulder, the deltoid rounding over the joint, the side of
  // the chest under the arm, the waist, the hem over the hips.
  const torso = cr([
    [n[0] - 54, n[1] - 46],
    R(-70, -50),
    R(8, -38),
    R(46, 4),
    R(40, 80),
    R(-14, 170),
    [n[0] - 150, waistV],
    [hipR[0] - 62, hipV + 8],
    [n[0], hipV + 30],
    [hipL[0] + 62, hipV + 8],
    [n[0] + 150, waistV],
    Lf(-14, 170),
    Lf(40, 80),
    Lf(46, 4),
    Lf(8, -38),
    Lf(-70, -50),
    [n[0] + 54, n[1] - 46],
    [n[0], n[1] + 14],
  ]);
  const beltV = hipV - 38;
  const shirtBody = Dif(torso, rect(hipR[0] - 400, beltV + 12, hipL[0] + 400, beltV + 700));
  const belt = I(rect(hipR[0] - 120, beltV - 16, hipL[0] + 120, beltV + 16), torso);
  const A = arms(sc, view, o, [sR[0], sR[1] + 12], [sL[0], sL[1] + 12]);
  // The DELTOID turns with the arm (half the arm's swing out from hanging),
  // so a raised arm's sleeve leaves the shoulder line as one curve — never a
  // hanging arm's cap with the sleeve bent off it (a knob).
  const deltoid = (s: Pt, side: number, e: Pt) => {
    const swing = Math.atan2(side * (e[0] - s[0]), e[1] - s[1]);
    const a = -side * Math.max(0, swing) * 0.5;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const Q = (x: number, y: number): Pt => [s[0] + side * x * c - y * sn, s[1] + side * x * sn + y * c];
    return cr([Q(-66, -48), Q(8, -37), Q(45, 4), Q(43, 70), Q(-4, 96), Q(-40, 30)]);
  };
  const capR = deltoid(sR, -1, ep(view, f.elbowR));
  const capL = deltoid(sL, 1, ep(view, fretElbow(f)));
  const armR: ArmGeo = { path: U(capR, A.R.path), foreSide: A.R.foreSide, cap: capR, root: [sR[0], sR[1] + 12] };
  const armL: ArmGeo = { path: U(capL, A.L.path), foreSide: A.L.foreSide, cap: capL, root: [sL[0], sL[1] + 12] };
  // The legs.
  const floor = sc.floorY;
  const kR = ep(view, f.kneeR);
  const kL = ep(view, f.kneeL);
  const pelvis = cr([
    [hipR[0] - 70, hipV - 40],
    [hipL[0] + 70, hipV - 40],
    [hipL[0] + 64, hipV + 36],
    [n[0], hipV + 56],
    [hipR[0] - 64, hipV + 36],
  ]);
  let trousers: SkPath;
  let nearShin: BodyGeo['nearShin'] = null;
  const feet: BodyGeo['feet'] = [];
  const shoes: SkPath[] = [];
  if (f.seat === 'chair' || !lb.near) {
    // Seated on a chair, seen from the front: each thigh comes toward us from
    // the hip to the knee (foreshortened: the lap), the shin hangs to the
    // ankle, the shoe on the floor — all one trouser mass with the pelvis.
    // The knee's front a little under the hip line (the thigh foreshortened
    // toward us): the thigh tapers into the knee, one contour, never a knee
    // cap set on a stalk.
    const ank = (k: Pt): Pt => [k[0] - 2, floor - 74];
    const kd = (k: Pt): Pt => [k[0], k[1] + 34];
    const legR = limbPath([P(hipR), P(kd(kR)), P(ank(kR))], [82, 60, 38]);
    const legL = limbPath([P(hipL), P(kd(kL)), P(ank(kL))], [82, 60, 38]);
    trousers = U(pelvis, legR, legL);
    for (const [k, s] of [
      [kR, -1],
      [kL, 1],
    ] as const) {
      const fu = k[0] - 2;
      shoes.push(cr([[fu - 52, floor - 4], [fu - 46, floor - 62], [fu, floor - 80], [fu + 46, floor - 62], [fu + 54 + s * 6, floor - 4]], 0.45));
    }
  } else {
    const nr = lb.near;
    const nearK = nr.side === 'L' ? kL : kR;
    const farK = nr.side === 'L' ? kR : kL;
    const nearHip = nr.side === 'L' ? hipL : hipR;
    const farHip = nr.side === 'L' ? hipR : hipL;
    const an = ep(view, nr.ankle);
    const af = ep(view, nr.farAnkle);
    const thighN = limbPath([P(nearHip), P(nearK)], [82, 60]);
    const thighF = limbPath([P(farHip), P(farK)], [82, 60]);
    const shinN = shinTo(nearK, an, 56, 40);
    const shinF = shinTo(farK, af, 54, 39);
    trousers = U(pelvis, thighN, thighF, shinN, shinF);
    nearShin = { path: shinN, quiet: disc(nearK, 66) };
    // The far foot behind everything (only what shows past the near leg);
    // the near foot over the far leg, its ankle under the trouser hem, and —
    // the veena's, lying under the far knee — behind that knee.
    const sN = Math.sign(an[0] - nearK[0]) || 1;
    const sF = Math.sign(af[0] - farK[0]) || 1;
    const ff = footSide(af, sF);
    feet.push({ path: ff.path, lines: ff.lines, far: true });
    const fn = footSide(an, sN);
    let nearFoot = Dif(fn.path, shinN);
    if (sc.kind === 'veena') nearFoot = Dif(nearFoot, thighF);
    feet.push({ path: nearFoot, lines: fn.lines, far: false });
  }
  // The collar's two points and the placket down to the belt.
  const shirtLines = make();
  shirtLines.addPath(curve([[n[0] - 50, n[1] - 6], [n[0] - 20, n[1] + 30], [n[0], n[1] + 44]]));
  shirtLines.addPath(curve([[n[0] + 50, n[1] - 6], [n[0] + 20, n[1] + 30], [n[0], n[1] + 44]]));
  shirtLines.addPath(curve([[n[0], n[1] + 44], [n[0] + 2, waistV], [n[0], beltV - 16]]));
  const head = intoCollar(headFront(P(hc), f.head.r, n[1]), torso);
  return {
    shirt: shirtBody,
    shirtAll: U(shirtBody, armR.path, armL.path),
    bodyOnly: Dif(torso, U(armR.path, armL.path)),
    garment: boxOf(shirtBody, armR.path, armL.path),
    armR,
    armL,
    foreR: A.foreR,
    foreL: A.foreL,
    trousers,
    trouserBox: boxOf(trousers),
    nearShin,
    feet,
    shoes,
    shirtLines,
    belt,
    head,
  };
}

/** The scene from ABOVE (u = x, v = z; the audience toward +v). */
function aboveBody(sc: LuteScene, o: LuteArmOpts): BodyGeo {
  const f = sc.fit;
  const view: ViewId = 'top';
  const hc = ep(view, f.head.c);
  const sR = ep(view, f.shoulderR);
  const sL = ep(view, f.shoulderL);
  const n: Pt = [hc[0], sR[1] - 4];
  // The shoulders and back from above: a rounded rectangle ≈ 470 mm across
  // the deltoids and ≈ 236 mm deep, the back nearly flat across the shoulder
  // blades, the chest a little fuller (toward the audience).
  const torso = cr([
    [n[0], n[1] - 112],
    [sR[0] + 70, n[1] - 108],
    [sR[0] + 10, sR[1] - 88],
    [sR[0] - 34, sR[1] - 50],
    [sR[0] - 40, sR[1] + 4],
    [sR[0] - 30, sR[1] + 52],
    [sR[0] + 14, sR[1] + 84],
    [n[0] - 90, n[1] + 116],
    [n[0], n[1] + 124],
    [n[0] + 90, n[1] + 116],
    [sL[0] - 14, sL[1] + 84],
    [sL[0] + 30, sL[1] + 52],
    [sL[0] + 40, sL[1] + 4],
    [sL[0] + 34, sL[1] - 50],
    [sL[0] - 10, sL[1] - 88],
    [sL[0] - 70, n[1] - 108],
  ]);
  const rootR: Pt = [sR[0] + 8, sR[1] + 10];
  const rootL: Pt = [sL[0] - 8, sL[1] + 10];
  const A = arms(sc, view, o, rootR, rootL);
  const armR: ArmGeo = { path: A.R.path, foreSide: A.R.foreSide, cap: disc(rootR, 70), root: rootR };
  const armL: ArmGeo = { path: A.L.path, foreSide: A.L.foreSide, cap: disc(rootL, 70), root: rootL };
  // The legs from above: the thighs from the hips (under the body) out to the
  // knees; cross-legged, the shins crossing in front and the bare feet.
  const lb = lowerBody(sc);
  const hipR = ep(view, lb.hipR);
  const hipL = ep(view, lb.hipL);
  const kR = ep(view, f.kneeR);
  const kL = ep(view, f.kneeL);
  const pelvis = cr([
    [hipR[0] - 60, hipR[1] - 70],
    [hipL[0] + 60, hipL[1] - 70],
    [hipL[0] + 80, hipL[1] + 30],
    [n[0], hipR[1] + 90],
    [hipR[0] - 80, hipR[1] + 30],
  ]);
  const thighR = limbPath([P(hipR), P(kR)], [82, 62]);
  const thighL = limbPath([P(hipL), P(kL)], [82, 62]);
  let trousers = U(pelvis, thighR, thighL);
  let nearShin: BodyGeo['nearShin'] = null;
  const feet: BodyGeo['feet'] = [];
  const shoes: SkPath[] = [];
  if (f.seat === 'chair' || !lb.near) {
    // On a chair the feet are on the floor under the knees: only the toe caps
    // show past them.
    for (const [k, th] of [
      [kR, 0.14],
      [kL, -0.14],
    ] as const) {
      const c = Math.cos(th);
      const sn = Math.sin(th);
      const F: Pt = [k[0], k[1] + 70];
      const Q = (du: number, dv: number): Pt => [F[0] + du * c - dv * sn, F[1] + du * sn + dv * c];
      shoes.push(cr([Q(-34, -96), Q(34, -96), Q(46, -20), Q(48, 60), Q(34, 128), Q(0, 150), Q(-34, 128), Q(-48, 60), Q(-46, -20)]));
    }
  } else {
    const nr = lb.near;
    const nearK = nr.side === 'L' ? kL : kR;
    const farK = nr.side === 'L' ? kR : kL;
    const an = ep(view, nr.ankle);
    const af = ep(view, nr.farAnkle);
    const shinN = shinTo(nearK, an, 56, 40);
    const shinF = shinTo(farK, af, 54, 39);
    trousers = U(trousers, shinN, shinF);
    nearShin = { path: shinN, quiet: disc(nearK, 66) };
    const sN = Math.sign(an[0] - nearK[0]) || 1;
    const sF = Math.sign(af[0] - farK[0]) || 1;
    // The sitar's near foot lies sole-up (its big toe toward the audience);
    // the others sole-down, the big toe toward the body.
    const ff = footAbove(af, sF, -1);
    feet.push({ path: ff.path, lines: ff.lines, far: true });
    const fn = footAbove(an, sN, sc.kind === 'sitar' ? 1 : -1);
    let nearFoot = Dif(fn.path, shinN);
    if (sc.kind === 'veena') nearFoot = Dif(nearFoot, nr.side === 'R' ? thighL : thighR);
    feet.push({ path: nearFoot, lines: fn.lines, far: false });
  }
  const shirtLines = make();
  shirtLines.addPath(curve([[n[0] - 70, n[1] - 10], [n[0], n[1] + 34], [n[0] + 70, n[1] - 10]]));
  return {
    shirt: torso,
    shirtAll: U(torso, armR.path, armL.path),
    bodyOnly: Dif(torso, U(armR.path, armL.path)),
    garment: boxOf(torso, armR.path, armL.path),
    armR,
    armL,
    foreR: A.foreR,
    foreL: A.foreL,
    trousers,
    trouserBox: boxOf(trousers),
    nearShin,
    feet,
    shoes,
    shirtLines,
    belt: null,
    head: headAbove(P(hc), f.head.r * 0.95),
  };
}

/** Where a sleeve lies over the shirt body (the shirt and its sleeves are
 *  ONE mass, one outline, one light): its edge as a soft fold and a soft core
 *  shadow along it — and nothing inside the shoulder or down to the armpit,
 *  so the sleeve flows out of the shoulder line. */
function SleeveFold({ arm, b }: { arm: ArmGeo; b: BodyGeo }) {
  const t = FIGURE_TONES.shirt;
  const g = useMemo(() => {
    const zone = Dif(b.shirt, U(arm.cap, disc(arm.root, 96)));
    const q = arm.path.copy();
    q.offset(-t.coreW * 0.75, -t.coreW);
    const core = I(Dif(arm.path, q), zone);
    return { zone, core };
  }, [arm, b, t.coreW]);
  return (
    <Group>
      <Path path={g.core} color={t.core} opacity={0.4}>
        <BlurMask blur={t.coreW * 0.45} style="normal" />
      </Path>
      <Group clip={g.zone}>
        <Path path={arm.path} style="stroke" strokeWidth={1.8} color={t.edge} opacity={0.5} />
      </Group>
    </Group>
  );
}

/* ═══════════════════════ the figure behind the instrument ═══════════════════════ */

/** Drawn BEFORE the instrument: the legs and feet, the shirt and both
 *  sleeves (the upper arms show; the forearms are painted again over the
 *  instrument), the head. */
export function PlayerBack({ sc, view, arms: o }: { sc: LuteScene; view: ViewId; arms?: LuteArmOpts }) {
  const opts: LuteArmOpts = o ?? { fretDir: [1, 0], across: 40, pluckRot: 25 };
  const b = bodyGeo(sc, view, opts);
  const head = b.head;
  return (
    <Group>
      {b.feet
        .filter((ft) => ft.far)
        .map((ft, i) => (
          <Group key={`ff${i}`}>
            <FigureMass path={ft.path} tone="skin" far />
            <Path path={ft.lines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.6} />
          </Group>
        ))}
      {view !== 'side'
        ? b.shoes.map((p, i) => (
            <FigureMass key={`shoe${i}`} path={p} tone="shoe" />
          ))
        : null}
      <FigureMass path={b.trousers} tone="trousers" box={b.trouserBox} />
      {b.nearShin ? <FigureMass path={b.nearShin.path} tone="trousers" box={b.trouserBox} quiet={b.nearShin.quiet} /> : null}
      {view === 'side'
        ? b.shoes.map((p, i) => (
            <FigureMass key={`shoe${i}`} path={p} tone="shoe" />
          ))
        : null}
      {b.feet
        .filter((ft) => !ft.far)
        .map((ft, i) => (
          <Group key={`fn${i}`}>
            <FigureMass path={ft.path} tone="skin" />
            <Group clip={ft.path}>
              <Path path={ft.lines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.6} />
            </Group>
          </Group>
        ))}
      <FigureMass path={b.shirtAll} tone="shirt" box={b.garment} />
      <Group clip={b.bodyOnly}>
        <Path path={b.shirtLines} style="stroke" strokeWidth={2.4} strokeCap="round" color="#161a24" opacity={0.9} />
        {b.belt ? (
          <Path path={b.belt}>
            <LinearGradient start={vec(0, b.belt.getBounds().y)} end={vec(0, b.belt.getBounds().y + b.belt.getBounds().height)} colors={['#3a2a20', '#1e150f']} />
          </Path>
        ) : null}
      </Group>
      <SleeveFold arm={b.armR} b={b} />
      <SleeveFold arm={b.armL} b={b} />
      <FigureHead fill={head.fill} />
    </Group>
  );
}

/** The fretting hand's wrist in view coords: below the neck (in the neck's
 *  own frame: 34 along, half the neck + 82 across). */
function fretWrist(at: Pt, dir: Pt, across: number): Pt {
  const l = Math.hypot(dir[0], dir[1]) || 1;
  const d: Pt = [dir[0] / l, dir[1] / l];
  const n: Pt = [-d[1], d[0]];
  const k = 0.9;
  const x = 34 * k;
  const y = 82 * k;
  return [at[0] + d[0] * x + n[0] * y, at[1] + d[1] * x + n[1] * y];
}

/**
 * The FRETTING hand (owner review 2026-10-10: a whole open hand was drawn
 * under the neck and a second set of fingers across it): ONE hand, the shared
 * 'fret' hand — the heel of the palm under the neck, the four fingers rising
 * from the knuckle row and curling over onto the strings at four stops, the
 * thumb behind the neck (hidden) — laid along the neck at `at`.
 */
function FretHand({ at, dir, across, fore }: { at: Pt; dir: Pt; across: number; fore?: number }) {
  const a = Math.atan2(dir[1], dir[0]);
  const hs = useMemo(() => {
    const k = 0.9;
    const half = across / 2 / k;
    // The fit's fret-hand point sits just under the neck's centre line (the
    // old finger stroke spanned it ±0.65 of the neck): the board's centre is
    // half a neck above it.
    const bv = -half;
    return handShape({ wrist: { u: 34, v: bv + half + 82 }, dir: -Math.PI / 2, kind: 'fret', board: { v: bv, half, tips: [-52, -18, 16, 50] } }, fore === undefined ? undefined : fore - a);
  }, [across, fore, a]);
  return (
    <Group transform={[{ translateX: at[0] }, { translateY: at[1] }, { rotate: a }, { scale: 0.9 }]}>
      <FigureMass path={hs.path} tone="skin" contour={2} />
      <Path path={hs.lines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} />
    </Group>
  );
}

/** Drawn AFTER the instrument: both forearms (the sleeve's outline clipped at
 *  the elbow, in the shirt's own light — no seam) and the hands. Opaque.
 *  `fretDir` is the neck's direction in this view; `across` the neck's width there. */
export function PlayerHands({ sc, view, fretDir, across, pluckRot = 25 }: { sc: LuteScene; view: ViewId; fretDir: Pt; across: number; pluckRot?: number }) {
  const f = sc.fit;
  const pH = ep(view, f.pluckHand);
  const fH = ep(view, f.fretHand);
  const b = bodyGeo(sc, view, { fretDir, across, pluckRot });
  return (
    <Group>
      <Group clip={b.armR.foreSide}>
        <FigureMass path={b.armR.path} tone="shirt" box={b.garment} />
      </Group>
      <Hand x={pH[0]} y={pH[1]} r={40} rot={pluckRot} fore={b.foreR} />
      <Group clip={b.armL.foreSide}>
        <FigureMass path={b.armL.path} tone="shirt" box={b.garment} />
      </Group>
      <FretHand at={fH} dir={fretDir} across={across} fore={b.foreL} />
    </Group>
  );
}

/** The floor line (front view) under the scene. */
export function FloorLine({ y, u0, u1, rug = false }: { y: number; u0: number; u1: number; rug?: boolean }) {
  return (
    <Group>
      <Path path={rr(u0, y, u1, y + 40, 0)}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + 40)} colors={['#2b2c31', '#141519']} />
      </Path>
      {rug ? (
        <Path path={rr(u0 + 60, y - 10, u1 - 60, y + 4, 4)}>
          <LinearGradient start={vec(u0, y - 10)} end={vec(u1, y + 4)} colors={PAL.rug as unknown as string[]} />
        </Path>
      ) : null}
      <Line p1={vec(u0, y)} p2={vec(u1, y)} color="#4a4d56" strokeWidth={3} />
    </Group>
  );
}
