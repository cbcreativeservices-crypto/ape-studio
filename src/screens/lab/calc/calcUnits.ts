/**
 * Calculator Lab — quantities, units, and number formatting.
 *
 * Every FieldDef/OutputVal names a QuantityKind; each kind has a BASE unit
 * (the unit compute() sees) and display units with exact conversions.
 * Metric + U.S. customary support lives here (owner spec).
 */

export type UnitDef = {
  id: string;
  label: string;
  toBase: (x: number) => number;
  fromBase: (x: number) => number;
};

const lin = (k: number): Pick<UnitDef, 'toBase' | 'fromBase'> => ({
  toBase: (x) => x * k,
  fromBase: (x) => x / k,
});
const ident = lin(1);

import type { CalcFunction, CalcValues, FieldDef } from './calcTypes';

export type QuantityKind =
  | 'frequency' // base Hz
  | 'time' // base s
  | 'length' // base m
  | 'temperature' // base °C
  | 'speed' // base m/s
  | 'db' // base dB (relative decibels / level differences)
  | 'spl' // base dB SPL
  | 'voltage' // base V
  | 'power' // base W
  | 'current' // base A
  | 'impedance' // base Ω
  | 'ratio' // base × (dimensionless linear ratio)
  | 'number' // base count (dimensionless)
  | 'percent' // base %
  | 'angle' // base degrees
  | 'bpm' // base BPM
  | 'samples' // base samples
  | 'samplerate' // base Hz (kept separate for clearer field labels)
  | 'bitdepth' // base bits
  | 'datasize' // base bytes
  | 'datarate' // base bits per second
  | 'area' // base m²
  | 'volume' // base m³
  | 'sensitivity' // base dB SPL @ 1W/1m
  | 'cents' // base cents
  | 'list'; // comma-separated numbers — unit chosen by the field's listUnit

export const QUANTITIES: Record<QuantityKind, UnitDef[]> = {
  frequency: [
    { id: 'hz', label: 'Hz', ...ident },
    { id: 'khz', label: 'kHz', ...lin(1e3) },
  ],
  time: [
    { id: 'ms', label: 'ms', ...lin(1e-3) },
    { id: 's', label: 's', ...ident },
    { id: 'us', label: 'µs', ...lin(1e-6) },
    { id: 'min', label: 'min', ...lin(60) },
  ],
  length: [
    { id: 'm', label: 'm', ...ident },
    { id: 'ft', label: 'ft', ...lin(0.3048) },
    { id: 'cm', label: 'cm', ...lin(0.01) },
    { id: 'in', label: 'in', ...lin(0.0254) },
    { id: 'mm', label: 'mm', ...lin(0.001) },
  ],
  temperature: [
    { id: 'c', label: '°C', ...ident },
    { id: 'f', label: '°F', toBase: (x) => ((x - 32) * 5) / 9, fromBase: (x) => (x * 9) / 5 + 32 },
  ],
  speed: [
    { id: 'mps', label: 'm/s', ...ident },
    { id: 'ftps', label: 'ft/s', ...lin(0.3048) },
  ],
  db: [{ id: 'db', label: 'dB', ...ident }],
  spl: [{ id: 'dbspl', label: 'dB SPL', ...ident }],
  voltage: [
    { id: 'v', label: 'V', ...ident },
    { id: 'mv', label: 'mV', ...lin(1e-3) },
  ],
  power: [
    { id: 'w', label: 'W', ...ident },
    { id: 'mw', label: 'mW', ...lin(1e-3) },
    { id: 'kw', label: 'kW', ...lin(1e3) },
  ],
  current: [
    { id: 'a', label: 'A', ...ident },
    { id: 'ma', label: 'mA', ...lin(1e-3) },
  ],
  impedance: [
    { id: 'ohm', label: 'Ω', ...ident },
    { id: 'kohm', label: 'kΩ', ...lin(1e3) },
  ],
  ratio: [{ id: 'x', label: '×', ...ident }],
  number: [{ id: 'n', label: '', ...ident }],
  percent: [{ id: 'pct', label: '%', ...ident }],
  angle: [{ id: 'deg', label: '°', ...ident }],
  bpm: [{ id: 'bpm', label: 'BPM', ...ident }],
  samples: [{ id: 'smp', label: 'samples', ...ident }],
  samplerate: [
    { id: 'srhz', label: 'Hz', ...ident },
    { id: 'srkhz', label: 'kHz', ...lin(1e3) },
  ],
  bitdepth: [{ id: 'bit', label: 'bit', ...ident }],
  datasize: [
    { id: 'mb', label: 'MB', ...lin(1e6) },
    { id: 'b', label: 'bytes', ...ident },
    { id: 'kb', label: 'kB', ...lin(1e3) },
    { id: 'gb', label: 'GB', ...lin(1e9) },
    { id: 'tb', label: 'TB', ...lin(1e12) },
  ],
  datarate: [
    { id: 'kbps', label: 'kbit/s', ...lin(1e3) },
    { id: 'bps', label: 'bit/s', ...ident },
    { id: 'mbps', label: 'Mbit/s', ...lin(1e6) },
  ],
  area: [
    { id: 'm2', label: 'm²', ...ident },
    { id: 'ft2', label: 'ft²', ...lin(0.09290304) },
  ],
  volume: [
    { id: 'm3', label: 'm³', ...ident },
    { id: 'l', label: 'L', ...lin(0.001) },
    { id: 'ft3', label: 'ft³', ...lin(0.028316846592) },
  ],
  sensitivity: [{ id: 'sens', label: 'dB SPL (1W/1m)', ...ident }],
  cents: [{ id: 'cent', label: 'cents', ...ident }],
  list: [{ id: 'list', label: '', ...ident }],
};

export function unitsFor(q: QuantityKind, subset?: string[]): UnitDef[] {
  const all = QUANTITIES[q];
  if (!subset || subset.length === 0) return all;
  const picked = subset.map((id) => all.find((u) => u.id === id)).filter((u): u is UnitDef => !!u);
  return picked.length ? picked : all;
}

/**
 * Format a number at `sig` significant figures, engineering-friendly.
 *
 * ── EVERY SAMPLE RATE USED TO PRINT AS SCIENTIFIC NOTATION (2026-09-17) ────
 *
 * `toPrecision(4)` switches to exponent form as soon as the exponent reaches the
 * precision — so 48000 came out as "4.800e4", 44100 as "4.410e4" and 192000 as
 * "1.920e5". The previous code SAW the exponent form (it normalised "e+" to "e")
 * and let it through, so every frequency, impedance and data size above 10,000
 * was displayed to an audio engineer in a notation nobody uses for 48 kHz.
 *
 * Scientific notation is kept where it earns its place — very large and very
 * small values, outside the range these calculators work in.
 */
export function fmt(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e7 || ax < 1e-4) return x.toExponential(Math.max(0, sig - 1)).replace('e+', 'e');
  const p = x.toPrecision(sig);
  // Between 1e4 and 1e7, toPrecision gives exponent form. Round-tripping through
  // Number brings it back to plain decimal at the same significant figures:
  // "4.800e+4" → 48000. This band is where the app's real numbers live.
  if (p.includes('e')) return String(Number(p));
  // Strip trailing zeros after a decimal point (keep integers intact).
  return p.includes('.') ? p.replace(/\.?0+$/, '') : p;
}

/** A whole COUNT of the one-unit count kinds ('samples' / 'number'), or null.
 *  Whole up to float noise counts (night bug pass 3, 2026-10-01): 0.35 s ×
 *  44100 Hz is 15434.999999999998 in binary and printed as "15430" taps at 4
 *  figures. The snap is 1e-9 RELATIVE — finer than any sig-fig setting shows —
 *  so a tiny genuine value (1e-12) is never snapped to 0. From 1e7 up, null
 *  (fmt's exponent form applies). */
export function wholeCount(x: number, quantity: string): number | null {
  if (quantity !== 'samples' && quantity !== 'number') return null;
  if (!Number.isFinite(x)) return null;
  const whole = Math.round(x);
  if (Math.abs(x - whole) > 1e-9 * Math.abs(x) || Math.abs(whole) >= 1e7) return null;
  return whole === 0 ? 0 : whole; // never "-0"
}

/** The text a carried-in value (a chained result, an earlier workflow step's
 *  output, a saved project value) is written into an input field as — 6 sig
 *  figs, except a whole COUNT, which goes in exact (night bug pass 3,
 *  2026-10-01): 6 figures turned 1,200,001 TOTAL FRAMES into 1200000 in the
 *  next step, and re-saved a 7-digit project count one off on any edit.
 *  `x` is already in the field's display unit. */
export function fmtCarried(x: number, quantity: string): string {
  const whole = wholeCount(x, quantity);
  return whole !== null ? String(whole) : fmt(x, 6);
}

/** Format a whole-number count for interpolation into text/steps/labels —
 *  '—' for a non-finite value, same convention as fmt(). Use this instead of
 *  `${Math.round(x)}` / `${x}` so a zero input never prints NaN/Infinity. */
export function fmtInt(x: number): string {
  return Number.isFinite(x) ? String(Math.round(x)) : '—';
}

/** Speed of sound in dry air from temperature (°C) — classroom model. */
export function speedOfSoundAir(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

/**
 * Parse ONE typed quantity, strictly. Returns null for anything it cannot read
 * with certainty — the caller then shows no result at all.
 *
 * ── WHY THIS IS NOT `parseFloat` (2026-09-17, bug-hunt pass 2) ────────────
 *
 * Every calculator field ran through `parseFloat`, which stops at the first
 * character it does not understand and returns what it has. So a user typing a
 * resistance the way people write resistances — `10,000` — got **10 ohms**, and
 * the RC cutoff came back a thousand times wrong with nothing on screen to
 * suggest it. `12k`, `47 uF` and `1 234` failed the same way, each silently.
 *
 * These calculators are the owner's stated SOURCE OF TRUTH, used in the field
 * around high voltage and rigging loads. A wrong answer delivered confidently is
 * the worst thing this code can do, and it is strictly worse than no answer.
 * So: read what is unambiguous, and refuse everything else.
 *
 *   "10,000"      → 10000    grouping, the separator is followed by three digits
 *   "1,234,567.8" → 1234567.8  grouping plus a decimal point
 *   "1.234,5"     → 1234.5   the LAST separator is the decimal one
 *   "10.5"        → 10.5
 *   "-3e-4"       → -0.0003
 *   "10,5"        → null     decimal comma or a typo'd group? do not guess
 *   "12abc"       → null     parseFloat said 12
 *   ""            → null
 */
export function parseQuantity(raw: string): number | null {
  // Spaces, underscores and narrow no-break spaces are all used as grouping
  // separators by real keyboards and real paste sources; none of them can mean
  // anything else inside a number, so they are simply removed.
  const t = raw.replace(/[\s_\u00a0\u202f']/g, '');
  if (t === '') return null;

  const dots = (t.match(/\./g) ?? []).length;
  const commas = (t.match(/,/g) ?? []).length;
  let normalised = t;

  if (dots > 0 && commas > 0) {
    // Both present: whichever comes LAST is the decimal separator.
    const decimal = t.lastIndexOf('.') > t.lastIndexOf(',') ? '.' : ',';
    const grouping = decimal === '.' ? ',' : '.';
    if ((decimal === '.' ? dots : commas) > 1) return null; // two decimal points
    // The grouping must be REAL grouping (three digits per group), exactly as
    // the commas-only branch demands — otherwise a typo like `1,5.3` or
    // `10,00.5` had its comma stripped and came back as 15.3 / 1000.5.
    const g = grouping === '.' ? '\\.' : ',';
    const d = decimal === '.' ? '\\.' : ',';
    if (!new RegExp(`^[+-]?\\d{1,3}(${g}\\d{3})+${d}\\d*([eE][+-]?\\d+)?$`).test(t)) return null;
    normalised = t.split(grouping).join('');
    if (decimal === ',') normalised = normalised.replace(',', '.');
  } else if (commas > 0) {
    // Commas only. Grouping if EVERY comma is followed by exactly three digits;
    // otherwise it is a decimal comma or a typo, and both are ambiguous here.
    const groupsOk = /^[+-]?\d{1,3}(,\d{3})+$/.test(t);
    if (!groupsOk) return null;
    normalised = t.split(',').join('');
  } else if (dots > 1) {
    return null;
  }

  // Nothing but a number may remain — this is what rejects `12abc`, `47uF` and
  // a lone `-` or `.`, all of which `parseFloat` was happy to interpret.
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(normalised)) return null;

  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

/**
 * A list field, e.g. several distances to average.
 *
 * Separators are commas, semicolons and whitespace — so a GROUPED number cannot
 * be written here, and `parseQuantity` is applied per token with that in mind.
 * A token that does not parse makes the whole list invalid rather than being
 * dropped: silently discarding one of five measurements changes the answer and
 * says nothing.
 */
export function parseList(raw: string): number[] {
  const tokens = raw.split(/[,;\s]+/).filter((t) => t !== '');
  const out: number[] = [];
  for (const t of tokens) {
    const n = parseQuantity(t);
    if (n === null) return [];
    out.push(n);
  }
  return out;
}

/**
 * Quantities that cannot physically be negative (owner 2026-09-30: "fix the
 * neg results to show error"). A negative frequency, time, distance, power,
 * impedance… is not an input the formulas can answer honestly — f = −100 Hz
 * used to give a confident T = −10 ms. Levels (dB, SPL, sensitivity), voltage,
 * current, temperature, angle, cents, ratios, percentages and plain numbers
 * CAN be negative and are left alone.
 */
export const NON_NEGATIVE_KINDS: ReadonlySet<QuantityKind> = new Set<QuantityKind>([
  'frequency', 'time', 'length', 'speed', 'power', 'impedance', 'area', 'volume',
  'bpm', 'samples', 'samplerate', 'bitdepth', 'datasize', 'datarate',
]);
export const NEGATIVE_MSG = 'Can’t be negative.';
/** True when this field can never hold a negative — by its kind, or by its own
 *  `nonNegative` flag (a µF capacitance or a channel count rides the signed
 *  'number' kind, so the kind alone let −1 µF compute a negative cutoff). */
export function isNonNegativeField(f: Pick<FieldDef, 'quantity' | 'nonNegative'>): boolean {
  return NON_NEGATIVE_KINDS.has(f.quantity) || f.nonNegative === true;
}
/**
 * Unit tags written into a label or field name — "LEVEL (dBV)", "PANEL MASS
 * (kg/m²)", "CAPACITANCE (µF)". Two kinds are catch-alls whose ONE display unit
 * cannot tell them apart: 'number' (µF, kg/m², ppm, LUFS, mV/Pa … and plain
 * counts) and 'db' (dBu, dBV and relative dB). The chain used to match on the
 * kind alone, so a panel mass filled a capacitance and a dBV result filled a dBu
 * field — a silent 2.2 dB error in a lab that teaches exactly that difference.
 * Order matters: compound units are matched (and removed) before their parts.
 */
const UNIT_TAGS: [string, RegExp][] = [
  ['dBV/Pa', /dBV\/Pa/g],
  ['mV/Pa', /mV\/Pa/g],
  ['dBFS', /\bdBFS\b/g],
  ['dBTP', /\bdBTP\b/g],
  ['dBu', /\bdBu\b/g],
  ['dBV', /\bdBV\b/g],
  ['dBm', /\bdBm\b/g],
  ['LUFS', /\bLUFS\b/g],
  ['LU', /\bLU\b/g],
  ['µF', /µF/g],
  ['mH', /\bmH\b/g],
  ['kg/m²', /kg\/m²/g],
  ['lb/ft²', /lb\/ft²/g],
  ['MHz', /MHz/g],
  ['ppm', /\bppm\b/g],
  ['°F', /°F/g],
  ['AWG', /\bAWG\b/g],
  ['fps', /\bfps\b/g],
  ['rad/s', /rad\/s/g],
  ['BTU/hr', /BTU\/hr/g],
  ['mm²', /mm²/g],
  ['cm³', /cm³/g],
];
export function unitTags(text: string): string[] {
  // "IF THIS IS dBu → in dBV" is a dBV value: only the result side counts.
  let t = text.includes('→') ? text.slice(text.lastIndexOf('→') + 1) : text;
  const out: string[] = [];
  for (const [tag, re] of UNIT_TAGS) {
    if (t.search(re) >= 0) {
      out.push(tag);
      t = t.replace(re, ' ');
    }
  }
  return out;
}
/**
 * May a chained / imported / project value (`label`, `quantity`) fill `field`?
 * The kinds must match (as before). On 'db', two NAMED references must agree
 * (dBV never fills dBu; an unnamed relative dB still fits either way). On
 * 'number', the unit tags must be identical — a kg/m² or a dBV/Pa never fills a
 * µF or a plain count, and a plain count never fills a named unit.
 */
export function chainFits(label: string, quantity: QuantityKind, field: Pick<FieldDef, 'name' | 'quantity'>): boolean {
  if (quantity !== field.quantity || quantity === 'list') return false;
  if (quantity !== 'db' && quantity !== 'number') return true;
  const a = unitTags(label);
  const b = unitTags(field.name);
  const shared = a.some((x) => b.includes(x));
  if (quantity === 'db') return a.length === 0 || b.length === 0 || shared;
  return (a.length === 0 && b.length === 0) || shared;
}
/** The first input of `fn` holding an impossible negative, or null. Lists are
 *  checked element by element (a −30 min interval used to REDUCE a noise dose). */
export function negativeInput(
  fn: Pick<CalcFunction, 'inputs'>,
  values: CalcValues,
  fields: Pick<FieldDef, 'key' | 'name' | 'quantity' | 'nonNegative'>[],
): Pick<FieldDef, 'key' | 'name' | 'quantity' | 'nonNegative'> | null {
  for (const key of fn.inputs) {
    const f = fields.find((x) => x.key === key);
    const v = values[key];
    if (!f || !isNonNegativeField(f)) continue;
    if (typeof v === 'number' ? v < 0 : Array.isArray(v) && v.some((x) => x < 0)) return f;
  }
  return null;
}
