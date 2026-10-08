/**
 * F15 MACHINERY AND PRODUCT SOUND — where things are (charter §2 layer 2).
 * One room in scene frame F (lessons/shared/field/sceneFrame.ts): a GUARDED
 * DESK FAN on a small table — the lesson's own low-risk device (F15 L47;
 * machinery_sound/GEOMETRY_PROPOSAL.md §2) — the origin at the fan's
 * footprint centre on the table top (the reflecting plane it stands on), +x
 * along its airflow, +y down (the table top y = 0, the floor y = 700), +z
 * across. Round it: the EXCLUSION ZONE (the guard plus 0.3 m) and the
 * AIRFLOW cone ahead of it (shared/measure/exclusion.ts), both hard keep-outs;
 * the wall behind; you, standing back.
 *
 * Every size is a DRAWING DEFAULT (no source gives a fan's size, the table,
 * the zone's margin or the cone) except the receivers' seated ear height,
 * 1.2 m (MEYER-MAPP, reused as the seated user's height — the proposal's
 * own choice). Industrial machines never appear here: only as a no-go
 * example on the keep-out page.
 */
import type { InstrumentModel, Part, RefLine, ReferenceSurface, Vec3, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel, operatorPart, operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import { exclusionSolids, type Exclusion } from '../shared/measure/exclusion.ts';

/** The table top is y = 0; the floor is 700 below it. */
export const TABLE = { half: 300, top: 0, floor: 700, slab: 30 };
/** The fan (mm): the hub 300 above the table, the guard's radius and depth, the motor housing behind. */
export const FAN = { hubH: 300, guardR: 150, guardFront: 75, guardRim: 15, guardBack: -45, motorBack: -190, motorR: 75, baseR: 110, baseH: 25 };
export const HUB: Vec3 = { x: 0, y: -FAN.hubH, z: 0 };
/** The motor housing's centre (the close detail's reference). */
export const MOTOR: Vec3 = { x: (FAN.guardBack + FAN.motorBack) / 2, y: -FAN.hubH, z: 0 };
/** The circle A, B and C sit on: its centre above the footprint, at the mic height. */
export const EAR_Y = TABLE.floor - 1200;
export const CENTRE: Vec3 = { x: 0, y: EAR_Y, z: 0 };
/** The wall behind the fan (a reflecting surface the room adds). */
export const WALL_X = -1800;
/** Where you stand: back from every position, outside the zone. */
export const OP15 = { x: -1250, z: -1350 };

export const EXCL: Exclusion = { hub: HUB, guardR: FAN.guardR, back: -FAN.motorBack, front: FAN.guardFront, margin: 300, flow: { x: 1, y: 0, z: 0 }, flowHalfDeg: 15, flowLen: 2000, standY: TABLE.top };

export const F15_VIEWS: Record<'side' | 'top', ViewBox> = {
  side: { u0: WALL_X - 250, u1: 2350, v0: -1050, v1: TABLE.floor + 60 },
  top: { u0: WALL_X - 250, u1: 2350, v0: -1700, v1: 1450 },
};

const FANP = ill('drawing default: a guarded desk fan about 30 cm across (machinery_sound/GEOMETRY_PROPOSAL.md §2)');
const ROOM = ill('drawing default: a small table and the wall behind it');
const solids = exclusionSolids(EXCL);

const PARTS: Part[] = [
  { id: 'fan.guard', label: 'the guard', short: 'guard', role: 'The wire cage round the blades. It stays on, always: nothing — a mic, a stand, a finger — reaches through it.', solid: { kind: 'cyl', a: { x: FAN.guardBack, y: HUB.y, z: 0 }, b: { x: FAN.guardFront, y: HUB.y, z: 0 }, r: FAN.guardR }, prov: FANP },
  { id: 'fan.blades', label: 'the blades', short: 'blades', role: 'The spinning blades push the air forward — and make the fan’s whoosh and its blade tone.', prov: FANP },
  { id: 'fan.motor', label: 'the motor housing', short: 'motor', role: 'The motor behind the blades: its hum, and a rattle if a part works loose. A close mic beside it hears it far more than the airflow.', solid: { kind: 'cyl', a: { x: FAN.guardBack, y: HUB.y, z: 0 }, b: { x: FAN.motorBack, y: HUB.y, z: 0 }, r: FAN.motorR }, prov: FANP },
  { id: 'fan.vent', label: 'the rear vent', short: 'rear vent', role: 'Slots at the back of the motor where it draws cooling air: sound leaves here too.', prov: FANP },
  { id: 'fan.base', label: 'the base', short: 'base', role: 'The base and column on the table: the fan’s vibration reaches the table top through them.', solid: { kind: 'cyl', a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: -FAN.baseH, z: 0 }, r: FAN.baseR }, prov: FANP },
  { id: 'sensor', label: 'the contact sensor', short: 'contact sensor', role: 'A contact sensor on the motor housing, fixed on by a qualified person while the fan was off and unplugged: the housing’s vibration, in its own units, on its own channel — not airborne sound.', prov: FANP },
  { id: 'zone', label: 'the exclusion zone', short: 'exclusion zone', role: 'The guard’s reach plus a margin: no mic, no stand, no cable, no hand inside it while the fan runs. If a position cannot be reached from outside it, leave that position out.', solid: solids.zone, prov: ill('drawing default: 0.3 m beyond the guard (machinery_sound/GEOMETRY_PROPOSAL.md §2)') },
  { id: 'airflow', label: 'the airflow', short: 'airflow', role: 'The air the fan pushes forward. A capsule in it reads wind, not the fan: keep the mics beside the stream.', solid: solids.airflow, prov: ill('drawing default: a 30° cone, 2 m long, from the guard’s face') },
  { id: 'table', label: 'the table', short: 'table', role: 'The small table the fan stands on: a reflecting surface close to the fan, and a path for its vibration.', solid: { kind: 'box', min: { x: -TABLE.half, y: TABLE.top, z: -TABLE.half }, max: { x: TABLE.half, y: TABLE.floor, z: TABLE.half } }, prov: ROOM },
  { id: 'wall', label: 'the wall behind', short: 'wall', role: 'A hard wall behind the fan: its reflection reaches each position by a different path.', listIn: [], solid: { kind: 'box', min: { x: WALL_X - 200, y: -1050, z: -1700 }, max: { x: WALL_X, y: TABLE.floor, z: 1700 } }, prov: ROOM },
  operatorPart(OP15.x, OP15.z, TABLE.floor, 'You, standing back outside the exclusion zone while the fan runs — and out of the paths to the mics.'),
];

export const F15_SURFACES: ReferenceSurface[] = [
  { id: 'centre', partId: 'fan.base', label: 'the fan, at the mic height', point: CENTRE, normal: { x: 1, y: 0, z: 0 }, target: true },
  { id: 'hub', partId: 'fan.guard', label: 'the fan’s hub', point: HUB, normal: { x: 1, y: 0, z: 0 }, target: true },
  { id: 'motor', partId: 'fan.motor', label: 'the motor housing', point: MOTOR, normal: { x: 0, y: 0, z: 1 }, target: true },
];

export const F15_LINES: RefLine[] = [{ id: 'floor', label: 'the floor', point: { x: 0, y: TABLE.floor, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the floor', minus: 'below the floor', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

export const F15_OP_SIDE = operatorSide(OP15.x, TABLE.floor, 1);
export const F15_OP_TOP = operatorTop(OP15.x, OP15.z, 1);

export const F15_MODEL: InstrumentModel = measureModel({
  id: 'deskFan',
  name: 'guarded desk fan',
  parts: PARTS,
  regions: [
    { id: 'blades', partId: 'fan.blades', label: 'the blades and the guard', anchor: { x: FAN.guardRim, y: HUB.y, z: 0 }, prov: FANP, note: 'The whoosh and the blade tone leave the guard, strongest along the airflow.' },
    { id: 'motor', partId: 'fan.motor', label: 'the motor and its vent', anchor: MOTOR, prov: FANP, note: 'The motor’s hum and any rattle leave the housing and its rear vent.' },
  ],
  surfaces: F15_SURFACES,
  lines: F15_LINES,
  variants: [{ id: 'fan', label: 'GUARDED DESK FAN', blurb: 'A low-risk device under its own instructions: guards on, an exclusion zone round it, the mics outside it.', phrase: 'on a small table' }],
  defaultVariant: 'fan',
  views: F15_VIEWS,
  viewTags: { side: 'SIDE', top: 'FROM ABOVE' },
  groundY: { mm: TABLE.floor, prov: ill('drawing default: the table top 0.7 m above the floor') },
  aimAzLimit: 180,
});
