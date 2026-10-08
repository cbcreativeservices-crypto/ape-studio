/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — where things are (charter §2 layer
 * 2). One ROOM in scene frame F (lessons/shared/field/sceneFrame.ts): a
 * rehearsal or small concert room, the origin at the omni test source's
 * centre on its stand at the performer position, +x toward the audience,
 * +y down (the floor 1.5 m below the source), +z across the room. Two
 * states: the omni test source (room only) and the installed PA (system +
 * room).
 *
 * Every size and position is a DRAWING DEFAULT (room_acoustics/
 * GEOMETRY_PROPOSAL.md §2) except the receivers' seated ear height, 1.2 m
 * (MEYER-MAPP, CONFIRMED — used as a sensible listener height, labelled as
 * such, never as the method's rule).
 */
import type { InstrumentModel, Part, RefLine, ReferenceSurface, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel } from '../shared/measure/measureModel.ts';

/** The floor, 1.5 m below the source's centre (drawing default). */
export const F13_FLOOR = 1500;
export const ROOM13 = { back: -2000, front: 8000, half: 3500, ceiling: 4000, door: { z0: -2600, z1: -1500 } };
/** Rows of seats (x) and the seats across each row (z), an aisle down the middle. */
export const ROWS = [2500, 3400, 4300, 5200, 6100, 7000] as const;
export const SEATS_Z = [-2700, -2100, -1500, -900, 900, 1500, 2100, 2700] as const;
/** The installed PA: two loudspeakers on tall stands at the stage's front corners. */
export const PA13 = { x: 600, z: 3000, h: 2200, depth: 300, half: 160, top: 280, bottom: 330 };
/** The omni source's radius (drawing default) and its stand. */
export const SRC_R = 190;
/** The receivers' seated ear height (MEYER-MAPP). */
export const EAR = 1200;
export const earY = F13_FLOOR - EAR;

export const F13_VIEWS: Record<'side' | 'top', ViewBox> = {
  side: { u0: -2250, u1: 8250, v0: F13_FLOOR - ROOM13.ceiling - 250, v1: F13_FLOOR + 120 },
  top: { u0: -2250, u1: 8250, v0: -ROOM13.half - 250, v1: ROOM13.half + 250 },
};

const ROOM = ill('drawing default: a rehearsal or small concert room (room_acoustics/GEOMETRY_PROPOSAL.md §2)');
const TOP = F13_FLOOR - ROOM13.ceiling;
const W = 200;
const wall = (id: string, label: string, min: { x: number; y: number; z: number }, max: { x: number; y: number; z: number }): Part => ({ id, label, short: 'wall', role: '', prov: ROOM, listIn: [], solid: { kind: 'box', min, max } });

const PARTS: Part[] = [
  {
    id: 'src',
    label: 'the omni test source',
    short: 'test source',
    role: 'A twelve-sided loudspeaker ball on a stand at a performer position: it sends sound out broadly, much as a performer would — so the room, not one loudspeaker’s aim, shapes the result.',
    variants: ['room'],
    solid: { kind: 'capsule', a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: F13_FLOOR, z: 0 }, r: SRC_R + 20 },
    prov: ROOM,
  },
  {
    id: 'pa',
    label: 'the installed PA',
    short: 'PA',
    role: 'The house loudspeakers, through their processing: a test through them measures the system and the room together — label it so.',
    variants: ['pa'],
    solid: { kind: 'box', min: { x: PA13.x - PA13.depth, y: F13_FLOOR - PA13.h - PA13.top, z: -PA13.z - PA13.half }, max: { x: PA13.x, y: F13_FLOOR, z: -PA13.z + PA13.half } },
    prov: ROOM,
  },
  {
    id: 'pa.R',
    label: 'the installed PA (the other side)',
    short: 'PA',
    role: 'The second house loudspeaker.',
    variants: ['pa'],
    listIn: [],
    solid: { kind: 'box', min: { x: PA13.x - PA13.depth, y: F13_FLOOR - PA13.h - PA13.top, z: PA13.z - PA13.half }, max: { x: PA13.x, y: F13_FLOOR, z: PA13.z + PA13.half } },
    prov: ROOM,
  },
  { id: 'seats', label: 'the seats', short: 'seats', role: 'Where the listeners sit — and where the receivers go, at a seated ear height. Empty and occupied rooms can sound different.', prov: ROOM },
  { id: 'curtains', label: 'the side-wall curtains', short: 'curtains', role: 'Part of the room’s state: open or drawn, they change the decay. Log their state for every run.', prov: ROOM },
  { id: 'door', label: 'the door', short: 'door', role: 'Part of the room’s state: open or shut changes the room. Log it.', prov: ROOM },
  { id: 'vent', label: 'the air-handling vent', short: 'air vent', role: 'Background noise from the air handling sets the floor a decay has to clear: log whether it ran.', prov: ROOM },
  wall('w.back', 'back wall', { x: ROOM13.back - W, y: TOP - W, z: -ROOM13.half - W }, { x: ROOM13.back, y: F13_FLOOR, z: ROOM13.half + W }),
  wall('w.front', 'rear wall', { x: ROOM13.front, y: TOP - W, z: -ROOM13.half - W }, { x: ROOM13.front + W, y: F13_FLOOR, z: ROOM13.half + W }),
  wall('w.left', 'side wall', { x: ROOM13.back - W, y: TOP - W, z: -ROOM13.half - W }, { x: ROOM13.front + W, y: F13_FLOOR, z: -ROOM13.half }),
  wall('w.right', 'side wall', { x: ROOM13.back - W, y: TOP - W, z: ROOM13.half }, { x: ROOM13.front + W, y: F13_FLOOR, z: ROOM13.half + W }),
  wall('w.ceiling', 'ceiling', { x: ROOM13.back - W, y: TOP - W, z: -ROOM13.half - W }, { x: ROOM13.front + W, y: TOP, z: ROOM13.half + W }),
];

/** The left PA's front, at its acoustic centre (the reference for the system-and-room seats). */
export const PA_REF = { x: PA13.x, y: F13_FLOOR - PA13.h, z: -PA13.z };

export const F13_SURFACES: ReferenceSurface[] = [
  { id: 'src', partId: 'src', label: 'the test source’s centre', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['room'] },
  { id: 'pa', partId: 'pa', label: 'the PA loudspeaker', point: PA_REF, normal: { x: 1, y: 0, z: 0 }, target: true, variants: ['pa'] },
];

export const F13_LINES: RefLine[] = [{ id: 'floor', label: 'the floor', point: { x: 0, y: F13_FLOOR, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the floor', minus: 'below the floor', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

export const F13_MODEL: InstrumentModel = measureModel({
  id: 'testRoom',
  name: 'a rehearsal room',
  parts: PARTS,
  regions: [
    { id: 'srcBall', partId: 'src', label: 'the test source', anchor: { x: 0, y: 0, z: 0 }, prov: ROOM, variants: ['room'], note: 'Sound leaves the ball broadly in every direction.' },
    { id: 'paFront', partId: 'pa', label: 'the PA loudspeaker', anchor: PA_REF, prov: ROOM, variants: ['pa'], note: 'Sound leaves the PA mostly forward, toward the audience — its directivity shapes what each seat hears.' },
  ],
  surfaces: F13_SURFACES,
  lines: F13_LINES,
  variants: [
    { id: 'room', label: 'TEST SOURCE · ROOM ONLY', blurb: 'An omni test source at a performer position: the result describes the room.', phrase: 'with an omni test source' },
    { id: 'pa', label: 'INSTALLED PA · SYSTEM + ROOM', blurb: 'The house PA as the source, through its processing: the result describes the system and the room together.', phrase: 'with the installed PA' },
  ],
  defaultVariant: 'room',
  views: F13_VIEWS,
  viewTags: { side: 'SECTION', top: 'PLAN' },
  groundY: { mm: F13_FLOOR, prov: ill('drawing default: the source’s centre 1.5 m above the floor'), placeholder: true },
  aimAzLimit: 180,
  labelMinScale: 0.03,
});

