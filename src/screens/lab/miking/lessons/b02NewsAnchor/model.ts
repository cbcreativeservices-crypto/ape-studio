/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the suggested starting points
 * (charter §2 layer 1), on the seated anchor (frame V) and the guest, the
 * body-worn family, the camera frame and the fixed boom (shared/broadcast).
 * Source keys: docs/labs/miking/news_anchor/SOURCES.md and the Lab 7a
 * register (radio_host/SOURCES.md §0); every distance is from the LIP POINT
 * to the mic's FRONT (a short shotgun's: its capsule, behind the tube).
 *
 *   b2.lav        a visible omni lav on the anchor's sternum, 12.5–25 cm
 *                 (D-LAV1: SN-ME2 25 cm, R-LAV's sternum, S-PASTOR, S-CHURCH —
 *                 one union band) — the worked example;
 *   b2.concealed  the same place under one layer of the shirt (the lesson L11:
 *                 "conceal only after the visible position works");
 *   b2.boom       a fixed boom just above the widest frame, aimed at the
 *                 mouth (R-BOOM; the distance DERIVED from the frame) — the
 *                 program mic of the lav + boom pair;
 *   b2.boom.two   the same in the two-shot (farther);
 *   b2.goose      a gooseneck on the desk, its capsule raised toward the mouth
 *                 (the lesson L23; 20–30 cm the panels lesson's drawing
 *                 default) — the live start;
 *   b2.boundary   a purpose-built boundary mic on the desk toward the anchor
 *                 (the lesson L25; the half-cardioid plate of Lab 1);
 *   b2.guestLav   the guest's own lav, on their own channel.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { LAV_BAND } from '../shared/broadcast/bodyWorn.ts';
import { talkerAnchor } from '../shared/broadcast/talkerPose.ts';
import { ANCHOR, B02_MODEL, BOOM_CLOSE, BOOM_TWO, BOUNDARY_AT, DESK, GUEST, IDS_G, LAV_A, LAV_G_AT } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cm = (mm: number) => Math.round(mm / 10);
const VA = talkerAnchor(ANCHOR);
const VG = talkerAnchor(GUEST);

/** A zone whose start is a named place (a mount point, a DERIVED boom
 *  start), aimed at `toward`. */
function atPlace(spec: VoiceZoneSpec, p: Vec3, opts: { V?: typeof VA; surface?: string; toward?: Vec3 } = {}): DocumentedZone {
  const base = voiceZone(B02_MODEL, opts.V ?? VA, spec, MIC_TYPES, opts.surface ? { surface: opts.surface } : {});
  return { ...base, start: { p, ...aimOf(sub(opts.toward ?? (opts.V ?? VA).lip, p)) } };
}
const LAV_PROV = ill('D-LAV1: 12.5–25 cm, one union band (the body-worn family); the mount point is the shared figure’s');
const lavSpec = (id: string, label: string, band: string, tendency: string, checks: string[], variants?: string[]): VoiceZoneSpec => ({
  id,
  label,
  band,
  kind: 'sourced',
  src: LAV_BAND.src,
  quote: LAV_BAND.quote,
  bandProv: LAV_PROV,
  distance: { min: LAV_BAND.min, max: LAV_BAND.max },
  off: { min: 55, max: 100, toward: 'down', prov: ill('on the chest, below the mouth: 55–100° below its axis (the drawing)') },
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  ...(variants ? { variants } : {}),
  start: { d: [Math.hypot(LAV_A.at.x, LAV_A.at.y)], deg: 85, spread: 2, at: 'mouth' },
  noDraw: id !== 'b2.lav',
  tendency,
  checks,
});

const BOOM_PROV = ill('no source gives a boom distance: 35–120 cm is the lab’s band; the start is DERIVED — the tube’s tip 15 cm outside the widest frame on a line 45° up and 20° toward the anchor’s left, the capsule the tube’s length behind it (cameraFrame.boomOutside)');
const boomSpec = (id: string, variants: string[], d: number, band: string): VoiceZoneSpec => ({
  id,
  label: variants.includes('close') ? 'A fixed boom just above the frame' : 'A fixed boom above the wider frame',
  band,
  kind: 'sourced',
  src: 'R-BOOM',
  quote: 'boom from above, or below if absolutely necessary',
  bandProv: BOOM_PROV,
  distance: { min: 350, max: 1200 },
  off: { min: 30, max: 80, toward: 'up', prov: ill('above the mouth and a little in front: 30–80° above its axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['shotgunShort', 'compactHyper'],
  variants,
  start: { d: [d, d + 40, d + 80, d + 150, d + 250, d + 350], deg: 45, spread: 12, at: 'mouth' },
  tendency: 'The anchor’s voice from above, with no clothing noise and some of the room — the program’s natural perspective. A lean back or a swivel leaves it; the guest is off its axis.',
  checks: ['The widest frame and every camera: no mic, arm or shadow in the picture', 'A lean back and a turn to the guest', 'The stand and its arm rigged and secured before anyone sits'],
});

const GOOSE: VoiceZoneSpec = {
  id: 'b2.goose',
  label: 'A gooseneck on the desk, raised toward the mouth',
  band: 'An idea to try where the picture allows a desk mic: a gooseneck from a weighted base on the desk, its capsule raised to about 20–30 cm (8–12 in) from the lips, a little below the mouth’s line, aimed at it — the base away from the papers.',
  kind: 'trial',
  src: 'LESSON-B02',
  quote: 'Aim the capsule at the talker and raise it above the table enough to be closer to the mouth, while checking the shot (L23; PRACTICE)',
  bandProv: ill('no source gives a distance: 20–30 cm is the panels lesson’s drawing default (25 cm); 10–35° below the mouth’s axis is the lab’s drawing'),
  distance: { min: 200, max: 300 },
  off: { min: 10, max: 35, toward: 'down', prov: ill('a little below the mouth’s line: 10–35° below its axis (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: ['bcGoose', 'bcGooseSuper'],
  mount: 'clip',
  start: { d: [250, 240, 260, 230, 270], deg: 20, at: 'mouth' },
  tendency: 'Closer to the mouth than a mic on the desk, and away from the desk’s activity — but visible, and the anchor may turn or lean out of its axis. Its raised capsule hears the desk’s bounce.',
  checks: ['The shot: is the hardware acceptable?', 'Taps, paper and typing through the base', 'A turn to the guest and a lean back'],
};

export const B02_ZONES: DocumentedZone[] = [
  atPlace(lavSpec('b2.lav', 'On the anchor’s sternum, in the centre', 'After our research, here is where we suggest you begin: with the anchor’s agreement, a small omni lav on a firm clothing edge over the middle of the chest — about 12–25 cm (5–10 in) from the lips — clear of hair, jewellery and the jacket’s movement.', 'One steady distance however the camera frames them, a natural voice from below the chin — quieter when the head turns or reads down, and it hears the clothes.', ['Facing the camera, turning to the guest, reading down', 'Rubbing, the tie, the jacket, the earpiece cable', 'The broadcast loop and the cable secured lower down']), LAV_A.at),
  atPlace(lavSpec('b2.concealed', 'Hidden under the shirt, on the sternum', 'Only after the visible place works: the same lav under one layer of the shirt, in a concealer made for it, with the anchor’s agreement and wardrobe’s — an opening kept for the sound.', 'Invisible in any shot — but the cloth over it can dull the top end and rub. Compare it with the visible place at matched loudness; keep the visible lav or the boom ready.', ['The visible place first, then the hidden one, at matched loudness', 'Scratching through the whole movement', 'Nothing over the capsule’s opening'], ['close', 'twoShot']), LAV_A.at),
  atPlace(boomSpec('b2.boom', ['close'], BOOM_CLOSE.d, `For a stationary interview, the program mic can be a fixed boom: just above the widest frame and a little in front, aimed at the mouth — the tube’s tip about 15 cm clear of the edge, its capsule here about ${cm(BOOM_CLOSE.d)} cm from the lips. Rigged by qualified crew.`), BOOM_CLOSE.p),
  atPlace(boomSpec('b2.boom.two', ['twoShot', 'public'], BOOM_TWO.d, `In the two-shot the frame’s top is higher: the fixed boom just above it, aimed at the anchor’s mouth — its capsule about ${cm(BOOM_TWO.d)} cm away, farther than in the close shot.`), BOOM_TWO.p),
  voiceZone(B02_MODEL, VA, GOOSE, MIC_TYPES),
  {
    id: 'b2.boundary',
    label: 'A boundary mic on the desk, toward the anchor',
    band: 'A low-profile alternative: a purpose-built boundary mic lying on the desk in front of the anchor, its front toward them, its opening clear — check its actual pattern. A lav taped to the desk is not the same thing.',
    kind: 'trial',
    src: 'LESSON-B02',
    quote: 'Mount a boundary-designed microphone as specified on a suitable tabletop; place it toward the speaker and leave its designed acoustic aperture clear (L25; PRACTICE)',
    bandProv: ill('its place on the desk is a drawing default; the distance from the lips (40–80 cm) is read from the drawing'),
    refSurface: 'mouth',
    side: 'either',
    distance: { min: 400, max: 800 },
    aim: { maxOffAxis: 75, prov: ill('a boundary lies flat: its front faces the anchor, the mouth well above it (the lab’s tolerance)') },
    requires: { variants: ['close', 'twoShot'], micTypeIds: ['bcBoundaryDesk'], mount: 'surface' },
    start: { p: { x: BOUNDARY_AT.x, y: DESK.min.y - 2 * MIC_TYPES.bcBoundaryDesk.body.radius.mm, z: BOUNDARY_AT.z }, az: 0, el: 0 },
    tendency: 'Low and out of the way, with the desk’s own bounce arriving with the direct sound — but farther from the mouth: more room, more papers and hands, more of the guest.',
    checks: ['Papers, a keyboard and hands kept off it', 'The anchor turning to the guest', 'Not for a loud room with a PA'],
  },
  atPlace(lavSpec('b2.guestLav', 'The guest’s own lav, on their own channel', 'Each speaker on their own close mic: the guest’s lav over the middle of their chest, about 12–25 cm from their lips, with their agreement — labelled, on its own channel.', 'Each voice strongest on its own lav, the other voice later and lower on it. On separate channels each can be balanced, muted when silent, and checked in the program.', ['Each channel alone, then a natural overlap', 'The guest’s papers and their hands', 'Muting the unused channel as the format permits'], ['twoShot', 'public']), LAV_G_AT, { V: VG, surface: IDS_G.surface }),
];
