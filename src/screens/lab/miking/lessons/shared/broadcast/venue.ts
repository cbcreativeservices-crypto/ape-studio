/**
 * THE AUDIENCE VENUE — Lab 7 group 3 (B08 Broadcast Audience and Event
 * Space; docs/labs/miking/audience_ambience/GEOMETRY_PROPOSAL.md §1, §4).
 * Pure: no React (test/mikingLab7Field.test.ts).
 *
 * Built on Lab 7b group 2's venue plan (shared/sports/venuePlan.ts, frame P
 * — itself an extension of Lab 5's frame S seating and stage plot), never
 * copied: the same layers, the same readouts, at the scale of a hall. FRAME
 * (metres): the origin at the middle of the stage's front edge, +x across
 * the hall to the RIGHT AS DRAWN (the plan the usual way up: the stage at
 * the bottom, the audience above; "left" and "right" are as drawn), +y out into the
 * audience, heights h up from the floor.
 *
 *   STUDIO    a small studio audience: one raked section of seats in front of
 *             a stage, an aisle down each side, an exit at each back corner,
 *             a PA loudspeaker at each front corner of the stage, a camera on
 *             a riser at the back; the approved places — a rigging bar above
 *             the front rows (rigged by qualified crew) and the stage's front
 *             corners.
 *   EVENT     a larger multi-section event: three sections fanned round a
 *             wider stage, aisles between them, exits, PA clusters high at the
 *             stage's corners and a centre front fill, a camera riser, a rail
 *             at the front of each section and a truss over the hall.
 * Every size and place is a DRAWING DEFAULT (proposal §6: venue presets and
 * dimensions); a section is drawn as seats without people.
 *
 * READOUTS (DERIVED, calculated from the drawing — never a performance
 * claim):
 *   paAngle       how far the PA cluster sits off a crowd mic's axis (3-D),
 *                 and the ideal first-order pattern's pickup there (S-TOP6:
 *                 "aimed at the faces of the people and away from the main PA
 *                 speakers" — the angle is the reasoning, the dB a simplified
 *                 picture);
 *   nearSeatBias  the nearest seat against the section's centre at the mic,
 *                 inverse square — "one person can dominate" from 6 dB (one
 *                 distance doubling: the threshold is DERIVED);
 *   zonesVsPair   two zone mics are not a stereo pair: the arrival-time
 *                 difference for a source at the centre and at one side, and
 *                 the mono sum's first notch (engine/physics/twoMic via
 *                 venuePlan.overlap); a coincident XY pair: Δt = 0.
 */
import type { PatternId } from '../../../engine/model/types.ts';
import { gainDb } from '../../../engine/physics/polar.ts';
import { notchesHz } from '../../../engine/physics/twoMic.ts';
import { offAxis3, overlap, p2, rangeDb, slantRange, type P2, type PlanRect, type Sector, type VenueScene } from '../sports/venuePlan.ts';

/** A seated listener's head height (m): the faces a crowd mic aims at (a drawing default). */
export const FACE_H = 1.2;
/** "One person can dominate" from this many dB (one doubling of distance — DERIVED). */
export const DOMINATE_DB = 6;

const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [p2(x0, y0), p2(x1, y0), p2(x1, y1), p2(x0, y1)];
const paSector = (id: string, label: string, short: string, c: P2, h: number): Sector => ({ id, label, short, kind: 'pa', c, h, poly: rect(c.x - 0.4, c.y - 0.3, c.x + 0.4, c.y + 0.3) });

/* ═════════ STUDIO: a small studio audience ═════════ */

export const STUDIO_SECTION: PlanRect = { x0: -4.5, y0: 2, x1: 4.5, y1: 8 };
export const STUDIO = {
  /** The section's centre and its nearest front-row seat to the bar's middle. */
  S: p2(0, 5),
  N: p2(0, 2.4),
  /** The PA at the stage's front corners (m, height). */
  paL: p2(-4.6, -0.4),
  paR: p2(4.6, -0.4),
  paH: 2.8,
  /** The rigging bar above the front rows and the stage's front corners. */
  bar: { x0: -4, y0: 1.2, x1: 4, y1: 2.0 } as PlanRect,
  cornerL: { x0: -4.6, y0: 0.05, x1: -3.6, y1: 0.7 } as PlanRect,
  cornerR: { x0: 3.6, y0: 0.05, x1: 4.6, y1: 0.7 } as PlanRect,
  /** The mono crowd mic's place on the bar and its height (drawing defaults). */
  M: p2(0, 1.6),
  hBar: 3.2,
  /** The zone mics at the stage's front corners. */
  ZL: p2(-4.1, 0.4),
  ZR: p2(4.1, 0.4),
  hCorner: 2.4,
} as const;

export const STUDIO_SCENE: VenueScene = {
  id: 'studioAudience',
  label: 'Studio audience',
  blurb: 'A small studio audience: one raked section of seats in front of the stage, an aisle down each side, a PA at each front corner of the stage.',
  play: rect(-4, -4, 4, 0),
  surface: 'mock',
  markings: [],
  keepClear: [],
  routes: [
    { id: 'aisleL', label: 'the left aisle', short: 'AISLE', pts: [p2(-5.2, 1.4), p2(-5.2, 8.6)], kind: 'exit' },
    { id: 'aisleR', label: 'the right aisle', short: 'AISLE', pts: [p2(5.2, 1.4), p2(5.2, 8.6)], kind: 'exit' },
    { id: 'exitL', label: 'the exit at the back left', short: 'EXIT', pts: [p2(-5.2, 8.6), p2(-6.4, 9.6)], kind: 'exit' },
    { id: 'exitR', label: 'the exit at the back right', short: 'EXIT', pts: [p2(5.2, 8.6), p2(6.4, 9.6)], kind: 'exit' },
  ],
  footprints: [
    { id: 'bar', label: 'the rigging bar above the front rows (qualified crew)', short: 'RIGGING BAR', rect: STUDIO.bar },
    { id: 'cornerL', label: 'the stage’s front corner on the left', short: 'STAGE CORNER', rect: STUDIO.cornerL },
    { id: 'cornerR', label: 'the stage’s front corner on the right', short: 'STAGE CORNER', rect: STUDIO.cornerR },
  ],
  cameras: [{ id: 'cam', label: 'the camera on its riser at the back', p: p2(0, 9.2), dirDeg: 180, halfDeg: 18, reach: 9 }],
  sectors: [
    { id: 'S1', label: 'the audience section', short: 'AUDIENCE', kind: 'crowd', c: STUDIO.S, h: FACE_H, poly: rect(STUDIO_SECTION.x0, STUDIO_SECTION.y0, STUDIO_SECTION.x1, STUDIO_SECTION.y1), empty: true },
    paSector('paL', 'the PA at the stage’s front corner on the left', 'PA', STUDIO.paL, STUDIO.paH),
    paSector('paR', 'the PA at the stage’s front corner on the right', 'PA', STUDIO.paR, STUDIO.paH),
  ],
  targets: [
    { id: 'S', label: 'the middle of the section', short: 'SECTION', p: STUDIO.S, h: FACE_H },
    { id: 'N', label: 'the front-row seat nearest the bar', short: 'FRONT ROW', p: STUDIO.N, h: FACE_H },
  ],
  marks: [{ id: 'M', label: 'the crowd mic’s place on the bar', short: 'M', p: STUDIO.M, kind: 'mic', placeholder: true }],
  badges: [],
  barriers: [],
  frame: { x0: -7.5, y0: -4.8, x1: 7.5, y1: 10.2 },
  defaults: ['the stage', 'the section and its rake', 'the aisles and exits', 'the PA', 'the camera', 'the rigging bar', 'the stage corners', 'the mic heights', 'the face height 1.2 m'],
};

/* ═════════ EVENT: a larger multi-section event ═════════ */

export const EVENT_SECTIONS: Readonly<Record<'L' | 'C' | 'R', PlanRect>> = {
  L: { x0: -20, y0: 3, x1: -8.5, y1: 13 },
  C: { x0: -6.5, y0: 3, x1: 6.5, y1: 14 },
  R: { x0: 8.5, y0: 3, x1: 20, y1: 13 },
};
const mid = (r: PlanRect): P2 => p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
export const EVENT = {
  CL: mid(EVENT_SECTIONS.L),
  CC: mid(EVENT_SECTIONS.C),
  CR: mid(EVENT_SECTIONS.R),
  paL: p2(-9, -0.6),
  paR: p2(9, -0.6),
  paH: 7,
  fill: p2(0, -0.3),
  fillH: 0.6,
  railL: { x0: -18, y0: 1.6, x1: -10, y1: 2.6 } as PlanRect,
  railC: { x0: -5.5, y0: 1.6, x1: 5.5, y1: 2.6 } as PlanRect,
  railR: { x0: 10, y0: 1.6, x1: 18, y1: 2.6 } as PlanRect,
  truss: { x0: -3, y0: 8.5, x1: 3, y1: 9.5 } as PlanRect,
  hRail: 3.5,
  hTruss: 6,
} as const;

export const EVENT_SCENE: VenueScene = {
  id: 'eventHall',
  label: 'Multi-section event',
  blurb: 'A larger event: three sections round a wide stage, aisles between them, PA clusters high at the stage’s corners and a front fill, a camera riser at the back.',
  play: rect(-7.5, -7, 7.5, 0),
  surface: 'mock',
  markings: [],
  keepClear: [],
  routes: [
    { id: 'aisleL', label: 'the aisle between the left and centre sections', short: 'AISLE', pts: [p2(-7.5, 2.2), p2(-7.5, 15.5)], kind: 'exit' },
    { id: 'aisleR', label: 'the aisle between the right and centre sections', short: 'AISLE', pts: [p2(7.5, 2.2), p2(7.5, 15.5)], kind: 'exit' },
    { id: 'cross', label: 'the cross-aisle at the back', short: 'CROSS-AISLE', pts: [p2(-21, 15.5), p2(21, 15.5)], kind: 'exit' },
    { id: 'exitL', label: 'the exit at the left', short: 'EXIT', pts: [p2(-21, 15.5), p2(-22, 17)], kind: 'exit' },
    { id: 'exitR', label: 'the exit at the right', short: 'EXIT', pts: [p2(21, 15.5), p2(22, 17)], kind: 'exit' },
  ],
  footprints: [
    { id: 'railL', label: 'the rail at the front of the left section', short: 'RAIL', rect: EVENT.railL },
    { id: 'railC', label: 'the rail at the front of the centre section', short: 'RAIL', rect: EVENT.railC },
    { id: 'railR', label: 'the rail at the front of the right section', short: 'RAIL', rect: EVENT.railR },
    { id: 'truss', label: 'the truss over the hall (a qualified rigger)', short: 'TRUSS', rect: EVENT.truss },
  ],
  cameras: [{ id: 'cam', label: 'the camera riser at the back', p: p2(0, 16.6), dirDeg: 180, halfDeg: 16, reach: 15 }],
  sectors: [
    { id: 'L', label: 'the left section', short: 'LEFT', kind: 'crowd', c: EVENT.CL, h: FACE_H, poly: rect(EVENT_SECTIONS.L.x0, EVENT_SECTIONS.L.y0, EVENT_SECTIONS.L.x1, EVENT_SECTIONS.L.y1), empty: true },
    { id: 'C', label: 'the centre section', short: 'CENTRE', kind: 'crowd', c: EVENT.CC, h: FACE_H, poly: rect(EVENT_SECTIONS.C.x0, EVENT_SECTIONS.C.y0, EVENT_SECTIONS.C.x1, EVENT_SECTIONS.C.y1), empty: true },
    { id: 'R', label: 'the right section', short: 'RIGHT', kind: 'crowd', c: EVENT.CR, h: FACE_H, poly: rect(EVENT_SECTIONS.R.x0, EVENT_SECTIONS.R.y0, EVENT_SECTIONS.R.x1, EVENT_SECTIONS.R.y1), empty: true },
    paSector('paL', 'the PA cluster high on the left', 'PA', EVENT.paL, EVENT.paH),
    paSector('paR', 'the PA cluster high on the right', 'PA', EVENT.paR, EVENT.paH),
    paSector('fill', 'the front fill at the stage’s edge', 'FILL', EVENT.fill, EVENT.fillH),
  ],
  targets: [
    { id: 'L', label: 'the left section', short: 'LEFT', p: EVENT.CL, h: FACE_H },
    { id: 'C', label: 'the centre section', short: 'CENTRE', p: EVENT.CC, h: FACE_H },
    { id: 'R', label: 'the right section', short: 'RIGHT', p: EVENT.CR, h: FACE_H },
  ],
  marks: [],
  badges: [],
  barriers: [],
  frame: { x0: -22, y0: -8, x1: 22, y1: 18.5 },
  defaults: ['the stage', 'the three sections', 'the aisles and exits', 'the PA clusters and the front fill', 'the camera riser', 'the rails and the truss', 'the mic heights'],
};

export const VENUES = { studio: STUDIO_SCENE, event: EVENT_SCENE } as const;
export type VenueId = keyof typeof VENUES;

/* ═════════ the readouts (DERIVED) ═════════ */

/** The PA's angle off a crowd mic's axis (3-D) and the pattern's pickup
 *  there against the faces it aims at (dB; ≤ 0 = taken down). */
export function paAngle(mic: P2, hMic: number, aimAt: P2, hAim: number, pa: P2, hPa: number, pattern: PatternId): { deg: number; db: number } {
  const deg = offAxis3(mic, hMic, aimAt, hAim, pa, hPa);
  return { deg, db: gainDb(pattern, deg) - gainDb(pattern, 0) };
}

/** The nearest seat against the section's centre at a mic (dB, inverse
 *  square: how much louder one nearby person is than the middle). */
export function nearSeatBias(mic: P2, hMic: number, near: P2, centre: P2, hFace = FACE_H): { rNear: number; rCentre: number; db: number; dominates: boolean } {
  const rNear = slantRange(mic, hMic, near, hFace);
  const rCentre = slantRange(mic, hMic, centre, hFace);
  const db = rangeDb(rNear, rCentre);
  return { rNear, rCentre, db, dominates: db > DOMINATE_DB };
}

/** Two mics on one source: the arrival-time difference (ms, + = B later) and
 *  the mono sum's first notch (Hz, null when they line up). */
export function pairReading(src: P2, hSrc: number, a: P2, ha: number, b: P2, hb: number): { dtMs: number; notch: number | null } {
  const o = overlap(src, hSrc, a, ha, b, hb);
  const n = Math.abs(o.dtMs) < 1e-6 ? [] : notchesHz(Math.abs(o.dtMs), 1, 20000, 1);
  return { dtMs: o.dtMs, notch: n[0] ?? null };
}
