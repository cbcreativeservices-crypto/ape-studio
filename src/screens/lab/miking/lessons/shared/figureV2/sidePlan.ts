/**
 * FIGURE V2 — THE PERSON IN PROFILE, PLANNED (the owner's figure realism
 * pass, D78, 2026-11-22: "improve all human figures … more photorealistic
 * (still matching the rest of the animation aesthetic and style)";
 * "human figures including hands, heads, etc").
 *
 * Pure: no React, no Skia. From a PlayerPose in the 'side' view (the same
 * skeleton the current renderer draws: nothing here moves a joint) this
 * builds the CONTROL POINTS of every drawn part, as an illustrator lays them
 * out, in the view's millimetres:
 *   • the HEAD in true profile, to adult proportions (the eye line at half
 *     the head's height, the eye set back from the bridge by about its own
 *     width, the ear between the brow line and the nose's base, lips and chin
 *     stacked under the nose); the planes that make a face (the brow ridge's
 *     shadow over the socket, the cheekbone, the side of the nose and its
 *     wing, the soft fold toward the mouth, the shadow under the lower lip,
 *     the chin's light); a calm eye looking down;
 *   • the MANDIBLE as a clear line from the chin to its angle below the ear,
 *     its cast shadow on the NECK — a column narrower than the head, the
 *     sternomastoid running from behind the ear to the collar's notch;
 *   • short HAIR: a natural hairline with a temple recession and a slightly
 *     irregular edge, a sideburn ending level with the middle of the ear,
 *     the mass built of a few clumps that follow the growth (from the crown
 *     forward, the sides down and back), a sheen band along the skull, a
 *     tapered nape;
 *   • a crew-neck SHIRT on a body: the collar round the neck with its own
 *     thickness and shadow; each long sleeve hangs from the shoulder (one
 *     silhouette — the deltoid a gentle swell inside the shirt, the armhole
 *     only a soft seam), folds where cloth folds (the crook of the elbow,
 *     bunched above the cuff, at the waist), a cuff at the wrist, the wrist's
 *     own bones;
 *   • the HAND on what it holds (grip.ts: the shared hand skeleton);
 *   • TROUSERS with a seat, a knee, a shin that tapers to the ankle and a hem
 *     that breaks over the instep with its folds; SHOES with a sole, a heel, a
 *     toe box and laces, standing on what they stand on (a pedal's footboard);
 *   • where the contact shadows fall.
 * The paint (FigureV2Side.tsx) lights it from the upper left, the same light
 * as the drums. Reusable for any side-view figure: give it a pose and, where
 * the figure holds or stands on something, those contacts.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import type { HandView } from '../players/handModel.ts';
import { add, boundsOf, crossZ, dist, dot, frame2, lerp, limbOutline, mapPts, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import type { StickHold } from './grip.ts';
import { placeHand, type PlacedHand } from './authoredHands.ts';

export type Ellipse = { c: Pt; rx: number; ry: number; rot: number };

export type HeadPlan = {
  facing: 1 | -1;
  /** The head's skin silhouette (skull, face, the jaw to its angle) — closed. */
  skull: Poly;
  /** The neck column, from inside the head into the collar — closed. */
  neck: Poly;
  /** The mandible's lower edge, chin → angle → up the ramus (open): drawn crisp. */
  jaw: Poly;
  /** The jaw's cast shadow on the neck (closed; soft below). */
  jawShadow: Poly;
  /** The sternomastoid: behind the ear down to the collar's notch (a soft form). */
  scm: Poly;
  hair: Poly;
  /** The hair's clumps (lens shapes along the growth). */
  clumps: Poly[];
  /** The sheen band along the skull (open). */
  sheen: Poly;
  ear: Poly;
  earRim: Poly;
  earFold: Poly;
  earBowl: Poly;
  brow: Poly;
  eye: Poly;
  iris: Poly;
  lid: Poly;
  lidCrease: Poly;
  socket: Ellipse;
  noseSide: Poly;
  ala: Poly;
  alaCrease: Poly;
  nostril: Poly;
  nasolabial: Poly;
  lips: Poly;
  mouth: Poly;
  underLip: Ellipse;
  cheekShade: Ellipse;
  /** Soft lights: the forehead, the bridge of the nose, the cheekbone, the chin, the brow ridge. */
  lights: Ellipse[];
  /** Points the test reads: the nose tip, the chin, the back of the skull, the eye. */
  noseTip: Pt;
  chin: Pt;
  back: Pt;
  eyeC: Pt;
  /** The front plane's shade runs from `a` (the profile) to `b` (inside). */
  frontShade: { a: Pt; b: Pt };
  box: { u0: number; v0: number; u1: number; v1: number };
};

export type ArmPlan = {
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  /** The long sleeve: shoulder → elbow (the deltoid inside the shirt). */
  upper: Poly;
  /** The sleeve's forearm: elbow → the cuff. */
  foreSleeve: Poly;
  cuff: Poly;
  /** The bare wrist between the cuff and the hand. */
  wristSkin: Poly;
  /** The wrist bone's light (the head of the ulna). */
  ulna: Ellipse;
  /** Folds: in the crook of the elbow and bunched above the cuff (lens shapes). */
  folds: Poly[];
  /** The set-in sleeve's seam round the top of the arm (open, soft). */
  armhole: Poly;
  upperAxis: [Pt, Pt];
  foreAxis: [Pt, Pt];
  hold: StickHold | null;
  /** The authored hand placed on the pose (authoredHands.ts), when it holds a stick. */
  placed: PlacedHand | null;
  /** The forearm runs away from the viewer (behind its own elbow): the
   *  forearm, the cuff and the hand are painted before the upper sleeve. */
  away: boolean;
};

export type LegPlan = {
  hip: Pt;
  knee: Pt;
  ankle: Pt;
  /** Hip → knee → calf (the thigh and the knee). */
  outline: Poly;
  /** The calf → the ankle → the hem resting on the shoe (one with `outline`). */
  lower: Poly;
  folds: Poly[];
  /** The light on the knee cap. */
  kneeLight: Ellipse;
  thighAxis: [Pt, Pt];
  shinAxis: [Pt, Pt];
  /** The half of the picture past the knee (the shin side), for its own light. */
  shinSide: Poly;
};

export type ShoePlan = { upper: Poly; sole: Poly; laces: Poly[]; heel: Pt; toe: Pt; ball: Pt; ankle: Pt; contact: Ellipse; slope: number; F: (x: number, y: number) => Pt };

export type SidePlan = {
  facing: 1 | -1;
  head: HeadPlan;
  shirt: Poly;
  collar: Poly;
  belt: Poly;
  waistFolds: Poly[];
  seat: Poly;
  arms: { near: ArmPlan; far: ArmPlan };
  legs: { near: LegPlan; far: LegPlan };
  shoes: { near: ShoePlan; far: ShoePlan };
  /** The thighs' soft shadow on the seat (a seated figure on a known seat). */
  seatShadow: Ellipse | null;
  /** The torso's axis (hips' midpoint → the base of the neck). */
  hip: Pt;
  neck: Pt;
  /** The torso's frame: a point t along hip → neck, `fwd` mm toward the face. */
  along: (t: number, fwd: number) => Pt;
  /** The view a hand skeleton is drawn in (3-D → this view). */
  view: HandView;
};

/** Where a foot stands: the ball of the foot on its sole line, and the sole's
 *  slope (radians, + = the toe up), e.g. a pedal's footboard. */
export type Sole = { ball: Pt; slope: number };

export type SideOpts = {
  /** The hands on sticks (grip.ts), near (R) and far (L). */
  holdR?: StickHold | null;
  holdL?: StickHold | null;
  /** Where each foot stands (default: flat on the pose's foot point). */
  soleR?: Sole;
  soleL?: Sole;
  /** The head's nod (degrees, + = the face down). */
  nod?: number;
  /** The seat's top (v) under a seated figure: its contact shadow. */
  seatV?: number;
  /** Which forearms run away from the viewer (behind their elbows). */
  awayR?: boolean;
  awayL?: boolean;
};

/* ── shared shapes ── */

/** A lens (a fold, a clump): from a to b, `w` wide at its middle, bowed `bow` mm. */
export function lens(a: Pt, b: Pt, w: number, bow = 0): Poly {
  const d = unit(sub(b, a));
  const n = perp(d);
  const m = add(lerp(a, b, 0.5), mul(n, bow));
  return [a, add(lerp(a, m, 0.6), mul(n, w / 2)), add(m, mul(n, w / 2)), add(lerp(m, b, 0.4), mul(n, w / 2)), b, add(lerp(m, b, 0.4), mul(n, -w / 2)), add(m, mul(n, -w / 2)), add(lerp(a, m, 0.6), mul(n, -w / 2))];
}

/** A slightly irregular edge: midpoints nudged in and out (deterministic). */
function jag(ps: Poly, amp: number): Poly {
  const out: Poly = [];
  for (let i = 0; i < ps.length; i++) {
    out.push(ps[i]);
    if (i < ps.length - 1) {
      const d = sub(ps[i + 1], ps[i]);
      const s = (i % 3 === 0 ? 1 : i % 3 === 1 ? -0.6 : 0.4) * amp;
      out.push(add(lerp(ps[i], ps[i + 1], 0.5), mul(perp(unit(d)), s)));
    }
  }
  return out;
}

/* ── the head ── */

type XY = readonly (readonly [number, number])[];

/**
 * The head in profile, authored facing +x with y DOWN, millimetres round the
 * pose's head centre (an adult: crown −122 to chin +105, ≈ 228 tall; the
 * eye line at −8, half way; the brow ridge −24, the nose's base +44, the
 * chin +105 — the face in thirds; brow ridge to the back of the skull ≈ 200).
 */
const SKULL: XY = [
  [-14, -122], [22, -119], [50, -110], [68, -98], [78, -84], [85, -64], [89, -44], [91, -30], // forehead, near upright
  [90, -22], [86, -14], // the brow ridge, the root of the nose
  [90, -2], [97, 12], [105, 26], [111, 33], [109, 38], [102, 42], [95, 43], [89, 45], // bridge, tip, under the tip
  [91, 50], [93, 55], [89, 59.5], [92, 64], [89, 71], [84, 77], // lips
  [87, 85], [88, 92], [84, 100], [76, 105], // the chin, stacked under the nose
  [58, 103], [36, 96], [14, 86], [-4, 76], [-13, 69], [-17, 61], // the mandible to its angle
  [-32, 60], [-50, 58], [-66, 56], [-80, 52], // behind the jaw's angle into the neck (no step under the ear)
  [-96, 34], [-106, 8], [-110, -24], [-104, -58], [-88, -88], [-62, -110], [-26, -121], // the back of the skull
];
const JAW: XY = [[76, 105], [58, 103], [36, 96], [14, 86], [-4, 76], [-13, 69], [-16, 60]];
const JAW_SHADOW: XY = [[72, 107], [50, 105], [24, 96], [0, 82], [-14, 71], [-18, 58], [-24, 72], [-8, 96], [20, 114], [50, 122], [72, 120]];
const EYE: XY = [[50, -6.5], [56, -11], [64, -13], [71, -12], [75, -9], [73, -6], [66, -4], [57, -4.5]];
// Looking down at the snare: the upper lid lowered over the eye, the iris low and forward.
const LID: XY = [[49, -7], [56, -12.6], [64, -14.8], [71, -13.8], [75.5, -9], [74, -7.6], [70, -9.4], [63, -10.4], [56, -9.2], [50, -6]];
const IRIS: XY = [[63, -9.8], [70.5, -9.2], [74, -6.8], [71, -4.2], [64, -4.8]];
const LID_CREASE: XY = [[53, -16], [63, -19.5], [72, -18]];
const BROW: XY = [[50, -24], [62, -28.5], [76, -29.5], [86, -27], [89, -23.5], [78, -25], [64, -24.5], [51, -21.5]];
const NOSE_SIDE: XY = [[86, -12], [94, 6], [102, 24], [100, 32], [92, 36], [84, 26], [80, 8], [80, -8]];
const ALA: XY = [[97, 31], [92, 27], [86, 31], [85, 38], [90, 43], [96, 42]];
const ALA_CREASE: XY = [[95, 25], [88, 28], [84, 35], [87, 42], [93, 44]];
const NOSTRIL: XY = [[95, 42], [100, 43], [98, 45], [93, 44.5]];
const NASOLABIAL: XY = [[85, 40], [80, 50], [77, 60]];
const LIPS: XY = [[91, 49], [93.5, 55], [89.5, 59.5], [92, 64], [89, 70], [82, 68], [80, 60], [82, 51]];
const MOUTH: XY = [[89.5, 59.8], [83, 60.6], [77, 60]];
// The ear (authored upright, then tipped back 15° along the line of the nose's bridge).
const EAR: XY = [[-7, 10], [-7, -6], [-11, -17], [-22, -23], [-35, -20], [-43, -7], [-45, 8], [-41, 22], [-34, 33], [-25, 42], [-16, 44], [-11, 38], [-9, 27], [-6, 19]];
const EAR_RIM: XY = [[-13, -13], [-25, -18], [-37, -13], [-41, 1], [-40, 16], [-34, 28]];
const EAR_FOLD: XY = [[-20, -10], [-31, -5], [-35, 8], [-31, 22], [-23, 30]];
const EAR_BOWL: XY = [[-12, 6], [-17, -1], [-25, 3], [-27, 14], [-22, 24], [-14, 22], [-10, 15]];
// The hair: over the top and down the back to a tapered nape, up behind the
// ear and over it, the sideburn to the middle of the ear, up the temple to
// the recession, forward along the frontal hairline.
const HAIR_OUTER: XY = [
  [78, -86], [82, -94], [78, -106], [66, -119], [44, -131], [12, -137], [-24, -134], [-58, -123], [-86, -103], [-106, -74], [-117, -38], [-118, -4], [-112, 24], [-100, 44], [-90, 56], [-84, 64],
  [-78, 58], [-70, 46], [-60, 34], [-54, 18], [-52, 0], [-50, -14], [-44, -25], [-33, -31], [-20, -33], [-9, -28],
];
const HAIR_EDGE: XY = [[-6, -18], [-5, -6], [-4, 7], [2, 9], [9, 8], [11, -6], [13, -20], [17, -34], [21, -48], [24, -60], [27, -71], [34, -79], [46, -84], [58, -86], [70, -86]];
const CLUMPS: readonly [readonly [number, number], readonly [number, number], number, number][] = [
  [[-20, -130], [62, -114], 16, -3],
  [[-4, -121], [72, -98], 14, -2],
  [[8, -108], [68, -90], 10, -2],
  [[-14, -106], [10, -38], 14, 4],
  [[-34, -112], [-34, -40], 16, 4],
  [[-54, -118], [-60, -20], 16, 4],
  [[-60, -126], [-104, -64], 14, -3],
  [[-74, -114], [-113, -14], 16, -4],
  [[-84, -80], [-100, 40], 14, -4],
  [[-40, -80], [-72, 20], 14, 3],
];

/** The head and neck (the neck from the skull into the collar `collarF`
 *  front and `collarB` back). */
export function headPlan(c: Pt, r: number, facing: 1 | -1, nod: number, collarF: Pt, collarB: Pt): HeadPlan {
  const k = r / 110;
  const F0 = frame2(c, facing, (nod * Math.PI) / 180, P(-16, 30));
  const F = (x: number, y: number) => F0(x * k, y * k);
  const M = (xs: XY) => mapPts(F, xs);
  const ea = (15 * Math.PI) / 180;
  const earF = (x: number, y: number) => {
    const dx = x + 26;
    const dy = y - 8;
    return F(-26 + 0.95 * (dx * Math.cos(ea) - dy * Math.sin(ea)), 8 + 0.95 * (dx * Math.sin(ea) + dy * Math.cos(ea)));
  };
  const E = (xs: XY) => mapPts(earF, xs);
  // The neck column: its front comes out from under the jaw and runs down to
  // the collar's notch, its back from the base of the skull down into the
  // collar — narrower than the head, its top inside the head's silhouette.
  const nF0 = F(24, 95);
  const nB0 = F(-80, 54);
  const fwd = unit(sub(collarF, collarB));
  const throat = add(lerp(nF0, collarF, 0.5), mul(fwd, 3));
  const nape = add(lerp(nB0, collarB, 0.5), mul(fwd, 5));
  const down = unit(sub(lerp(collarF, collarB, 0.5), lerp(nF0, nB0, 0.5)));
  const neck: Poly = [F(40, 80), nF0, throat, add(collarF, mul(down, 16)), add(collarB, mul(down, 16)), nape, nB0, F(-74, 30), F(-30, 40)];
  const skull = M(SKULL);
  const hair = [...M(HAIR_OUTER), ...jag(M(HAIR_EDGE), 1.3 * k)];
  const sheen: Poly = [];
  for (let a = -168; a <= -42; a += 9) {
    const t = (a * Math.PI) / 180;
    sheen.push(F(-18 + 98 * Math.cos(t), -18 + 104 * Math.sin(t)));
  }
  return {
    facing,
    skull,
    neck,
    jaw: M(JAW),
    jawShadow: M(JAW_SHADOW),
    scm: lens(F(-36, 50), add(collarF, mul(fwd, -14)), 24 * k, 3 * facing),
    hair,
    clumps: CLUMPS.map(([a, b, w, bow]) => lens(F(a[0], a[1]), F(b[0], b[1]), w * k, bow * k * facing)),
    sheen,
    ear: E(EAR),
    earRim: E(EAR_RIM),
    earFold: E(EAR_FOLD),
    earBowl: E(EAR_BOWL),
    brow: M(BROW),
    eye: M(EYE),
    iris: M(IRIS),
    lid: M(LID),
    lidCrease: M(LID_CREASE),
    socket: { c: F(66, -13), rx: 18 * k, ry: 9 * k, rot: (facing * nod * Math.PI) / 180 },
    noseSide: M(NOSE_SIDE),
    ala: M(ALA),
    alaCrease: M(ALA_CREASE),
    nostril: M(NOSTRIL),
    nasolabial: M(NASOLABIAL),
    lips: M(LIPS),
    mouth: M(MOUTH),
    underLip: { c: F(85, 75), rx: 6 * k, ry: 3.2 * k, rot: 0 },
    cheekShade: { c: F(46, 30), rx: 20 * k, ry: 10 * k, rot: 0.15 * facing },
    lights: [
      { c: F(74, -58), rx: 9 * k, ry: 16 * k, rot: 0.2 * facing },
      { c: F(95, 6), rx: 3 * k, ry: 9.5 * k, rot: -0.45 * facing },
      { c: F(42, 3), rx: 15 * k, ry: 6 * k, rot: -0.15 * facing },
      { c: F(85, 90), rx: 4.5 * k, ry: 6.5 * k, rot: 0 },
      { c: F(84, -33), rx: 6 * k, ry: 3 * k, rot: 0 },
    ],
    noseTip: F(111, 33),
    chin: F(88, 92),
    back: F(-110, -24),
    eyeC: F(63, -8.5),
    frontShade: { a: F(102, 0), b: F(62, 0) },
    box: boundsOf([...skull, ...M(HAIR_OUTER)]),
  };
}

/* ── the arms ── */

/** The long sleeve (mm, radii): the deltoid's gentle swell, the elbow, the
 *  sleeve narrowing to a cuff a little wider than the wrist. */
const SLEEVE_R = { top: 47, delt: 46, bicep: 43, elbow: 40, fore: 36.5, cuffIn: 32.5, cuff: 32, wrist: 23 } as const;

function armPlan(shoulder: Pt, elbow: Pt, wrist: Pt, hold: StickHold | null, away: boolean, placed: PlacedHand | null = null): ArmPlan {
  const du = unit(sub(elbow, shoulder));
  const df = unit(sub(wrist, elbow));
  const n = perp(du);
  const nf = perp(df);
  const foreLen = dist(elbow, wrist);
  const cuffB = sub(wrist, mul(df, Math.min(16, foreLen * 0.14)));
  const cuffA = sub(wrist, mul(df, Math.min(40, foreLen * 0.34)));
  const top = sub(shoulder, mul(du, 22));
  const upper = limbOutline([top, lerp(shoulder, elbow, 0.3), lerp(shoulder, elbow, 0.7), elbow], [SLEEVE_R.top, SLEEVE_R.delt, SLEEVE_R.bicep, SLEEVE_R.elbow]);
  const foreSleeve = limbOutline([elbow, lerp(elbow, cuffA, 0.5), cuffA], [SLEEVE_R.elbow - 0.5, SLEEVE_R.fore, SLEEVE_R.cuffIn], { capEnd: false });
  const cuff = limbOutline([sub(cuffA, mul(df, 3)), cuffB], [SLEEVE_R.cuff, SLEEVE_R.cuff - 0.5], { capStart: false, capEnd: false });
  // (ends a little short of the wrist crease, flat: the hand's own wrist covers the meeting)
  const wristSkin = limbOutline([sub(cuffB, mul(df, 6)), sub(wrist, mul(df, placed ? 8 : 0))], [SLEEVE_R.wrist + 1.5, SLEEVE_R.wrist], { capStart: false, capEnd: !placed });
  // The crook's folds: on the inside of the bend, fanning from the crook.
  const turn = crossZ(du, df);
  const inner = Math.sign(turn) || 1;
  const nIn = unit(add(perp(du), perp(df)));
  const crook = add(elbow, mul(nIn, inner * SLEEVE_R.elbow * 0.75));
  const folds: Poly[] = [];
  // (Seen from the outside of the bend — a forearm running away behind its elbow — the crook is hidden.)
  if (Math.abs(turn) > 0.12 && !away) {
    const across = unit(sub(elbow, crook));
    folds.push(lens(add(crook, mul(du, -26)), add(add(crook, mul(across, 22)), mul(du, -12)), 5, inner * 2));
    folds.push(lens(add(crook, mul(du, -8)), add(add(crook, mul(across, 18)), mul(df, 4)), 4, -inner * 2));
  }
  // Cloth bunched above the cuff: two uneven folds across the sleeve.
  folds.push(lens(add(sub(cuffA, mul(df, 8)), mul(nf, 26)), add(sub(cuffA, mul(df, 18)), mul(nf, -22)), 4.5, 2));
  folds.push(lens(add(sub(cuffA, mul(df, 24)), mul(nf, 18)), add(sub(cuffA, mul(df, 14)), mul(nf, -28)), 3.5, -2));
  // The set-in seam round the arm's root (the sleeve hangs from the shoulder).
  const armhole: Poly = [];
  for (let t = -1.35; t <= 1.351; t += 0.27) armhole.push(add(shoulder, add(mul(du, -2 + 14 * Math.cos(t)), mul(n, 46 * Math.sin(t)))));
  return {
    shoulder,
    elbow,
    wrist,
    upper,
    foreSleeve,
    cuff,
    wristSkin,
    ulna: { c: add(sub(wrist, mul(df, 9)), mul(nf, -dot(nf, { u: 0, v: 1 }) >= 0 ? 15 : -15)), rx: 5, ry: 4, rot: Math.atan2(df.v, df.u) },
    folds,
    armhole,
    upperAxis: [shoulder, elbow],
    foreAxis: [elbow, wrist],
    hold,
    placed,
    away,
  };
}

/** The authored hand for a stick grip in the side view (+z toward the viewer):
 *  seen along the stick → the fist from its little-finger side; across it →
 *  the palm side, the thumb on top. */
function placedOf(h: StickHold | null | undefined): PlacedHand | null {
  if (!h) return null;
  const d = h.dir;
  const view = Math.abs(d.z) > 0.72 ? 'fistEdge' : 'palmThumb';
  const Q = (k: number) => P(h.fulcrum.x + d.x * k, h.fulcrum.y + d.y * k);
  return placeHand(view, P(h.wrist.x, h.wrist.y), Q(0), Q(-116), Q(290));
}

/* ── the legs and the shoes ── */

/** A shoe in profile, authored at the ball of the foot on its sole line, x
 *  forward along the sole, y down (the sole's underside at y = 0). */
const UPPER: XY = [[-100, -11], [-106, -32], [-104, -58], [-94, -80], [-74, -90], [-48, -88], [-24, -90], [-4, -84], [18, -72], [44, -60], [76, -48], [110, -40], [138, -35], [156, -27], [166, -16], [166, -9], [-100, -9]];
const SOLE: XY = [[-102, -12], [168, -12], [171, -7], [166, 0], [-98, 0], [-103, -4]];
const LACES: readonly (readonly [readonly [number, number], readonly [number, number]])[] = [
  [[-10, -86], [4, -78]],
  [[8, -76], [22, -68]],
  [[26, -66], [40, -58]],
];

function shoePlan(sole: Sole, facing: 1 | -1): ShoePlan {
  const F = frame2(sole.ball, facing, -sole.slope);
  return {
    upper: mapPts(F, UPPER),
    sole: mapPts(F, SOLE),
    laces: LACES.map(([a, b]) => [F(a[0], a[1]), F(b[0], b[1])]),
    heel: F(-100, 0),
    toe: F(168, 0),
    ball: sole.ball,
    ankle: F(-50, -70),
    contact: { c: F(30, 2), rx: 150, ry: 9, rot: -sole.slope * facing },
    slope: sole.slope,
    F,
  };
}

const THIGH_R = { hip: 84, mid: 74, knee: 58 } as const;
const SHIN_R = { calf: 52, low: 46, ankle: 41 } as const;

function legPlan(hip: Pt, knee: Pt, shoe: ShoePlan): LegPlan {
  const ankle = shoe.ankle;
  const ds = unit(sub(ankle, knee));
  const nS = perp(ds);
  const calf = lerp(knee, ankle, 0.32);
  const outline = limbOutline([hip, lerp(hip, knee, 0.55), knee, calf], [THIGH_R.hip, THIGH_R.mid, THIGH_R.knee, SHIN_R.calf], { crook: 0.88, capEnd: false });
  // The hem breaks over the instep: its front rests on the shoe's laces, its
  // back hangs lower over the heel; the leg narrows to the ankle above it.
  const hemBack = shoe.F(-99, -36);
  const hemFront = shoe.F(6, -80);
  const low = lerp(knee, ankle, 0.72);
  const fSide = Math.sign(dot(sub(hemFront, ankle), nS)) || 1;
  const sideA = (t: Pt, r: number, s: number) => add(t, mul(nS, s * r));
  const hemMid = add(lerp(hemBack, hemFront, 0.5), mul(ds, 7));
  const front = [sideA(calf, SHIN_R.calf, fSide), sideA(low, SHIN_R.low, fSide), sideA(ankle, SHIN_R.ankle, fSide)];
  const back = [sideA(ankle, SHIN_R.ankle + 2, -fSide), sideA(low, SHIN_R.low, -fSide), sideA(calf, SHIN_R.calf, -fSide)];
  const lower: Poly = [...front, hemFront, lerp(hemFront, hemMid, 0.5), hemMid, lerp(hemMid, hemBack, 0.5), hemBack, ...back];
  const dt = unit(sub(knee, hip));
  const inner = Math.sign(crossZ(dt, ds)) || 1;
  const nIn = unit(add(perp(dt), perp(ds)));
  const crook = add(knee, mul(nIn, inner * THIGH_R.knee * 0.7));
  const across = unit(sub(knee, crook));
  const folds: Poly[] = [
    lens(add(crook, mul(dt, -30)), add(add(crook, mul(across, 40)), mul(dt, -12)), 7, inner * 4),
    lens(add(crook, mul(ds, 10)), add(add(crook, mul(across, 34)), mul(ds, 24)), 6, -inner * 4),
    // the break over the instep: two folds from the front of the hem
    lens(add(sideA(ankle, SHIN_R.ankle - 4, fSide), mul(ds, 2)), add(ankle, add(mul(ds, 18), mul(nS, -fSide * 6))), 5, 3),
    lens(add(sideA(ankle, SHIN_R.ankle - 6, fSide), mul(ds, -16)), add(ankle, add(mul(ds, -4), mul(nS, -fSide * 14))), 4, -2),
  ];
  // The knee cap: up and forward over the knee (the outside of the bend).
  const kneeOut = unit(mul(nIn, -inner));
  const bis = unit(add(mul(dt, -1), ds));
  const cut = unit(perp(bis));
  const sgn = Math.sign(dot(sub(ankle, knee), perp(cut))) || 1;
  const far = mul(perp(cut), sgn * 2000);
  const shinSide: Poly = [add(knee, mul(cut, 2000)), add(add(knee, mul(cut, 2000)), far), add(add(knee, mul(cut, -2000)), far), add(knee, mul(cut, -2000))];
  return {
    hip,
    knee,
    ankle,
    outline,
    lower,
    folds,
    kneeLight: { c: add(knee, mul(kneeOut, THIGH_R.knee * 0.6)), rx: 22, ry: 14, rot: Math.atan2(kneeOut.v, kneeOut.u) },
    thighAxis: [hip, knee],
    shinAxis: [knee, ankle],
    shinSide,
  };
}

/* ── the whole figure ── */

const planCache = new WeakMap<PlayerPose, Map<string, SidePlan>>();

/** The side-view figure's plan for a pose (memoised per pose and options). */
export function sidePlan(pose: PlayerPose, opts: SideOpts = {}): SidePlan {
  let byOpts = planCache.get(pose);
  if (!byOpts) {
    byOpts = new Map();
    planCache.set(pose, byOpts);
  }
  const key = JSON.stringify({ r: opts.holdR?.wrist ?? null, l: opts.holdL?.wrist ?? null, sr: opts.soleR ?? null, sl: opts.soleL ?? null, n: opts.nod ?? 0, s: opts.seatV ?? null, a: [!!opts.awayR, !!opts.awayL] });
  const hit = byOpts.get(key);
  if (hit) return hit;
  const plan = buildPlan(pose, opts);
  byOpts.set(key, plan);
  return plan;
}

function buildPlan(pose: PlayerPose, opts: SideOpts): SidePlan {
  const facing: 1 | -1 = (pose.facing ?? 1) >= 0 ? 1 : -1;
  const n = pose.neck;
  const hip = lerp(pose.hipR, pose.hipL, 0.5);
  const ax = Math.atan2(n.v - hip.v, n.u - hip.u);
  let nu = -Math.sin(ax);
  let nv = Math.cos(ax);
  if (Math.sign(nu || facing) !== Math.sign(facing)) {
    nu = -nu;
    nv = -nv;
  }
  const along = (t: number, fwd: number): Pt => {
    const c = lerp(hip, n, t);
    return P(c.u + nu * fwd, c.v + nv * fwd);
  };
  // THE SHIRT on the torso (a healthy adult's upright back: the nape, the
  // shoulder blade's shallow curve, the lumbar hollow; the chest, the ribs,
  // a seated belly), tucked in at the belt.
  const shirt: Poly = [
    along(0.965, 60), along(0.92, 92), along(0.84, 110), along(0.7, 116), along(0.55, 110), along(0.4, 104), along(0.27, 104), along(0.16, 108), along(0.1, 106),
    along(0.1, -112), along(0.2, -100), along(0.32, -94), along(0.48, -100), along(0.66, -106), along(0.82, -100), along(0.95, -84), along(1.04, -62), along(1.09, -42),
  ];
  // The crew collar: a ribbed band round the base of the neck (≈ 18 mm), low in front, high behind.
  const collar: Poly = [along(0.965, 62), along(1.0, 30), along(1.045, -6), along(1.09, -32), along(1.058, -40), along(1.01, -14), along(0.97, 22), along(0.93, 58)];
  const belt: Poly = [along(0.135, 108), along(0.135, -114), along(0.085, -116), along(0.085, 108)];
  // Cloth gathered over the belt where the seated body folds at the waist.
  const waistFolds: Poly[] = [lens(along(0.2, 104), along(0.25, 40), 7, -4), lens(along(0.165, 98), along(0.215, 18), 6, -3), lens(along(0.2, -96), along(0.27, -40), 6, 3)];
  // The seat of the trousers (the pelvis), joined to the near thigh.
  const seat: Poly = [along(0.14, 104), along(0.04, 102), along(-0.08, 92), along(-0.16, 40), along(-0.16, -40), along(-0.08, -108), along(0.04, -116), along(0.14, -114)];
  const view: HandView = (p) => ({ u: p.x, v: p.y, d: p.z });
  const pR = placedOf(opts.holdR);
  const pL = placedOf(opts.holdL);
  const wristOf = (pl: PlacedHand | null, w: Pt) => (pl ? pl.wrist : w);
  const near = armPlan(pose.shoulderR, pose.elbowR, wristOf(pR, pose.handR.wrist), opts.holdR ?? null, !!opts.awayR, pR);
  const far = armPlan(pose.shoulderL, pose.elbowL, wristOf(pL, pose.handL.wrist), opts.holdL ?? null, !!opts.awayL, pL);
  const flat = (foot: Pt): Sole => ({ ball: foot, slope: 0 });
  const shoeN = shoePlan(opts.soleR ?? flat(pose.footR), facing);
  const shoeF = shoePlan(opts.soleL ?? flat(pose.footL), facing);
  const legN = legPlan(pose.hipR, pose.kneeR, shoeN);
  const legF = legPlan(pose.hipL, pose.kneeL, shoeF);
  const head = headPlan(pose.head.c, pose.head.r, facing, opts.nod ?? 0, along(0.955, 54), along(1.075, -38));
  const seatShadow = opts.seatV !== undefined && pose.posture !== 'standing' ? { c: P(lerp(hip, pose.kneeR, 0.18).u, opts.seatV + 4), rx: 200, ry: 16, rot: 0 } : null;
  return { facing, head, shirt, collar, belt, waistFolds, seat, arms: { near, far }, legs: { near: legN, far: legF }, shoes: { near: shoeN, far: shoeF }, seatShadow, hip, neck: n, along, view };
}
