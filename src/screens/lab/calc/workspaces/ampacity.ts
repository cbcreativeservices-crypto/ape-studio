/**
 * Workspace — Conductor Ampacity (NEC), owner ruling 2026-10-04.
 *
 * For installers and live-event techs: how much current a copper building-wire
 * conductor may carry once its ambient temperature, its bundling and its
 * terminations are accounted for. Section 'electronics'.
 *
 * SOURCES (NFPA 70, National Electrical Code, 2023 edition):
 *   Table 310.16       Allowable ampacities, insulated conductors rated up to
 *                      and including 2000 V, 60/75/90 °C, not more than three
 *                      current-carrying conductors in raceway, cable or earth,
 *                      30 °C (86 °F) ambient. COPPER columns only.
 *   Table 310.15(B)(1)(1)  Ambient correction factors, 30 °C basis (numbered
 *                      Table 310.15(B)(1) in the 2020 edition — same values).
 *   Table 310.15(C)(1) Adjustment factors for more than three current-carrying
 *                      conductors.
 *   110.14(C)(1)       Termination temperature limits.
 *   240.4(D)           Small-conductor overcurrent limits (14/12/10 AWG copper).
 *   210.19 / 210.20    Continuous loads at 125% (the "80%" figure).
 * Every table value below was hand-checked, row by row, against the published
 * tables (2026-10-04); test/calcAmpacity_20261004.test.ts pins all of them.
 *
 * DELIBERATELY NOT HERE (refused in words, never a 310.16 number):
 *   - flexible cord (SO/SJO/SOOW …): NEC 400.5(A), Table 400.5(A)(1);
 *   - aluminium and copper-clad aluminium;
 *   - metric sizing (BS 7671 / IEC 60364-5-52);
 *   - 18 and 16 AWG (90 °C column only, 240.4(D)(1)–(2) conditions);
 *   - any size, insulation or termination rating not in the tables.
 */
import type { CalcTable, CalcValues, OutputVal, Workspace } from '../calcTypes';
import { fmt, snapWhole } from '../calcUnits';

const n = (v: number | number[] | undefined) => (typeof v === 'number' ? v : Array.isArray(v) ? v[0] ?? NaN : NaN);

/** The insulation (and termination) columns of Table 310.16. */
type Col = 60 | 75 | 90;
const COLS: readonly Col[] = [60, 75, 90];
const colIdx = (c: Col) => COLS.indexOf(c);

/** NEC 2023 Table 310.16, COPPER, amperes, [60 °C, 75 °C, 90 °C]. null = the
 *  table has no value in that column. AWG keys use the gauge field's own
 *  convention (as Voltage Drop): 0 = 1/0, −1 = 2/0, −2 = 3/0, −3 = 4/0. */
export const NEC_310_16_CU_AWG: ReadonlyMap<number, readonly [number | null, number | null, number]> = new Map([
  [18, [null, null, 14]],
  [16, [null, null, 18]],
  [14, [15, 20, 25]],
  [12, [20, 25, 30]],
  [10, [30, 35, 40]],
  [8, [40, 50, 55]],
  [6, [55, 65, 75]],
  [4, [70, 85, 95]],
  [3, [85, 100, 115]],
  [2, [95, 115, 130]],
  [1, [110, 130, 145]],
  [0, [125, 150, 170]],
  [-1, [145, 175, 195]],
  [-2, [165, 200, 225]],
  [-3, [195, 230, 260]],
] as const);

/** NEC 2023 Table 310.16, COPPER, amperes, [60 °C, 75 °C, 90 °C], kcmil sizes. */
export const NEC_310_16_CU_KCMIL: ReadonlyMap<number, readonly [number, number, number]> = new Map([
  [250, [215, 255, 290]],
  [300, [240, 285, 320]],
  [350, [260, 310, 350]],
  [400, [280, 335, 380]],
  [500, [320, 380, 430]],
  [600, [350, 420, 475]],
  [700, [385, 460, 520]],
  [750, [400, 475, 535]],
  [800, [410, 490, 555]],
  [900, [435, 520, 585]],
  [1000, [455, 545, 615]],
  [1250, [495, 590, 665]],
  [1500, [525, 625, 705]],
  [1750, [545, 650, 735]],
  [2000, [555, 665, 750]],
] as const);

/** NEC 2023 Table 310.15(B)(1)(1): ambient correction factors, 30 °C basis.
 *  Each row covers whole degrees up to `upTo` (the first row: 10 °C or less).
 *  Factors are [60 °C, 75 °C, 90 °C] columns; null = "—" in the table. */
export const NEC_310_15_B_1_1: readonly { upTo: number; label: string; f: readonly [number | null, number | null, number | null] }[] = [
  { upTo: 10, label: '10 or less', f: [1.29, 1.2, 1.15] },
  { upTo: 15, label: '11–15', f: [1.22, 1.15, 1.12] },
  { upTo: 20, label: '16–20', f: [1.15, 1.11, 1.08] },
  { upTo: 25, label: '21–25', f: [1.08, 1.05, 1.04] },
  { upTo: 30, label: '26–30', f: [1.0, 1.0, 1.0] },
  { upTo: 35, label: '31–35', f: [0.91, 0.94, 0.96] },
  { upTo: 40, label: '36–40', f: [0.82, 0.88, 0.91] },
  { upTo: 45, label: '41–45', f: [0.71, 0.82, 0.87] },
  { upTo: 50, label: '46–50', f: [0.58, 0.75, 0.82] },
  { upTo: 55, label: '51–55', f: [0.41, 0.67, 0.76] },
  { upTo: 60, label: '56–60', f: [null, 0.58, 0.71] },
  { upTo: 65, label: '61–65', f: [null, 0.47, 0.65] },
  { upTo: 70, label: '66–70', f: [null, 0.33, 0.58] },
  { upTo: 75, label: '71–75', f: [null, null, 0.5] },
  { upTo: 80, label: '76–80', f: [null, null, 0.41] },
  { upTo: 85, label: '81–85', f: [null, null, 0.29] },
];

/** NEC 2023 Table 310.15(C)(1): adjustment for more than three current-carrying
 *  conductors in a raceway or cable. `upTo` = the row's highest count. */
export const NEC_310_15_C_1: readonly { upTo: number; label: string; factor: number }[] = [
  { upTo: 3, label: '1–3', factor: 1 },
  { upTo: 6, label: '4–6', factor: 0.8 },
  { upTo: 9, label: '7–9', factor: 0.7 },
  { upTo: 20, label: '10–20', factor: 0.5 },
  { upTo: 30, label: '21–30', factor: 0.45 },
  { upTo: 40, label: '31–40', factor: 0.4 },
  { upTo: Infinity, label: '41 and above', factor: 0.35 },
];

/** NEC 240.4(D): the largest overcurrent device for small copper conductors
 *  (unless 240.4(E) or (G) specifically permits otherwise). */
export const NEC_240_4_D_CU: ReadonlyMap<number, number> = new Map([
  [14, 15],
  [12, 20],
  [10, 30],
]);

/** How other calculators point here (Voltage Drop's gauge sizing). */
export const AMPACITY_CALC_NAME = 'Conductor Ampacity (NEC) calculator';

/** The words that refuse flexible cord (owner ruling, verbatim). */
export const CORD_REFUSAL = 'This uses building-wire tables (NEC 310.16); flexible cord uses NEC Table 400.5(A)(1).';
/** The plain licence / code line (owner rule: disclose required licences). */
export const AMPACITY_SCOPE =
  'This is a code-table figure for learning and planning. The installation must follow the electrical code your area has adopted and the authority having jurisdiction (the inspector), and the work is done by a licensed electrician.';
/** NEC is the US method — said plainly, no metric conversion offered. */
export const AMPACITY_METRIC_NOTE =
  'This is the NEC (US) method. Elsewhere follow your local code — BS 7671 in the UK, IEC 60364-5-52 in many other countries — which use their own tables and methods; do not convert these figures to mm².';

const SIZES_AWG_TEXT = '14, 12, 10, 8, 6, 4, 3, 2, 1, 1/0, 2/0, 3/0 or 4/0 AWG';
const SIZES_KCMIL_TEXT = [...NEC_310_16_CU_KCMIL.keys()].join(', ');

/** A gauge as the trade writes it (0 → 1/0 … −3 → 4/0). */
export const awgLabel = (g: number): string => (g >= 1 ? `${g} AWG` : `${1 - g}/0 AWG`);
const f2 = (x: number) => x.toFixed(2);

type Ok = {
  ok: true;
  sizeName: string;
  awg: number | null;
  insul: Col;
  term: 60 | 75;
  limCol: Col;
  base: number;
  ambientC: number;
  ambientRow: string;
  readAs: number;
  ca: number;
  ccc: number;
  adjRow: string;
  adj: number;
  corrected: number;
  termLimit: number;
  allowable: number;
  ocpdMax: number | null;
  continuous: number;
};
type Refusal = { ok: false; label: string; why: string };

/** Insulation column, or the refusal words. */
function insulCol(x: number): Col | Refusal {
  if (x === 60 || x === 75 || x === 90) return x;
  return {
    ok: false,
    label: 'NO SUCH INSULATION COLUMN',
    why:
      `Table 310.16 has columns for 60 °C, 75 °C and 90 °C insulation only — not ${fmt(x)} °C. ` +
      'Enter the rating printed on the cable: TW is 60 °C; THW and THWN are 75 °C; THHN, THWN-2 and XHHW-2 are 90 °C.',
  };
}

/** Termination rating, or the refusal words. */
function termRating(x: number): 60 | 75 | Refusal {
  if (x === 60 || x === 75) return x;
  return {
    ok: false,
    label: 'NO SUCH TERMINATION RATING',
    why:
      `Equipment terminals are rated 60 °C or 75 °C for this check (NEC 110.14(C)(1)) — not ${fmt(x)} °C. ` +
      'Enter 60 or 75 from the equipment marking. If it is not marked: 60 for circuits of 100 A or less or 14–1 AWG conductors, 75 above that.',
  };
}

/** The ambient row for a column, or the refusal words. A fraction of a degree
 *  reads as the next whole degree (the table rows are whole degrees; rounding
 *  UP is the conservative reading and matches the table's °F rows). */
function ambientFactor(tC: number, insul: Col): { row: string; factor: number; readAs: number } | Refusal {
  if (tC > insul) {
    return {
      ok: false,
      label: 'AMBIENT ABOVE THE INSULATION RATING',
      why:
        `An ambient of ${fmt(tC)} °C is hotter than the ${insul} °C insulation rating: the conductor would be past its rating before it carried any current. ` +
        'There is no ampacity here. Choose a higher-rated insulation or a cooler route.',
    };
  }
  const readAs = Math.ceil(snapWhole(tC));
  const row = NEC_310_15_B_1_1.find((r) => readAs <= r.upTo);
  const factor = row?.f[colIdx(insul)] ?? null;
  if (!row || factor === null) {
    const last = [...NEC_310_15_B_1_1].reverse().find((r) => r.f[colIdx(insul)] !== null)!;
    return {
      ok: false,
      label: 'NO CORRECTION FACTOR',
      why:
        `Table 310.15(B)(1)(1) gives no factor for ${insul} °C insulation at ${fmt(tC)} °C ambient — its ${insul} °C column ends at ${last.label} °C. ` +
        'That conductor cannot be used there. Choose a higher-rated insulation or a cooler route.',
    };
  }
  return { row: row.label, factor, readAs };
}

function adjustment(ccc: number): { row: string; factor: number } {
  const r = NEC_310_15_C_1.find((x) => ccc <= x.upTo)!;
  return { row: r.label, factor: r.factor };
}

/** The whole evaluation, shared by compute / steps / table so the worked steps
 *  always match the numbers shown. */
function evaluate(row: readonly [number | null, number | null, number | null] | undefined, sizeName: string, awg: number | null, v: CalcValues): Ok | Refusal {
  const ins = insulCol(n(v.insul));
  if (typeof ins !== 'number') return ins;
  const term = termRating(n(v.term));
  if (typeof term !== 'number') return term;
  if (!row) throw new Error('size not in table'); // callers refuse first
  const base = row[colIdx(ins)];
  if (base === null) {
    return {
      ok: false,
      label: 'NOT IN THIS COLUMN',
      why: `Table 310.16 lists no ${ins} °C ampacity for ${sizeName} copper.`,
    };
  }
  const amb = ambientFactor(n(v.ambient), ins);
  if ('ok' in amb) return amb;
  const ccc = n(v.ccc);
  const adj = adjustment(ccc);
  const corrected = base * amb.factor * adj.factor;
  // 110.14(C)(1): the conductor is used at the ampacity of the column that
  // matches the LOWER of its insulation and the terminal rating.
  const limCol: Col = ins < term ? ins : term;
  const termLimit = row[colIdx(limCol)];
  if (termLimit === null) {
    return { ok: false, label: 'NOT IN THIS COLUMN', why: `Table 310.16 lists no ${limCol} °C ampacity for ${sizeName} copper.` };
  }
  const allowable = Math.min(corrected, termLimit);
  const ocpdMax = awg !== null ? NEC_240_4_D_CU.get(awg) ?? null : null;
  // 210.19 / 210.20: the conductor (before correction, at the termination
  // limit) and its breaker are sized at 125% of a continuous load, and the
  // corrected ampacity must still carry the load itself.
  const continuous = Math.min(corrected, 0.8 * termLimit, ocpdMax !== null ? 0.8 * ocpdMax : Infinity);
  return {
    ok: true,
    sizeName,
    awg,
    insul: ins,
    term,
    limCol,
    base,
    ambientC: n(v.ambient),
    ambientRow: amb.row,
    readAs: amb.readAs,
    ca: amb.factor,
    ccc,
    adjRow: adj.row,
    adj: adj.factor,
    corrected,
    termLimit,
    allowable,
    ocpdMax,
    continuous,
  };
}

const WHICH_TERMINATION =
  'NEC 110.14(C)(1): equipment for circuits of 100 A or less, or marked for 14–1 AWG conductors, uses the 60 °C column unless it is listed and marked for 75 °C. ' +
  'Equipment for circuits over 100 A, or marked for conductors larger than 1 AWG, uses the 75 °C column. Check the equipment’s marking.';

function outputsOf(e: Ok | Refusal): OutputVal[] {
  if (!e.ok) return [{ label: e.label, text: e.why, refusal: true }];
  const out: OutputVal[] = [
    { label: 'TABLE 310.16 AMPACITY', value: e.base, quantity: 'current', chainable: false },
    { label: 'AMBIENT CORRECTION FACTOR', value: e.ca, quantity: 'number', chainable: false },
    { label: 'CONDUCTOR-COUNT ADJUSTMENT FACTOR', value: e.adj, quantity: 'number', chainable: false },
    { label: 'CORRECTED AMPACITY', value: e.corrected, quantity: 'current', chainable: false },
    { label: `TERMINATION LIMIT (${e.term} °C TERMINALS)`, value: e.termLimit, quantity: 'current', chainable: false },
    { label: 'ALLOWABLE AMPACITY', value: e.allowable, quantity: 'current' },
  ];
  out.push(
    e.ocpdMax !== null
      ? { label: 'MAX OVERCURRENT DEVICE (240.4(D))', value: e.ocpdMax, quantity: 'current', chainable: false }
      : { label: 'MAX OVERCURRENT DEVICE (240.4(D))', text: '240.4(D) covers 14, 12 and 10 AWG only. For this size the overcurrent device follows 240.4(B) and (C).' },
  );
  out.push(
    { label: 'MAX CONTINUOUS LOAD (80%)', value: e.continuous, quantity: 'current', chainable: false },
    { label: 'WHICH TERMINAL RATING', text: WHICH_TERMINATION },
    { label: 'NOT FOR FLEXIBLE CORD', text: CORD_REFUSAL },
    { label: 'CODE AND LICENCE', text: AMPACITY_SCOPE },
  );
  return out;
}

function stepsOf(e: Ok | Refusal): string[] {
  if (!e.ok) return [e.why];
  const s = [
    `${e.sizeName} copper with ${e.insul} °C insulation: Table 310.16 gives ${e.base} A (30 °C ambient, not more than 3 current-carrying conductors).`,
    `Ambient ${fmt(e.ambientC)} °C${e.readAs !== snapWhole(e.ambientC) ? ` (read as ${e.readAs} °C — the table rows are whole degrees, so a fraction rounds up)` : ''} → the ${e.ambientRow} °C row of Table 310.15(B)(1)(1), ${e.insul} °C column: × ${f2(e.ca)}.`,
    e.adj === 1
      ? `${e.ccc} current-carrying conductor${e.ccc === 1 ? '' : 's'}: 3 or fewer, so no adjustment (× 1.00).`
      : `${e.ccc} current-carrying conductors → the ${e.adjRow} row of Table 310.15(C)(1): × ${f2(e.adj)} (${Math.round(e.adj * 100)}%).`,
    `Corrected ampacity = ${e.base} × ${f2(e.ca)} × ${f2(e.adj)} = ${fmt(e.corrected)} A.`,
    `${e.term} °C terminals (110.14(C)): the conductor may be used only at its ${e.limCol} °C column value, ${e.termLimit} A. Allowable ampacity = the smaller of ${fmt(e.corrected)} A and ${e.termLimit} A = ${fmt(e.allowable)} A.`,
  ];
  if (e.ocpdMax !== null) {
    s.push(`240.4(D): ${e.sizeName} copper may be protected at no more than ${e.ocpdMax} A, whatever the table says.`);
  }
  const parts = [`${fmt(e.corrected)} A (corrected)`, `0.8 × ${e.termLimit} A = ${fmt(0.8 * e.termLimit)} A (125% rule at the terminals)`];
  if (e.ocpdMax !== null) parts.push(`0.8 × ${e.ocpdMax} A = ${fmt(0.8 * e.ocpdMax)} A (the largest breaker allowed)`);
  s.push(
    `A continuous load (3 hours or more) is sized at 125% for the conductor and its breaker (210.19, 210.20), so the most it may be is the smallest of ${parts.join(', ')}: ${fmt(e.continuous)} A.`,
  );
  return s;
}

const tableRow = (label: string, r: readonly (number | null)[], mark: boolean) => [
  `${mark ? '▸ ' : ''}${label}`,
  ...r.map((x) => (x === null ? '—' : String(x))),
];

const FIELDS: Workspace['fields'] = [
  {
    key: 'awg',
    name: 'CONDUCTOR SIZE (AWG)',
    quantity: 'number',
    signed: true,
    integer: true,
    range: [-3, 18],
    placeholder: '12',
    help: 'Copper building wire, 14 AWG to 4/0. Enter 1/0 as 0, 2/0 as −1, 3/0 as −2 and 4/0 as −3 (as in Voltage Drop). For 250 kcmil and up, use the kcmil function.',
  },
  {
    key: 'kcmil',
    name: 'CONDUCTOR SIZE (kcmil)',
    quantity: 'number',
    nonNegative: true,
    integer: true,
    range: [250, 2000],
    placeholder: '250',
    help: `Large copper building wire, in thousands of circular mils. Table 310.16 sizes: ${SIZES_KCMIL_TEXT}.`,
  },
  {
    key: 'insul',
    name: 'INSULATION RATING (°C)',
    quantity: 'number',
    nonNegative: true,
    integer: true,
    range: [60, 90],
    placeholder: '90',
    help: 'The temperature rating printed on the conductor: 60, 75 or 90. TW is 60 °C; THW and THWN are 75 °C; THHN, THWN-2 and XHHW-2 are 90 °C.',
  },
  {
    key: 'term',
    name: 'TERMINATION RATING (°C)',
    quantity: 'number',
    nonNegative: true,
    integer: true,
    range: [60, 90],
    placeholder: '60',
    help: 'The temperature rating of the breaker and equipment terminals: 60 or 75. Unmarked equipment for 100 A or less (or 14–1 AWG) is 60; above 100 A it is 75 (NEC 110.14(C)(1)).',
  },
  {
    key: 'ambient',
    name: 'AMBIENT TEMPERATURE',
    quantity: 'temperature',
    signed: true,
    range: [-40, 150],
    placeholder: '30',
    help: 'The air temperature around the conductor along its run — the hottest part (a hot stage, an attic, a sunny truck roof). The table is based on 30 °C (86 °F).',
  },
  {
    key: 'ccc',
    name: 'CURRENT-CARRYING CONDUCTORS',
    quantity: 'number',
    nonNegative: true,
    integer: true,
    range: [1, 1000],
    placeholder: '3',
    help:
      'How many current-carrying conductors share the raceway or cable. Do not count the equipment grounding conductor (310.15(F)). A neutral that carries only the unbalanced current of its own circuit is not counted (310.15(E)(1)); on a 4-wire wye circuit feeding mostly electronic loads (LED drivers, dimmers, switch-mode amplifier supplies) the neutral IS counted (310.15(E)(3)).',
  },
];

const ampacityTableAwg = (v: CalcValues): CalcTable => ({
  title: 'NEC 2023 TABLE 310.16 — COPPER (A)',
  cols: ['Size', '60 °C', '75 °C', '90 °C'],
  rows: [...NEC_310_16_CU_AWG.entries()].map(([g, r]) => tableRow(awgLabel(g), r, g === n(v.awg))),
});
const ampacityTableKcmil = (v: CalcValues): CalcTable => ({
  title: 'NEC 2023 TABLE 310.16 — COPPER (A)',
  cols: ['kcmil', '60 °C', '75 °C', '90 °C'],
  rows: [...NEC_310_16_CU_KCMIL.entries()].map(([k, r]) => tableRow(String(k), r, k === n(v.kcmil))),
});

/** The AWG-size refusals: a gauge Table 310.16 has no row for, and 18/16. */
function awgRefusal(g: number): Refusal | null {
  if (g === 18 || g === 16) {
    return {
      ok: false,
      label: 'SIZE NOT COVERED',
      why:
        `${g} AWG appears in Table 310.16 only in the 90 °C column, and 240.4(D)(1)–(2) limit it to ${g === 18 ? 7 : 10} A under specific conditions. ` +
        'This calculator covers 14 AWG and larger.',
    };
  }
  if (!NEC_310_16_CU_AWG.has(g)) {
    return {
      ok: false,
      label: 'SIZE NOT IN THE TABLE',
      why: `${Number.isFinite(g) ? `${fmt(g)} AWG` : 'That size'} is not a size in Table 310.16. Its sizes are ${SIZES_AWG_TEXT} (then kcmil).`,
    };
  }
  return null;
}
function kcmilRefusal(k: number): Refusal | null {
  if (NEC_310_16_CU_KCMIL.has(k)) return null;
  return {
    ok: false,
    label: 'SIZE NOT IN THE TABLE',
    why: `${Number.isFinite(k) ? `${fmt(k)} kcmil` : 'That size'} is not a size in Table 310.16. Its kcmil sizes are ${SIZES_KCMIL_TEXT}.`,
  };
}

const evalAwg = (v: CalcValues): Ok | Refusal => {
  const g = n(v.awg);
  return awgRefusal(g) ?? evaluate(NEC_310_16_CU_AWG.get(g), awgLabel(g), g, v);
};
const evalKcmil = (v: CalcValues): Ok | Refusal => {
  const k = n(v.kcmil);
  return kcmilRefusal(k) ?? evaluate(NEC_310_16_CU_KCMIL.get(k), `${k} kcmil`, null, v);
};

type Factors = { ok: true; insul: Col; ambientC: number; readAs: number; row: string; ca: number; ccc: number; adjRow: string; adj: number };
const evalFactors = (v: CalcValues): Factors | Refusal => {
  const ins = insulCol(n(v.insul));
  if (typeof ins !== 'number') return ins;
  const amb = ambientFactor(n(v.ambient), ins);
  if ('ok' in amb) return amb;
  const adj = adjustment(n(v.ccc));
  return { ok: true, insul: ins, ambientC: n(v.ambient), readAs: amb.readAs, row: amb.row, ca: amb.factor, ccc: n(v.ccc), adjRow: adj.row, adj: adj.factor };
};

const FORMULA = 'I = min(I_table × Ca × Cn, I_term); continuous ≤ 0.8 × I_term';
const PLAIN =
  'The table ampacity times the ambient correction factor times the conductor-count adjustment factor gives the corrected ampacity; the allowable ampacity is the smaller of that and the table value at the termination temperature; a continuous load may be at most 80% of the termination value (and of the largest breaker allowed).';

export const AMPACITY: Workspace = {
  id: 'ampacity',
  name: 'Conductor Ampacity (NEC)',
  tagline: 'Table 310.16 with ambient, bundling & terminal limits',
  section: 'electronics',
  reportPrefix: 'AMP',
  intro:
    'How much current a copper building-wire conductor may carry. Start from the NEC Table 310.16 value for its size and insulation, ' +
    'correct it for the ambient temperature, adjust it for bundling, then hold it to the terminal rating, the small-conductor breaker ' +
    'limits and the 80% continuous-load rule.',
  whyItMatters:
    'Feeders and branch circuits on a show run hot: hot stages, full conduits, sun-baked truck roofs and long continuous loads. ' +
    'The number printed in the table is only the starting point — the conductor’s real limit is usually set by its terminals, ' +
    'its neighbours or the heat around it.',
  example:
    '12 AWG THHN (90 °C) at 40 °C ambient, 6 current-carrying conductors in one conduit, 60 °C terminals: 30 A × 0.91 × 0.80 = 21.84 A corrected; ' +
    'the 60 °C terminals limit it to 20 A; 240.4(D) allows at most a 20 A breaker; a continuous load may be at most 16 A.',
  mistakes: [
    'Using the 90 °C column as the answer — the 90 °C value is for derating only; the terminals (usually 60 °C or 75 °C) set the final limit (110.14(C)).',
    'Forgetting 240.4(D): 14 AWG copper is protected at 15 A, 12 AWG at 20 A, 10 AWG at 30 A, even where the table shows more.',
    'Applying these building-wire numbers to SO/SJO/SOOW cord — flexible cord has its own table (NEC Table 400.5(A)(1)).',
    'Not counting conductors — a full conduit of circuits derates every conductor in it (Table 310.15(C)(1)).',
    'NM-B (Romex) cable uses the 60 °C column for its final ampacity (334.80), even though its conductors are rated 90 °C.',
  ],
  warnings:
    'NEC (NFPA 70) 2023: Table 310.16 (copper, ≤ 2000 V, not more than three current-carrying conductors in raceway, cable or earth, 30 °C ambient); ' +
    'Table 310.15(B)(1)(1) ambient correction (30 °C basis; Table 310.15(B)(1) in the 2020 edition, same values); Table 310.15(C)(1) adjustment for more than three ' +
    'current-carrying conductors (also for cables bundled more than 600 mm / 24 in without spacing; not for raceway nipples of 600 mm or less); ' +
    '110.14(C)(1) terminal limits; 240.4(D) small-conductor protection; 210.19 and 210.20 continuous loads at 125% (the 80% figure — equipment listed for 100% operation is the exception). ' +
    'Copper only — aluminium is not covered. Not modelled: rooftop raceways in sunlight (310.15(B)(2)), underground and Table 310.17–310.21 installations, ' +
    'and voltage drop (use the Voltage Drop calculator; the larger conductor wins). ' +
    CORD_REFUSAL +
    ' ' +
    AMPACITY_METRIC_NOTE +
    ' ' +
    AMPACITY_SCOPE,
  accuracyDetail: AMPACITY_SCOPE,
  glossary: ['Ampacity', 'Ampacity derating', 'AWG', 'Current'],
  fields: FIELDS,
  functions: [
    {
      key: 'awg',
      name: 'Ampacity of a conductor (14 AWG – 4/0)',
      inputs: ['awg', 'insul', 'term', 'ambient', 'ccc'],
      formula: FORMULA,
      plainFormula: PLAIN,
      explain:
        'Starts from the NEC Table 310.16 copper ampacity for the size and insulation, multiplies by the ambient correction factor and the conductor-count adjustment, ' +
        'then holds the result to the terminal temperature column (110.14(C)), the small-conductor breaker limits (240.4(D)) and the 125% continuous-load rule. ' +
        'Building wire only — not flexible cord.',
      keySymbols: ['×', '·', '≥  ≤', '%'],
      note: AMPACITY_SCOPE,
      primaryResultLabel: 'ALLOWABLE AMPACITY',
      compute: (v) => outputsOf(evalAwg(v)),
      steps: (v) => stepsOf(evalAwg(v)),
      table: (v) => (evalAwg(v).ok ? ampacityTableAwg(v) : { cols: ampacityTableAwg(v).cols, rows: [] }),
    },
    {
      key: 'kcmil',
      name: 'Ampacity of a large conductor (250–2000 kcmil)',
      inputs: ['kcmil', 'insul', 'term', 'ambient', 'ccc'],
      formula: FORMULA,
      plainFormula: PLAIN,
      explain:
        'The same NEC method for the large sizes used on feeders and services: Table 310.16 copper ampacity, ambient correction, conductor-count adjustment, ' +
        'the terminal temperature column and the 125% continuous-load rule. Building wire only — not flexible cord.',
      keySymbols: ['×', '·', '≥  ≤', '%'],
      note: AMPACITY_SCOPE,
      primaryResultLabel: 'ALLOWABLE AMPACITY',
      compute: (v) => outputsOf(evalKcmil(v)),
      steps: (v) => stepsOf(evalKcmil(v)),
      table: (v) => (evalKcmil(v).ok ? ampacityTableKcmil(v) : { cols: ampacityTableKcmil(v).cols, rows: [] }),
    },
    {
      key: 'factors',
      name: 'Ambient & bundling factors only',
      inputs: ['insul', 'ambient', 'ccc'],
      formula: 'C = Ca × Cn',
      plainFormula: 'The combined factor equals the ambient correction factor times the conductor-count adjustment factor.',
      explain:
        'Looks up the two derating factors on their own: the ambient correction from Table 310.15(B)(1)(1) for the insulation column, and the adjustment for more than three ' +
        'current-carrying conductors from Table 310.15(C)(1). Multiply any Table 310.16 value by the combined factor.',
      keySymbols: ['×', '%'],
      note:
        'Table 310.15(C)(1): 1–3 conductors 100%, 4–6 80%, 7–9 70%, 10–20 50%, 21–30 45%, 31–40 40%, 41 and above 35%. ' + AMPACITY_SCOPE,
      compute: (v) => {
        const e = evalFactors(v);
        if (!e.ok) return [{ label: e.label, text: e.why, refusal: true }];
        return [
          { label: 'AMBIENT CORRECTION FACTOR', value: e.ca, quantity: 'number', chainable: false },
          { label: 'CONDUCTOR-COUNT ADJUSTMENT FACTOR', value: e.adj, quantity: 'number', chainable: false },
          { label: 'COMBINED FACTOR', value: e.ca * e.adj, quantity: 'number', chainable: false },
          { label: 'NOT FOR FLEXIBLE CORD', text: CORD_REFUSAL },
        ];
      },
      steps: (v) => {
        const e = evalFactors(v);
        if (!e.ok) return [e.why];
        return [
          `Ambient ${fmt(e.ambientC)} °C${e.readAs !== snapWhole(e.ambientC) ? ` (read as ${e.readAs} °C — a fraction of a degree rounds up)` : ''} → the ${e.row} °C row of Table 310.15(B)(1)(1), ${e.insul} °C column: ${f2(e.ca)}.`,
          e.adj === 1
            ? `${e.ccc} current-carrying conductor${e.ccc === 1 ? '' : 's'}: 3 or fewer, so no adjustment (1.00).`
            : `${e.ccc} current-carrying conductors → the ${e.adjRow} row of Table 310.15(C)(1): ${f2(e.adj)}.`,
          `Combined factor = ${f2(e.ca)} × ${f2(e.adj)} = ${fmt(e.ca * e.adj)}.`,
        ];
      },
      table: (v) => {
        const e = evalFactors(v);
        return {
          title: 'TABLE 310.15(B)(1)(1) — AMBIENT CORRECTION (30 °C BASIS)',
          cols: ['Ambient °C', '60 °C', '75 °C', '90 °C'],
          rows: e.ok ? NEC_310_15_B_1_1.map((r) => [`${r.label === e.row ? '▸ ' : ''}${r.label}`, ...r.f.map((x) => (x === null ? '—' : f2(x)))]) : [],
        };
      },
    },
  ],
};

export const WORKSPACES_AMPACITY: Workspace[] = [AMPACITY];
