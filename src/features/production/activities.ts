/**
 * production/activities — the interactive exercises.
 *
 * Twenty-seven of these across the two labs, and they are NOT twenty-seven
 * minigames. Each one is the same loop: seed a project into a deliberately
 * broken state, let the user repair it with the ordinary stage screen, and
 * check whether the repair actually landed (plan §4).
 *
 * Because the seed is a real project, every rule and the whole readiness meter
 * work inside an activity for free. The user is not practising on a simulator;
 * they are doing the real task on a supplied case.
 *
 * SAME DIVISION OF LABOUR AS RULES. Computer C authors `passWhen` in prose;
 * the check is implemented here against the activityId. An activity with no
 * implementation is reported by `missingChecks()` and caught in tests, so it
 * can never silently pass everyone.
 */
import type { ProductionProject, LabKind, PathwayId, FieldValue } from './types';
import { isAnswered, newProjectId, valueKey } from './types';
import type { ActivityDef, StageDef } from './schema';

export type ActivityContext = {
  project: ProductionProject;
  get(stageId: string, fieldId: string): FieldValue | undefined;
  answered(stageId: string, fieldId: string): boolean;
};

/**
 * One criterion the user must satisfy. Stating them separately — rather than
 * returning a single boolean — is deliberate: a learner who has done three of
 * four things should see which one is left, not just "not yet".
 */
export type Criterion = { id: string; label: string; met: (ctx: ActivityContext) => boolean };

export type ActivityResult = {
  passed: boolean;
  met: Criterion[];
  unmet: Criterion[];
};

/** Criteria per activity, keyed by the authored activityId. */
export const ACTIVITY_CHECKS: Record<string, Criterion[]> = {};

export function registerActivityChecks(entries: Record<string, Criterion[]>): void {
  for (const [id, criteria] of Object.entries(entries)) ACTIVITY_CHECKS[id] = criteria;
}

function context(project: ProductionProject): ActivityContext {
  const get = (s: string, f: string) => project.values[valueKey(s, f)];
  return { project, get, answered: (s, f) => isAnswered(get(s, f)) };
}

/**
 * Evaluate an activity. An activity with no registered criteria returns
 * `passed: false` with nothing met, rather than passing by default — silence
 * must never look like success.
 */
export function checkActivity(activityId: string, project: ProductionProject): ActivityResult {
  const criteria = ACTIVITY_CHECKS[activityId] ?? [];
  const ctx = context(project);
  const met: Criterion[] = [];
  const unmet: Criterion[] = [];
  for (const c of criteria) (c.met(ctx) ? met : unmet).push(c);
  return { passed: criteria.length > 0 && unmet.length === 0, met, unmet };
}

/**
 * Build a project seeded into the activity's broken starting state.
 *
 * It is a real project in the normal store, flagged with `scenarioId` so the
 * lab can tell an exercise from the user's own work and never mix the two.
 */
export function seedActivityProject(
  lab: LabKind,
  pathway: PathwayId,
  activity: ActivityDef,
): ProductionProject {
  const now = Date.now();
  return {
    id: newProjectId(),
    v: 1,
    lab,
    pathway,
    name: activity.title,
    createdAt: now,
    updatedAt: now,
    // A seeded value may be deliberately empty — that IS the exercise — so the
    // seed is copied verbatim rather than filtered for "real" answers.
    values: { ...activity.seed },
    na: {},
    acceptedConditions: [],
    scenarioId: activity.activityId,
    revision: 0,
  };
}

/** Authored activities with no implemented check. Asserted empty in tests. */
export function missingChecks(stages: StageDef[]): string[] {
  const out: string[] = [];
  for (const s of stages) {
    if (s.activity && !ACTIVITY_CHECKS[s.activity.activityId]) out.push(s.activity.activityId);
  }
  return out;
}

/** Is this project an exercise rather than the user's own production? */
export function isActivityProject(p: ProductionProject): boolean {
  return typeof p.scenarioId === 'string' && p.scenarioId.length > 0;
}
