/**
 * Audio Career Finder — deterministic scoring (owner brief 2026-09-03).
 *
 *   28 answers → 14 dimension scores (0–1) → 42 family scores → ranking.
 *
 * Rules that must never bend:
 *   • "I don’t know enough about this" (null) is MISSING EVIDENCE. It is
 *     excluded from the average, never converted to zero.
 *   • Both answers null → the dimension scores 0.5 internally and is flagged
 *     insufficient; it can neither lift nor sink a family.
 *   • Family score = primary × 0.50 + secondary × 0.30 + tertiary × 0.20.
 *   • Equal scores break on the family id, so the same answers always give
 *     the same order on every device.
 *   • Nothing here produces a percentage, an aptitude, or a verdict.
 *
 * Pure: no React, no React Native, no JSON — covered by test/careerFinder.test.ts.
 */
import { DIMENSION_CODES, DIMENSIONS, type DimensionCode } from './dimensions.ts';
import { FAMILIES, type CareerFamily } from './families.ts';
import { QUESTIONS, type QuestionId, type Response } from './questions.ts';

/** Answers so far. A missing key is UNANSWERED (the user has not reached it);
 *  an explicit null is "I don’t know enough about this". */
export type Responses = Partial<Record<QuestionId, Response>>;

export type DimensionScore = {
  code: DimensionCode;
  /** 0–1. Exactly 0.5 when `insufficient`. */
  score: number;
  /** Both of the dimension’s questions were answered "I don’t know". */
  insufficient: boolean;
  /** How many of the two questions carried a rating. */
  evidence: 0 | 1 | 2;
};

export type DimensionScores = Record<DimensionCode, DimensionScore>;

export const FAMILY_WEIGHTS = [0.5, 0.3, 0.2] as const;

export function dimensionScores(responses: Responses): DimensionScores {
  const out = {} as DimensionScores;
  for (const code of DIMENSION_CODES) {
    const rated: number[] = [];
    for (const q of QUESTIONS) {
      if (q.dimension !== code) continue;
      const r = responses[q.id];
      if (typeof r === 'number') rated.push(r);
    }
    if (rated.length === 0) {
      out[code] = { code, score: 0.5, insufficient: true, evidence: 0 };
    } else {
      const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
      out[code] = { code, score: avg / 4, insufficient: false, evidence: rated.length as 1 | 2 };
    }
  }
  return out;
}

export type FamilyScore = { family: CareerFamily; score: number; rank: number };

export function familyScore(family: CareerFamily, dims: DimensionScores): number {
  return family.dimensions.reduce((sum, code, i) => sum + dims[code].score * FAMILY_WEIGHTS[i], 0);
}

/** Every family, highest first; ties broken by id so the order is stable. */
export function rankFamilies(dims: DimensionScores): FamilyScore[] {
  return FAMILIES.map((family) => ({ family, score: familyScore(family, dims), rank: 0 }))
    .sort((a, b) => b.score - a.score || (a.family.id < b.family.id ? -1 : a.family.id > b.family.id ? 1 : 0))
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

/* ── profile clarity ───────────────────────────────────────────────────── */

export type Clarity = 'clear' | 'broad' | 'developing';

export const CLARITY_LABEL: Record<Clarity, string> = { clear: 'Clear Profile', broad: 'Broad Profile', developing: 'Developing Profile' };

/** Thresholds (Beta; provisional until real response data exists). */
export const CLARITY_RULES = {
  /** More than this share of answers were "I don’t know" → developing. */
  unknownShare: 0.25,
  /** A dimension at or above this counts as a strong preference. */
  strong: 0.75,
  /** At least this many strong dimensions … */
  strongCount: 4,
  /** … AND a spread of at least this between the highest and lowest dimension → clear. */
  spread: 0.375,
} as const;

export function clarity(responses: Responses, dims: DimensionScores): Clarity {
  const answered = QUESTIONS.filter((q) => q.id in responses);
  const unknown = answered.filter((q) => responses[q.id] === null).length;
  if (answered.length > 0 && unknown / answered.length > CLARITY_RULES.unknownShare) return 'developing';
  const scores = DIMENSION_CODES.map((c) => dims[c].score);
  const strong = scores.filter((s) => s >= CLARITY_RULES.strong).length;
  const spread = Math.max(...scores) - Math.min(...scores);
  if (strong >= CLARITY_RULES.strongCount && spread >= CLARITY_RULES.spread) return 'clear';
  return 'broad';
}

/**
 * What the clarity label means for THIS profile. "Broad" covers two honest
 * situations — many activities rated alike, or only a few standing out — and
 * the sentence must describe the one that actually happened.
 */
export function clarityCopy(c: Clarity, dims: DimensionScores): string {
  if (c === 'clear') return 'Several activities clearly stood out for you, so these directions rest on distinct preferences.';
  if (c === 'developing') return 'Many activities were new to you. That is not a weakness — it means exposure will teach you more than more questions would. Explore a family, try a lab, and come back.';
  const scores = DIMENSION_CODES.map((k) => dims[k]).filter((d) => !d.insufficient).map((d) => d.score);
  const strong = scores.filter((s) => s >= CLARITY_RULES.strong).length;
  const spread = scores.length ? Math.max(...scores) - Math.min(...scores) : 0;
  if (strong > 0 && spread >= CLARITY_RULES.spread) {
    return strong === 1
      ? 'One activity stood out strongly and the rest sat lower. The families below lean on it in different ways — exploring two or three will show which setting fits.'
      : `${strong === 2 ? 'Two' : 'Three'} activities stood out strongly and the rest sat lower. The families below combine them in different ways — exploring two or three will show which setting fits.`;
  }
  return 'You rated many activities similarly. That is common, and it means more than one direction could suit you — trying things is the fastest way to tell them apart.';
}

/* ── what the user is drawn to ─────────────────────────────────────────── */

/** Dimensions with evidence, strongest first (ties broken by dimension order). */
export function strongestDimensions(dims: DimensionScores, n = 3): DimensionScore[] {
  return DIMENSION_CODES.map((c) => dims[c])
    .filter((d) => !d.insufficient)
    .sort((a, b) => b.score - a.score || DIMENSION_CODES.indexOf(a.code) - DIMENSION_CODES.indexOf(b.code))
    .slice(0, n);
}

/* ── explanations (deterministic templates, never generative) ─────────── */

const band = (s: number) => (s >= 0.75 ? 'strong' : s >= 0.5 ? 'some' : 'little');

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * "This appeared because you showed strong interest in Record & Capture and
 *  Edit & Refine activities, and some interest in Create & Perform."
 * Built ONLY from the family’s three dimensions and the user’s actual scores.
 * Never claims talent, qualification, success, perfection, or that another
 * career should be avoided.
 */
export function explainFamily(family: CareerFamily, dims: DimensionScores): string {
  const strong: string[] = [], some: string[] = [], little: string[] = [], none: string[] = [];
  for (const code of family.dimensions) {
    const d = dims[code];
    const label = DIMENSIONS[code].label;
    if (d.insufficient) none.push(label);
    else if (band(d.score) === 'strong') strong.push(label);
    else if (band(d.score) === 'some') some.push(label);
    else little.push(label);
  }
  const parts: string[] = [];
  if (strong.length) parts.push(`strong interest in ${list(strong)} activities`);
  if (some.length) parts.push(`some interest in ${list(some)}`);
  let sentence = parts.length ? `This appeared because you showed ${parts.join(', and ')}.` : 'This appeared because it ranked highest against your answers overall.';
  if (little.length) sentence += ` You showed little interest in ${list(little)}, which this family also involves.`;
  if (none.length) sentence += ` You said you did not know enough about ${list(none)} yet, so that part is unexplored rather than ruled out.`;
  return sentence;
}

/* ── the whole result ──────────────────────────────────────────────────── */

export type Result = {
  dims: DimensionScores;
  ranked: FamilyScore[];
  top: FamilyScore[];
  /** One family ranked just below the top five that leans on the user’s
   *  strongest dimension and comes from a field NOT already in the top five —
   *  the "you may not have considered" card. Absent when nothing qualifies. */
  surprise: FamilyScore | null;
  clarity: Clarity;
  strongest: DimensionScore[];
  answered: number;
  unknown: number;
};

export const TOP_N = 5;

export function computeResult(responses: Responses, fieldOf?: (familyId: string) => string | undefined): Result {
  const dims = dimensionScores(responses);
  const ranked = rankFamilies(dims);
  const top = ranked.slice(0, TOP_N);
  const strongest = strongestDimensions(dims);
  const lead = strongest[0]?.code;
  const topFields = new Set(top.map((t) => fieldOf?.(t.family.id)).filter(Boolean));
  const surprise = lead
    ? ranked.slice(TOP_N, TOP_N + 8).find((f) => f.family.dimensions.includes(lead) && !topFields.has(fieldOf?.(f.family.id))) ?? null
    : null;
  const answered = QUESTIONS.filter((q) => q.id in responses).length;
  const unknown = QUESTIONS.filter((q) => responses[q.id] === null).length;
  return { dims, ranked, top, surprise, clarity: clarity(responses, dims), strongest, answered, unknown };
}
