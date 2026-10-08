/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — where things are (charter
 * §2 layer 2). One controlled room in scene frame F (lessons/shared/field/
 * sceneFrame.ts) with a MARKED COORDINATE ORIGIN and ARRAY AXES, as the
 * lesson asks (F16 L5): the origin at the baseline's centre, 1.2 m above the
 * floor; +x toward the source line, +z along the baseline (left −z, right
 * +z), +y down (the floor y = 1200).
 *
 *   the baseline   two omni measurement mics 0.5 m apart on the z axis
 *                  (drawing default b = 0.5 m — scientific_arrays/
 *                  GEOMETRY_PROPOSAL.md §2), one synchronized recorder
 *   the source     a small test loudspeaker on a stand at the CENTRE point
 *                  2 m in front of the origin (drawing default); the SIDE
 *                  point 1 m to the right of it is marked on the floor
 *
 * Every size is a DRAWING DEFAULT; the physics (Δt, the mirror, λ/2) is the
 * calculator's and is tested.
 */
import type { InstrumentModel, Part, RefLine, ReferenceSurface, Vec3, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel, operatorPart, operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import type { TestSpeakerGeom } from '../shared/measure/MeasureArt';

/** The floor, 1.2 m below the array (drawing default). */
export const FLOOR16 = 1200;
/** The baseline (mm): the element spacing, and the wider one. */
export const BASE = { b: 500, wide: 1000 };
/** The source line: the centre point and the side point (mm, drawing defaults). */
export const CENTRE_PT: Vec3 = { x: 2000, y: 0, z: 0 };
export const SIDE_PT: Vec3 = { x: 2000, y: 0, z: 1000 };
/** The room (drawing default). */
export const ROOM16 = { back: -1600, front: 3600, half: 2200 };
/** Where you stand: back and to one side, out of the paths. */
export const OP16 = { x: -1100, z: -1500 };
/** The source loudspeaker, its front facing the array (−x). */
export const SRC16: TestSpeakerGeom = { front: CENTRE_PT.x, depth: 200, top: -150, bottom: 130, half: 100, woofer: { y: 40, r: 60 }, tweeter: { y: -100, r: 15 }, floorY: FLOOR16, facing: -1 };

export const F16_VIEWS: Record<'side' | 'top', ViewBox> = {
  side: { u0: ROOM16.back - 200, u1: ROOM16.front + 200, v0: -1000, v1: FLOOR16 + 60 },
  top: { u0: ROOM16.back - 200, u1: ROOM16.front + 200, v0: -ROOM16.half - 200, v1: ROOM16.half + 200 },
};

const ROOM = ill('drawing default: a controlled room (scientific_arrays/GEOMETRY_PROPOSAL.md §1)');
const W = 200;
const wall = (id: string, min: Vec3, max: Vec3): Part => ({ id, label: 'a wall', short: 'wall', role: '', listIn: [], solid: { kind: 'box', min, max }, prov: ROOM });

const PARTS: Part[] = [
  { id: 'src', label: 'the test source', short: 'source', role: 'A small loudspeaker on a stand at the centre point, at a modest, agreed level: the stationary source whose arrival the two elements compare.', solid: { kind: 'box', min: { x: SRC16.front - 14, y: SRC16.top, z: -SRC16.half }, max: { x: SRC16.front + SRC16.depth, y: SRC16.bottom, z: SRC16.half } }, prov: ROOM },
  { id: 'src.stand', label: 'the source’s stand', short: 'stand', role: 'A rigid stand: the source must not move between runs.', listIn: [], solid: { kind: 'box', min: { x: SRC16.front + SRC16.depth / 2 - 190, y: SRC16.bottom, z: -170 }, max: { x: SRC16.front + SRC16.depth / 2 + 190, y: FLOOR16, z: 170 } }, prov: ROOM },
  { id: 'origin', label: 'the marked origin', short: 'origin', role: 'The coordinate origin, marked on the floor under the baseline’s centre: every element’s position, and every source point, is written from here.', prov: ROOM },
  { id: 'axes', label: 'the array axes', short: 'axes', role: 'The baseline axis (left to right) and the axis toward the source, taped on the floor: the directions every time difference is read along.', prov: ROOM },
  { id: 'side', label: 'the side point', short: 'side point', role: 'The second source point, 1 m to the right of the centre point: the same source moved there, at the same level.', prov: ROOM },
  operatorPart(OP16.x, OP16.z, FLOOR16, 'You, back and to one side, out of the paths between the source and the elements.'),
  wall('w.back', { x: ROOM16.back - W, y: -1000, z: -ROOM16.half - W }, { x: ROOM16.back, y: FLOOR16, z: ROOM16.half + W }),
  wall('w.front', { x: ROOM16.front, y: -1000, z: -ROOM16.half - W }, { x: ROOM16.front + W, y: FLOOR16, z: ROOM16.half + W }),
  wall('w.left', { x: ROOM16.back - W, y: -1000, z: -ROOM16.half - W }, { x: ROOM16.front + W, y: FLOOR16, z: -ROOM16.half }),
  wall('w.right', { x: ROOM16.back - W, y: -1000, z: ROOM16.half }, { x: ROOM16.front + W, y: FLOOR16, z: ROOM16.half + W }),
];

export const F16_SURFACES: ReferenceSurface[] = [
  { id: 'origin', partId: 'origin', label: 'the marked origin', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, target: true },
  { id: 'source', partId: 'src', label: 'the test source', point: CENTRE_PT, normal: { x: -1, y: 0, z: 0 }, target: true },
];

export const F16_LINES: RefLine[] = [
  { id: 'baseline', label: 'the baseline axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: 1 }, surfaces: ['origin'] },
  { id: 'floor', label: 'the floor', point: { x: 0, y: FLOOR16, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the floor', minus: 'below the floor', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } },
];

export const F16_OP_SIDE = operatorSide(OP16.x, FLOOR16, 1);
export const F16_OP_TOP = operatorTop(OP16.x, OP16.z, 1);

export const F16_MODEL: InstrumentModel = measureModel({
  id: 'arrayRoom',
  name: 'array room',
  parts: PARTS,
  regions: [{ id: 'src', partId: 'src', label: 'the test source', anchor: CENTRE_PT, prov: ROOM, note: 'The source at the centre point: its sound reaches the two elements along the paths drawn from it.' }],
  surfaces: F16_SURFACES,
  lines: F16_LINES,
  variants: [{ id: 'room', label: 'A CONTROLLED ROOM', blurb: 'A stationary source at a modest level, a marked origin and axes, two elements on one clock.', phrase: 'in a controlled room' }],
  defaultVariant: 'room',
  views: F16_VIEWS,
  viewTags: { side: 'SECTION', top: 'PLAN' },
  groundY: { mm: FLOOR16, prov: ill('drawing default: the baseline 1.2 m above the floor') },
  aimAzLimit: 180,
});
