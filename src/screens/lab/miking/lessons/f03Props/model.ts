/**
 * F03 PROPS AND OBJECT HANDLING — the recommended starting points (charter
 * §2 layer 1). NO numeric position exists in the lesson or its sources (F03
 * L25 says so): every distance is a DRAWING DEFAULT (O-6 — shown as a
 * suggested starting point in plain words); the METHODS are sourced
 * (foley_props/SOURCES.md, GEOMETRY_PROPOSAL.md §2):
 *
 *   f03.whole   the whole action from outside the travel, about 1–1.4 m,
 *               aimed at the prop ("first cover the complete action") — ONE
 *               MIC (worked example);
 *   f03.detail  aimed at the handle / latch, the keys' jingle, the paper's
 *               bend, the chair's foot — about 35–55 cm, outside the hand's
 *               arc and the swing — half of the TWO MICS pair;
 *   f03.room    farther, about 2.2–2.8 m, the object with its room ("not
 *               too close", natural room) — the pair's other half;
 *   f03.panel   (door) aimed at the moving panel and frame, about 0.6–1 m —
 *               ANOTHER START.
 * The close + room pair is recorded on separate channels (several stations,
 * close and room mics mixed live — sourced practice).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { foleyZone } from '../shared/foley/foleyZones.ts';
import { v3 } from '../shared/foley/frameF.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ALL = ['keys', 'paper', 'door', 'chair', 'live'];
const STUDIO = ['keys', 'paper', 'door', 'chair'];
const DD = ill('no source gives a distance to a prop (F03 L25): a drawing default, O-6');

export const F03_ZONES: DocumentedZone[] = [
  foleyZone({
    id: 'f03.whole',
    label: 'The whole action, from outside its travel',
    band: 'A suggested start: about 1–1.4 m (3.3–4.6 ft) from the prop’s sounding part, outside the whole hand, door, drawer or chair travel, aimed at the action.',
    kind: 'trial',
    src: 'LESSON-F03',
    quote: 'First cover the complete action from outside the swing or travel path.',
    surface: 'part',
    d: [1000, 1400],
    a: [10, 50],
    aimTol: 30,
    start: { d: 1200, bearing: -15, elev: 25 },
    variants: ALL,
    micTypeIds: ['shotgunShort', 'scSupercard', 'smallDynCard'],
    bandProv: DD,
    tendency: 'The whole action — grasp, movement, contact and the room a little — as one event. Listen for which moments carry the scene and which distract.',
    checks: ['The whole action, not only the loudest click', 'Hand, breath and clothes noise', 'The stand outside the whole travel'],
  }),
  foleyZone({
    id: 'f03.detail',
    label: 'Aimed at the part that sounds',
    band: 'A suggested trial: about 35–55 cm (14–22 in) from the part that sounds — the latch, the jingle, the bend, the leg on the floor — outside the hand’s arc and the swing.',
    kind: 'trial',
    src: 'LESSON-F03',
    quote: 'Then compare an aimed view of the handle/latch and one of the moving panel or frame.',
    surface: 'part',
    d: [350, 550],
    a: [0, 45],
    aimTol: 30,
    start: { d: 450, bearing: -20, elev: 15 },
    variants: ALL,
    micTypeIds: ['scSupercard', 'smallDynCard'],
    bandProv: DD,
    tendency: 'Distinct handling clicks and small details — and the risk of a tiny click with no object behind it. A close view may suit a close-up shot.',
    checks: ['A click with no body behind it', 'The swing, the hand’s arc and the pinch points clear', 'Peaks from a sudden slam or set-down'],
  }),
  foleyZone({
    id: 'f03.room',
    label: 'Farther back, the object with its room',
    band: 'An idea to try: about 2.2–2.8 m (7–9 ft) from the action, where the object and the room read as one event — on its own channel when paired with a close mic.',
    kind: 'trial',
    src: 'OUP-MW',
    quote: 'Mic’ing things too closely doesn’t give sounds the room ambiance',
    surface: 'part',
    d: [2200, 2800],
    a: [5, 40],
    aimTol: 30,
    start: { d: 2500, bearing: -25, elev: 20 },
    variants: STUDIO,
    micTypeIds: ['ldcRoom', 'scSupercard'],
    bandProv: DD,
    tendency: 'The object and its room together, the way a wide shot hears it — with more room noise under the quiet moments.',
    checks: ['Room noise under the soft handling', 'Whether the scene’s space suits this room', 'The pair together in mono'],
  }),
  foleyZone({
    id: 'f03.panel',
    label: 'Aimed at the door’s panel',
    band: 'An idea to compare on the door: about 0.6–1 m (2–3.3 ft) from the middle of the panel, on the side away from the swing, aimed at the panel and the frame.',
    kind: 'trial',
    src: 'LESSON-F03',
    quote: 'Then compare an aimed view of the handle/latch and one of the moving panel or frame.',
    surface: 'panel',
    c: v3(0, -300, 450),
    d: [600, 1000],
    a: [0, 45],
    aimTol: 30,
    start: { d: 800, bearing: 10, elev: 10 },
    variants: ['door'],
    micTypeIds: ['scSupercard', 'shotgunShort'],
    bandProv: DD,
    tendency: 'More of the panel’s resonance and the frame — the body of the door — and less of the latch’s click.',
    checks: ['A boomy slam or a harsh ring from one surface', 'The latch against the panel', 'The swing and the hinge clear'],
  }),
];
