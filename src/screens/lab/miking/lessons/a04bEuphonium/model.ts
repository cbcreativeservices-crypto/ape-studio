/**
 * A04b EUPHONIUM — the technical truth and where things are (charter §2
 * layers 1–2), on the shared low-brass family (lessons/shared/lowbrass).
 * Keys point into docs/labs/miking/euphonium/SOURCES.md and
 * trumpet/SOURCES.md §0. Owner ruling 2026-10-04: `src`, `quote`, every
 * `prov` and the unknowns are the internal record; the learner sees
 * starting points only.
 *
 * FRAME H (lowBrassScene.ts): origin on the floor under the seat; +x toward
 * the audience; +y DOWN; +z the player's right. A seated player, the
 * euphonium on the lap; BELL UP (most concert setups, the default) or BELL
 * FRONT (a bell-front model made for forward projection) — both sourced.
 *
 * RECOMMENDED STARTING POINTS:
 *   above   about 2 ft (60 cm) above an upright bell, aimed toward its edge —
 *           56–66 cm, drawn ±5 cm round 61 cm;
 *   side    1–2 ft from the bell, slightly off axis — 30.5–61 cm; for an
 *           upward bell above it and to the side, never lowered into it;
 *   far     a more distant view of the whole euphonium and the room — no
 *           number in the lesson: 0.9–1.3 m, a drawing default.
 * The player may STAND: a box in front of the chair (600 mm deep, the
 * proposal's drawing default) is kept clear.
 */
import type { DocumentedZone, Envelope, Provenance } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { EUPH } from '../shared/lowbrass/lowBrassSpec.ts';
import { brassScene, v } from '../shared/lowbrass/lowBrassScene.ts';
import { coneDraw, frontEdge, poseAt } from '../shared/lowbrass/lowBrassModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const SPEC = EUPH;
export const UP = brassScene(EUPH, 'up');
export const FRONT = brassScene(EUPH, 'front');
export const CENTRE = UP.centre;

const X = v(1, 0, 0);
const ABOVE_DIR = norm(add(UP.bell.axis, scale(X, 0.27)));
const SIDE_UP_DIR = norm(add(scale(UP.bell.axis, Math.cos(40 * (Math.PI / 180))), scale(X, Math.sin(40 * (Math.PI / 180)))));
const SIDE_FRONT_DIR = norm(add(FRONT.bell.axis, v(0, 0, 0.45)));
const FAR_DIR = norm(v(1, -0.12, 0.12));
const ALL = ['smallDynCard', 'sdcCard', 'lbRibbon', 'lbLdc'];
/** The same types, the large condenser first: about 60 cm above a big bell
 *  is a distance where a working engineer starts with a large-diaphragm mic
 *  (review 2026-10-07, CORRECTIONS_LOG RV34-04) — the setup, the worked
 *  example and MICROPHONES draw the first type a zone takes. */
const ABOVE_FIRST = ['lbLdc', 'sdcCard', 'lbRibbon', 'smallDynCard'];

/** The player standing up: the space in front of the chair stays clear. */
export const STAND_UP: Envelope = {
  id: 'env.standUp',
  label: 'the player’s path to stand',
  shape: { kind: 'box', min: v(180, -1750, -280), max: v(780, 0, 280) },
  prov: ill('the stand-up path: a box 600 mm deep in front of the chair (euphonium/GEOMETRY_PROPOSAL.md, a drawing default)'),
};

export const EUPH_ZONES: DocumentedZone[] = [
  {
    id: 'eu.above',
    label: 'About two feet above the bell, aimed toward its edge',
    band: 'Start about 55–65 cm (22–26 in) above the bell, aimed toward an outer part of the opening — not straight down into it.',
    kind: 'sourced',
    src: 'MDAT',
    quote: 'Euphonium — Position the microphone about 2 feet above the bell of the instrument with it aimed at the edge of the bell.',
    bandProv: ill('"about 2 feet": drawn 56–66 cm round 61 cm'),
    refSurface: 'bellUp',
    side: 'outside',
    distance: { min: 560, max: 660 },
    cone: { min: 0, max: 30, prov: ill('“above the bell”: within 30° of its axis (the lab’s drawing)') },
    aim: { maxOffAxis: 35, prov: ill('“aimed at the edge”: within 35° of the bell’s centre (an edge is ≈ 14° off it at this distance)') },
    requires: { variant: 'up', micTypeIds: ABOVE_FIRST },
    draw: coneDraw(UP.bell.rim, UP.bell.axis, null, 560, 660, 0, 30),
    start: poseAt(UP.bell.rim, ABOVE_DIR, 610, frontEdge(UP)),
    tendency: 'An open, rounded euphonium — sustained body, soft endings and some of the room and the section. In a noisy room or a loud band it hears a lot besides the euphonium.',
    checks: ['The player rising or tilting the bell', 'The boom outside the space above the bell', 'Spill from the section'],
  },
  {
    id: 'eu.side',
    label: 'A foot or two from the bell, above and slightly off axis',
    band: 'Try about 30–60 cm (1–2 ft) from the bell, above it and a little to the side, aimed across the opening — slightly off its axis.',
    kind: 'sourced',
    src: 'S-BWS',
    quote: 'start by placing the microphone 1 to 2 feet from the bell … On-axis = brighter and more defined, Off-axis = softer with less bite',
    bandProv: ill('"1 to 2 feet": 30.5–61 cm; above and to the side for an upward bell (the lesson’s geometry)'),
    refSurface: 'bellUp',
    side: 'outside',
    distance: { min: 305, max: 610 },
    cone: { min: 25, max: 60, prov: ill('slightly off the axis, above and to the side: 25–60° (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed across the opening: within 30° of the bell’s centre') },
    requires: { variant: 'up', micTypeIds: ALL },
    draw: coneDraw(UP.bell.rim, UP.bell.axis, X, 305, 610, 25, 60),
    start: poseAt(UP.bell.rim, SIDE_UP_DIR, 460),
    tendency: 'A tighter, more isolated euphonium with more articulation — and more local bell, valve and breath detail. Toward the axis: brighter; off it: softer.',
    checks: ['The player rising or tilting the bell', 'Valve noise and breath', 'Bright, brittle top notes'],
  },
  {
    id: 'eu.sideF',
    label: 'A foot or two in front of a front bell, slightly off axis',
    band: 'With a bell-front euphonium, try about 30–60 cm (1–2 ft) in front of the bell, slightly to the side of its axis — the stand placed in the bell’s real direction.',
    kind: 'sourced',
    src: 'S-BWS',
    quote: 'start by placing the microphone 1 to 2 feet from the bell … On-axis = brighter and more defined, Off-axis = softer with less bite',
    bandProv: ill('"1 to 2 feet": 30.5–61 cm'),
    refSurface: 'bellFront',
    side: 'outside',
    distance: { min: 305, max: 610 },
    cone: { min: 12, max: 50, prov: ill('slightly off the axis: 12–50° (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the bell: within 30° of its centre') },
    requires: { variant: 'front', micTypeIds: ALL },
    draw: coneDraw(FRONT.bell.rim, FRONT.bell.axis, null, 305, 610, 12, 50),
    start: poseAt(FRONT.bell.rim, SIDE_FRONT_DIR, 460),
    tendency: 'A direct, projecting euphonium: a front bell beams its overtones at the mic. Off axis softens it; on axis brightens it.',
    checks: ['The player’s path to stand and their sight line', 'Bright, brittle top notes', 'The wedges in front of the mic'],
  },
  {
    id: 'eu.far',
    label: 'Farther in front, for the whole euphonium and the room',
    band: 'In a good room, try about 0.9–1.3 m (3–4 ft) in front of the euphonium, aimed at it — the line, its size and the room together.',
    kind: 'trial',
    src: 'LESSON-EUPH',
    quote: 'In a good room, a more distant main view may convey the size and phrase naturally, while a controlled spot supplies articulation if needed.',
    bandProv: ill('no number in the lesson: 0.9–1.3 m is the lab’s drawing'),
    refSurface: 'centre',
    side: 'outside',
    distance: { min: 900, max: 1300 },
    cone: { min: 0, max: 35, prov: ill('in front of the euphonium: within 35° of straight ahead') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the euphonium: within 25°') },
    requires: { micTypeIds: ['sdcCard', 'lbRibbon', 'lbLdc'] },
    draw: coneDraw(CENTRE, X, null, 900, 1300, 0, 35),
    start: poseAt(CENTRE, FAR_DIR, 1080),
    tendency: 'The phrase and the size of the instrument in the room. More of the section and the room come with it — fine for a lyrical line in a good room.',
    checks: ['Whether the room is worth hearing', 'The melody against the section', 'Spill from the band'],
  },
];

export const EUPH_VIEWS = {
  up: {
    side: { u0: -700, u1: 1550, v0: -2080, v1: 40 },
    top: { u0: -700, u1: 1550, v0: -700, v1: 1100 },
  },
  front: {
    side: { u0: -700, u1: 1550, v0: -1650, v1: 40 },
    top: { u0: -700, u1: 1550, v0: -700, v1: 1100 },
  },
};
