/**
 * A11 ACCORDION — where things are (charter §2 layer 2), frame A (model.ts).
 * Built from model.ts's numbers, per bellows state (variant), so the
 * drawing, the zones and the collision agree.
 *
 *   front    the instrument's front plane (through the grille, normal +x):
 *            the one-mic view is measured from here, "in front, centred"
 *   grille   the treble grille's centre (a TARGET point): the dynamic's
 *            starting point is "about 18 in from the centre of the grille"
 *            (the lesson's garbled "an 18-inch dynamic microphone" fixed:
 *            CORRECTIONS_LOG AC-01)
 *   keys     the keyboard side (the treble box's outer face, normal +z)
 *   bass     the bass side AT ITS FULL OPENING (normal −z): the bellows-side
 *            starting point is measured from here, so a stand stays outside
 *            the whole travel (CORRECTIONS_LOG AC-02)
 * Keep-outs: the bellows' whole travel with the left hand under its strap,
 * the player, the right arm on the keyboard.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimTo, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { ACC_SRC, ACCORDION } from '../shared/freereed/freeReedSpec.ts';
import { A0, BASS_FULL, BELLOWS_STATES, BODY, bassBox, FLOOR_Y, HAND_MARGIN, TREBLE } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const VARIANTS = BELLOWS_STATES.map((s) => s.id);
const MID_Y = (TREBLE.y0 + TREBLE.y1) / 2;
const MID_X = (TREBLE.x0 + TREBLE.x1) / 2;

/* ── the instrument ── */
function bassPart(v: string): Part {
  const b = bassBox(v);
  return {
    id: `ac.bass.${v}`,
    label: 'bass side',
    short: 'bass side',
    role: 'The bass box, on the player’s left: the bass buttons and the air button under the left hand’s strap, the bass sound outlets on its end. It moves in and out with the bellows.',
    solid: { kind: 'box', min: v3(TREBLE.x0, b.box.y0, b.box.z0), max: v3(TREBLE.x1, b.box.y1, b.box.z1) },
    variants: [v],
    listIn: [],
    moving: true,
    prov: ACCORDION.bassW.prov,
  };
}

const parts: Part[] = [
  {
    id: 'ac.treble',
    label: 'treble side',
    short: 'treble side',
    role: 'The treble box, on the player’s right: the piano keyboard on its outer side and the grille on its front. It stays against the player’s chest while the bass side moves.',
    solid: { kind: 'box', min: v3(TREBLE.x0, TREBLE.y0, TREBLE.z0), max: v3(TREBLE.x1, TREBLE.y1, TREBLE.z1) },
    prov: TREBLE.prov,
  },
  { id: 'ac.grille', label: 'treble grille', short: 'grille', role: 'The pierced grille on the front of the treble side: the treble reeds’ sound comes out here. Never tape or cover it.', prov: ACC_SRC.bothSides },
  { id: 'ac.keys', label: 'treble keyboard', short: 'keys', role: 'A piano keyboard — 41 keys on a full-size instrument — played by the right hand: the melody. Its keys click a little as they move.', prov: { kind: 'sourced', src: 'S-ACC', quote: 'A full-size accordion has 41 treble keys and 120–140 buttons for the bass.' } },
  { id: 'ac.bellows', label: 'bellows', short: 'bellows', role: 'The folded bellows between the two sides: the left arm pulls and pushes it, moving air through the reeds. It is the air source — not a place to point a mic into.', prov: ACC_SRC.bellows },
  { id: 'ac.bassSide', label: 'bass side and buttons', short: 'bass side', role: 'The bass box on the player’s left: 120 or more bass buttons and the larger air button under the left hand’s strap, and the bass sound outlets. It moves with the bellows.', prov: ACC_SRC.airButton },
  { id: 'ac.strap', label: 'shoulder straps', short: 'straps', role: 'The straps that hold the instrument on the chest. Never compress or load a strap with a mic or cable without the player’s agreement.', prov: ill('drawn over the shoulders (a drawing default)') },
  ...VARIANTS.map(bassPart),
  {
    id: 'ac.body',
    label: 'player',
    short: 'player',
    role: 'The player, standing, the accordion on their chest.',
    solid: { kind: 'box', min: v3(BODY.backX, BODY.shoulderY - 60, -BODY.halfW), max: v3(BODY.chestX, FLOOR_Y, BODY.halfW) },
    listIn: [],
    prov: BODY.prov,
  },
  {
    id: 'ac.head',
    label: 'player’s head',
    short: 'head',
    role: 'The player’s head, above the instrument.',
    solid: { kind: 'capsule', a: v3(BODY.headC.x, BODY.headC.y - 50, 0), b: v3(BODY.headC.x, BODY.headC.y + 60, 0), r: 100 },
    listIn: [],
    prov: BODY.prov,
  },
  {
    id: 'ac.armR',
    label: 'player’s right arm',
    short: 'arm',
    role: 'The right arm round the treble side to the keyboard.',
    solid: { kind: 'capsule', a: v3(BODY.chestX - 90, BODY.shoulderY + 30, 230), b: v3(TREBLE.x0 + 30, MID_Y + 20, TREBLE.z1 + 70), r: 50 },
    listIn: [],
    prov: BODY.prov,
  },
];

const OPEN = bassBox('out');
const envelopes: Envelope[] = [
  {
    id: 'env.bellows',
    label: 'the bellows’ travel and the left hand',
    shape: { kind: 'box', min: v3(TREBLE.x0 - 20, OPEN.box.y0 - 20, BASS_FULL - HAND_MARGIN), max: v3(TREBLE.x1 + 20, TREBLE.y1 + 30, TREBLE.z0) },
    prov: ill('the bass side over a full push and pull, with the left hand under its strap (drawing defaults)'),
  },
];

/* ── RECOMMENDED STARTING POINTS ── */
const STAND = ['sdcCard', 'smallDynCard'];
const FRONT_N: Vec3 = v3(1, 0, 0);
/** The instrument's middle across, at half opening — the one-mic view's centre line. */
export const CENTRE_Z = Math.round((TREBLE.z1 + bassBox('mid').box.z0) / 2);
const CENTRE: Vec3 = v3(0, MID_Y, CENTRE_Z);
const pose = (p: Vec3, at: Vec3) => ({ p, ...aimTo(p, at) });

export const A11_ZONES: DocumentedZone[] = [
  {
    id: 'ac.one',
    label: 'One mic in front, centred',
    band: 'Start about 30–60 cm (1–2 ft) in front of the instrument, centred between the two sides, toward a balanced listening position.',
    kind: 'sourced',
    src: 'S-ACC',
    quote: 'Experts tend to agree that an accordion sounds best when the microphone is positioned at a distance of about one to two feet from the instrument. (S-REC "One or two feet in front of instrument, centered — Full range, natural sound")',
    refSurface: 'front',
    side: 'outside',
    distance: { min: 304.8, max: 609.6 },
    radial: { line: 'centre', max: 260, prov: ill('"centered": within 26 cm of the line through the instrument’s middle at half opening (the lab’s band)') },
    drawn: { side: { u0: 304.8, u1: 609.6, v0: MID_Y - 260, v1: MID_Y + 260 }, top: { u0: 304.8, u1: 609.6, v0: CENTRE_Z - 260, v1: CENTRE_Z + 260 } },
    aim: { maxOffAxis: 30, prov: ill('facing the instrument: within 30° is the lab’s tolerance') },
    requires: { micTypeIds: STAND },
    start: pose(v3(450, MID_Y, CENTRE_Z), CENTRE),
    tendency: 'The two sides and a little of the room combined — an integrated, natural view. Moving toward the treble side tends to favour the melody; toward the bass, the accompaniment.',
    checks: ['Bass and treble balance over a whole passage', 'Both bellows directions, not a held note', 'Key and bellows noise'],
  },
  {
    id: 'ac.grille',
    label: 'A dynamic facing the treble grille',
    band: 'Start about 46 cm (18 in) from the centre of the treble grille, facing it.',
    kind: 'sourced',
    src: 'S-ACC',
    quote: 'Test 4: "Microphone: SM57 — Position: About 18" from the center of the grille" (the lesson’s "an 18-inch dynamic microphone facing the grille" fixed: AC-01)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 430, max: 490 },
    bandProv: ill('about 18 in (457 mm) ± 30 mm: the lab’s band'),
    cone: { min: 0, max: 35, prov: ill('in front of the grille: within 35° of its normal (the lab’s band)') },
    aim: { maxOffAxis: 20, prov: ill('facing the grille: within 20° is the lab’s tolerance') },
    // Its label names a dynamic (the research's test used one): the setup
    // draws the small dynamic, not the condenser (review 2026-10-07, RV34-06).
    requires: { micTypeIds: ['smallDynCard', 'sdcCard'] },
    start: { p: v3(457, 0, 0), az: 0, el: 0 },
    draw: conePolys(A0, FRONT_N, null, 430, 490, 0, 35),
    tendency: 'The treble side forward, with the bass side farther away and quieter — a one-mic trial from the treble’s point of view. Check the bass part is still heard if the music needs it.',
    checks: ['The bass side’s level as the bellows move', 'Matched level when you compare', 'Keys and grille noise'],
  },
  {
    id: 'ac.treble',
    label: 'About 30 cm from the keyboard side',
    band: 'Start about 30 cm (12 in) out from the keyboard side, aimed at the treble — clear of the right arm.',
    kind: 'sourced',
    src: 'S-ACC',
    quote: 'Test 1/3: KSM137 "About 12" from the keyboard side"',
    refSurface: 'keys',
    side: 'outside',
    distance: { min: 280, max: 330 },
    bandProv: ill('about 12 in (305 mm) ± 25 mm: the lab’s band'),
    box: { min: v3(TREBLE.x0 + 40, TREBLE.y0 - 60, 0), max: v3(450, TREBLE.y1 + 40, 2000), prov: ill('beside the keyboard, not behind the player (the lab’s band)') },
    aim: { maxOffAxis: 40, prov: ill('aimed at the treble side: within 40° of square to the keyboard (the lab’s tolerance)') },
    requires: { micTypeIds: STAND },
    start: pose(v3(-20, MID_Y - 30, TREBLE.z1 + 305), v3(MID_X + 40, MID_Y - 30, TREBLE.z1)),
    drawn: { side: { u0: TREBLE.x0 + 40, u1: 450, v0: TREBLE.y0 - 60, v1: TREBLE.y1 + 40 }, top: { u0: TREBLE.x0 + 40, u1: 450, v0: TREBLE.z1 + 280, v1: TREBLE.z1 + 330 } },
    tendency: 'The melody side in detail, with the keys’ mechanism closer too. Often one of a pair, with a second mic for the bass side.',
    checks: ['Key noise against the reeds', 'The right arm’s full movement', 'The bass part, if the music needs it'],
  },
  {
    id: 'ac.bass',
    label: 'About 10–15 cm beyond the fully open bass side',
    band: 'Start about 10–15 cm (4–6 in) from the bass side at its FULLEST opening, aimed at the bass outlets — outside the bellows’ whole travel.',
    kind: 'sourced',
    src: 'S-ACC',
    quote: 'Test 2/3: "About 4–6" from the bellows side" — measured by the lab from the bass side at its full opening, so the stand stays outside the travel (AC-02)',
    refSurface: 'bass',
    side: 'outside',
    distance: { min: 101.6, max: 152.4 },
    box: { min: v3(TREBLE.x0 - 100, OPEN.box.y0 - 120, -3000), max: v3(250, TREBLE.y1 + 80, 0), prov: ill('beside the bass side, not behind the player (the lab’s band)') },
    aim: { maxOffAxis: 45, prov: ill('aimed back at the bass side: within 45° of square to it (the lab’s tolerance)') },
    requires: { micTypeIds: STAND },
    start: pose(v3(MID_X + 20, MID_Y, BASS_FULL - 127), v3(MID_X, MID_Y, BASS_FULL + 80)),
    drawn: { side: { u0: TREBLE.x0 - 100, u1: 250, v0: OPEN.box.y0 - 120, v1: TREBLE.y1 + 80 }, top: { u0: TREBLE.x0 - 100, u1: 250, v0: BASS_FULL - 152.4, v1: BASS_FULL - 101.6 } },
    tendency: 'The bass notes and chords, and more of the bass mechanism. Its distance to the bass side changes all through the bellows cycle — closest on a full pull — so its level and timing move.',
    checks: ['A full opening AND closing passage', 'Bass mechanism and air-button noise', 'The cable and stand clear of the bellows'],
  },
];

/* ── the model ── */
export const A11_MODEL: InstrumentModel = {
  id: 'a11-accordion',
  name: 'piano accordion on its player',
  parts,
  regions: [
    { id: 'r.treble', partId: 'ac.grille', label: 'the treble grille', anchor: v3(5, 0, 0), prov: ACC_SRC.bothSides, note: 'The treble reeds sound out through the grille on the front of the treble side.' },
    ...VARIANTS.map((v) => {
      const b = bassBox(v);
      return { id: `r.bass.${v}`, partId: 'ac.bassSide', label: 'the bass outlets', anchor: v3(MID_X, b.outlets.y, b.outlets.z - 4), prov: ACC_SRC.bothSides, variants: [v], note: 'The bass reeds sound out through the outlets on the end of the bass side — which moves with the bellows.' };
    }),
  ],
  surfaces: [
    { id: 'front', partId: 'ac.treble', label: 'the instrument’s front', point: v3(0, MID_Y, CENTRE_Z), normal: FRONT_N },
    { id: 'grille', partId: 'ac.grille', label: 'the grille’s centre', point: A0, normal: FRONT_N, target: true },
    { id: 'keys', partId: 'ac.keys', label: 'the keyboard side', point: v3(MID_X, MID_Y, TREBLE.z1), normal: v3(0, 0, 1) },
    { id: 'bass', partId: 'ac.bassSide', label: 'the bass side (fully open)', point: v3(MID_X, MID_Y, BASS_FULL), normal: v3(0, 0, -1) },
  ],
  lines: [
    { id: 'centre', label: 'the instrument’s middle', point: v3(0, MID_Y, CENTRE_Z), dir: FRONT_N, surfaces: ['front', 'grille'] },
    { id: 'trebleLine', label: 'the treble side’s middle', point: v3(MID_X, MID_Y, 0), dir: v3(0, 0, 1), surfaces: ['keys'] },
    { id: 'bassLine', label: 'the bass side’s middle', point: v3(MID_X, MID_Y, 0), dir: v3(0, 0, -1), surfaces: ['bass'] },
  ],
  envelopes,
  variants: BELLOWS_STATES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
  defaultVariant: 'mid',
  views: {
    side: { u0: -620, u1: 820, v0: -760, v1: 700 },
    top: { u0: -620, u1: 820, v0: BASS_FULL - 420, v1: TREBLE.z1 + 520 },
  },
  viewTags: { side: 'FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
  // From above the bellows' folds reach past the modelled parts.
  fitAuthored: { top: true },
  aimAzLimit: 180,
  yFloor: { mm: FLOOR_Y, prov: ACCORDION.grilleHt.prov, placeholder: true },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { in: null, mid: null, out: null },
};

export const A11_WEDGES: Wedge[] = [
  { id: 'wedge', label: 'a floor wedge downstage, facing back at the player', short: 'WEDGE', p: v3(1500, FLOOR_Y, CENTRE_Z), lift: 150, faces: v3(-1, 0, 0), note: 'In front of the player, behind a mic that faces the accordion — the case a pattern’s null can help with.', prov: ill('a typical stage layout; no source gives the position') },
  { id: 'side', label: 'a side-fill monitor on the bass side', short: 'SIDE FILL', p: v3(1250, FLOOR_Y, -1350), lift: 150, faces: v3(-0.76, 0, 0.65), note: 'Off to the bass side, roughly beside the mic: no pattern’s null reaches it — and the bass side moves toward it on every pull. Distance and level do the work.', prov: ill('a typical stage layout') },
];

/** The bass side's distance from a point over the cycle (the two-mic panel's moving source). */
export function bassOutletsAt(v: string): Vec3 {
  const b = bassBox(v);
  return v3(MID_X, b.outlets.y, b.outlets.z);
}
