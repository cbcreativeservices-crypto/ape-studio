/**
 * THE WOODWIND FAMILY — what each instrument IS (charter §2 layer 1, pure
 * data; no React). Lab 3 Aerophones, builder group 4: flute (metal Boehm,
 * wooden Boehm, simple-system wooden), piccolo, B♭ clarinet, bass clarinet,
 * oboe and bassoon. Research: docs/labs/miking/BATCH3_RESEARCH_SUMMARY.md,
 * flute/ (the EDGE-TONE family keys, frame F) and soprano_clarinet/ (the
 * REED family keys, frame R), piccolo/, bass_clarinet/, oboe/, bassoon/.
 *
 * Every instrument is a TUBE measured along its own centre line by `s` (mm)
 * from the player's end (the embouchure hole of a flute; the reed's tip of a
 * reed instrument) to the far open end (the foot or the bell). Its pieces,
 * radii and tone holes are given in `s`; windPosture.ts lays the centre line
 * into the lesson frame for a posture, so the drawing, the collisions, the
 * zones and the physics all read the same numbers.
 *
 * Provenance (the internal record; never shown to the learner):
 *   • flute 660 mm long, Ø 19 (PL-2010 §4.1, Y-HUB-PICC "about 26 inches");
 *     embouchure 17 mm from the cork (Y-FL-MECH2);
 *   • piccolo "approximately 13 inches" = 330.2 (Y-HUB-PICC);
 *   • clarinet 629 without the mouthpiece (Met 504044, TRIAL); lowest D3
 *     146.83 Hz (DPA-TABLE);
 *   • oboe 545, bell Ø 57 (Met 504275, TRIAL); smallest tone hole Ø 2
 *     (Y-OB-MAN2); lowest B♭3 233.08 Hz (the modern oboe; DPA's table lists
 *     C4 — D-OB1: the player's part decides, not the table);
 *   • bassoon "around 135 centimeters long … around 260 centimeters if
 *     extended", bore "around 4 millimeters" at the bocal tip to "40
 *     millimeters" at the bell (Y-BSN-MECH); lowest B♭1 58.27 Hz;
 *   • bass clarinet: every dimension UNKNOWN (drawing defaults); low E♭ model
 *     D♭2 69.30 Hz, low C model B♭1 58.27 Hz (Y-YCL622 + PHYS-ET, DERIVED);
 *   • the tone-hole cutoffs (PL-2010; UNSW-FLUTE): flute "a little above
 *     2 kHz", clarinet and oboe 1500 Hz, bassoon 400–500 Hz; bass clarinet
 *     and piccolo: not measured (said in words only).
 * Tone-hole POSITIONS are drawn by the semitone rule (each semitone up, the
 * sounding tube is 2^(−1/12) as long) — DERIVED, a simplified picture: real
 * holes sit a little nearer the player's end (end corrections). Every key,
 * joint and posture dimension not named above is a DRAWING DEFAULT.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
export const dd = (mm: number, reason: string): Dim => ({ mm, prov: ill(`drawing default: ${reason}`) });

export type WindId = 'flute' | 'piccolo' | 'clarinet' | 'bassClarinet' | 'oboe' | 'bassoon';
/** The materials the art paints (each has its own gradient ramp). */
export type Material = 'silver' | 'grenadilla' | 'boxwood' | 'maple' | 'nickel' | 'rubber' | 'cane' | 'cork' | 'ivory';
/** How the air column behaves (the standing waves windPhysics.ts draws). */
export type Bore = 'open' | 'closed' | 'cone';

/** One piece of the tube between s0 and s1 (radius r0 → r1 along it). */
export type Piece = { id: string; label: string; s0: number; s1: number; r0: number; r1: number; mat: Material };
/** A ring (a joint's tenon socket, a key-post band, the bell's rim). */
export type Ring = { s: number; w: number; dr: number; mat: Material };
/** How a tone hole is closed in the drawing: a padded key cup, an open-hole
 *  ring key, or a bare finger hole. */
export type HoleKind = 'key' | 'ring' | 'open';
/** A register: notes k (semitones above the lowest) in [from, to] sound on
 *  resonance `n` of the tube that hole (k − shift) leaves. */
export type Register = { from: number; to: number; n: number; shift: number; name: string };

export type WindSpec = {
  id: WindId;
  name: string;
  family: 'edge' | 'reed';
  bore: Bore;
  /** The overall length the research gives (the drawing's tube, mm). */
  length: Dim;
  /** The far open end (foot or bell rim), in s. */
  end: number;
  pieces: Piece[];
  rings: Ring[];
  /** The tone-hole rule: hole k sits at s = A·2^(−k/12) + B (DERIVED). */
  rule: { A: number; B: number };
  /** Hole indices drawn (k = 1 … holes), each its kind and the side of the
   *  tube it faces (deg about the tube from its key side: 0 = straight out). */
  holes: { k: number; kind: HoleKind; side: number }[];
  /** The lowest SOUNDING note: its MIDI number, name and pitch. */
  lowest: { midi: number; name: string; hz: number; prov: Provenance };
  registers: Register[];
  /** The tone-hole cutoff (Hz), or null when no measurement exists. */
  cutoff: { hz: number | null; words: string; prov: Provenance };
  /** The DPA one-third rule's length U (mm, from the bell end toward the
   *  reed) — reed instruments only. */
  U?: Dim;
  /** The reed (double / single) or the lip plate (flutes). */
  exciter: 'jet' | 'single' | 'double';
};

export const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const midiName = (m: number) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

/* ── the flutes (edge-tone family, frame F: s = 0 at the embouchure hole) ── */

/** Which flute: the lesson's design choice (A06 "identify the design first"). */
export type FluteDesign = 'metal' | 'wooden' | 'simple';

function fluteHoles(design: FluteDesign, n: number): WindSpec['holes'] {
  const out: WindSpec['holes'] = [];
  for (let k = 1; k <= n; k++) {
    // A simple-system flute: six open finger holes (k = 2 … 12, every other
    // semitone through the scale) and a few closed keys; a Boehm flute: a
    // padded cup on every hole, the five left/right-hand ring keys open.
    if (design === 'simple') out.push({ k, kind: [2, 4, 5, 7, 9, 11].includes(k) ? 'open' : 'key', side: [2, 4, 5, 7, 9, 11].includes(k) ? 0 : 35 });
    else out.push({ k, kind: [4, 5, 7, 9, 11].includes(k) ? 'ring' : 'key', side: k <= 2 ? 20 : 0 });
  }
  return out;
}

export function fluteSpec(design: FluteDesign): WindSpec {
  const simple = design === 'simple';
  const mat: Material = design === 'metal' ? 'silver' : simple ? 'boxwood' : 'grenadilla';
  // The cork is 17 mm from the embouchure (Y-FL-MECH2); the crown closes the
  // head joint 12 mm beyond it (drawing default).
  const L = simple ? 583 : 643;
  return {
    id: 'flute',
    name: design === 'metal' ? 'metal concert flute' : design === 'wooden' ? 'wooden concert flute' : 'simple-system wooden flute',
    family: 'edge',
    bore: 'open',
    length: simple ? { mm: 600, prov: { kind: 'unknown', needed: 'a simple-system flute’s length: drawing default 600' }, placeholder: true } : { mm: 660, prov: src('PL-2010', 'an overall length of approx. 660 mm and a diameter of approx. 19 mm') },
    end: L,
    pieces: simple
      ? [
          { id: 'headjoint', label: 'head joint', s0: -29, s1: 150, r0: 9.6, r1: 9.6, mat },
          { id: 'body', label: 'body', s0: 150, s1: L, r0: 11.5, r1: 8.6, mat },
        ]
      : [
          { id: 'headjoint', label: 'head joint', s0: -29, s1: 175, r0: 9.5, r1: 9.5, mat: design === 'metal' ? 'silver' : mat },
          { id: 'body', label: 'body', s0: 175, s1: 525, r0: 9.5, r1: 9.5, mat },
          { id: 'foot', label: 'foot joint', s0: 525, s1: L, r0: 9.5, r1: 9.5, mat },
        ],
    rings: simple
      ? [
          { s: -29, w: 8, dr: 2.2, mat: 'nickel' },
          { s: 150, w: 14, dr: 2.4, mat: 'nickel' },
          { s: L - 6, w: 10, dr: 2, mat: 'nickel' },
        ]
      : [
          { s: -29, w: 10, dr: 1.6, mat: 'silver' },
          { s: 175, w: 12, dr: 1.4, mat: 'silver' },
          { s: 525, w: 12, dr: 1.4, mat: 'silver' },
          { s: L - 5, w: 9, dr: 1.2, mat: 'silver' },
        ],
    // x_k ≈ 655.9·2^(−k/12) − 17 (flute/GEOMETRY_PROPOSAL.md §3: the half-
    // wave length of C4 at 20 °C, minus the cork offset; DERIVED).
    rule: { A: simple ? 596 : 655.9, B: -17 },
    holes: fluteHoles(design, simple ? 12 : 14),
    lowest: simple
      ? { midi: 62, name: 'D4', hz: midiHz(62), prov: ill('a simple-system flute usually stops at D4 (drawing default; the player’s instrument decides)') }
      : { midi: 60, name: 'C4', hz: midiHz(60), prov: src('DPA-TABLE', 'Flute | C¹ (262 Hz) / C⁴ (2093 Hz)') },
    registers: [
      { from: 0, to: 11, n: 1, shift: 0, name: 'FIRST OCTAVE' },
      { from: 12, to: 23, n: 2, shift: 12, name: 'SECOND OCTAVE' },
    ],
    cutoff: simple
      ? { hz: null, words: 'not measured for this design', prov: { kind: 'unknown', needed: 'a simple-system flute’s tone-hole cutoff' } }
      : { hz: 2000, words: 'a little above 2 kHz', prov: src('UNSW-FLUTE', 'The cut-off frequency for the Boehm flute is a little above 2 kHz.') },
    exciter: 'jet',
  };
}

/** The piccolo: half a flute (Y-HUB-PICC), sounding an octave higher. The
 *  17 mm cork offset is the flute's (TRIAL here). A wooden body with silver
 *  keys, the commonest modern build (drawing default). */
export const PICCOLO: WindSpec = {
  id: 'piccolo',
  name: 'piccolo',
  family: 'edge',
  bore: 'open',
  length: { mm: 330.2, prov: src('Y-HUB-PICC', 'The piccolo is half as long, measuring approximately 13 inches.') },
  end: 313,
  pieces: [
    { id: 'headjoint', label: 'head joint', s0: -29, s1: 95, r0: 6.6, r1: 6.6, mat: 'silver' },
    { id: 'body', label: 'body', s0: 95, s1: 313, r0: 7.4, r1: 6.4, mat: 'grenadilla' },
  ],
  rings: [
    { s: -29, w: 7, dr: 1.2, mat: 'silver' },
    { s: 95, w: 9, dr: 1.4, mat: 'silver' },
    { s: 307, w: 7, dr: 1.2, mat: 'silver' },
  ],
  // x_k ≈ 292.2·2^(−k/12) − 17 (piccolo/GEOMETRY_PROPOSAL.md: half-wave D5).
  rule: { A: 292.2, B: -17 },
  holes: Array.from({ length: 12 }, (_, i) => ({ k: i + 1, kind: 'key' as HoleKind, side: 0 })),
  lowest: { midi: 74, name: 'D5', hz: midiHz(74), prov: src('DPA-TABLE', 'Piccolo flute | D² (587 Hz) / C⁵ (4186 Hz)') },
  registers: [
    { from: 0, to: 11, n: 1, shift: 0, name: 'FIRST OCTAVE' },
    { from: 12, to: 23, n: 2, shift: 12, name: 'SECOND OCTAVE' },
  ],
  cutoff: { hz: null, words: 'not measured for the piccolo — its pattern changes with the note too', prov: { kind: 'unknown', needed: 'the piccolo’s tone-hole cutoff (PL-2010 measured the pattern, not the cutoff)' } },
  exciter: 'jet',
};

/* ── the reed family (frame R: s = 0 at the reed's tip) ── */

/** B♭ clarinet: mouthpiece (90, drawing default) + the 629 mm body (Met). */
export const CLARINET: WindSpec = {
  id: 'clarinet',
  name: 'B♭ clarinet',
  family: 'reed',
  bore: 'closed',
  length: { mm: 629, prov: trial('MET-CL', 'L. 62.9 cm (24 3/4 in.) without mouthpiece (1924 Buffet), used as a modern size') },
  end: 719,
  pieces: [
    { id: 'mouthpiece', label: 'mouthpiece and reed', s0: 0, s1: 88, r0: 9, r1: 13.5, mat: 'rubber' },
    { id: 'barrel', label: 'barrel', s0: 88, s1: 150, r0: 15, r1: 14, mat: 'grenadilla' },
    { id: 'upper', label: 'upper joint', s0: 150, s1: 382, r0: 13.6, r1: 13.6, mat: 'grenadilla' },
    { id: 'lower', label: 'lower joint', s0: 382, s1: 600, r0: 14, r1: 14.2, mat: 'grenadilla' },
    { id: 'bell', label: 'bell', s0: 600, s1: 719, r0: 16, r1: 32.5, mat: 'grenadilla' },
  ],
  rings: [
    { s: 72, w: 14, dr: 1.6, mat: 'nickel' },
    { s: 88, w: 5, dr: 1.4, mat: 'nickel' },
    { s: 150, w: 5, dr: 1.2, mat: 'nickel' },
    { s: 382, w: 6, dr: 1.2, mat: 'nickel' },
    { s: 600, w: 6, dr: 1.4, mat: 'nickel' },
    { s: 715, w: 5, dr: 1.4, mat: 'nickel' },
  ],
  rule: { A: 600, B: 0 },
  holes: Array.from({ length: 18 }, (_, i) => {
    const k = i + 1;
    // Seven finger holes (three ring keys on each joint and the thumb hole
    // behind), the rest padded keys (drawing default).
    return { k, kind: ([3, 5, 7, 10, 12, 14] as number[]).includes(k) ? 'ring' : 'key', side: k % 2 ? 25 : -25 } as const;
  }),
  lowest: { midi: 50, name: 'D3', hz: midiHz(50), prov: src('DPA-TABLE', 'Clarinet | D (147 Hz) / E³ (1319 Hz)') },
  // The cylinder closed at the reed overblows a TWELFTH (UNSW-CL): the
  // second register sounds resonance 2 (the 3rd harmonic), 19 semitones up.
  registers: [
    { from: 0, to: 18, n: 1, shift: 0, name: 'LOW REGISTER' },
    { from: 19, to: 33, n: 2, shift: 19, name: 'UPPER REGISTER' },
  ],
  cutoff: { hz: 1500, words: 'about 1.5 kHz', prov: src('PL-2010', 'The reported cutoff frequency of 1500 Hz for the radiation from the tone holes is the same as with the oboe.') },
  U: { mm: 629, prov: trial('MET-CL', 'the body without the mouthpiece; P(U/3) = 209.7 from the bell (DERIVED)') },
  exciter: 'single',
};

/** Oboe: a double reed (drawing default 45 protruding) on the 545 mm body. */
export const OBOE: WindSpec = {
  id: 'oboe',
  name: 'oboe',
  family: 'reed',
  bore: 'cone',
  length: { mm: 545, prov: trial('MET-OB', 'Length: 54.5 cm … Bell diam.: 5.7 cm (ca. 1900), used as a modern size') },
  end: 590,
  pieces: [
    { id: 'reed', label: 'double reed', s0: 0, s1: 45, r0: 3.4, r1: 3.4, mat: 'cane' },
    { id: 'upper', label: 'upper joint', s0: 45, s1: 275, r0: 9.5, r1: 11, mat: 'grenadilla' },
    { id: 'lower', label: 'lower joint', s0: 275, s1: 470, r0: 11.5, r1: 12.5, mat: 'grenadilla' },
    { id: 'bell', label: 'bell', s0: 470, s1: 590, r0: 13.5, r1: 28.5, mat: 'grenadilla' },
  ],
  rings: [
    { s: 45, w: 5, dr: 1.4, mat: 'nickel' },
    { s: 275, w: 5, dr: 1.2, mat: 'nickel' },
    { s: 470, w: 5, dr: 1.2, mat: 'nickel' },
    { s: 586, w: 4, dr: 1.2, mat: 'nickel' },
  ],
  rule: { A: 490, B: 0 },
  holes: Array.from({ length: 19 }, (_, i) => {
    const k = i + 1;
    return { k, kind: ([4, 6, 8, 11, 13, 15] as number[]).includes(k) ? 'ring' : 'key', side: k % 2 ? 22 : -22 } as const;
  }),
  lowest: { midi: 58, name: 'B♭3', hz: midiHz(58), prov: ill('the modern oboe’s B♭3 (233.08 Hz, DERIVED); DPA-TABLE lists C4 — D-OB1') },
  registers: [
    { from: 0, to: 11, n: 1, shift: 0, name: 'FIRST OCTAVE' },
    { from: 12, to: 24, n: 2, shift: 12, name: 'SECOND OCTAVE' },
  ],
  cutoff: { hz: 1500, words: 'about 1.5 kHz', prov: src('PL-2010', '1500 Hz is seen as the cutoff frequency for the oboe') },
  U: { mm: 545, prov: trial('MET-OB', 'P(U/3) = 181.7 from the bell (DERIVED)') },
  exciter: 'double',
};

/**
 * Bassoon: the bore UNFOLDED from the reed's tip (Y-BSN-MECH: 260 cm
 * unfolded, 135 cm tall). Reed 55 + bocal 290 + wing joint 500 (down) + the
 * boot's down bore 390, its U-turn 70 and up bore 390 + long joint 610 (up)
 * + bell 350 (up) = 2655 (bore 2600 without the reed). The split between the
 * pieces is a drawing default; the totals are sourced.
 */
export const BASSOON_S = { reed: 55, bocal: 345, wing: 845, bootDown: 1235, turn: 1305, bootUp: 1695, long: 2305, bell: 2655 } as const;
export const BASSOON: WindSpec = {
  id: 'bassoon',
  name: 'bassoon',
  family: 'reed',
  bore: 'cone',
  length: { mm: 1350, prov: src('Y-BSN-MECH', 'around 135 centimeters long … would reach around 260 centimeters if extended') },
  end: BASSOON_S.bell,
  pieces: [
    { id: 'reed', label: 'double reed', s0: 0, s1: BASSOON_S.reed, r0: 4.6, r1: 4.6, mat: 'cane' },
    { id: 'bocal', label: 'bocal', s0: BASSOON_S.reed, s1: BASSOON_S.bocal, r0: 3.4, r1: 5.4, mat: 'nickel' },
    { id: 'wing', label: 'wing joint', s0: BASSOON_S.bocal, s1: BASSOON_S.wing, r0: 17, r1: 19, mat: 'maple' },
    { id: 'boot', label: 'boot joint', s0: BASSOON_S.wing, s1: BASSOON_S.bootUp, r0: 19, r1: 22, mat: 'maple' },
    { id: 'long', label: 'long joint', s0: BASSOON_S.bootUp, s1: BASSOON_S.long, r0: 17.5, r1: 19, mat: 'maple' },
    { id: 'bell', label: 'bell joint', s0: BASSOON_S.long, s1: BASSOON_S.bell, r0: 19.5, r1: 24, mat: 'maple' },
  ],
  rings: [
    { s: BASSOON_S.bocal + 6, w: 12, dr: 2.6, mat: 'nickel' },
    { s: BASSOON_S.wing - 8, w: 12, dr: 2.6, mat: 'nickel' },
    { s: BASSOON_S.long, w: 12, dr: 2.4, mat: 'nickel' },
    { s: BASSOON_S.bell - 10, w: 20, dr: 2.2, mat: 'ivory' },
  ],
  // A cone from the reed: hole k at 2655·2^(−k/12) (DERIVED) — the bell for
  // the first notes, then down the long joint, the boot and the wing joint:
  // "sound emerges from farther down the instrument as the pitch becomes
  // higher" (Y-BSN-MECH4). A = 2614 (drawing default) keeps every hole off
  // the boot's U-turn (1235–1305): hole 12 just above it, hole 13 just below.
  rule: { A: 2614, B: 0 },
  holes: Array.from({ length: 21 }, (_, i) => {
    const k = i + 1;
    return { k, kind: k >= 15 ? 'open' : 'key', side: k >= 15 ? 0 : 20 } as const;
  }),
  lowest: { midi: 34, name: 'B♭1', hz: midiHz(34), prov: src('DPA-TABLE', 'Bassoon | Bb (58.3 Hz) / C² (523 Hz)') },
  registers: [
    { from: 0, to: 20, n: 1, shift: 0, name: 'LOW REGISTER' },
    { from: 21, to: 31, n: 2, shift: 12, name: 'UPPER REGISTER' },
  ],
  cutoff: { hz: 450, words: 'around 400–500 Hz', prov: src('PL-2010', 'The reported cutoff frequency related to the sound radiation from the finger holes is around 400–500 Hz') },
  U: { mm: 1350, prov: src('Y-BSN-MECH', 'the visible length; P(U/3) = 450 below the bell top (DERIVED)') },
  exciter: 'double',
};

/** Bass clarinet: which model (the lesson's variant). The low C model's
 *  extension adds the tube of three semitones (×2^(3/12), DERIVED): 250 mm,
 *  drawn on the lower joint (150) and a deeper bow (100) — the proposal's +120
 *  drawing default re-derived (corrections log A8B-04). */
export type BassClarinetModel = 'eflat' | 'lowc';
export const BCL_EXT = 250;
export function bassClarinetSpec(model: BassClarinetModel): WindSpec {
  const x = model === 'lowc' ? BCL_EXT : 0;
  const end = 1350 + x;
  // The low C model's 250 mm: 110 on the lower joint, 140 in a deeper bow.
  const lowerEnd = 1000 + (model === 'lowc' ? 150 : 0);
  const bowEnd = lowerEnd + 170 + (model === 'lowc' ? 100 : 0);
  return {
    id: 'bassClarinet',
    name: model === 'lowc' ? 'bass clarinet (to low C)' : 'bass clarinet (to low E♭)',
    family: 'reed',
    bore: 'closed',
    length: { mm: end, prov: { kind: 'unknown', needed: 'the bass clarinet’s length: drawing default 1350 incl. the neck (+250 for the low C model, DERIVED)' }, placeholder: true },
    end,
    pieces: [
      { id: 'mouthpiece', label: 'mouthpiece and reed', s0: 0, s1: 95, r0: 11, r1: 16, mat: 'rubber' },
      { id: 'neck', label: 'neck', s0: 95, s1: 330, r0: 11, r1: 12.5, mat: 'nickel' },
      { id: 'upper', label: 'upper joint', s0: 330, s1: 660, r0: 19.5, r1: 19.5, mat: 'grenadilla' },
      { id: 'lower', label: 'lower joint', s0: 660, s1: lowerEnd, r0: 19.5, r1: 20, mat: 'grenadilla' },
      { id: 'bow', label: 'bow', s0: lowerEnd, s1: bowEnd, r0: 21, r1: 24, mat: 'nickel' },
      { id: 'bell', label: 'bell', s0: bowEnd, s1: end, r0: 26, r1: 55, mat: 'nickel' },
    ],
    rings: [
      { s: 80, w: 14, dr: 1.8, mat: 'nickel' },
      { s: 330, w: 8, dr: 2, mat: 'nickel' },
      { s: 660, w: 8, dr: 2, mat: 'nickel' },
      { s: lowerEnd, w: 10, dr: 2.2, mat: 'nickel' },
      { s: end - 4, w: 6, dr: 1.6, mat: 'nickel' },
    ],
    // The low C model's three extra semitones: A × 2^(3/12) (DERIVED).
    rule: { A: model === 'lowc' ? 1040 * 2 ** (3 / 12) : 1040, B: 0 },
    holes: Array.from({ length: 18 }, (_, i) => {
      const k = i + 1;
      return { k, kind: ([3, 5, 7, 10, 12, 14] as number[]).includes(k) ? 'ring' : 'key', side: k % 2 ? 25 : -25 } as const;
    }),
    lowest:
      model === 'lowc'
        ? { midi: 34, name: 'B♭1', hz: midiHz(34), prov: src('Y-YCL622', 'extended to low C on this top-of-the-line bass clarinet (written C sounds B♭1, DERIVED)') }
        : { midi: 37, name: 'D♭2', hz: midiHz(37), prov: ill('the low E♭ model: written E♭ sounds D♭2 = 69.30 Hz (DERIVED)') },
    registers: [
      { from: 0, to: 18, n: 1, shift: 0, name: 'LOW REGISTER' },
      { from: 19, to: 30, n: 2, shift: 19, name: 'UPPER REGISTER' },
    ],
    cutoff: { hz: null, words: 'not measured for the bass clarinet', prov: { kind: 'unknown', needed: 'PL-2010: "the directivity is predicted to be different … not investigated here"' } },
    U: { mm: end, prov: ill('the whole length incl. the neck (drawing default)') },
    exciter: 'single',
  };
}

/** The radius of the tube at s (the piece containing it; flared bells). */
export function radiusAt(spec: WindSpec, s: number): number {
  const p = spec.pieces.find((q) => s >= q.s0 && s <= q.s1) ?? (s < spec.pieces[0].s0 ? spec.pieces[0] : spec.pieces[spec.pieces.length - 1]);
  const t = Math.max(0, Math.min(1, (s - p.s0) / Math.max(1e-6, p.s1 - p.s0)));
  // A bell flares quickly at its mouth (an exponential-looking curve).
  const flare = p.id === 'bell' ? t ** 2.6 : t;
  return p.r0 + (p.r1 - p.r0) * flare;
}

/** What the far end is called: a flute’s foot joint, a piccolo’s or a
 *  simple-system flute’s plain open end, a reed instrument’s bell. */
export function endWordOf(spec: WindSpec): string {
  if (spec.family !== 'edge') return 'bell';
  return spec.pieces.some((p) => p.id === 'foot') ? 'foot' : 'open end';
}

/** Where tone hole k sits along the tube (the semitone rule, DERIVED). */
export function holeS(spec: WindSpec, k: number): number {
  return spec.rule.A * 2 ** (-k / 12) + spec.rule.B;
}

/** A hole's drawn radius: the oboe's smallest is Ø 2 (Y-OB-MAN2); the others
 *  grow toward the far end (drawing default). */
export function holeR(spec: WindSpec, k: number): number {
  const n = spec.holes.length;
  const t = 1 - (k - 1) / Math.max(1, n - 1); // 1 near the end, 0 at the top
  const base = { flute: [3.2, 7], piccolo: [2.2, 3.6], clarinet: [3, 6.5], bassClarinet: [4.5, 10], oboe: [1, 4.5], bassoon: [3.5, 7.5] }[spec.id];
  return base[0] + (base[1] - base[0]) * t;
}
