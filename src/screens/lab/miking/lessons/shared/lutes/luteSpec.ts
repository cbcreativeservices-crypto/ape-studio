/**
 * THE SHARED LUTE FAMILY — the numbers (charter §2 layer 1) for Lab 4's
 * three "world plucked" lessons: C13 OUD, C14 SITAR, C15 SARASWATI VEENA.
 * Source keys point into docs/labs/miking/<oud|sitar|veena>/SOURCES.md; the
 * geometry follows each folder's GEOMETRY_PROPOSAL.md.
 *
 * What the research GIVES (and the rest is a drawing default, flagged
 * `placeholder: true`, listed in each lesson's unknowns, never a readout):
 *   • oud: three rosettes (MFA-NAHAT), a fretless neck, the risha. Every
 *     dimension is a drawing default (no oud dimension was read).
 *   • sitar: overall 124.5 × 34.3 × 31 cm (MET-ADHIKARI), 7 melody and 13
 *     sympathetic strings on that instrument.
 *   • veena: overall length 121.5 cm and width 34 cm (MET-506151), four
 *     melody and three tala strings; the resonator, neck and gourd positions
 *     are drawing defaults.
 *
 * Where a proposal's defaults do not add up to a SOURCED overall length (the
 * sitar's neck end at +1080 and the veena's neck to +1000 both overrun it),
 * the sourced length wins and the default is moved; CORRECTIONS_LOG.md
 * records it (C13-C15 entries).
 *
 * Each instrument is described in its OWN frame — origin at the main bridge
 * on the soundboard, +x along the strings toward the pegs, +y across the
 * board, +z out of the board — and placed in the engine frame by its
 * POSTURE (luteModel.ts). Pure data and arithmetic: no React.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

export const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const S = (mm: number, s: string, quote: string): Dim => ({ mm, prov: src(s, quote) });
const T = (mm: number, s: string, note: string): Dim => ({ mm, prov: { kind: 'trial', src: s, note } });
/** A drawing default, not a published figure. */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/** 12-TET: the distance of fret n from the BRIDGE on a string of length L. */
export function fretFromBridge(L: number, semis: number): number {
  return L * Math.pow(2, -semis / 12);
}

/* ═══════════════════════════════ C13 OUD ═══════════════════════════════ */

export const OUD = {
  /** Face (soundboard) length tail → neck joint; the face's widest width. */
  faceLen: dd(490, 'oud face length (proposal default 490)'),
  faceW: dd(360, 'oud face width (proposal default 360)'),
  /** Where the face is widest, as a fraction of its length from the tail. */
  widestAt: dd(0.42, 'where the pear-shaped face is widest (fraction of its length)'),
  bowlDepth: dd(180, 'bowl depth (proposal default 180)'),
  /** The bridge's distance from the tail (the frame origin is the bridge). */
  bridgeFromTail: dd(90, 'bridge position on the face (face 490, joint at 400)'),
  neckLen: dd(200, 'neck length, joint to nut (proposal default 200)'),
  scale: dd(600, 'vibrating length, bridge to nut (proposal default 600)'),
  pegboxDeg: dd(60, 'pegbox bent back from the neck (proposal default 60°)'),
  pegboxLen: dd(190, 'pegbox length'),
  courses: dd(6, 'courses (course count varies — lesson)'),
  strings: dd(11, 'strings: five pairs and a single bass'),
  /** Three rosettes (MFA-NAHAT: "three rosettes … known as shams"). */
  roseCount: S(3, 'MFA-NAHAT', 'three rosettes—the delicate designs covering the instrument’s sound holes… known as shams'),
  roseMainX: dd(230, 'main rosette centre (proposal default x = 230)'),
  roseMainD: dd(90, 'main rosette diameter (proposal default Ø 90)'),
  roseSmallX: dd(120, 'small rosette centres (proposal default x = 120)'),
  roseSmallY: dd(95, 'small rosette offsets (proposal default y = ±95)'),
  roseSmallD: dd(45, 'small rosette diameter (proposal default Ø 45)'),
  bridgeW: dd(130, 'tie-bridge width (across)'),
  bridgeL: dd(16, 'tie-bridge length (along)'),
  bridgeH: dd(9, 'tie-bridge height'),
  boardEnd: dd(290, 'where the fingerboard ends over the face'),
  nutW: dd(42, 'nut width'),
  jointHalf: dd(30, 'neck half-width at the joint'),
  spreadBridge: dd(78, 'outer string spread at the bridge'),
  stringH: dd(12, 'string height over the face'),
  /** Fretless (MFA-NAHAT: "the oud’s fretless neck"). */
  fretless: S(1, 'MFA-NAHAT', 'the oud’s fretless neck'),
} as const;

export type OudGeom = {
  tail: number;
  joint: number;
  nut: number;
  widest: number;
  halfMax: number;
  /** Face half-width at x (0 outside the face). */
  half: (x: number) => number;
  /** Bowl depth at x (on the centre line). */
  depth: (x: number) => number;
  /** Fingerboard half-width at x. */
  boardHalf: (x: number) => number;
  /** The course centres across at x (k = 0 the single bass … 5), and whether each is a pair. */
  courseYs: (x: number) => { y: number; pair: boolean }[];
  pegboxEnd: { x: number; z: number };
};

export function oudGeom(): OudGeom {
  const L = OUD.faceLen.mm;
  const tail = -OUD.bridgeFromTail.mm;
  const joint = tail + L;
  const nut = OUD.scale.mm;
  const widest = tail + OUD.widestAt.mm * L;
  const hm = OUD.faceW.mm / 2;
  const hj = OUD.jointHalf.mm;
  const half = (x: number): number => {
    if (x <= tail || x >= joint) return 0;
    if (x <= widest) return hm * Math.sqrt(Math.max(0, 1 - ((widest - x) / (widest - tail)) ** 2));
    const t = (x - widest) / (joint - widest);
    // A pear: full shoulders, then a taper into the neck heel.
    return hj + (hm - hj) * Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.85);
  };
  // The bowl is deepest where the face is widest (a drawing rule).
  const depth = (x: number): number => (x <= tail || x >= joint ? 0 : OUD.bowlDepth.mm * Math.pow(half(x) / hm, 0.7));
  const nutHalf = OUD.nutW.mm / 2;
  const boardHalf = (x: number): number => {
    const t = Math.max(0, Math.min(1, (x - OUD.boardEnd.mm) / (nut - OUD.boardEnd.mm)));
    return hj + 6 + (nutHalf - hj - 6) * t;
  };
  const courseYs = (x: number) => {
    const t = Math.max(0, Math.min(1, x / nut));
    const spread = OUD.spreadBridge.mm + (OUD.nutW.mm - 8 - OUD.spreadBridge.mm) * t;
    const n = OUD.courses.mm;
    const out: { y: number; pair: boolean }[] = [];
    for (let k = 0; k < n; k++) out.push({ y: -spread / 2 + (spread * k) / (n - 1), pair: k > 0 });
    return out;
  };
  const a = (OUD.pegboxDeg.mm * Math.PI) / 180;
  return { tail, joint, nut, widest, halfMax: hm, half, depth, boardHalf, courseYs, pegboxEnd: { x: nut + OUD.pegboxLen.mm * Math.cos(a), z: OUD.stringH.mm - OUD.pegboxLen.mm * Math.sin(a) } };
}

/* ═══════════════════════════════ C14 SITAR ═══════════════════════════════ */

export const SITAR = {
  /** MET-ADHIKARI: "49 × 13 1/2 × 12 3/16 in. (124.5 × 34.3 × 31 cm)". */
  length: S(1245, 'MET-ADHIKARI', '49 × 13 1/2 × 12 3/16 in. (124.5 × 34.3 × 31 cm)'),
  gourdW: S(343, 'MET-ADHIKARI', '34.3 cm (overall width = the main gourd, proposal)'),
  gourdDepth: S(310, 'MET-ADHIKARI', '31 cm (overall depth = the main gourd, proposal)'),
  gourdCx: dd(-60, 'main gourd centre along the instrument (proposal default x = −60)'),
  tabliR: dd(145, 'the tabli (soundboard) radius where it covers the gourd'),
  neckX0: dd(100, 'where the neck leaves the gourd'),
  neckW: dd(85, 'neck width (proposal default 85)'),
  neckDepth: dd(60, 'neck depth'),
  nut: dd(880, 'the nut (the melody strings’ far end); the proposal’s neck end at +1080 overran the sourced 124.5 cm'),
  frets: dd(19, 'frets (proposal default 19, curved)'),
  fretArch: dd(24, 'fret arch height over the neck'),
  upperGourdD: dd(200, 'upper gourd diameter (proposal default Ø 200)'),
  upperGourdX: dd(860, 'upper gourd position (proposal default +950 moved inside the sourced length)'),
  melody: S(7, 'MET-ADHIKARI', '7 melody and 13 sympathetic strings (lesson, Met)'),
  sympathetic: S(13, 'MET-ADHIKARI', '7 melody and 13 sympathetic strings (lesson, Met)'),
  played: dd(4, 'melody strings that run to the nut (the rest are drones on side pegs)'),
  jawariW: dd(62, 'main bridge (jawari) width'),
  jawariL: dd(30, 'main bridge length'),
  jawariH: dd(22, 'main bridge height'),
  tarafBridgeX: dd(-42, 'sympathetic-string bridge position'),
  tarafPegX0: dd(270, 'first sympathetic-string peg'),
  tarafPegStep: dd(40, 'sympathetic-string peg spacing'),
  /** POSTURE (proposal): "seated on the floor; the gourd rests on the left
   *  foot sole, neck at ~45° up to the player's left; board faces forward". */
  neckDeg: dd(45, 'neck angle (proposal default ~45°)'),
  foot: dd(70, 'the foot under the gourd (gourd above the floor)'),
} as const;

export type SitarGeom = {
  gourd: { cx: number; c: number; a: number; zc: number };
  tabliR: number;
  neck: { x0: number; x1: number; half: number; depth: number };
  nut: number;
  top: number;
  bottom: number;
  frets: number[];
  stringZ: (x: number) => number;
  /** The four played strings' y at x, and the three drones' (to side pegs). */
  playedYs: (x: number) => number[];
  drones: { x: number; y0: number }[];
  /** Sympathetic strings: the bridge-end y and the peg x (on the −y edge). */
  taraf: { y0: number; pegX: number }[];
  upperGourd: { x: number; r: number; z: number };
};

/** The sitar's frets: a diatonic run (W W H W W W H …) on the 12-TET grid —
 *  19 frets, a drawing default for movable frets. */
const DIATONIC = [2, 2, 1, 2, 2, 2, 1];

export function sitarGeom(): SitarGeom {
  const a = SITAR.gourdW.mm / 2;
  // A gourd cut open at the front: an ellipsoid (a, a, c) truncated where its
  // section equals the tabli, total depth 310 (sourced) — c and its centre
  // follow from the two (DERIVED).
  const r0 = SITAR.tabliR.mm;
  const k = Math.sqrt(1 - (r0 / a) ** 2);
  const c = SITAR.gourdDepth.mm / (1 + k);
  const zc = -k * c;
  const cx = SITAR.gourdCx.mm;
  const bottom = cx - a;
  const top = bottom + SITAR.length.mm;
  const L = SITAR.nut.mm;
  // A fret's x is the string length it leaves vibrating (from the bridge).
  const frets = Array.from({ length: SITAR.frets.mm }, (_, i) => fretFromBridge(L, cum(i)));
  const zB = SITAR.jawariH.mm;
  const zN = SITAR.fretArch.mm + 5;
  const stringZ = (x: number) => zB + (zN - zB) * Math.max(0, Math.min(1, x / L));
  const playedYs = (x: number) => {
    const t = Math.max(0, Math.min(1, x / L));
    const spread = 26 + (18 - 26) * t;
    return [0, 1, 2, 3].map((i) => 6 - spread / 2 + (spread * i) / 3);
  };
  const drones = [0, 1, 2].map((i) => ({ x: 560 + 60 * i, y0: 16 + 5 * i }));
  const taraf = Array.from({ length: SITAR.sympathetic.mm }, (_, i) => ({ y0: -28 + (56 * i) / (SITAR.sympathetic.mm - 1), pegX: SITAR.tarafPegX0.mm + SITAR.tarafPegStep.mm * i }));
  return {
    gourd: { cx, c, a, zc },
    tabliR: r0,
    neck: { x0: SITAR.neckX0.mm, x1: top - 8, half: SITAR.neckW.mm / 2, depth: SITAR.neckDepth.mm },
    nut: L,
    top,
    bottom,
    frets,
    stringZ,
    playedYs,
    drones,
    taraf,
    upperGourd: { x: SITAR.upperGourdX.mm, r: SITAR.upperGourdD.mm / 2, z: -SITAR.neckDepth.mm - SITAR.upperGourdD.mm / 2 + 10 },
  };
}
function cum(i: number): number {
  let s = 0;
  for (let k = 0; k <= i; k++) s += DIATONIC[k % DIATONIC.length];
  return s;
}

/* ═══════════════════════════ C15 SARASWATI VEENA ═══════════════════════════ */

export const VEENA = {
  /** MET-506151 "Vina": 37.5 × 121.5 × 34 cm. */
  length: S(1215, 'MET-506151', 'Vina (वीणा): 37.5 × 121.5 × 34 cm'),
  resonatorD: S(340, 'MET-506151', '34 cm (the resonator’s width, proposal)'),
  resonatorDepth: T(300, 'MET-506151', 'the proposal’s depth 300 (37.5 cm overall height includes the supports — Medium)'),
  resonatorCx: dd(-80, 'resonator centre along the instrument (proposal default x = −80)'),
  plateR: dd(150, 'top plate radius: the resonator’s opening, narrower than its rounded belly'),
  neckX0: dd(70, 'where the neck leaves the resonator'),
  neckW: dd(75, 'neck width'),
  neckDepth: dd(70, 'neck depth'),
  nut: dd(860, 'the nut; the proposal’s neck to +1000 overran the sourced 121.5 cm'),
  frets: dd(24, 'frets on wax (proposal default 24)'),
  gourdD: dd(180, 'neck-end gourd diameter (proposal default Ø 180)'),
  gourdX: dd(700, 'neck-end gourd position (proposal default +900 moved inside the sourced length)'),
  melody: S(4, 'MET-505701', 'four melody strings and three open tala strings in one Met example (lesson)'),
  tala: S(3, 'MET-505701', 'four melody strings and three open tala strings in one Met example (lesson)'),
  bridgeW: dd(56, 'main bridge width'),
  bridgeL: dd(30, 'main bridge length'),
  bridgeH: dd(16, 'main bridge height'),
  /** POSTURE (proposal): "seated cross-legged; resonator at the player's
   *  right on the floor, neck to the left resting on the left thigh/gourd,
   *  face angled partly toward the player" (unverified). */
  faceTiltDeg: dd(20, 'the face angled toward the player (unverified posture source)'),
  neckRiseDeg: dd(7, 'the neck rising toward the left thigh'),
} as const;

export type VeenaGeom = {
  /** A round-bellied bowl: an ellipsoid (a, a, c) about (cx, 0, zc), cut at
   *  the plate (z = 0) where its section is the plate's radius. */
  bowl: { cx: number; a: number; c: number; zc: number };
  plateR: number;
  neck: { x0: number; x1: number; half: number; depth: number };
  nut: number;
  tail: number;
  tip: number;
  frets: number[];
  stringZ: (x: number) => number;
  melodyYs: (x: number) => number[];
  /** The tala strings: their side-bridge y and the peg x on the +y side. */
  tala: { y: number; pegX: number }[];
  gourd: { x: number; r: number; z: number };
};

export function veenaGeom(): VeenaGeom {
  const a = VEENA.resonatorD.mm / 2;
  const cx = VEENA.resonatorCx.mm;
  const tail = cx - a;
  const tip = tail + VEENA.length.mm;
  const L = VEENA.nut.mm;
  const frets = Array.from({ length: VEENA.frets.mm }, (_, i) => fretFromBridge(L, i + 1));
  const stringZ = (x: number) => VEENA.bridgeH.mm + 2 * Math.max(0, Math.min(1, x / L));
  const melodyYs = (x: number) => {
    const t = Math.max(0, Math.min(1, x / L));
    const spread = 28 + (20 - 28) * t;
    return [0, 1, 2, 3].map((i) => -spread / 2 + (spread * i) / 3);
  };
  const neckHalf = VEENA.neckW.mm / 2;
  // The belly is wider than the opening the plate covers: c and the centre
  // follow from the width, the depth and the plate (DERIVED, as the sitar's gourd).
  const k = Math.sqrt(1 - (VEENA.plateR.mm / a) ** 2);
  const bc = VEENA.resonatorDepth.mm / (1 + k);
  return {
    bowl: { cx, a, c: bc, zc: -k * bc },
    plateR: VEENA.plateR.mm,
    neck: { x0: VEENA.neckX0.mm, x1: L + 10, half: neckHalf, depth: VEENA.neckDepth.mm },
    nut: L,
    tail,
    tip,
    frets,
    stringZ,
    melodyYs,
    tala: [0, 1, 2].map((i) => ({ y: neckHalf + 10 + 7 * i, pegX: 250 + 55 * i })),
    gourd: { x: VEENA.gourdX.mm, r: VEENA.gourdD.mm / 2, z: -VEENA.neckDepth.mm - VEENA.gourdD.mm / 2 - 12 },
  };
}
