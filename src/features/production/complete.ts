/**
 * production/complete — "is this project finished?" for certificate credit
 * (owner 2026-10-13: Pre/Post-Production count once ONE project has EVERY
 * stage complete). Shared by the stage screen (live) and the training-credit
 * backfill (trainingCompletion.ts).
 *
 * Every stage of the lab, resolved for the project's pathway and answers,
 * must read 'complete' through the same readStage the stage screen shows —
 * with the whole lab's hidden keys, as readProject passes them.
 */
import { isActivityProject } from './activities';
import { labDef } from './labs';
import { readStage } from './readiness';
import { labHiddenKeys, resolveLab } from './schema';
import type { LabKind, ProductionProject } from './types';

export function productionProjectComplete(lab: LabKind, project: ProductionProject, now: number = Date.now()): boolean {
  // PRACTICE NEVER COUNTS (owner ruling 2026-10-14, #18): an exercise project
  // (seeded by an activity, flagged with scenarioId) is practice material —
  // it never earns Pre/Post-Production credit. Only the learner's own project.
  if (isActivityProject(project)) return false;
  const def = labDef(lab);
  if (!def || def.stages.length === 0) return false;
  try {
    const resolved = resolveLab(def.stages, project.pathway, project.values);
    if (resolved.length === 0) return false;
    const hidden = labHiddenKeys(resolved);
    // A stage the learner marked wholly NOT APPLICABLE (every field N/A with
    // a reason) reads done everywhere else — the meter, the packet's
    // "Nothing is left" — so it is done here too (toddler pass 2026-10-13: it
    // blocked the credit while every screen said nothing was left). At least
    // one stage must be genuinely complete: an all-N/A plan is no project.
    const states = resolved.map((s) => readStage(s, project, now, hidden).state);
    return states.every((st) => st === 'complete' || st === 'na') && states.includes('complete');
  } catch {
    return false; // a project that cannot be read is not complete
  }
}
