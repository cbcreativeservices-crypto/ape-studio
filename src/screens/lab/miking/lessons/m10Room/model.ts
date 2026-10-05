/**
 * M10 DRUM ROOM MICROPHONES — the technical truth (charter §2 layer 1). The
 * ROOM is the research's drawing default (room/GEOMETRY_PROPOSAL.md §1):
 * one studio live room sized so that the one published distant figure —
 * "about 15 feet away in the corners of the room" — is literally true for a
 * corner pair 300 mm in from both walls. Every room-mic starting point is
 * the proposal's §2 (sourced distances where a source gives one; heights and
 * spacings are drawing defaults). Pinned by test/mikingModelM10.test.ts.
 * Frame: the KIT frame K (kit/GEOMETRY_PROPOSAL.md §1).
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { KIT_FLOOR_Y, yAt } from '../shared/kitPlanModel.ts';
import { KICK_FRONT, KIT_CENTRE, S0, aimToward, heightOf } from '../shared/kitScene/kitSceneModel.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

const FT = 304.8;

/* ── the room (proposal §1: drawing defaults, the front wall DERIVED) ── */

/** The kit's centre in plan (the midpoint of the kick and the snare). */
export const CK = { x: KIT_CENTRE.x, z: KIT_CENTRE.z };
/** "about 15 feet" (UA-STEREO), 4572 mm. */
export const CORNER_DIST = 15 * FT;
export const CORNER_INSET = 300;
export const ROOM = (() => {
  const back = -2500;
  const left = CK.z - 2700;
  const right = CK.z + 2700;
  const half = right - CK.z - CORNER_INSET; // 2400: the corner mic's plan offset across
  const front = CK.x + Math.sqrt(CORNER_DIST * CORNER_DIST - half * half) + CORNER_INSET;
  return { back, front, left, right, ceilingH: 3000, door: { z0: 1200, z1: 2100, swing: 900 } };
})();

/* ── the room mics' starting positions (proposal §2) ── */

/** A low pair 1 m in front of the kick's front head, 400 mm off the floor,
 *  capsules 400 mm apart across the kick's axis (height and spacing drawing
 *  defaults; the 40 cm is a stereo-guide spacing example). */
export const LOW_CENTRE: Vec3 = { x: KICK_FRONT.x + 1000, y: yAt(400), z: 0 };
export const LOW_A: Vec3 = { ...LOW_CENTRE, z: -200 };
export const LOW_B: Vec3 = { ...LOW_CENTRE, z: 200 };
/** One side-address condenser 1.5 m in front of the kick (inside "1–2 m"), 1 m high. */
export const FRONT_LDC: Vec3 = { x: KICK_FRONT.x + 1500, y: yAt(1000), z: 0 };
/** Two marked spots for a mono room mic, a long stride apart (drawing defaults). */
export const TRIAL_A: Vec3 = { x: 2200, y: yAt(1500), z: CK.z };
export const TRIAL_B: Vec3 = { x: 2950, y: yAt(1500), z: CK.z };
/** The corner pair: 15 ft from the kit's centre in plan, 300 mm from two walls, 2 m high. */
export const CORNER_L: Vec3 = { x: ROOM.front - CORNER_INSET, y: yAt(2000), z: ROOM.left + CORNER_INSET };
export const CORNER_R: Vec3 = { x: ROOM.front - CORNER_INSET, y: yAt(2000), z: ROOM.right - CORNER_INSET };
/** The same large condenser over the kit, facing down (the mono overhead's
 *  plan point; 1.68 m up keeps its 118 mm body clear of the sticks' reach). */
export const OVER_LDC: Vec3 = { x: CK.x, y: yAt(1680), z: CK.z };

/** Where the room mics aim: the kit's middle (C_k at about 0.7 m, a drawing default). */
export const KIT_MIDDLE: Vec3 = { x: CK.x, y: yAt(700), z: CK.z };

const AIM_KIT = (maxOffAxis: number) => ({ maxOffAxis, prov: ill('facing the kit: the lab’s tolerance about the line back toward the kit') });
const pose = (p: Vec3) => ({ p, ...aimToward(p, KIT_MIDDLE) });

export const M10_ZONES: DocumentedZone[] = [
  {
    id: 'rm.front',
    label: 'One large condenser in front of the kit',
    band: 'Start 1–2 m (3–6 ft) in front of the kick’s front head, about 1 m up, its face toward the kit.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'Drums 3–6 feet (1–2 m). Place in front of the drum kit to capture more of the kick drum, or as an overhead (above the kit, facing down) to capture more cymbals.',
    refSurface: 'kickFront',
    side: 'outside',
    distance: { min: 1000, max: 2000 },
    requires: { micTypeIds: ['roomLdc'] },
    aim: AIM_KIT(30),
    box: { min: { x: -5000, y: yAt(2200), z: -450 }, max: { x: 9000, y: yAt(300), z: 450 }, prov: ill('"in front of the drum kit": within 45 cm either side of the kick’s axis is the lab’s tolerance') },
    drawn: { side: { u0: KICK_FRONT.x + 1000, u1: KICK_FRONT.x + 2000, v0: yAt(1450), v1: yAt(550) }, top: { u0: KICK_FRONT.x + 1000, u1: KICK_FRONT.x + 2000, v0: -450, v1: 450 } },
    start: pose(FRONT_LDC),
    tendency: 'A front-of-kit picture with more of the kick; moving it over the kit tends to bring more cymbals. A model-specific starting point — check this mic’s own manual.',
    checks: ['Its FACE toward the kit (a side-address mic)', 'The stand clear of walkways and the kit', 'Kick and snare body against the cymbals'],
  },
  {
    id: 'rm.low',
    label: 'Low, about 1 m in front of the kick',
    band: 'Start about 1 m (3.3 ft) in front of the kick’s front head and low — a pair of omnis about 40 cm (16 in) apart is one idea.',
    kind: 'sourced',
    src: 'DPA-KICK',
    quote: 'a stereo kit of omnidirectional microphones placed approximately 1 meter in front of the kit, low, in front of the kick drum',
    refSurface: 'kickFront',
    side: 'outside',
    distance: { min: 900, max: 1100 },
    bandProv: ill('"approximately 1 meter": ± 10 cm is the lab’s tolerance; the 40 cm spacing is a stereo-guide example'),
    radial: { line: 'kickAxis', max: 320, prov: ill('"in front of the kick drum": within 32 cm of its axis') },
    requires: { micTypeIds: ['roomPencil'] },
    aim: AIM_KIT(40),
    box: { min: { x: -5000, y: yAt(700), z: -5000 }, max: { x: 9000, y: yAt(150), z: 5000 }, prov: ill('"low": below 70 cm (a drawing default)') },
    drawn: { side: { u0: KICK_FRONT.x + 900, u1: KICK_FRONT.x + 1100, v0: yAt(700), v1: yAt(150) }, top: { u0: KICK_FRONT.x + 900, u1: KICK_FRONT.x + 1100, v0: -320, v1: 320 } },
    start: { p: LOW_A, az: 0, el: 0 },
    tendency: 'An integrated kit picture from low and close: kick body present, the snare and cymbals farther off. Listen for whether the kick stays full without the snare or cymbals turning distant — and check the pair in mono.',
    checks: ['Clear of the kick’s front head and anyone walking past', 'Kick body against a distant snare', 'The pair in mono'],
  },
  {
    id: 'rm.trialA',
    label: 'A mono room mic, out in front — spot A',
    band: 'Try a spot well clear of the kit, about head height, facing the kit’s middle. Then compare it with a second spot a long stride farther out (B).',
    kind: 'trial',
    src: 'M10-LESSON',
    quote: 'from a safe position beyond the immediate kit, aim a single mic at the kit’s approximate center; compare two marked positions at least a useful stride apart',
    refSurface: 'kickFront',
    side: 'outside',
    distance: { min: TRIAL_A.x - KICK_FRONT.x - 200, max: TRIAL_A.x - KICK_FRONT.x + 200 },
    bandProv: ill('the two spots and the 75 cm stride are drawing defaults: no universal distance is implied'),
    requires: { micTypeIds: ['roomPencil'] },
    aim: AIM_KIT(35),
    box: { min: { x: -5000, y: yAt(1800), z: -500 }, max: { x: 9000, y: yAt(1200), z: 500 }, prov: ill('in front of the kit, about head height (1.2–1.8 m, within 50 cm of the kick’s axis; drawing defaults)') },
    drawn: { side: { u0: TRIAL_A.x - 200, u1: TRIAL_A.x + 200, v0: yAt(1800), v1: yAt(1200) }, top: { u0: TRIAL_A.x - 200, u1: TRIAL_A.x + 200, v0: -500, v1: 500 } },
    start: pose(TRIAL_A),
    tendency: 'One channel of kit and room together. Note the balance of direct sound, early reflections and decay here, then compare spot B at the same listening level.',
    checks: ['A safe, repeatable spot: mark it', 'Kick, snare, cymbals and decay as a whole', 'The same listening level when you compare'],
  },
  {
    id: 'rm.trialB',
    label: 'The same mic, a stride farther out — spot B',
    band: 'Move the same mic a long stride farther from the kit, same height and aim, and compare it with spot A at the same listening level.',
    kind: 'trial',
    src: 'M10-LESSON',
    quote: 'compare two marked positions at least a useful stride apart … At equal playback level, does the second position improve direct sound, early reflection and decay balance?',
    refSurface: 'kickFront',
    side: 'outside',
    distance: { min: TRIAL_B.x - KICK_FRONT.x - 200, max: TRIAL_B.x - KICK_FRONT.x + 200 },
    bandProv: ill('the two spots and the 75 cm stride are drawing defaults: no universal distance is implied'),
    requires: { micTypeIds: ['roomPencil'] },
    aim: AIM_KIT(35),
    box: { min: { x: -5000, y: yAt(1800), z: -500 }, max: { x: 9000, y: yAt(1200), z: 500 }, prov: ill('in front of the kit, about head height (1.2–1.8 m, within 50 cm of the kick’s axis; drawing defaults)') },
    drawn: { side: { u0: TRIAL_B.x - 200, u1: TRIAL_B.x + 200, v0: yAt(1800), v1: yAt(1200) }, top: { u0: TRIAL_B.x - 200, u1: TRIAL_B.x + 200, v0: -500, v1: 500 } },
    start: pose(TRIAL_B),
    tendency: 'Farther out tends to bring more of the room — reflections and decay — and less direct kit. Whether that helps depends on this room: farther is not always better.',
    checks: ['Only the distance changed since spot A', 'Early reflections and decay against direct sound', 'Spill from other players, or the PA when live'],
  },
  {
    id: 'rm.corner',
    label: 'Far out, in a front corner of the room',
    band: 'One production example, not a rule: a pair about 4.6 m (15 ft) from the kit, in the room’s corners, about 30 cm from both walls.',
    kind: 'sourced',
    src: 'UA-STEREO',
    quote: 'an ambient pair about 15 feet away in the corners of the room',
    refSurface: 'kickFront',
    side: 'outside',
    distance: { min: 2500, max: 4000 },
    bandProv: ill('the room is a drawing default sized so that 15 ft reaches its corners; 2 m high and the 30 cm inset are drawing defaults'),
    near: { point: { x: CK.x, y: yAt(2000), z: CK.z }, min: CORNER_DIST - 250, max: CORNER_DIST + 250, prov: src('UA-STEREO', 'about 15 feet away in the corners of the room') },
    requires: { micTypeIds: ['roomPencil'] },
    aim: AIM_KIT(55),
    box: { min: { x: 3000, y: yAt(2500), z: -5000 }, max: { x: 9000, y: yAt(1500), z: 5000 }, prov: ill('toward the room’s front corners, 1.5–2.5 m up (drawing defaults)') },
    drawn: {
      side: { u0: CORNER_R.x - 400, u1: ROOM.front - 20, v0: yAt(2500), v1: yAt(1500) },
      top: { u0: CORNER_R.x - 400, u1: ROOM.front - 20, v0: CORNER_R.z - 500, v1: ROOM.right - 20 },
    },
    start: pose(CORNER_R),
    tendency: 'Mostly room: reflections, decay and width — and less of the kit’s direct sound. It can add space, or weaken the centre and exaggerate the room’s faults. Listen in mono too.',
    checks: ['Clear of doors, routes and anyone walking past', 'Whether the width helps or the centre weakens', 'The pair in mono with the close mics'],
  },
  {
    id: 'rm.over',
    label: 'The large condenser above the kit, facing down',
    band: 'The same kind of mic as an overhead: above the middle of the kit, facing down, for more cymbals — clear of the player.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'or as an overhead (above the kit, facing down) to capture more cymbals',
    refSurface: 'snare',
    side: 'either',
    distance: { min: heightOf(OVER_LDC) - heightOf(S0) - 160, max: heightOf(OVER_LDC) - heightOf(S0) + 160 },
    bandProv: ill('"above the kit": the height is a drawing default (1.68 m, its body clear of the sticks’ reach)'),
    radial: { line: 'kitLine', max: 150, prov: ill('over the middle of the kit (a drawing default)') },
    requires: { micTypeIds: ['ohLdc'] },
    aim: { maxOffAxis: 30, prov: ill('"facing down": within 30° of straight down') },
    drawn: { side: { u0: OVER_LDC.x - 150, u1: OVER_LDC.x + 150, v0: OVER_LDC.y - 160, v1: OVER_LDC.y + 160 }, top: { u0: OVER_LDC.x - 150, u1: OVER_LDC.x + 150, v0: OVER_LDC.z - 150, v1: OVER_LDC.z + 150 } },
    start: { p: OVER_LDC, az: 0, el: -90 },
    tendency: 'More cymbals than the front position, from the same mic. Compare a modest move in front with raising it over the kit.',
    checks: ['A counterweighted boom, nothing over the player', 'Its face toward the kit', 'Cymbals against drums'],
  },
];

/** A source's mirror image behind one surface: one reflection, drawn as if
 *  it came from there (the image-source picture). */
export type MirrorImage = { id: string; label: string; p: Vec3; of: string; color: string };

/** The snare's mirror images in the room's surfaces (one bounce each). */
export function snareImages(): MirrorImage[] {
  const s = S0;
  const img = (id: string, label: string, p: Vec3, color: string): MirrorImage => ({ id, label, p, of: 'snare', color });
  return [
    img('floor', 'floor echo', { x: s.x, y: 2 * KIT_FLOOR_Y - s.y, z: s.z }, '#9cc4ff'),
    img('ceiling', 'ceiling echo', { x: s.x, y: 2 * yAt(ROOM.ceilingH) - s.y, z: s.z }, '#9cc4ff'),
    img('back', 'back-wall echo', { x: 2 * ROOM.back - s.x, y: s.y, z: s.z }, '#7fe0c0'),
    img('left', 'side-wall echo', { x: s.x, y: s.y, z: 2 * ROOM.left - s.z }, '#7fe0c0'),
    img('front', 'front-wall echo', { x: 2 * ROOM.front - s.x, y: s.y, z: s.z }, '#7fe0c0'),
  ];
}
