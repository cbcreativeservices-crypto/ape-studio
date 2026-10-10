/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — where things are (charter
 * §2 layer 2). Frame V on the READER (lessons/shared/voice: the lip point at
 * the origin, +x straight out of the mouth, +y DOWN, +z to their right, mm).
 * Two set-ups (the variants):
 *
 *   booth  A VOICE BOOTH: the reader standing (the voice family's standing
 *          figure, the lips 1550 mm above the floor) at a music stand that
 *          holds the script — tilted back, 38 cm in front of the lips and
 *          30 cm below them — soft panels on the wall behind.
 *   desk   A STUDIO DESK: the host seated (shared/broadcast/talkerPose),
 *          an in-studio guest across the desk, a mic each on a desk arm,
 *          and a small monitor loudspeaker on the desk (kept off while the
 *          mics are open — the studio card says so).
 *
 * Sources: docs/labs/miking/voiceover_guests/SOURCES.md, GEOMETRY_PROPOSAL.md
 * (mostly a REUSE of frame V and radio_host's frame B). Every position is a
 * DRAWING DEFAULT: the stand's place and tilt, the booth wall, the desk, the
 * guest's place, the monitor.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { EAR, EAR_HALF, FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { onAnchor } from '../shared/voice/voiceZones.ts';
import { DESK_TOP_Y, HOST, SEATED, SEATED_FLOOR, SEATED_SOLIDS, talkerAnchor, type Talker } from '../shared/broadcast/talkerPose.ts';
import { FIGURE, REACH_PART, VOICE_IDS, deskArm, talkerIds, talkerParts, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import type { Plate } from '../shared/broadcast/deskReflection.ts';
import type { StandSpec } from '../shared/broadcast/BroadcastArt';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (voiceover_guests/GEOMETRY_PROPOSAL.md §1)');
const DEG = Math.PI / 180;

export const READER: Talker = HOST;
export const GUEST: Talker = { id: 'guest', lip: v3(1500, 0, 0), facing: -1 };
export const IDS_G = talkerIds('gu');

/* ── the booth ── */
export const BOOTH_FLOOR = VOICE_DIMS.lipStanding.mm;
/** The music stand: its desk's centre, tilted back 35° from upright, 30 cm
 *  tall along the slope, 50 cm wide. */
export const STAND: StandSpec = { c: v3(380, 300, 0), tiltDeg: 35, w: 500, h: 300, floor: BOOTH_FLOOR };
const TILT = STAND.tiltDeg * DEG;
/** The stand's desk as a reflecting plate: its normal toward the reader
 *  (−x) and up (−y); `u` along the slope (up and away), `w` across. */
export const STAND_PLATE: Plate = {
  c: STAND.c,
  n: v3(-Math.cos(TILT), -Math.sin(TILT), 0),
  u: v3(Math.sin(TILT), -Math.cos(TILT), 0),
  w: v3(0, 0, 1),
  hu: STAND.h / 2,
  hw: STAND.w / 2,
};
/** The booth wall behind the reader (with its soft panels). */
export const WALL_X = -620;

/* ── the desk ── */
export const DESK = { min: v3(SEATED.deskEdge.mm, DESK_TOP_Y, -650), max: v3(GUEST.lip.x - SEATED.deskEdge.mm, DESK_TOP_Y + SEATED.deskThick.mm, 650) };
/** Desk arms clamp on the desk's SIDE edge, 39 cm back, and reach forward over the desk (owner 2026-10-10). */
export const GRIP_H = v3(DESK.min.x + 390, DESK_TOP_Y - 120, DESK.min.z + 20);
export const GRIP_G = v3(DESK.max.x - 390, DESK_TOP_Y - 120, DESK.max.z - 20);
/** The monitor loudspeaker on the desk, to the host's left, facing them. */
export const MONITOR_C = v3(900, DESK_TOP_Y - 150, -480);

export const B07_VARIANTS: Variant[] = [
  { id: 'booth', label: 'BOOTH', blurb: 'A voice booth: the reader standing at a music stand that holds the script, soft panels on the wall, headphones on.', phrase: 'in a voice booth, standing at a script stand' },
  { id: 'desk', label: 'LIVE DESK', blurb: 'A studio desk for a live read: the host alone, a mic on a desk arm, a monitor loudspeaker on the desk.', phrase: 'at a studio desk, live' },
  { id: 'guest', label: 'GUEST DESK', blurb: 'The same desk with an in-studio guest across from the host, a mic each on a desk arm.', phrase: 'at a studio desk with a guest' },
];

export const B07_VIEWS: Record<'booth' | 'desk' | 'guest', { side: ViewBox; top: ViewBox }> = {
  booth: { side: { u0: -760, u1: 900, v0: -420, v1: 1600 }, top: { u0: -760, u1: 900, v0: -560, v1: 560 } },
  desk: { side: { u0: -700, u1: 1500, v0: -620, v1: 1260 }, top: { u0: -700, u1: 1500, v0: -820, v1: 820 } },
  guest: { side: { u0: -700, u1: 2050, v0: -620, v1: 1260 }, top: { u0: -700, u1: 2050, v0: -820, v1: 820 } },
};

const arm = deskArm('arm.H', 'the host’s desk arm', GRIP_H, DESK_TOP_Y, ['bcDynArm', 'bcDynSuper'], ['desk', 'guest']);
const armG = deskArm('arm.G', 'the guest’s desk arm', GRIP_G, DESK_TOP_Y, ['bcDynArm'], ['guest']);
const voiceR = talkerVoice(READER, VOICE_IDS);
const voiceG = talkerVoice(GUEST, IDS_G, ['guest']);

const S = SINGER_SOLIDS;
const SS = SEATED_SOLIDS;
const parts: Part[] = [
  { id: 'v.mouth', label: 'mouth and lips', short: 'mouth', role: 'Where the voice leaves the reader — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIGURE },
  { id: 'v.nose', label: 'nose', short: 'nose', role: 'On m, n and ng the sound leaves through the nose. A mic aimed between the nose and the mouth hears both.', prov: FIGURE },
  { id: 'v.head', label: 'head and face', short: 'head', role: 'The head reads down to the script and looks up to the room or the guest: a mic keeps clear of the face and out of the sight line.', solid: S.head, prov: FIGURE },
  { id: 'v.chest', label: 'chest and shoulders', short: 'chest', role: 'The breath comes from here, but the voice is read from the mouth.', solid: S.torso, prov: FIGURE },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIGURE },
  { id: 'player.legs', label: 'the reader’s legs and feet', short: 'legs', role: 'Where the reader stands: stands and cables keep clear of the feet.', solid: S.legs, listIn: [], variants: ['booth'], prov: FIGURE },
  { id: 'player.armR', label: 'the right forearm, on the desk', short: 'arm', role: 'Forearms rest on the desk.', solid: SS.armR, listIn: [], variants: ['desk', 'guest'], prov: FIGURE },
  { id: 'player.armL', label: 'the left forearm, on the desk', short: 'arm', role: 'Forearms rest on the desk.', solid: SS.armL, listIn: [], variants: ['desk', 'guest'], prov: FIGURE },
  { id: 'player.thighs', label: 'the host’s legs', short: 'legs', role: 'Under the desk.', solid: SS.thighs, listIn: [], variants: ['desk', 'guest'], prov: FIGURE },
  { id: 'b7.phones', label: 'closed-back headphones', short: 'headphones', role: 'The reader hears the program and the producer on closed-back headphones at a comfortable level — the loudspeakers off, so nothing spills into the mic.', prov: ill('headphones over the ears: a drawing default') },
  { id: 'b7.stand', label: 'the script stand', short: 'script', role: 'It holds the script where the reader can see it — and its hard face reflects the voice back toward the mic. Tilt it, or put the mic above it.', solid: { kind: 'box', min: v3(STAND.c.x - 86, STAND.c.y - 123, -STAND.w / 2), max: v3(STAND.c.x + 86, STAND.c.y + 123, STAND.w / 2) }, variants: ['booth'], prov: DD },
  { id: 'b7.standPole', label: 'the stand’s column', short: 'column', role: 'The music stand’s column and feet.', solid: { kind: 'capsule', a: v3(STAND.c.x + 20, STAND.c.y + 120, 0), b: v3(STAND.c.x + 20, BOOTH_FLOOR - 40, 0), r: 14 }, listIn: [], variants: ['booth'], prov: DD },
  { id: 'b7.panels', label: 'soft panels on the booth wall', short: 'panels', role: 'They soften some reflections; they do not stop outside noise. A mic farther from the mouth hears more of the booth.', variants: ['booth'], prov: DD },
  ...talkerParts(GUEST, IDS_G, { who: 'the guest', headRole: 'An in-studio guest across the desk, on their own mic — looking at the host, so they stay inside its pickup.' }, ['guest']),
  { id: 'b7.desk', label: 'the desk', short: 'desk', role: 'A hard top under the mouths: it reflects the voice up into the mics.', solid: { kind: 'box', ...DESK }, variants: ['desk', 'guest'], prov: DD },
  arm.part,
  armG.part,
  { id: 'b7.monitor', label: 'the monitor loudspeaker', short: 'monitor', role: 'A loudspeaker on the desk: kept off while the mics are open — the talent hears the program on headphones.', variants: ['desk', 'guest'], prov: DD },
  REACH_PART,
];

const rims: Rim[] = [arm.rim, armG.rim, { id: 'clip.ear.g', label: 'a headset over the guest’s ear', c: { x: GUEST.lip.x - EAR.x, y: EAR.y, z: -EAR_HALF }, axis: v3(0, 0, -1), r: 0, variants: ['guest'], types: ['vocHeadset'] }];

const envelopes: Envelope[] = [];

export const B07_MODEL: InstrumentModel = {
  id: 'b07-voiceover',
  name: 'a reader and a guest',
  parts,
  regions: [...voiceR.regions, ...voiceG.regions],
  surfaces: [voiceR.surface, voiceG.surface],
  lines: [voiceR.line, voiceG.line],
  envelopes,
  variants: B07_VARIANTS,
  defaultVariant: 'booth',
  views: B07_VIEWS.booth,
  viewsByVariant: { booth: B07_VIEWS.booth, desk: B07_VIEWS.desk, guest: B07_VIEWS.guest },
  fitAuthored: { side: true, top: true },
  setupFrameMaxByVariant: {
    booth: { side: { u0: -380, u1: 760, v0: -420, v1: 640 }, top: { u0: -380, u1: 760, v0: -480, v1: 480 } },
    desk: { side: { u0: -420, u1: 1000, v0: -480, v1: 720 }, top: { u0: -420, u1: 1000, v0: -620, v1: 520 } },
    guest: { side: { u0: -420, u1: 1900, v0: -480, v1: 720 }, top: { u0: -420, u1: 1900, v0: -620, v1: 620 } },
  },
  yFloor: VOICE_DIMS.lipStanding,
  yFloorByVariant: { booth: BOOTH_FLOOR, desk: SEATED_FLOOR, guest: SEATED_FLOOR },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { booth: null, desk: null, guest: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE READER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};

/** The guest's anchor (their vocal zones are built on it). */
export const V_GUEST = talkerAnchor(GUEST);
/** A frame-V point on the reader (booth): the eyes' height for the stand. */
export const ON_READER = (p: Vec3) => onAnchor(FRAME_V, p);
