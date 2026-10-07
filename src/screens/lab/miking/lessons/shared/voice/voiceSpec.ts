/**
 * THE VOICE FAMILY — "frame V" (docs/labs/miking/lead_vocal/GEOMETRY_PROPOSAL.md
 * §1–§3), shared by every singer in Lab 5: E01 lead vocal, E03 rap, E07 the
 * singer with an instrument, and the singers of the later groups (duets,
 * choirs, bands). Pure data and maths: no React, so the tests reach it.
 *
 * FRAME V. Units mm. ORIGIN = the LIP POINT: the centre of the lip opening on
 * the mid-sagittal plane (every vocal starting point is measured "from the
 * mouth"). +x forward along the mouth axis (level when the head is level),
 * +y DOWN, +z toward the singer's RIGHT — the engine's convention (types.ts:
 * "+z toward the player's right"; the proposal's +z-to-the-left is mirrored
 * here so one frame serves the engine and the voice).
 *
 * A singer in ANY host frame (a seated singer-guitarist in the guitar's
 * frame, a pianist at the keys) is described by a VoiceAnchor: the lip point
 * and three unit directions. Every voice zone, surface and region is built
 * from an anchor (voiceZones.ts), so a vocal starting point means the same
 * thing on a standing singer and on a singer behind a guitar.
 *
 * SOURCES (internal record; never on screen): lead_vocal/SOURCES.md §0 keys.
 * Every value is SOURCED, DERIVED, or a DRAWING DEFAULT (`placeholder`: an
 * unknown the drawing cannot exist without, never shown as a readout).
 */
import type { Dim, Provenance, Vec3 } from '../../../engine/model/types.ts';

const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
/** A drawing default (an UNKNOWN the picture needs). */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** Where a singer is: the lip point and the mouth's three directions (unit
 *  vectors in the host frame): forward along the mouth axis, up toward the
 *  crown, and toward the singer's right. */
export type VoiceAnchor = { lip: Vec3; fwd: Vec3; up: Vec3; right: Vec3 };

/** Frame V itself: a standing singer, head level, facing +x. */
export const FRAME_V: VoiceAnchor = { lip: { x: 0, y: 0, z: 0 }, fwd: { x: 1, y: 0, z: 0 }, up: { x: 0, y: -1, z: 0 }, right: { x: 0, y: 0, z: 1 } };

/** A point `f` forward, `u` up and `r` to the right of the lip point. */
export function vAt(V: VoiceAnchor, f: number, u = 0, r = 0): Vec3 {
  return {
    x: V.lip.x + V.fwd.x * f + V.up.x * u + V.right.x * r,
    y: V.lip.y + V.fwd.y * f + V.up.y * u + V.right.y * r,
    z: V.lip.z + V.fwd.z * f + V.up.z * u + V.right.z * r,
  };
}
/** A direction `deg` off the mouth axis toward `toward` (a unit vector ⊥ fwd). */
export function vDir(V: VoiceAnchor, deg: number, toward: Vec3): Vec3 {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: V.fwd.x * c + toward.x * s, y: V.fwd.y * c + toward.y * s, z: V.fwd.z * c + toward.z * s };
}
export const down = (V: VoiceAnchor): Vec3 => ({ x: -V.up.x, y: -V.up.y, z: -V.up.z });
export const left = (V: VoiceAnchor): Vec3 => ({ x: -V.right.x, y: -V.right.y, z: -V.right.z });

/**
 * THE HEAD AND THE BODY (proposal §2): head width, depth and height are
 * UNKNOWN (the IEC 60318-7 / ANSI S3.36 numbers were not read) — the adult
 * head is the shared figure's (players/playerPose BODY.headH 228 mm, so r =
 * 114), and its profile is the shared figure's profile head
 * (PlayerFigure.headProfile), placed so its mouth sits ON the lip point. The
 * points below are read off that same profile (in its own units, k = r/110):
 * the lips at (−84, 52), the nose tip at (−102, 24), the chin at (−72, 84),
 * the brow notch at (−77, −21), the ear at (34, 10) — so the drawing, the
 * collision solids and the readouts agree.
 */
export const HEAD_R = 114;
const K = HEAD_R / 110;
/** The profile head's centre, from the lip point (frame V). */
export const HEAD_C: Vec3 = { x: -84 * K, y: -52 * K, z: 0 };
const fromProfile = (px: number, py: number): Vec3 => ({ x: HEAD_C.x - px * K, y: HEAD_C.y + py * K, z: 0 });
/** The nose tip (≈ 19 mm ahead of the lips, 29 mm above). S-REC aims a vocal
 *  mic "between the nose and mouth"; the nose itself is a drawing default. */
export const NOSE = fromProfile(-102, 24);
export const CHIN = fromProfile(-72, 84);
/** Eye level — only used to place the "about eye level" mic above the mouth
 *  (N-POP). A drawing default: the profile's brow notch, a little lower. */
export const EYE_Y = fromProfile(-77, -21).y + 8;
/** The near ear (the side the side view sees), and its distance either side
 *  of the mid-plane (a drawing default: the shared front head's ears). */
export const EAR = fromProfile(34, 10);
export const EAR_HALF = 88 * K;
/** Between the nose and the mouth: the S-REC aim. */
export const NOSE_MOUTH: Vec3 = { x: (NOSE.x + 0) / 2, y: NOSE.y / 2, z: 0 };

/** VOICE DIMENSIONS — the record. */
export const VOICE_DIMS = {
  /** The lip point above the floor, standing (no readout depends on it:
   *  stands are drawn from the lip point down). The brass players' lips are
   *  at the same 1550 mm (one adult figure across the labs). */
  lipStanding: dd(1550, 'the standing lip height above the floor (proposal §2: UNKNOWN)'),
  /** The telecom MOUTH REFERENCE POINT: 25 mm in front of the lip plane. */
  mrp: { mm: 25, prov: src('GRAS-44AB', 'At the mouth reference point (MRP), which is 25 mm from the detachable lip ring') } as Dim,
  /** A pop screen at least 10 cm (4 in) from the mic. */
  popGap: { mm: 100, prov: src('N-POP', 'at least 10 cm (4 inches) away from the mic') } as Dim,
  /** The pop screen's hoop (Ø 150 mm, a common size — no source read). */
  popR: dd(75, 'a pop screen’s hoop radius (a common 15 cm screen; no source read)'),
  /** "Angle the pop shield slightly so it isn't parallel to the capsule" (N-VOC): the angle is not given. */
  popTilt: dd(10, 'the pop screen’s tilt from parallel to the capsule (N-VOC: "slightly")'),
  /** The air jet of a plosive (illustrative only: no source gives its angle or reach). */
  jetHalfDeg: dd(20, 'the plosive air jet’s half-angle (no source: illustrative)'),
  jetReach: dd(300, 'how far the plosive jet is drawn (no source: illustrative)'),
  /** "slightly off to one side" (S-SM58-UG): the angle is not given. */
  sideDeg: dd(20, '"slightly off to one side": the angle (S-SM58-UG gives none)'),
  /** "slightly lower" for sibilance (S-VOC-REC): the amount is not given. */
  belowDeg: dd(30, '"slightly lower … not in direct line of sight with the mouth": the angle (S-VOC-REC gives none)'),
  /** The rapper's working zone (E03: "Give the rapper a defined working zone") — its size is not given. */
  workFwd: dd(60, 'the working zone’s forward travel of the head (E03 gives no size)'),
  workBack: dd(80, 'the working zone’s backward travel of the head'),
  workUpDown: dd(40, 'the working zone’s up-and-down travel of the head'),
  /** A headset capsule "near the mouth corner according to the manufacturer's instructions": no number. */
  headsetFwd: dd(14, 'a headset capsule’s place ahead of the lips (follow the headset maker)'),
  headsetSide: dd(34, 'a headset capsule’s place beside the mouth corner (follow the headset maker)'),
} as const;

/** The STARTING-POINT ROWS of frame V (proposal §3), mm from the lip point to
 *  the mic's front. Lessons build their zones from these numbers (voiceZones). */
export const VOICE_ROWS = {
  /** S-VOC-REC: "approximately 10 to 20 centimeters (4-8 inches) from the mic will provide a good starting point". */
  shure: { min: 100, max: 200, src: 'S-VOC-REC', quote: 'approximately 10 to 20 centimeters (4-8 inches) from the mic will provide a good starting point' },
  /** N-VOC: "Maintain a distance of 20–30 cm (8–12 inches)." */
  neumann: { min: 200, max: 300, src: 'N-VOC', quote: 'Maintain a distance of 20–30 cm (8–12 inches).' },
  /** DPA-VOC-STUDIO: close "about 4 inches from the mouth directly on axis", rehearse "2-6 inches" (conv.). */
  dpaClose: { min: 50.8, max: 152.4, start: 101.6, src: 'DPA-VOC-STUDIO', quote: 'about 4 inches from the mouth directly on axis … 2-6 inches' },
  /** DPA-VOC-STUDIO: "around 12 inches" — drawn 25.5–35.5 cm (± 5 cm: a drawing default). */
  loose: { min: 255, max: 355, src: 'DPA-VOC-STUDIO', quote: 'around 12 inches from the mouth … Be careful not to get too roomy because it is hard to reduce later.' },
  /** DPA-VOICE: "Vocal microphones on stage are normally used within 10 cm" (from 2.5 cm: a drawing default — not on the grille). */
  stage: { min: 25, max: 100, src: 'DPA-VOICE', quote: 'Vocal microphones on stage are normally used within 10 cm' },
  /** S-SM58-UG: "15 to 60 cm (6 in. to 2 ft.) away from mouth, just above nose height". */
  noseHeight: { min: 150, max: 600, src: 'S-SM58-UG', quote: '15 to 60 cm (6 in. to 2 ft.) away from mouth, just above nose height' },
  /** S-SM58-UG: "20 to 60 cm (8 in. to 2 ft.) away from mouth, slightly off to one side" ("minimal 's' sounds"). */
  side: { min: 200, max: 600, src: 'S-SM58-UG', quote: '20 to 60 cm (8 in. to 2 ft.) away from mouth, slightly off to one side' },
  /** S-SM4-UG: "Vocals and speech 1–6 inches (2–15 cm) Use a pop filter to prevent plosives." (conv.) */
  sm4: { min: 25.4, max: 152.4, src: 'S-SM4-UG', quote: 'Vocals and speech 1–6 inches (2–15 cm) Use a pop filter to prevent plosives.' },
} as const;

/** "Within 10 cm" etc. in words: cm and inches, rounded as people say them. */
export function cmIn(mm: number): string {
  const cm = Math.round(mm / 10);
  const inch = Math.round(mm / 25.4);
  return `${cm} cm (${inch} in)`;
}

/** The free-field level change for a distance change (inverse square,
 *  S-LIVE: "When the distance from a sound source doubles, the sound level
 *  decreases by 6dB"): DERIVED, a free-field estimate. */
export function distanceSwingDb(rNear: number, rFar: number): number {
  return 20 * Math.log10(rFar / rNear);
}
