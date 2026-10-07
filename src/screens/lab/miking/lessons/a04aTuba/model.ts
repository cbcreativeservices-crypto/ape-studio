/**
 * A04a TUBA — the technical truth and where things are (charter §2 layers
 * 1–2), on the shared low-brass family (lessons/shared/lowbrass). Keys point
 * into docs/labs/miking/tuba/SOURCES.md and trumpet/SOURCES.md §0. Owner
 * ruling 2026-10-04: `src`, `quote`, every `prov` and the unknowns are the
 * internal record; the learner sees starting points only.
 *
 * FRAME H (lowBrassScene.ts): origin on the floor under the seat; +x toward
 * the audience; +y DOWN; +z the player's right. A seated player, the tuba on
 * the lap; the BELL selector: UP (the orchestral tuba, the default) or FRONT
 * (a recording tuba) — both sourced; "back" (historic military) is said in
 * words only.
 *
 * RECOMMENDED STARTING POINTS (corrections LB-06, LB-07):
 *   above   about 2 ft above an upward bell, aimed at its edge — 56–66 cm,
 *           drawn ±5 cm round 61 cm;
 *   side    1–2 ft from the bell, a little off its axis — 30.5–61 cm; for an
 *           upward bell, above it and to the side, "aimed across the opening
 *           rather than … lowered into it";
 *   far     a farther view of the whole tuba and the room — no number in the
 *           lesson: 1.0–1.4 m from the tuba, a drawing default.
 * The lesson's ribbon-on-solo-tuba example is NOT on the cited page (LB-07):
 * dropped; ribbons stay a generic option with the airflow caution.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { TUBA } from '../shared/lowbrass/lowBrassSpec.ts';
import { brassScene, v } from '../shared/lowbrass/lowBrassScene.ts';
import { coneDraw, frontEdge, poseAt } from '../shared/lowbrass/lowBrassModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const SPEC = TUBA;
export const UP = brassScene(TUBA, 'up');
export const FRONT = brassScene(TUBA, 'front');
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

export const TUBA_ZONES: DocumentedZone[] = [
  {
    id: 'tu.above',
    label: 'About two feet above the bell, aimed at its edge',
    band: 'Start about 55–65 cm (22–26 in) above the bell, aimed at the edge of the opening — not straight down into it.',
    kind: 'sourced',
    src: 'MDAT',
    quote: 'T uba — Position the microphone about 2 feet above the bell of the instrument with it aimed at the edge of the bell.',
    bandProv: ill('"about 2 feet": drawn 56–66 cm round 61 cm'),
    refSurface: 'bellUp',
    side: 'outside',
    distance: { min: 560, max: 660 },
    cone: { min: 0, max: 30, prov: ill('“above the bell”: within 30° of its axis (the lab’s drawing)') },
    aim: { maxOffAxis: 35, prov: ill('“aimed at the edge”: the lab counts within 35° of the bell’s centre (an edge is ≈ 20° off it at this distance)') },
    requires: { variant: 'up', micTypeIds: ABOVE_FIRST },
    draw: coneDraw(UP.bell.rim, UP.bell.axis, null, 560, 660, 0, 30),
    start: poseAt(UP.bell.rim, ABOVE_DIR, 610, frontEdge(UP)),
    tendency: 'An open, rounded tuba with some room — the whole bell rather than one spot in it. It hears more of the neighbours and the room than a closer mic.',
    checks: ['The bell’s tilt and sway while playing', 'The boom stays outside the space above the bell', 'Spill from the neighbours'],
  },
  {
    id: 'tu.side',
    label: 'A foot or two from the bell, above and to the side',
    band: 'Try about 30–60 cm (1–2 ft) from the bell, above it and out to one side, aimed across the opening — a little off its axis.',
    kind: 'sourced',
    src: 'S-BWS',
    quote: 'start by placing the microphone 1 to 2 feet from the bell … On-axis = brighter and more defined, Off-axis = softer with less bite',
    bandProv: ill('"1 to 2 feet": 30.5–61 cm; "above and somewhat to the side of the rim" is the lesson’s geometry for an upward bell'),
    refSurface: 'bellUp',
    side: 'outside',
    distance: { min: 305, max: 610 },
    cone: { min: 25, max: 60, prov: ill('“to the side of the rim, aimed across the opening”: 25–60° off the bell’s axis (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed across the opening: within 30° of the bell’s centre') },
    requires: { variant: 'up', micTypeIds: ALL },
    draw: coneDraw(UP.bell.rim, UP.bell.axis, X, 305, 610, 25, 60),
    start: poseAt(UP.bell.rim, SIDE_UP_DIR, 460),
    tendency: 'A closer, more defined tuba with less room and spill. Toward the bell’s axis: more attack and bite; farther off: softer. Listen for valve and air noise up close.',
    checks: ['The bell’s tilt and the player’s sway', 'Low notes even, attacks clear', 'Valve and breath noise'],
  },
  {
    id: 'tu.sideF',
    label: 'A foot or two in front of the bell, a little off its axis',
    band: 'With a front bell, try about 30–60 cm (1–2 ft) in front of the bell, a little to the side of its axis — the stand placed in the bell’s real direction.',
    kind: 'sourced',
    src: 'S-BWS',
    quote: 'start by placing the microphone 1 to 2 feet from the bell … On-axis = brighter and more defined, Off-axis = softer with less bite',
    bandProv: ill('"1 to 2 feet": 30.5–61 cm'),
    refSurface: 'bellFront',
    side: 'outside',
    distance: { min: 305, max: 610 },
    cone: { min: 12, max: 50, prov: ill('a little off the axis: 12–50° (the lab’s drawing)') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the bell: within 30° of its centre') },
    requires: { variant: 'front', micTypeIds: ALL },
    draw: coneDraw(FRONT.bell.rim, FRONT.bell.axis, null, 305, 610, 12, 50),
    start: poseAt(FRONT.bell.rim, SIDE_FRONT_DIR, 460),
    tendency: 'A direct, defined tuba; toward the axis more attack, off it softer. A front bell beams more of its overtones at the mic than an upward one does.',
    checks: ['The player’s sight line over the bell', 'Low notes even, attacks clear', 'The mic’s pattern and the wedges in front'],
  },
  {
    id: 'tu.far',
    label: 'Farther in front, for the whole tuba and the room',
    band: 'In a good room, try about 1–1.4 m (3–4.5 ft) in front of the tuba, aimed at it — the whole instrument and the room together.',
    kind: 'trial',
    src: 'LESSON-TUBA',
    quote: 'Compare one bell-oriented stand view with a farther position that captures the whole instrument and room. Rather than imposing a number, move until the sustained lows, note starts and register transitions have the intended balance.',
    bandProv: ill('no number in the lesson: 1.0–1.4 m is the lab’s drawing'),
    refSurface: 'centre',
    side: 'outside',
    distance: { min: 1000, max: 1400 },
    cone: { min: 0, max: 35, prov: ill('in front of the tuba: within 35° of straight ahead') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the tuba: within 25°') },
    requires: { micTypeIds: ['sdcCard', 'lbRibbon', 'lbLdc'] },
    draw: coneDraw(CENTRE, X, null, 1000, 1400, 0, 35),
    start: poseAt(CENTRE, FAR_DIR, 1150),
    tendency: 'The tuba’s size and the room together — sustained lows and the decay in the space. More of the neighbours and the room’s low-end modes come with it.',
    checks: ['Whether the room is worth hearing', 'Low notes uneven from room modes', 'Spill from the band'],
  },
];

export const TUBA_VIEWS = {
  up: {
    side: { u0: -700, u1: 1650, v0: -2250, v1: 40 },
    top: { u0: -700, u1: 1650, v0: -700, v1: 1150 },
  },
  front: {
    side: { u0: -700, u1: 1650, v0: -1750, v1: 40 },
    top: { u0: -700, u1: 1650, v0: -700, v1: 1150 },
  },
};

