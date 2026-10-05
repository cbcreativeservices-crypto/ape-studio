/**
 * THE ELECTRIC PIANOS — technical truth (charter §2 layer 1) for Lab 2's
 * I11a Rhodes and I11b Wurlitzer lessons (2026-10-05). Pure TypeScript (no
 * React Native), so the tests reach it.
 *
 * Both lessons mic a LOUDSPEAKER, so the speaker maths is the speaker
 * family's (shared/speakers/: frame C, SPEAKER_12, the combo) — reused, never
 * copied. What this file adds:
 *   • the keyboards' outer sizes (the tine piano's from its maker's manual;
 *     the 61-key passive model's and the reed piano's are DRAWING DEFAULTS:
 *     UNKNOWN in the research);
 *   • the two mechanisms, drawn for an "inside view" only (never opened in
 *     the lesson): one note's tine and tonebar with its pickup and hammer;
 *     one steel reed between the electrostatic pickup's plates;
 *   • ONE new driver for the speaker family: the 4 × 8 in OVAL speaker
 *     (`SPEAKER_OVAL_4x8`), its depths drawn with the 12 in reference's
 *     proportions on each axis separately (`speakerScale`).
 *
 * Sources: docs/labs/miking/rhodes/ and wurlitzer/ (SOURCES.md keys RH-MK8,
 * RH-MK8-UG, RH-S61, RH-SM79, VV-200A, TF-DIFF, TF-REC) and their
 * GEOMETRY_PROPOSAL.md. Every UNKNOWN the drawing cannot exist without is a
 * PLACEHOLDER ("a drawing default, not a published figure"), never a readout.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';
import { IN, SPEAKER_12, speakerScale } from '../speakers/speakerModel.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/* ══════════ the tine piano (I11a) ══════════ */

/** One white key's width on the drawing (a standard octave ≈ 164.5 mm). */
export const WHITE_KEY = placeholder(23.5, 'one white key’s width: drawing default 23.5 mm (a standard octave ≈ 164.5 mm)');

export const RHODES = {
  /** The 73-key active model, from its maker's manual. */
  big: {
    w: { mm: 1153, prov: src('RH-MK8-UG', 'DIMENSIONS 1153 (w) x 563 (d) x 225 (h)') } as Dim,
    d: { mm: 563, prov: src('RH-MK8-UG', 'DIMENSIONS 1153 (w) x 563 (d) x 225 (h)') } as Dim,
    h: { mm: 225, prov: src('RH-MK8-UG', 'DIMENSIONS 1153 (w) x 563 (d) x 225 (h)') } as Dim,
    keys: 73,
    keysProv: src('RH-MK8-UG', '73-note (E8-E80)'),
    /** 43 white keys on an E-to-E 73-note keyboard (derived from the 88-key numbering). */
    whites: 43,
  },
  /** The 61-key PASSIVE model the lesson draws (one jack, no power). Its size
   *  is UNKNOWN: drawn with the 73-key footprint, seven white keys narrower. */
  stage: {
    keys: 61,
    keysProv: src('RH-S61', 'a fully passive 61-key tine piano'),
    whites: 36,
    w: placeholder(1153 - 7 * 23.5, 'the 61-key model’s width: drawing default (the 73-key footprint seven white keys narrower)'),
    d: placeholder(563, 'the 61-key model’s depth: drawing default (the 73-key model’s)'),
    h: placeholder(225, 'the 61-key model’s height: drawing default (the 73-key model’s)'),
    jackProv: src('RH-S61', 'Single jack output'),
    passiveProv: src('RH-S61', 'Classic Passive Circuitry: No external power required … Designed to be used with an amplifier, DI box, or preamp.'),
  },
  /** Key tops above the floor, on the instrument's legs. */
  keyTop: placeholder(720, 'key-top height above the floor on the legs: drawing default 720'),
  /** The keyboard stands this far to the amp's side on the stage plan. */
  sideBySide: placeholder(1500, 'the keyboard 1500 mm to the amp’s side on the plan: drawing default (GEOMETRY_PROPOSAL §1)'),
} as const;

/** One note's mechanism (the inside view only — drawn, never opened). */
export const TINE = {
  /** The replacement tine's length — ONE note's; real tines vary by note. */
  tineL: { mm: 4.375 * IN, prov: trial('RH-SM79', 'replacement tine kit "with the Tine 4-3/8 inches (111.125 mm) in length" — one note; the tine chart was not read') } as Dim,
  /** "the ideal Escapement for the most responsive touch is 1/32" (0.794mm)". */
  escapement: { mm: IN / 32, prov: src('RH-SM79', 'the ideal Escapement for the most responsive touch is 1/32" (0.794mm)') } as Dim,
  /** Hammer-tip height of the lowest group (tips 1–30). */
  hammerTip: { mm: IN / 4, prov: src('RH-SM79', 'hammer-tip heights 1/4" (6.350mm) for tips 1–30') } as Dim,
  tonebarL: placeholder(95, 'the tonebar’s length for this note: drawing default 95'),
  tineD: placeholder(2.4, 'the tine’s diameter: drawing default 2.4'),
  pickupD: placeholder(13, 'the pickup head’s diameter: drawing default 13'),
  /** The gap from the tine's resting line to the pickup head's face. */
  pickupGap: placeholder(3, 'the tine-to-pickup gap: drawing default 3 (voicing varies; never adjusted in this lesson)'),
  /** The physical path, in the maker's words (internal record). */
  pathProv: src('RH-SM79', '"the Tone is produced by a series of modified tuning forks (one for each note) referred to as "Tone Bar Assemblies." Each such assembly lies adjacent to an adjustable Pickup." "The lower, more resilient leg (Tine) responds visibly to the blow of a Hammer … The upper leg (Tone Bar), while not so visible, does vibrate at the same frequency."'),
  componentsProv: src('RH-MK8-UG', '"Rhodes custom precision steel tines and tonebars"; "Rhodes custom precision- wound alnico pickups … flat-ended pickup heads"'),
  spacingProv: src('RH-MK8-UG', 'be careful not to place the pickup too close to the tines … the magnetic field of the pickup can induce upwards pitch change on the lower longer tines … the tine can come into contact with the pickup head causing a nasty metallic clank'),
} as const;

/** The 73-key active model's outputs (taught as kinds, never by name). */
export const RHODES_OUTPUTS = {
  xlr: src('RH-MK8-UG', 'XLR OUTPUTS (BALANCED) Plug these into any MIC level inputs (Mixer, Mic Pre etc)'),
  jacks: src('RH-MK8-UG', '1/4 INCH JACK OUTPUTS (UNBALANCED) Connect the left jack only for mono or both the left and right jacks for stereo output.'),
  send: src('RH-MK8-UG', 'SEND jack for a direct from pickup signal'),
  all: src('RH-MK8-UG', 'All outputs (jacks, XLR’s & Send) can be used simultaneously.'),
  pan: src('RH-MK8', 'Rhodes custom vari-pan with variable rate/depth'),
} as const;

/* ══════════ the reed piano (I11b) ══════════ */

/** The 4 × 8 in oval speaker: the one new driver in the speaker family. */
const K_MINOR = speakerScale(4);
const K_MAJOR = speakerScale(8);
export const SPEAKER_OVAL_4x8 = {
  minor: { mm: 4 * IN, prov: src('VV-200A', 'two 4×8 speakers') } as Dim,
  major: { mm: 8 * IN, prov: src('VV-200A', 'two 4×8 speakers') } as Dim,
  kMinor: K_MINOR,
  kMajor: K_MAJOR,
  /** The visible cone opening's semi-axes (the 12 in reference's proportions). */
  aCone: SPEAKER_12.rCone.mm * K_MAJOR,
  bCone: SPEAKER_12.rCone.mm * K_MINOR,
  /** The surround's inner edge, semi-axes. */
  aSur: SPEAKER_12.rSurroundIn.mm * K_MAJOR,
  bSur: SPEAKER_12.rSurroundIn.mm * K_MINOR,
  /** The dust cap, semi-axes (scaled on each axis separately). */
  aDust: SPEAKER_12.rDust.mm * K_MAJOR,
  bDust: SPEAKER_12.rDust.mm * K_MINOR,
  /** The frame's outer semi-axes. */
  aFrame: (SPEAKER_12.dFrame.mm / 2) * K_MAJOR,
  bFrame: (SPEAKER_12.dFrame.mm / 2) * K_MINOR,
  /** Depths (cone, magnet) on the geometric mean of the two scales. */
  kDepth: Math.sqrt(K_MINOR * K_MAJOR),
  depthProv: { kind: 'unknown', needed: 'the oval speaker’s cone depth, dust cap and magnet: drawing defaults scaled from the 12 in reference (each axis separately; depths on the mean scale)' } as Provenance,
} as const;

/** The three lateral spots along the oval's LONG axis (centre → outward). */
export const OVAL_SPOTS = {
  centre: 0,
  /** "off-center": about half the long semi-axis (drawing default). */
  off: (SPEAKER_OVAL_4x8.major.mm / 2) * 0.5,
  /** Toward the outer end: 10 mm inside the surround (as the 12 in edge spot). */
  out: SPEAKER_OVAL_4x8.aSur - 10 * K_MAJOR,
} as const;

/**
 * FRAME W (the reed piano). mm. Origin = the floor point under the centre of
 * the keyboard's front edge; +x toward the PLAYER (the speakers face the
 * player); +y DOWN (floor y = 0); +z toward the treble. Every size is a
 * DRAWING DEFAULT (wurlitzer/GEOMETRY_PROPOSAL.md: "instrument size UNKNOWN").
 */
export const WURLI = {
  w: placeholder(1020, 'case width: drawing default 1020 (instrument size UNKNOWN: the service manual has no text layer)'),
  d: placeholder(500, 'case depth: drawing default 500'),
  h: placeholder(230, 'case height: drawing default 230'),
  keyTop: placeholder(720, 'key-top height above the floor on the legs: drawing default 720'),
  keyLen: placeholder(140, 'the keys’ visible length in front of the lid: drawing default 140'),
  /** Keys drawn as a pattern only (64 in retailer snippets, Low): never stated. */
  keysDrawn: placeholder(64, 'key count (64 in retailer snippets, Low confidence): drawn as a pattern, never stated'),
  lidSetback: placeholder(150, 'the lid’s front face starts 150 mm behind the keys’ front edge: drawing default'),
  spkZ: placeholder(260, 'each speaker 260 mm either side of the centre line: drawing default (grille positions UNKNOWN)'),
  spkTilt: placeholder(20, 'the speakers face the player, tilted 20° up in the lid’s front slope: drawing default'),
  lidPanel: placeholder(6, 'the lid’s panel thickness: drawing default 6'),
  legZ: placeholder(470, 'the legs 470 mm either side of the centre: drawing default'),
  countProv: src('VV-200A', 'two 4×8 speakers'),
  mountProv: src('TF-DIFF', 'The 200 has alnico speakers which are mounted to the amp rail. The 200a has ceramic speakers that are mounted directly to the plastic lid with four flowerhead screws.'),
  rattleProv: src('TF-DIFF', '200a speakers can rattle if they are not firmly screwed in place.'),
  baffleProv: src('TF-DIFF', 'Mounting the lid … transforms the Wurlitzer’s lid into a speaker baffle … The speakers are also physically closer to the user'),
  layoutProv: src('TF-DIFF', 'The 200 is the first model with the speakers and amplifier in front of the action assembly, instead of behind.'),
  pickupProv: src('TF-REC', 'all Wurlitzers are equipped with an electrostatic pickup, which functions very similarly to a condenser microphone'),
  vibratoProv: src('TF-DIFF', '200: "bias-shifting vibrato"; 200a: "LDR vibrato"; VV-200A: "The 200A had a depth pot on the tremolo"'),
  auxProv: src('TF-REC', '"only the 200 series Wurlitzers are equipped with a usable 1/4" auxiliary output jack"; "The 200A has a trim pot on the bottom near the Aux jack that will control the volume."'),
  speakerOutProv: src('TF-REC', 'you cannot directly connect a Wurlitzer’s speaker output to any line level input … a load box is your solution'),
} as const;

/** One reed and the electrostatic pickup (the inside view only). */
export const REED = {
  reedL: placeholder(60, 'one reed’s length: drawing default 60 (reeds vary by note)'),
  reedW: placeholder(4, 'the reed’s width: drawing default 4'),
  solder: placeholder(5, 'the tuning solder at the reed’s tip: drawing default 5'),
  slot: placeholder(2.5, 'the gap between the reed and each pickup plate: drawing default 2.5'),
  prov: trial('VV-REEDS', 'the reed case study (lesson [2]) and the lesson’s "Hammers excite steel reeds"; no reed dimension was read — drawn as one generic reed'),
} as const;

/* ══════════ the mechanism, as a picture (pure maths, tested) ══════════ */

/** The first bending mode of a clamped–free bar (a tine or a reed): the
 *  shape y(s)/y(1) at s = distance from the clamp ÷ length, 0..1.
 *  Euler–Bernoulli, β₁L = 1.87510407. */
const B1 = 1.87510407;
const SIG = (Math.cosh(B1) + Math.cos(B1)) / (Math.sinh(B1) + Math.sin(B1));
function rawShape(s: number): number {
  const x = B1 * s;
  return Math.cosh(x) - Math.cos(x) - SIG * (Math.sinh(x) - Math.sin(x));
}
const TIP = rawShape(1);
export function cantileverShape(s: number): number {
  const c = Math.max(0, Math.min(1, s));
  return rawShape(c) / TIP;
}

/** What the pickup senses at the tine's tip, as a picture: the tip's
 *  swing (−1..1, drawn far larger than it moves) with a gentle decay over
 *  `cycles` of the hand-swung phase. Silent; nothing loops. */
export function tipSwing(phase: number, strike: number): number {
  return strike * Math.cos(2 * Math.PI * phase) * Math.exp(-0.35 * Math.max(0, phase));
}
