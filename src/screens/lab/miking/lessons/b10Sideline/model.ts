/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the recommended starting points
 * (charter §2 layer 1), on the standing guest (frame V) and the reporter
 * beside them; the voice family's zone builder (shared/voice/voiceZones).
 * Source keys: docs/labs/miking/commentators/SOURCES.md §0 and
 * lead_vocal/SOURCES.md §0; every distance is from the LIP POINT to the
 * mic's FRONT. The lesson gives no distance ("the exact distance depends on
 * capsule, windscreen, voice and framing"): the handheld zone is frame V's
 * close handheld row as a suggested start.
 *
 *   b10.hand      the handheld at the speaking guest's mouth, under 15 cm
 *                 and a little below the breath — in the reporter's hand
 *                 (SIDELINE: the worked example), in the guest's own (TWO
 *                 HANDHELDS);
 *   b10.reporter  the reporter's own handheld at their mouth (TWO HANDHELDS);
 *   b10.headset   the reporter's headset boom at the mouth corner, leaving
 *                 the handheld for the guest (SIDELINE: CLOSE · LIVE);
 *   b10.lav       a body mic on a scheduled guest, at the breastbone — only
 *                 with approval (POST-EVENT: the one-mic start);
 *   b10.boom      a short shotgun on a pole above the post-event mark, aimed
 *                 down at the mouth, 0.5–1 m (TRIAL) — FARTHER BACK.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { standerAnchor } from '../shared/broadcast/standing.ts';
import { B10_MODEL, IDS_R, LAV_P, REPORTER } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };
const VR = standerAnchor(REPORTER);
const HF = VOICE_DIMS.headsetFwd.mm;
const HS = VOICE_DIMS.headsetSide.mm;
const FLAGS = ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper'];

const HAND: VoiceZoneSpec = {
  id: 'b10.hand',
  label: 'The handheld at the speaking mouth, under 15 cm',
  band: 'After our research, here is where we recommend you begin: the handheld under about 15 cm (6 in) from the speaking mouth, a little below the breath, aimed at the mouth — moved there before the answer starts.',
  kind: 'sourced',
  src: 'S-SM58-UG',
  quote: 'Lips less than 15 cm (6 in.) away or touching the wind- screen, on axis (the handheld row of frame V; the B10 lesson L27 gives no number: "close enough to favor the speaker … out of the direct breath blast")',
  bandProv: ill('frame V’s close handheld row (under 15 cm) as a suggested start; 4–15 cm and 0–40° below the axis (out of the breath, leaving comfortable clearance) are the lab’s drawing'),
  distance: { min: 40, max: 150 },
  off: { min: 0, max: 40, toward: 'down', prov: ill('a little below the breath: 0–40° below the mouth’s axis (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: FLAGS,
  mount: 'clip',
  variants: ['sideline', 'twoMics'],
  start: { d: [100, 110, 90, 120, 80, 130], deg: 20, spread: 10, at: 'mouth' },
  tendency: 'The speaker clearly ahead of the crowd and the other voice. Closer adds breath and handling; farther, or left between two people, and the crowd rises with the gain.',
  checks: ['The first syllable after every handoff', 'The flag and the mic clear of faces and the lens', 'Wind, handling noise and a shout’s headroom'],
};

const { variants: _bothSets, ...HAND_ONE } = HAND;
const REP: VoiceZoneSpec = {
  ...HAND_ONE,
  id: 'b10.reporter',
  label: 'The reporter’s own handheld at their mouth',
  band: 'When a handoff is not practical: the reporter keeps their own handheld under about 15 cm from their mouth, a little below the breath — each mic on its own channel, the unused one kept down.',
  variant: 'twoMics',
  tendency: 'Each voice strongest in its own mic, the other voice later and lower in it. Two open mics hear more crowd than one.',
  checks: ['Each channel alone while the other speaks', 'The unused mic kept down', 'A mic dropped from mouth level in the excitement'],
};

const HEADSET: VoiceZoneSpec = {
  id: 'b10.headset',
  label: 'The reporter’s headset boom at the mouth corner',
  band: 'For a regular reporter, an idea to try: a headset boom at the outside corner of their mouth keeps their questions at one distance while they move — and leaves the handheld for the guest.',
  kind: 'sourced',
  src: 'S-SM2',
  quote: 'as close as possible to the outside corner of the mouth (not directly in front.) (the B10 lesson L21: "A well-fitted boom near the mouth can stabilize the reporter’s speech")',
  bandProv: ill('no source gives a distance: 2–6 cm from the lip point, 45–100° to the side, is the lab’s drawing of "the outside corner of the mouth"'),
  distance: { min: 20, max: 60 },
  off: { min: 45, max: 100, toward: 'right', prov: ill('beside the mouth: 45–100° off the axis (the lab’s drawing)') },
  aimTol: 60,
  micTypeIds: ['bcHeadsetBoom', 'bcHeadsetSuper'],
  mount: 'clip',
  variant: 'sideline',
  start: { d: [Math.hypot(HF, HS), 38, 40, 34, 44], deg: (Math.atan2(HS, HF) * 180) / Math.PI, spread: 12, at: 'mouth' },
  tendency: 'The reporter’s questions at one steady distance as they move. It does not hear the guest: the guest still needs a mic.',
  checks: ['Fit, wind and how it looks on camera', 'The cable or pack secured', 'Only the reporter’s mic open while they ask'],
};

const BOOM: VoiceZoneSpec = {
  id: 'b10.boom',
  label: 'A boom above the mark, aimed down at the mouth',
  band: 'At a controlled post-event mark, try a short shotgun on a pole held by an operator, about 0.5–1 m above and in front of the mouth, aimed down at it — outside the frame and inside the approved area.',
  kind: 'trial',
  src: 'LESSON-B10',
  quote: 'An operator places a protected directional mic close above or to the side of the speaking mouth while staying out of frame and outside play (L24)',
  bandProv: ill('no source gives a boom distance here: 0.5–1 m is the trial band of the proposal; the start 70 cm, 45° above the mouth’s axis, is the lab’s drawing'),
  distance: { min: 500, max: 1000 },
  off: { min: 30, max: 80, toward: 'up', prov: ill('from above and a little in front: 30–80° above the mouth’s axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['locBoomSg'],
  mount: 'clip',
  variant: 'postEvent',
  start: { d: [700, 720, 680, 750, 650, 800], deg: 45, spread: 4, at: 'mouth' },
  tendency: 'A natural voice with a little more of the space, nothing on the guest’s body. Farther away, the crowd, the PA and the head turns defeat its narrow pickup.',
  checks: ['Out of the frame as the shot changes', 'Re-aimed as the guest turns', 'The pole’s sweep clear of people, the lens, cables and exits'],
};

/** The body mic on the guest's chest, its start the drawing's place. */
function lavZone(): DocumentedZone {
  const base = voiceZone(B10_MODEL, FRAME_V, {
    id: 'b10.lav',
    label: 'A body mic on a scheduled guest — only with approval',
    band: 'For a scheduled post-event guest, with their and the event’s approval: a body mic at the breastbone, the capsule clear of rubbing fabric, straps, badges and protective gear — here about 21 cm from the lips.',
    kind: 'sourced',
    src: 'SHURE-LAV',
    quote: 'Place the shirt microphone above the sternum (the B10 lesson L17, L31: fit with consent/approval, clear of fabric, straps, badges and protective gear)',
    bandProv: ill('no source gives a distance from the mouth: 15–32 cm is the lab’s band round the drawing’s place'),
    distance: { min: 150, max: 320 },
    off: { min: 55, max: 100, toward: 'down', prov: ill('below the mouth, on the chest: 55–100° below the mouth’s axis (the drawing)') },
    aimTol: 60,
    aimProv: ill('an omni: its aim matters little — pointed up toward the mouth (the lab’s tolerance)'),
    micTypeIds: ['locLav'],
    mount: 'clip',
    variant: 'postEvent',
    start: { d: [Math.hypot(LAV_P.x, LAV_P.y)], deg: (Math.atan2(LAV_P.y, LAV_P.x) * 180) / Math.PI, spread: 2, at: 'mouth' },
    noDraw: true,
    tendency: 'One distance however the shot changes — but it does not turn with the head, and exertion, sweat, wind and a moving jersey show in it.',
    checks: ['Approval first; nothing on regulated gear', 'Rub, sweat and breath after exertion; a walk and a turn', 'The pack, the cable’s strain relief, the radio channel'],
  }, MIC_TYPES);
  return { ...base, start: { p: LAV_P, ...aimOf(sub(LIP, LAV_P)) } };
}

export const B10_ZONES: DocumentedZone[] = [
  voiceZone(B10_MODEL, FRAME_V, HAND, MIC_TYPES),
  voiceZone(B10_MODEL, VR, REP, MIC_TYPES, { surface: IDS_R.surface }),
  voiceZone(B10_MODEL, VR, HEADSET, MIC_TYPES, { surface: IDS_R.surface }),
  lavZone(),
  voiceZone(B10_MODEL, FRAME_V, BOOM, MIC_TYPES),
];
