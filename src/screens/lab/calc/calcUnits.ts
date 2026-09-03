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

export function parseList(raw: string): number[] {
  return raw
    .split(/[,;\s]+/)
    .map((t) => parseFloat(t))
    .filter((n) => Number.isFinite(n));
}
