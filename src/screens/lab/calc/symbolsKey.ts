/**
 * Symbol key for the Audio Calculator Laboratory — Greek letters, calculus /
 * math symbols, and notation used across the calculators.
 *
 * Authored 2026-08-09 (owner: "create a list of every greek, calculus, and other
 * math symbol we need in the key"). Grounded in the actual glyph inventory of
 * every calculator formula/unit (marked "used") plus the standard math/calculus
 * symbols a professional reference should carry. Rendered by CalcSymbolsKeyScreen.
 *
 * `glossaryTerm` links an entry to its full glossary definition (owner 2026-08-09
 * cross-check): tapping the row opens that term in the in-place GlossaryTermPopup
 * and returns to the key. Names are the EXACT glossary term (the popup matches by
 * name, case-insensitive). Pure notation/operators have no glossary term — the
 * key is their only home — so they are left unlinked.
 */

export type SymbolEntry = {
  /** The glyph as displayed — e.g. 'π', 'Σ', '∂', 'Δ', '√', 'µ', 'ω', 'φ'. */
  symbol: string;
  /** Its name — e.g. 'pi', 'sigma', 'partial derivative', 'delta'. */
  name: string;
  /** Plain-language meaning + how it is used in the audio calculators. */
  meaning: string;
  /** Optional worked example / where it appears. */
  example?: string;
  /** Exact glossary term name to open on tap (when one exists). */
  glossaryTerm?: string;
};

export type SymbolGroup = {
  /** Section label — e.g. 'Greek letters', 'Calculus', 'Operators', 'Numbers'. */
  title: string;
  /** Optional one-line framing shown under the group title. */
  note?: string;
  entries: SymbolEntry[];
};

/** Groups excluded from the per-formula "symbols used" subset — the recurring
 *  VALUES group is trivia (bare numbers like 2, 10, 0.707) that would match
 *  spuriously against any formula's digits. The real notation groups stay. */
const SUBSET_EXCLUDE_GROUP_TITLES = new Set(['VALUES THAT KEEP TURNING UP']);

/**
 * The symbol-key entries whose glyph actually appears in a formula string — the
 * data for the per-formula key popup's "symbols used here" block (owner
 * 2026-08-13). Order follows the key's own group order.
 *
 * `only` pins an explicit, ordered subset by glyph (author control, from
 * CalcFunction.keySymbols) for the formulas where substring auto-matching would
 * be imperfect. Without it, every notation entry whose glyph is a substring of
 * the formula is included.
 */
export function symbolsInFormula(formula: string, only?: string[]): SymbolEntry[] {
  const notation = SYMBOL_GROUPS.filter((g) => !SUBSET_EXCLUDE_GROUP_TITLES.has(g.title)).flatMap(
    (g) => g.entries,
  );
  const glyphsOf = (e: SymbolEntry) => e.symbol.split(/\s+/).filter(Boolean);
  if (only && only.length) {
    // Prefer an EXACT symbol match (so 'T' picks the period variable, not the
    // 'p n µ m k M G T' SI-prefixes collection) before falling back to any entry
    // whose glyph list contains the token (so '/' still finds the '÷  /' entry).
    return only
      .map((glyph) => notation.find((e) => e.symbol === glyph) ?? notation.find((e) => glyphsOf(e).includes(glyph)))
      .filter((e): e is SymbolEntry => !!e);
  }
  return notation.filter((e) => glyphsOf(e).some((g) => formula.includes(g)));
}

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    title: 'GREEK LETTERS',
    entries: [
      { symbol: 'π', name: 'pi', meaning: 'The constant 3.14159… the circle ratio; appears wherever rotation or waves do.', example: 'XL = 2·π·f·L', glossaryTerm: 'Pi' },
      { symbol: 'Σ', name: 'sigma (capital)', meaning: 'Sum — add up every term in a series. Also the Calc Lab’s emblem.', example: 'Total absorption = Σ (S·α)' },
      { symbol: 'Δ', name: 'delta (capital)', meaning: 'A change, or the difference between two values.', example: 'Δt = arrival-time difference' },
      { symbol: 'λ', name: 'lambda', meaning: 'Wavelength — the length of one cycle in space, in metres.', example: 'λ = c / f', glossaryTerm: 'Wavelength' },
      { symbol: 'ω', name: 'omega (small)', meaning: 'Angular frequency in radians per second: ω = 2πf.', example: 'XL = ω·L', glossaryTerm: 'Angular Frequency' },
      { symbol: 'Ω', name: 'omega (capital)', meaning: 'Ohms — the unit of impedance, resistance and reactance.', example: '8 Ω loudspeaker', glossaryTerm: 'Ohm (Ω)' },
      { symbol: 'φ', name: 'phi', meaning: 'Phase angle between voltage and current (or between two signals).', example: 'φ = atan((XL − XC) / R)', glossaryTerm: 'Phase Angle' },
      { symbol: 'θ', name: 'theta', meaning: 'A general angle — incidence, coverage, or a source’s position.', example: 'path = d·sin(θ)' },
      { symbol: 'α', name: 'alpha', meaning: 'Absorption coefficient, from 0 (reflective) to 1 (fully absorbing).', example: 'Sabine RT uses S·α', glossaryTerm: 'Absorption coefficient' },
      { symbol: 'ā', name: 'a-bar', meaning: 'Average absorption coefficient — the area-weighted mean of α.', example: 'Eyring: −S·ln(1 − ā)', glossaryTerm: 'Average Absorption Coefficient' },
      { symbol: 'ρ', name: 'rho', meaning: 'Resistivity (Ω·m) for cable, or density (kg/m³) for air.', example: 'R = ρ·2L / A', glossaryTerm: 'resistivity' },
      { symbol: 'τ', name: 'tau', meaning: 'Time constant — how fast an RC circuit or a decay settles.', example: 'τ = R·C', glossaryTerm: 'Time constant' },
      { symbol: 'µ', name: 'mu / micro', meaning: 'Greek “mu”. As a unit prefix it means one-millionth (10⁻⁶).', example: 'µF · µs · µPa' },
      { symbol: 'η', name: 'eta', meaning: 'Efficiency — useful output divided by input, often a percentage.', glossaryTerm: 'Efficiency' },
      { symbol: 'δ', name: 'delta (small)', meaning: 'A very small (infinitesimal) change — the calculus cousin of Δ.' },
      { symbol: 'ε', name: 'epsilon', meaning: 'A tiny quantity; also electrical permittivity.' },
      { symbol: 'β', name: 'beta', meaning: 'A ratio or fraction — for example a feedback fraction.' },
    ],
  },
  {
    title: 'OPERATORS & RELATIONS',
    entries: [
      { symbol: '×  ·', name: 'multiply', meaning: 'Multiply. A raised dot (·) means the same as ×.', example: '2 · π · f' },
      { symbol: '÷  /', name: 'divide', meaning: 'Divide one quantity by another.', example: 'λ = c ÷ f' },
      { symbol: '−', name: 'minus', meaning: 'Subtract, or mark a negative value.' },
      { symbol: '√', name: 'square root', meaning: 'The number that, multiplied by itself, gives the value under the sign.', example: '|Z| = √(R² + X²)' },
      { symbol: '≈', name: 'approximately equal', meaning: 'About equal to — a rounded or estimated result.' },
      { symbol: '±', name: 'plus-or-minus', meaning: 'Both a positive and a negative amount — a tolerance or ± range.' },
      { symbol: '∓', name: 'minus-or-plus', meaning: 'The opposite pairing to ± when two signs are linked.' },
      { symbol: '≥  ≤', name: 'at least / at most', meaning: 'Greater-than-or-equal and less-than-or-equal comparisons.' },
      { symbol: '>  <', name: 'greater / less than', meaning: 'More than, or less than.' },
      { symbol: '≠', name: 'not equal', meaning: 'The two sides are different.' },
      { symbol: '∥', name: 'parallel', meaning: 'Combine impedances in parallel.', example: 'Z₁ ∥ Z₂', glossaryTerm: 'Parallel Impedance' },
      { symbol: '| |', name: 'absolute value / magnitude', meaning: 'The size of a value, ignoring its sign or phase.', example: '|Z| = impedance magnitude', glossaryTerm: 'Magnitude' },
      { symbol: '∝', name: 'proportional to', meaning: 'Rises and falls together with.', example: 'SPL ∝ 1 / r²', glossaryTerm: 'Inverse Square Law' },
      { symbol: '→', name: 'yields / sends', meaning: 'Leads to — or SEND a result into the next calculator.', example: 'sensitivity → voltage → gain' },
      { symbol: '↔︎', name: 'converts both ways', meaning: 'A two-way conversion.', example: 'frames ↔︎ time' },
      { symbol: ':', name: 'ratio', meaning: 'A ratio between two quantities.', example: '3:1 mic rule · N:1 turns', glossaryTerm: 'Ratio' },
    ],
  },
  {
    title: 'CALCULUS & LOGARITHMS',
    entries: [
      { symbol: 'log₁₀', name: 'base-10 logarithm', meaning: 'Log to base 10 — the heart of the decibel.', example: 'dB = 20·log₁₀(V₁ / V₂)', glossaryTerm: 'Common Logarithm' },
      { symbol: 'ln', name: 'natural logarithm', meaning: 'Log to base e — used in decay and the Eyring reverb formula.', example: 'RT ∝ −ln(1 − ā)', glossaryTerm: 'Natural Logarithm' },
      { symbol: 'e', name: 'Euler’s number', meaning: '≈ 2.71828 — the base of natural growth and decay.', example: 'level = e^(−t / τ)', glossaryTerm: "Euler's Formula" },
      { symbol: '∂', name: 'partial derivative', meaning: 'Rate of change of one variable with the others held fixed.' },
      { symbol: '∫', name: 'integral', meaning: 'Area under a curve — totals energy, RMS, or a convolution.' },
      { symbol: '∏', name: 'product (capital pi)', meaning: 'Multiply every term in a series — the × counterpart of Σ.' },
      { symbol: 'lim', name: 'limit', meaning: 'The value an expression approaches.' },
      { symbol: '∞', name: 'infinity', meaning: 'Without bound — larger than any number.' },
      { symbol: 'd', name: 'differential', meaning: 'An infinitesimal calculus change (vs Δ, a measurable step).' },
    ],
  },
  {
    title: 'POWERS, SUBSCRIPTS & PREFIXES',
    entries: [
      { symbol: 'x²  x³', name: 'power / exponent', meaning: 'A value raised to a power — x² is x·x.', example: '|Z| = √(R² + X²)' },
      { symbol: 'x⁻¹', name: 'negative exponent', meaning: 'A reciprocal — x⁻¹ = 1 / x.', example: 's⁻¹ = per second' },
      { symbol: 'x₀ x₁ xₙ', name: 'subscript', meaning: 'Labels or numbers a specific item.', example: 'f₀ = resonant frequency' },
      { symbol: 'xᵢ', name: 'index', meaning: 'The i-th item in a list or series.' },
      { symbol: '°', name: 'degree', meaning: 'An angle, or a temperature (°C / °F).' },
      { symbol: '%', name: 'percent', meaning: 'Parts per hundred.' },
      { symbol: '½', name: 'fraction', meaning: 'A part of a whole.' },
      { symbol: 'p n µ m k M G T', name: 'SI prefixes', meaning: 'Scale a unit: pico, nano, micro, milli, kilo, mega, giga, tera.', example: 'kΩ · MHz · µF · ms' },
    ],
  },
  {
    title: 'COMMON VARIABLES',
    entries: [
      { symbol: 'c', name: 'speed of sound', meaning: 'Speed of sound in air ≈ 343 m/s at 20 °C.', glossaryTerm: 'Speed of Sound' },
      { symbol: 'f', name: 'frequency', meaning: 'Cycles per second, in hertz (Hz).', glossaryTerm: 'Frequency' },
      { symbol: 'T', name: 'period', meaning: 'Seconds for one cycle: T = 1 / f.', glossaryTerm: 'Period' },
      { symbol: 'Q', name: 'quality factor', meaning: 'Filter sharpness, or a source’s directivity.', glossaryTerm: 'Quality factor' },
      { symbol: 'Z  R  X', name: 'impedance / resistance / reactance', meaning: 'All measured in ohms (Ω); Z combines R and X.', glossaryTerm: 'Impedance' },
      { symbol: 'fs', name: 'sample rate', meaning: 'Digital samples per second — or a driver’s resonant frequency.', glossaryTerm: 'Sample Rate' },
      { symbol: 'Sd  Xmax  N', name: 'driver & transformer terms', meaning: 'Cone area · peak excursion · turns ratio or filter taps.' },
    ],
  },
  {
    // Owner 2026-08-10: a plain awareness note — these values recur because the
    // same mathematics underlies many corners of audio. No mystique, no extra
    // weight; the learner should simply recognize them when they show up.
    title: 'VALUES THAT KEEP TURNING UP',
    note:
      'These are not special constants to memorize — they fall out of the same underlying math ' +
      'again and again across level, acoustics, electronics and digital audio. Recognizing them ' +
      'in a result is a sign you are seeing the connection, not a coincidence.',
    entries: [
      {
        symbol: '0.707',
        name: '1/√2',
        meaning: 'A sine wave’s RMS is 0.707 × its peak; a −3 dB point is ×0.707 in amplitude; a filter’s cutoff is defined where the response falls to 0.707.',
        example: '10 V peak sine → 7.07 V RMS',
        glossaryTerm: 'RMS (Root Mean Square)',
      },
      {
        symbol: '1.414',
        name: '√2',
        meaning: 'The inverse of 0.707: peak = 1.414 × RMS; +3 dB is ×1.414 in amplitude; Q ≈ 1.41 is a one-octave-wide bell.',
        example: '1 V RMS sine swings to ±1.414 V peak',
      },
      {
        symbol: '2',
        name: 'doubling',
        meaning: 'One octave is a 2:1 frequency ratio; doubling power adds 3 dB; doubling distance from a point source loses 6 dB; one more bit doubles the quantization levels.',
        glossaryTerm: 'Octave',
      },
      {
        symbol: '3.01 dB',
        name: 'the power-doubling step',
        meaning: 'Double (or halve) any POWER quantity and the level moves 3 dB. Two equal uncorrelated sources sum to +3 dB.',
        example: '2 × 100 W = +3 dB, not twice as loud',
        glossaryTerm: 'Decibel',
      },
      {
        symbol: '6.02 dB',
        name: 'the amplitude-doubling step',
        meaning: 'Double (or halve) any AMPLITUDE quantity — voltage, sound pressure — and the level moves 6 dB. Also one bit of dynamic range, and the free-field loss per doubling of distance.',
        example: '2 × the voltage = +6 dB = ~1 more bit',
      },
      {
        symbol: '10 · 20',
        name: 'the two dB multipliers',
        meaning: '10·log for power quantities, 20·log for amplitude quantities — the 20 exists because power goes as amplitude squared. Same physical change, same dB, two formulas.',
        glossaryTerm: 'Decibel',
      },
      {
        symbol: '2π',
        name: 'one cycle in radians',
        meaning: 'One full cycle is 2π radians, so ω = 2πf. It appears in reactance (2πfL, 1/2πfC), resonance, and phase math whenever rotation underlies the formula.',
        example: 'XL = 2π·f·L',
        glossaryTerm: 'Angular Frequency',
      },
      {
        symbol: '343 m/s',
        name: 'speed of sound (20 °C air)',
        meaning: 'The bridge between frequency and size, and between distance and time: λ = 343/f, and sound covers about a foot per millisecond.',
        example: '34.3 m in 100 ms · 1 ft ≈ 1 ms',
        glossaryTerm: 'Speed of Sound',
      },
      {
        symbol: '60,000',
        name: 'milliseconds per minute',
        meaning: 'Tempo math’s conversion factor: one beat in ms = 60,000 ÷ BPM.',
        example: '120 BPM → 500 ms per beat',
        glossaryTerm: 'BPM',
      },
    ],
  },
];
