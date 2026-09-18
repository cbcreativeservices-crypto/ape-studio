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

/** Format a number at `sig` significant figures, engineering-friendly. */
export function fmt(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e7 || ax < 1e-4) return x.toExponential(Math.max(0, sig - 1)).replace('e+', 'e');
  // toPrecision can also emit exponent form (13640 @ 4 sig figs →
  // "1.364e+4") — keep the house 'e' style consistent with the branch above.
  const s = x.toPrecision(sig).replace('e+', 'e');
  // Strip trailing zeros after a decimal point (keep integers intact).
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
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
