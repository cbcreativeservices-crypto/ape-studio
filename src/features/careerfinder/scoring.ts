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

/** Display names. "Developing" is the bottom band of most school rubrics, so
 *  the third state is shown as EARLY (learning review 2026-09-04) — the
 *  internal key keeps the brief's name. */
export const CLARITY_LABEL: Record<Clarity, string> = { clear: 'Clear Profile', broad: 'Broad Profile', developing: 'Early Profile' };

/** Thresholds (Beta; provisional until real response data exists). */
export const CLARITY_RULES = {
  /** More than this share of answers were "I don’t know" → early/developing. */
  unknownShare: 0.25,
  /** A dimension at or above this counts as a strong preference. */
  strong: 0.75,
  /** Clear = at least one strong dimension AND at least this spread between
   *  the highest and lowest rated dimension (Holland/O*NET differentiation is
   *  the GAP between highs and lows, not a count of highs — a two-strong,
   *  everything-else-low profile is the sharpest profile there is). */
  spread: 0.375,
} as const;

/** Only dimensions with evidence take part in differentiation. */
function rated(dims: DimensionScores): number[] {
  return DIMENSION_CODES.map((k) => dims[k]).filter((d) => !d.insufficient).map((d) => d.score);
}

export function clarity(responses: Responses, dims: DimensionScores): Clarity {
  const answered = QUESTIONS.filter((q) => q.id in responses);
  const unknown = answered.filter((q) => responses[q.id] === null).length;
  if (answered.length > 0 && unknown / answered.length > CLARITY_RULES.unknownShare) return 'developing';
  const scores = rated(dims);
  if (!scores.length) return 'broad';
  const strong = scores.filter((s) => s >= CLARITY_RULES.strong).length;
  const spread = Math.max(...scores) - Math.min(...scores);
  if (strong >= 1 && spread >= CLARITY_RULES.spread) return 'clear';
  return 'broad';
}

/**
 * What the clarity label means for THIS profile, and what to do next. Every
 * sentence names an action; none uses a grading word.
 */
export function clarityCopy(c: Clarity, dims: DimensionScores): string {
  const scores = rated(dims);
  const strong = scores.filter((s) => s >= CLARITY_RULES.strong).length;
  if (c === 'developing') return 'Many activities were new to you, so the picture is incomplete rather than wrong. Exposure will teach you more than more questions would — open one family you said you didn’t know enough about, then answer again.';
  if (c === 'clear') {
    const n = strong === 1 ? 'One activity' : strong === 2 ? 'Two activities' : strong === 3 ? 'Three activities' : 'Several activities';
    return `${n} stood out clearly and the rest sat lower, so these directions rest on real preferences. Open your top two and compare what each one leans on.`;
  }
  if (scores.length && scores.every((s) => s < 0.5)) {
    return 'You rated most activities on the dislike side. That usually means the activities you would enjoy are not in this set yet, or that you answered on whether you would be good at them rather than whether you would enjoy them. Browse the families, then answer again for enjoyment only.';
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

/** Interest bands. Exactly 0.5 (Neutral / Neutral) is NEUTRAL — it is never
 *  reported back as "some interest", which would misquote the user. */
export type Band = 'strong' | 'some' | 'neutral' | 'little';
export const band = (s: number): Band => (s >= 0.75 ? 'strong' : s > 0.5 ? 'some' : s === 0.5 ? 'neutral' : 'little');

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Deterministic "why it appeared", built ONLY from the family’s three
 * dimensions and the user’s actual scores. Never claims talent,
 * qualification, success, perfection, or that another career should be
 * avoided; a low rating is a trade-off to notice, never a caution.
 *
 *   rank ≤ 2 → "Leans on Record & Capture and Edit & Refine — your strongest
 *              interests. It also draws on Create & Perform, which you rated
 *              lower — notice how much of each family that is as you compare."
 *   otherwise → "This appeared because you showed strong interest in … ."
 *   primary low → "Its main activity is X, which you rated lower. It still
 *              appeared because you showed … ."
 */
export function explainFamily(family: CareerFamily, dims: DimensionScores, opts: { rank?: number } = {}): string {
  const strong: string[] = [], some: string[] = [], neutral: string[] = [], little: string[] = [], none: string[] = [];
  for (const code of family.dimensions) {
    const d = dims[code];
    const label = DIMENSIONS[code].label;
    if (d.insufficient) none.push(label);
    else {
      const b = band(d.score);
      if (b === 'strong') strong.push(label);
      else if (b === 'some') some.push(label);
      else if (b === 'neutral') neutral.push(label);
      else little.push(label);
    }
  }
  const primary = dims[family.dimensions[0]];
  const primaryLow = !primary.insufficient && band(primary.score) === 'little';
  const primaryLabel = DIMENSIONS[family.dimensions[0]].label;

  const parts: string[] = [];
  if (strong.length) parts.push(`strong interest in ${list(strong)} activities`);
  if (some.length) parts.push(`some interest in ${list(some)}`);
  if (neutral.length) parts.push(`you were neutral about ${list(neutral)}`);
  const because = parts.length ? parts.join(', and ') : null;

  let sentence: string;
  if (primaryLow) {
    sentence = `Its main activity is ${primaryLabel}, which you rated lower.`;
    sentence += because ? ` It still appeared because you showed ${because}.` : ' It still appeared because it ranked highest against your answers overall.';
  } else if ((opts.rank ?? 99) <= 2 && strong.length) {
    sentence = `Leans on ${list(strong)} — ${strong.length === 1 ? 'your strongest interest' : 'your strongest interests'}.`;
    if (some.length) sentence += ` You also showed some interest in ${list(some)}.`;
    if (neutral.length) sentence += ` You were neutral about ${list(neutral)}.`;
  } else {
    sentence = because ? `This appeared because you showed ${because}.` : 'This appeared because it ranked highest against your answers overall.';
  }
  const lowOthers = little.filter((l) => l !== primaryLabel || !primaryLow);
  if (lowOthers.length && !primaryLow) sentence += ` It also draws on ${list(lowOthers)}, which you rated lower — notice how much of each family that is as you compare them.`;
  else if (lowOthers.length && primaryLow) sentence += ` ${list(lowOthers)} ${lowOthers.length === 1 ? 'is' : 'are'} part of this work too, rated lower as well.`;
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
