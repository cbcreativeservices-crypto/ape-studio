/**
 * F05 FOLEY PERSPECTIVE AND MULTIPLE MICROPHONES — where things are (charter
 * §2 layer 2), on the shared Foley stage (lessons/shared/foley, frame F; the
 * origin at the MIDDLE OF THE ACTION'S PATH, at hand height: the key ring's
 * jingle as it passes the middle; +x toward the mics, +y down, +z the
 * performer's right; the floor 1 m below, y = 1000). Research:
 * foley_perspective/GEOMETRY_PROPOSAL.md §1.
 *
 * The action (F05 L53, the practice): a key ring CARRIED ACROSS a marked
 * zone 2 m wide at hand height — from the performer's right to their left,
 * which is the listener's left to right — scrubbed with a finger on the
 * lesson's own pages (the shared path tool, lessons/shared/field/path.ts, at
 * Foley-stage scale). Its whole movement is a keep-out lane.
 *
 *   keys  a quiet Foley stage
 *   live  the same action at a theatre's Foley station: the PA beside the
 *         stage, a wedge in front of the artist (group 1's live booth)
 * Every size is a drawing default except the stage pieces group 1 sourced.
 */
import type { Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, ReferenceSurface, Variant, ViewBox } from '../../engine/model/types.ts';
import { bodyColumn, sidePose, standing, topPose, type Body3 } from '../shared/foley/performer.ts';
import { v3 } from '../shared/foley/frameF.ts';
import { boothSolids } from '../shared/foley/stage.ts';
import { straightPath, type PathDef } from '../shared/field/path.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

/** The floor under the action (the keys at hand height, 1 m up). */
export const F05_FLOOR = 1000;
/** Half the marked zone the keys travel across (2 m, a drawing default). */
export const HALF_PATH = 1000;
/** The keys' path: the performer's right (+z) to their left (−z) — the listener's left to right. */
export const KEYS_PATH: PathDef = straightPath(v3(0, 30, HALF_PATH), v3(0, 30, -HALF_PATH), 1.0, 0);

/** The artist, mid-path, holding the key ring at the origin (the shared adult figure). */
export const ARTIST: Body3 = standing({ floorY: F05_FLOOR, x: -380, wrR: v3(-60, -30, 40), elR: v3(-300, -160, 220), wrL: v3(-390, 160, -230), elL: v3(-410, -100, -220), kindR: 'grip' });
export const ARTIST_SIDE = sidePose(ARTIST);
export const ARTIST_TOP = topPose(ARTIST);

/** The movement lane: the body and the hand along the whole 2 m path (a drawing default). */
export const LANE = { x0: -760, x1: 240, z0: -HALF_PATH - 380, z1: HALF_PATH + 380 };

const VARIANTS: Variant[] = [
  { id: 'keys', label: 'STUDIO', blurb: 'A quiet Foley stage: the artist carries a key ring across a marked 2 m zone at hand height.', phrase: 'carrying keys across a marked zone' },
  { id: 'live', label: 'LIVE STAGE', blurb: 'A theatre’s Foley station: the same action, the PA beside the stage, a wedge in front of the artist. The audience sees the artist.', phrase: 'at a live Foley station' },
];

function parts(): Part[] {
  const booth = boothSolids(F05_FLOOR);
  return [
    { id: 'f05.artist', label: 'the Foley artist', short: 'artist', role: 'The performer carries the keys across the zone in time with the picture: their steps, clothes and breath move with the action too. Their whole movement is a keep-out.', moving: true, prov: ill('the shared adult figure (drawing default)') },
    { id: 'f05.keys', label: 'key ring', short: 'keys', role: 'Keys jingling as they are carried: a small, bright source that MOVES — from one side of the zone to the other.', moving: true, prov: ill('a key ring, four keys (group 1’s drawing default)') },
    { id: 'f05.path', label: 'the marked path', short: 'path', role: 'A 2 m zone marked on the floor: where the keys start, pass the middle and finish. Every mic, stand and cable stays outside the lane round it.', prov: ill('2 m across, the practice’s “key ring carried across a marked zone” (F05 L53; the width a drawing default)'), solid: { kind: 'box', min: v3(-130, F05_FLOOR - 5, -HALF_PATH - 30), max: v3(130, F05_FLOOR, HALF_PATH + 30) } },
    { id: 'f05.room', label: 'the stage room', short: 'room', role: 'The room round the action: a farther mic hears more of it — the right room for some scenes, the wrong one for others.', prov: ill('a generic Foley stage room (drawing default)') },
    { id: 'f05.pa', label: 'PA loudspeaker, beside the stage', short: 'PA', role: 'The PA faces the audience — and every open mic hears it too.', prov: ill('a typical theatre layout (drawing default)'), variants: ['live'], solid: booth.pa },
    { id: 'f05.booth', label: 'the station’s front rail', short: 'station', role: 'A known station beside the stage: the action always performed in the same place for the mics.', prov: { kind: 'sourced', src: 'ENO-FOLEY', quote: 'A special booth is constructed stage left … so that the foley artist is visible to the audience' }, variants: ['live'], solid: booth.rail },
  ];
}

const REGIONS: RadiatingRegion[] = [
  { id: 'r.jingle', partId: 'f05.keys', label: 'the jingle', anchor: v3(0, 30, 0), prov: ill('the keys at the middle of the path'), note: 'Keys striking keys below the ring: small, bright metal clicks — moving along the path as they are carried.' },
  { id: 'r.room', partId: 'f05.room', label: 'the room', anchor: v3(-1700, -600, 0), prov: ill('the stage room (drawing default)'), note: 'The keys’ sound reaches the walls and comes back: a farther mic hears more of it.' },
];

const ENVELOPES: Envelope[] = [
  { id: 'env.lane', label: 'the artist’s path and movement', shape: { kind: 'box', min: v3(LANE.x0, F05_FLOOR - 1850, LANE.z0), max: v3(LANE.x1, F05_FLOOR, LANE.z1) }, prov: ill('the body and the hand along the whole 2 m path, plus a margin (drawing default)') },
  { ...bodyColumn({ x: ARTIST.neck.x - 10, floorY: F05_FLOOR, r: 270 }) },
];

/** Distances are read from the keys at the middle of the path (a target point). */
const SURFACES: ReferenceSurface[] = [{ id: 'part', partId: 'f05.keys', label: 'the keys at the middle of the path', point: v3(0, 0, 0), normal: v3(1, 0, 0), target: true }];

const side: ViewBox = { u0: -1100, u1: 3600, v0: -1700, v1: 1060 };
const top: ViewBox = { u0: -1100, u1: 3600, v0: -2700, v1: 1800 };

export const F05_MODEL: InstrumentModel = {
  id: 'foleyPerspective',
  name: 'a Foley action on a marked path',
  parts: parts(),
  regions: REGIONS,
  surfaces: SURFACES,
  lines: [],
  envelopes: ENVELOPES,
  variants: VARIANTS,
  defaultVariant: 'keys',
  views: { side, top },
  viewTags: { side: 'SIDE · FROM THE ARTIST’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: F05_FLOOR, prov: ill('the stage floor 1 m below the keys (a drawing default)') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { keys: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  insetAt: 'bottom',
};
