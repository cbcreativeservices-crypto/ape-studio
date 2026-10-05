/**
 * THE DOUBLE BASS, shared by C06a (plucked) and C06b (bowed): the bowed
 * family's bass row on its endpin, the bassist standing behind it
 * (upright_bass_plucked/GEOMETRY_PROPOSAL.md §1), one model per playing
 * approach — the plucking hand and arm, or the bow, its sweep and the bow
 * arm — and the anchors both lessons measure from.
 *
 * "JUST ABOVE THE BRIDGE" made concrete (the survey's ambiguity, resolved by
 * the booklets' wording, proposal §2): a mic in FRONT of the strings at a
 * height a little ABOVE the bridge — frame-B x′ 60–150 mm up the strings
 * from the bridge (drawing default), 15–30 cm out in front of them.
 *
 * Clip attachments (Shure's live engineer: "the tailpiece, an f hole, or the
 * ridge just above the waist — never the bridge"; DPA: the E and G strings
 * below the bridge).
 */
import type { DocumentedZone, InstrumentModel, MicPose, Provenance, ReferenceSurface } from '../../../engine/model/types.ts';
import { add, norm, scale } from '../../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../../data/micTypes.ts';
import { around, bowedModel, firstClear, zoneDisc, zoneSection, type BowedModelOpts } from './bowedModel.ts';
import { BASS, CLEAR, archAt, halfWidth, stationsOf, stringZ } from './bowedSpec.ts';
import { anchorsOf, standing, toLesson } from './posture.ts';

export const BASS_SPEC = BASS;
const st = stationsOf(BASS);
export const BASS_PLUCK = standing(BASS, 'pluck');
export const BASS_BOW = standing(BASS, 'bow');
export const BASS_A = anchorsOf(BASS_PLUCK);
const ax = BASS_PLUCK.ax;
export const BB = (x: number, y: number, z: number) => toLesson(ax, { x, y, z });

/** "Just above the bridge": the strings 60–150 mm up from the bridge (its middle). */
export const ABOVE = BB(105, 0, stringZ(BASS, 105));
/** Under the strings just behind the bridge (the tailpiece side). */
export const UNDER = BB(-55, 0, (stringZ(BASS, -55) + archAt(BASS, -55)) / 2 - 4);
const fhX = (BASS.fholeX[0] + BASS.fholeX[1]) / 2;
/** The ridge just above the waist, on the treble side. */
const XW = st.tailX + BASS.body.mm * BASS.stations.waist;
export const BASS_ATTACH = [
  { id: 'clip.strings', label: 'the E and G strings below the bridge', at: { x: -95, y: 0, z: stringZ(BASS, -95) } },
  { id: 'clip.fhole', label: 'the edge of the treble f-hole', at: { x: BASS.fholeX[0] + 25, y: BASS.fholeY.mm + 22, z: archAt(BASS, BASS.fholeX[0] + 25, BASS.fholeY.mm + 22) } },
  { id: 'clip.ridge', label: 'the ridge above the waist', at: { x: XW + 110, y: halfWidth(BASS, XW + 110) - 6, z: 4 } },
  { id: 'clip.tail', label: 'the tailpiece', at: { x: -300, y: 0, z: stringZ(BASS, -300) * 0.6 } },
];
/** The treble f-hole's middle (the G side: away from the player). */
export const FHOLE = BB(fhX, BASS.fholeY.mm, archAt(BASS, fhX, BASS.fholeY.mm));

export const BASS_VIEWS = {
  side: { u0: -900, u1: 1500, v0: -1520, v1: 830 },
  top: { u0: -900, u1: 1500, v0: -680, v1: 760 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'above', partId: 'bw.strings', label: 'the strings just above the bridge', point: ABOVE, normal: ax.z, target: true },
  { id: 'foot', partId: 'bw.bridge', label: 'the bridge’s foot', point: BASS_A.bridgeFoot, normal: { x: -ax.x.x, y: -ax.x.y, z: -ax.x.z }, target: true },
];

const base = (right: 'pluck' | 'bow'): BowedModelOpts => ({
  id: right === 'bow' ? 'bassBowed' : 'bassPlucked',
  name: 'double bass',
  right,
  views: BASS_VIEWS,
  attach: BASS_ATTACH,
  front: ax.z,
  clearance: CLEAR.body,
  surfaces,
  variants: [{ id: 'standing', label: 'STANDING', blurb: 'The bassist stands behind the bass, its back resting against the body, the endpin on the floor.' }],
});

export const BASS_PLUCK_MODEL: InstrumentModel = bowedModel(BASS_PLUCK, base('pluck'));
export const BASS_BOW_MODEL: InstrumentModel = bowedModel(BASS_BOW, base('bow'));

/* ── the starting points both bass lessons share (upright_bass_plucked/
 *    SOURCES.md; corrections UB-01 … UB-04). Learner words: label, band,
 *    tendency, checks; the rest is the internal record. ── */
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
type ZoneT = Omit<DocumentedZone, 'start'>;

export const BASS_FRONT: ZoneT = {
  id: 'ub.front',
  label: 'Out in front, just above the bridge',
  band: 'Start about 15–30 cm (6–12 in) out in front of the strings, a little above the bridge — about 6–15 cm up the strings from it — aimed back at the bridge and top.',
  kind: 'sourced',
  src: 'S-BWS',
  quote: 'Place the microphone 6 inches to 1 foot out in front of the instrument above the bridge to create a well-defined, natural sound.',
  bandProv: ill('booklets: "6 inches to 1 foot out front, just above bridge" — read as in front of the strings, 6–15 cm up from the bridge (proposal §2, drawing default; UB-01)'),
  refSurface: 'above',
  side: 'outside',
  distance: { min: 152.4, max: 304.8 },
  cone: { min: 0, max: 25, prov: ill('out in front: within 25° of the top’s straight-on line (keeps it a little above the bridge)') },
  aim: { maxOffAxis: 25, prov: ill('aimed back at the bridge area: within 25°') },
  requires: { micTypeIds: ['strSdc'] },
  draw: { side: zoneSection('side', ABOVE, ax.z, 25, 152.4, 304.8), top: zoneSection('top', ABOVE, ax.z, 25, 152.4, 304.8) },
  tendency: 'A well-defined, natural bass: the note, the body and the finger (or bow) together. It hears the room and the neighbours too.',
  checks: ['Clear of the hands and the bassist’s movement', 'Several notes, low and high — one note booming?', 'Drum and neighbour spill, and where the pattern rejects it'],
};

export const BASS_FHOLE: ZoneT = {
  id: 'ub.fhole',
  label: 'A few inches from an f-hole',
  band: 'Try about 5–10 cm (2–4 in) in front of the f-hole on the far side from the player, aimed into it — for a fuller sound.',
  kind: 'sourced',
  src: 'S-BWS',
  quote: 'Position the mic a few inches from the f-hole for a fuller sound… roll off the bass if the sound is too boomy',
  bandProv: ill('"a few inches" has no number: 5–10 cm in front of the treble f-hole is the lab’s drawing'),
  refSurface: 'fhole',
  side: 'outside',
  distance: { min: 50, max: 100 },
  cone: { min: 0, max: 45, prov: ill('in front of the f-hole: within 45°') },
  aim: { maxOffAxis: 30, prov: ill('aimed into the f-hole: within 30°') },
  requires: { micTypeIds: ['strSdc'] },
  draw: { side: zoneSection('side', FHOLE, ax.z, 45, 50, 100), top: zoneSection('top', FHOLE, ax.z, 45, 50, 100) },
  tendency: 'More output and low-mid body — and a risk of one note booming. Check several notes; a little low cut may help if it is too boomy.',
  checks: ['One boomy note: the f-hole, or the room?', 'Clear of the bassist’s hands and the bow', 'Feedback: a resonant bass can feed back'],
};

export const BASS_UNDER: ZoneT = {
  id: 'ub.under',
  label: 'Miniature under the strings, by the bridge',
  band: 'Clip it to the two outer strings below the bridge and bring the capsule about 4–11 cm from the bridge’s foot, under the strings on the tailpiece side — between the strings and the top.',
  kind: 'sourced',
  src: 'DPA-DB',
  quote: 'The spot under the bridge, between the strings and the deck, is a good position to mount a microphone',
  bandProv: ill('no distance is given: 4–11 cm from the bridge’s foot, under the strings toward the tailpiece, is the lab’s drawing (UB-02)'),
  refSurface: 'foot',
  side: 'outside',
  distance: { min: 40, max: 110 },
  cone: { min: 0, max: 50, prov: ill('on the tailpiece side of the bridge, under the strings (the lab’s drawing)') },
  aim: { maxOffAxis: 60, prov: ill('aimed back at the bridge and top: within 60°') },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', UNDER, 34), top: zoneDisc('top', UNDER, 34) },
  tendency: 'The low end and body together with the string’s bite, close and steady as the bassist moves — a more local colour. Aimed toward an f-hole, more level.',
  checks: ['A clip made for the bass, on the strings — never on the bridge', 'Clear of the fingers, the strings and the bow path', 'The cable kept from rubbing as the bassist moves'],
};

/** A zone with its start found once, clear on this model. */
export function bassStart(model: InstrumentModel, z: ZoneT, gen: Iterable<MicPose>): DocumentedZone {
  return { ...z, start: firstClear(model, z, ['standing'], gen, MIC_TYPES) } as DocumentedZone;
}
export const FRONT_GEN = () => around(ABOVE, ax.z, [220, 200, 250, 180, 280, 160, 300], 22, ABOVE, ax.y);
export const FHOLE_GEN = () => around(FHOLE, ax.z, [75, 65, 85, 60, 90, 55, 95], 40, FHOLE, ax.x);
export const UNDER_GEN = () => around(BASS_A.bridgeFoot, norm(add(scale(ax.x, -1), scale(ax.z, 0.6))), [70, 60, 80, 55, 90, 50, 100], 40, BASS_A.bridgeFoot, ax.y);
