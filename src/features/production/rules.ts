/**
 * production/rules — turn a project's answers into findings.
 *
 * This is where the lab stops being a form and starts being useful. A form
 * collects; a rule notices that twelve songs will not fit in two days, that
 * nobody has been named to carry the media home, or that a clean version was
 * promised and never planned.
 *
 * THE DIVISION OF LABOUR (plan §12). Computer C authors the content and the
 * INTENT of every rule; C never writes logic. A rule that needs comparison or
 * arithmetic is authored with `needsLogic: true` plus prose, and its calculation
 * is implemented HERE against the same ruleId. That keeps authoring editorial
 * and correctness testable.
 *
 * Pure functions, no React, no react-native.
 */
import type {
  Finding,
  FieldValue,
  PathwayId,
  ProductionProject,
  ValueMap,
} from './types';
import { isAnswered, valueKey } from './types';
import type { ResolvedStage, RuleDef } from './schema';
import { stageFields } from './schema';

/**
 * What a computed rule receives. Everything it needs to decide, and nothing it
 * could use to reach outside the project — which keeps rules trivially testable.
 */
export type RuleContext = {
  project: ProductionProject;
  stage: ResolvedStage;
  pathway: PathwayId;
  values: ValueMap;
  /** Read a value from ANY stage, so cross-stage rules are possible. */
  get(stageId: string, fieldId: string): FieldValue | undefined;
  /** Convenience for the common "is this decided" question. */
  answered(stageId: string, fieldId: string): boolean;
  /** Marked not-applicable, with a reason. */
  isNa(stageId: string, fieldId: string): boolean;
  /** Today, injectable so date rules are deterministic under test. */
  now: number;
};

/**
 * A computed rule returns true when the problem IS present.
 * Returning false means "nothing to say", which must be the common case: a rule
 * that fires on a healthy project is worse than no rule at all.
 */
export type RuleLogic = (ctx: RuleContext) => boolean;

/**
 * The implementations, keyed by the ruleId Computer C authored.
 *
 * Adding content never requires touching this file UNLESS the author marked a
 * rule `needsLogic`. A `needsLogic` rule with no entry here is reported by
 * `missingLogic()` and caught in tests, so an unimplemented rule can never
 * quietly do nothing.
 */
export const RULE_LOGIC: Record<string, RuleLogic> = {};

/** Register implementations. Called by each lab's content module at import. */
export function registerRuleLogic(entries: Record<string, RuleLogic>): void {
  for (const [id, fn] of Object.entries(entries)) RULE_LOGIC[id] = fn;
}

// ── generic helpers the implementations lean on ──────────────────────────────

/** Trimmed string value, or ''. */
export function str(v: FieldValue | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Finite number, or null. */
export function num(v: FieldValue | undefined): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Selected option values of a multiChoice, or []. */
export function many(v: FieldValue | undefined): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : [];
}

/**
 * Parse a date field to epoch ms, or null.
 *
 * A bare `YYYY-MM-DD` is built as a LOCAL date, deliberately. `Date.parse` reads
 * a date-only string as UTC midnight, so west of Greenwich a deadline of "today"
 * lands before the user's own start of day and reads as already past. A date
 * field in a production plan means a calendar day where the user is standing,
 * not an instant in UTC. Caught by the "allows one today" test.
 */
export function when(v: FieldValue | undefined): number | null {
  const s = str(v);
  if (!s) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

/** Local midnight of the day `at` falls in. */
export function startOfDay(at: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days from a to b, ignoring time of day. */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
}

/** Rows of a table field, or []. */
export function rows(v: FieldValue | undefined): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.filter((r) => r && typeof r === 'object') as Record<string, unknown>[]) : [];
}

/** One cell as trimmed text. */
export function cell(row: Record<string, unknown>, columnId: string): string {
  const c = row[columnId];
  if (c === null || c === undefined) return '';
  return String(c).trim();
}

/** One cell as a finite number, or null. */
export function cellNum(row: Record<string, unknown>, columnId: string): number | null {
  const c = row[columnId];
  if (typeof c === 'number' && Number.isFinite(c)) return c;
  const s = String(c ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a clock time to minutes past midnight, leniently.
 *
 * Computer C stored production-day times as text because the contract had no
 * `time` kind (NOTES §2.5). It has one now, but the parser stays lenient: the
 * rule that depends on it must never fire on a value it simply failed to read.
 * Returns null for anything unparseable, and every caller treats null as
 * "say nothing".
 */
export function clockMinutes(v: FieldValue | undefined): number | null {
  const s = str(v).toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (!Number.isFinite(h) || !Number.isFinite(min) || min > 59) return null;
  const mer = m[3];
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (h > 23) return null;
  return h * 60 + min;
}

/**
 * Loose person-name match. Deliberately forgiving: Computer C's note is right
 * that a nudge-level false positive is acceptable and a missed match is not.
 */
export function sameName(a: string, b: string): boolean {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  if (A === B) return true;
  // First-name or surname overlap is enough at this severity.
  const at = new Set(A.split(' ').filter((w) => w.length > 2));
  return B.split(' ').some((w) => w.length > 2 && at.has(w));
}

/** Split a free-text field that may name several people. */
export function nameList(v: FieldValue | undefined): string[] {
  return str(v)
    .split(/\s*(?:,|&|\/|\band\b|\bor\b|\+)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Does this text say anything checkable, or is it only praise?
 *
 * Used by the "vague brief" rule. Deliberately a NUDGE and never a blocker: it
 * is a heuristic over prose and will sometimes be wrong, so it must never be
 * able to stop a production. The test is "strip the empty adjectives and the
 * filler; is there anything left?".
 */
const EMPTY_PRAISE = [
  'professional', 'exciting', 'amazing', 'awesome', 'great', 'good', 'nice',
  'really', 'very', 'super', 'quality', 'high quality', 'best', 'perfect',
  'polished', 'slick', 'clean', 'modern', 'cool', 'epic', 'radio ready',
  'industry standard', 'top notch', 'next level', 'fire', 'banging',
];
const FILLER = [
  'we', 'want', 'it', 'to', 'be', 'sound', 'sounds', 'like', 'a', 'an', 'the',
  'and', 'or', 'but', 'is', 'that', 'this', 'with', 'for', 'of', 'in', 'on',
  'make', 'making', 'just', 'something', 'stuff', 'things', 'really',
];

export function isMostlyEmptyPraise(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return false;
  // Very short statements are not judged — "Album launch" is terse, not vague.
  if (words.length < 4) return false;
  let substantive = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const pair = i + 1 < words.length ? `${w} ${words[i + 1]}` : '';
    if (EMPTY_PRAISE.includes(w) || (pair && EMPTY_PRAISE.includes(pair))) continue;
    if (FILLER.includes(w)) continue;
    substantive++;
  }
  return substantive === 0;
}

/**
 * Does this look like more than one person?
 *
 * Another nudge. Two approvers is a real production problem, but detecting it
 * from a free-text name can only ever be a hint, so the authored rule is
 * `attention`, not `blocker`.
 */
export function namesMoreThanOne(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\b(and|&|\+|,|\/|\bor\b)\b/i.test(t) && t.split(/\s+/).length > 2) return true;
  return /\b(team|committee|board|group|everyone|all of us|both)\b/i.test(t);
}

// ── evaluation ───────────────────────────────────────────────────────────────

function buildContext(
  project: ProductionProject,
  stage: ResolvedStage,
  now: number,
): RuleContext {
  const values = project.values;
  const get = (s: string, f: string) => values[valueKey(s, f)];
  return {
    project,
    stage,
    pathway: project.pathway,
    values,
    get,
    answered: (s, f) => isAnswered(get(s, f)),
    isNa: (s, f) => typeof project.na[valueKey(s, f)] === 'string' && project.na[valueKey(s, f)].trim() !== '',
    now,
  };
}

/**
 * Should this rule fire?
 *
 * A rule WITHOUT logic is a plain "these watched fields are unanswered" check,
 * which covers the majority of authored rules and needs no code. A rule WITH
 * logic defers entirely to its implementation.
 *
 * In both cases a field the user marked not-applicable counts as decided, so
 * the meter respects a justified skip instead of nagging about it.
 */
function shouldFire(rule: RuleDef, ctx: RuleContext): boolean {
  const impl = RULE_LOGIC[rule.ruleId];
  if (impl) return impl(ctx);
  if (rule.needsLogic) return false; // unimplemented; surfaced by missingLogic()
  return rule.watches.some((w) => {
    const [stageId, fieldId] = w.split('.');
    if (!stageId || !fieldId) return false;
    if (ctx.isNa(stageId, fieldId)) return false;
    return !ctx.answered(stageId, fieldId);
  });
}

/** Findings for one stage. */
export function evaluateStage(
  stage: ResolvedStage,
  project: ProductionProject,
  now: number = Date.now(),
): Finding[] {
  const ctx = buildContext(project, stage, now);
  const out: Finding[] = [];
  for (const rule of stage.rules) {
    if (!shouldFire(rule, ctx)) continue;
    const accepted = project.acceptedConditions.find((c) => c.ruleId === rule.ruleId);
    out.push({
      ruleId: rule.ruleId,
      stageId: stage.stageId,
      fieldIds: rule.watches
        .filter((w) => w.startsWith(`${stage.stageId}.`))
        .map((w) => w.slice(stage.stageId.length + 1)),
      severity: rule.severity,
      kind: rule.kind,
      title: rule.title,
      detail: rule.detail,
      fixHint: rule.fixHint,
      learnMore: rule.learnMore,
      accepted,
    });
  }
  return out;
}

/** Findings across a whole lab. */
export function evaluateAll(
  stages: ResolvedStage[],
  project: ProductionProject,
  now: number = Date.now(),
): Finding[] {
  return stages.flatMap((s) => evaluateStage(s, project, now));
}

/**
 * Authored rules that promised logic and never got an implementation.
 *
 * Tested, not merely available: an unimplemented rule silently never fires,
 * which would let a whole class of problems go unnoticed while the lab looked
 * healthy. That is exactly the kind of quiet failure worth a failing test.
 */
export function missingLogic(stages: { rules: RuleDef[] }[]): string[] {
  const out: string[] = [];
  for (const s of stages) {
    for (const r of s.rules) {
      if (r.needsLogic && !RULE_LOGIC[r.ruleId]) out.push(r.ruleId);
    }
  }
  return out;
}

/** Required fields of a stage that are neither answered nor justifiably skipped. */
export function unansweredRequired(stage: ResolvedStage, project: ProductionProject): string[] {
  return stageFields(stage)
    .filter((f) => f.required)
    .filter((f) => {
      const k = valueKey(stage.stageId, f.fieldId);
      const na = project.na[k];
      if (typeof na === 'string' && na.trim() !== '') return false;
      return !isAnswered(project.values[k]);
    })
    .map((f) => f.fieldId);
}
