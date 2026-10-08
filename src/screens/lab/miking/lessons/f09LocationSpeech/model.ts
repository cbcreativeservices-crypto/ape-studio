/**
 * F09 LOCATION SPEECH — the suggested starting points (charter §2 layer 1),
 * on frame V (lessons/shared/voice) and the location kit
 * (lessons/shared/field/location.ts). Source keys: docs/labs/miking/
 * location_speech/SOURCES.md (and measurement_mics/SOURCES.md §0); every
 * distance is from the LIP POINT to the mic's FRONT (a shotgun's capsule sits
 * behind its slotted tube — said in words, not measured to).
 *
 * SET (indoors, a medium shot)
 *   loc.boom   just above the frame line, aimed at the mouth (RODE-SG
 *              practice "just outside the frame"; the 150 mm clearance and the
 *              45° are drawing defaults) — the worked example;
 *   loc.lav    on the chest just above the sternum (SHURE-LAV) — its
 *              distance read from the drawing (UNKNOWN in the research);
 *   loc.plant  an alternative for the keys: a planted miniature in a prop on
 *              the counter (DPA-PLANT; its place a drawing default);
 *   loc.cam    on the camera — the wider, farther view (DERIVED: the camera's
 *              distance).
 * OUTDOORS: loc.boom.out (the boom in a fur windshield), loc.lav.out,
 *   loc.cam.out — the power line's 3 m keep-out is in the model.
 * LIVE: loc.stage (a handheld within about 10 cm — Lab 5's stage row,
 *   DPA-VOICE), loc.headset (Lab 5's headset row), loc.lav.live.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { headsetRow, stageRow } from '../shared/voice/voiceStarts.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { BOOM, CAMERA_BOX, COUNTER_BOX, F09_MODEL, KEYS, LAV_P } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };

const BOOM_BAND = 'Start as close as the frame allows: the mic just above the top of the shot — here about 60 cm from the lips — aimed down at the mouth. A wider shot pushes it farther away.';
const BOOM_TEND = 'A natural voice with some of the room around it. Closer brings more voice and less room; a wider shot forces it farther away. Its operator turns it with the head as the talker turns.';
const BOOM_CHECKS = ['The top of the frame: no mic, pole or shadow in the shot', 'Head turns: the mic re-aimed with the talker', 'Wind, handling and the pole’s cable — quiet rehearsal'];

/** The boom: a voice zone above the mouth (approached 30–80° above its axis),
 *  aimed at the mouth, its start the location kit's boomStart. */
function boomSpec(id: string, variant: string, micTypeIds: string[]): VoiceZoneSpec {
  return {
    id,
    label: 'Just above the frame line, aimed at the mouth',
    band: BOOM_BAND,
    kind: 'trial',
    src: 'RODE-SG',
    quote: 'a directional mic "just outside the frame", aimed at the talker (the lesson L12, L29; RODE-SG not re-read: PRACTICE)',
    bandProv: ill('no source gives a boom distance: 35–120 cm is the lab’s band; the start is 15 cm above a medium shot’s top edge, 45° above the mouth’s axis (location.boomStart; drawing defaults)'),
    distance: { min: 350, max: 1200 },
    off: { min: 30, max: 80, toward: 'up', prov: ill('from above and a little in front: 30–80° above the mouth’s axis (the lab’s drawing)') },
    aimTol: 15,
    micTypeIds,
    variant,
    start: { d: [BOOM.d, BOOM.d + 10, BOOM.d + 20, BOOM.d + 40], deg: 45, spread: 2, at: 'mouth' },
    tendency: BOOM_TEND,
    checks: BOOM_CHECKS,
  };
}

/** The body mic on the chest, its start the drawing's place above the sternum. */
function lavZone(id: string, variant: string, alternative: boolean): DocumentedZone {
  const base = voiceZone(F09_MODEL, FRAME_V, {
    id,
    label: alternative ? 'A body mic on the chest — an alternative for a presenter who moves' : 'On the chest, just above the breastbone',
    band: 'With the wearer’s agreement, clip it to the clothing just above the breastbone, the capsule clear of fabric that rubs — here about 21 cm from the lips. Route and secure the cable with a small loop.',
    kind: 'sourced',
    src: 'SHURE-LAV',
    quote: 'Place the shirt microphone above the sternum',
    bandProv: ill('no source gives a distance from the mouth: 15–32 cm is the lab’s band round the drawing’s place (21 cm)'),
    distance: { min: 150, max: 320 },
    off: { min: 55, max: 100, toward: 'down', prov: ill('below the mouth, on the chest: 55–100° below the mouth’s axis (the drawing)') },
    aimTol: 60,
    aimProv: ill('an omni: its aim matters little — pointed up toward the mouth (the lab’s tolerance)'),
    micTypeIds: ['locLav'],
    mount: 'clip',
    variant,
    start: { d: [Math.hypot(LAV_P.x, LAV_P.y)], deg: (Math.atan2(LAV_P.y, LAV_P.x) * 180) / Math.PI, spread: 2, at: 'mouth' },
    noDraw: true,
    tendency: 'One steady distance from the mouth however wide the shot — but a chest-heavy tone, the clothes and the breath can show, and it does not turn with the head.',
    checks: ['Speech, a turn, sitting and fabric movement at performance pace', 'Rubbing, muffling, jewellery and breath', 'The bodypack, the cable loop and the radio link secure'],
  }, MIC_TYPES);
  // The start is the drawing's own place on the chest (aimed at the mouth).
  return { ...base, start: { p: LAV_P, ...aimOf(sub(LIP, LAV_P)) } };
}

/** A surface-mounted mic's start: its front on the part's top, aimed −x. */
const flat = (p: Vec3) => ({ p, az: 0, el: 0 });

export const F09_ZONES: DocumentedZone[] = [
  /* ── SET ── */
  voiceZone(F09_MODEL, FRAME_V, boomSpec('loc.boom', 'set', ['locBoomSg', 'locBoomHyper']), MIC_TYPES),
  lavZone('loc.lav', 'set', false),
  {
    id: 'loc.plant',
    label: 'In a prop on the counter, aimed across the keys',
    band: 'An alternative for the action: a small mic hidden behind a prop on the counter, about 20–40 cm from the keys, aimed across them toward the talker — approved, out of sight of the camera, out of reach of hands.',
    kind: 'sourced',
    src: 'DPA-PLANT',
    quote: 'A small microphone for hiding in a fixed place on set',
    bandProv: ill('no source gives a distance: 15–45 cm from the keys is the lab’s band; the prop and its place are drawing defaults'),
    refSurface: 'keys',
    side: 'either',
    distance: { min: 150, max: 450 },
    aim: { maxOffAxis: 25, prov: ill('aimed at the keys within 25° (the lab’s tolerance)') },
    requires: { variant: 'set', micTypeIds: ['locPlant'], mount: 'surface' },
    start: flat({ x: 700, y: COUNTER_BOX.min.y - 12, z: KEYS.z }),
    tendency: 'The action itself, close and clear, on its own channel — with some of the counter’s vibration. It covers one place: when the action moves, it does not.',
    checks: ['The whole blocking: does the action stay in its place?', 'Vibration through the counter', 'Out of sight of the camera and out of reach of hands'],
  },
  {
    id: 'loc.cam',
    label: 'On the camera — a wider view of the room',
    band: 'For a reference track or a quick shot: a short shotgun on the camera, aimed at the talker — as far away as the camera is, about 2.4 m here.',
    kind: 'trial',
    src: 'LESSON-F09',
    quote: 'Use a secured on-camera mic for guide sound … directionality alone does not compensate for a distant camera (L24–L25)',
    bandProv: ill('DERIVED: the camera’s distance (a drawing default, 2.5 m to the lens)'),
    refSurface: 'mouth',
    side: 'either',
    distance: { min: 2200, max: 2700 },
    aim: { maxOffAxis: 20, prov: ill('aimed at the talker within 20° (the lab’s tolerance)') },
    requires: { variant: 'set', micTypeIds: ['locCam'], mount: 'surface' },
    start: flat({ x: CAMERA_BOX.min.x + 20, y: CAMERA_BOX.min.y - 20, z: 0 }),
    tendency: 'The voice from where the camera stands: much more of the room and the noise, and the voice weaker against them. Directional pickup does not make up for the distance.',
    checks: ['Intelligibility against the boom or the lav', 'Camera motors, handling and the operator’s own voice', 'The level: never raise gain instead of moving a mic closer'],
  },
  /* ── OUTDOORS ── */
  voiceZone(F09_MODEL, FRAME_V, { ...boomSpec('loc.boom.out', 'outdoor', ['locBoomFur']), checks: ['The power line: at least 3 m (10 ft) from the pole and the mic', 'Wind on the fur; rain is not kept out', 'The top of the frame and the head turns'] }, MIC_TYPES),
  lavZone('loc.lav.out', 'outdoor', false),
  {
    id: 'loc.cam.out',
    label: 'On the camera — a wider view of the place',
    band: 'For a reference track: a short shotgun on the camera, aimed at the talker — about 2.4 m away, with all of the wind and the street between.',
    kind: 'trial',
    src: 'LESSON-F09',
    quote: 'Use a secured on-camera mic for guide sound … directionality alone does not compensate for a distant camera (L24–L25)',
    bandProv: ill('DERIVED: the camera’s distance (a drawing default)'),
    refSurface: 'mouth',
    side: 'either',
    distance: { min: 2200, max: 2700 },
    aim: { maxOffAxis: 20, prov: ill('aimed at the talker within 20° (the lab’s tolerance)') },
    requires: { variant: 'outdoor', micTypeIds: ['locCam'], mount: 'surface' },
    start: flat({ x: CAMERA_BOX.min.x + 20, y: CAMERA_BOX.min.y - 20, z: 0 }),
    tendency: 'The voice from the camera’s place: the wind, the traffic and the space far louder against it. A reference, not the main voice.',
    checks: ['Wind noise with no fur on it', 'Intelligibility against the boom or the lav', 'Camera handling and motors'],
  },
  /* ── LIVE ── */
  voiceZone(F09_MODEL, FRAME_V, stageRow({ id: 'loc.stage', variant: 'live', micTypeIds: ['vocDynCard', 'vocDynSuper'], label: 'A handheld close, within about 10 cm', band: 'For a presenter on a stage, try the handheld within about 10 cm (4 in) of the lips, at a steady angle and distance — close enough to stay ahead of the PA and the room.', tendency: 'A strong, steady voice over the PA and the room — and the most gain before feedback. The level changes if the hand drifts: coach one steady place.', checks: ['A steady distance and angle as the presenter moves', 'Plosives and handling noise', 'Where the wedge sits against the pattern'] }), MIC_TYPES),
  voiceZone(F09_MODEL, FRAME_V, headsetRow({ id: 'loc.headset', variant: 'live', micTypeIds: ['vocHeadset'], tendency: 'One steady distance however the presenter moves and turns, with both hands left for the talk. Off to the side of the mouth it hears a little less of the voice’s highs.', checks: ['The capsule where its maker says, out of the breath', 'The windscreen on; sweat and makeup', 'The bodypack and cable secured'] }), MIC_TYPES),
  lavZone('loc.lav.live', 'live', true),
];
