/**
 * Post-Production content registry.
 *
 * Importing this module registers every computed rule and every activity check,
 * so a consumer only imports POSTPROD_STAGES and the engine is fully wired —
 * the same contract as `preprod/index.ts`.
 *
 * Eight stages, consolidated from the owner's 28-stage specification across its
 * three chapters. The consolidation is in `POSTPROD_OUTLINE` below: it keeps
 * every stage of the spec and groups the ones that are one decision in practice,
 * exactly as Pre-Production's six stages carry that spec's nineteen.
 */
import type { StageDef } from '../schema';
import { STAGE1_BRIEF } from './stage1.data';
import { STAGE2_MEDIA } from './stage2.data';
import { STAGE3_SESSION } from './stage3.data';
import { STAGE4_EDIT } from './stage4.data';
import { STAGE5_BUILD } from './stage5.data';
import { STAGE6_MIX } from './stage6.data';
import { STAGE7_FINISH } from './stage7.data';
import { STAGE8_DELIVER } from './stage8.data';

// Side-effect imports: register the rule logic and the activity checks. Split
// by chapter, not by concern. Both must be imported or a rule silently has no
// implementation, which `missingLogic()` reports and the tests fail on.
import './logic';
import './logic2';

/** Every authored Post-Production stage, in order. */
export const POSTPROD_STAGES: StageDef[] = [
  STAGE1_BRIEF,
  STAGE2_MEDIA,
  STAGE3_SESSION,
  STAGE4_EDIT,
  STAGE5_BUILD,
  STAGE6_MIX,
  STAGE7_FINISH,
  STAGE8_DELIVER,
];

/**
 * The eight stages the lab navigates by, with the owner's chapter grouping and
 * the specification stages each one carries. The `covers` line is here so that
 * a later reader can check this lab against the spec without rereading both.
 */
export const POSTPROD_OUTLINE: {
  stageId: string;
  num: number;
  title: string;
  chapter: 1 | 2 | 3;
  covers: string;
}[] = [
  { stageId: 'brief', num: 1, title: 'Receive the Project', chapter: 1, covers: 'Spec 1' },
  { stageId: 'media', num: 2, title: 'Ingest and Verify the Media', chapter: 1, covers: 'Spec 2' },
  { stageId: 'session', num: 3, title: 'Build and Synchronise the Session', chapter: 1, covers: 'Spec 3–4' },
  { stageId: 'edit', num: 4, title: 'Select, Assemble and Edit', chapter: 1, covers: 'Spec 5–8' },
  { stageId: 'build', num: 5, title: 'Build the Sound', chapter: 2, covers: 'Spec 9–13' },
  { stageId: 'mix', num: 6, title: 'Prepare, Mix and Print', chapter: 2, covers: 'Spec 14–18' },
  { stageId: 'finish', num: 7, title: 'Finish to Specification', chapter: 3, covers: 'Spec 19–24' },
  { stageId: 'deliver', num: 8, title: 'Deliver and Archive', chapter: 3, covers: 'Spec 25–28' },
];

/** The owner's three chapters, for the lab home screen's grouping. */
export const POSTPROD_CHAPTERS: { num: 1 | 2 | 3; title: string }[] = [
  { num: 1, title: 'Prepare and Edit' },
  { num: 2, title: 'Build and Mix' },
  { num: 3, title: 'Finish and Deliver' },
];

export function authoredStage(stageId: string): StageDef | undefined {
  return POSTPROD_STAGES.find((s) => s.stageId === stageId);
}
