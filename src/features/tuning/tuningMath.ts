/**
 * tuningMath — the Tuning & Temperament Lab's single mathematical source of
 * truth (build spec Stage 1 §11–12, Stage 5 §1–2).
 *
 * Pure, no React. Exact display expressions are kept SEPARATE from the
 * floating-point values used for calculation: every note carries an exact
 * label (fraction or radical), a decimal label, and the numeric ratio the
 * visuals, cents, frequencies and audio all derive from. No second table of
 * frequencies exists anywhere — frequency = root × ratio, always.
 *
 * Verified by test/tuningMath.test.ts (npm test).
 */

/* ── constants ──────────────────────────────────────────────────────────── */

/** Twelve-tone equal-tempered C4 when A4 = 440 Hz: 440 · 2^(−9/12). */
export const C4_ET = 440 * Math.pow(2, -9 / 12); // 261.6255653…

export const CENTS_PER_OCTAVE = 1200;

/* ── exact fractions (small enough for exact doubles: 3^12 · 2^19 ≪ 2^53) ── */

export type Frac = { n: number; d: number };

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export function frac(n: number, d = 1): Frac {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) throw new Error('invalid fraction');
  const g = gcd(Math.round(n), Math.round(d)) || 1;
  return { n: Math.round(n) / g, d: Math.round(d) / g };
}
export const fracValue = (f: Frac): number => f.n / f.d;
export const fracLabel = (f: Frac): string => (f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`);
export const fracMul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const fracDiv = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);
export const fracEq = (a: Frac, b: Frac): boolean => a.n === b.n && a.d === b.d;

/* ── conversions ────────────────────────────────────────────────────────── */

/** c = 1200 · log₂(r). Throws on non-positive ratios (never NaN to the UI). */
export function ratioToCents(ratio: number): number {
  if (!(ratio > 0) || !Number.isFinite(ratio)) throw new Error('ratio must be positive and finite');
  return CENTS_PER_OCTAVE * Math.log2(ratio);
}

/** r = 2^(c/1200). */
export function centsToRatio(cents: number): number {
  if (!Number.isFinite(cents)) throw new Error('cents must be finite');
  return Math.pow(2, cents / CENTS_PER_OCTAVE);
}

export function frequencyFromRatio(rootHz: number, ratio: number): number {
  if (!(rootHz > 0) || !(ratio > 0)) throw new Error('root and ratio must be positive');
  return rootHz * ratio;
}

/** Cents of ratioA above ratioB (negative when below). */
export function centsDifference(ratioA: number, ratioB: number): number {
  return ratioToCents(ratioA) - ratioToCents(ratioB);
}

/* ── octave normalization (comparison range 1 ≤ r < 2) ──────────────────── */

export type OctaveOp = '×2' | '÷2';

export type NormalizeTrace = {
  /** Every intermediate stage, in order, so an animation can show each step. */
  steps: { op: OctaveOp; before: number; after: number }[];
  ratio: number;
};

/** Numeric normalization with the trace of every ×2 / ÷2 applied. */
export function normalizeRatioToOctave(ratio: number): number {
  return normalizeRatioTrace(ratio).ratio;
}

export function normalizeRatioTrace(ratio: number): NormalizeTrace {
  if (!(ratio > 0) || !Number.isFinite(ratio)) throw new Error('ratio must be positive and finite');
  const steps: NormalizeTrace['steps'] = [];
  let r = ratio;
  let guard = 0;
  while (r >= 2 && guard++ < 64) {
    steps.push({ op: '÷2', before: r, after: r / 2 });
    r /= 2;
  }
  while (r < 1 && guard++ < 128) {
    steps.push({ op: '×2', before: r, after: r * 2 });
    r *= 2;
  }
  return { steps, ratio: r };
}

export type NormalizeFracTrace = {
  steps: { op: OctaveOp; before: Frac; after: Frac }[];
  ratio: Frac;
};

/** Exact-fraction normalization with the same stepwise trace. */
export function normalizeFracToOctave(f: Frac): NormalizeFracTrace {
  const steps: NormalizeFracTrace['steps'] = [];
  let r = f;
  let guard = 0;
  while (fracValue(r) >= 2 && guard++ < 64) {
    const after = frac(r.n, r.d * 2);
    steps.push({ op: '÷2', before: r, after });
    r = after;
  }
  while (fracValue(r) < 1 && guard++ < 128) {
    const after = frac(r.n * 2, r.d);
    steps.push({ op: '×2', before: r, after });
    r = after;
  }
  return { steps, ratio: r };
}

/* ── harmonics ──────────────────────────────────────────────────────────── */

/** The fundamental is harmonic 1; harmonic n = n·f. (First OVERTONE = harmonic 2.) */
export function harmonicFrequency(fundamentalHz: number, harmonicNumber: number): number {
  if (!(fundamentalHz > 0) || !Number.isInteger(harmonicNumber) || harmonicNumber < 1) throw new Error('invalid harmonic');
  return fundamentalHz * harmonicNumber;
}

/** Signed difference in Hz between two partials — "difference between compared partials". */
export function partialDifferenceHz(frequencyA: number, frequencyB: number): number {
  return frequencyA - frequencyB;
}

/* ── display values (exact ≠ decimal) ───────────────────────────────────── */

export type DisplayValue = {
  numericRatio: number;
  /** Exact notation: a fraction like "81/64" or a radical like "⁴√5". */
  exactLabel: string;
  /** Rounded decimal for practical reading — never presented as exact. */
  decimalLabel: string;
  cents: number;
  constructionSource: string;
};

export const fmtDecimal = (v: number, places = 6): string => {
  const s = v.toFixed(places);
  return s.replace(/\.?0+$/, '') || '0';
};

export function displayFromFrac(f: Frac, source: string): DisplayValue {
  const v = fracValue(f);
  return { numericRatio: v, exactLabel: fracLabel(f), decimalLabel: fmtDecimal(v), cents: ratioToCents(v), constructionSource: source };
}

export function displayFromIrrational(value: number, exactLabel: string, source: string): DisplayValue {
  return { numericRatio: value, exactLabel, decimalLabel: fmtDecimal(value), cents: ratioToCents(value), constructionSource: source };
}

/* ── landmark intervals and commas ──────────────────────────────────────── */

export const OCTAVE = displayFromFrac(frac(2, 1), 'octave');
export const PURE_FIFTH = displayFromFrac(frac(3, 2), 'pure perfect fifth');
export const PURE_FOURTH = displayFromFrac(frac(4, 3), 'pure perfect fourth');
export const JUST_MAJOR_THIRD = displayFromFrac(frac(5, 4), 'just major third');
export const JUST_MINOR_THIRD = displayFromFrac(frac(6, 5), 'just minor third');
export const PYTHAGOREAN_MAJOR_THIRD = displayFromFrac(frac(81, 64), 'four pure fifths, two octaves down');

/** ((3/2)^12) ÷ 2^7 = 531441/524288 ≈ 23.46 cents. */
export const PYTHAGOREAN_COMMA_FRAC: Frac = frac(Math.pow(3, 12), Math.pow(2, 19));
export const PYTHAGOREAN_COMMA = displayFromFrac(PYTHAGOREAN_COMMA_FRAC, '(3/2)¹² ÷ 2⁷');

/** (81/64) ÷ (5/4) = 81/80 ≈ 21.51 cents. */
export const SYNTONIC_COMMA_FRAC: Frac = frac(81, 80);
export const SYNTONIC_COMMA = displayFromFrac(SYNTONIC_COMMA_FRAC, '(81/64) ÷ (5/4)');

/** Quarter-comma meantone generator g = ⁴√5 ≈ 696.58 cents. */
export const MEANTONE_FIFTH_RATIO = Math.pow(5, 1 / 4);
export const MEANTONE_FIFTH = displayFromIrrational(MEANTONE_FIFTH_RATIO, '⁴√5', 'g⁴ = 5 (four fifths reach 5/4 two octaves up)');
/** Quarter-comma whole tone t = √(5/4) = √5/2 ≈ 193.16 cents. */
export const MEANTONE_TONE_RATIO = Math.sqrt(5) / 2;
export const MEANTONE_TONE = displayFromIrrational(MEANTONE_TONE_RATIO, '√5/2', 't² = 5/4');

export const ET_SEMITONE_RATIO = Math.pow(2, 1 / 12);
export const ET_SEMITONE = displayFromIrrational(ET_SEMITONE_RATIO, '2^(1/12)', 'r¹² = 2');
export const ET_FIFTH = displayFromIrrational(Math.pow(2, 7 / 12), '2^(7/12)', 'seven equal semitones');
export const ET_MAJOR_THIRD = displayFromIrrational(Math.pow(2, 4 / 12), '2^(1/3)', 'four equal semitones');

/* ── tuning systems ─────────────────────────────────────────────────────── */

export type TuningSystemId = 'pythagorean' | 'just' | 'meantone' | 'equal';

export type TuningNote = {
  spelling: string;
  /** Scale degree 1..8 for the diatonic C-major examples (8 = octave). */
  degree: number;
  value: DisplayValue;
};

export type TuningSystem = {
  id: TuningSystemId;
  name: string;
  shortName: string;
  description: string;
  rule: string;
  root: 'C';
  notes: TuningNote[];
  limitations: string[];
};

const DIATONIC = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] as const;

/** Pythagorean fifth-chain spellings from C (implementation truth, spec ch.5). */
export const PYTHAGOREAN_CHAIN_SPELLINGS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'] as const;

export type FifthStep = {
  index: number; // 0 = C
  spelling: string;
  /** previous normalized ratio × 3/2 before any octave reduction. */
  unreduced: Frac;
  /** Each ÷2 stage applied to bring it inside the octave. */
  reductions: { before: Frac; after: Frac }[];
  normalized: Frac;
  cents: number;
};

/** Chain of pure fifths from a start ratio, each folded into one octave. */
export function buildPythagoreanFifthChain(start: Frac = frac(1, 1), count = 12): FifthStep[] {
  const steps: FifthStep[] = [];
  let current = start;
  for (let i = 0; i <= count; i++) {
    if (i === 0) {
      steps.push({ index: 0, spelling: PYTHAGOREAN_CHAIN_SPELLINGS[0], unreduced: current, reductions: [], normalized: current, cents: ratioToCents(fracValue(current)) });
      continue;
    }
    const unreduced = fracMul(current, frac(3, 2));
    const trace = normalizeFracToOctave(unreduced);
    current = trace.ratio;
    steps.push({
      index: i,
      spelling: PYTHAGOREAN_CHAIN_SPELLINGS[i] ?? `+${i} fifths`,
      unreduced,
      reductions: trace.steps.map((s) => ({ before: s.before, after: s.after })),
      normalized: current,
      cents: ratioToCents(fracValue(current)),
    });
  }
  return steps;
}

export function buildPythagoreanCMajor(): TuningSystem {
  const chain = buildPythagoreanFifthChain(frac(1, 1), 5); // C G D A E B
  const byName = new Map(chain.map((s) => [s.spelling, s.normalized]));
  const F = frac(4, 3); // one fifth DOWN from C, folded up (2/3 × 2)
  const ratios: Record<string, Frac> = {
    C: frac(1, 1), D: byName.get('D')!, E: byName.get('E')!, F, G: byName.get('G')!, A: byName.get('A')!, B: byName.get('B')!,
  };
  return {
    id: 'pythagorean',
    name: 'Pythagorean C-major example',
    shortName: 'Pythagorean',
    description: 'Every note generated from pure 3:2 fifths, folded into one octave.',
    rule: 'Multiply by 3/2 repeatedly; divide by 2 to fold each result into the octave.',
    root: 'C',
    notes: DIATONIC.map((sp, i) => ({
      spelling: sp,
      degree: i + 1,
      value: displayFromFrac(i === 7 ? frac(2, 1) : ratios[sp], i === 7 ? 'octave' : sp === 'F' ? 'one fifth below C, folded up' : `${['', 'two', 'four', '', 'one', 'three', 'five'][i]} pure fifth${i === 4 ? '' : 's'} from C`),
    })),
    limitations: ['Built from powers of 2 and 3 only', 'Major thirds are wide (81/64)', 'Twelve fifths do not close against seven octaves'],
  };
}

export function buildCommonFiveLimitCMajor(): TuningSystem {
  const ratios: [string, Frac, string][] = [
    ['C', frac(1, 1), 'root'], ['D', frac(9, 8), 'two pure fifths, folded'], ['E', frac(5, 4), 'pure major third'],
    ['F', frac(4, 3), 'pure fourth'], ['G', frac(3, 2), 'pure fifth'], ['A', frac(5, 3), 'pure major third above F'],
    ['B', frac(15, 8), 'pure major third above G'], ['C', frac(2, 1), 'octave'],
  ];
  return {
    id: 'just',
    name: 'One common five-limit Just C-major example',
    shortName: 'Just (5-limit)',
    description: 'Selected small whole-number ratios chosen to make important C-major intervals pure.',
    rule: 'Choose ratios built from 2, 3 and 5 so that the C, F and G major triads are 4:5:6.',
    root: 'C',
    notes: ratios.map(([sp, f, src], i) => ({ spelling: sp, degree: i + 1, value: displayFromFrac(f, src) })),
    limitations: ['One selected mapping of many', 'Fixed pitches cannot keep every simple ratio in every key', 'Performers may adjust pitch with context'],
  };
}

/** Quarter-comma meantone C-major: every note from the same tempered fifth g = ⁴√5, folded. */
export function buildQuarterCommaMeantoneC(): TuningSystem {
  const g = MEANTONE_FIFTH_RATIO;
  const defs: [string, number, string, string][] = [
    ['C', 1, '1', 'root'],
    ['D', Math.pow(g, 2) / 2, '√5/2', 'g² ÷ 2'],
    ['E', Math.pow(g, 4) / 4, '5/4', 'g⁴ ÷ 4'],
    ['F', 2 / g, '2/5^(1/4)', '2 ÷ g'],
    ['G', g, '5^(1/4)', 'g'],
    ['A', Math.pow(g, 3) / 2, '5^(3/4)/2', 'g³ ÷ 2'],
    ['B', Math.pow(g, 5) / 4, '5^(5/4)/4', 'g⁵ ÷ 4'],
    ['C', 2, '2', 'octave'],
  ];
  return {
    id: 'meantone',
    name: 'Quarter-comma meantone C-major example',
    shortName: 'Quarter-comma meantone',
    description: 'Fifths narrowed by a quarter of the syntonic comma so that four of them make a pure 5:4 major third.',
    rule: 'Use one tempered fifth g = ⁴√5 for every step, then fold into the octave.',
    root: 'C',
    notes: defs.map(([sp, v, exact, src], i) => ({ spelling: sp, degree: i + 1, value: displayFromIrrational(v, exact, src) })),
    limitations: ['Ordinary fifths are 5.38 cents narrow', 'Keys behave unequally', 'A twelve-note chain closes with a wolf interval'],
  };
}

export function buildTwelveToneEqualTemperament(): TuningSystem {
  // Diatonic view (C major) of the chromatic scale: semitone counts 0 2 4 5 7 9 11 12.
  const semis = [0, 2, 4, 5, 7, 9, 11, 12];
  return {
    id: 'equal',
    name: 'Twelve-tone equal temperament',
    shortName: 'Equal temperament',
    description: 'Twelve identical semitone ratios per octave; every interval with the same number of semitones has the same ratio in every key.',
    rule: 'r¹² = 2, so each semitone is 2^(1/12); note k is 2^(k/12).',
    root: 'C',
    notes: DIATONIC.map((sp, i) => ({
      spelling: sp,
      degree: i + 1,
      value: displayFromIrrational(Math.pow(2, semis[i] / 12), semis[i] === 0 ? '1' : semis[i] === 12 ? '2' : `2^(${semis[i]}/12)`, `${semis[i]} semitones`),
    })),
    limitations: ['Fifths are 1.96 cents narrow', 'Major thirds are 13.69 cents wide', 'No interval except the octave is a small whole-number ratio'],
  };
}

export const TUNING_SYSTEMS: Record<TuningSystemId, TuningSystem> = {
  pythagorean: buildPythagoreanCMajor(),
  just: buildCommonFiveLimitCMajor(),
  meantone: buildQuarterCommaMeantoneC(),
  equal: buildTwelveToneEqualTemperament(),
};

/** Full chromatic equal temperament, 13 entries, for the cents rail and keyboard. */
export const ET_CHROMATIC_SPELLINGS = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B', 'C'] as const;
export function buildEqualChromatic(): { spelling: string; value: DisplayValue }[] {
  return ET_CHROMATIC_SPELLINGS.map((sp, k) => ({ spelling: sp, value: displayFromIrrational(Math.pow(2, k / 12), k === 0 ? '1' : k === 12 ? '2' : `2^(${k}/12)`, `${k} semitones`) }));
}

/** Signed cents deviation of a note from its equal-tempered counterpart (by degree). */
export function deviationFromEqualCents(note: TuningNote): number {
  const et = TUNING_SYSTEMS.equal.notes.find((n) => n.degree === note.degree)!;
  return note.value.cents - et.value.cents;
}

/* ── the meantone wolf (selected E♭ … G♯ chain) ─────────────────────────── */

export const MEANTONE_WOLF_CHAIN = ['E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯'] as const;

export function meantoneWolf(): { normalFifthCents: number; wolfCents: number; widerThanNormalBy: number; from: string; to: string } {
  const normal = MEANTONE_FIFTH.cents;
  const wolf = 7 * CENTS_PER_OCTAVE - 11 * normal; // what is left after eleven tempered fifths in seven octaves
  return { normalFifthCents: normal, wolfCents: wolf, widerThanNormalBy: wolf - normal, from: 'G♯', to: 'E♭' };
}

/* ── interval landmarks for the rail ────────────────────────────────────── */

export const LANDMARKS: { value: DisplayValue; name: string }[] = [
  { value: displayFromFrac(frac(1, 1), 'unison'), name: 'Unison' },
  { value: JUST_MINOR_THIRD, name: 'Just minor third' },
  { value: JUST_MAJOR_THIRD, name: 'Just major third' },
  { value: PURE_FOURTH, name: 'Pure perfect fourth' },
  { value: PURE_FIFTH, name: 'Pure perfect fifth' },
  { value: OCTAVE, name: 'Octave' },
];

/** Nearest landmark within `withinCents`, or null. */
export function nearestLandmark(cents: number, withinCents = 12): { value: DisplayValue; name: string } | null {
  let best: { value: DisplayValue; name: string } | null = null;
  let bestD = Infinity;
  for (const l of LANDMARKS) {
    const d = Math.abs(l.value.cents - cents);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return bestD <= withinCents ? best : null;
}
