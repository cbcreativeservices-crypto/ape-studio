/**
 * F08 MOVING SOURCES AND PASS-BYS — where things are (charter §2 layer 2),
 * in frame G (lessons/shared/field/frameG.ts): the closest permitted mic
 * position — the LISTENING POINT — at the origin, +x toward the path, +z the
 * array's right (the source travels from the left, −z, to the right, +z).
 * Research: field_moving_passby/GEOMETRY_PROPOSAL.md §1–§4.
 *
 *   walk     a park path closed to traffic, a consenting walker on a straight
 *            line 3 m from the listening point (drawing default — no source
 *            gives a setback, L74), from 15 m before the closest point to
 *            15 m after it; its envelope 1.5 m each side of the line; cones
 *            at the approach, the closest point and the departure
 *   vehicle  a PAPER PLAN only (L45, O-10): a closed, permitted route 9 m
 *            away, its envelope 3 m each side, the crew's setback line and
 *            barrier — never a pass the learner makes
 * Every distance and speed is a drawing default; the Doppler shift is the
 * textbook formula for a steady tone (OSX-DOPPLER), labelled an ideal model.
 */
import type { InstrumentModel, Part, RadiatingRegion, ReferenceSurface, RefLine, Variant, ViewBox, ViewId } from '../../engine/model/types.ts';
import { ill, measureModel } from '../shared/measure/measureModel.ts';
import { CLOSED_ROUTE, CREW_LINE_X, ROUTE_ENVELOPE, ROUTE_HALF, ROUTE_SITE, ROUTE_X, VEH_ENVELOPE, VEH_X, WALK_SOURCE_H, siteKeepOuts } from '../shared/field/sites.ts';
import { straightPath, VEHICLE_SPEED_MS, WALK_SPEED_MS, type PathDef } from '../shared/field/path.ts';

/** The mics' height at the listening point: 1.5 m (a drawing default). */
export const PB_H = 1500;
export const F08_SITE = { walk: ROUTE_SITE, vehicle: CLOSED_ROUTE } as const;

/** The walker's path (frame G): 15 m before and after the closest point. */
export const WALK_PATH: PathDef = straightPath({ x: ROUTE_X, y: -WALK_SOURCE_H, z: -ROUTE_HALF }, { x: ROUTE_X, y: -WALK_SOURCE_H, z: ROUTE_HALF }, WALK_SPEED_MS, ROUTE_ENVELOPE);
/** The paper plan's vehicle route: 22 m before and after. */
export const VEH_PATH: PathDef = straightPath({ x: VEH_X, y: -600, z: -22000 }, { x: VEH_X, y: -600, z: 22000 }, VEHICLE_SPEED_MS, VEH_ENVELOPE);

const VIEWS: Readonly<Record<'walk' | 'vehicle', Record<ViewId, ViewBox>>> = {
  walk: { side: { u0: -6000, u1: 11000, v0: -6500, v1: 1600 }, top: { u0: -6000, u1: 11000, v0: -16500, v1: 16500 } },
  vehicle: { side: { u0: -6000, u1: 15000, v0: -6000, v1: 1600 }, top: { u0: -6000, u1: 15000, v0: -23000, v1: 23000 } },
};

const SITE = ill('a drawing default: the route is illustrated (field_moving_passby/GEOMETRY_PROPOSAL.md §1)');

const PARTS: Part[] = [
  { id: 'path', label: 'the walking route', short: 'route', role: 'A path closed to traffic, agreed with the walker: approach, closest point, departure. The walker watches the route, never the mic.', prov: SITE, variants: ['walk'] },
  { id: 'walker', label: 'the walker', short: 'walker', role: 'A consenting performer at a normal pace: the moving source. Their possible deviation and stopping room are part of the keep-out.', moving: true, prov: SITE, variants: ['walk'] },
  { id: 'cones', label: 'the marker cones', short: 'cones', role: 'They mark where the walker enters, passes closest and leaves the picture — not traffic control.', prov: SITE, variants: ['walk'] },
  { id: 'route', label: 'the closed route', short: 'route', role: 'A permitted, closed route on paper: a driver, a safety lead and a communicated plan. No mic, stand or person inside its envelope.', prov: SITE, variants: ['vehicle'] },
  { id: 'vehicle', label: 'the vehicle', short: 'vehicle', role: 'In this lesson only a paper plan: the pass is planned and supervised by professionals, never staged by you.', moving: true, prov: SITE, variants: ['vehicle'] },
  { id: 'barrier', label: 'the crew’s setback line', short: 'setback', role: 'The crew and the mics stay behind it, outside the route’s envelope and its stopping room.', prov: SITE, variants: ['vehicle'] },
];

const REGIONS: RadiatingRegion[] = [
  { id: 'steps', partId: 'walker', label: 'the walker’s steps', anchor: { x: ROUTE_X, y: -WALK_SOURCE_H, z: 0 }, prov: SITE, variants: ['walk'], note: 'Footsteps, clothes and breath, moving along the path: loudest as they pass the closest point.' },
  { id: 'vehicle', partId: 'vehicle', label: 'the vehicle', anchor: { x: VEH_X, y: -600, z: 0 }, prov: SITE, variants: ['vehicle'], note: 'Tyres, engine and exhaust, moving along the route.' },
];

/** Distances are read from the path's centre line (or the route's). */
export const F08_SURFACES: ReferenceSurface[] = [
  { id: 'path', partId: 'path', label: 'the path’s centre line', point: { x: ROUTE_X, y: -PB_H, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'back from', key: 'BACK FROM' }, variants: ['walk'] },
  { id: 'route', partId: 'route', label: 'the route’s centre line', point: { x: VEH_X, y: -PB_H, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'back from', key: 'BACK FROM' }, variants: ['vehicle'] },
];
export const F08_LINES: RefLine[] = [{ id: 'ground', label: 'the ground', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the ground', minus: 'below the ground', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

const VARIANTS: Variant[] = [
  { id: 'walk', label: 'WALKING PASS', blurb: 'A consenting walker on a park path closed to traffic, passing 3 m from the listening point.', phrase: 'beside a walking route' },
  { id: 'vehicle', label: 'VEHICLE · PAPER PLAN', blurb: 'A paper plan for a professional session: a closed, permitted route, a driver and a safety lead, the crew behind a setback line.', phrase: 'on a paper plan of a closed route' },
];

export const F08_MODEL: InstrumentModel = {
  ...measureModel({
    id: 'passby',
    name: 'a pass-by',
    parts: PARTS,
    regions: REGIONS,
    surfaces: F08_SURFACES,
    lines: F08_LINES,
    envelopes: [...siteKeepOuts(ROUTE_SITE, 'walk'), ...siteKeepOuts(CLOSED_ROUTE, 'vehicle')],
    variants: VARIANTS,
    defaultVariant: 'walk',
    views: VIEWS.walk,
    viewsByVariant: { vehicle: VIEWS.vehicle },
    viewTags: { side: 'SECTION · TOWARD THE PATH', top: 'PLAN' },
    groundY: { mm: 0, prov: ill('the ground at the listening point (frame G)') },
    aimAzLimit: 180,
    labelMinScale: 0.008,
  }),
  // A field site keeps its authored boxes: its ground and paths are drawn, not solid.
  fitAuthored: { side: true, top: true },
  // A site plan metres wide: mics, lobes and stands drawn 6 × life size (said once in the accuracy note).
  hardwareScale: 6,
};

export const F08_DIMS = { routeX: ROUTE_X, envelope: ROUTE_ENVELOPE, vehX: VEH_X, vehEnvelope: VEH_ENVELOPE, crewLine: CREW_LINE_X };
