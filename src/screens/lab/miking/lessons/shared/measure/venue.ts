/**
 * THE VENUE SEAT PLAN (BATCH6_RESEARCH_SUMMARY_PART2.md §3.5; loudspeaker_
 * measurement/GEOMETRY_PROPOSAL.md §2). Built once by Lab 6 group 5 (branch
 * lab6-g5) for F14; any later lesson that measures an installed system at
 * listener seats imports it. Pure; tested.
 *
 * Scene frame F (lessons/shared/field/sceneFrame.ts): millimetres, the
 * origin on the AUDIENCE FLOOR at the stage's front edge, centre line; +x
 * out into the audience, +y DOWN (the floor is y = 0), +z across.
 *
 *   mains     a left and a right main loudspeaker on stands at the stage's
 *             front corners
 *   sub       one subwoofer on the floor in front of the stage, centre
 *   fill      a small front fill on the stage lip, centre, for the first rows
 *   seats     ten rows with a centre aisle; a standing area at the back
 *
 * Every size and position is a DRAWING DEFAULT (no source gives a venue) —
 * except the receivers' heights: 1.2 m for a seated and 1.7 m for a standing
 * audience (MEYER-MAPP, CONFIRMED; measureSpec.LISTENER_HEIGHT), used as a
 * sensible listener height, never as the method's rule.
 *
 * `overlapAt` is the physics of a seat that hears the main AND the fill: two
 * arrivals a path difference apart (twoMic.deltaTms — the calculator's speed
 * of sound), the first notch that delay would put in their sum (ideal: one
 * point source each, straight paths, equal levels at the notch) and how far
 * apart they are by spreading alone (levels.levelDiffDb).
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { deltaTms, notchesHz } from '../../../engine/physics/twoMic.ts';
import { levelDiffDb } from '../../../engine/physics/levels.ts';
import { LISTENER_HEIGHT } from './measureSpec.ts';

export const VENUE = {
  /** The stage: from its back wall to its front edge (x), the deck's height above the audience floor. */
  stage: { x0: -3000, x1: 0, deck: 800 },
  /** The room: the wall behind the stage, the rear wall, the side walls (±half). */
  room: { back: -3200, rear: 14000, half: 5000, ceiling: 6000 },
  /** A main loudspeaker on its stand at each front corner of the stage: its
   *  front at x, its acoustic centre h above the audience floor, ±z across. */
  main: { x: -150, z: 4300, h: 2600, depth: 420, half: 260, top: 330, bottom: 300 },
  /** The subwoofer on the audience floor in front of the stage, facing the audience. */
  sub: { x0: 250, x1: 950, half: 600, h: 650 },
  /** The front fill on the stage lip: its front at x, on the deck. */
  fill: { x: -60, depth: 200, half: 120, h: 300 },
  /** Rows of seats (x) and the seats across each row (z), an aisle down the middle. */
  rows: [2500, 3500, 4500, 5500, 6500, 7500, 8500, 9500, 10500, 11500] as const,
  seatsZ: [-4500, -3600, -2700, -1800, -900, 900, 1800, 2700, 3600, 4500] as const,
  /** The standing area behind the last row (x). */
  standing: { x0: 12300, x1: 13700 },
} as const;

/** A seated / standing listener's ear height (MEYER-MAPP). */
export const SEATED = LISTENER_HEIGHT.seated.mm;
export const STANDING = LISTENER_HEIGHT.standing.mm;

/** The left and right mains' acoustic centres, the fill's and the sub's. */
export const MAIN_L: Vec3 = { x: VENUE.main.x, y: -VENUE.main.h, z: -VENUE.main.z };
export const MAIN_R: Vec3 = { x: VENUE.main.x, y: -VENUE.main.h, z: VENUE.main.z };
export const FILL: Vec3 = { x: VENUE.fill.x, y: -(VENUE.stage.deck + VENUE.fill.h / 2), z: 0 };
export const SUB: Vec3 = { x: VENUE.sub.x1, y: -VENUE.sub.h / 2, z: 0 };

/** A receiver at a seat (x, z): the seated ear height, or the standing one. */
export function seatPoint(x: number, z: number, standing = false): Vec3 {
  return { x, y: -(standing ? STANDING : SEATED), z };
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export type Overlap = {
  /** Paths from the main and from the fill (mm). */
  mainMm: number;
  fillMm: number;
  /** Fill minus main, after the fill's own delay (ms): + = the fill arrives later. */
  dtMs: number;
  /** The first notch that difference would put in the sum (Hz), or null when the arrivals coincide. */
  firstNotchHz: number | null;
  /** The fill's level relative to the main by spreading alone (dB; + = the fill is louder). */
  fillDb: number;
};

/** A seat that hears the left main and the fill, the fill delayed by `fillDelayMs`. */
export function overlapAt(seat: Vec3, fillDelayMs = 0, main: Vec3 = MAIN_L): Overlap {
  const mainMm = dist(main, seat);
  const fillMm = dist(FILL, seat);
  const dtMs = deltaTms(fillMm - mainMm) + fillDelayMs;
  const first = notchesHz(dtMs, 1, 20000, 1)[0];
  return { mainMm, fillMm, dtMs, firstNotchHz: Math.abs(dtMs) < 1e-6 ? null : first ?? null, fillDb: levelDiffDb(mainMm, fillMm) };
}

/** The fill delay (ms) that lines its arrival up with the main's at one seat. */
export function alignAt(seat: Vec3, main: Vec3 = MAIN_L): number {
  return deltaTms(dist(main, seat) - dist(FILL, seat));
}
