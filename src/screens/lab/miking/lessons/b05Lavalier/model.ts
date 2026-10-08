/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the recommended starting
 * points (charter §2 layer 1), on frame V (the presenter) and the body-worn
 * family (shared/broadcast/bodyWorn.ts). Source keys: docs/labs/miking/
 * lavalier_headset/SOURCES.md and the Lab 7a register (radio_host/SOURCES.md
 * §0); every distance is from the LIP POINT to the mic's FRONT.
 *
 *   b5.sternum    a visible omni lav on the sternum, 12.5–25 cm from the lips
 *                 (D-LAV1: one union band — R-LAV's sternum, SN-ME2's 25 cm,
 *                 S-PASTOR's 12–20 cm below the mouth, S-CHURCH's ~20 cm;
 *                 correction B05-1: the 5–8 in figure is S-PASTOR's, not the
 *                 lav-choice article's) — the worked example in the studio;
 *   b5.lapel      the same lav on a lapel, off to one side (proposal §2);
 *   b5.concealed  the same place under one layer of the shirt (the lesson
 *                 L18–L22: conceal only after a visible place works);
 *   b5.lavCard    a directional lav at the sternum, aimed at the mouth;
 *   b5.headset    an omni headset 2–3 cm from the corner of the mouth (SN-ME3,
 *                 D-HS1 — "follow the headset maker") — the worked example
 *                 live;
 *   b5.hsCard     a directional headset in the same place (live);
 *   b5.lectern    the lectern's own gooseneck, 25–36 cm (10–14 in), a little
 *                 off the mouth (S-CHURCH, after B06-1) — the second mic of
 *                 the live pair: mute one.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { headsetRow } from '../shared/voice/voiceStarts.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { HEADSET_BAND, LAV_BAND, type BodyMount } from '../shared/broadcast/bodyWorn.ts';
import { B05_MODEL, HEADSET, LAPEL, STERNUM } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };

const LAV_OFF = { min: 55, max: 100, toward: 'down' as const, prov: ill('on the chest, below the mouth: 55–100° below the mouth’s axis (the drawing’s mount points)') };
const LAV_BAND_PROV = ill('D-LAV1: 12.5–25 cm is the union of the device and task examples (a starting range, never a rule); the mount points are the shared figure’s (bodyWorn.ts, drawing defaults)');

/** A chest lav: a voice zone below the mouth, its start the mount point
 *  itself, aimed at the mouth. */
function chestZone(spec: Omit<VoiceZoneSpec, 'distance' | 'off' | 'start' | 'kind' | 'src' | 'quote'> & { mount: 'clip'; at: BodyMount; noDraw?: boolean }): DocumentedZone {
  const { at, ...rest } = spec;
  const base = voiceZone(B05_MODEL, FRAME_V, { ...rest, kind: 'sourced', src: LAV_BAND.src, quote: LAV_BAND.quote, bandProv: LAV_BAND_PROV, distance: { min: LAV_BAND.min, max: LAV_BAND.max }, off: LAV_OFF, start: { d: [Math.hypot(at.at.x, at.at.y, at.at.z)], deg: 85, spread: 2, at: 'mouth' } }, MIC_TYPES);
  return { ...base, start: { p: at.at, ...aimOf(sub(LIP, at.at)) } };
}

const STERNUM_Z = chestZone({
  id: 'b5.sternum',
  label: 'On the sternum, in the centre',
  band: 'After our research, here is where we recommend you begin: with the wearer’s agreement, a small omni lav clipped to a firm clothing edge over the middle of the chest — about 12–25 cm (5–10 in) from the lips — the capsule clear of rubbing fabric, hair and jewellery.',
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little — pointed up toward the mouth (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  at: STERNUM,
  tendency: 'A steady, natural voice at one distance from the mouth, however wide the shot — a little chest-heavy, and quieter when the head turns or reads down. It hears clothing and cable taps.',
  checks: ['Turns both ways, reading down, sitting and standing', 'Rubbing, a tie, a necklace or hair on the capsule', 'The broadcast loop and the cable secured lower down'],
});

const LAPEL_Z = chestZone({
  id: 'b5.lapel',
  label: 'On a lapel, off to one side',
  band: 'An alternative when the shot or the garment calls for it: the same lav on a lapel edge, about 12–25 cm from the lips, a hand’s width off the middle — rehearse turns both ways.',
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  variant: 'studio',
  noDraw: true,
  at: LAPEL,
  tendency: 'Tidy for the picture, but off the middle: turning toward the lapel and away from it sound different — the far turn is quieter and duller.',
  checks: ['A turn toward the lapel and a turn away', 'The lapel flapping or rubbing on the capsule', 'The cable under the jacket, not across the shirt'],
});

const CONCEALED_Z = chestZone({
  id: 'b5.concealed',
  label: 'Hidden under the shirt, on the sternum',
  band: 'Only after a visible place works: the same lav at the same place under one layer of the shirt, in a concealer made for it, with the wearer’s agreement and wardrobe’s approval — an opening kept for the sound.',
  aimTol: 60,
  aimProv: ill('an omni under one fabric layer: its aim matters little (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  variant: 'studio',
  noDraw: true,
  at: STERNUM,
  tendency: 'Invisible in the picture — but the cloth over it can dull the top end and rub as the wearer moves, even when the voice seems loud enough. Compare it with the visible place at matched loudness.',
  checks: ['The visible place first, then the hidden one, at matched loudness', 'Scratching and rubbing through the whole movement', 'The concealer and the tape: nothing over the opening'],
});

const LAVCARD_Z = chestZone({
  id: 'b5.lavCard',
  label: 'A directional lav on the sternum, aimed at the mouth',
  band: 'A directional lav at the same place, its sensitive end turned up toward the mouth — check its pattern and its clip, and how it sounds with the head turned.',
  aimTol: 20,
  aimProv: ill('a directional miniature: aimed at the mouth within 20° (the lab’s tolerance)'),
  micTypeIds: ['lavCard'],
  mount: 'clip',
  variant: 'studio',
  noDraw: true,
  at: STERNUM,
  tendency: 'A little less of the room when it is aimed well — and more change when the head turns off its axis, with more care needed for breath, wind and fabric.',
  checks: ['Its sensitive end really aimed at the mouth', 'Head turns: how fast the voice dulls', 'Breath and rubbing on the capsule'],
});

const HS_BAND = 'Place the headset as its maker says — its capsule beside the corner of the mouth, about 2–3 cm (1 in) from it, out of the breath, off the cheek.';
const HS_PROV = ill('HEADSET_BAND: 2–3 cm from the mouth’s corner (one headset’s own guide, D-HS1); from the lip point that is about 3–6 cm, 45–100° to the side — the lab’s drawing');

const HEADSET_Z: VoiceZoneSpec = {
  ...headsetRow({ id: 'b5.headset', micTypeIds: ['vocHeadset'], start: { d: [Math.hypot(HEADSET.at.x, HEADSET.at.z), 38, 40, 34], deg: (Math.atan2(HEADSET.at.z, HEADSET.at.x) * 180) / Math.PI, spread: 12, at: 'mouth' } }),
  label: 'A headset by the corner of the mouth',
  band: HS_BAND,
  src: HEADSET_BAND.src,
  quote: HEADSET_BAND.quote,
  bandProv: HS_PROV,
  distance: { min: 25, max: 60 },
  tendency: 'One steady distance from the mouth however the presenter turns and moves — the most voice against the room and the PA. Beside the mouth it hears a little less of the highs than a mic in front; it still hears the room.',
  checks: ['The capsule where its maker says, out of the breath', 'Smiling, glasses, earrings, a beard or hair against it', 'The headband secure and comfortable'],
};

const HSCARD_Z: VoiceZoneSpec = {
  ...HEADSET_Z,
  id: 'b5.hsCard',
  label: 'A directional headset, aimed at the mouth',
  band: 'A directional headset in the same place, aimed at the mouth as its maker says — then check where its rear points against the PA and the monitors.',
  aimTol: 30,
  aimProv: ill('a directional headset: aimed at the mouth within 30° (the lab’s tolerance)'),
  micTypeIds: ['hsCard'],
  variant: 'live',
  tendency: 'More of the voice against the room and the PA when its rear faces them — but a small shift of the boom, breath and the proximity effect change the tone more than with an omni.',
  checks: ['Its rear toward the PA and the monitors', 'Small shifts of the boom as the presenter moves', 'Breath on the loudest words'],
};

const LECTERN_Z: VoiceZoneSpec = {
  id: 'b5.lectern',
  label: 'The lectern gooseneck, about 25–36 cm, a little off the mouth',
  band: 'At the lectern, its own gooseneck’s capsule about 25–36 cm (10–14 in) from the lips, a little off the mouth’s line and below it — muted whenever the headset or the lav is live.',
  kind: 'sourced',
  src: 'S-CHURCH',
  quote: '10"-14" and a little off-center from a speaker\'s mouth (lectern; correction B06-1)',
  bandProv: ill('below and a little off the mouth’s axis: 10–35° (the lab’s drawing, as B06)'),
  distance: { min: 254, max: 355.6 },
  off: { min: 10, max: 35, toward: 'down', prov: ill('below and a little off the mouth’s axis: 10–35° (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: ['bcGoose', 'bcGooseSuper'],
  mount: 'clip',
  variant: 'live',
  start: { d: [300, 290, 310, 280, 320], deg: 25, at: 'mouth' },
  tendency: 'A clear voice while the presenter stands at the lectern — and a second copy of the same voice, a little later, if it stays open while the headset is live.',
  checks: ['Who mutes it when the headset is live', 'The paper and the sight line clear', 'The presenter stepping back from it'],
};

export const B05_ZONES: DocumentedZone[] = [
  STERNUM_Z,
  LAPEL_Z,
  CONCEALED_Z,
  LAVCARD_Z,
  voiceZone(B05_MODEL, FRAME_V, HEADSET_Z, MIC_TYPES),
  voiceZone(B05_MODEL, FRAME_V, HSCARD_Z, MIC_TYPES),
  voiceZone(B05_MODEL, FRAME_V, LECTERN_Z, MIC_TYPES),
];
