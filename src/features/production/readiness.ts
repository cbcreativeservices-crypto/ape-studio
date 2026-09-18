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
import { stageFields } from './schema';
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

export function readStage(
  stage: ResolvedStage,
  project: ProductionProject,
  now: number = Date.now(),
): StageReadiness {
  const fields = stageFields(stage);
  const findings = evaluateStage(stage, project, now);

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
  const stageReports = stages.map((s) => readStage(s, project, now));
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
  const penalty = Math.min(0.2, attention * 0.02);
  const score = Math.max(0, Math.round((base - penalty) * 100));

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
