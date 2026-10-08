/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the recommended starting points
 * (charter §2 layer 1), on frame V (the talker), the camera frame and the
 * boom (shared/broadcast/cameraFrame.ts, boomPole.ts). Source keys: docs/
 * labs/miking/boom_camera/SOURCES.md and the Lab 7a register (radio_host/
 * SOURCES.md §0); every distance is from the LIP POINT to the mic's FRONT.
 * No source gives a boom distance: each boom start is DERIVED from the frame
 * — the nearest place on its line 15 cm outside the widest frame, aimed at
 * the mouth (the lesson L12: "the closest safe microphone position allowed
 * by those constraints").
 *
 *   b4.above     above the frame and a little in front (R-BOOM "boom from
 *                above") — the worked example (close, live);
 *   b4.compact   a compact hypercardioid in the same place (the lesson L23–
 *                L24: compare in the actual room);
 *   b4.below     below the frame, aimed up (R-BOOM "or below if absolutely
 *                necessary");
 *   b4.side      beside the frame, a conditional start (S-SHOTGUN "slightly
 *                … to the side"; R-BOOM disagrees — shown with its tendency);
 *   b4.cam       the camera's own mic, at the camera's distance (DERIVED);
 *   b4.lav       a lav on the sternum: the safety track (the body-worn family);
 *   b4.above.wide, b4.cam.wide   the same in the wide shot.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { LAV_BAND } from '../shared/broadcast/bodyWorn.ts';
import { B04_MODEL, BOOM_ABOVE, BOOM_BELOW, BOOM_SIDE, BOOM_WIDE, CAMMIC_CLOSE, CAMMIC_WIDE, LAV } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };
const cm = (mm: number) => Math.round(mm / 10);

/** A zone whose start is a DERIVED place (the frame edge): the voice zone's
 *  own search only has to find it clear; the start is then that place,
 *  aimed at the mouth. */
function atPlace(spec: VoiceZoneSpec, p: Vec3): DocumentedZone {
  const base = voiceZone(B04_MODEL, FRAME_V, spec, MIC_TYPES);
  return { ...base, start: { p, ...aimOf(sub(LIP, p)) } };
}
const BOOM_PROV = ill('no source gives a boom distance: 35–120 cm is the lab’s band; each start is DERIVED — the tip 15 cm outside the widest frame on its line, aimed at the mouth, read to the capsule 20 cm behind it (owner 2026-10-08) (cameraFrame.boomOutside; the angles are the lab’s drawing)');
const near = (d: number) => [d, d + 40, d + 80, d + 150, d + 250, d + 350];

const ABOVE: VoiceZoneSpec = {
  id: 'b4.above',
  label: 'Above the frame, aimed at the mouth',
  band: `After our research, here is where we recommend you begin: as close as the picture allows — the mic just above the top of the widest frame and a little in front, about 15 cm clear of its edge, aimed down at the mouth. In this close shot its capsule is about ${cm(BOOM_ABOVE.d)} cm from the lips.`,
  kind: 'sourced',
  src: 'R-BOOM',
  quote: 'boom from above, or below if absolutely necessary',
  bandProv: BOOM_PROV,
  distance: { min: 350, max: 1200 },
  off: { min: 30, max: 80, toward: 'up', prov: ill('above the mouth and a little in front: 30–80° above its axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['locBoomSgCap', 'locBoomHyper'],
  mount: 'clip',
  variants: ['close', 'live'],
  start: { d: near(BOOM_ABOVE.d), deg: 45, spread: 12, at: 'mouth' },
  tendency: 'A natural voice with some of the room, no clothing noise — and it needs re-aiming as the talker turns. A wider shot pushes it farther away: more room against the voice.',
  checks: ['The top of every frame: no mic, pole or shadow in the picture', 'Head turns: the mic re-aimed with the talker', 'What its axis points at past the talker: a hard floor, a window'],
};

const COMPACT: VoiceZoneSpec = {
  ...ABOVE,
  id: 'b4.compact',
  label: 'A compact hypercardioid in the same place',
  band: 'Indoors, among reflections, an idea to try: a compact hypercardioid at the same place above the frame, aimed at the mouth — compare it with the shotgun in this room.',
  kind: 'trial',
  src: 'LESSON-B04',
  quote: 'Inside a reflective room, compare a short shotgun with a compact cardioid, supercardioid or hypercardioid mic at similarly usable positions (L23; PRACTICE)',
  micTypeIds: ['locBoomHyper'],
  variants: undefined,
  variant: 'close',
  tendency: 'Often smoother off its axis than a shotgun among reflections — neither type is best everywhere, and the pattern does not replace closeness.',
  checks: ['The same place, the same talker, matched loudness', 'Reflected speech and the room behind the talker', 'Its rear lobe against a loud source or a PA'],
};

const BELOW: VoiceZoneSpec = {
  id: 'b4.below',
  label: 'Below the frame, aimed up at the mouth',
  band: `When the top of the picture, the light or the set blocks overhead, an idea to try: the mic below the bottom of the frame, about 15 cm clear of it, aimed up at the mouth — here its capsule about ${cm(BOOM_BELOW.d)} cm away.`,
  kind: 'sourced',
  src: 'R-BOOM',
  quote: 'boom from above, or below if absolutely necessary',
  bandProv: BOOM_PROV,
  distance: { min: 350, max: 1200 },
  off: { min: 30, max: 80, toward: 'down', prov: ill('below the mouth and a little in front: 30–80° below its axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['locBoomSgCap', 'locBoomHyper'],
  mount: 'clip',
  variant: 'close',
  start: { d: near(BOOM_BELOW.d), deg: 45, spread: 12, at: 'mouth' },
  tendency: 'A different perspective from overhead — more chest and more of the floor’s reflection, and the hands and the clothes nearer. Do not expect it to match the overhead sound.',
  checks: ['The bottom of every frame', 'Footsteps, hands, clothing and a desk or the floor', 'The operator’s clearance and a safe stance'],
};

const SIDE: VoiceZoneSpec = {
  id: 'b4.side',
  label: 'Beside the frame — a conditional start',
  band: `Only when the shot and the blocking leave no better place: beside the frame at about mouth height, about 15 cm clear of its edge, aimed at the mouth — here its capsule about ${cm(BOOM_SIDE.d)} cm away. Audition it; do not assume it.`,
  kind: 'sourced',
  src: 'S-SHOTGUN',
  quote: 'slightly above, below, or to the side of the sound source',
  bandProv: BOOM_PROV,
  distance: { min: 350, max: 1300 },
  off: { min: 50, max: 100, toward: 'left', prov: ill('beside the mouth on the operator’s side: 50–100° off its axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['locBoomSgCap', 'locBoomHyper'],
  mount: 'clip',
  variant: 'close',
  start: { d: near(BOOM_SIDE.d), deg: 70, spread: 12, at: 'mouth' },
  tendency: 'It can hear more of the room around at head height, and a turn away from it loses the voice fast. Sometimes the only place the picture allows.',
  checks: ['A turn toward it and away from it', 'What lies behind the talker along its axis', 'The edge of the frame on that side'],
};

const LAVZ: VoiceZoneSpec = {
  id: 'b4.lav',
  label: 'A lav on the chest — a safety track to compare',
  band: 'For a safety track, with the talker’s agreement: a lav clipped over the middle of the chest, about 12–25 cm from the lips, on its own channel — compared with the boom, never summed with it by default.',
  kind: 'sourced',
  src: LAV_BAND.src,
  quote: LAV_BAND.quote,
  bandProv: ill('D-LAV1: 12.5–25 cm, one union band (the body-worn family); the mount point is the shared figure’s'),
  distance: { min: LAV_BAND.min, max: LAV_BAND.max },
  off: { min: 55, max: 100, toward: 'down', prov: ill('on the chest, below the mouth: 55–100° below its axis (the drawing)') },
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  start: { d: [Math.hypot(LAV.at.x, LAV.at.y)], deg: 85, spread: 2, at: 'mouth' },
  noDraw: true,
  tendency: 'A closer, drier voice from below the chin, with the clothes — a different perspective from the boom. Kept on its own track, it is a fallback; summed with the boom, the two arrival times comb.',
  checks: ['Each track alone, then any sum in mono', 'Rubbing and the cable', 'Which one the program uses'],
};

/** The camera's own mic: on the shoe, at the camera's distance. */
function camZone(id: string, label: string, variant: 'close' | 'wide' | 'live', variants: string[] | null, p: Vec3, words: string): DocumentedZone {
  const d = Math.hypot(p.x, p.y, p.z);
  return {
    id,
    label,
    band: words,
    kind: 'trial',
    src: 'LESSON-B04',
    quote: 'Use the camera mic for close self-presentation, nearby environmental perspective, a run-and-gun fallback or a guide track when it yields an acceptable result (L41; PRACTICE)',
    bandProv: ill('DERIVED: the camera’s distance (a drawing default) — the mic sits on its shoe'),
    refSurface: 'mouth',
    side: 'either',
    distance: { min: Math.floor((d - 300) / 100) * 100, max: Math.ceil((d + 300) / 100) * 100 },
    aim: { maxOffAxis: 15, prov: ill('aimed at the talker within 15° (the lab’s tolerance)') },
    requires: { ...(variants ? { variants } : { variant }), micTypeIds: ['camMic'], mount: 'clip' },
    start: { p, ...aimOf(sub(LIP, p)) },
    tendency: 'The voice from where the camera stands: far more of the room and the noise, and the voice weaker against them. Pointing it does not bring the voice closer — moving the camera back takes the mic back too.',
    checks: ['Intelligibility against the boom at matched loudness', 'Camera motors, the zoom, the operator’s hands', 'The camera’s automatic gain: set it by hand where you can'],
  };
}

export const B04_ZONES: DocumentedZone[] = [
  atPlace(ABOVE, BOOM_ABOVE.p),
  // A compact hypercardioid has no tube: its front sits where the shotgun’s tip does.
  atPlace(COMPACT, BOOM_ABOVE.tip),
  atPlace(BELOW, BOOM_BELOW.p),
  atPlace(SIDE, BOOM_SIDE.p),
  camZone('b4.cam', 'On the camera — as far away as the camera is', 'close', ['close', 'live'], CAMMIC_CLOSE.p, `For a reference or a backup track: a short shotgun on the camera’s shoe, aimed at the talker — about ${(Math.hypot(CAMMIC_CLOSE.p.x, CAMMIC_CLOSE.p.y) / 1000).toFixed(1)} m from the lips here; move the camera back and it goes back too.`),
  atPlace(LAVZ, LAV.at),
  atPlace({ ...ABOVE, id: 'b4.above.wide', label: 'Above the wider frame, aimed at the mouth', band: `In the wide shot the frame’s top is higher: as close as it allows, the mic about 15 cm above it and a little in front, aimed at the mouth — its capsule about ${cm(BOOM_WIDE.d)} cm from the lips, farther than in the close shot.`, variants: undefined, variant: 'wide', start: { d: near(BOOM_WIDE.d), deg: 45, spread: 12, at: 'mouth' } }, BOOM_WIDE.p),
  camZone('b4.cam.wide', 'On the camera, moved back for the wide shot', 'wide', null, CAMMIC_WIDE.p, `The camera moved back for the wide shot, and its mic went with it — about ${(Math.hypot(CAMMIC_WIDE.p.x, CAMMIC_WIDE.p.y) / 1000).toFixed(1)} m from the lips now: more room and noise against the voice than before.`),
];
