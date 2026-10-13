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
import { labDef } from './labs';
import { readStage } from './readiness';
import { labHiddenKeys, resolveLab } from './schema';
import type { LabKind, ProductionProject } from './types';

export function productionProjectComplete(lab: LabKind, project: ProductionProject, now: number = Date.now()): boolean {
  const def = labDef(lab);
  if (!def || def.stages.length === 0) return false;
  try {
    const resolved = resolveLab(def.stages, project.pathway, project.values);
    if (resolved.length === 0) return false;
    const hidden = labHiddenKeys(resolved);
    return resolved.every((s) => readStage(s, project, now, hidden).state === 'complete');
  } catch {
    return false; // a project that cannot be read is not complete
  }
}
