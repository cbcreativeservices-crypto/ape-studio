/**
 * THE BRASS FAMILY'S POSTURE — one horn and its standing player, built in
 * frame H (brassSpec.ts) and turned into the LESSON frame, which keeps the
 * floor level: origin = the bell rim's centre, +x toward the audience, +y
 * down, +z to the player's right.
 *
 * Everything the art draws, the solids collide with and the zones are
 * measured from comes from here, so they agree:
 *   • the TUBES — every length of tubing as a centre line and a radius
 *     (bell tail, bell bow, leadpipe, tuning slides, valve slides; the
 *     trombone's slide legs, crook, bell section and gooseneck; the bass
 *     trombone's valve loops);
 *   • the VALVES (three piston casings and their buttons) or the ROTORS (the
 *     bass trombone's two, with the left thumb's triggers);
 *   • the SLIDE drawn at a position, and its travel to 7th (DERIVED);
 *   • the PLAYER — the bowed family's skeleton type, so the shared figure
 *     draws it — standing, lips on the mouthpiece, the hands on the horn
 *     (and the slide arm at 1st, 4th and 7th).
 *
 * Every placement that no source gives is a drawing default (the proposal's
 * numbers where it has them: trumpet/GEOMETRY_PROPOSAL.md §2, §4;
 * trombone/GEOMETRY_PROPOSAL.md §1–§2). Lips 1550 mm above the floor
 * (proposal §4, standing). Pure.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import type { Skeleton } from '../bowed/posture.ts';
import { elbowOf } from '../bowed/posture.ts';
import { SLIDE, SLIDE_7TH, slideTravel, type BrassSpec } from './brassSpec.ts';

const D = Math.PI / 180;
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export type TubeTone = 'brass' | 'nickel' | 'dark';
/** A length of tube: its centre line (lesson frame) and its outside radius. */
export type Tube = { id: string; part: string; pts: Vec3[]; r: number; tone?: TubeTone };

export type HornPose = {
  spec: BrassSpec;
  /** Frame H → lesson frame (the bell's dip turned about z). */
  H: (p: Vec3) => Vec3;
  /** The bell axis (unit, lesson frame): the way the bell fires. */
  axis: Vec3;
  /** "Up" across the bell (unit, lesson frame; −y when level). */
  up: Vec3;
  /** The floor's y (lesson frame). */
  floorY: number;
  tubes: Tube[];
  /** Piston casings: centre, radius, half-height along `up`, and the button on top. */
  valves: { c: Vec3; r: number; h: number; button: Vec3 }[];
  /** The bass trombone's rotors (axis ∥ z) and its thumb triggers. */
  rotors: { c: Vec3; r: number }[];
  triggers: Vec3[];
  mouthpiece: { cup: Vec3; shank: Vec3; r: number };
  lips: Vec3;
  /** The trombone's slide: travel drawn, the crook's centre at that travel,
   *  the brace (the right hand's grip), and the legs' y and z. */
  slide: null | { s: number; crook: Vec3; brace: Vec3; outerFrom: Vec3; legs: [number, number]; z: number; receiver: Vec3 };
  player: Skeleton;
  /** The right (slide) arm at 1st, 4th and 7th position. */
  slideArm: { hand: Vec3; elbow: Vec3; s: number }[];
};

const UPPER = 340;
const FORE = 360;
/** Standing heights above the floor (mm) — a drawing default adult. */
const H_ = { lips: 1550, head: 1630, neck: 1475, shoulder: 1420, chest: 1270, pelvis: 965, hip: 950, knee: 510, ankle: 82, toe: 24 };

/** The player standing, lips at `lips`, facing +x; the hands supplied. */
function standingPlayer(lips: Vec3, floorY: number, zMid: number, handL: Vec3, handR: Vec3, shoulderFwd: number, poleL: Vec3, poleR: Vec3): Skeleton {
  const Y = (h: number) => floorY - h;
  const x0 = lips.x;
  const head = v(x0 - 78, Y(H_.head), zMid);
  const neck = v(x0 - 110, Y(H_.neck), zMid);
  const chest = v(x0 - 150, Y(H_.chest), zMid);
  const pelvis = v(x0 - 150, Y(H_.pelvis), zMid);
  const shoulderL = v(x0 - 130, Y(H_.shoulder), zMid - 185);
  const shoulderR = v(x0 - 130 + shoulderFwd, Y(H_.shoulder), zMid + 185);
  const elbowL = elbowOf(shoulderL, handL, UPPER, FORE, poleL);
  const elbowR = elbowOf(shoulderR, handR, UPPER, FORE, poleR);
  return {
    head,
    headR: 105,
    face: norm(v(1, 0.18, 0)),
    neck,
    chest,
    pelvis,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL: v(x0 - 150, Y(H_.hip), zMid - 95),
    hipR: v(x0 - 150, Y(H_.hip), zMid + 95),
    kneeL: v(x0 - 125, Y(H_.knee), zMid - 105),
    kneeR: v(x0 - 125, Y(H_.knee), zMid + 105),
    ankleL: v(x0 - 155, Y(H_.ankle), zMid - 115),
    ankleR: v(x0 - 155, Y(H_.ankle), zMid + 115),
    toeL: v(x0 + 15, Y(H_.toe), zMid - 150),
    toeR: v(x0 + 15, Y(H_.toe), zMid + 150),
  };
}

/** An arc of points (frame H) about c, radius r, in the x–y plane, a0 → a1 (deg from +x toward +y). */
function arcXY(c: Vec3, r: number, a0: number, a1: number, n = 10): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D;
    out.push(v(c.x + r * Math.cos(a), c.y + r * Math.sin(a), c.z));
  }
  return out;
}
/** A smooth joining curve from a to b (frame H), leaving along da and arriving along db. */
function bend(a: Vec3, da: Vec3, b: Vec3, db: Vec3, k: number, n = 12): Vec3[] {
  const p1 = add(a, scale(norm(da), k));
  const p2 = sub(b, scale(norm(db), k));
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(add(add(scale(a, u * u * u), scale(p1, 3 * u * u * t)), add(scale(p2, 3 * u * t * t), scale(b, t * t * t))));
  }
  return out;
}

/* ── the VALVED horns: trumpet, flugelhorn ── */

export function valvedPose(spec: BrassSpec): HornPose {
  const dip = spec.dip.mm * D;
  const ax = v(Math.cos(dip), Math.sin(dip), 0);
  const upH = v(Math.sin(dip), -Math.cos(dip), 0); // frame H −y in the lesson frame
  const H = (p: Vec3): Vec3 => add(add(scale(ax, p.x), scale(upH, -p.y)), v(0, 0, p.z));
  const O = spec.overall.mm;
  const F = spec.flare.mm;
  const tr = spec.bore.mm / 2 + 1.2; // tube outside radius
  const flugel = spec.id === 'flugelhorn';
  // Drawing defaults, scaled from the proposal's trumpet (O 480: valves at −300).
  const xv = flugel ? -O * 0.6 : -O * 0.625; // the middle valve
  const pitch = 26; // casing spacing
  const yv = 22; // casing centre, below the bell axis
  const hv = 52; // casing half-height
  const zLead = 20; // the leadpipe, on the player's right of the valves
  const zBell = -20; // the bell tail, on the left
  const cupX = -O - (flugel ? 72 : 0);
  const yLead = -6;
  const bowX = flugel ? -O + 30 : -O + 42; // the bell bow, near the mouthpiece end
  const tubes: Tube[] = [];
  const T = (id: string, part: string, ptsH: Vec3[], r = tr, tone?: TubeTone) => tubes.push({ id, part, pts: ptsH.map(H), r, tone });
  // The bell tail: from the flare's start back to the bow (drawn by the bell itself in front of −F).
  T('bellTail', 'br.bell', [v(-F, 0, zBell * 0.4), v(bowX, 0, zBell)]);
  // The bell bow: a U down and forward under the valves.
  T('bellBow', 'br.bell', arcXY(v(bowX, 46, zBell), 46, 270, 90, 14));
  T('bellReturn', 'br.valves', [v(bowX, 92, zBell), v(xv - pitch - 12, 92, zBell * 0.5), v(xv - pitch, yv + hv - 6, 0)]);
  // The leadpipe: from the receiver forward past the valves to the main tuning slide.
  const recX = cupX + (flugel ? 62 : 70);
  const leadEnd = flugel ? xv - pitch - 40 : -O * 0.24;
  T('leadpipe', 'br.leadpipe', [v(recX, yLead, zLead), v(leadEnd, yLead, zLead)], tr * 0.92);
  if (!flugel) {
    // The main tuning slide: a U at the front, under the bell flare's start.
    T('mainSlide', 'br.slides', [...arcXY(v(leadEnd, yLead + 38, zLead), 38, 270, 450, 14).map((p) => v(leadEnd + (p.x - leadEnd), p.y, zLead)), v(xv + pitch + 6, yLead + 76, zLead * 0.6), v(xv + pitch, yv + 10, 0)]);
  } else {
    // A flugelhorn's tuning slide sits in the leadpipe: down into the valves.
    T('mainSlide', 'br.slides', bend(v(leadEnd, yLead, zLead), v(1, 0, 0), v(xv - pitch - 12, yv + 6, zLead * 0.5), v(1, 0.4, 0), 26));
  }
  // Valve slides: the 1st in front, the 3rd behind with its ring, the 2nd short, below.
  T('slide1', 'br.slides', [v(xv + pitch, yv + 30, 6), v(xv + pitch + 58, yv + 30, 6), v(xv + pitch + 58, yv + 58, 6), v(xv + pitch, yv + 58, 6)], tr * 0.9, 'nickel');
  T('slide3', 'br.slides', [v(xv - pitch, yv + 34, 6), v(xv - pitch - 76, yv + 34, 6), v(xv - pitch - 76, yv + 64, 6), v(xv - pitch, yv + 64, 6)], tr * 0.9, 'nickel');
  T('slide2', 'br.slides', [v(xv - 6, yv + hv, 4), v(xv - 6, yv + hv + 22, 4), v(xv + 6, yv + hv + 22, 4), v(xv + 6, yv + hv, 4)], tr * 0.85, 'nickel');
  // The flare's start to the valves (the bell tube passing on the left).
  const valves = [-1, 0, 1].map((k) => {
    const c = H(v(xv + k * pitch, yv, 0));
    return { c, r: 12, h: hv, button: H(v(xv + k * pitch, yv - hv - 22, 0)) };
  });
  const cup = H(v(cupX, yLead, zLead));
  const shank = H(v(recX + 8, yLead, zLead));
  const lips = H(v(cupX - 8, yLead, zLead));
  const floorY = lips.y + H_.lips;
  // The hands: the left wraps the casings from below-left, the right's
  // fingers lie on the buttons from the right.
  const handL = H(v(xv - 4, yv + 30, -34));
  const handR = H(v(xv - 18, yv - hv - 10, 46));
  const player = standingPlayer(lips, floorY, lips.z, handL, handR, 0, v(0.25, 1, -0.7), v(0.15, 1, 0.75));
  return {
    spec,
    H,
    axis: ax,
    up: upH,
    floorY,
    tubes,
    valves,
    rotors: [],
    triggers: [],
    mouthpiece: { cup, shank, r: tr * 1.55 },
    lips,
    slide: null,
    player,
    slideArm: [],
  };
}

/* ── the SLIDE horns: tenor and bass trombone ── */

/** The trombone at slide travel `s` (mm; 0 = 1st position). */
export function slidePose(spec: BrassSpec, s = 0): HornPose {
  const H = (p: Vec3): Vec3 => p; // played level
  const tr = spec.bore.mm / 2 + 1.4;
  const F = spec.flare.mm;
  const zS = SLIDE.right.mm;
  const yU = SLIDE.below.mm; // the mouthpiece leg
  const yL = yU + SLIDE.spacing.mm; // the bell-side leg
  const ahead = SLIDE.ahead.mm;
  const cupX = ahead - SLIDE.closed.mm;
  const recX = cupX + 52;
  const braceX = cupX + 92 + s; // the right hand's grip, on the outer slide
  const outerFrom = braceX - 22;
  const crookX = ahead + s;
  const back = -SLIDE.bellSection.mm;
  const bass = spec.id === 'bass';
  const tubes: Tube[] = [];
  const T = (id: string, part: string, pts: Vec3[], r = tr, tone?: TubeTone) => tubes.push({ id, part, pts, r, tone });
  // The bell section: tail back over the left shoulder to the tuning slide, and back to the gooseneck.
  T('bellTail', 'br.bell', [v(-F, 0, 0), v(back, 0, 0)], tr * 0.95);
  T('tuning', 'br.slides', [...arcXY(v(back, 32, 0), 32, 270, 90, 12), v(back + 10, 64, 0)], tr * 0.95, 'nickel');
  // The gooseneck: from the slide's bell-side leg, back and up across to the return tube.
  const gooseTo = v(recX - 36, 64, 0);
  T('gooseneck', 'br.bell', bend(v(recX + 6, yL, zS), v(-1, 0, 0), gooseTo, v(-1, 0, 0), 40, 14), tr * 0.95);
  T('bellReturn', 'br.bell', [gooseTo, v(back + 10, 64, 0)], tr * 0.95);
  // The inner slide (fixed): both legs from the receiver to the crook's travel.
  T('innerU', 'br.slide', [v(recX, yU, zS), v(outerFrom + 4, yU, zS)], tr * 0.9, 'nickel');
  T('innerL', 'br.slide', [v(recX + 6, yL, zS), v(outerFrom + 4, yL, zS)], tr * 0.9, 'nickel');
  // The outer slide (moves with s) and its crook.
  T('outerU', 'br.slide', [v(outerFrom, yU, zS), v(crookX, yU, zS)], tr * 1.05);
  T('outerL', 'br.slide', [v(outerFrom, yL, zS), v(crookX, yL, zS)], tr * 1.05);
  T('crook', 'br.slide', arcXY(v(crookX, (yU + yL) / 2, zS), (yL - yU) / 2, -90, 90, 14), tr * 1.05);
  // The braces: the slide's grip, the inner slide's brace and the bell brace.
  T('slideBrace', 'br.slide', [v(braceX, yU, zS), v(braceX, yL, zS)], 4.5, 'nickel');
  T('innerBrace', 'br.slide', [v(recX + 40, yU, zS), v(recX + 40, yL, zS)], 4, 'nickel');
  T('bellBrace', 'br.bell', [v(recX + 46, yU - 4, zS - 4), v(recX + 46, 4, 2)], 4, 'nickel');
  const rotors: { c: Vec3; r: number }[] = [];
  const triggers: Vec3[] = [];
  if (bass) {
    // Two rotors in the return tube behind the gooseneck, and their loops
    // hanging below the bell section (positions: drawing defaults).
    const r1 = v(back + 150, 64, 0);
    const r2 = v(back + 230, 64, 0);
    rotors.push({ c: r1, r: 21 }, { c: r2, r: 19 });
    T('loopF', 'br.valves', [r1, ...arcXY(v(r1.x + 10, r1.y + 78, -14), 78, 270, 630, 30).map((p) => v(p.x, p.y, p.z)), v(r1.x + 30, r1.y, -6)], tr * 0.95);
    T('loopGb', 'br.valves', [r2, ...arcXY(v(r2.x + 20, r2.y + 52, 18), 52, 250, 600, 24), v(r2.x + 26, r2.y, 8)], tr * 0.9);
    triggers.push(v(recX - 6, 74, 36), v(recX + 20, 92, 40));
  }
  const cup = v(cupX, yU, zS);
  const shank = v(recX + 6, yU, zS);
  const lips = v(cupX - 8, yU, zS);
  const floorY = lips.y + H_.lips;
  const handFor = (t: number) => v(cupX + 92 + t, (yU + yL) / 2 + 6, zS + 46);
  // The left hand holds the bell brace and the inner slide, near the mouthpiece.
  const handL = v(recX + 52, (yU + 4) / 2 + 30, (zS + 2) / 2);
  const poleR = v(0, 1, 0.9);
  const player = standingPlayer(lips, floorY, lips.z, handL, handFor(s), 130, v(0.2, 1, -0.6), poleR);
  const slideArm = [0, slideTravel(4), SLIDE_7TH].map((t) => {
    const hand = handFor(t);
    return { hand, elbow: elbowOf(player.shoulderR, hand, UPPER, FORE, poleR), s: t };
  });
  return {
    spec,
    H,
    axis: v(1, 0, 0),
    up: v(0, -1, 0),
    floorY,
    tubes,
    valves: [],
    rotors,
    triggers,
    mouthpiece: { cup, shank, r: tr * 1.5 },
    lips,
    slide: { s, crook: v(crookX, (yU + yL) / 2, zS), brace: v(braceX, (yU + yL) / 2, zS), outerFrom: v(outerFrom, yU, zS), legs: [yU, yL], z: zS, receiver: v(recX, yU, zS) },
    player,
    slideArm,
  };
}

export function hornPose(spec: BrassSpec, s = 0): HornPose {
  return spec.kind === 'slide' ? slidePose(spec, s) : valvedPose(spec);
}

/** Sample points on the bell's surface ring at frame-H x (for the art and the solids). */
export function bellRing(P: HornPose, xH: number, r: number, n = 24): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(P.H(v(xH, r * Math.cos(a), r * Math.sin(a))));
  }
  return out;
}
