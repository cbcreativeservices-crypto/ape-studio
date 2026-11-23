/**
 * EVERY KIT STROKE THE LESSONS DRAW (owner 2026-11-22: "look for other labs
 * with drum sticks and make sure they are not all crazy like this example. It
 * should look like normal stick tech. usage").
 *
 * One DrummerSpec per picture — both hands and the body — solved by
 * stickPose.ts. The arts draw these and test/stickTechniqueKit_20261122.test.ts
 * measures these, so a picture and its check can never drift apart. Pure.
 *
 * How each was chosen (numbers tuned so the arm is relaxed: elbow ≈ 90–135°,
 * wrist bend ≤ 40°, the forearm falling gently to a drum, the stick at a low
 * angle to what it strikes):
 *   • DRUMS: the bead near the middle of the head, the stick 10–16° to the
 *     head (a tilted tom against its own head), the fist a few cm over the rim.
 *     Both sticks on the snare make a V of ≈ 85° with the beads 4 cm apart.
 *   • HI-HAT: the right hand crosses over the left (a right-handed kit), the
 *     stick's tip on the top cymbal near its edge at a low angle.
 *   • RIDE: the tip on the bow, the stick ≈ 10° to the plate.
 *   • CRASH and CHINA: a glancing blow with the stick's SHOULDER on the edge,
 *     the tip over the plate; the arm reaches up and forward (the shoulder
 *     girdle comes forward, `reachR`), never a longer stick.
 *   • SPLASH: a light glancing stroke, the tip at the edge.
 *   • While the right hand plays a tom, the left stick is lifted off the snare
 *     (pivoted at the wrist, the hand where it was); otherwise the left plays
 *     the snare (the backbeat).
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { KIT_DRUMS } from '../kitPlanModel.ts';
import { cymbalFrame, KIT_PLACED_CYMBALS, type PlacedCymbal } from '../cymbals/cymbalSpec.ts';
import { frameOf, pointOn, type PlacedDrum } from '../drums/drumSpec.ts';
import type { FxPlaced } from '../cymbals/cymbalFx.ts';
import { HAT, STRIKE as HAT_STRIKE } from '../../i01aHiHat/model.ts';
import { C1, C2, STRIKE1, STRIKE2 } from '../../i01cCrash/model.ts';
import { INV, STRIKE_INV, STRIKE_UP, UP } from '../../i01eChina/model.ts';
import { RIDE, STRIKE_BOW } from '../../i01bRide/model.ts';
import { ARM, PIGGY, STRIKE_ARM, STRIKE_PIG } from '../../i01dSplash/model.ts';
import { SNARE_HEAD, type DrummerSpec, type StrokeSpec, type Surface } from './stickPose.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** A cymbal's top as a struck surface. */
export function cymbalSurface(p: PlacedCymbal | FxPlaced): Surface {
  const f = cymbalFrame(p as PlacedCymbal);
  return { c: f.c, n: f.n, R: f.R, kind: 'cymbal' };
}
/** A drum's batter head as a struck surface. */
export function drumSurface(d: PlacedDrum): Surface {
  const f = frameOf(d);
  return { c: f.c, n: f.n, R: f.R, kind: 'drum' };
}
/** A bead on a drum's head: r from the centre toward θ (the head's own
 *  frame: 180 = toward the player), its centre 5 mm over the head. */
export function onDrum(d: PlacedDrum, r: number, thetaDeg: number): Vec3 {
  const f = frameOf(d);
  const p = pointOn(f, r, thetaDeg, 0);
  return v3(p.x + f.n.x * 5, p.y + f.n.y * 5, p.z + f.n.z * 5);
}
const S0 = SNARE_HEAD.c;
/** A bead on the snare (dx forward, dz toward the drummer's right). */
const onSnare = (dx: number, dz: number): Vec3 => v3(S0.x + dx, S0.y - 5, S0.z + dz);

/* ── the left hand on the snare (its stroke for each body twist) ── */

const LEFT_AT = onSnare(45, -22);
const left = (twist: number): StrokeSpec =>
  twist >= 10
    ? { at: LEFT_AT, contact: 'bead', surface: SNARE_HEAD, heading: 25, elev: 16, pole: v3(-60, 300, -260) }
    : { at: LEFT_AT, contact: 'bead', surface: SNARE_HEAD, heading: 30, elev: 16, pole: v3(0, 300, -260) };
/** The left stick lifted 20° off the snare about the wrist (between strokes). */
const raisedLeft = (twist: number): StrokeSpec =>
  twist > 0
    ? { at: onSnare(45, 0), contact: 'bead', surface: SNARE_HEAD, heading: 30, elev: 16, pole: v3(0, 300, -260), raise: 20 }
    : { at: onSnare(45, 0), contact: 'bead', surface: SNARE_HEAD, heading: 25, elev: 16, pole: v3(-60, 300, -260), raise: 20 };

/* ── the pictures ── */

/** M02: both sticks on the snare, a V, the beads side by side just past the
 *  centre. */
export const SNARE_PAIR: DrummerSpec = {
  twist: 10,
  right: { at: onSnare(45, 20), contact: 'bead', surface: SNARE_HEAD, heading: -60, elev: 11, pole: v3(80, 300, 60) },
  left: { at: onSnare(55, -22), contact: 'bead', surface: SNARE_HEAD, heading: 25, elev: 16, pole: v3(-60, 300, -260) },
};

const TOM2 = KIT_DRUMS.tom2;
const FLOOR = KIT_DRUMS.floor;
/** M03 rack: the right stick on the 12 in tom between the centre and the
 *  player's edge (the arm reaches it); the left lifted. */
export const RACK_TOM: DrummerSpec = {
  lean: 5,
  twist: 5,
  right: { at: onDrum(TOM2, 55, 180), contact: 'bead', surface: drumSurface(TOM2), heading: -5, elev: -0.5, pole: v3(0, 300, 260) },
  left: raisedLeft(5),
};
/** M03 floor: the right stick on the floor tom near its centre (the chest
 *  turned a little toward it); the left lifted. */
export const FLOOR_TOM: DrummerSpec = {
  twist: -10,
  right: { at: onDrum(FLOOR, 30, 180), contact: 'bead', surface: drumSurface(FLOOR), heading: 10, elev: 13, pole: v3(0, 150, 60) },
  left: { ...raisedLeft(-10), pole: v3(0, 300, -260) },
};

/** I01a: the right hand crossed over the left, the tip on the top hat's edge
 *  at the lesson's strike point; the left on the snare. */
export const HIHAT_LESSON: DrummerSpec = {
  twist: 10,
  right: { at: HAT_STRIKE, contact: 'bead', surface: cymbalSurface(HAT), heading: -82, elev: 9, pole: v3(80, 150, 60) },
  // the left bead on the centre line: from above, the right bead on the hats'
  // near edge then sits clear of the left fist under it
  left: { ...left(10), at: onSnare(45, 0) },
};
/** The kit scene (M09–M11, the band and stage pictures): the same groove, the
 *  tip on the hats' right edge. */
const KH = KIT_PLACED_CYMBALS.hihat;
export const KIT_GROOVE: DrummerSpec = {
  twist: 10,
  right: { at: v3(KH.c.x + 50, KH.c.y - 14, KH.c.z + KH.spec.d.mm / 2 - 30), contact: 'bead', surface: cymbalSurface(KH), heading: -80, elev: 9, pole: v3(80, 150, 60) },
  left: left(10),
};

/** I01c: the shoulder on the 16 in crash's edge (a glancing blow). */
export const CRASH16: DrummerSpec = {
  twist: 10,
  reachR: 60,
  right: { at: STRIKE1, contact: 'shoulder', surface: cymbalSurface(C1), heading: -65, elev: -27.5, pole: v3(-60, 300, 260) },
  left: left(10),
};
/** I01c: the shoulder on the 18 in crash's edge. */
export const CRASH18: DrummerSpec = {
  twist: 5,
  reachR: 60,
  right: { at: STRIKE2, contact: 'shoulder', surface: cymbalSurface(C2), heading: 5, elev: -25, pole: v3(80, 150, 260) },
  left: left(5),
};
/** I01e: the shoulder on the China (upright: its shoulder area; turned over:
 *  near the edge). */
export const CHINA_UP: DrummerSpec = {
  lean: 5,
  twist: 5,
  reachR: 60,
  right: { at: STRIKE_UP, contact: 'shoulder', surface: cymbalSurface(UP), heading: 5, elev: -25, pole: v3(-60, 150, 260) },
  left: left(5),
};
export const CHINA_INV: DrummerSpec = {
  twist: 5,
  reachR: 60,
  right: { at: STRIKE_INV, contact: 'shoulder', surface: cymbalSurface(INV), heading: 5, elev: -25, pole: v3(-60, 150, 260) },
  left: left(5),
};
/** I01b: the tip on the ride's bow, held by the drummer (was a stick floating
 *  with no hand). */
export const RIDE_BOW: DrummerSpec = {
  right: { at: STRIKE_BOW, contact: 'bead', surface: cymbalSurface(RIDE), heading: 20, elev: 1, pole: v3(0, 300, 260) },
  left: left(0),
};
/** I01d: the tip at the arm splash's edge, held by the drummer. */
export const SPLASH_ON_ARM: DrummerSpec = {
  twist: 10,
  reachR: 30,
  right: { at: STRIKE_ARM, contact: 'bead', surface: cymbalSurface(ARM), heading: -55, elev: 2.5, pole: v3(-60, 150, 260) },
  left: left(10),
};
/** I01d: the tip at the edge of the splash on top of the 18 in crash — the
 *  player leans in and reaches up for it. */
export const SPLASH_ON_CRASH: DrummerSpec = {
  lean: 5,
  twist: 5,
  reachR: 60,
  right: { at: STRIKE_PIG, contact: 'bead', surface: cymbalSurface(PIGGY), heading: 5, elev: -6, pole: v3(0, 500, 150) },
  left: left(5),
};

/* ── the close-ups (a crop of the same drummer, moved to the close-up's tip) ── */

/** A drum close-up (M02/M03 sound pages): the M02 right-hand stroke. */
export const CLOSEUP_DRUM: DrummerSpec = SNARE_PAIR;
/** A cymbal close-up (the plate level in its own frame): a stroke onto a
 *  level plate in front and to the right, 15° to it. */
const LEVEL = { c: v3(-150, -614.6, 250), n: v3(0, -1, 0), R: 200, kind: 'cymbal' as const };
export const CLOSEUP_CYMBAL: DrummerSpec = {
  right: { at: v3(-150, -609.6, 250), contact: 'bead', surface: LEVEL, heading: -15, elev: 15, pole: v3(80, 150, 260) },
  left: left(0),
};

/** Every picture, by name (the test walks this). */
export const KIT_PICTURES: Record<string, DrummerSpec> = {
  SNARE_PAIR,
  RACK_TOM,
  FLOOR_TOM,
  HIHAT_LESSON,
  KIT_GROOVE,
  CRASH16,
  CRASH18,
  CHINA_UP,
  CHINA_INV,
  RIDE_BOW,
  SPLASH_ON_ARM,
  SPLASH_ON_CRASH,
  CLOSEUP_CYMBAL,
};
