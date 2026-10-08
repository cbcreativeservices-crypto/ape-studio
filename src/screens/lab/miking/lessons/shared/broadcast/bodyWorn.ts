/**
 * THE BODY-WORN FAMILY — Lab 7 (broadcast). Built once by group 2 (B05
 * lavalier and headset, B02 news anchors); used again by the later body-worn
 * lessons (B10/B11) and any lesson with a presenter on a body mic. Pure: no
 * React, so the tests reach it (test/mikingLab7BodyCamera.test.ts).
 *
 * Research: docs/labs/miking/lavalier_headset/GEOMETRY_PROPOSAL.md §2–§6 and
 * SOURCES.md; news_anchor/SOURCES.md (D-LAV1); the Lab 7a register in
 * radio_host/SOURCES.md §0. Internal record only — learner text names no
 * source (owner ruling 2026-10-04).
 *
 * FRAME. Frame V of the wearer (shared/voice/voiceSpec.ts): the LIP POINT at
 * the origin, +x out of the mouth, +y DOWN, +z to the wearer's RIGHT, mm. The
 * standing figure (voicePose) and the seated one (talkerPose) share the head,
 * the neck and the chest's front face, so one set of mount points serves both.
 *
 * WHAT IS HERE
 *   • the MOUNT POINTS on the garment (sternum, lapel, collar, tie, neckline,
 *     concealed, headset) — where the capsule's front sits, which way the
 *     garment faces there, and what the mic moves with (the CHEST or the
 *     HEAD). Their places are drawing defaults on the shared figure; the
 *     distances they make are DERIVED and land inside the researched bands:
 *       LAV_BAND      125–250 mm from the lips (D-LAV1: one device's 25 cm,
 *                     another article's 12–20 cm below the mouth, a third's
 *                     about 20 cm — device and task examples, drawn as one
 *                     union band, a starting range, never a rule);
 *       HEADSET_BAND  20–30 mm from the corner of the mouth (one headset's
 *                     own guide — "follow the headset maker").
 *   • THE HEAD TURNS on a body mic: a mic on the chest stays put while the
 *     mouth swings (talkerPose.turnHead); a headset turns WITH the head, so
 *     its distance and angle to the mouth hold (`withHead`, `bodyMicReadout`).
 *   • THE BREATH: the plosive air jet straight out of the lips (the voice
 *     family's illustrative cone, VOICE_DIMS.jetHalfDeg / jetReach): a
 *     capsule inside it hears the puffs (`inBreathJet`).
 *   • THE CABLE: the broadcast loop at the clip and the secondary taped loop
 *     lower down — how much of a sit, a turn or a gesture reaches the capsule
 *     as a tug (`cablePull`, a simplified picture; the moves are drawing
 *     defaults).
 *   • THE TRANSMITTER PACK at the back of the belt (drawn; a drawing
 *     default).
 * Safety stays exact in plain words (SAFETY): consent before fitting,
 * wardrobe approves any garment change, skin-safe adhesive only on skin, no
 * bodypack lav straight into 48 V phantom except through its specified
 * adapter, the wearer can always remove it.
 */
import type { Dim, Vec3 } from '../../../engine/model/types.ts';
import { EAR, EAR_HALF, HEAD_C, VOICE_DIMS, dd } from '../voice/voiceSpec.ts';
import { SINGER_NECK, SINGER_SOLIDS } from '../voice/voicePose.ts';
import { micToMouth } from '../field/location.ts';
import { TURN_PIVOT, turnHead } from './talkerPose.ts';

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/* ── the researched bands (internal keys; never on screen) ── */

/** D-LAV1: one sternum zone, 125–250 mm from the lip point (SN-ME2 "a
 *  distance of 25 cm (10") from your mouth"; S-PASTOR "5 to 8 inches (12 to
 *  20 cm) below the pastor's mouth"; S-CHURCH "8" below the mouth in the
 *  center"; R-LAV the sternum "a nice balance of close proximity and natural
 *  sound"). A union of device and task examples — a starting range. */
export const LAV_BAND = { min: 125, max: 250, src: 'R-LAV', quote: 'sternum: "a nice balance of close proximity and natural sound" (R-LAV); 25 cm (SN-ME2); 12–20 cm below the mouth (S-PASTOR); about 20 cm centred (S-CHURCH) — D-LAV1, one union band' } as const;
/** D-HS1: SN-ME3 "2-3 cm (1") from the mouth", near its corner — one
 *  headset's own guide: follow the headset maker. */
export const HEADSET_BAND = { min: 20, max: 30, src: 'SN-ME3', quote: 'capsule "2-3 cm (1") from the mouth", near the corner of the mouth (quick guide)' } as const;

/* ── the figure's chest and the garment (drawing defaults) ── */

/** The chest's front face (the shared figure's torso box: standing and seated alike). */
export const CHEST_X = SINGER_SOLIDS.torso.kind === 'box' ? SINGER_SOLIDS.torso.max.x : 7;
/** The collar line (the base of the neck). */
export const NECK_Y = SINGER_NECK.y;

export const BODY_DIMS = {
  /** A capsule's front just off the garment (a clip holds it a few mm out). */
  standOff: dd(6, 'a clip-held lavalier capsule’s front off the garment (drawing default, as F09)'),
  /** One garment layer over a concealed capsule (a shirt; drawn). */
  layer: dd(4, 'one garment layer over a concealed capsule (drawing default)'),
  /** The lapel edge either side of the mid-plane (proposal: 60–90 mm). */
  lapelOff: dd(75, 'a jacket lapel’s edge off the mid-plane (proposal §2: 60–90 mm)'),
  /** The collar's point beside the throat. */
  collarOff: dd(45, 'a shirt collar’s point beside the throat (drawing default)'),
  /** The mouth's corner beside the lip point (the face's mouth, half its width). */
  cornerX: dd(-6, 'the mouth corner behind the lip point (drawing default)'),
  cornerZ: dd(26, 'the mouth corner beside the lip point: half a mouth’s width (drawing default)'),
  /** The transmitter pack: at the back of the belt, on the wearer's left. */
  packW: dd(64, 'a bodypack transmitter’s width (drawing default)'),
  packH: dd(86, 'a bodypack transmitter’s height (drawing default)'),
  packD: dd(22, 'a bodypack transmitter’s depth (drawing default)'),
} as const;

/** The mouth's corner on the wearer's right (+z) — the side the headset's
 *  boom comes round. */
export const MOUTH_CORNER: Vec3 = v3(BODY_DIMS.cornerX.mm, 2, BODY_DIMS.cornerZ.mm);

/* ── the mount points ── */

export type BodyMountId = 'sternum' | 'lapel' | 'collar' | 'tie' | 'neckline' | 'concealed' | 'headset';
export type BodyMount = {
  id: BodyMountId;
  label: string;
  short: string;
  /** What the learner reads about it (starting-points voice). */
  words: string;
  /** The capsule's FRONT (frame V). */
  at: Vec3;
  /** Where the clip grips the garment (or the headset's ear hook). */
  grip: Vec3;
  /** What the mic moves with. */
  rides: 'chest' | 'head';
  /** Hidden under one garment layer (drawn over it). */
  covered: boolean;
  /** Internal: how the place was chosen. */
  why: string;
};

// A concealed capsule sits at the same place: the art draws one garment
// layer over it (the torso solid already stands for the body and its shirt).
const front = (y: number, z = 0): Vec3 => v3(CHEST_X + BODY_DIMS.standOff.mm, y, z);
const gripBelow = (p: Vec3): Vec3 => v3(CHEST_X + 1, p.y + 15, p.z);

/** The headset capsule: beside the mouth's corner, a little ahead of it and
 *  out of the breath (the voice family's drawing default: 14 mm ahead of the
 *  lips, 34 mm to the side — 24 mm from the corner, inside HEADSET_BAND). */
export const HEADSET_P: Vec3 = v3(VOICE_DIMS.headsetFwd.mm, 0, VOICE_DIMS.headsetSide.mm);

export const BODY_MOUNTS: Readonly<Record<BodyMountId, BodyMount>> = {
  sternum: { id: 'sternum', label: 'On the sternum, in the centre', short: 'STERNUM', words: 'Clipped to a firm clothing edge in the middle of the chest, over the breastbone — a steady place to begin.', at: front(NECK_Y + 92), grip: gripBelow(front(NECK_Y + 92)), rides: 'chest', covered: false, why: 'R-LAV sternum; the place F09 draws (NECK + 92 mm)' },
  lapel: { id: 'lapel', label: 'On a lapel, off to one side', short: 'LAPEL', words: 'On the edge of a jacket lapel — handy for the shot, but off the middle: a turn one way and the other sound different.', at: front(NECK_Y + 110, -BODY_DIMS.lapelOff.mm), grip: gripBelow(front(NECK_Y + 110, -BODY_DIMS.lapelOff.mm)), rides: 'chest', covered: false, why: 'proposal §2: lapel offset 60–90 mm (drawing default 75 mm, the wearer’s left)' },
  collar: { id: 'collar', label: 'At the collar', short: 'COLLAR', words: 'On the shirt’s collar, beside the throat: close, but near the chin and the jaw’s movement.', at: front(NECK_Y + 12, BODY_DIMS.collarOff.mm), grip: gripBelow(front(NECK_Y + 12, BODY_DIMS.collarOff.mm)), rides: 'chest', covered: false, why: 'S-LAVPICK names shirt, tie and collar; no number (drawing default)' },
  tie: { id: 'tie', label: 'On the tie', short: 'TIE', words: 'On the tie, just below the knot: central and tidy — check the tie does not rub or swing.', at: front(NECK_Y + 120), grip: gripBelow(front(NECK_Y + 120)), rides: 'chest', covered: false, why: 'S-LAVPICK; drawing default 12 cm below the collar' },
  neckline: { id: 'neckline', label: 'At the neckline, in the centre', short: 'NECKLINE', words: 'At the centre of an open neckline: a little closer to the mouth than the sternum — and nearer the chin.', at: front(NECK_Y + 40), grip: gripBelow(front(NECK_Y + 40)), rides: 'chest', covered: false, why: 'lesson: "central neckline" (drawing default 4 cm below the collar)' },
  concealed: { id: 'concealed', label: 'Hidden under the shirt, on the sternum', short: 'HIDDEN', words: 'The same place, under one layer of the shirt in a concealer, with the wearer’s agreement — the cloth over it can dull the top end and rub.', at: front(NECK_Y + 92), grip: gripBelow(front(NECK_Y + 92)), rides: 'chest', covered: true, why: 'lesson: concealed after a working visible place (one fabric layer, drawn)' },
  headset: { id: 'headset', label: 'A headset by the corner of the mouth', short: 'HEADSET', words: 'A thin boom from over the ear brings the capsule beside the corner of the mouth, out of the breath — placed as its maker says.', at: HEADSET_P, grip: v3(EAR.x, EAR.y, EAR_HALF), rides: 'head', covered: false, why: 'SN-ME3 2–3 cm from the corner (D-HS1); the voice family’s headset place' },
};
export const BODY_MOUNT_IDS: readonly BodyMountId[] = ['sternum', 'lapel', 'collar', 'tie', 'neckline', 'concealed', 'headset'];

/** The distance from the mouth's corner (the headset's band is read from it). */
export function fromCorner(p: Vec3): number {
  return len(sub(p, MOUTH_CORNER));
}

/* ── the head turns: chest versus head ── */

/**
 * A point carried by the head as it turns — yawed by `yawDeg` (+ toward the
 * wearer's right) and pitched by `pitchDeg` (+ up) about the head's centre,
 * the same turn talkerPose.turnHead gives the mouth (pitch first, then yaw).
 */
export function withHead(p: Vec3, yawDeg: number, pitchDeg: number, pivot: Vec3 = TURN_PIVOT): Vec3 {
  const y = yawDeg * DEG;
  const pt = pitchDeg * DEG;
  const rx = p.x - pivot.x;
  const ry = p.y - pivot.y;
  const rz = p.z - pivot.z;
  const px = rx * Math.cos(pt) + ry * Math.sin(pt);
  const py = -rx * Math.sin(pt) + ry * Math.cos(pt);
  return v3(pivot.x + px * Math.cos(y) - rz * Math.sin(y), pivot.y + py, pivot.z + px * Math.sin(y) + rz * Math.cos(y));
}

/** What a body-worn mic reads as the head turns: its distance to the
 *  (turned) mouth, the angle off the mouth's axis, and the change in level
 *  against facing ahead by distance alone (inverse square, DERIVED). A chest
 *  mic stays put; a headset turns with the head. */
export function bodyMicReadout(p: Vec3, rides: 'chest' | 'head', yawDeg: number, pitchDeg: number): { at: Vec3; d: number; offAxis: number; d0: number; distDb: number } {
  const t = turnHead(yawDeg, pitchDeg);
  const at = rides === 'head' ? withHead(p, yawDeg, pitchDeg) : p;
  const now = micToMouth(at, null, t.mouth, t.dir);
  const d0 = micToMouth(p, null, v3(0, 0, 0), v3(1, 0, 0)).d;
  return { at, d: now.d, offAxis: now.offAxis, d0, distDb: 20 * Math.log10(now.d / Math.max(1, d0)) };
}

/** The level difference between turning one way and the other by `deg` (dB,
 *  by distance alone): 0 for a mic on the mid-plane, larger off to one side —
 *  why a centred lav is the steadier start (DERIVED). */
export function turnImbalanceDb(p: Vec3, rides: 'chest' | 'head', deg = 45): number {
  const l = bodyMicReadout(p, rides, -deg, 0);
  const r = bodyMicReadout(p, rides, deg, 0);
  return Math.abs(20 * Math.log10(l.d / r.d));
}

/* ── the breath ── */

/** The plosive air jet: a cone straight out of the lips (the voice family's
 *  illustrative half-angle and reach — no source gives either). */
export const BREATH_JET = { halfDeg: VOICE_DIMS.jetHalfDeg.mm, reach: VOICE_DIMS.jetReach.mm } as const;
/** Inside the jet (the capsule would hear the puffs of P and B). */
export function inBreathJet(p: Vec3, mouth: Vec3 = v3(0, 0, 0), dir: Vec3 = v3(1, 0, 0)): boolean {
  const w = sub(p, mouth);
  const d = len(w);
  if (d < 1e-6 || d > BREATH_JET.reach) return false;
  const c = (w.x * dir.x + w.y * dir.y + w.z * dir.z) / d;
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG < BREATH_JET.halfDeg;
}

/* ── the cable: the broadcast loop and the secondary loop ── */

/** How much the clip-to-pack path lengthens in each move (drawing defaults —
 *  no source gives one; the picture is simplified). */
export const MOVES: Readonly<Record<'stand' | 'sit' | 'turn' | 'gesture', { label: string; words: string; mm: number; prov: Dim }>> = {
  stand: { label: 'STANDING', words: 'standing still', mm: 0, prov: dd(0, 'standing: the cable at rest') },
  sit: { label: 'SITS DOWN', words: 'sitting down, the jacket bunching', mm: 45, prov: dd(45, 'how much the chest-to-belt path lengthens as the wearer sits (drawing default)') },
  turn: { label: 'TURNS', words: 'turning at the waist', mm: 30, prov: dd(30, 'how much it lengthens with a turn at the waist (drawing default)') },
  gesture: { label: 'GESTURES', words: 'reaching out with both arms', mm: 55, prov: dd(55, 'how much it lengthens with a wide gesture (drawing default)') },
};
export type MoveId = keyof typeof MOVES;
export const MOVE_IDS: readonly MoveId[] = ['stand', 'sit', 'turn', 'gesture'];
/** The spare cable each loop holds (drawing defaults). */
export const LOOPS = { broadcast: dd(60, 'the spare cable in a small broadcast loop at the clip'), secondary: dd(50, 'the spare cable in the secondary, taped loop lower down') } as const;

/**
 * Where a move's tug ends up (mm). The pull starts at the pack and runs up
 * the cable: the secondary loop's tape holds the garment there, so with it
 * nothing past it moves until its spare cable is used — and then the tape,
 * not the capsule, takes the pull; without it the pull reaches the clip,
 * where the broadcast loop's spare cable gives first. `atCapsule` > 0 is a
 * tug on the capsule: a rub or a thump in the sound.
 */
export function cablePull(move: number, loops: { broadcast: boolean; secondary: boolean }): { atTape: number; atClip: number; atCapsule: number } {
  if (loops.secondary) return { atTape: Math.max(0, move - LOOPS.secondary.mm), atClip: 0, atCapsule: 0 };
  const atClip = move;
  return { atTape: 0, atClip, atCapsule: loops.broadcast ? Math.max(0, atClip - LOOPS.broadcast.mm) : atClip };
}

/** The transmitter pack at the back of the belt, on the wearer's left
 *  (frame V; the standing figure — a seated wearer's belt is lower). */
export function packAt(standing: boolean): Vec3 {
  // On the back of the belt: just behind the torso's back face.
  const back = SINGER_SOLIDS.torso.kind === 'box' ? SINGER_SOLIDS.torso.min.x : CHEST_X - 262;
  return v3(back - BODY_DIMS.packD.mm / 2 - 2, NECK_Y + (standing ? 520 : 470), -150);
}

/* ── safety, exact, in plain words (every body-worn page uses these) ── */

export const SAFETY = {
  consent: 'Ask the wearer first, every time: what goes where, and that they can take it off or ask to adjust it at any moment.',
  wardrobe: 'Wardrobe approves any change to a garment — no cutting, piercing or taping into clothes without them.',
  skin: 'On skin, use only an adhesive made for skin, after asking about sensitivities. Tape made for fabric or cameras is not skin-safe.',
  phantom: 'Never plug a bodypack lavalier straight into a 48 V phantom-powered input — only through its own specified adapter or power module.',
  remove: 'Keep cables and the pack off pressure points, and let the wearer remove the whole thing themselves.',
} as const;

/** The head's centre (the headset's ear hook turns about it with the head). */
export const HEAD_CENTRE = HEAD_C;
