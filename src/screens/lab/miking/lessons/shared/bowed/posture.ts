/**
 * THE PLAYER AND THE INSTRUMENT IN THE ROOM — the bowed family's three
 * postures (violin/GEOMETRY_PROPOSAL.md §4, cello §1, upright_bass_plucked
 * §1), all ILLUSTRATIVE drawing defaults, placed in the LESSON FRAME of the
 * miking engine (engine/model/types.ts): origin at B0 (the bridge's foot line
 * on the top), +x toward the audience, +y DOWN (the floor at +floorY), +z
 * toward the player's RIGHT. The player always faces +x.
 *
 *   UNDER THE CHIN (violin, viola): standing; the tail under the chin, the
 *     centre line forward-left 45° and rising 10°, the top rolled 30° toward
 *     the player's right (proposal §4; the research frame's z is the
 *     engine's). The viola's tail sits 20 mm lower.
 *   SEATED (cello): the endpin on the floor, the instrument leaning back 25°
 *     toward the player; a 6° lean to the player's LEFT is added so the
 *     neck passes the left ear (the proposal's 10° turn is left out: the top
 *     faces the audience square-on). The player is placed FROM the
 *     instrument — knees against the lower bouts, the chest against the
 *     upper back — because the proposal's hips (x = −450 at a 25° lean)
 *     would sit inside the instrument (CORRECTIONS_LOG B-07).
 *   STANDING (bass): the endpin on the floor, leaning back 15° (the
 *     proposal's 20° turn left out); the player stands behind it, to its
 *     right, the bass's back against the left of the player's body.
 *
 * Frame B (bowedSpec.ts) is placed by three unit axes in the lesson frame,
 * kept LEFT-handed like the lesson frame (det = +1): on every member the
 * highest string sits on the treble side as the instrument is built — the
 * violinist's right, the cellist's and bassist's LEFT (the low string is on
 * the bow-arm side there).
 *
 * Pure: plain numbers. The solids (bowedModel.ts), the art and the tests
 * read the same posture, so the drawing, the collisions and the zones agree.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { archAt, halfWidth, stationsOf, stringZ, type BowedSpec, type Stations } from './bowedSpec.ts';

export type PostureKind = 'underChin' | 'seated' | 'standing';
export type Axes = { x: Vec3; y: Vec3; z: Vec3 };
export type BPoint = { x: number; y: number; z: number };

export type Skeleton = {
  head: Vec3;
  headR: number;
  /** Where the head faces (unit). */
  face: Vec3;
  neck: Vec3;
  chest: Vec3;
  pelvis: Vec3;
  shoulderL: Vec3;
  shoulderR: Vec3;
  elbowL: Vec3;
  elbowR: Vec3;
  handL: Vec3;
  handR: Vec3;
  hipL: Vec3;
  hipR: Vec3;
  kneeL: Vec3;
  kneeR: Vec3;
  ankleL: Vec3;
  ankleR: Vec3;
  toeL: Vec3;
  toeR: Vec3;
};

/** The bow as drawn (mid-stroke) and as swept. */
export type BowPose = {
  /** The middle of the contact travel, on the strings. */
  contact: Vec3;
  /** Unit, across the strings toward the FROG (the bow hand). */
  dir: Vec3;
  /** Unit, the stick's side of the hair (out of the top). */
  up: Vec3;
  /** +1: the frog toward frame B +y (violin, viola); −1 (cello, bass). */
  frogSide: 1 | -1;
  /** The drawn bow: its tip and frog ends (on the hair line). */
  tip: Vec3;
  frog: Vec3;
  /** Its hair length (the bass's is sourced; else 0.86 × the bow). */
  hair: number;
};

export type Posture = {
  spec: BowedSpec;
  st: Stations;
  kind: PostureKind;
  ax: Axes;
  /** The floor (y, lesson frame). */
  floorY: number;
  player: Skeleton;
  bow: BowPose;
  /** The bow hand at the frog, the middle and the tip of a stroke, with its
   *  elbow (the bow-arm envelope). */
  strokes: { hand: Vec3; elbow: Vec3 }[];
  endpinTip?: Vec3;
  /** The chair (seated): its seat box and four legs. */
  chair?: { seat: { min: Vec3; max: Vec3 }; legs: [Vec3, Vec3][] };
};

/* ── small vector helpers (the engine never takes a cross product; the
 *    posture does, to build a frame) ── */
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export function cross(a: Vec3, b: Vec3): Vec3 {
  return v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
export function det3(a: Vec3, b: Vec3, c: Vec3): number {
  return dot(a, cross(b, c));
}
const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));

/** Frame B → lesson frame (origin B0). */
export function toLesson(ax: Axes, p: BPoint): Vec3 {
  return add(add(scale(ax.x, p.x), scale(ax.y, p.y)), scale(ax.z, p.z));
}
/** Lesson frame → frame B. */
export function toB(ax: Axes, p: Vec3): BPoint {
  return { x: dot(p, ax.x), y: dot(p, ax.y), z: dot(p, ax.z) };
}

/** Make y the treble axis so the frame is left-handed like the lesson frame. */
function axesFrom(x: Vec3, zHint: Vec3): Axes {
  const z = norm(sub(zHint, scale(x, dot(zHint, x))));
  let y = norm(cross(z, x));
  if (det3(x, y, z) < 0) y = scale(y, -1);
  return { x, y, z };
}

/**
 * Two-bone reach (shoulder → elbow → hand), the elbow bent toward `pole`.
 * Illustrative arm lengths (no source gives the player's body).
 */
export function elbowOf(s: Vec3, h: Vec3, upper: number, fore: number, pole: Vec3): Vec3 {
  const d = sub(h, s);
  const L = Math.min(len(d), upper + fore - 1);
  const u = norm(d);
  const a = (upper * upper - fore * fore + L * L) / (2 * L);
  const hgt = Math.sqrt(Math.max(0, upper * upper - a * a));
  let p = sub(pole, scale(u, dot(pole, u)));
  p = len(p) < 1e-6 ? norm(cross(u, v(0, 0, 1))) : norm(p);
  return add(add(s, scale(u, a)), scale(p, hgt));
}

const UPPER_ARM = 290;
const FOREARM = 300;

/** The bow pose at mid-stroke, and the hand at the frog / middle / tip. */
function bowOf(spec: BowedSpec, st: Stations, ax: Axes, frogSide: 1 | -1): BowPose {
  const c = toLesson(ax, { x: st.contactX, y: 0, z: stringZ(spec, st.contactX) + 2 });
  const dir = scale(ax.y, frogSide);
  const up = ax.z;
  const hair = spec.bowHair?.mm ?? spec.bow.mm * 0.86;
  // Mid-stroke: the contact at the middle of the hair.
  const frog = add(c, scale(dir, hair * 0.5));
  const tip = sub(c, scale(dir, hair * 0.5 + (spec.bow.mm - hair) * 0.12));
  return { contact: c, dir, up, frogSide, tip, frog, hair };
}

function strokesOf(bow: BowPose, shoulder: Vec3, pole: Vec3): { hand: Vec3; elbow: Vec3 }[] {
  return [0.06, 0.5, 1].map((k) => {
    const hand = add(add(bow.contact, scale(bow.dir, Math.max(40, bow.hair * k))), scale(bow.up, 28));
    return { hand, elbow: elbowOf(shoulder, hand, UPPER_ARM, FOREARM, pole) };
  });
}

/* ── UNDER THE CHIN (violin, viola) ── */
export function underChin(spec: BowedSpec, tailDrop = 0): Posture {
  const st = stationsOf(spec);
  const D = Math.PI / 180;
  // The research frame (floor origin) — the engine's axes.
  const tailW = v(0, -1450 + tailDrop, 0);
  const fwdLeft = v(Math.cos(45 * D), 0, -Math.sin(45 * D));
  const x = norm(add(scale(fwdLeft, Math.cos(10 * D)), v(0, -Math.sin(10 * D), 0)));
  const flat = axesFrom(x, v(0, -1, 0));
  // Roll the top 30° toward the player's right (the treble side down).
  const r = 30 * D;
  const z = norm(add(scale(flat.z, Math.cos(r)), scale(flat.y, Math.sin(r))));
  const ax = axesFrom(x, z);
  const B0w = sub(tailW, scale(ax.x, st.tailX));
  const L = (p: Vec3) => sub(p, B0w);
  const floorY = -B0w.y;
  const zm = 10; // the player's midline: the tail sits at the throat
  const head = L(v(-60, -1600 + tailDrop, -80));
  const neck = L(v(-80, -1462 + tailDrop, zm));
  const chest = L(v(-95, -1300 + tailDrop, zm));
  const pelvis = L(v(-70, -960, zm));
  const shoulderL = L(v(-85, -1425 + tailDrop, zm - 185));
  const shoulderR = L(v(-85, -1425 + tailDrop, zm + 185));
  const handL = toLesson(ax, { x: st.nutX - 32, y: -4, z: -30 });
  const elbowL = elbowOf(shoulderL, handL, UPPER_ARM, FOREARM, v(0.1, 1, 0.45));
  const bow = bowOf(spec, st, ax, 1);
  const handR = add(bow.frog, scale(bow.up, 28));
  const poleR = v(-0.1, 1, 0.55);
  const elbowR = elbowOf(shoulderR, handR, UPPER_ARM, FOREARM, poleR);
  const player: Skeleton = {
    head,
    headR: 105,
    face: norm(v(0.85, 0.35, -0.4)),
    neck,
    chest,
    pelvis,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL: L(v(-70, -945, zm - 95)),
    hipR: L(v(-70, -945, zm + 95)),
    kneeL: L(v(-45, -505, zm - 105)),
    kneeR: L(v(-45, -505, zm + 105)),
    ankleL: L(v(-75, -80, zm - 115)),
    ankleR: L(v(-75, -80, zm + 115)),
    toeL: L(v(95, -22, zm - 150)),
    toeR: L(v(95, -22, zm + 150)),
  };
  return { spec, st, kind: 'underChin', ax, floorY, player, bow, strokes: strokesOf(bow, shoulderR, poleR) };
}

/* ── SEATED (cello) ── */
export function seated(spec: BowedSpec): Posture {
  const st = stationsOf(spec);
  const D = Math.PI / 180;
  const lean = 25 * D;
  const side = 6 * D;
  const x = norm(v(-Math.sin(lean) * Math.cos(side), -Math.cos(lean) * Math.cos(side), -Math.sin(side)));
  const ax = axesFrom(x, v(Math.cos(lean), -Math.sin(lean), 0));
  const E = v(0, 0, 0); // the endpin's tip on the floor (world)
  const rib = spec.rib.mm;
  const collarW = add(E, scale(ax.x, spec.endpin!.mm));
  const tailMid = add(collarW, scale(ax.x, spec.collar!.mm));
  const B0w = add(sub(tailMid, scale(ax.x, st.tailX)), scale(ax.z, rib / 2));
  const L = (p: Vec3) => sub(p, B0w);
  const B = (p: BPoint) => toLesson(ax, p);
  const floorY = -B0w.y;
  const xl = st.tailX + spec.body.mm * spec.stations.lower;
  const xu = st.tailX + spec.body.mm * spec.stations.upper;
  const Wl = spec.lower.mm / 2;
  // Knees against the lower bouts' sides (frame-B +y is the player's left).
  const kneeL = B({ x: xl + 40, y: Wl + 55, z: -rib * 0.5 });
  const kneeR = B({ x: xl + 40, y: -(Wl + 55), z: -rib * 0.5 });
  const seatY = floorY - 460; // the chair (proposal: seat 460 high)
  const hipL = v(kneeL.x - 410, seatY - 85, kneeL.z * 0.45);
  const hipR = v(kneeR.x - 410, seatY - 85, kneeR.z * 0.45);
  const pelvis = lerp(hipL, hipR, 0.5);
  // The chest just behind the upper back.
  const back = B({ x: xu - 40, y: 0, z: -rib - spec.archBack.mm - 40 });
  const chest = v(back.x - 105, back.y + 15, 0);
  const neck = v(chest.x + 15, chest.y - 290, 8);
  const head = v(neck.x + 30, neck.y - 165, 28);
  const shoulderL = v(neck.x - 15, neck.y + 45, -182);
  const shoulderR = v(neck.x - 15, neck.y + 45, 182);
  const handL = B({ x: st.nutX - 70, y: 18, z: -38 });
  const elbowL = elbowOf(shoulderL, handL, UPPER_ARM + 20, FOREARM + 20, v(0.3, 0.6, -1));
  const bow = bowOf(spec, st, ax, -1);
  const handR = add(bow.frog, scale(bow.up, 30));
  const poleR = v(-0.2, 0.7, 1);
  const elbowR = elbowOf(shoulderR, handR, UPPER_ARM + 20, FOREARM + 20, poleR);
  const ankle = (k: Vec3, out: number) => v(k.x + 70, floorY - 85, k.z + out);
  const ankleL = ankle(kneeL, -40);
  const ankleR = ankle(kneeR, 40);
  const player: Skeleton = {
    head,
    headR: 105,
    face: norm(v(0.9, 0.25, 0.1)),
    neck,
    chest,
    pelvis,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL,
    hipR,
    kneeL,
    kneeR,
    ankleL,
    ankleR,
    toeL: v(ankleL.x + 170, floorY - 22, ankleL.z - 25),
    toeR: v(ankleR.x + 170, floorY - 22, ankleR.z + 25),
  };
  // The chair: a seat under the hips, its front edge behind the knees.
  const seat = { min: v(pelvis.x - 250, seatY - 4, -235), max: v(pelvis.x + 190, seatY + 26, 235) };
  const legs: [Vec3, Vec3][] = [
    [v(seat.min.x + 25, seatY + 26, -205), v(seat.min.x + 15, floorY, -215)],
    [v(seat.min.x + 25, seatY + 26, 205), v(seat.min.x + 15, floorY, 215)],
    [v(seat.max.x - 25, seatY + 26, -205), v(seat.max.x - 10, floorY, -215)],
    [v(seat.max.x - 25, seatY + 26, 205), v(seat.max.x - 10, floorY, 215)],
  ];
  return { spec, st, kind: 'seated', ax, floorY, player, bow, strokes: strokesOf(bow, shoulderR, poleR), endpinTip: L(E), chair: { seat, legs } };
}

/* ── STANDING (double bass) ── */
export function standing(spec: BowedSpec, hands: 'pluck' | 'bow'): Posture {
  const st = stationsOf(spec);
  const D = Math.PI / 180;
  const lean = 15 * D;
  const x = norm(v(-Math.sin(lean), -Math.cos(lean), 0));
  const ax = axesFrom(x, v(Math.cos(lean), -Math.sin(lean), 0));
  const E = v(0, 0, 0);
  const rib = spec.rib.mm;
  const tailMid = add(E, scale(ax.x, spec.endpin!.mm + spec.collar!.mm));
  const B0w = add(sub(tailMid, scale(ax.x, st.tailX)), scale(ax.z, rib / 2));
  const L = (p: Vec3) => sub(p, B0w);
  const B = (p: BPoint) => toLesson(ax, p);
  const floorY = -B0w.y;
  const xu = st.tailX + spec.body.mm * spec.stations.upper;
  const Wu = spec.upper.mm / 2;
  // The bass's back, toward the player's right, rests against the left of
  // the player's body (frame-B −y is the player's right).
  const contact = B({ x: xu - 120, y: -Wu * 0.5, z: -rib - spec.archBack.mm });
  const zm = contact.z + 150;
  const chest = v(contact.x - 95, floorY - 1300, zm);
  const pelvis = v(chest.x + 10, floorY - 960, zm);
  const neck = v(chest.x + 5, floorY - 1462, zm - 10);
  const head = v(neck.x + 20, floorY - 1610, zm - 30);
  const shoulderL = v(neck.x - 10, neck.y + 35, zm - 185);
  const shoulderR = v(neck.x - 10, neck.y + 35, zm + 185);
  const handL = B({ x: st.nutX - 150, y: -12, z: -60 });
  const elbowL = elbowOf(shoulderL, handL, UPPER_ARM + 20, FOREARM + 20, v(0.2, 0.7, -1));
  const bow = bowOf(spec, st, ax, -1);
  const poleR = v(-0.3, 0.8, 1);
  const pluckHand = B({ x: 200, y: -25, z: stringZ(spec, 200) + 40 });
  const handR = hands === 'bow' ? add(bow.frog, scale(bow.up, 30)) : pluckHand;
  const elbowR = elbowOf(shoulderR, handR, UPPER_ARM + 20, FOREARM + 20, poleR);
  const player: Skeleton = {
    head,
    headR: 105,
    face: norm(v(0.95, 0.2, -0.15)),
    neck,
    chest,
    pelvis,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL: v(pelvis.x, pelvis.y + 18, zm - 95),
    hipR: v(pelvis.x, pelvis.y + 18, zm + 95),
    kneeL: v(pelvis.x + 25, floorY - 505, zm - 110),
    kneeR: v(pelvis.x + 25, floorY - 505, zm + 110),
    ankleL: v(pelvis.x - 5, floorY - 80, zm - 125),
    ankleR: v(pelvis.x - 5, floorY - 80, zm + 135),
    toeL: v(pelvis.x + 160, floorY - 22, zm - 165),
    toeR: v(pelvis.x + 160, floorY - 22, zm + 175),
  };
  return { spec, st, kind: 'standing', ax, floorY, player, bow, strokes: strokesOf(bow, shoulderR, poleR), endpinTip: L(E) };
}

/* ── frame-B anchors every lesson names ── */
export function anchorsOf(p: Posture) {
  const { spec, st, ax } = p;
  const B = (q: BPoint) => toLesson(ax, q);
  const fhX = (spec.fholeX[0] + spec.fholeX[1]) / 2;
  const xl = st.tailX + spec.body.mm * spec.stations.lower;
  return {
    /** The bridge's top (the strings cross it). */
    bridgeTop: B({ x: 0, y: 0, z: spec.bridgeH.mm }),
    /** The bridge's foot line on the arched top. */
    bridgeFoot: B({ x: 0, y: 0, z: archAt(spec, 0) }),
    /** Where the bow meets the strings (the middle of its travel). */
    contact: p.bow.contact,
    /** The f-holes' middles, treble (+y) and bass (−y). */
    fholeT: B({ x: fhX, y: spec.fholeY.mm, z: archAt(spec, fhX, spec.fholeY.mm) }),
    fholeB: B({ x: fhX, y: -spec.fholeY.mm, z: archAt(spec, fhX, -spec.fholeY.mm) }),
    /** The ribs at the lower bout's widest point. */
    ribT: B({ x: xl, y: halfWidth(spec, xl), z: -spec.rib.mm / 2 }),
    ribB: B({ x: xl, y: -halfWidth(spec, xl), z: -spec.rib.mm / 2 }),
    /** The top's centre (a quarter of the body behind the bridge). */
    topCentre: B({ x: -0.25 * spec.body.mm * 0.5, y: 0, z: archAt(spec, -0.125 * spec.body.mm) }),
    /** The tail end and the scroll. */
    tail: B({ x: st.tailX, y: 0, z: 0 }),
    scroll: B({ x: st.scrollX - 20, y: 0, z: stringZ(spec, st.nutX) }),
  };
}
