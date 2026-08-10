/**
 * Symbol key for the Audio Calculator Laboratory — Greek letters, calculus /
 * math symbols, and notation used across the calculators.
 *
 * Authored 2026-08-09 (owner: "create a list of every greek, calculus, and other
 * math symbol we need in the key"). Grounded in the actual glyph inventory of
 * every calculator formula/unit (marked "used") plus the standard math/calculus
 * symbols a professional reference should carry. Rendered by CalcSymbolsKeyScreen.
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
};

export type SymbolGroup = {
  /** Section label — e.g. 'Greek letters', 'Calculus', 'Operators', 'Numbers'. */
  title: string;
  entries: SymbolEntry[];
};

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    title: 'GREEK LETTERS',
    entries: [
      { symbol: 'π', name: 'pi', meaning: 'The constant 3.14159… the circle ratio; appears wherever rotation or waves do.', example: 'XL = 2·π·f·L' },
      { symbol: 'Σ', name: 'sigma (capital)', meaning: 'Sum — add up every term in a series. Also the Calc Lab’s emblem.', example: 'Total absorption = Σ (S·α)' },
      { symbol: 'Δ', name: 'delta (capital)', meaning: 'A change, or the difference between two values.', example: 'Δt = arrival-time difference' },
      { symbol: 'λ', name: 'lambda', meaning: 'Wavelength — the length of one cycle in space, in metres.', example: 'λ = c / f' },
      { symbol: 'ω', name: 'omega (small)', meaning: 'Angular frequency in radians per second: ω = 2πf.', example: 'XL = ω·L' },
      { symbol: 'Ω', name: 'omega (capital)', meaning: 'Ohms — the unit of impedance, resistance and reactance.', example: '8 Ω loudspeaker' },
      { symbol: 'φ', name: 'phi', meaning: 'Phase angle between voltage and current (or between two signals).', example: 'φ = atan((XL − XC) / R)' },
      { symbol: 'θ', name: 'theta', meaning: 'A general angle — incidence, coverage, or a source’s position.', example: 'path = d·sin(θ)' },
      { symbol: 'α', name: 'alpha', meaning: 'Absorption coefficient, from 0 (reflective) to 1 (fully absorbing).', example: 'Sabine RT uses S·α' },
      { symbol: 'ā', name: 'a-bar', meaning: 'Average absorption coefficient — the area-weighted mean of α.', example: 'Eyring: −S·ln(1 − ā)' },
      { symbol: 'ρ', name: 'rho', meaning: 'Resistivity (Ω·m) for cable, or density (kg/m³) for air.', example: 'R = ρ·2L / A' },
      { symbol: 'τ', name: 'tau', meaning: 'Time constant — how fast an RC circuit or a decay settles.', example: 'τ = R·C' },
      { symbol: 'µ', name: 'mu / micro', meaning: 'Greek “mu”. As a unit prefix it means one-millionth (10⁻⁶).', example: 'µF · µs · µPa' },
      { symbol: 'η', name: 'eta', meaning: 'Efficiency — useful output divided by input, often a percentage.' },
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
      { symbol: '∥', name: 'parallel', meaning: 'Combine impedances in parallel.', example: 'Z₁ ∥ Z₂' },
      { symbol: '| |', name: 'absolute value / magnitude', meaning: 'The size of a value, ignoring its sign or phase.', example: '|Z| = impedance magnitude' },
      { symbol: '∝', name: 'proportional to', meaning: 'Rises and falls together with.', example: 'SPL ∝ 1 / r²' },
      { symbol: '→', name: 'yields / sends', meaning: 'Leads to — or SEND a result into the next calculator.', example: 'sensitivity → voltage → gain' },
      { symbol: '↔', name: 'converts both ways', meaning: 'A two-way conversion.', example: 'frames ↔ time' },
      { symbol: ':', name: 'ratio', meaning: 'A ratio between two quantities.', example: '3:1 mic rule · N:1 turns' },
    ],
  },
  {
    title: 'CALCULUS & LOGARITHMS',
    entries: [
      { symbol: 'log₁₀', name: 'base-10 logarithm', meaning: 'Log to base 10 — the heart of the decibel.', example: 'dB = 20·log₁₀(V₁ / V₂)' },
      { symbol: 'ln', name: 'natural logarithm', meaning: 'Log to base e — used in decay and the Eyring reverb formula.', example: 'RT ∝ −ln(1 − ā)' },
      { symbol: 'e', name: 'Euler’s number', meaning: '≈ 2.71828 — the base of natural growth and decay.', example: 'level = e^(−t / τ)' },
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
      { symbol: 'c', name: 'speed of sound', meaning: 'Speed of sound in air ≈ 343 m/s at 20 °C.' },
      { symbol: 'f', name: 'frequency', meaning: 'Cycles per second, in hertz (Hz).' },
      { symbol: 'T', name: 'period', meaning: 'Seconds for one cycle: T = 1 / f.' },
      { symbol: 'Q', name: 'quality factor', meaning: 'Filter sharpness, or a source’s directivity.' },
      { symbol: 'Z  R  X', name: 'impedance / resistance / reactance', meaning: 'All measured in ohms (Ω); Z combines R and X.' },
      { symbol: 'fs', name: 'sample rate', meaning: 'Digital samples per second — or a driver’s resonant frequency.' },
      { symbol: 'Sd  Xmax  N', name: 'driver & transformer terms', meaning: 'Cone area · peak excursion · turns ratio or filter taps.' },
    ],
  },
];
