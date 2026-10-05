/**
 * MALLET-BAR FAMILY — the technical truth for Lab 2's mallet keyboards (I07
 * vibraphone, I08 marimba, I09 xylophone, I10 glockenspiel). Pure
 * TypeScript: the tests reach it directly. Research: docs/labs/miking/
 * vibraphone/GEOMETRY_PROPOSAL.md §A (the family) and §B, marimba/,
 * xylophone/, glockenspiel/ (SOURCES.md + GEOMETRY_PROPOSAL.md).
 *
 * FRAME (mm). Origin = the floor under the centre of the keyboard's plan
 * rectangle. +x along the keyboard toward the LOW end (the player's left —
 * the audience's right); +y DOWN (floor y = 0, a height h is y = −h); +z
 * toward the AUDIENCE (away from the player). This is the proposal's frame M
 * relabelled so both engine views (side u = x, v = y; top u = x, v = z) read
 * from the audience side, where an engineer's stands are — the side view is
 * the instrument's front elevation as the audience sees it (low notes on the
 * right), the top view its plan with the audience at the bottom. No
 * dimension changes with the relabel.
 *
 * Value classes (hihat/GEOMETRY_PROPOSAL.md header): SOURCED (a maker's
 * printed figure), DERIVED (computed from sourced figures), TRIAL (a sourced
 * figure from a neighbouring model), DRAWING DEFAULT (a value the picture
 * needs that no source gives — `placeholder`, never a readout).
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';
import { C20 } from '../../../engine/physics/twoMic.ts';

export const IN = 25.4;
export const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
export const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A DRAWING DEFAULT: drawn, never a readout, listed in the lesson's unknowns. */
export const drawingDefault = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });
const sourced = (mm: number, s: string, quote: string): Dim => ({ mm, prov: src(s, quote) });
const trialDim = (mm: number, s: string, note: string): Dim => ({ mm, prov: trial(s, note) });

/* ── the keyboard scale (88-key numbering, A0 = 1; Yamaha prints keys so) ── */
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
/** Semitone above C of key k (C1 = key 4). */
export function pitchClass(k: number): number {
  return (((k - 4) % 12) + 12) % 12;
}
export function isNatural(k: number): boolean {
  return ![1, 3, 6, 8, 10].includes(pitchClass(k));
}
/** "F3", "C♯5" (scientific pitch). */
export function noteName(k: number): string {
  return `${NAMES[pitchClass(k)]}${Math.floor((k + 8) / 12)}`;
}
/** The tuning both makers print: "A=442Hz" (YMH-YV2700, YMH-YX500). */
export const A_TUNING = 442;
/** f(k) = 442 · 2^((k − 49)/12) Hz — equal temperament at the makers' A. */
export function freqHz(k: number): number {
  return A_TUNING * Math.pow(2, (k - 49) / 12);
}
/** The resonator's ACOUSTIC length: a quarter wavelength, L = c / (4 f),
 *  c from the calculator at the lab's 20 °C (YMH-MG2: open under the bar,
 *  closed at the far end — "a pipe twice the length" if open). mm. */
export function quarterWaveMm(k: number): number {
  return (C20 * 1000) / (4 * freqHz(k));
}

/* ── the bar: a free–free uniform beam (Euler–Bernoulli), for HOW IT
 *  SOUNDS. βL are the roots of cos βL · cosh βL = 1; frequency ∝ (βL)².
 *  A PLAIN bar: makers shape real bars to tune their upper shapes. ── */
export const BAR_BETA = [4.730040745, 7.853204624, 10.995607838] as const;
export const BAR_RATIOS = BAR_BETA.map((b) => (b / BAR_BETA[0]) ** 2);
/** The n-th shape (0-based) at ξ ∈ [0, 1] along the bar (unnormalised). */
export function barShape(n: number, xi: number): number {
  const b = BAR_BETA[n];
  const s = (Math.cosh(b) - Math.cos(b)) / (Math.sinh(b) - Math.sin(b));
  const x = b * xi;
  return Math.cosh(x) + Math.cos(x) - s * (Math.sinh(x) + Math.sin(x));
}
/** The shape's largest |value| (at the ends, for a free bar). */
export function barPeak(n: number): number {
  let m = 0;
  for (let i = 0; i <= 400; i++) m = Math.max(m, Math.abs(barShape(n, i / 400)));
  return m;
}
/** Still points (nodes) of the n-th shape, as fractions of the length. */
export function barNodes(n: number): number[] {
  const out: number[] = [];
  const N = 4000;
  let prev = barShape(n, 0);
  for (let i = 1; i <= N; i++) {
    const xi = i / N;
    const cur = barShape(n, xi);
    if (prev === 0 || prev * cur < 0) {
      // bisect
      let a = (i - 1) / N;
      let b = xi;
      for (let k = 0; k < 40; k++) {
        const m = (a + b) / 2;
        if (barShape(n, a) * barShape(n, m) <= 0) b = m;
        else a = m;
      }
      out.push((a + b) / 2);
    }
    prev = cur;
  }
  return out;
}
/** How much a strike at ξ drives shape n: |φ(ξ)| / peak (0 … 1). */
export function barStrikeShare(n: number, xi: number): number {
  return Math.abs(barShape(n, xi)) / barPeak(n);
}

/* ── the parameter rows (vibraphone/GEOMETRY_PROPOSAL.md §A2, §B; the
 *  marimba / xylophone / glockenspiel rows) ── */
export type MalletInst = 'vibe' | 'marimba' | 'xylo' | 'glock';
export type ResKind = 'tube' | 'none';
export type MalletRow = {
  /** The variant id it is drawn in. */
  id: string;
  inst: MalletInst;
  /** The model in words for the internal record (never shown). */
  model: string;
  lowKey: number;
  highKey: number;
  wLow: Dim;
  wHigh: Dim;
  /** Thickness at the low and high end. */
  tLow: Dim;
  tHigh: Dim;
  Lframe: Dim;
  Dlow: Dim;
  Dhigh: Dim;
  /** Height of the naturals' top surface above the floor. */
  hBars: Dim;
  /** The longest bar and the shortest any bar is drawn. */
  LbarLow: Dim;
  LbarMin: Dim;
  res: {
    kind: ResKind;
    /** Tube diameter at the low and high end (capped by the bar pitch). */
    dLow: number;
    dHigh: number;
    /** Keys whose resonator is a Helmholtz box (marimba bass). */
    helmholtzTo?: number;
    /** 'all', or only some accidentals ("only essential accidental resonators"). */
    accidentals: 'all' | 'essential';
    prov: Provenance;
  };
  /** The raised-mallet height above the bars (A5: 350; glockenspiel 250). */
  malletH: Dim;
  /** Where the instrument stands: on its own frame, or a case on a table. */
  stand: 'frame' | 'case';
  extras: { damper?: 'pedal' | 'hand'; fans?: boolean; motor?: boolean; gasSpring?: boolean; lid?: boolean };
  prov: { range: Provenance; footprint: Provenance };
};

const GAP = 6; // DRAWING DEFAULT: the gap between neighbouring naturals (§A3)

export const ROWS = {
  /** I07 — Adams Concert Vibraphone (ADAMS-VIBC), with motor. */
  vibe: {
    id: 'motor',
    inst: 'vibe',
    model: 'Adams Concert Vibraphone, 3.0 octaves',
    lowKey: 33,
    highKey: 69,
    wLow: sourced(57, 'ADAMS-VIBC', 'Bar width : 57 - 38 mm'),
    wHigh: sourced(38, 'ADAMS-VIBC', 'Bar width : 57 - 38 mm'),
    tLow: trialDim(12.7, 'YMH-YV2700', 'Graduating from 1 1/2" - 2 1/4" x 1/2" — a Yamaha bar thickness drawn on the Adams model'),
    tHigh: trialDim(12.7, 'YMH-YV2700', 'Graduating from 1 1/2" - 2 1/4" x 1/2"'),
    Lframe: sourced(1530, 'ADAMS-VIBC', 'Length : 153 cm'),
    Dlow: sourced(750, 'ADAMS-VIBC', 'Low end : 75 cm'),
    Dhigh: sourced(560, 'ADAMS-VIBC', 'High end : 56 cm'),
    hBars: drawingDefault(940, 'the bar height (inside the printed "Adjustable 87-101 cm")'),
    LbarLow: drawingDefault(450, 'bar lengths (no maker prints them: 0.6 × the low-end depth)'),
    LbarMin: drawingDefault(180, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 60, dHigh: 60, accidentals: 'all', prov: src('YMH-HUB-VGC', 'the lower the note, the longer the resonator') },
    malletH: drawingDefault(350, 'how high the mallets rise above the bars'),
    stand: 'frame',
    extras: { damper: 'pedal', fans: true, motor: true },
    prov: { range: src('ADAMS-VIBC', 'Range : 3.0 octaves (F3 – F6)'), footprint: src('ADAMS-VIBC', 'Length : 153 cm; Low end : 75 cm; High end : 56 cm') },
  },
  /** I08 — Adams Alpha 5.0 marimba (ADAMS-ALPHA). */
  marimba50: {
    id: 'oct5',
    inst: 'marimba',
    model: 'Adams Alpha 5.0',
    lowKey: 16,
    highKey: 76,
    wLow: sourced(72, 'ADAMS-ALPHA', 'Bar width : 72 - 40 mm'),
    wHigh: sourced(40, 'ADAMS-ALPHA', 'Bar width : 72 - 40 mm'),
    tLow: trialDim(25.4, 'YMH-YM5100A', '3/4" – 1" thick (a Yamaha model)'),
    tHigh: trialDim(19.05, 'YMH-YM5100A', '3/4" – 1" thick (a Yamaha model)'),
    Lframe: sourced(2550, 'ADAMS-ALPHA', 'Length: 255 cm'),
    Dlow: sourced(1040, 'ADAMS-ALPHA', 'Low end: 104 cm'),
    Dhigh: sourced(560, 'ADAMS-ALPHA', 'High End: 56 cm'),
    hBars: drawingDefault(970, 'the bar height (inside the printed "Height adjustable: 90 – 104 cm")'),
    LbarLow: trialDim(620, 'YMH-MG1', 'the tone plate for the lowest note has a width of 80 mm and a length of around 620 mm (a Yamaha generic five-octave figure)'),
    LbarMin: drawingDefault(190, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 70, dHigh: 45, helmholtzTo: 21, accidentals: 'all', prov: src('YMH-YM5100A', 'Helmholtz (C16 to F21); Round cornered rectangle (F#22-A#26)') },
    malletH: drawingDefault(350, 'how high the mallets rise above the bars'),
    stand: 'frame',
    extras: {},
    prov: { range: src('ADAMS-ALPHA', 'Range : 5 octaves (C2 - C7)'), footprint: src('ADAMS-ALPHA', 'Length: 255 cm; Low end: 104 cm; High End: 56 cm') },
  },
  /** I08 option — Adams Alpha 4.3 (ADAMS-ALPHA). */
  marimba43: {
    id: 'oct43',
    inst: 'marimba',
    model: 'Adams Alpha 4.3',
    lowKey: 25,
    highKey: 76,
    wLow: sourced(67, 'ADAMS-ALPHA', 'Bar width : 67 - 40 mm'),
    wHigh: sourced(40, 'ADAMS-ALPHA', 'Bar width : 67 - 40 mm'),
    tLow: trialDim(25.4, 'YMH-YM5100A', '3/4" – 1" thick (a Yamaha model)'),
    tHigh: trialDim(19.05, 'YMH-YM5100A', '3/4" – 1" thick (a Yamaha model)'),
    Lframe: sourced(2130, 'ADAMS-ALPHA', 'Length: 213cm'),
    Dlow: sourced(900, 'ADAMS-ALPHA', 'Low end: 90cm'),
    Dhigh: sourced(560, 'ADAMS-ALPHA', 'High End: 56 cm'),
    hBars: drawingDefault(970, 'the bar height'),
    // The 5.0's length law at A2: 620 · 2^(−9/24) (DERIVED from the drawing default).
    LbarLow: drawingDefault(620 * Math.pow(2, -9 / 24), 'bar lengths (the 5.0 law continued to A2)'),
    LbarMin: drawingDefault(190, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 66, dHigh: 45, accidentals: 'all', prov: src('YMH-MG2', 'Attached to every tone plate is one pipe') },
    malletH: drawingDefault(350, 'how high the mallets rise above the bars'),
    stand: 'frame',
    extras: {},
    prov: { range: src('ADAMS-ALPHA', 'Range : 4.3 octaves (A2 - C7)'), footprint: src('ADAMS-ALPHA', 'Length: 213cm; Low end: 90cm; High End: 56 cm') },
  },
  /** I09 — Yamaha YX-500R (YMH-YX500): sounding F4–C8, non-graduated bars. */
  xyloYX: {
    id: 'yx',
    inst: 'xylo',
    model: 'Yamaha YX-500R',
    lowKey: 45,
    highKey: 88,
    wLow: sourced(1.625 * IN, 'YMH-YX500', 'Non-graduated 1 5/8"'),
    wHigh: sourced(1.625 * IN, 'YMH-YX500', 'Non-graduated 1 5/8"'),
    tLow: drawingDefault(22, 'xylophone bar thickness'),
    tHigh: drawingDefault(22, 'xylophone bar thickness'),
    Lframe: sourced((54 + 3 / 8) * IN, 'YMH-YX500', '54 3/8" x 29 1/2"'),
    Dlow: sourced(29.5 * IN, 'YMH-YX500', '54 3/8" x 29 1/2"'),
    Dhigh: sourced(29.5 * IN, 'YMH-YX500', '54 3/8" x 29 1/2" (a rectangle: no end depths printed)'),
    hBars: drawingDefault(870, 'the bar height (inside "Height adjustable from 31 1/2" – 37 3/8"")'),
    LbarLow: drawingDefault(0.6 * 29.5 * IN, 'bar lengths (0.6 × the depth)'),
    LbarMin: drawingDefault(160, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 41, dHigh: 34, accidentals: 'essential', prov: src('YMH-YX500', 'only essential accidental resonators') },
    malletH: drawingDefault(350, 'how high the mallets rise above the bars'),
    stand: 'frame',
    extras: {},
    prov: { range: src('YMH-YX500', 'F45-C88, 3 1/2 octaves'), footprint: src('YMH-YX500', '54 3/8" x 29 1/2"') },
  },
  /** I09 option — Adams Concert xylophone, quint-tuned table (ADAMS-XYC). */
  xyloConcert: {
    id: 'concert',
    inst: 'xylo',
    model: 'Adams Concert Series xylophone (4 octaves)',
    lowKey: 40,
    highKey: 88,
    wLow: sourced(48, 'ADAMS-XYC', 'Bar width: 48 - 40 mm'),
    wHigh: sourced(40, 'ADAMS-XYC', 'Bar width: 48 - 40 mm'),
    tLow: drawingDefault(22, 'xylophone bar thickness'),
    tHigh: drawingDefault(22, 'xylophone bar thickness'),
    Lframe: sourced(1650, 'ADAMS-XYC', 'Length : 165 cm'),
    Dlow: sourced(900, 'ADAMS-XYC', 'Low end : 90 cm'),
    Dhigh: sourced(560, 'ADAMS-XYC', 'High End : 56 cm'),
    hBars: drawingDefault(870, 'the bar height (inside "Adjustable 87-101 cm")'),
    LbarLow: drawingDefault(0.6 * 900, 'bar lengths (0.6 × the low-end depth)'),
    LbarMin: drawingDefault(160, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 44, dHigh: 36, accidentals: 'all', prov: src('ADAMS-XYC', 'Resonators : Aluminium, foldable') },
    malletH: drawingDefault(350, 'how high the mallets rise above the bars'),
    stand: 'frame',
    extras: {},
    prov: { range: src('ADAMS-XYC', 'Range : 4 octaves (C4 – C8)'), footprint: src('ADAMS-XYC', 'Length : 165 cm; Low end : 90 cm; High End : 56 cm') },
  },
  /** I10 — Yamaha YG-2500 (its owner's manual): pedal, gas spring, steel bars. */
  glockPedal: {
    id: 'pedal',
    inst: 'glock',
    model: 'Yamaha YG-2500 (owner’s manual)',
    lowKey: 52,
    highKey: 92,
    wLow: sourced(32.5, 'YMH-YG2500-OM', '32.5mm/9mm'),
    wHigh: sourced(32.5, 'YMH-YG2500-OM', '32.5mm/9mm'),
    tLow: sourced(9, 'YMH-YG2500-OM', '32.5mm/9mm'),
    tHigh: sourced(9, 'YMH-YG2500-OM', '32.5mm/9mm'),
    Lframe: sourced(1062, 'YMH-YG2500-OM', '106.2cm x 56.4cm x 85-105cm'),
    Dlow: sourced(564, 'YMH-YG2500-OM', '106.2cm x 56.4cm x 85-105cm'),
    Dhigh: sourced(564, 'YMH-YG2500-OM', '106.2cm x 56.4cm (a rectangle)'),
    hBars: drawingDefault(950, 'the bar height (inside "85-105cm")'),
    LbarLow: drawingDefault(0.4 * 564, 'bar lengths (0.4 × the depth)'),
    LbarMin: drawingDefault(90, 'the shortest bar length'),
    res: { kind: 'tube', dLow: 28, dHigh: 20, accidentals: 'essential', prov: src('YMH-YG2500', 'only essential accidental resonators') },
    malletH: drawingDefault(250, 'how high the glockenspiel mallets rise above the bars'),
    stand: 'frame',
    extras: { damper: 'pedal', gasSpring: true },
    prov: { range: src('YMH-YG2500-OM', 'C52-E92 (3 1/2 octaves)'), footprint: src('YMH-YG2500-OM', '106.2cm x 56.4cm x 85-105cm') },
  },
  /** I10 option — Yamaha YG-1210 case model on a table, hand-damped, lid open. */
  glockCase: {
    id: 'case',
    inst: 'glock',
    model: 'Yamaha YG-1210 (case)',
    lowKey: 57,
    highKey: 88,
    wLow: sourced(1.25 * IN, 'YMH-YG1210', '1 1/4" x 0.307087"'),
    wHigh: sourced(1.25 * IN, 'YMH-YG1210', '1 1/4" x 0.307087"'),
    tLow: sourced(0.307087 * IN, 'YMH-YG1210', '1 1/4" x 0.307087"'),
    tHigh: sourced(0.307087 * IN, 'YMH-YG1210', '1 1/4" x 0.307087"'),
    Lframe: sourced(31 * IN, 'YMH-YG1210', '31" x 19" x 4 1/4"'),
    Dlow: sourced(19 * IN, 'YMH-YG1210', '31" x 19" x 4 1/4"'),
    Dhigh: sourced(19 * IN, 'YMH-YG1210', '31" x 19" x 4 1/4"'),
    // A table (760, DRAWING DEFAULT) plus the case base (78 of the 108 mm).
    hBars: drawingDefault(760 + 78, 'the table height and the case base under the bars'),
    LbarLow: drawingDefault(0.4 * 19 * IN, 'bar lengths (0.4 × the case depth)'),
    LbarMin: drawingDefault(80, 'the shortest bar length'),
    res: { kind: 'none', dLow: 0, dHigh: 0, accidentals: 'all', prov: src('YMH-HUB-VGC', '(Some glockenspiels use a wooden box as the resonating chamber.)') },
    malletH: drawingDefault(250, 'how high the glockenspiel mallets rise above the bars'),
    stand: 'case',
    extras: { damper: 'hand', lid: true },
    prov: { range: src('YMH-YG1210', '2 1/2 octaves; F57 - C88'), footprint: src('YMH-YG1210', '31" x 19" x 4 1/4"') },
  },
} satisfies Record<string, MalletRow>;

/** The case model's parts (YMH-YG1210 overall 31 × 19 × 4¼ in; the split of
 *  the 108 mm into base and lid, the table and the lid's hinge are DRAWING
 *  DEFAULTS). */
export const CASE = { table: 760, base: 78, lid: 108 - 78, lidOpenDeg: 90 } as const;

/* ── the keyboard layout (§A3, DERIVED from a row) ── */
export type Bar = {
  key: number;
  note: string;
  natural: boolean;
  /** Centre along the keyboard (x), the row's line (z), width (x), length (z). */
  x: number;
  z: number;
  w: number;
  L: number;
  /** Top surface height (y, negative = above the floor) and thickness. */
  yTop: number;
  t: number;
};
export type Tube = { key: number; x: number; z: number; d: number; /** y of the open top, y of the closed bottom. */ yTop: number; yBot: number; kind: 'tube' | 'helmholtz'; lAc: number; /** Box size along z (a Helmholtz box). */ depth?: number };
export type Layout = {
  row: MalletRow;
  bars: Bar[];
  naturals: Bar[];
  accidentals: Bar[];
  tubes: Tube[];
  /** z of each row's line (naturals on the player's side, −z). */
  zNat: number;
  zAcc: number;
  /** y of the naturals' top (= −hBars) and the accidentals' top (15 higher). */
  yNat: number;
  yAcc: number;
  /** The frame's half-depth at x (trapezoid plan). */
  halfDepth: (x: number) => number;
  /** x of the low end (+) and the high end (−) of the frame. */
  xLow: number;
  xHigh: number;
  /** The playing span (bar edges) along x. */
  span: { lo: number; hi: number };
  /** Where the player stands (z) and the far edge of the keyboard (z). */
  zPlayer: number;
  zFar: number;
};

/** Accidentals sit this much above the naturals (DRAWING DEFAULT, §A3). */
export const ACC_RISE = 15;
/** A tube's open top sits this far under its bar (DRAWING DEFAULT). */
export const TUBE_GAP = 22;
/** The Helmholtz box's size along z (DRAWING DEFAULT: proposal's 150). */
export const HELM_DEPTH = 150;
/** The box stops this far above the floor (proposal: "hBars − 150"). */
export const HELM_FLOOR = 150;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const cache = new Map<string, Layout>();

/** The bars, tubes and frame of a row, in the family frame (above). */
export function layoutOf(row: MalletRow, barY: number = -row.hBars.mm): Layout {
  const ck = `${row.inst}:${row.id}:${barY}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const keys: number[] = [];
  for (let k = row.lowKey; k <= row.highKey; k++) keys.push(k);
  const natKeys = keys.filter(isNatural);
  const N = natKeys.length;
  const Dmean = (row.Dlow.mm + row.Dhigh.mm) / 2;
  // xRow: 0.22 × Dmean (§A3), held so the longest bar stays inside the
  // low-end depth with 10 mm to spare (a drawing default; CORRECTIONS I2-G1).
  const xRow = Math.min(0.22 * Dmean, (row.Dlow.mm - row.LbarLow.mm) / 2 - 10);
  const zNat = -xRow;
  const zAcc = xRow;
  const yNat = barY;
  const yFloor = barY + row.hBars.mm;
  const yAcc = yNat - ACC_RISE;
  const len = (k: number) => Math.max(row.LbarMin.mm, row.LbarLow.mm * Math.pow(2, -(k - row.lowKey) / 24));
  const tOf = (k: number) => lerp(row.tLow.mm, row.tHigh.mm, (k - row.lowKey) / Math.max(1, row.highKey - row.lowKey));
  const widths = natKeys.map((_, n) => lerp(row.wLow.mm, row.wHigh.mm, N > 1 ? n / (N - 1) : 0));
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (N - 1);
  // Low end at +x: the first natural (lowest) sits at the + end.
  let edge = total / 2;
  const naturals: Bar[] = natKeys.map((k, n) => {
    const w = widths[n];
    const x = edge - w / 2;
    edge -= w + GAP;
    return { key: k, note: noteName(k), natural: true, x, z: zNat, w, L: len(k), yTop: yNat, t: tOf(k) };
  });
  const accidentals: Bar[] = [];
  for (const k of keys) {
    if (isNatural(k)) continue;
    const lo = naturals.find((b) => b.key === k - 1);
    const hi = naturals.find((b) => b.key === k + 1);
    if (!lo || !hi) continue;
    // Centred on the gap between its neighbours; width = their mean (§A3).
    const x = (lo.x - lo.w / 2 + (hi.x + hi.w / 2)) / 2;
    accidentals.push({ key: k, note: noteName(k), natural: false, x, z: zAcc, w: (lo.w + hi.w) / 2, L: len(k), yTop: yAcc, t: tOf(k) });
  }
  const bars = [...naturals, ...accidentals].sort((a, b) => a.key - b.key);
  const tubes: Tube[] = [];
  if (row.res.kind === 'tube') {
    let accIdx = 0;
    for (const b of bars) {
      if (!b.natural) {
        const keep = row.res.accidentals === 'all' || accIdx % 2 === 0;
        accIdx++;
        if (!keep) continue;
      }
      const f = (b.key - row.lowKey) / Math.max(1, row.highKey - row.lowKey);
      const d = Math.min(lerp(row.res.dLow, row.res.dHigh, f), b.w + GAP - 4);
      const lAc = quarterWaveMm(b.key);
      const yTop = b.yTop + b.t + TUBE_GAP;
      if (row.res.helmholtzTo != null && b.key <= row.res.helmholtzTo) {
        tubes.push({ key: b.key, x: b.x, z: b.z, d: Math.min(120, b.w + GAP - 4), yTop, yBot: yFloor - HELM_FLOOR, kind: 'helmholtz', lAc, depth: HELM_DEPTH });
      } else {
        // The pipe is shorter than L_ac by an end correction (0.6 × radius,
        // DRAWING DEFAULT); never shorter than 6 mm.
        const lPhys = Math.max(6, lAc - 0.6 * (d / 2));
        tubes.push({ key: b.key, x: b.x, z: b.z, d, yTop, yBot: yTop + lPhys, kind: 'tube', lAc });
      }
    }
  }
  const xLow = row.Lframe.mm / 2;
  const xHigh = -row.Lframe.mm / 2;
  const halfDepth = (x: number) => lerp(row.Dhigh.mm, row.Dlow.mm, (x - xHigh) / (xLow - xHigh)) / 2;
  const lo = naturals[naturals.length - 1];
  const hi = naturals[0];
  const span = { lo: lo.x - lo.w / 2, hi: hi.x + hi.w / 2 };
  const zFar = Math.max(...accidentals.map((b) => b.z + b.L / 2));
  const out: Layout = { row, bars, naturals, accidentals, tubes, zNat, zAcc, yNat, yAcc, halfDepth, xLow, xHigh, span, zPlayer: -(row.Dlow.mm / 2 + 250), zFar };
  cache.set(ck, out);
  return out;
}

/** The bar a still point (cord) passes through: 0.224 L from each end — the
 *  plain bar's first-shape nodes (DRAWING DEFAULT: tuned bars differ). */
export const NODE_FRAC = 0.224;
