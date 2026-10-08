/**
 * F02 CLOTHING AND BODY MOVEMENT — the recommended starting points (charter
 * §2 layer 1). Keys point into docs/labs/miking/foley_clothing/SOURCES.md
 * (and foley_footsteps/SOURCES.md §0); geometry from GEOMETRY_PROPOSAL.md §2.
 * Every distance is from the CAPSULE to the active fabric.
 *
 *   f02.garment  1–1.5 m, in front and a little above, aimed down at the
 *                active fabric (one team's working distance for cloth) —
 *                the worked example (ONE MIC);
 *   f02.close    a close detail start, 40–60 cm, just outside the gesture
 *                envelope — no close distance is published (the lesson says
 *                so): O-5's drawing default, with the small supercardioid
 *                (no tube to reach into the movement) — CLOSE · LIVE;
 *   f02.rain     farther, 2.5–3 m, for a texture such as a rain cover ("can
 *                be increased to 3 meters") — FARTHER BACK · STUDIO;
 *   f02.room     the room mic of a close + room pair for an interior, about
 *                3 m out (drawing default; the method is sourced) — TWO MICS;
 *   f02.boom     a boom pole over the action from the front, its tip well
 *                clear of the gesture envelope (the lesson's own idea, worn
 *                variant) — ANOTHER START.
 * Heights are drawing defaults; every start lies outside the gesture
 * envelope (pinned by the tests).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { foleyZone } from '../shared/foley/foleyZones.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const STUDIO = ['held', 'worn'];
const ALL = ['held', 'worn', 'live'];
// The close detail start is drawn for the HELD garment (and the live station): worn, the swinging arms reach it.

export const F02_ZONES: DocumentedZone[] = [
  foleyZone({
    id: 'f02.garment',
    label: 'In front, a little above the garment',
    band: 'Start about 1–1.5 m (3.3–5 ft) from the active fabric, in front and a little above it, aimed down at where it flexes or moves.',
    kind: 'sourced',
    src: 'FF-CLOTH',
    quote: 'We found a 1-1.5 meter mic distance is efficient and optimal for recording cloth tracks.',
    surface: 'fabric',
    d: [1000, 1500],
    a: [10, 50],
    aimTol: 25,
    start: { d: 1250, bearing: 0, elev: 25 },
    variants: ALL,
    micTypeIds: ['shotgunShort', 'scSupercard'],
    bandProv: ill('"in front and a little above": 10–50° above the line straight out is the lab’s drawing; the height a drawing default'),
    tendency: 'The whole garment and the body’s movement, with some room — quiet texture can sit close to the room noise. Listen to a pause as well as the movement.',
    checks: ['The garment’s body against the room noise', 'Breath, steps and jewellery against the cloth', 'The stand and cable clear of the whole gesture'],
  }),
  foleyZone({
    id: 'f02.close',
    label: 'Close, just outside the gesture',
    band: 'A suggested trial with a small mic: start about 40–60 cm (16–24 in) from the active fabric, just outside the whole gesture — move closer only while the largest movement stays clear of it.',
    kind: 'trial',
    src: 'LESSON-F02',
    quote: 'Move a stand mic toward a small sleeve, leather flex or hand gesture until the detail is clear while preserving full movement clearance. Record the exact source-to-capsule range; no universal close distance is established here.',
    surface: 'fabric',
    d: [400, 600],
    a: [15, 55],
    aimTol: 30,
    start: { d: 600, bearing: 25, elev: 35 },
    variants: ['held', 'live'],
    micTypeIds: ['scSupercard'],
    bandProv: ill('no close distance is published (F02 L13): 40–60 cm is O-5’s drawing default, outside the drawn gesture envelope'),
    tendency: 'A narrow, detailed friction point and more of the hands — finger rub and breath come closer too. On a live stage the close mic also keeps more of the PA out.',
    checks: ['Finger rub and breath against the fabric', 'The largest gesture against the mic and stand', 'Whether a wide shot needs this much detail'],
  }),
  foleyZone({
    id: 'f02.rain',
    label: 'Farther back, for a rain cover',
    band: 'For some textures — a rain cover, a big coat — start farther: up to about 3 m (10 ft) from the action, aimed at it.',
    kind: 'sourced',
    src: 'FF-CLOTH',
    quote: 'Sometimes for textures like a rain cover, this distance can be increased to 3 meters.',
    surface: 'fabric',
    d: [2500, 3000],
    a: [5, 40],
    aimTol: 25,
    start: { d: 2700, bearing: -10, elev: 15 },
    variants: STUDIO,
    micTypeIds: ['shotgunShort', 'scSupercard'],
    bandProv: ill('"up to 3 meters": the lab draws 2.5–3 m; the height a drawing default'),
    tendency: 'The texture as one wide, blended sound with the space round it — and much more of the room. A poor room shows here first.',
    checks: ['Room noise under the quiet moments', 'Whether the texture still reads', 'The cable run out of the exit path'],
  }),
  foleyZone({
    id: 'f02.room',
    label: 'The room mic, farther back',
    band: 'For an interior, keep the garment mic and add a second mic about 3 m (10 ft) back for the room — on its own channel.',
    kind: 'sourced',
    src: 'HECKER',
    quote: 'interiors: a close mic and one farther for the room; exteriors: one mic',
    surface: 'fabric',
    d: [2700, 3300],
    a: [10, 45],
    aimTol: 30,
    start: { d: 3000, bearing: -25, elev: 22 },
    variants: STUDIO,
    micTypeIds: ['ldcRoom'],
    bandProv: ill('the room mic’s place is a drawing default; the close + room method for interiors is sourced'),
    tendency: 'The room round the cloth, on its own channel, for an interior scene’s space. An exterior scene often wants one mic and no studio room.',
    checks: ['The pair in mono while the garment moves', 'Whether the room layer suits this scene', 'Its stand and cable out of the exit path'],
  }),
  foleyZone({
    id: 'f02.boom',
    label: 'A boom over the action, from the front',
    band: 'For a short travel area, an idea to try: a boom pole held over and in front of the action, about 1.1–1.6 m from the active fabric, its tip well clear of the whole gesture.',
    kind: 'trial',
    src: 'LESSON-F02',
    quote: 'Use a stationary or carefully operated boom over or to the side of the action when the performer travels through a short area.',
    surface: 'fabric',
    d: [1100, 1600],
    a: [45, 78],
    aimTol: 25,
    start: { d: 1350, bearing: 0, elev: 60 },
    variants: ['worn'],
    micTypeIds: ['shotgunPole'],
    bandProv: ill('the boom’s geometry is a drawing default (the tip at least 150 mm outside the gesture envelope; a 2 m pole)'),
    tendency: 'Follows a short move from above, the body under it — pole handling and cable noise come with it. The boom never swings into the performer or the garment.',
    checks: ['Pole handling and cable noise', 'The tip and the pole clear of the whole gesture', 'The operator’s own footing and the exit path'],
  }),
];
