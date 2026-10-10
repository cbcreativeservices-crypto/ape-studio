/**
 * THE SHARED GUITAR BODY FAMILY — the numbers (charter §2 layer 1). One
 * parametric description of a plucked, fretted string instrument with a
 * radiating top: the steel six-string, the twelve-string, the nylon-string,
 * the acoustic bass guitar, the resonator guitar, the banjo (a membrane top),
 * the mandolin and the ukulele. Source keys point into docs/labs/miking/
 * acoustic_guitar/SOURCES.md (§0 shared keys, §b bodies) and each lesson's
 * own folder; the geometry follows acoustic_guitar/GEOMETRY_PROPOSAL.md §2 and
 * §7 (frame G) and the per-lesson proposals.
 *
 * FRAME G (proposal §1): origin G0 = the saddle centre on the top plane;
 * +x along the strings toward the nut; +y across the top toward the TREBLE
 * string (in playing posture that side faces the floor, so +y ≈ down); +z
 * out of the top, toward the listener and the mic. The back is at z = −depth.
 *
 * Every UNKNOWN the drawing needs is a DRAWING DEFAULT (`placeholder: true`),
 * never a readout. Where a body's bout stations are not given, they are
 * placed by the steel dreadnought's drawing-default PROPORTIONS (stations as
 * fractions of the body length) — a rule, recorded in `stationsBy`, so no
 * new number is invented per instrument. Pure data and arithmetic: no React.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

export const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const S = (mm: number, s: string, quote: string): Dim => ({ mm, prov: src(s, quote) });
const T = (mm: number, s: string, note: string): Dim => ({ mm, prov: trial(s, note) });
/** A drawing default, not a published figure. */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });
const derived = (mm: number, how: string): Dim => ({ mm, prov: { kind: 'illustrative', reason: `DERIVED: ${how}` } });

/** Fret n's distance from the SADDLE (PHYS-ET): L·2^(−n/12). */
export function fretX(L: number, n: number): number {
  return L * Math.pow(2, -n / 12);
}
/** Fret n's distance from the NUT: L·(1 − 2^(−n/12)). */
export function fretFromNut(L: number, n: number): number {
  return L * (1 - Math.pow(2, -n / 12));
}

export type OpeningKind = 'round' | 'oval' | 'fholes' | 'coverplate' | 'head';
export type BridgeKind = 'pin' | 'tieblock' | 'floating' | 'spider' | 'biscuit' | 'banjo';
export type HeadKind = 'solid' | 'slotted' | 'banjo' | 'scroll' | 'paddle';
export type Outline = 'guitar' | 'teardrop' | 'round';

export type GuitarSpec = {
  id: string;
  /** "steel-string dreadnought" — the drawing's subject, in words. */
  name: string;
  /** Scale length: saddle to nut (the longest string for a banjo). */
  scale: Dim;
  /** The fret at the body edge (14, 12, 17), or the edge x itself when no
   *  fret is given (`edgeX`). */
  jointFret?: Dim;
  edgeX?: Dim;
  /** Frets drawn on the fingerboard (beyond the edge they sit on the top). */
  frets: number;
  outline: Outline;
  body: {
    length: Dim;
    lower: Dim;
    waist: Dim;
    upper: Dim;
    depth: Dim;
    /** Bout stations along x (lower max, waist min, upper max). */
    xLower: Dim;
    xWaist: Dim;
    xUpper: Dim;
    /** A Venetian cutaway on the treble side of the upper bout. */
    cutaway?: boolean;
    /** A round pot (banjo): its centre x and diameter. */
    pot?: { cx: Dim; d: Dim };
  };
  opening: { kind: OpeningKind; x: Dim; d: Dim; d2?: Dim; ports?: { x: Dim; y: Dim; d: Dim } };
  bridge: { kind: BridgeKind; x: Dim; w: Dim; l: Dim };
  /** The resonator's cone(s), under the coverplate. */
  cone?: { d: Dim; x: Dim };
  pickguard: boolean;
  neck: { nutW: Dim; edgeW: Dim; head: HeadKind; headLen: Dim; tuners: number };
  strings: { courses: number; perCourse: 1 | 2; nylon: boolean; spreadSaddle: Dim; wound: number };
  /** String height over the top at the saddle and at the body edge. */
  stringH: { saddle: Dim; edge: Dim };
  /** The banjo's fifth string: its length from the bridge (the peg's x). */
  fifth?: Dim;
  /** The banjo's head hooks (brackets) around the pot. */
  hooks?: Dim;
  /** The banjo's resonator behind the pot (absent: open back). */
  resonatorBack?: { d: Dim; depth: Dim };
  /** How the stations were placed when no source gives them. */
  stationsBy?: 'drawing default' | 'steel proportions';
};

/* ── the steel dreadnought (proposal §2), the reference for the proportions ── */
const STEEL_L = 25.5 * IN; // 647.7
const STEEL_EDGE = fretX(STEEL_L, 14); // 288.52
const STEEL_LEN = 20 * IN; // 508
const STEEL_TAIL = STEEL_EDGE - STEEL_LEN;
/** The dreadnought's drawing-default stations as fractions of its body length
 *  (−67, 60, 187 on a 508 mm body from x = −219.48: about 0.30, 0.55 and
 *  0.80 of the body from the tail; art pass 2026-10-10, was −110, 60, 220). */
export const STEEL_PROPORTIONS = {
  lower: (-67 - STEEL_TAIL) / STEEL_LEN,
  waist: (60 - STEEL_TAIL) / STEEL_LEN,
  upper: (187 - STEEL_TAIL) / STEEL_LEN,
  waistToLower: 280.99 / 406.4,
  upperToLower: 292 / 406.4,
};
/** Stations by the steel proportions for a body of `length` ending at `edge`. */
function stationsFor(edge: number, length: number, why: string) {
  const tail = edge - length;
  const at = (f: number) => derived(Math.round((tail + f * length) * 10) / 10, `${why}: the steel dreadnought's station fractions × ${length} mm`);
  return { xLower: at(STEEL_PROPORTIONS.lower), xWaist: at(STEEL_PROPORTIONS.waist), xUpper: at(STEEL_PROPORTIONS.upper) };
}

export const STEEL_DREAD: GuitarSpec = {
  id: 'steel',
  name: 'steel-string dreadnought',
  scale: S(STEEL_L, 'TAY-DN', 'Scale length 25-1/2"'),
  jointFret: T(14, 'MAR-HD12', 'TAY-DN does not state it; borrowed from "D-14 Fret (Dreadnought)"'),
  frets: 20,
  outline: 'guitar',
  body: {
    length: S(STEEL_LEN, 'TAY-DN', 'Body Length 20"'),
    lower: S(16 * IN, 'TAY-DN', 'Body Width 16"'),
    waist: S(11.0625 * IN, 'TAY-DN', 'Waist 11-1/16"'),
    upper: dd(292, 'upper-bout width'),
    depth: S(4.625 * IN, 'TAY-DN', 'Depth from soundhole 4-5/8"'),
    // Stations (art pass 2026-10-10): a dreadnought is widest about 0.30 of
    // its length from the tail, narrowest about 0.55, its upper bout widest
    // about 0.80 (a 20 in body: ~6 in, ~11 in, ~16 in from the tail).
    xLower: dd(-67, 'lower-bout station'),
    xWaist: dd(60, 'waist station'),
    xUpper: dd(187, 'upper-bout station'),
  },
  opening: { kind: 'round', x: dd(185, 'soundhole centre'), d: dd(100, 'soundhole diameter') },
  bridge: { kind: 'pin', x: dd(-8, 'bridge plate centre'), w: dd(150, 'bridge plate width (across)'), l: dd(30, 'bridge plate length (along)') },
  pickguard: true,
  neck: { nutW: dd(43, 'nut width'), edgeW: dd(55, 'fingerboard width at the body edge'), head: 'solid', headLen: dd(190, 'headstock length'), tuners: 3 },
  strings: { courses: 6, perCourse: 1, nylon: false, spreadSaddle: dd(54, 'outer string spread at the saddle'), wound: 4 },
  stringH: { saddle: dd(12, 'string height over the top at the saddle'), edge: dd(18, 'string height over the top at the body edge') },
  stationsBy: 'drawing default',
};

const TWELVE_L = 24.9 * IN; // 632.46
export const TWELVE_HD: GuitarSpec = {
  ...STEEL_DREAD,
  id: 'twelve',
  name: 'twelve-string dreadnought',
  scale: S(TWELVE_L, 'MAR-HD12', 'Scale Length: 24.9"'),
  jointFret: S(14, 'MAR-HD12', 'Neck Joins Body At: 14th Fret'),
  frets: 20,
  body: { ...STEEL_DREAD.body, length: T(STEEL_LEN, 'TAY-DN', 'HD12-28 body sizes not given: the Taylor dreadnought'), lower: T(16 * IN, 'TAY-DN', 'as the steel dreadnought'), waist: T(11.0625 * IN, 'TAY-DN', 'as the steel dreadnought'), depth: T(4.625 * IN, 'TAY-DN', 'as the steel dreadnought') },
  neck: { nutW: S(1.8125 * IN, 'MAR-HD12', 'Nut Width 1 13/16"'), edgeW: dd(58, 'fingerboard width at the body edge'), head: 'solid', headLen: dd(230, 'twelve-string headstock length'), tuners: 6 },
  strings: { courses: 6, perCourse: 2, nylon: false, spreadSaddle: S(2.3125 * IN, 'MAR-HD12', 'String Spacing 2 5/16"'), wound: 4 },
};

export const NYLON_C5: GuitarSpec = {
  id: 'nylon',
  name: 'nylon-string classical guitar',
  scale: S(650, 'ELD-C5', 'Scale 650 mm'),
  jointFret: S(12, 'ELD-C5', 'Joins at the 12th fret'),
  frets: 19,
  outline: 'guitar',
  body: {
    length: S(19.25 * IN, 'ELD-C5', 'Length 19-1/4"'),
    lower: S(14.625 * IN, 'ELD-C5', 'Width 14-5/8"'),
    waist: dd(235, 'classical waist width'),
    upper: dd(280, 'classical upper-bout width'),
    depth: S(4 * IN, 'ELD-C5', 'Depth 4"'),
    // Stations (art pass 2026-10-10): 0.30 / 0.55 / 0.80 of a 19-1/4 in body.
    xLower: dd(-17, 'lower-bout station'),
    xWaist: dd(105, 'waist station'),
    xUpper: dd(227, 'upper-bout station'),
  },
  opening: { kind: 'round', x: dd(225, 'soundhole centre'), d: dd(85, 'soundhole diameter') },
  bridge: { kind: 'tieblock', x: dd(-8, 'tie-block bridge centre'), w: dd(185, 'tie-block bridge width'), l: dd(30, 'tie-block bridge length') },
  pickguard: false,
  neck: { nutW: S(2 * IN, 'ELD-C5', 'Nut 2"'), edgeW: dd(62, 'fingerboard width at the 12th fret'), head: 'slotted', headLen: dd(190, 'headstock length'), tuners: 3 },
  strings: { courses: 6, perCourse: 1, nylon: true, spreadSaddle: dd(58, 'outer string spread at the saddle'), wound: 3 },
  stringH: { saddle: dd(12, 'string height over the top at the saddle'), edge: dd(18, 'string height over the top at the body edge') },
  stationsBy: 'drawing default',
};

/* ── C07 acoustic bass guitar (acoustic_bass_guitar/GEOMETRY_PROPOSAL.md) ── */
const BASS_L = 34 * IN; // 863.6
const BASS_EDGE = fretX(BASS_L, 17); // 323.48
const BASS_LEN = 510;
export const BASS_BC16: GuitarSpec = {
  id: 'bass',
  name: 'acoustic bass guitar (cutaway)',
  scale: S(BASS_L, 'MAR-BC16E', 'Scale Length: 34"'),
  jointFret: S(17, 'MAR-BC16E', 'Neck Joins Body At: 17th Fret'),
  frets: 23,
  outline: 'guitar',
  body: {
    length: dd(BASS_LEN, 'bass body length'),
    lower: dd(406, 'bass lower-bout width'),
    waist: derived(Math.round(406 * STEEL_PROPORTIONS.waistToLower), 'the lower bout × the dreadnought’s waist ratio'),
    upper: derived(Math.round(406 * STEEL_PROPORTIONS.upperToLower), 'the lower bout × the dreadnought’s upper-bout ratio'),
    depth: dd(115, 'bass body depth'),
    ...stationsFor(BASS_EDGE, BASS_LEN, 'bass stations'),
    cutaway: true,
  },
  opening: { kind: 'round', x: dd(225, 'bass soundhole centre'), d: dd(105, 'bass soundhole diameter') },
  bridge: { kind: 'pin', x: dd(-8, 'bridge centre'), w: dd(150, 'bridge width'), l: dd(32, 'bridge length') },
  pickguard: true,
  neck: { nutW: dd(45, 'bass nut width'), edgeW: dd(58, 'fingerboard width at the body edge'), head: 'solid', headLen: dd(200, 'bass headstock length'), tuners: 2 },
  strings: { courses: 4, perCourse: 1, nylon: false, spreadSaddle: dd(58, 'outer string spread at the saddle'), wound: 4 },
  stringH: { saddle: dd(13, 'string height at the saddle'), edge: dd(20, 'string height at the body edge') },
  stationsBy: 'steel proportions',
};

/* ── C03 resonator guitar (resonator_dobro/GEOMETRY_PROPOSAL.md): the steel
 *  dreadnought outline (TRIAL), a coverplate over one 9.5 in cone ── */
export const RESO_SINGLE: GuitarSpec = {
  ...STEEL_DREAD,
  id: 'reso',
  name: 'single-cone resonator guitar',
  scale: T(STEEL_L, 'TAY-DN', 'resonator scale not read: the steel default'),
  // Round 2 (2026-10-10): a wood-body resonator's neck meets the body at the
  // 12th fret (12 frets clear), so the body sits 35 mm nearer the nut than a
  // 14-fret dreadnought's and the coverplate lies well inside the lower bout.
  // The outline stays the dreadnought's (the lesson's own words say so).
  jointFret: dd(12, 'resonator neck joint: 12 frets clear (the usual wood-body resonator)'),
  body: { ...STEEL_DREAD.body, length: T(STEEL_LEN, 'TAY-DN', 'resonator bodies not sourced: the steel dreadnought outline'), lower: T(16 * IN, 'TAY-DN', 'as the steel'), waist: T(11.0625 * IN, 'TAY-DN', 'as the steel'), depth: T(4.625 * IN, 'TAY-DN', 'as the steel') },
  opening: { kind: 'coverplate', x: dd(-30, 'cone centre'), d: dd(270, 'coverplate diameter'), ports: { x: dd(230, 'upper-bout sound ports'), y: dd(120, 'sound-port offset'), d: dd(60, 'sound-port diameter') } },
  cone: { d: S(9.5 * IN, 'NAT-TECH', '9.5" cone'), x: dd(-30, 'cone centre') },
  bridge: { kind: 'spider', x: dd(-30, 'the bridge on the cone'), w: dd(70, 'resonator bridge width'), l: dd(14, 'resonator bridge length') },
  pickguard: false,
};

/** The round-neck resonator: a biscuit bridge on the single cone (BEARD
 *  lists a 9.5 in biscuit cone); otherwise the same drawing defaults. */
export const RESO_ROUND: GuitarSpec = { ...RESO_SINGLE, id: 'resoRound', name: 'round-neck single-cone resonator guitar', bridge: { ...RESO_SINGLE.bridge, kind: 'biscuit' } };

/* ── C05a banjo (banjo/GEOMETRY_PROPOSAL.md): origin at the bridge foot ── */
// The pot's centre, from the bridge (round 2, 2026-10-10): the bridge sits a
// third of the head's diameter in from the TAIL-side rim, as on a played
// banjo — so the centre is Ø/6 = +47.5 toward the neck, the neck-side rim at
// +190 and the 22nd fret (202.6 from the bridge) just over it. Was −95, which
// put the bridge a sixth of Ø in from the NECK-side rim (the proposal's words,
// "toward the tail", with the sign flipped).
const BANJO_D = 285;
const BANJO_POT_CX = BANJO_D / 6;
export const BANJO_5: GuitarSpec = {
  id: 'banjo',
  name: 'five-string banjo with a resonator',
  scale: S(720, 'MET-BANJO', 'String length: longest: ca. 72 cm'),
  edgeX: derived(BANJO_POT_CX + BANJO_D / 2, 'the pot centre + its radius (the neck meets the rim)'),
  frets: 22,
  outline: 'round',
  body: {
    length: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm'),
    lower: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm'),
    waist: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm'),
    upper: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm'),
    depth: dd(70, 'pot (rim) depth'),
    xLower: dd(BANJO_POT_CX, 'pot centre'),
    xWaist: dd(BANJO_POT_CX, 'pot centre'),
    xUpper: dd(BANJO_POT_CX, 'pot centre'),
    pot: { cx: dd(BANJO_POT_CX, 'pot centre (the bridge a third of Ø in from the tail-side rim)'), d: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm') },
  },
  opening: { kind: 'head', x: dd(BANJO_POT_CX, 'pot centre'), d: S(BANJO_D, 'MET-BANJO', 'Head Diameter ca. 28.5 cm') },
  bridge: { kind: 'banjo', x: dd(0, 'bridge foot (the frame origin)'), w: dd(80, 'banjo bridge width'), l: dd(8, 'banjo bridge thickness') },
  pickguard: false,
  neck: { nutW: dd(32, 'banjo nut width'), edgeW: dd(38, 'fingerboard width at the pot'), head: 'banjo', headLen: dd(170, 'peghead length'), tuners: 2 },
  strings: { courses: 5, perCourse: 1, nylon: false, spreadSaddle: dd(38, 'outer string spread at the bridge'), wound: 1 },
  stringH: { saddle: dd(16, 'string height over the head at the bridge'), edge: dd(14, 'string height at the rim') },
  fifth: S(555, 'MET-BANJO', 'shortest: ca. 55.5 cm'),
  hooks: dd(24, 'head hooks (brackets) round the pot'),
  resonatorBack: { d: dd(330, 'resonator diameter'), depth: dd(40, 'resonator depth behind the pot') },
};

/** The open-back banjo: the same pot and neck, no resonator behind it. */
export const BANJO_OPEN: GuitarSpec = { ...BANJO_5, id: 'banjoOpen', name: 'five-string open-back banjo', resonatorBack: undefined };

/* ── C05b mandolin (mandolin/GEOMETRY_PROPOSAL.md) ── */
const MANDO_LEN = 350;
const MANDO_EDGE = 190;
export const MANDO_A: GuitarSpec = {
  id: 'mandoA',
  name: 'A-style mandolin (oval hole)',
  scale: dd(350, 'mandolin scale'),
  edgeX: dd(MANDO_EDGE, 'where the neck joins the body'),
  frets: 20,
  outline: 'teardrop',
  body: {
    length: dd(MANDO_LEN, 'mandolin body length'),
    lower: S(260, 'MET-A4', 'Overall 26.4 cm wide (A-4); 25.4 cm (F-4)'),
    waist: derived(Math.round(260 * 0.86), 'a teardrop: no waist (drawing default 0.86 × the width)'),
    upper: derived(Math.round(260 * 0.62), 'a teardrop narrowing to the neck (drawing default 0.62 × the width)'),
    depth: dd(45, 'mandolin depth'),
    ...stationsFor(MANDO_EDGE, MANDO_LEN, 'mandolin stations'),
    // A teardrop is widest about 0.42 of its length from the tail (art pass 2026-10-10).
    xLower: dd(Math.round(MANDO_EDGE - MANDO_LEN * 0.58), 'teardrop: widest at 0.42 of the body from the tail'),
  },
  opening: { kind: 'oval', x: dd(110, 'oval hole centre'), d: dd(70, 'oval hole length'), d2: dd(50, 'oval hole width') },
  bridge: { kind: 'floating', x: dd(0, 'floating bridge foot'), w: dd(70, 'mandolin bridge width'), l: dd(10, 'mandolin bridge length') },
  pickguard: true,
  neck: { nutW: dd(28, 'mandolin nut width'), edgeW: dd(34, 'fingerboard width at the body edge'), head: 'paddle', headLen: dd(150, 'mandolin headstock length'), tuners: 4 },
  strings: { courses: 4, perCourse: 2, nylon: false, spreadSaddle: dd(34, 'outer string spread at the bridge'), wound: 2 },
  stringH: { saddle: dd(12, 'string height at the bridge'), edge: dd(12, 'string height at the body edge') },
  stationsBy: 'steel proportions',
};
export const MANDO_F: GuitarSpec = {
  ...MANDO_A,
  id: 'mandoF',
  name: 'F-style mandolin (f-holes, scroll)',
  body: { ...MANDO_A.body, lower: S(254, 'MET-F4', 'Overall 25.4 cm wide (F-4)') },
  opening: { kind: 'fholes', x: dd(25, 'f-hole centre (x −30 … +80)'), d: dd(110, 'f-hole length'), d2: dd(60, 'f-hole offset from the centre line') },
};

/* ── C05c ukulele (ukulele/GEOMETRY_PROPOSAL.md): the soprano default ── */
const UKE_L = 345;
const UKE_EDGE = UKE_L / 2;
const UKE_LEN = 240;
export const UKE_SOPRANO: GuitarSpec = {
  id: 'uke',
  name: 'soprano ukulele',
  scale: S(UKE_L, 'MET-UKE', 'Length (Of string): 13 9/16 in. (34.5 cm)'),
  jointFret: dd(12, 'neck joins at the 12th fret'),
  frets: 12,
  outline: 'guitar',
  body: {
    length: dd(UKE_LEN, 'soprano body length'),
    lower: dd(160, 'soprano lower bout'),
    waist: dd(115, 'soprano waist'),
    upper: dd(130, 'soprano upper bout'),
    depth: dd(60, 'soprano depth'),
    ...stationsFor(UKE_EDGE, UKE_LEN, 'ukulele stations'),
  },
  opening: { kind: 'round', x: dd(120, 'ukulele soundhole centre'), d: dd(50, 'ukulele soundhole diameter') },
  bridge: { kind: 'tieblock', x: dd(-5, 'bridge centre'), w: dd(70, 'ukulele bridge width'), l: dd(16, 'ukulele bridge length') },
  pickguard: false,
  neck: { nutW: dd(35, 'ukulele nut width'), edgeW: dd(42, 'fingerboard width at the body edge'), head: 'solid', headLen: dd(110, 'ukulele headstock length'), tuners: 2 },
  strings: { courses: 4, perCourse: 1, nylon: true, spreadSaddle: dd(40, 'outer string spread at the saddle'), wound: 0 },
  stringH: { saddle: dd(10, 'string height at the saddle'), edge: dd(12, 'string height at the body edge') },
  stationsBy: 'steel proportions',
};

/* ── derived geometry (G frame, mm) ── */
export type GuitarGeom = {
  spec: GuitarSpec;
  L: number;
  edge: number;
  tail: number;
  nut: number;
  fret12: number;
  depth: number;
  /** Half-widths of the bouts. */
  lowerH: number;
  waistH: number;
  upperH: number;
  hole: { x: number; r: number; r2: number };
  /** String height over the top at x (between the saddle and the edge, then
   *  the fingerboard's rise held to the nut). */
  h: (x: number) => number;
  /** The body's half-width at x on the BASS (−y) and TREBLE (+y) side (0
   *  outside the body). */
  halfW: (x: number, side: 'bass' | 'treble') => number;
  /** The fingerboard's half-width at x (on the neck and over the body). */
  boardHalf: (x: number) => number;
  /** Where the fingerboard ends over the body (x, toward the saddle). */
  boardEnd: number;
  /** String k's y at x (k = 0 bass … n−1 treble; a twelve-string pair is
   *  two strings 1.8 mm apart). */
  stringYs: (x: number) => number[];
};

const smooth = (a: number, b: number, t: number) => a + (b - a) * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t)))) / 2;

/** A super-ellipse arc: 1 at t = 0, 0 at |t| = 1 (q = 2 an ellipse; larger, squarer). */
const superArc = (t: number, q: number) => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(t)), q)), 1 / q);
/** A smooth maximum (polynomial, width k): exactly max(a, b) where they differ by more than k. */
const smoothMax = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
};

/**
 * A guitar-family outline (half-width at x): the lower bout a lobe from the
 * tail (super-ellipse, q 2.3: a broad tail) widest at `xl`; the upper bout a
 * lobe widest at `xu`, its shoulders a squarer super-ellipse (q 2.6) closing
 * on the neck block at `edge`; the two lobes' inner flanks are ellipses that
 * meet near `xw`, and a smooth maximum rounds that meeting into the waist.
 * The flanks are solved (bisection) so the narrowest width is `waistH`.
 */
function boutsHalf(tail: number, edge: number, xl: number, xw: number, xu: number, lowerH: number, waistH: number, upperH: number): (x: number) => number {
  const k = Math.max(8, waistH * 0.6);
  const make = (w0: number) => {
    const aL = (xw - xl) / Math.sqrt(Math.max(1e-6, 1 - (Math.min(w0, lowerH * 0.999) / lowerH) ** 2));
    const aU = (xu - xw) / Math.sqrt(Math.max(1e-6, 1 - (Math.min(w0, upperH * 0.999) / upperH) ** 2));
    return (x: number): number => {
      if (x <= tail || x >= edge) return 0;
      const a = x < xl ? lowerH * superArc((xl - x) / (xl - tail), 2.3) : lowerH * Math.sqrt(Math.max(0, 1 - ((x - xl) / aL) ** 2));
      const b = x > xu ? upperH * superArc((x - xu) / (edge - xu), 2.6) : upperH * Math.sqrt(Math.max(0, 1 - ((xu - x) / aU) ** 2));
      return smoothMax(a, b, k);
    };
  };
  const narrowest = (f: (x: number) => number) => {
    let m = Infinity;
    for (let i = 0; i <= 120; i++) m = Math.min(m, f(xl + ((xu - xl) * i) / 120));
    return m;
  };
  let lo = 1;
  let hi = waistH;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (narrowest(make(mid)) > waistH) hi = mid;
    else lo = mid;
  }
  return make((lo + hi) / 2);
}

/**
 * A teardrop (A-style mandolin): one lobe from the tail, widest at `xm`,
 * then a long convex taper (cos^1.3) to about a quarter of the width where
 * the neck joins at `edge` — no waist.
 */
function teardropHalf(tail: number, edge: number, xm: number, W: number): (x: number) => number {
  const s = 0.24;
  return (x: number): number => {
    if (x <= tail || x >= edge) return 0;
    if (x <= xm) return W * superArc((xm - x) / (xm - tail), 2);
    const t = (x - xm) / (edge - xm);
    return W * (s + (1 - s) * Math.pow(Math.cos((Math.PI * t) / 2), 1.3));
  };
}

export function geomOf(spec: GuitarSpec): GuitarGeom {
  const L = spec.scale.mm;
  const edge = spec.edgeX ? spec.edgeX.mm : fretX(L, spec.jointFret!.mm);
  const len = spec.body.length.mm;
  const pot = spec.body.pot;
  const tail = pot ? pot.cx.mm - pot.d.mm / 2 : edge - len;
  const lowerH = spec.body.lower.mm / 2;
  const waistH = spec.body.waist.mm / 2;
  const upperH = spec.body.upper.mm / 2;
  const xl = spec.body.xLower.mm;
  const xw = spec.body.xWaist.mm;
  const xu = spec.body.xUpper.mm;
  const nutHalf = spec.neck.nutW.mm / 2;
  const edgeHalf = spec.neck.edgeW.mm / 2;
  // The fingerboard over the body ends at the soundhole's neck-side edge (a
  // drawing consequence of the soundhole default; frets beyond it are not
  // drawn), or a little in from the rim on a banjo / resonator / f-hole body.
  const op = spec.opening;
  const holeR = op.kind === 'round' ? op.d.mm / 2 : op.kind === 'oval' ? op.d.mm / 2 : 0;
  const boardEnd = op.kind === 'round' || op.kind === 'oval' ? op.x.mm + holeR + 4 : pot ? edge - 4 : Math.max(edge - 70, fretX(L, spec.frets));
  // ART PASS 2026-10-10 — the outline as a luthier draws it: two bouts,
  // each a rounded lobe (a super-ellipse: the lower bout's broad tail, the
  // upper bout's shoulders running round to the neck block), joined by a
  // smooth concave waist whose narrowest width IS the waist figure. A
  // teardrop (A-style mandolin) has no waist: one lobe at its widest, then a
  // long convex taper into the neck. The bouts' widest points stay exactly
  // the lower and upper widths at their stations.
  const halfGuitar = spec.outline === 'teardrop' ? teardropHalf(tail, edge, xl, lowerH) : boutsHalf(tail, edge, xl, xw, xu, lowerH, waistH, upperH);
  const halfW = (x: number, side: 'bass' | 'treble'): number => {
    if (pot) {
      const r = pot.d.mm / 2;
      const dx = x - pot.cx.mm;
      return Math.abs(dx) >= r ? 0 : Math.sqrt(r * r - dx * dx);
    }
    const w = halfGuitar(x);
    if (spec.body.cutaway && side === 'treble') {
      // A Venetian cutaway: the treble upper bout scooped toward the neck.
      const c0 = xw + (xu - xw) * 0.35;
      if (x > c0) return Math.min(w, smooth(w, edgeHalf + 6, (x - c0) / (edge - c0)));
    }
    return w;
  };
  // The fingerboard widens linearly from the nut to the body edge and on
  // over the body at the same taper.
  const slope = (edgeHalf - nutHalf) / Math.max(1, L - edge);
  const boardHalf = (x: number): number => nutHalf + slope * (L - Math.min(L, x));
  const hs = spec.stringH.saddle.mm;
  const he = spec.stringH.edge.mm;
  const h = (x: number) => (x <= 0 ? hs : x >= edge ? he : hs + (he - hs) * (x / edge));
  const n = spec.strings.courses;
  const spreadS = spec.strings.spreadSaddle.mm;
  const spreadN = spec.neck.nutW.mm - 7;
  const stringYs = (x: number): number[] => {
    const t = Math.max(0, Math.min(1, x / L));
    const spread = spreadS + (spreadN - spreadS) * t;
    const out: number[] = [];
    for (let k = 0; k < n; k++) {
      const y = -spread / 2 + (spread * k) / Math.max(1, n - 1);
      if (spec.strings.perCourse === 2) out.push(y - 0.9, y + 0.9);
      else out.push(y);
    }
    return out;
  };
  return {
    spec,
    L,
    edge,
    tail,
    nut: L,
    fret12: L / 2,
    depth: spec.body.depth.mm,
    lowerH,
    waistH,
    upperH,
    hole: { x: op.x.mm, r: op.kind === 'oval' ? op.d.mm / 2 : op.d.mm / 2, r2: op.kind === 'oval' && op.d2 ? op.d2.mm / 2 : op.d.mm / 2 },
    h,
    halfW,
    boardHalf,
    boardEnd,
    stringYs,
  };
}

/** The body outline as a polygon (G frame, x/y), bass side first then the
 *  treble side back to the tail — the art's path and the hit test's polygon. */
export function outlinePoly(g: GuitarGeom, n = 72): [number, number][] {
  const pts: [number, number][] = [];
  if (g.spec.body.pot) {
    const r = g.spec.body.pot.d.mm / 2;
    const cx = g.spec.body.pot.cx.mm;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), r * Math.sin(a)]);
    }
    return pts;
  }
  for (let i = 0; i <= n; i++) {
    const x = g.tail + ((g.edge - g.tail) * i) / n;
    pts.push([x, -g.halfW(x, 'bass')]);
  }
  for (let i = n; i >= 0; i--) {
    const x = g.tail + ((g.edge - g.tail) * i) / n;
    pts.push([x, g.halfW(x, 'treble')]);
  }
  return pts;
}

/** Is (x, y) on the top (inside the outline)? */
export function onBody(g: GuitarGeom, x: number, y: number): boolean {
  return y < 0 ? -y <= g.halfW(x, 'bass') : y <= g.halfW(x, 'treble');
}
