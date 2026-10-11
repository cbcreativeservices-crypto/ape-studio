/**
 * A03 FRENCH HORN — the technical truth and where things are (charter §2
 * layers 1–2), on the shared low-brass family (lessons/shared/lowbrass).
 * Keys point into docs/labs/miking/french_horn/SOURCES.md and
 * trumpet/SOURCES.md §0. Owner ruling 2026-10-04: `src`, `quote`, every
 * `prov` and the unknowns are the internal record; the learner sees
 * starting points only.
 *
 * FRAME H (lowBrassScene.ts): origin on the floor under the seat; +x toward
 * the audience; +y DOWN; +z the player's right. The bell sits behind and to
 * the right of the right hip and points to the REAR, out and a little down;
 * the right hand is in the bell.
 *
 * SUGGESTED STARTING POINTS (corrections LB-03 … LB-06):
 *   rear   behind and beside the bell, low, aimed toward it and a little off
 *          its axis — the bell-side school ("aiming toward bell"; "behind the
 *          horn player, often closer to the ground … off axis"). No published
 *          distance for the horn: 50–100 cm is the lab's drawing (the general
 *          brass 1–2 ft is a comparison, not a horn figure — the lesson's own
 *          caution, LB-04);
 *   above  in front of the player and above the horn — the front-spot school
 *          (a figure-8 from above, its side null toward a piano); 40–80 cm is
 *          the proposal's drawing default;
 *   below  in front and beneath the horn — the same session's second front
 *          spot (a large-diaphragm cardioid); 40–70 cm, a drawing default.
 * The front MAIN view (a main pair or one mic farther in front, hearing the
 * horn after the room's reflection) is taught in words and on the sound
 * page's wall picture: it has no distance to rest a mic in (LB-05).
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { add, norm } from '../../engine/geometry/vec.ts';
import { HORN } from '../shared/lowbrass/lowBrassSpec.ts';
import { brassScene, v } from '../shared/lowbrass/lowBrassScene.ts';
import { coneDraw, poseAt } from '../shared/lowbrass/lowBrassModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const SPEC = HORN;
export const SCENE = brassScene(HORN, 'back');
export const RIM = SCENE.bell.rim;
export const AXIS = SCENE.bell.axis;
export const CENTRE = SCENE.centre;

/** The rear spot's direction: off the bell's axis, lower and farther out. */
const REAR_DIR: Vec3 = norm(add(AXIS, v(0, 0.35, 0.15)));
const UP: Vec3 = v(0, -1, 0);
const DOWN: Vec3 = v(0, 1, 0);
const FRONT_UP: Vec3 = norm(v(1, -1, 0));
const FRONT_DOWN: Vec3 = norm(v(Math.cos(40 * (Math.PI / 180)), Math.sin(40 * (Math.PI / 180)), 0));
const X: Vec3 = v(1, 0, 0);

export const HORN_ZONES: DocumentedZone[] = [
  {
    id: 'hn.rear',
    label: 'Behind and beside the bell, aimed toward it',
    band: 'Start about 50 cm–1 m (20–40 in) from the bell, behind the player and out to the bell’s side, low — aimed toward the bell, a little off its axis.',
    kind: 'trial',
    src: 'S-LIVE + MDAT',
    quote: 'French horn: Natural — Watch out for extreme fluctuations on VU meter. Microphone aiming toward bell (S-LIVE); Horn — Microphone will be placed behind the horn player, often closer to the ground. Again aim the microphone off axis to avoid harshness. (MDAT)',
    bandProv: ill('no published horn distance: 50–100 cm is the lab’s drawing, inside the proposal’s 600–1200 default and the lesson’s caution that the brass 1–2 ft is only a comparison (LB-04)'),
    refSurface: 'bell',
    side: 'outside',
    distance: { min: 500, max: 1000 },
    cone: { min: 8, max: 50, prov: ill('“off axis”: 8–50° from the bell’s axis is the lab’s drawing') },
    aim: { maxOffAxis: 30, prov: ill('“aiming toward bell”: within 30° of the bell’s centre is the lab’s tolerance') },
    requires: { micTypeIds: ['smallDynCard', 'sdcCard'] },
    draw: coneDraw(RIM, AXIS, null, 500, 1000, 8, 50),
    start: poseAt(RIM, REAR_DIR, 760),
    tendency: 'A direct, more forceful horn — more brass edge, hand and bell detail, and bigger swings in level — with less of the room. Listen for an unnaturally hard sound; if so, move off axis or farther.',
    checks: ['The bell rising in a “bells up” passage', 'The right hand and a mute going in and out', 'Level swings on the loudest accents'],
  },
  {
    id: 'hn.above',
    label: 'In front of the player, above the horn',
    band: 'Try about 40–80 cm (16–32 in) in front of the horn and above it, aimed down at the horn — a front view that hears the horn with the room.',
    kind: 'trial',
    src: 'IHS-ROSTRUP',
    quote: 'One figure-8 microphone side-rejecting the piano sound from above the horn … the horn should be miked from a position in front of the horn player',
    bandProv: ill('no distance in the session account: 40–80 cm is the proposal’s drawing default (zone.hn.spot.above)'),
    refSurface: 'centre',
    side: 'outside',
    distance: { min: 400, max: 800 },
    cone: { min: 25, max: 65, toward: UP, prov: ill('in front and above: 25–65° up from straight in front (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the horn: within 30° of its centre') },
    requires: { micTypeIds: ['lbRibbon', 'sdcCard'] },
    draw: coneDraw(CENTRE, X, UP, 400, 800, 25, 65),
    start: poseAt(CENTRE, FRONT_UP, 600),
    tendency: 'The horn as the audience side hears it — softer, rounder and more blended, the room’s reflection part of the sound. In a dry or noisy room it can sound dull or distant.',
    checks: ['The room is worth hearing', 'The player’s sight line to the music and the conductor', 'Where a figure-8’s side null points (a piano, a neighbour)'],
  },
  {
    id: 'hn.below',
    label: 'In front of the player, below the horn',
    band: 'Or try about 40–70 cm (16–28 in) in front and below the horn, aimed up at it — the other front spot, compared at matched level.',
    kind: 'trial',
    src: 'IHS-ROSTRUP',
    quote: 'a vacuum tube large diaphragm cardioid from beneath the horn',
    bandProv: ill('no distance in the session account: 40–70 cm is the proposal’s drawing default (zone.hn.spot.below)'),
    refSurface: 'centre',
    side: 'outside',
    distance: { min: 400, max: 700 },
    cone: { min: 20, max: 60, toward: DOWN, prov: ill('in front and below: 20–60° down from straight in front (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the horn: within 30° of its centre') },
    requires: { micTypeIds: ['lbLdc', 'sdcCard'] },
    draw: coneDraw(CENTRE, X, DOWN, 400, 700, 20, 60),
    start: poseAt(CENTRE, FRONT_DOWN, 550),
    tendency: 'A front view that may give a little more body than the mic above. Compare the two at matched level — a different balance, not a better one.',
    checks: ['The knees, the feet and the stand’s base', 'Floor reflections and stage rumble', 'Matched level when you compare'],
  },
];

/** The view boxes (mm): the player, the bell and every starting point. */
export const HORN_VIEWS = {
  back: {
    side: { u0: -1120, u1: 1100, v0: -1560, v1: 40 },
    top: { u0: -1120, u1: 1100, v0: -560, v1: 1120 },
  },
};

