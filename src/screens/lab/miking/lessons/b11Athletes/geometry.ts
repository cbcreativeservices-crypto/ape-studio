/**
 * B11 ATHLETES, COACHES AND OFFICIALS — where things are (charter §2 layer
 * 2). Frame V on the WEARER (the lip point at the origin, +x straight out of
 * the mouth toward the field, +y DOWN, +z to their right, mm), standing
 * (shared/voice: the lips 1550 mm above the ground), with FRAME T on the
 * body (shared/broadcast/standing.ts: the breastbone, the collar, the small
 * of the back, the ear; the keep-outs). Three wearers (the variants):
 *
 *   coach     A COACH at the sideline, facing the field: an approved chest
 *             mic or a broadcast headset; their own team headset is a
 *             separate system; a perimeter boom outside play as the
 *             fallback.
 *   official  AN OFFICIAL with an announcement headset: opened on purpose to
 *             the PA (and, with permission, the program); the officials'
 *             private circuit stays closed.
 *   athlete   AN ATHLETE in contact kit, where the event approves a mount:
 *             a body mic at the approved place only — the helmet, the
 *             shoulder pads and the shin pads are never touched.
 *
 * Sources: docs/labs/miking/athletes_officials/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT: the body's landmarks, the keep-out
 * regions (illustrative, never rule geometry), the field's edge, the PA,
 * the perimeter operator's stance and grip.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, voiceRegions } from '../shared/voice/voiceZones.ts';
import { TORSO, earOf, keepOutsOf, type Stander } from '../shared/broadcast/standing.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (athletes_officials/GEOMETRY_PROPOSAL.md §1–2)');

export const FLOOR = VOICE_DIMS.lipStanding.mm;
export const WEARER: Stander = { id: 'wearer', lip: v3(0, 0, 0), facing: 1 };

/** The field's edge in front of the coach and the official. */
export const FIELD_X = 1300;
/** The body mic at the breastbone, its clip just below. */
export const LAV_P = TORSO.sternum;
export const LAV_CLIP = v3(TORSO.sternum.x - 5, TORSO.sternum.y + 15, 0);
/** The perimeter boom (coach): an operator outside play along the sideline, to the coach's left. */
export const OPERATOR = { feet: v3(800, FLOOR, -1500), box: { min: v3(650, -210, -1690), max: v3(950, FLOOR, -1310) } };
export const GRIP = v3(680, -285, -1270);
/** The PA (official): high to the front-left, facing the stands. */
export const PA_C = v3(2200, -1800, -2600);

export const B11_VARIANTS: Variant[] = [
  { id: 'coach', label: 'COACH', blurb: 'A coach at the sideline: an approved chest mic or a broadcast headset — their own team headset is a separate system — and a perimeter boom outside play if a mount is refused.', phrase: 'on a coach at the sideline' },
  { id: 'official', label: 'OFFICIAL', blurb: 'An official with an announcement headset, opened on purpose to the PA; the officials’ private circuit stays closed.', phrase: 'on an official' },
  { id: 'athlete', label: 'ATHLETE', blurb: 'An athlete in contact kit, where the event approves a mount: a body mic at the approved place only — protective equipment is never touched.', phrase: 'on an athlete, where approved' },
];

export const B11_VIEWS: Record<'coach' | 'official' | 'athlete', { side: ViewBox; top: ViewBox }> = {
  coach: { side: { u0: -700, u1: 2000, v0: -900, v1: 1640 }, top: { u0: -700, u1: 2000, v0: -1900, v1: 700 } },
  official: { side: { u0: -700, u1: 2700, v0: -2100, v1: 1640 }, top: { u0: -700, u1: 2700, v0: -2900, v1: 700 } },
  athlete: { side: { u0: -700, u1: 1100, v0: -500, v1: 1640 }, top: { u0: -700, u1: 1100, v0: -700, v1: 700 } },
};

const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const FIG = ill('the shared adult figure standing (players/playerPose BODY), placed round the lip point: a drawing default');

const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.head', ...W.head, label: 'head and face', role: 'The head turns to the play, to the bench, to a player: a headset boom turns with it; a chest mic does not.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'chest (frame T)', short: 'chest', role: 'A body mic clips at the breastbone — at the APPROVED place only, clear of fabric edges, zips, badges, straps and pads.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'legs', short: 'legs', role: 'Where the wearer stands and runs: no cable loop a hand or a foot can catch.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'b11.pack', label: 'the bodypack at the small of the back', short: 'pack', role: 'In its approved low-profile place, retained so it cannot move, no hard edge pressing in; the antenna straight, never coiled or folded.', prov: DD },
  { id: 'b11.cable', label: 'the cable and its strain-relief loop', short: 'cable', role: 'A small loop at the mic and enough slack for the head and the torso to move — no exposed loop that can catch a hand, an opponent or equipment.', prov: DD },
  { id: 'b11.teamset', label: 'the team’s own headset', short: 'team headset', role: 'The coach’s or the official’s own communications — a separate system. A broadcast mic never taps into it.', variants: ['coach', 'official'], prov: DD },
  { id: 'b11.field', label: 'the field of play', short: 'field', role: 'In front of the wearer: no crew goes into play to fix or refit a mic — mute it and use the fallback.', prov: DD },
  { id: 'b11.operator', label: 'the perimeter boom operator', short: 'operator', role: 'Outside play along the sideline: the fallback when a mount is refused — a farther, different perspective, never sold as a close mic.', solid: { kind: 'box', ...OPERATOR.box }, variants: ['coach'], prov: DD },
  { id: 'b11.pa', label: 'the PA', short: 'PA', role: 'High to the front-left: the official’s announcement goes out through it — and the official’s open mic hears it back.', variants: ['official'], prov: DD },
  { id: 'clamp', label: 'how far the clip, the boom or the pole reaches', short: 'reach', role: 'A clip grips where it is; a headset boom reaches only so far from the ear; a pole only so far from the hands.', listIn: [], prov: ill('a clip’s reach (4 cm), a headset boom’s (17 cm) and a pole’s (2.5 m): drawing defaults') },
];

/** The athlete's keep-outs (frame T, illustrative): a helmet, the shoulder
 *  pads, the shin pads — the engine stops a mic entering them. */
const envelopes: Envelope[] = keepOutsOf('athlete').map((k) => ({ id: k.id, label: k.label, shape: k.shape, prov: ill('a keep-out region on a generic figure (athletes_officials/GEOMETRY_PROPOSAL §1): illustrative, never rule geometry'), variants: ['athlete'] }));

const HEADSETS = ['bcHeadsetBoom', 'bcHeadsetSuper'];
const rims: Rim[] = [
  { id: 'lav', label: 'a clip at the breastbone', c: LAV_CLIP, axis: v3(1, 0, 0), r: 0, types: ['locLav'], variants: ['coach', 'athlete'] },
  { id: 'clip.ear', label: 'the headset over the right ear', c: earOf(WEARER, 'R'), axis: v3(0, 0, 1), r: 0, types: HEADSETS, variants: ['coach', 'official'] },
  { id: 'grip', label: 'the perimeter operator’s hands', c: GRIP, axis: v3(0, 0, 1), r: 0, types: ['locBoomSg'], variants: ['coach'] },
];

export const B11_MODEL: InstrumentModel = {
  id: 'b11-athletes',
  name: 'a body-worn mic',
  parts,
  regions: voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }),
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' })],
  lines: [mouthLine(FRAME_V, {})],
  envelopes,
  variants: B11_VARIANTS,
  defaultVariant: 'coach',
  views: B11_VIEWS.coach,
  fitAuthored: { side: true, top: true },
  viewsByVariant: { coach: B11_VIEWS.coach, official: B11_VIEWS.official, athlete: B11_VIEWS.athlete },
  // The setups keep to the head and the chest.
  setupFrameMax: { side: { u0: -420, u1: 600, v0: -460, v1: 520 }, top: { u0: -420, u1: 600, v0: -460, v1: 460 } },
  setupFrameMaxByVariant: { coach: { side: { u0: -420, u1: 1100, v0: -1000, v1: 520 }, top: { u0: -420, u1: 1100, v0: -1500, v1: 460 } } },
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { coach: null, official: null, athlete: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE WEARER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
