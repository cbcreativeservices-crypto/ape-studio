/**
 * A02 TROMBONE AND BASS TROMBONE — the recommended starting points (charter
 * §2 layer 1). Source keys point into docs/labs/miking/trombone/SOURCES.md
 * and bass_trombone/SOURCES.md (the Lab 3 keys: trumpet/SOURCES.md §0); the
 * geometry is trombone/GEOMETRY_PROPOSAL.md §4. Distances from the bell
 * rim's centre to the mic's FRONT. "None of these ranges is bass-trombone-
 * specific" (L9, CONFIRMED): the stand zones serve both horns.
 *
 *   tb.off   30–60 cm (DPA 30–50 cm and Shure 1–2 ft, overlapping) — the
 *            lesson's practical arrangement: ABOVE or BESIDE the slide's
 *            sweep (the bell's side, away from the slide), aimed across the
 *            bell (L11: a lesson inference, labelled so in the record).
 *            Straight in front of the bell is NOT a start: the stand drops
 *            through the slide's path (L45) — the scene shows it;
 *   tb.far   60–120 cm, off the axis, the same side (the practice guide's
 *            trombone row — an ADD);
 *   tb.clip  a miniature on a bell clip, never on the slide (DPA-MOUNT),
 *            the capsule in front of the rim on the side away from the
 *            slide — one zone per bell size.
 * The cones (15–50°, 10–40°) and the side are the lab's drawing.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear } from '../shared/bowed/bowedModel.ts';
import { coneSection } from '../shared/brass/brassModel.ts';
import type { HornPose } from '../shared/brass/brassPosture.ts';
import { A02_MODEL, BT, TB } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const O: Vec3 = { x: 0, y: 0, z: 0 };
/** Above, or to the bell's side (the player's left) — away from the slide. */
const AWAY = norm({ x: 0, y: -1, z: -1 });
type Z = Omit<DocumentedZone, 'start'>;
const STAND = ['instDynCard', 'sdcCard'];
const BOTH = ['tenor', 'bass'] as const;

const draw = (P: HornPose, cMin: number, cMax: number, r0: number, r1: number, toward?: Vec3) => ({
  side: coneSection('side', O, P.axis, cMin, cMax, r0, r1, toward),
  top: coneSection('top', O, P.axis, cMin, cMax, r0, r1, toward),
});
const start = (z: Z, variants: readonly string[], gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(A02_MODEL, z, variants, gen, MIC_TYPES) }) as DocumentedZone;
const cands = (tilt: number, side: Vec3, dists: number[], spread: number, at: Vec3 = O) =>
  around(O, norm(add(scale({ x: 1, y: 0, z: 0 }, Math.cos((tilt * Math.PI) / 180)), scale(side, Math.sin((tilt * Math.PI) / 180)))), dists, spread, at, { x: 1, y: 0, z: 0 });

const TB_OFF: Z = {
  id: 'tb.off',
  label: 'Above or beside the slide, aimed across the bell',
  band: 'Try about 30–60 cm (12–24 in) from the bell, a little off its axis — above the slide or out to the bell’s side, away from it — aimed across the bell.',
  kind: 'sourced',
  src: 'DPA-TPT',
  quote: 'For a well balanced sound, position the microphone 30 to 50 cm from the bell, slightly off axis (DPA-TPT); 1 to 2 feet from the bell (S-BWS); "above or to the side of the slide’s sweep, aimed across the bell" (L11, the lesson’s own practical arrangement)',
  bandProv: ill('30–60 cm spans the two overlapping ranges; 15–50° off axis on the side away from the slide is the lab’s drawing of L11'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 300, max: 600 },
  cone: { min: 15, max: 50, toward: AWAY, prov: ill('above or to the bell’s side, away from the slide (L11)') },
  aim: { maxOffAxis: 30, prov: ill('aimed across the bell: within 30° of it (the lab’s tolerance)') },
  requires: { micTypeIds: STAND },
  draw: draw(TB, 15, 50, 300, 600, AWAY),
  tendency: 'A balanced, present trombone — the core and the articulation without the full blast down the axis. Toward the centre tends to bring more edge; farther off, a softer top.',
  checks: ['The full slide sweep to 7th position, with the stand and cable outside it', 'The loudest accent, for overload in the mic as well as the input', 'Mutes in and out, and the player’s normal movement'],
};

const TB_FAR: Z = {
  id: 'tb.far',
  label: 'Farther in front, off the bell’s axis',
  band: 'Try about 60–120 cm (2–4 ft) in front, off the bell’s axis on the side away from the slide, aimed at the bell — a more open view.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Trombone — Place the microphone in front of the instrument about 2-4 feet… off axis from the bell',
  bandProv: ill('2–4 ft drawn 60–120 cm; 10–40° off axis, away from the slide: the lab’s drawing'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 10, max: 40, toward: AWAY, prov: ill('off axis, away from the slide') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the bell: within 30°') },
  requires: { micTypeIds: STAND },
  draw: draw(TB, 10, 40, 600, 1200, AWAY),
  tendency: 'More of the room and the section with the horn — a blended, fuller view, and more spill. It suits a quiet, good room.',
  checks: ['The slide’s reach at 7th: the stand stays well outside it', 'Room and neighbours against the closer view', 'The lowest notes: is the body still there?'],
};

const clip = (P: HornPose, id: string, variant: string, rimWord: string): DocumentedZone => {
  const R = P.spec.bell.mm / 2;
  const z: Z = {
    id,
    label: 'Miniature on a bell clip — never on the slide',
    band: `Clip it to the bell’s rim where its maker allows (${rimWord}) — never on the slide — and bring the capsule a few centimetres in front of the bell on the side away from the slide, aimed between the bell’s centre and its edge.`,
    kind: 'sourced',
    src: 'DPA-MOUNT',
    quote: 'do not point the microphone directly into the center of the bell, but position it between the center position and the bell’s edge (DPA-MOUNT); mount only on the approved stationary bell area, never on the slide (L21)',
    bandProv: ill('no distance is given: 4–13 cm in front of the rim’s centre, within 60° of the axis, on the side away from the slide, is the lab’s drawing'),
    refSurface: 'bell',
    side: 'outside',
    distance: { min: 40, max: 130 },
    cone: { min: 0, max: 60, toward: AWAY, prov: ill('in front of the rim, away from the slide') },
    aim: { maxOffAxis: 50, minOffAxis: 6, prov: ill('aimed between the centre and the edge: 6–50° off the line to the centre') },
    aimAt: { surface: 'bell', r: R, prov: ill('the capsule’s axis meets the bell’s opening, inside the rim') },
    requires: { variant, micTypeIds: ['brClip'], mount: 'clip' },
    draw: draw(P, 0, 60, 40, 130, AWAY),
    tendency: 'The distance holds as the player moves, and the slide stays clear. A closer, more coloured view than a stand mic; listen for clip or bell vibration.',
    checks: ['A clip made for this bell, with the player’s agreement', 'The cable routed clear of the slide, the hands and any trigger', 'The full slide sweep, mutes and the player’s movement'],
  };
  const aimPt = scale(AWAY, R * 0.45);
  return start(z, [variant], cands(32, AWAY, [80, 70, 90, 60, 100, 110], 24, aimPt));
};

export const A02_ZONES: DocumentedZone[] = [
  start(TB_OFF, BOTH, cands(30, AWAY, [420, 400, 450, 380, 480, 350, 520, 560], 14)),
  start(TB_FAR, BOTH, cands(24, AWAY, [900, 850, 950, 800, 1000, 750, 1100, 700], 12)),
  clip(TB, 'tb.clip', 'tenor', 'a tenor bell'),
  clip(BT, 'tb.clipBass', 'bass', 'check the clip’s range on the larger bass bell'),
];
