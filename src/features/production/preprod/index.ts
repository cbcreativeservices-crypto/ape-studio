/**
 * Pre-Production content registry.
 *
 * Importing this module registers every computed rule and every activity check,
 * so a consumer only imports PREPROD_STAGES and the engine is fully wired.
 *
 * Batch 1 (stages 1–4) was authored by Computer C on 2026-09-17 and ingested
 * verbatim. The data lives in `stageN.data.ts`; every comparison lives in
 * `logic.ts`. Nothing else is needed to add stages 5 and 6 — new data files,
 * their logic appended, and two lines here.
 */
import type { StageDef } from '../schema';
import { STAGE1_DEFINE } from './stage1.data';
import { STAGE2_DELIVER } from './stage2.data';
import { STAGE3_PEOPLE } from './stage3.data';
import { STAGE4_SCHEDULE } from './stage4.data';

// Side-effect import: registers the rule logic and the activity checks.
import './logic';

/** Every authored Pre-Production stage, in order. */
export const PREPROD_STAGES: StageDef[] = [STAGE1_DEFINE, STAGE2_DELIVER, STAGE3_PEOPLE, STAGE4_SCHEDULE];

/**
 * The six stages the lab navigates by (owner's spec). Stages 5 and 6 are not
 * authored yet; the home screen shows the whole shape and opens what exists, so
 * a user planning a production sees the process rather than only the finished
 * parts.
 */
export const PREPROD_OUTLINE: { stageId: string; num: number; title: string }[] = [
  { stageId: 'define', num: 1, title: 'Define the Project' },
  { stageId: 'deliver', num: 2, title: 'Establish Deliverables' },
  { stageId: 'people', num: 3, title: 'Organise People and Responsibilities' },
  { stageId: 'schedule', num: 4, title: 'Build the Schedule' },
  { stageId: 'technical', num: 5, title: 'Prepare the Creative and Technical Plan' },
  { stageId: 'readiness', num: 6, title: 'Confirm Production Readiness' },
];

export function authoredStage(stageId: string): StageDef | undefined {
  return PREPROD_STAGES.find((s) => s.stageId === stageId);
}
