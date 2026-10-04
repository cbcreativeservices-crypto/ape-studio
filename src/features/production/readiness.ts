/**
 * production/readiness — the meter, and the verdict.
 *
 * The owner's spec is blunt about this: "The meter must evaluate actual
 * decisions rather than reward users merely for opening screens." That is a
 * testable invariant and it is tested directly — walking every stage without
 * answering anything must score zero.
 *
 * Two rules are absolute and live here rather than in any screen:
 *
 *   1. A RED BLOCKER CANNOT BE OUTSCORED. No amount of good work elsewhere
 *      clears an unresolved safety, legal, recording or delivery blocker.
 *   2. A BLOCKER CLEARS TWO WAYS ONLY — fix it, or record an accepted condition
 *      naming the person who accepted it and why. The acceptance then prints in
 *      the packet, so proceeding with a known gap is visible rather than buried.
 *      That mirrors how real productions actually proceed.
 */
import type {
  Finding,
  LabKind,
  ProductionProject,
  ProjectVerdict,
  ReadinessState,
} from './types';
import { isAnswered, valueKey } from './types';
import type { ResolvedStage } from './schema';
import { labHiddenKeys, stageFields } from './schema';
import { evaluateStage } from './rules';

export type FieldReadiness = {
  fieldId: string;
  state: ReadinessState;
  required: boolean;
};

export type StageReadiness = {
  stageId: string;
  num: number;
  title: string;
  state: ReadinessState;
  /** Answered-or-justified required fields over total required fields. */
  answeredRequired: number;
  totalRequired: number;
  /** Every field, required or not. Drives the detail view. */
  answeredAll: number;
  totalAll: number;
  findings: Finding[];
  /** Unresolved blockers. Non-empty means this stage gates the project. */
  blockers: Finding[];
  fields: FieldReadiness[];
  /** 0..1 — decisions made, never screens visited. */
  progress: number;
};

export type ReadinessReport = {
  lab: LabKind;
  stages: StageReadiness[];
  findings: Finding[];
  blockers: Finding[];
  acceptedBlockers: Finding[];
  verdict: ProjectVerdict;
  /** 0..100, honest: it counts decisions, and it never overrides a blocker. */
  score: number;
  answeredRequired: number;
  totalRequired: number;
};

/** Has the user either answered this, or justified skipping it? */
function decided(project: ProductionProject, stageId: string, fieldId: string): 'answered' | 'na' | 'no' {
  const k = valueKey(stageId, fieldId);
  const na = project.na[k];
  if (typeof na === 'string' && na.trim() !== '') return 'na';
  return isAnswered(project.values[k]) ? 'answered' : 'no';
}

/** Is this blocker cleared by a recorded, properly-attributed acceptance? */
function isAccepted(f: Finding): boolean {
  const a = f.accepted;
  if (!a) return false;
  // An acceptance without a named person AND a reason is not an acceptance.
  // Without this check the escape hatch becomes a way to dismiss anything.
  return a.acceptedBy.trim().length > 0 && a.reason.trim().length > 0;
}

/**
 * `hidden`: value keys `showWhen` hid — the whole lab's when the caller has it
 * (`labHiddenKeys`), so a cross-stage rule never reads a hidden answer. A
 * hidden field is already absent from `stage`, so it never counts as missing
 * and never scores; this makes sure no rule reads it either.
 */
export function readStage(
  stage: ResolvedStage,
  project: ProductionProject,
  now: number = Date.now(),
  hidden: ReadonlySet<string> = new Set(stage.hidden ?? []),
): StageReadiness {
  const fields = stageFields(stage);
  const findings = evaluateStage(stage, project, now, hidden);

  const fieldStates: FieldReadiness[] = fields.map((f) => {
    const d = decided(project, stage.stageId, f.fieldId);
    const touchedBy = findings.filter((x) => x.fieldIds.includes(f.fieldId));
    let state: ReadinessState;
    if (d === 'na') state = 'na';
    else if (touchedBy.some((x) => x.kind === 'conflict' || x.kind === 'mismatch')) state = 'conflict';
    else if (d === 'no') state = f.required ? 'missing' : 'attention';
    else if (touchedBy.length) state = 'attention';
    else state = 'complete';
    return { fieldId: f.fieldId, state, required: f.required };
  });

  const required = fields.filter((f) => f.required);
  const answeredRequired = required.filter((f) => decided(project, stage.stageId, f.fieldId) !== 'no').length;
  const answeredAll = fields.filter((f) => decided(project, stage.stageId, f.fieldId) !== 'no').length;

  const blockers = findings.filter((f) => f.severity === 'blocker' && !isAccepted(f));

  // Progress counts DECISIONS. A stage with no required fields is measured on
  // all of its fields, so an optional-only stage cannot read 100% untouched.
  const denom = required.length > 0 ? required.length : fields.length;
  const numer = required.length > 0 ? answeredRequired : answeredAll;
  const progress = denom === 0 ? 0 : numer / denom;

  let state: ReadinessState;
  if (blockers.length) state = 'conflict';
  else if (denom > 0 && numer === 0) state = 'missing';
  else if (numer < denom) state = 'attention';
  else if (findings.some((f) => f.severity === 'attention')) state = 'attention';
  else if (fields.length > 0 && fieldStates.every((f) => f.state === 'na')) state = 'na';
  else state = 'complete';

  return {
    stageId: stage.stageId,
    num: stage.num,
    title: stage.title,
    state,
    answeredRequired,
    totalRequired: required.length,
    answeredAll,
    totalAll: fields.length,
    findings,
    blockers,
    fields: fieldStates,
    progress,
  };
}

export function readProject(
  stages: ResolvedStage[],
  project: ProductionProject,
  now: number = Date.now(),
): ReadinessReport {
  const hidden = labHiddenKeys(stages);
  const stageReports = stages.map((s) => readStage(s, project, now, hidden));
  const findings = stageReports.flatMap((s) => s.findings);
  const blockers = stageReports.flatMap((s) => s.blockers);
  const acceptedBlockers = findings.filter((f) => f.severity === 'blocker' && isAccepted(f));

  const answeredRequired = stageReports.reduce((n, s) => n + s.answeredRequired, 0);
  const totalRequired = stageReports.reduce((n, s) => n + s.totalRequired, 0);

  // The score is the plain truth about decisions made. It is NOT the verdict,
  // and it is deliberately not weighted to flatter a nearly-finished project.
  const base = totalRequired === 0 ? 0 : answeredRequired / totalRequired;
  // Outstanding attention findings cost something, but cannot zero a real plan.
  const attention = findings.filter((f) => f.severity === 'attention').length;
  // ── THE PENALTY MAY NOT SWALLOW THE WORK (2026-09-18, design review #4) ────
  //
  // This was a FLAT cap of 0.2. A blank Pre-Production project fires well over
  // ten attention findings immediately, so the penalty pegged at 0.2 on the
  // first render and the headline score stayed at ZERO until roughly a fifth of
  // the required decisions were made. The first session of a 180-field task
  // produced no visible movement at all — in a tool whose only motivator IS
  // the number moving.
  //
  // It is now capped at a FRACTION OF WHAT HAS BEEN EARNED, so a penalty can
  // reduce progress but can never erase it. Ten findings against 5% done costs
  // a sliver; ten findings against a finished plan still costs the full fifth,
  // which is the point of having a penalty at all.
  const penalty = Math.min(0.2, attention * 0.02, base * 0.4);
  // RULE 1 reaches the number too (2026-10-04, design review #4): with every
  // required decision made and a blocker still open the score read 100 beside
  // "Not Ready" — a finished-looking number on an unfinished plan.
  const score = capWhileBlocked(Math.max(0, Math.round((base - penalty) * 100)), blockers.length > 0);

  let verdict: ProjectVerdict;
  if (blockers.length > 0) {
    // RULE 1. Unresolved blocker outranks everything, including a perfect score.
    verdict = 'not_ready';
  } else if (totalRequired > 0 && answeredRequired < totalRequired) {
    verdict = 'not_ready';
  } else if (acceptedBlockers.length > 0 || findings.some((f) => f.severity === 'attention')) {
    verdict = 'ready_with_conditions';
  } else {
    verdict = 'ready';
  }

  return {
    lab: project.lab,
    stages: stageReports,
    findings,
    blockers,
    acceptedBlockers,
    verdict,
    score,
    answeredRequired,
    totalRequired,
  };
}

/** The most a number may read while a blocker is open: never the finished 100. */
export const BLOCKED_CEILING = 99;

function capWhileBlocked(score: number, blocked: boolean): number {
  return blocked ? Math.min(score, BLOCKED_CEILING) : score;
}

/**
 * One stage as a number and a state (2026-10-04, design review #4).
 *
 * THE NUMBER is the project score's own formula applied to one stage, so the
 * stage list and the headline number speak the same language:
 *   decisions made ÷ decisions required (all of the stage's questions when it
 *   has no required ones), less the same attention penalty — at most 0.02 a
 *   finding, at most a fifth, and never more than 40% of what was earned, so a
 *   penalty can shrink progress but never erase it.
 *
 * THE CEILING. 100 means DONE, so only a `complete` (or wholly
 * not-applicable) stage may read it. A stage with an open blocker is held at
 * 99 at most, in the blocker colour beside "Conflict detected" — the blocker
 * still cannot be outscored, and the number cannot pretend otherwise.
 *
 * THE COLOUR is the stage's readiness state through the existing `STATE_TINT`
 * tokens (theme colours, not new ones): grey before anything is decided, amber
 * while under way, red with a blocker open, green when complete.
 *
 * UNREADABLE IS NOT ZERO (K2). No report — the project could not be read, or
 * the stage could not be worked out — gives `pct: null` and the text "—",
 * never "0%": a zero would tell the learner their work is gone.
 */
export type StageSignal = {
  /** 0..100, or null when the stage's data could not be read. */
  pct: number | null;
  /** What the screen prints: "64%" or "—". */
  text: string;
  /** The readiness state the colour and the word come from; null when unread. */
  state: ReadinessState | null;
};

export function stageSignal(sr: StageReadiness | null | undefined): StageSignal {
  if (!sr) return { pct: null, text: '—', state: null };
  const attention = sr.findings.filter((f) => f.severity === 'attention').length;
  const penalty = Math.min(0.2, attention * 0.02, sr.progress * 0.4);
  let pct = Math.max(0, Math.min(100, Math.round((sr.progress - penalty) * 100)));
  if (sr.state !== 'complete' && sr.state !== 'na') pct = Math.min(pct, BLOCKED_CEILING);
  pct = capWhileBlocked(pct, sr.blockers.length > 0);
  return { pct, text: `${pct}%`, state: sr.state };
}

/** One stage's outstanding work, for the packet's WHAT'S LEFT list. */
export type StageLeft = {
  stageId: string;
  num: number;
  title: string;
  /** Required decisions neither answered nor marked not applicable. */
  missingRequired: number;
  /** Unresolved blockers. */
  blockers: number;
  /** Attention findings (things to look at, not blockers). */
  attention: number;
};

/**
 * What a project still needs, stage by stage — only the stages with something
 * outstanding, in stage order. An empty list means nothing required is left
 * and nothing blocks the plan (attention findings included: a list that hid
 * them would call a plan finished that the rules are still questioning).
 */
export function projectLeft(report: ReadinessReport): StageLeft[] {
  return report.stages
    .map((s) => ({
      stageId: s.stageId,
      num: s.num,
      title: s.title,
      missingRequired: s.totalRequired - s.answeredRequired,
      blockers: s.blockers.length,
      attention: s.findings.filter((f) => f.severity === 'attention').length,
    }))
    .filter((s) => s.missingRequired > 0 || s.blockers > 0 || s.attention > 0);
}

/** "2 required decisions · 1 blocker · 3 things to look at" — plain words. */
export function stageLeftLine(s: StageLeft): string {
  const parts: string[] = [];
  if (s.missingRequired > 0) parts.push(`${s.missingRequired} required decision${s.missingRequired === 1 ? '' : 's'}`);
  if (s.blockers > 0) parts.push(`${s.blockers} blocker${s.blockers === 1 ? '' : 's'}`);
  if (s.attention > 0) parts.push(`${s.attention} thing${s.attention === 1 ? '' : 's'} to look at`);
  return parts.join(' · ');
}

/**
 * Can this project be marked ready without any further decisions?
 * Exposed so a screen can explain WHY the button is unavailable, rather than
 * simply disabling it and leaving the user to guess.
 */
export function blockingReasons(report: ReadinessReport): string[] {
  const out: string[] = [];
  for (const b of report.blockers) out.push(b.title);
  const shortfall = report.totalRequired - report.answeredRequired;
  if (shortfall > 0) {
    out.push(`${shortfall} required ${shortfall === 1 ? 'decision has' : 'decisions have'} not been made`);
  }
  return out;
}
