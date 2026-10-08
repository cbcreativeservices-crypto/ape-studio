/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — where things are (charter §2
 * layer 2). One SITE in scene frame F (lessons/shared/field/sceneFrame.ts):
 * the origin on the ground at the house's facade, +x toward the road, +y
 * down (the ground at y = 0, a height is −y), +z along the facade. A house
 * whose facade faces the road across a lawn, an air-handling unit beside
 * it, the road's lane, and an overhead power line on its poles along the
 * verge.
 *
 * Sizes and positions are DRAWING DEFAULTS (sound_level/GEOMETRY_PROPOSAL.md
 * §2) except: the method's receiver height 1.5 m (5 ft) and the facade
 * position 2 m (6.6 ft) out from its midpoint (FHWA-FG, CONFIRMED), and the
 * power line's 3 m (10 ft) keep-out (OSHA-ELEC, CONFIRMED) — shown as one
 * method's example, never as the universal height.
 */
import type { Envelope, InstrumentModel, Part, RefLine, ReferenceSurface, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel, src } from '../shared/measure/measureModel.ts';

export const F12_GROUND = 0;
/** The house: its facade at x = 0, z between −6 m and −1 m; eaves 5.5 m, ridge 7.6 m (drawing defaults). */
export const HOUSE = { x0: -7000, x1: 0, z0: -6000, z1: -1000, eaves: 5500, ridge: 7600 };
/** The facade's midpoint (z) — where the 2 m position is measured from. */
export const FACADE_MID_Z = (HOUSE.z0 + HOUSE.z1) / 2;
/** The road's lane: from its kerb at x = 7 m, 3.5 m wide (drawing default). */
export const ROAD = { x0: 7000, x1: 10500 };
/** The overhead power line along the verge: x = 6.6 m, 8 m up (drawing default); its keep-out 3 m (OSHA-ELEC). */
export const POWER = { x: 6600, h: 8000, keep: 3000, poles: [-5500, 3500] as const };
/** The air-handling unit beside the house (drawing default). */
export const HVAC = { x0: 250, x1: 1050, z0: -5700, z1: -4900, h: 900 };
/** The method's receiver height: 1.5 m (5 ft) above the ground (FHWA-FG). */
export const METHOD_HEIGHT = 1500;

export const F12_VIEWS: Record<'side' | 'top', ViewBox> = {
  side: { u0: -2400, u1: 11000, v0: -11400, v1: 600 },
  top: { u0: -2400, u1: 11000, v0: -7000, v1: 5000 },
};

const SITE = ill('drawing default: a house by a road (sound_level/GEOMETRY_PROPOSAL.md §2)');

const PARTS: Part[] = [
  {
    id: 'house',
    label: 'the house',
    short: 'house',
    role: 'The building whose people the question is about. Its facade faces the road.',
    solid: { kind: 'box', min: { x: HOUSE.x0, y: -HOUSE.ridge, z: HOUSE.z0 }, max: { x: HOUSE.x1, y: F12_GROUND, z: HOUSE.z1 } },
    prov: SITE,
  },
  {
    id: 'facade',
    label: 'the facade',
    short: 'facade',
    role: 'A hard wall facing the road: it reflects the traffic back toward a mic near it. A reading close to it includes that reflection — it cannot be called an open-field reading.',
    prov: src('FHWA-FG', 'building positions: 6.6 ft from the facade midpoint, and one "close to but not touching" the facade'),
  },
  {
    id: 'hvac',
    label: 'the air-handling unit',
    short: 'air unit',
    role: 'A steady source of its own. For the traffic it is background; for a question about the unit, it is the source — the question decides.',
    solid: { kind: 'box', min: { x: HVAC.x0, y: -HVAC.h, z: HVAC.z0 }, max: { x: HVAC.x1, y: F12_GROUND, z: HVAC.z1 } },
    prov: SITE,
  },
  {
    id: 'road',
    label: 'the road',
    short: 'road',
    role: 'The traffic is the source in this survey. Nobody stands in it: every position is on the property side, reached safely.',
    prov: SITE,
  },
  {
    id: 'power',
    label: 'the overhead power line',
    short: 'power line',
    role: 'Overhead conductors on poles along the verge. Keep any pole, stand or mast at least 3 m (10 ft) away from them — farther if unsure.',
    prov: src('OSHA-ELEC', 'Stay at least 10 feet away from overhead power lines.'),
  },
  {
    id: 'lawn',
    label: 'the lawn',
    short: 'ground',
    role: 'The ground between the house and the road: grass reflects less than paving, and the method names the height above it.',
    prov: SITE,
  },
];

export const F12_SURFACES: ReferenceSurface[] = [
  { id: 'road', partId: 'road', label: 'the road’s edge', point: { x: ROAD.x0, y: -METHOD_HEIGHT, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'back from', key: 'BACK FROM' } },
  { id: 'facade', partId: 'facade', label: 'the facade', point: { x: 0, y: -METHOD_HEIGHT, z: FACADE_MID_Z }, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'out from', key: 'OUT FROM' } },
];

/** The ground as a reference PLANE: the signed distance is the height above it. */
export const F12_LINES: RefLine[] = [{ id: 'ground', label: 'the ground', point: { x: 0, y: F12_GROUND, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above', minus: 'below', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

/** Keep-out: the road (nobody stands in traffic). The power line's 3 m (10 ft)
 *  keep-out is drawn round the conductor in the section (SiteArt): it is a rule
 *  for anything RAISED near it — a tripod at 1.5 m on the lawn is far below. */
const ENVELOPES: Envelope[] = [
  { id: 'env.road', label: 'the road: nobody stands in traffic', shape: { kind: 'box', min: { x: ROAD.x0, y: -4000, z: -20000 }, max: { x: ROAD.x1, y: F12_GROUND, z: 20000 } }, prov: SITE },
];

export const F12_MODEL: InstrumentModel = measureModel({
  id: 'roadSite',
  name: 'a house by a road',
  parts: PARTS,
  regions: [
    { id: 'traffic', partId: 'road', label: 'the traffic', anchor: { x: (ROAD.x0 + ROAD.x1) / 2, y: -500, z: 0 }, prov: SITE, note: 'Tyres and engines in the lane: the source of this survey, moving past.' },
    { id: 'hvacFan', partId: 'hvac', label: 'the air unit’s fan', anchor: { x: (HVAC.x0 + HVAC.x1) / 2, y: -HVAC.h, z: (HVAC.z0 + HVAC.z1) / 2 }, prov: SITE, note: 'A steady hum from the fan on top of the unit.' },
  ],
  surfaces: F12_SURFACES,
  lines: F12_LINES,
  envelopes: ENVELOPES,
  variants: [{ id: 'site', label: 'A HOUSE BY A ROAD', blurb: 'A survey of road traffic at a house: an open position on the lawn, positions at the facade, an air unit beside the house and a power line along the verge.', phrase: 'at a house by a road' }],
  defaultVariant: 'site',
  views: F12_VIEWS,
  viewTags: { side: 'SECTION', top: 'SITE PLAN' },
  groundY: { mm: F12_GROUND, prov: ill('the ground line of the site (the origin is on it)') },
  aimAzLimit: 180,
  labelMinScale: 0.02,
});
