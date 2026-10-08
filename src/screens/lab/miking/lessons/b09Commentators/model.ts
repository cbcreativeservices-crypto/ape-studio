/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the suggested starting points
 * (charter §2 layer 1), on the seated commentator (frame V) and the voice
 * family's zone builder (shared/voice/voiceZones). Source keys:
 * docs/labs/miking/commentators/SOURCES.md §0; every distance is from the
 * LIP POINT to the mic's FRONT (a headset capsule's foam, a lip ribbon's
 * GUARD, a broadcast dynamic's windscreen).
 *
 *   b9.headset  the headset boom's capsule at the OUTSIDE CORNER of the
 *               mouth, "not directly in front" (S-SM2) — 2–6 cm and 45–100°
 *               to the side is the lab's drawing (no distance is given) —
 *               the worked example (booth; also an open position);
 *   b9.analyst  the analyst's own headset, the same place on their mouth;
 *   b9.lip      the lip ribbon, its guard against the upper lip (the
 *               lesson's "designed positioning bars/guard"): the guard's
 *               place is the drawing's; the ribbon's depth behind it is
 *               UNKNOWN (D7-7) and never read out — CLOSE · LIVE (open);
 *   b9.arm      a broadcast dynamic on a desk arm, 5–15 cm (frame V's close
 *               zone, TRIAL), a little off the breath — FARTHER BACK ·
 *               STUDIO (a quiet booth), with the head-turn trade-off.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { talkerAnchor } from '../shared/broadcast/talkerPose.ts';
import { ANALYST, B09_MODEL, CALLER, IDS_B } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ON_AXIS = ill('on the mouth’s axis: within 15° of it (the lab’s drawing)');
const VA = talkerAnchor(CALLER);
const VB = talkerAnchor(ANALYST);
const HF = VOICE_DIMS.headsetFwd.mm;
const HS = VOICE_DIMS.headsetSide.mm;

const HEADSET_PROV = ill('no source gives a distance: 2–6 cm from the lip point, 45–100° to the side, is the lab’s drawing of "the outside corner of the mouth" — follow the headset’s own guide');

const HEADSET: VoiceZoneSpec = {
  id: 'b9.headset',
  label: 'Headset boom at the outside corner of the mouth',
  band: 'After our research, here is where we suggest you begin: the headset boom’s capsule at the outside corner of the mouth — close, but not directly in front, just out of the breath — aimed at the mouth. Fit the headset first, then set the boom.',
  kind: 'sourced',
  src: 'S-SM2',
  quote: 'as close as possible to the outside corner of the mouth (not directly in front.)',
  bandProv: HEADSET_PROV,
  distance: { min: 20, max: 60 },
  off: { min: 45, max: 100, toward: 'right', prov: ill('beside the mouth: 45–100° off the axis (the lab’s drawing)') },
  aimTol: 60,
  micTypeIds: ['bcHeadsetBoom', 'bcHeadsetSuper'],
  mount: 'clip',
  variants: ['booth', 'open', 'studio'],
  start: { d: [Math.hypot(HF, HS), 38, 40, 34, 44], deg: (Math.atan2(HS, HF) * 180) / Math.PI, spread: 12, at: 'mouth' },
  tendency: 'One steady distance however the head follows the play — the voice close and ahead of the crowd. Beside the mouth it hears a little less breath and fewer pops than a mic straight in front.',
  checks: ['P and B on an excited call', 'The tone as the head turns to the partner and back', 'Glasses, a scarf or notes rubbing the boom; the cable’s strain'],
};

const { variants: _bothPlaces, ...HEADSET_ONE } = HEADSET;
const ANALYST_HS: VoiceZoneSpec = {
  ...HEADSET_ONE,
  id: 'b9.analyst',
  label: 'The analyst’s own headset, at their mouth corner',
  band: 'Each commentator on their own mic: the analyst’s headset boom at the outside corner of their mouth, the same place as the commentator’s — each voice on its own labelled channel.',
  variant: 'booth',
  tendency: 'Each voice strongest in its own mic; the other voice later and much lower. A boom on the side away from the partner hears them more.',
  checks: ['Each channel alone while the other speaks', 'An overlap: does the sum sound hollow?', 'Both booms set the same way'],
};

const LIP: VoiceZoneSpec = {
  id: 'b9.lip',
  label: 'A lip ribbon, its guard against the upper lip',
  band: 'At an open position, an idea to try: a lip ribbon held to the mouth, its guard resting on the upper lip — the guard sets the same distance every time. Use the guard the mic was made with; never copy that contact to a different mic.',
  kind: 'trial',
  src: 'LESSON-B09',
  quote: 'Use the model’s designed positioning bars/guard to establish a repeatable mouth distance (L15); use the specified lip reference to keep distance consistent (L26)',
  bandProv: ill('the guard’s place on the upper lip (about 1–3 cm in front of the lip point) is the lab’s drawing; how far the ribbon sits behind the guard is not given (COLES-SPEC unreadable): a drawing default, never a readout (D7-7)'),
  distance: { min: 8, max: 30 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcLipRibbon'],
  mount: 'clip',
  variant: 'open',
  start: { d: [16, 14, 18, 20, 12, 24], spread: 4, at: 'mouth' },
  tendency: 'A close, repeatable voice with much of the stadium held back — less at the sides, where its pattern is least sensitive. Its rear still hears the crowd and a neighbour’s voice: never claim total cancellation.',
  checks: ['The guard where the maker says, against the upper lip', 'The rear and the sides: the crowd and the PA with the venue live', 'Wind, hand noise, and a hygiene barrier if it is shared'],
};

const ARM: VoiceZoneSpec = {
  id: 'b9.arm',
  label: 'A desk-arm mic, about 5–15 cm, a little off the breath',
  band: 'In a quiet, enclosed booth, try a broadcast dynamic on a desk arm about 5–15 cm (2–6 in) from the lips, aimed at the mouth from just off the line of the breath — out of the sight line to the screen and the notes.',
  kind: 'trial',
  src: 'LESSON-B09',
  quote: 'Put the capsule on a stable arm near the mouth, off the direct blast of P/B sounds, and out of sightline/notes (L18)',
  bandProv: ill('5–15 cm is frame V’s close zone (the lesson gives no distance): a trial band'),
  distance: { min: 50, max: 150 },
  off: { min: 0, max: 20, prov: ill('on or just off the mouth’s axis: within 20° (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['bcDynArm'],
  mount: 'clip',
  variant: 'studio',
  start: { d: [100, 110, 90, 120, 80], deg: 10, spread: 8, at: 'mouth' },
  tendency: 'A full, steady voice in a quiet room — until the commentator turns to follow the play: the mouth leaves the mic’s axis, and the voice dulls and drops.',
  checks: ['The tone as the head follows the play', 'Desk knocks, paper and a nearby loudspeaker', 'Out of the line to the screen'],
};

const VB_SURF = { surface: IDS_B.surface };

export const B09_ZONES: DocumentedZone[] = [
  voiceZone(B09_MODEL, VA, HEADSET, MIC_TYPES),
  voiceZone(B09_MODEL, VB, ANALYST_HS, MIC_TYPES, VB_SURF),
  voiceZone(B09_MODEL, VA, LIP, MIC_TYPES),
  voiceZone(B09_MODEL, VA, ARM, MIC_TYPES),
];
