/**
 * A01 TRUMPET AND FLUGELHORN — the recommended starting points (charter §2
 * layer 1). Source keys point into docs/labs/miking/trumpet/SOURCES.md (the
 * Lab 3 and brass keys are its §0) and flugelhorn/SOURCES.md; the geometry
 * is trumpet/GEOMETRY_PROPOSAL.md §5 on the shared brass family. Every
 * distance is measured from the bell rim's centre to the mic's FRONT.
 *
 * TRUMPET
 *   tp.off   30–50 cm, a little off the bell's axis (DPA; the overlap with
 *            Shure's 1–2 ft) — the worked example;
 *   tp.side  30–60 cm, well to one side (Shure: "to one side sounds natural
 *            or mellow");
 *   tp.far   60–120 cm in front, aimed at the bell's edge (the practice
 *            guide's trumpet/flugelhorn row — an ADD, survey 3d-2);
 *   tp.back  close behind the bell (DPA: "the close proximity back side of
 *            the bell" — no number: 10–22 cm is a drawing default);
 *   tp.clip  a miniature on a bell clip, its capsule in front of the rim,
 *            aimed between the bell's centre and its edge (DPA-MOUNT).
 * FLUGELHORN
 *   fh.far   60–120 cm in front, aimed off axis at the bell's edge (the
 *            flugelhorn-named guide: the lesson's studio start) — worked;
 *   fh.close 30–60 cm, a little off axis (Shure's generic brass range);
 *   fh.clip  as the trumpet's — "check the clip's range" (fit UNKNOWN).
 * Above-or-level only (the `toward` up-side): DPA aims a close mic "down or
 * to the side"; the side view's lower half stays for the views' inset. The
 * cone bands (5–20°, 25–55°, …) are the lab's drawing (ILLUSTRATIVE).
 * Every start is found once at load: the first pose (in order of
 * preference) inside the zone and clear of every part (bowedModel.firstClear).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear } from '../shared/bowed/bowedModel.ts';
import { coneSection } from '../shared/brass/brassModel.ts';
import type { HornPose } from '../shared/brass/brassPosture.ts';
import { A01_MODEL, FH, TP } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const O: Vec3 = { x: 0, y: 0, z: 0 };
const UP: Vec3 = { x: 0, y: -1, z: 0 };
type Z = Omit<DocumentedZone, 'start'>;

const draw = (P: HornPose, cMin: number, cMax: number, r0: number, r1: number, toward?: Vec3) => ({
  side: coneSection('side', O, P.axis, cMin, cMax, r0, r1, toward),
  top: coneSection('top', O, P.axis, cMin, cMax, r0, r1, toward),
});
const start = (z: Z, variant: string, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(A01_MODEL, z, [variant], gen, MIC_TYPES) }) as DocumentedZone;
/** Candidate poses round the bell's axis tilted toward `side`, aimed at `at`. */
const cands = (P: HornPose, tilt: number, side: Vec3, dists: number[], spread: number, at: Vec3 = O) =>
  around(O, norm(add(scale(P.axis, Math.cos((tilt * Math.PI) / 180)), scale(side, Math.sin((tilt * Math.PI) / 180)))), dists, spread, at, P.axis);
const STAND = ['instDynCard', 'sdcCard'];
/** The flugelhorn's one-mic start is its 60–120 cm studio view: the small
 *  condenser first there (review 2026-10-07, CORRECTIONS_LOG RV34-05). */
const FAR_FIRST = ['sdcCard', 'instDynCard'];

/* ── trumpet ── */
const TP_OFF: Z = {
  id: 'tp.off',
  label: 'In front of the bell, a little off its axis',
  band: 'Try about 30–50 cm (12–20 in) from the bell, a little off its axis, aimed toward the bell — a balanced place to begin.',
  kind: 'sourced',
  src: 'DPA-TPT',
  quote: 'For a well balanced sound, position the microphone 30 to 50 cm from the bell, slightly off axis.',
  bandProv: ill('"slightly off axis": 5–20° off the bell’s axis is the lab’s drawing; the upper side only'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 300, max: 500 },
  cone: { min: 5, max: 20, toward: UP, prov: ill('a little off axis, above or level (the lab’s drawing)') },
  aim: { maxOffAxis: 25, prov: ill('aimed toward the bell: within 25° (the lab’s tolerance)') },
  requires: { variant: 'trumpet', micTypeIds: STAND },
  draw: draw(TP, 5, 20, 300, 500, UP),
  tendency: 'A balanced, focused trumpet with some definition — less of the straight blast than dead centre. Closer and more centred tends to bring more edge and breath; farther, more room and neighbours.',
  checks: ['The loudest accent and the softest ending, for overload', 'How far the bell moves as the player plays', 'Mutes going in and out, and the valve hands, clear of the stand'],
};

const TP_SIDE: Z = {
  id: 'tp.side',
  label: 'To one side of the bell — a mellower view',
  band: 'Try about 30–60 cm (1–2 ft) from the bell, well off to one side of its axis, still aimed toward the bell.',
  kind: 'sourced',
  src: 'S-BWS',
  quote: 'start by placing the microphone 1 to 2 feet from the bell … On-axis = brighter and more defined, Off-axis = softer with less bite (S-BWS); "to one side sounds natural or mellow" (S-LIVE/S-REC)',
  bandProv: ill('"to one side": 25–55° off the axis is the lab’s drawing'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 300, max: 600 },
  cone: { min: 25, max: 55, toward: UP, prov: ill('to one side, above or level') },
  aim: { maxOffAxis: 30, prov: ill('aimed toward the bell: within 30°') },
  requires: { variant: 'trumpet', micTypeIds: STAND },
  draw: draw(TP, 25, 55, 300, 600, UP),
  tendency: 'A softer, mellower top with less bite — the high harmonics beam along the axis, and this mic sits beside that beam. Listen that the attacks still read.',
  checks: ['Attacks and high notes still clear', 'The tone as the bell swings toward and away from the mic', 'More of the room and the neighbours'],
};

const TP_FAR: Z = {
  id: 'tp.far',
  label: 'Farther in front, aimed at the bell’s edge',
  band: 'Try about 60–120 cm (2–4 ft) in front, off the bell’s axis, aimed at the edge of the bell — a more open view.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Trumpet/Flugelhorn — Place the microphone in front of the instrument about 2-4 feet. Aim the microphone so that it is off axis from the bell… aiming it at the edge of the bell',
  bandProv: ill('2–4 ft drawn 60–120 cm; "off axis": 5–30° (the lab’s drawing)'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 5, max: 30, toward: UP, prov: ill('off axis, above or level') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the bell’s edge: within 30° of the bell (the lab’s tolerance)') },
  requires: { variant: 'trumpet', micTypeIds: STAND },
  draw: draw(TP, 5, 30, 600, 1200, UP),
  tendency: 'More of the player and the room together, and more spill. A quiet, good-sounding room helps; on a loud stage it hears the band.',
  checks: ['How much room and how many neighbours it hears', 'The player moving: does the tone hold?', 'The stand out of the player’s walk path and sight line'],
};

const TP_BACK: Z = {
  id: 'tp.back',
  label: 'Close behind the bell',
  band: 'An idea to try in a studio: a mic close behind the bell, beside its flare, about 10–22 cm from the rim’s centre — clear of the valve hands and the player.',
  kind: 'trial',
  src: 'DPA-TPT',
  quote: 'you may try to mic the trumpet from the close proximity back side of the bell',
  bandProv: ill('no distance is given: 10–22 cm from the rim’s centre, behind the rim and beside the flare, is the lab’s drawing'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 100, max: 220 },
  cone: { min: 100, max: 150, prov: ill('behind the rim’s plane, beside the flare (the lab’s drawing)') },
  aim: { maxOffAxis: 40, prov: ill('aimed toward the bell: within 40°') },
  requires: { variant: 'trumpet', micTypeIds: STAND },
  draw: draw(TP, 100, 150, 100, 220),
  tendency: 'Nearer what the player hears — the horn from behind — with far less of the straight-ahead brightness. An experiment, not a usual start.',
  checks: ['The valve hands and the player’s face stay well clear', 'Valve clicks and breath noise', 'Compare with a mic in front at matched level'],
};

const clipZone = (P: HornPose, id: string, variant: string, surface: string, words: { label: string; band: string; tendency: string; checks: string[] }): DocumentedZone => {
  const z: Z = {
    id,
    label: words.label,
    band: words.band,
    kind: 'sourced',
    src: 'DPA-MOUNT',
    quote: 'do not point the microphone directly into the center of the bell, but position it between the center position and the bell’s edge. All types of mutes can be used together with the 4099.',
    bandProv: ill('no distance is given: the capsule 4–13 cm in front of the rim’s centre, within 60° of the axis, is the lab’s drawing (the gooseneck reaches 14 cm)'),
    refSurface: surface,
    side: 'outside',
    distance: { min: 40, max: 130 },
    cone: { min: 0, max: 60, prov: ill('in front of the rim (the lab’s drawing)') },
    aim: { maxOffAxis: 50, minOffAxis: 6, prov: ill('aimed between the centre and the edge: 6–50° off the line to the centre (the lab’s tolerance)') },
    aimAt: { surface, r: P.spec.bell.mm / 2, prov: ill('the capsule’s axis meets the bell’s opening, inside the rim') },
    requires: { variant, micTypeIds: ['brClip'], mount: 'clip' },
    draw: draw(P, 0, 60, 40, 130),
    tendency: words.tendency,
    checks: words.checks,
  };
  const R = P.spec.bell.mm / 2;
  // Candidates: over the upper-left part of the rim, aimed at a point between centre and edge.
  const aimPt = add(O, scale(norm({ x: 0, y: -0.7, z: -0.7 }), R * 0.45));
  return start(z, variant, cands(P, 30, norm({ x: 0, y: -1, z: -1 }), [80, 70, 90, 60, 100, 55, 110], 24, aimPt));
};

/* ── flugelhorn (its own bell surface: dipped) ── */
const FB = 'bell.flugelhorn';
const FH_FAR: Z = {
  id: 'fh.far',
  label: 'Farther in front, aimed at the bell’s edge',
  band: 'Try about 60–120 cm (2–4 ft) in front of the bell, a little off its axis, aimed across it or at its outer edge — a more open studio view to begin with.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Trumpet/Flugelhorn — Place the microphone in front of the instrument about 2-4 feet. Aim the microphone so that it is off axis from the bell… aiming it at the edge of the bell',
  bandProv: ill('2–4 ft drawn 60–120 cm; "off axis": 5–30° (the lab’s drawing)'),
  refSurface: FB,
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 5, max: 30, toward: UP, prov: ill('off axis, above or level') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the bell’s edge: within 30° of the bell') },
  requires: { variant: 'flugelhorn', micTypeIds: FAR_FIRST },
  draw: draw(FH, 5, 30, 600, 1200, UP),
  tendency: 'The rounded flugelhorn with the room around it — sustained body and a soft attack. More spill: it suits a quiet, good room.',
  checks: ['The full range and the sustain, not one held note', 'Room and spill against the closer view', 'The bell’s angle: the player may hold it lower'],
};
const FH_CLOSE: Z = {
  id: 'fh.close',
  label: 'Closer, a little off the bell’s axis',
  band: 'Try about 30–60 cm (1–2 ft) from the bell, a little off its axis, aimed toward it — a closer, more focused view.',
  kind: 'sourced',
  src: 'S-BWS',
  quote: 'start by placing the microphone 1 to 2 feet from the bell (generic brass, S-BWS)',
  bandProv: ill('"1–2 ft" drawn 30–60 cm; a little off axis: 5–30° (the lab’s drawing)'),
  refSurface: FB,
  side: 'outside',
  distance: { min: 300, max: 600 },
  cone: { min: 5, max: 30, toward: UP, prov: ill('a little off axis, above or level') },
  aim: { maxOffAxis: 25, prov: ill('aimed toward the bell: within 25°') },
  requires: { variant: 'flugelhorn', micTypeIds: STAND },
  draw: draw(FH, 5, 30, 300, 600, UP),
  tendency: 'More focus and more of the bell’s own colour, less room — and more breath and valve noise. Listen that the mellow character survives.',
  checks: ['Breath and valve noise', 'Attacks against the softness the player wants', 'Spill and the room against the farther view'],
};

const UPV = norm({ x: 0, y: -1, z: -0.25 });
export const A01_ZONES: DocumentedZone[] = [
  start(TP_OFF, 'trumpet', cands(TP, 12, UPV, [400, 380, 420, 350, 450, 330, 470], 6)),
  start(TP_SIDE, 'trumpet', cands(TP, 40, norm({ x: 0, y: -0.6, z: -1 }), [450, 420, 480, 400, 520, 360, 560], 12)),
  start(TP_FAR, 'trumpet', cands(TP, 16, UPV, [900, 850, 950, 800, 1000, 750, 1100, 700], 10)),
  start(TP_BACK, 'trumpet', cands(TP, 120, norm({ x: 0, y: -0.35, z: -1 }), [170, 160, 180, 150, 190, 140, 200, 130, 210], 18)),
  clipZone(TP, 'tp.clip', 'trumpet', 'bell', {
    label: 'Miniature on a bell clip',
    band: 'Clip it to the bell’s rim where its maker allows, and bring the capsule a few centimetres in front of the bell, aimed between the bell’s centre and its edge — not straight down the middle.',
    tendency: 'A steady close sound as the player moves and turns — the distance stays put. Closer and more coloured than a stand mic; it can carry handling or bell noise.',
    checks: ['A clip made for this bell, with the player’s agreement', 'Every mute the piece uses, and the hand on a plunger', 'The cable secured clear of the valves and the hands'],
  }),
  start(FH_FAR, 'flugelhorn', cands(FH, 16, UPV, [900, 850, 950, 800, 1000, 750, 1100, 700], 10)),
  start(FH_CLOSE, 'flugelhorn', cands(FH, 16, UPV, [450, 420, 480, 400, 520, 360, 560], 10)),
  clipZone(FH, 'fh.clip', 'flugelhorn', FB, {
    label: 'Miniature on a bell clip — check its range',
    band: 'If a clip is made for this bell, clip it to the rim and bring the capsule a few centimetres in front, aimed between the centre and the edge. A trumpet clip may not fit a flugelhorn’s wider bell: check the clip’s range first.',
    tendency: 'The distance holds as the player moves; a closer, more coloured view of a mellow horn. Listen for clip vibration and valve noise.',
    checks: ['The clip’s range against this bell, with the player’s agreement', 'A mute, if the piece uses one, and the player’s hands', 'Cable and wireless pack secured without pulling on the horn'],
  }),
];
