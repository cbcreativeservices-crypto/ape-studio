/**
 * FIGURE V2 — A PERSON SITTING CROSS-LEGGED ON THE FLOOR, BAREFOOT (wave 3,
 * set 3d of D78, 2026-11-24: the tabla player). Pure: no React, no Skia.
 *
 * Sukhasana, as tabla players sit: each thigh runs forward and out from the
 * hip to a low knee (≈ 10–13 cm off the floor), each shin folds back inward
 * under the other leg, each foot tucked under the OPPOSITE knee, lying on its
 * outer edge, the sole turned up and back, the toes pointing outward. Seen from
 * the player's right (the side view, the camera at +z):
 *   • the far (left) thigh and shin first, a value step down;
 *   • the near (right) thigh forward to its knee, the shin folding back from
 *     the knee toward the right foot, which lies under the far knee — its
 *     foot seen from the heel (its length runs away from the camera): the
 *     round of the heel and the ankle's bones below the trouser hem;
 *   • the LEFT foot lies under the near knee, its toes toward the camera:
 *     seen end-on in front of the near shin — the foot standing on its outer
 *     edge, the big toe on top, the toes graduated down to the little toe,
 *     ONE form with short creases from the tips (never a row of beads).
 * From above (the camera overhead): the thighs out to the knees, the shins
 * crossing in front of the hips (the right one over), each foot under the
 * opposite knee with only its toe end showing beyond the knee.
 *
 * The body above the hips (shirt, arms, head) is the approved seated figure
 * (sidePlan); only its legs and shoes are replaced here: `floorSidePlan` hands
 * sidePlan's renderer crossed legs and HIDDEN shoes (two tiny shapes inside
 * the seat, the contact shadow on the floor under the body), and the feet are
 * painted by floorSeatV2 in their own place in the depth order.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { add, dist, lerp, limbOutline, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import { lens, type Ellipse, type LegPlan, type ShoePlan, type SidePlan } from './sidePlan.ts';
import type { TopPlan } from './topPlan.ts';
import type { BodyBuild } from './sidePlan.ts';

/** The trouser leg's radii (sidePlan legPlan's medium adult; scaled by the build). */
const LR = (B?: BodyBuild) => ({ hip: 90 * (B?.hip ?? 1), mid: 78 * (B?.limb ?? 1), knee: 58 * (B?.limb ?? 1), calf: 54 * (B?.limb ?? 1), low: 46 * (B?.limb ?? 1), ankle: 40 });

/** The half of the picture past the knee (sidePlan legPlan's own construction): the shin side for its light. */
function shinSideOf(hip: Pt, knee: Pt, ankle: Pt): Poly {
  const dt = unit(sub(knee, hip));
  const ds = unit(sub(ankle, knee));
  const bis = unit(add(mul(dt, -1), ds));
  const cut = unit(perp(bis));
  const sgn = Math.sign((ankle.u - knee.u) * perp(cut).u + (ankle.v - knee.v) * perp(cut).v) || 1;
  const far = mul(perp(cut), sgn * 2000);
  return [add(knee, mul(cut, 2000)), add(add(knee, mul(cut, 2000)), far), add(add(knee, mul(cut, -2000)), far), add(knee, mul(cut, -2000))];
}

/** One trouser leg folded at the knee: hip → knee → ankle as one cloth, its hem a little above the ankle. */
export function foldedLeg(hip: Pt, knee: Pt, ankle: Pt, B?: BodyBuild): LegPlan {
  const R = LR(B);
  const mid = lerp(hip, knee, 0.55);
  const calf = lerp(knee, ankle, 0.35);
  const low = lerp(knee, ankle, 0.75);
  const outline = limbOutline([hip, mid, knee, calf], [R.hip, R.mid, R.knee, R.calf], { crook: 0.85, capEnd: false });
  const lower = limbOutline([calf, low, ankle], [R.calf, R.low, R.ankle + 4], { capStart: false });
  const kOut = unit(add(unit(sub(knee, hip)), unit(sub(knee, ankle))));
  const kneeLight: Ellipse = { c: add(knee, mul(kOut, R.knee * 0.55)), rx: 20, ry: 14, rot: Math.atan2(kOut.v, kOut.u) };
  // the cloth folded at the knee's bend: a crease from inside the bend along the calf where it lies on the
  // thigh, and a softer one on the thigh's side toward the hip
  const inward = unit(sub(lerp(hip, ankle, 0.5), knee));
  const bendAt = add(knee, mul(inward, R.knee * 0.75));
  const folds: Poly[] = [lens(bendAt, lerp(bendAt, low, 0.6), 6, 3), lens(lerp(hip, knee, 0.35), lerp(hip, knee, 0.7), 5, -2)];
  return { hip, knee, ankle, outline, lower, folds, kneeLight, thighAxis: [hip, knee], shinAxis: [knee, ankle], shinSide: shinSideOf(hip, knee, ankle) };
}

/** A shoe plan that draws nothing visible: a 1 mm triangle inside the seat; `shadow` the soft contact on the floor. */
function hiddenShoe(at: Pt, shadow: Ellipse): ShoePlan {
  const tri: Poly = [at, add(at, P(1, 0)), add(at, P(0, 1))];
  return { upper: tri, sole: tri, laces: [], heel: at, toe: at, ball: at, ankle: at, contact: shadow, slope: 0, F: () => at };
}

/* ── the feet from the side ── */

/** The near (right) foot seen from its heel (its length runs away from the camera): the heel's round under
 *  the hem, the inner and outer ankle bones, the sole's edge turned up and back. Closed outline; `ball`: the
 *  ankle bone's light. */
export type HeelEnd = { outline: Poly; sole: Poly; bone: Ellipse; c: Pt };
function heelEnd(ankle: Pt, floor: number): HeelEnd {
  // the heel ≈ 70 mm wide lying on the foot's outer edge (so ≈ 70 tall here), its back ≈ 80 mm deep
  const c = P(ankle.u - 14, floor - 44);
  const F = (x: number, y: number) => P(c.u + x, c.v + y);
  const outline: Poly = [F(-38, 40), F(-44, 18), F(-42, -8), F(-34, -30), F(-20, -44), F(0, -50), F(20, -46), F(34, -32), F(40, -10), F(40, 16), F(34, 40), F(10, 44), F(-16, 44)];
  // the sole's edge (the thick skin of the heel) on the upper back, turned up toward the body
  const sole: Poly = [F(-34, -30), F(-20, -44), F(0, -50), F(20, -46), F(34, -32), F(22, -36), F(0, -40), F(-20, -34)];
  return { outline, sole, bone: { c: F(6, -18), rx: 11, ry: 9, rot: 0 }, c };
}

/** The left foot seen from its toe end (its length runs toward the camera), standing on its outer edge: the
 *  forefoot's end ≈ 95 mm tall (the foot's width) and ≈ 55 mm across (its depth at the toes), the big toe on
 *  top. `toes`: the one shape of the five toe ends, told apart by short creases from the tips only. */
export type ToeEnd = { outline: Poly; sole: Poly; pads: Ellipse[]; creases: Poly[]; nails: Poly[]; c: Pt };
function toeEnd(c: Pt): ToeEnd {
  const F = (x: number, y: number) => P(c.u + x, c.v + y);
  // the forefoot's end: fuller at the big toe (top), narrowing to the little toe at the floor; its right side
  // (toward the camera's right) is where the toe ends face the camera
  const outline: Poly = [F(-24, -46), F(-6, -52), F(12, -50), F(26, -40), F(31, -22), F(30, -2), F(27, 14), F(22, 28), F(14, 40), F(4, 47), F(-10, 47), F(-22, 38), F(-30, 18), F(-32, -8), F(-30, -30)];
  // the sole (turned up and back): a paler band of thick skin along the upper-left side
  const sole: Poly = [F(-30, -30), F(-24, -46), F(-6, -52), F(8, -51), F(-2, -44), F(-16, -36), F(-24, -18), F(-26, 4), F(-24, 22), F(-30, 18), F(-32, -8)];
  // the toe ends facing the camera, graduated from the big toe down to the little toe, close together along
  // an arc (their light only: they sit inside the one outline, never a row of beads on it)
  const pads: Ellipse[] = [
    { c: F(10, -27), rx: 15, ry: 17, rot: 0.1 },
    { c: F(16, -3), rx: 10, ry: 10, rot: 0.2 },
    { c: F(16, 13), rx: 9, ry: 8.5, rot: 0.3 },
    { c: F(12, 26), rx: 8, ry: 7.5, rot: 0.4 },
    { c: F(5, 37), rx: 7, ry: 6.5, rot: 0.5 },
  ];
  // the creases where one toe's tip meets the next: from the outline inward, fading (the gaps start at the
  // tips, as on the approved hands)
  const creases: Poly[] = [
    [F(30, -12), F(20, -12), F(10, -9)],
    [F(28, 6), F(19, 5), F(12, 6)],
    [F(24, 20), F(16, 19), F(10, 19)],
    [F(18, 32), F(11, 31), F(6, 31)],
  ];
  // the big toe's nail: its top edge shows as a sliver on the toe's lower side (the foot's top faces down)
  const nails: Poly[] = [[F(4, -14), F(14, -17), F(22, -14), F(14, -11)]];
  return { outline, sole, pads, creases, nails, c };
}

/**
 * THE LEFT FOOT AS THE SIDE CAMERA SEES IT (owner round, 2026-11-24: "redraw it until it reads as a foot —
 * sole, heel, toes in a row getting smaller"). Cross-legged, each sole turns up and outward: the left foot,
 * lying under the right knee on its outer edge, shows its SOLE to a camera on the player's right — the heel's
 * round toward the body, the arch drawn in along the upper (inner) edge, the ball wide, and the five toes in a
 * row at the front, the big toe at the top reaching farthest, each next one shorter and smaller down to the
 * little toe on the floor; the foot runs forward and out (≈ 35° from the picture), so its length is drawn
 * ≈ 0.82 of a 240 mm foot and its width ≈ 0.85 of 90 mm. ONE outline: the toes are its own front edge, told
 * apart by short notches at their tips (the gaps start at the tips), a soft crease across their bases, the
 * pads' light inside — never beads stuck on.
 */
export type SoleSide = { outline: Poly; arch: Poly; pads: Ellipse[]; toePads: Ellipse[]; creases: Poly[]; toeLine: Poly; c: Pt };
function soleSide(heelBack: Pt, floor: number): SoleSide {
  const ky = 0.85;
  // x forward from the heel's back, y UP from the foot's outer edge on the floor
  const F = (x: number, y: number) => P(heelBack.u + x, floor - 1 - y * ky);
  // the toes from the little toe (on the floor) to the big toe (on top): their tip's reach, their edge heights
  const toes: [number, number, number][] = [
    [166, 2, 14],
    [176, 14, 27],
    [184, 27, 40],
    [190, 40, 54],
    [198, 54, 82],
  ];
  const front: Pt[] = [];
  toes.forEach(([tip, lo, hi], i) => {
    const mid = (lo + hi) / 2;
    const r = (hi - lo) / 2;
    // the notch between this toe and the last: 6 mm behind the shorter tip (the gaps start at the tips)
    if (i > 0) front.push(F(Math.min(tip, toes[i - 1][0]) - 6, lo));
    else front.push(F(tip - 12, lo));
    front.push(F(tip - r * 0.45, mid - r * 0.82), F(tip, mid), F(tip - r * 0.45, mid + r * 0.82));
  });
  const outline: Poly = [
    // the heel's round (back), the outer edge along the floor
    F(4, 30), F(0, 16), F(4, 5), F(16, 0), F(46, -1), F(96, 0), F(140, 0), F(158, 1),
    ...front,
    // the big toe's top into the ball's inner edge, the arch drawn in, the heel's top
    F(186, 84), F(160, 86), F(132, 82), F(104, 70), F(78, 64), F(52, 64), F(28, 60), F(12, 50),
  ];
  // the arch: the hollow under the inner edge between the ball and the heel (a soft shade)
  const arch: Poly = [F(60, 64), F(100, 69), F(126, 72), F(108, 50), F(76, 46)];
  const pads: Ellipse[] = [
    { c: F(30, 28), rx: 22, ry: 20 * ky, rot: 0 },
    { c: F(140, 46), rx: 22, ry: 30 * ky, rot: 0 },
  ];
  const toePads: Ellipse[] = toes.map(([tip, lo, hi]) => ({ c: F(tip - (hi - lo) * 0.42, (lo + hi) / 2), rx: (hi - lo) * 0.36, ry: (hi - lo) * 0.36 * ky, rot: 0 }));
  // the crease across the toes' bases (where the toes leave the ball), and a short one into each notch
  const toeLine: Poly = toes.slice(1).map(([tip, lo, hi]) => F(tip - (hi - lo) * 0.95 - 8, (lo + hi) / 2));
  const creases: Poly[] = toes.slice(1).map(([tip, lo], i) => {
    const t0 = Math.min(tip, toes[i][0]) - 6;
    return [F(t0, lo), F(t0 - 7, lo + 0.5)];
  });
  return { outline, arch, pads, toePads, creases, toeLine, c: F(100, 40) };
}

/** The near (right) leg's thigh and shin as two forms (the shin folded back under the thigh): their own
 *  outlines, the line where the thigh lies over the shin, and the soft shadow it casts there. */
export type FoldForms = { thigh: Poly; shin: Poly };
function foldForms(l: LegPlan, B?: BodyBuild): FoldForms {
  const R = LR(B);
  const thigh = limbOutline([l.hip, lerp(l.hip, l.knee, 0.55), l.knee], [R.hip, R.mid, R.knee]);
  const shin = limbOutline([l.knee, lerp(l.knee, l.ankle, 0.35), lerp(l.knee, l.ankle, 0.75), l.ankle], [R.knee - 4, R.calf, R.low, R.ankle + 4]);
  return { thigh, shin };
}

export type FloorSide = { plan: SidePlan; heel: HeelEnd; toes: ToeEnd; sole: SoleSide; fold: FoldForms };

const sideCache = new WeakMap<SidePlan, FloorSide>();

/**
 * The cross-legged plan: the approved seated figure's `base` plan (from sidePlan on the same pose) with its
 * legs replaced by the folded ones and its shoes hidden; the feet to paint. `floor` is the floor's v.
 */
export function floorSidePlan(base: SidePlan, pose: PlayerPose, B: BodyBuild | undefined, floor: number): FloorSide {
  const hit = sideCache.get(base);
  if (hit) return hit;
  // the near (right) shin folds back from its knee toward the right foot under the far knee; the far (left)
  // shin from its knee toward the left foot under the near knee (both ankles close to the floor)
  const ankleN = P(pose.hipR.u + 130, floor - 52);
  const ankleF = P(pose.kneeR.u - 110, floor - 50);
  const near = foldedLeg(pose.hipR, pose.kneeR, ankleN, B);
  const far = foldedLeg(pose.hipL, pose.kneeL, ankleF, B);
  const seatAt = lerp(pose.hipR, pose.hipL, 0.5);
  const shadow: Ellipse = { c: P(seatAt.u + 130, floor + 4), rx: 300, ry: 16, rot: 0 };
  const plan: SidePlan = {
    ...base,
    legs: { near, far },
    shoes: { near: hiddenShoe(seatAt, shadow), far: hiddenShoe(seatAt, { ...shadow, rx: 1, ry: 1 }) },
  };
  // the left foot's heel tucked at the far shin's end, the sole forward under (and past) the near knee
  const out: FloorSide = { plan, heel: heelEnd(ankleN, floor), toes: toeEnd(P(ankleF.u + 4, floor - 52)), sole: soleSide(P(ankleF.u - 30, ankleF.v), floor), fold: foldForms(near, B) };
  sideCache.set(base, out);
  return out;
}

/* ── from above ── */

/** A foot seen from above lying on its outer edge (the sole turned up): heel, arch, ball and the toes' end,
 *  ≈ 240 × 85 mm, its length from `heel` along `dir` (the toes outward); `toes`: the toes' one shape. */
export type FootTop = { outline: Poly; toes: Poly; creases: Poly[]; axis: [Pt, Pt] };
function footTop(heel: Pt, dir: Pt, side: 1 | -1): FootTop {
  const x = unit(dir);
  const y = mul(perp(x), side);
  const F = (a: number, b: number) => add(heel, add(mul(x, a), mul(y, b)));
  // the sole's outline: the heel's round, the arch drawn in on the inner side, the ball wide, the toes' end
  const outline: Poly = [F(0, -26), F(16, -36), F(60, -38), F(110, -34), F(160, -44), F(196, -46), F(222, -38), F(240, -20), F(244, 0), F(238, 22), F(220, 36), F(190, 40), F(150, 36), F(100, 24), F(52, 30), F(16, 32), F(-2, 16), F(-6, -6)];
  const toes: Poly = [F(196, -44), F(222, -37), F(240, -19), F(243, 0), F(237, 21), F(219, 35), F(196, 39), F(200, 10), F(200, -20)];
  const creases: Poly[] = [
    [F(242, -6), F(228, -6), F(218, -8)],
    [F(238, 9), F(228, 9)],
    [F(232, 20), F(223, 19)],
    [F(222, 30), F(214, 28)],
  ];
  return { outline, toes, creases, axis: [F(0, 0), F(244, 0)] };
}

export type FloorTop = { plan: TopPlan; thighs: [Poly, Poly]; shins: [Poly, Poly]; thighAxes: [[Pt, Pt], [Pt, Pt]]; shinAxes: [[Pt, Pt], [Pt, Pt]]; knees: [Ellipse, Ellipse]; feet: [FootTop, FootTop] };
const topCache = new WeakMap<TopPlan, FloorTop>();

/**
 * From above (the view's own millimetres, the chest toward +x): hips, knees out wide, the shins crossing in
 * front of the hips, the feet under the opposite knees. `hips` [R, L], `knees` [R, L] in the view.
 */
export function floorTopLegs(base: TopPlan, hips: [Pt, Pt], knees: [Pt, Pt], B?: BodyBuild): FloorTop {
  const hit = topCache.get(base);
  if (hit) return hit;
  const R = LR(B);
  // each ankle under the OTHER knee, a little behind it (toward the body)
  const ankles: [Pt, Pt] = [P(knees[1].u - 50, knees[1].v * 0.55), P(knees[0].u - 50, knees[0].v * 0.55)];
  const thigh = (h: Pt, k: Pt) => limbOutline([h, lerp(h, k, 0.55), k], [R.hip, R.mid, R.knee + 4]);
  const shin = (k: Pt, a: Pt) => limbOutline([k, lerp(k, a, 0.35), a], [R.knee, R.calf, R.ankle]);
  // the feet: from the ankle outward past the other knee, toes forward-out
  const footOf = (a: Pt, outward: number): FootTop => {
    const dir = unit(P(0.45, outward));
    return footTop(add(a, mul(dir, -40)), dir, outward > 0 ? -1 : 1);
  };
  const out: FloorTop = {
    plan: base,
    thighs: [thigh(hips[0], knees[0]), thigh(hips[1], knees[1])],
    shins: [shin(knees[0], ankles[0]), shin(knees[1], ankles[1])],
    thighAxes: [[hips[0], knees[0]], [hips[1], knees[1]]],
    shinAxes: [[knees[0], ankles[0]], [knees[1], ankles[1]]],
    knees: knees.map((k, i) => ({ c: add(k, mul(unit(sub(k, hips[i])), -10)), rx: 36, ry: 30, rot: Math.atan2(k.v - hips[i].v, k.u - hips[i].u) })) as [Ellipse, Ellipse],
    // (the right foot lies under the LEFT knee: its toes out toward −z; the left foot's toward +z)
    feet: [footOf(ankles[0], -1), footOf(ankles[1], 1)],
  };
  topCache.set(base, out);
  return out;
}

/** (tests) the drawn length of a shin from the side. */
export const shinLen = (l: LegPlan) => dist(l.knee, l.ankle);
