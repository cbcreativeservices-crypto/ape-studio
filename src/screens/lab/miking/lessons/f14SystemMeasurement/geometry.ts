/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — where things are (charter
 * §2 layer 2). Three scenes in scene frame F (lessons/shared/field/
 * sceneFrame.ts), one per variant, each with the FLOOR at y = 0 (+y down,
 * millimetres):
 *
 *   bench   a two-way test loudspeaker on a stand, its REFERENCE POINT on
 *           the front baffle between the drivers, 1.2 m above the floor at
 *           (0, −1200, 0); +x out along its reference axis
 *   venue   the venue seat plan (shared/measure/venue.ts): mains on stands at
 *           the stage's front corners, a subwoofer on the floor, a front fill
 *           on the stage lip, ten rows of seats and a standing area
 *   studio  a pair of studio monitors on stands behind a desk, the working
 *           listening position in front of them
 *
 * Every size is a DRAWING DEFAULT (loudspeaker_measurement/GEOMETRY_
 * PROPOSAL.md §2): no source gives a test loudspeaker, a venue or a studio.
 * Sourced: the receivers' heights at seats — 1.2 m seated, 1.7 m standing
 * (MEYER-MAPP), used as a sensible listener height, never as the method's rule.
 */
import type { InstrumentModel, Part, RefLine, ReferenceSurface, Vec3, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel, operatorPart, operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import type { TestSpeakerGeom } from '../shared/measure/MeasureArt';
import { FILL, MAIN_L, MAIN_R, SUB, VENUE } from '../shared/measure/venue.ts';

/* ── the bench ── */

/** The test loudspeaker's reference point (on the baffle, between the drivers). */
export const REF14: Vec3 = { x: 0, y: -1200, z: 0 };
export const SPK14: TestSpeakerGeom = { front: 0, depth: 250, top: -1430, bottom: -1030, half: 125, woofer: { y: -1145, r: 82 }, tweeter: { y: -1340, r: 20 }, floorY: 0 };
/** The woofer's centre on the baffle (the near-field point's reference). */
export const WOOFER14: Vec3 = { x: 0, y: SPK14.woofer.y, z: 0 };
/** Where you stand on the bench: back from the mic and to one side. */
export const OP14 = { x: 2700, z: -1100 };

/* ── the studio ── */

/** Studio monitors: fronts at x = 0, ±800 mm across, acoustic centres 1.2 m up. */
export const MON = { x: 0, z: 800, h: 1200, depth: 230, half: 110 };
export const monGeom = (z: number): TestSpeakerGeom => ({ front: MON.x, depth: MON.depth, top: -MON.h - 200, bottom: -MON.h + 160, half: MON.half, woofer: { y: -MON.h + 50, r: 70 }, tweeter: { y: -MON.h - 125, r: 18 }, floorY: 0, z });
export const MON_L: Vec3 = { x: MON.x, y: -MON.h, z: -MON.z };
export const MON_R: Vec3 = { x: MON.x, y: -MON.h, z: MON.z };
/** The desk between the monitors and the listener (drawing default). */
export const DESK = { x0: 200, x1: 850, half: 900, top: 760 };
/** The working listening position: an equilateral triangle with the monitors, at a seated ear height. */
export const LISTEN: Vec3 = { x: Math.sqrt(1600 ** 2 - 800 ** 2), y: -1200, z: 0 };
export const STUDIO_ROOM = { front: -700, rear: 3600, half: 2400 };

/* ── the views ── */

const V = VENUE;
export const F14_VIEWS: Record<'bench' | 'venue' | 'studio', Record<'side' | 'top', ViewBox>> = {
  bench: { side: { u0: -700, u1: 3000, v0: -1950, v1: 60 }, top: { u0: -700, u1: 3000, v0: -1500, v1: 1450 } },
  venue: { side: { u0: V.room.back - 200, u1: V.room.rear + 200, v0: -3600, v1: 120 }, top: { u0: V.room.back - 200, u1: V.room.rear + 200, v0: -V.room.half - 250, v1: V.room.half + 250 } },
  studio: { side: { u0: STUDIO_ROOM.front - 200, u1: STUDIO_ROOM.rear + 200, v0: -1950, v1: 60 }, top: { u0: STUDIO_ROOM.front - 200, u1: STUDIO_ROOM.rear + 200, v0: -STUDIO_ROOM.half - 200, v1: STUDIO_ROOM.half + 200 } },
};

const SPK = ill('drawing default: a small two-way test loudspeaker (loudspeaker_measurement/GEOMETRY_PROPOSAL.md §2)');
const VEN = ill('drawing default: a small venue (shared/measure/venue.ts)');
const STU = ill('drawing default: a small control room (loudspeaker_measurement/GEOMETRY_PROPOSAL.md §2, studio variant)');

/** A cabinet's solid and its stand's (box + column to the floor), as on the shared test loudspeaker. */
function cabinet(id: string, label: string, short: string, role: string, g: TestSpeakerGeom, variants: string[], prov: InstrumentModel['parts'][number]['prov'], listIn?: string[]): Part[] {
  const z = g.z ?? 0;
  const colX = g.front - g.depth * 0.5;
  return [
    { id, label, short, role, variants, ...(listIn ? { listIn } : {}), solid: { kind: 'box', min: { x: g.front - g.depth, y: g.top, z: z - g.half }, max: { x: g.front + 14, y: g.bottom, z: z + g.half } }, prov },
    { id: `${id}.stand`, label: `${label.replace(/^the /, 'the ')}’s stand`, short: 'stand', role: 'A rigid stand on a weighted base: the loudspeaker does not move between readings.', variants, listIn: [], solid: { kind: 'box', min: { x: colX - 190, y: g.bottom, z: z - 170 }, max: { x: colX + 190, y: g.floorY, z: z + 170 } }, prov },
  ];
}

const MAIN_GEOM = (z: number): TestSpeakerGeom => ({ front: V.main.x, depth: V.main.depth, top: -V.main.h - V.main.top, bottom: -V.main.h + V.main.bottom, half: V.main.half, woofer: { y: -V.main.h + 120, r: 190 }, tweeter: { y: -V.main.h - 200, r: 55 }, floorY: -V.stage.deck, z });
export const MAIN_L_GEOM = MAIN_GEOM(-V.main.z);
export const MAIN_R_GEOM = MAIN_GEOM(V.main.z);
export const FILL_GEOM: TestSpeakerGeom = { front: V.fill.x, depth: V.fill.depth, top: -V.stage.deck - V.fill.h, bottom: -V.stage.deck, half: V.fill.half, woofer: { y: -V.stage.deck - 105, r: 72 }, tweeter: { y: -V.stage.deck - 235, r: 18 }, floorY: -V.stage.deck, stand: false };

const PARTS: Part[] = [
  /* bench */
  { id: 'spk.box', label: 'the test loudspeaker', short: 'loudspeaker', role: 'The loudspeaker under test. Its reference point — here on the front baffle between the drivers — and its reference axis are where every distance and angle is measured from, and both are written down.', variants: ['bench'], solid: { kind: 'box', min: { x: -SPK14.depth, y: SPK14.top, z: -SPK14.half }, max: { x: 14, y: SPK14.bottom, z: SPK14.half } }, prov: SPK },
  { id: 'spk.woofer', label: 'the woofer', short: 'woofer', role: 'The larger driver: the lows and mids leave its cone. A near-field mic close to it hears it far more than the room — and far more than the tweeter.', variants: ['bench'], prov: SPK },
  { id: 'spk.tweeter', label: 'the tweeter', short: 'tweeter', role: 'The small driver for the highs. A mic too far above or below the axis hears the two drivers at different distances.', variants: ['bench'], prov: SPK },
  { id: 'spk.port', label: 'the port', short: 'port', role: 'The reflex port under the woofer: another place the lows leave, and one a close mic on the cone alone does not hear.', variants: ['bench'], prov: SPK },
  { id: 'spk.stand', label: 'the loudspeaker stand', short: 'stand', role: 'A rigid stand on a weighted base: the loudspeaker does not move between readings.', variants: ['bench'], solid: { kind: 'box', min: { x: -125 - 190, y: SPK14.bottom, z: -170 }, max: { x: -125 + 190, y: 0, z: 170 } }, prov: SPK },
  { ...operatorPart(OP14.x, OP14.z, 0, 'You, back from the mic and to one side: a person near the capsule reflects sound into it and changes the very field being measured.'), variants: ['bench'] },
  /* venue */
  ...cabinet('mainL', 'the left main loudspeaker', 'left main', 'The left main on its stand at the stage’s corner: the sound most of the left side of the audience hears. Measure it alone across its seats first.', MAIN_L_GEOM, ['venue'], VEN),
  ...cabinet('mainR', 'the right main loudspeaker', 'right main', 'The right main, mirrored: muted while you measure the left one alone.', MAIN_R_GEOM, ['venue'], VEN, []),
  { id: 'sub', label: 'the subwoofer', short: 'sub', role: 'The lows below the mains, from the floor in front of the stage. Measure it alone, then with the mains around the crossover — the room and the floor shape the lows at every seat.', variants: ['venue'], solid: { kind: 'box', min: { x: V.sub.x0, y: -V.sub.h, z: -V.sub.half }, max: { x: V.sub.x1, y: 0, z: V.sub.half } }, prov: VEN },
  { id: 'fill', label: 'the front fill', short: 'front fill', role: 'A small loudspeaker on the stage lip for the first rows, under the mains’ coverage. Where its sound and a main’s meet, they arrive at different times.', variants: ['venue'], solid: { kind: 'box', min: { x: V.fill.x - V.fill.depth, y: -V.stage.deck - V.fill.h, z: -V.fill.half }, max: { x: V.fill.x + 14, y: -V.stage.deck, z: V.fill.half } }, prov: VEN },
  { id: 'stage', label: 'the stage', short: 'stage', role: 'The stage deck: the performers’ area, raised above the audience floor.', variants: ['venue'], solid: { kind: 'box', min: { x: V.stage.x0, y: -V.stage.deck, z: -V.room.half }, max: { x: V.stage.x1, y: 0, z: V.room.half } }, prov: VEN },
  { id: 'seats', label: 'the seats', short: 'seats', role: 'Where the audience sits — and where the receivers go, at a seated ear height. Each region whose sound matters gets its own points.', variants: ['venue'], prov: VEN },
  { id: 'standing', label: 'the standing area', short: 'standing area', role: 'Behind the last row the audience stands: a receiver there sits at a standing ear height.', variants: ['venue'], prov: VEN },
  /* studio */
  ...cabinet('monL', 'the left monitor', 'left monitor', 'The left studio monitor on its stand: measured alone first, then the right one, at the working listening position.', monGeom(-MON.z), ['studio'], STU),
  ...cabinet('monR', 'the right monitor', 'right monitor', 'The right monitor, mirrored: measured alone, after the left.', monGeom(MON.z), ['studio'], STU, []),
  { id: 'desk', label: 'the desk', short: 'desk', role: 'The desk between the monitors and you: its top reflects sound toward the listening position — one cause of a narrow dip at one spot.', variants: ['studio'], solid: { kind: 'box', min: { x: DESK.x0, y: -DESK.top, z: -DESK.half }, max: { x: DESK.x1, y: 0, z: DESK.half } }, prov: STU },
  { id: 'chair', label: 'the listening position', short: 'listening position', role: 'Where the engineer’s head is when working: the first place to measure — and only one of the places a head goes.', variants: ['studio'], prov: STU },
  /* the rooms' walls: solids (a mic stops at them), not parts to name */
  ...walls('v', ['venue'], { back: V.room.back, front: V.room.rear, half: V.room.half, top: -3600 }, VEN),
  ...walls('s', ['studio'], { back: STUDIO_ROOM.front, front: STUDIO_ROOM.rear, half: STUDIO_ROOM.half, top: -1950 }, STU),
];

/** A room's four walls as solids (listed nowhere), as the room lesson draws them. */
function walls(k: string, variants: string[], r: { back: number; front: number; half: number; top: number }, prov: Part['prov']): Part[] {
  const W = 200;
  const wall = (id: string, label: string, min: Vec3, max: Vec3): Part => ({ id: `${k}.${id}`, label, short: 'wall', role: '', variants, listIn: [], solid: { kind: 'box', min, max }, prov });
  return [
    wall('back', 'the wall behind', { x: r.back - W, y: r.top, z: -r.half - W }, { x: r.back, y: 0, z: r.half + W }),
    wall('rear', 'the rear wall', { x: r.front, y: r.top, z: -r.half - W }, { x: r.front + W, y: 0, z: r.half + W }),
    wall('left', 'a side wall', { x: r.back - W, y: r.top, z: -r.half - W }, { x: r.front + W, y: 0, z: -r.half }),
    wall('right', 'a side wall', { x: r.back - W, y: r.top, z: r.half }, { x: r.front + W, y: 0, z: r.half + W }),
  ];
}

export const F14_SURFACES: ReferenceSurface[] = [
  { id: 'ref', partId: 'spk.box', label: 'the loudspeaker’s reference point', point: REF14, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['bench'] },
  { id: 'woofer', partId: 'spk.woofer', label: 'the woofer', point: WOOFER14, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'from', key: 'FROM' }, variants: ['bench'] },
  { id: 'mainL', partId: 'mainL', label: 'the left main', point: MAIN_L, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['venue'] },
  { id: 'fill', partId: 'fill', label: 'the front fill', point: FILL, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['venue'] },
  { id: 'monL', partId: 'monL', label: 'the left monitor', point: MON_L, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['studio'] },
];

export const F14_LINES: RefLine[] = [
  { id: 'floor', label: 'the floor', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the floor', minus: 'below the floor', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } },
  { id: 'axis', label: 'the reference axis', point: REF14, dir: { x: 1, y: 0, z: 0 }, variants: ['bench'], surfaces: ['ref'] },
  { id: 'wooferAxis', label: 'the woofer’s axis', point: WOOFER14, dir: { x: 1, y: 0, z: 0 }, variants: ['bench'], surfaces: ['woofer'] },
];

export const F14_OP_SIDE = operatorSide(OP14.x, 0, -1);
export const F14_OP_TOP = operatorTop(OP14.x, OP14.z, -1);

/** The sources' points the pages draw (re-exported for the art and the tests). */
export { FILL, MAIN_L, MAIN_R, SUB };

export const F14_MODEL: InstrumentModel = measureModel({
  id: 'systemTest',
  name: 'loudspeaker and system measurement',
  parts: PARTS,
  regions: [
    { id: 'drivers', partId: 'spk.box', label: 'the drivers on the baffle', anchor: REF14, prov: SPK, variants: ['bench'], note: 'The sound under test leaves the woofer’s cone, the tweeter’s dome and the port.' },
    { id: 'mainL', partId: 'mainL', label: 'the left main', anchor: MAIN_L, prov: VEN, variants: ['venue'], note: 'The main covers most of its side of the audience, mostly forward.' },
    { id: 'fill', partId: 'fill', label: 'the front fill', anchor: FILL, prov: VEN, variants: ['venue'], note: 'The fill covers the first rows, which the mains overshoot.' },
    { id: 'sub', partId: 'sub', label: 'the subwoofer', anchor: SUB, prov: VEN, variants: ['venue'], note: 'The lows, broadly in every direction.' },
    { id: 'monL', partId: 'monL', label: 'the left monitor', anchor: MON_L, prov: STU, variants: ['studio'], note: 'The left monitor, aimed toward the listening position.' },
  ],
  surfaces: F14_SURFACES,
  lines: F14_LINES,
  variants: [
    { id: 'bench', label: 'TEST BENCH', blurb: 'One loudspeaker on a stand: its reference axis, angles off it, and a close look at one driver.', phrase: 'on a test bench' },
    { id: 'venue', label: 'VENUE · MAINS, SUB AND FILL', blurb: 'An installed system in a small venue: each subsystem alone across its seats, then where they overlap.', phrase: 'in a venue' },
    { id: 'studio', label: 'STUDIO MONITORS', blurb: 'A pair of monitors and the working listening position — and the positions a head moves to.', phrase: 'in a studio' },
  ],
  defaultVariant: 'bench',
  views: F14_VIEWS.bench,
  viewsByVariant: { venue: F14_VIEWS.venue, studio: F14_VIEWS.studio },
  viewTags: { side: 'SECTION', top: 'PLAN' },
  groundY: { mm: 0, prov: ill('scene frame F: the floor at y = 0 in every scene') },
  aimAzLimit: 180,
  labelMinScale: 0.03,
});
