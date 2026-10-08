/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the suggested starting points
 * (charter §2 layer 1), on the standing wearer (frame V) and frame T. Source
 * keys: docs/labs/miking/commentators/SOURCES.md §0; every distance is from
 * the LIP POINT to the mic's FRONT. Every one of them comes AFTER approval:
 * the lesson's first "position" is the permission, not a place.
 *
 *   b11.lav       an approved chest mic on a coach, at the breastbone (frame
 *                 T: about 21 cm below the lips, a drawing default) — the
 *                 one-mic start;
 *   b11.headset   an approved broadcast headset on a coach, the boom at the
 *                 outside corner of the mouth (S-SM2) — CLOSE · LIVE;
 *   b11.official  an official's announcement headset, the same place,
 *                 routed on purpose to the PA (the feeds step);
 *   b11.athlete   a body mic on an athlete at the APPROVED place only, clear
 *                 of the pads (frame T's keep-outs);
 *   b11.perimeter the fallback when a mount is refused: a short shotgun on a
 *                 pole from outside play, 0.6–1.5 m (TRIAL) — a different,
 *                 farther perspective.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { B11_MODEL, LAV_P } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };
const HF = VOICE_DIMS.headsetFwd.mm;
const HS = VOICE_DIMS.headsetSide.mm;

function lavZone(id: string, variant: string, label: string, band: string, tendency: string, checks: string[]): DocumentedZone {
  const base = voiceZone(B11_MODEL, FRAME_V, {
    id,
    label,
    band,
    kind: 'sourced',
    src: 'SHURE-LAV',
    quote: 'Place the shirt microphone above the sternum (the B11 lesson L12, L24: an approved miniature, the capsule pointed toward useful speech, clear of fabric edges, zips, badges, jewelry, pads and straps)',
    bandProv: ill('no source gives a distance from the mouth: 15–32 cm is the lab’s band round frame T’s breastbone (a drawing default, ~21 cm)'),
    distance: { min: 150, max: 320 },
    off: { min: 55, max: 100, toward: 'down', prov: ill('below the mouth, on the chest: 55–100° below the mouth’s axis (the drawing)') },
    aimTol: 60,
    aimProv: ill('a miniature omni: its aim matters little — pointed up toward the mouth (the lab’s tolerance)'),
    micTypeIds: ['locLav'],
    mount: 'clip',
    variant,
    start: { d: [Math.hypot(LAV_P.x, LAV_P.y)], deg: (Math.atan2(LAV_P.y, LAV_P.x) * 180) / Math.PI, spread: 2, at: 'mouth' },
    noDraw: true,
    tendency,
    checks,
  }, MIC_TYPES);
  return { ...base, start: { p: LAV_P, ...aimOf(sub(LIP, LAV_P)) } };
}

const HEADSET = (id: string, variant: string, label: string, band: string, tendency: string, checks: string[]): VoiceZoneSpec => ({
  id,
  label,
  band,
  kind: 'sourced',
  src: 'S-SM2',
  quote: 'as close as possible to the outside corner of the mouth (not directly in front.) (the B11 lesson L15, L24: a headset boom near the corner of the mouth holds a steadier distance during turns)',
  bandProv: ill('no source gives a distance: 2–6 cm from the lip point, 45–100° to the side, is the lab’s drawing of "the outside corner of the mouth"'),
  distance: { min: 20, max: 60 },
  off: { min: 45, max: 100, toward: 'right', prov: ill('beside the mouth: 45–100° off the axis (the lab’s drawing)') },
  aimTol: 60,
  micTypeIds: ['bcHeadsetBoom', 'bcHeadsetSuper'],
  mount: 'clip',
  variant,
  start: { d: [Math.hypot(HF, HS), 38, 40, 34, 44], deg: (Math.atan2(HS, HF) * 180) / Math.PI, spread: 12, at: 'mouth' },
  tendency,
  checks,
});

const PERIMETER: VoiceZoneSpec = {
  id: 'b11.perimeter',
  label: 'The fallback: a boom from outside play',
  band: 'When a mount is refused or unsafe, an alternative: a short shotgun on a pole from outside play, about 0.6–1.5 m from the mouth, aimed at it — a farther, different perspective, labelled as one.',
  kind: 'trial',
  src: 'LESSON-B11',
  quote: 'Use approved perimeter pickup, camera/boom position outside play, or a post-event handheld interview … label it as an alternative perspective (L21–L22)',
  bandProv: ill('no source gives a distance: 0.6–1.5 m is the lab’s trial band; the start 1 m, 40° above the mouth’s axis, is the drawing'),
  distance: { min: 600, max: 1500 },
  off: { min: 25, max: 70, toward: 'up', prov: ill('from above and a little in front: 25–70° above the mouth’s axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['locBoomSg'],
  mount: 'clip',
  variant: 'coach',
  start: { d: [1000, 950, 1050, 900, 1100, 1200], deg: 40, spread: 6, at: 'mouth' },
  tendency: 'The voice from farther away: more crowd and field, and the tone changes as the coach turns. Useful — but never presented as if it were a close mic.',
  checks: ['The pole outside play and clear of people and sight lines', 'Re-aimed as the coach moves', 'Labelled as an alternative perspective'],
};

export const B11_ZONES: DocumentedZone[] = [
  lavZone(
    'b11.lav',
    'coach',
    'An approved chest mic on the coach, at the breastbone',
    'After our research, here is where we suggest you begin — once it is approved: a miniature at the breastbone, its capsule pointed toward the mouth, clear of fabric edges, zips, badges and straps — here about 21 cm from the lips. Both hands stay with the work.',
    'Voice ahead of much of the crowd, both hands left for the work — but it does not turn with the head, and breath, sweat and cloth show in it.',
    ['Approval first, and who may remove it', 'Rub, breath and the turn of the head', 'The pack retained, the cable’s loop, the antenna straight'],
  ),
  voiceZone(B11_MODEL, FRAME_V, HEADSET('b11.headset', 'coach', 'An approved broadcast headset on the coach', 'An idea to try where it is approved: a broadcast headset boom at the outside corner of the coach’s mouth — a steadier distance as the head turns. Kept separate from the team’s own headset.', 'One steady distance through every turn to the play and the bench. Check breath blasts, sweat, a cap or a visor, and that it is not the team’s own channel.', ['Fit beside the team’s own headset, a cap or a visor', 'Breath blasts and wind', 'Which remarks may enter the program']), MIC_TYPES),
  voiceZone(B11_MODEL, FRAME_V, HEADSET('b11.official', 'official', 'The official’s announcement headset', 'For an official’s public announcements: the event’s approved announcement headset, its boom at the outside corner of the mouth — opened on purpose to the PA, and muted again.', 'A clear announcement to the crowd at one distance. Its open mic hears the PA back: open it only for the announcement.', ['Opened on purpose, muted again', 'The PA against its pattern — never provoke feedback', 'A tested spare and battery']), MIC_TYPES),
  lavZone(
    'b11.athlete',
    'athlete',
    'A body mic on an athlete — at the approved place only',
    'Only where the event, the team and the athlete approve: a miniature at the exact approved place — here the breastbone, clear of the pads — never drilled into, taped to or displacing protective equipment.',
    'Close speech and breathing during play — and impact, rub, sweat and heat. Many sports or positions refuse a mount entirely.',
    ['The equipment reviewer’s and the medical authority’s approval', 'Retention, comfort and snag risk on safe movement', 'A stop condition named: loose pack, displaced pad, heat'],
  ),
  voiceZone(B11_MODEL, FRAME_V, PERIMETER, MIC_TYPES),
];
