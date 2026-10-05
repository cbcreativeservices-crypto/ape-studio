/**
 * I01b RIDE CYMBAL — the technical truth (charter §2 layer 1). Source keys
 * point into docs/labs/miking/ride_cymbal/SOURCES.md (and hihat/SOURCES.md
 * §0, the Lab 2 key register); the geometry follows ride_cymbal/
 * GEOMETRY_PROPOSAL.md on the shared kit and cymbal family (RIDE_20, its boom
 * stand — unchanged).
 *
 * FRAME: the kit frame K. The ride hangs where the shared kit puts it: over
 * the floor tom, (−80, 640) in plan, its edge plane at h 1000, tilted 10°
 * toward the player.
 *
 * THE STARTING POINTS: one published number — a condenser "a foot or two
 * above" the ride to cover the rest of the cymbals (305–610 mm); the spot mic
 * over the bow (15–30 cm) and the mic underneath (8–15 cm) are DRAWING
 * DEFAULTS (proposal: "no source gives a spot distance"), each zone's
 * `bandProv` says so. All of them sit on the side away from the player, out
 * of the stick's side, and the under-mic stays off the ride's own boom.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { KIT_PLACED_CYMBALS, cymbalAreas } from '../shared/cymbals/cymbalSpec.ts';
import { at, bandDrawn, bandMid, ill, poseToward, towardThrone, type Band } from '../shared/cymbals/cymbalLesson.ts';

export const RIDE = KIT_PLACED_CYMBALS.ride;
export const RIDE_R = RIDE.spec.d.mm / 2;
export const RIDE_RISE = RIDE.spec.rise.mm;
export const AREAS = cymbalAreas(RIDE.spec);
export const TH_THRONE = towardThrone(RIDE).theta;
/** The stick's spots (ride_cymbal/GEOMETRY_PROPOSAL.md: drawing defaults on
 *  the sourced areas): the tip on the bow, the tip on the bell, the shoulder
 *  on the edge — toward the player. */
export const STRIKE = { bow: 150, bell: 30, edge: 240 } as const;
export const STRIKE_BOW = at(RIDE, STRIKE.bow, TH_THRONE, 12);

export const BAND = {
  area: { r: [0, 200], th: [15, 115], h: [305, 610] } as Band,
  spot: { r: [60, 215], th: [20, 110], h: [150, 300] } as Band,
  under: { r: [104, 224], th: [12, 52], h: [-150, -80] } as Band,
} as const;

export const RIDE_ZONES: DocumentedZone[] = [
  {
    id: 'ride.spot',
    label: 'Over the bow, a spot mic',
    band: 'Start about 15–30 cm (6–12 in) above the bow, on the side away from the player, aimed at the bow — or at the bell for bell accents.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'a compact directional mic aimed at the bow (or the bell for bell accents), outside the swing and the stick',
    bandProv: ill('no source gives a spot distance: 15–30 cm above the bow is the lab’s drawing (ride_cymbal/GEOMETRY_PROPOSAL.md zone.ride.spotTop)'),
    refSurface: 'rideTop',
    side: 'outside',
    distance: { min: 150, max: 300 },
    radial: { line: 'rideEdge', min: 60 - RIDE_R, max: 215 - RIDE_R, prov: ill('over the bow and bell: in from the edge band') },
    cone: { min: 10, max: 55, toward: { x: 0.35, y: 0, z: 0.94 }, prov: ill('the side away from the player, out of the stick’s side') },
    aimAt: { surface: 'rideTop', r: AREAS.edge[0], prov: ill('aimed at the bow or the bell, inside the edge band') },
    requires: { micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(RIDE, BAND.spot),
    start: poseToward(bandMid(RIDE, BAND.spot, { r: 0.5, h: 0.45 }), at(RIDE, 110, 65, 0)),
    tendency: 'The stick’s definition on the bow — the ride’s time — with less of the wash than an overhead hears. Toward the bell tends to bring a brighter, more cutting sound; toward the edge more of the wash.',
    checks: ['Out of the stick’s path and the player’s right arm', 'Clear of the swing after a hard crash on the edge', 'How much of the floor tom it hears below'],
  },
  {
    id: 'ride.area',
    label: 'A foot or two above, for the cymbals',
    band: 'Start a condenser about 30–60 cm (1–2 ft) above the ride, pointed down — a mic for the ride and the rest of the cymbals, not a spot.',
    kind: 'sourced',
    src: 'S-AL1568',
    quote: 'To pick up the rest of cymbals, place another condenser near the ride cymbal, a foot or two above.',
    refSurface: 'rideTop',
    side: 'outside',
    distance: { min: 304.8, max: 609.6 },
    radial: { line: 'rideEdge', max: 200 - RIDE_R, prov: ill('"near the ride cymbal": over the ride, in from its edge') },
    cone: { min: 0, max: 40, prov: ill('over the ride: within 40° of its straight-on line from the centre') },
    aim: { maxOffAxis: 35, prov: ill('pointed down: within 35° of straight down is the lab’s tolerance') },
    requires: { micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(RIDE, BAND.area),
    start: { p: bandMid(RIDE, BAND.area, { r: 0.45, h: 0.4 }), az: 0, el: -80 },
    tendency: 'A wider view: the ride with the other cymbals around it — closer to what an overhead hears. Higher takes in more of the kit; lower, more of the ride.',
    checks: ['Above the stick’s reach and the player’s arms', 'Clear of the crash beside the ride', 'Does it duplicate what the overheads already give?'],
  },
  {
    id: 'ride.under',
    label: 'Underneath, aimed up',
    band: 'Start about 8–15 cm (3–6 in) under the ride on the side away from the player, aimed up at its underside — clear of the ride’s own boom and the floor tom below.',
    kind: 'trial',
    src: 'DPA-KIT',
    quote: 'Mics are placed either on separate stands or on the cymbal stand pointing the microphone upward towards the underneath the cymbals.',
    bandProv: ill('no source gives a distance underneath: 8–15 cm below the edge plane, clear of the downward swing, is the lab’s drawing'),
    refSurface: 'rideUnder',
    side: 'outside',
    distance: { min: 80, max: 150 },
    radial: { line: 'rideEdge', min: 104 - RIDE_R, max: 224 - RIDE_R, prov: ill('under the bow') },
    cone: { min: 30, max: 72, toward: { x: 0.85, y: 0, z: 0.53 }, prov: ill('the audience side of the ride, between its own boom and the crash beside it') },
    aim: { maxOffAxis: 40, prov: ill('aimed up at the underside: within 40° of the plate’s straight-on line') },
    requires: { micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(RIDE, BAND.under),
    start: poseToward(bandMid(RIDE, BAND.under, { r: 0.45, h: 0.5 }), at(RIDE, 90, 32, 0)),
    tendency: 'Out of the stick’s way and the overheads’ view, with its rear toward the floor. From below there tends to be less stick and more of the plate’s wash.',
    checks: ['Clear of the ride’s boom and the floor tom', 'The swing after a hard crash on the edge', 'Its rear faces the floor: good for the monitors'],
  },
];

export const FLOOR = KIT_DRUMS.floor;
