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
import { parseQuantity } from '../../screens/lab/calc/calcUnits';

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
  return readDate(s);
}

/** Month names and the usual abbreviations, lower-cased. */
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
function monthFromName(word: string): number | null {
  const w = word.toLowerCase().replace(/\.$/, '');
  if (w.length < 3) return null;
  const i = MONTHS.findIndex((m) => m === w || m.slice(0, 3) === w.slice(0, 3));
  return i < 0 ? null : i + 1;
}

/** Build a LOCAL date, rejecting impossible days (31 February, month 15). */
function localDate(y: number, m: number, d: number): number | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1000 || y > 9999) return null;
  const dt = new Date(y, m - 1, d);
  // Rolls over on an impossible day (Feb 31 -> Mar 3), which we refuse.
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt.getTime();
}

/**
 * Read a typed date, or refuse.
 *
 * ── WHY `Date.parse` IS GONE (2026-09-18) ────────────────────────────────────
 *
 * Anything that was not a bare `YYYY-MM-DD` fell through to `Date.parse`, whose
 * behaviour for non-ISO input is IMPLEMENTATION-DEFINED. That gave this field
 * two different bugs on two different engines, from the same keystrokes:
 *
 *   V8 (the ape-web browser preview)  "01/04/2026" -> 4 January
 *   Hermes (the device build)         "01/04/2026" -> null
 *
 * A UK user meaning 1 April got a silently WRONG date in the preview and a
 * silently ABSENT one on the phone — and every date rule short-circuits on
 * null, so a plan whose delivery precedes its production date passed clean.
 * Failing open, differently depending on where you tested it, which is why this
 * could not be reproduced reliably.
 *
 * So the ambiguity is now resolved explicitly, and refused when it cannot be:
 *
 *   "2026-04-01" / "2026/04/01"  -> 1 April    year first is unambiguous
 *   "15/03/2026"                 -> 15 March   15 cannot be a month
 *   "03/15/2026"                 -> 15 March   same, the other way round
 *   "1 April 2026" / "Apr 1, 2026" -> 1 April  a named month settles it
 *   "01/04/2026"                 -> null       1 Apr or 4 Jan? DO NOT GUESS
 *   "31/02/2026"                 -> null       not a real day
 *
 * Refusing `01/04/2026` is deliberate and is the whole point: this is a
 * production schedule, and a date silently read as three months early is worse
 * than a date the plan says it could not read. `cellUnreadable`'s sibling
 * `dateUnreadable` lets callers tell "refused" from "empty".
 */
export function readDate(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  // Year first: ISO order, no ambiguity possible. A time part is accepted and
  // discarded — a value stored as a full ISO timestamp is still naming a
  // calendar day, and refusing it would lose dates already saved in projects.
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(s);
  if (iso) return localDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // A named month settles the order wherever it sits.
  const named = /^(\d{1,2})\s+([A-Za-z.]+)\s+(\d{4})$/.exec(s);
  if (named) {
    const m = monthFromName(named[2]);
    return m === null ? null : localDate(Number(named[3]), m, Number(named[1]));
  }
  const namedFirst = /^([A-Za-z.]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(s);
  if (namedFirst) {
    const m = monthFromName(namedFirst[1]);
    return m === null ? null : localDate(Number(namedFirst[3]), m, Number(namedFirst[2]));
  }

  // Two numbers then a year. Determined ONLY when one of them cannot be a month.
  const slashed = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
  if (slashed) {
    const a = Number(slashed[1]);
    const b = Number(slashed[2]);
    const y = Number(slashed[3]);
    if (a > 12 && b <= 12) return localDate(y, b, a); // D/M
    if (b > 12 && a <= 12) return localDate(y, a, b); // M/D
    return null; // both could be a month — ambiguous, and we do not guess
  }

  return null;
}

/**
 * Was something typed here that we could not read as a date?
 *
 * The difference between "no date yet" and "a date we refused" is the
 * difference between a plan that is incomplete and a plan whose schedule rules
 * are all silently standing down.
 */
export function dateUnreadable(v: FieldValue | undefined): boolean {
  const s = str(v);
  return s.length > 0 && readDate(s) === null;
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

/**
 * One cell as a finite number, or null.
 *
 * ── WHY NOT `Number()` (2026-09-18) ──────────────────────────────────────────
 *
 * Scalar currency fields are rendered by `NumberField`, which strips every
 * non-`[0-9.\-]` character as you type, so `12,000` becomes `12000` and is
 * safe. TABLE cells are not: they fall through `Cell()` to a bare `TextInput`
 * that stores the raw string verbatim, with `keyboardType="numeric"` — which on
 * iOS is `UIKeyboardTypeNumbersAndPunctuation`, so the comma is right there on
 * the keypad.
 *
 * `Number("12,000")` is `NaN`, this returned null, and every consumer spells
 * `?? 0`. So one comma, typed the way every professional writes a budget, did
 * two contradictory things at once:
 *
 *   • `schedule-budget-exceeded` summed that line as ZERO, so a real overspend
 *     never raised the advisory — failing OPEN on money
 *   • `schedule-no-contingency` announced "no contingency" to someone who had
 *     just typed one
 *
 * And both ride into the exported packet, which is client-facing.
 *
 * `parseQuantity` is the calculators' parser and already solves exactly this:
 * it reads unambiguous grouping (`12,000`, `1,234,567.8`, `1.234,5`) and
 * REFUSES anything it cannot read with certainty rather than guessing. That
 * refusal matters as much as the parsing — `10,5` stays null, because a decimal
 * comma and a typo'd group are indistinguishable and inventing a number for a
 * client's budget is worse than admitting we could not read it.
 */
export function cellNum(row: Record<string, unknown>, columnId: string): number | null {
  const c = row[columnId];
  if (typeof c === 'number' && Number.isFinite(c)) return c;
  const s = String(c ?? '').trim();
  if (!s) return null;
  return parseQuantity(s);
}

/**
 * Did this cell hold something that LOOKS like a number but could not be read?
 *
 * The difference between "empty" and "unreadable" is the difference between a
 * line item nobody filled in and a line item whose amount we silently treated
 * as zero. Rules that sum money use this to refuse to draw a conclusion rather
 * than draw a wrong one.
 */
export function cellUnreadable(row: Record<string, unknown>, columnId: string): boolean {
  const c = row[columnId];
  if (typeof c === 'number') return !Number.isFinite(c);
  const s = String(c ?? '').trim();
  if (!s) return false;
  return parseQuantity(s) === null;
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
