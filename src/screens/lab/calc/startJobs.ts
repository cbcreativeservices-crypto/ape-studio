/**
 * The Calculator Lab's "start here" (CA-04, owner 2026-11-15: "build waves 1
 * thru 3"; D62 adoption plan, wave 2).
 *
 * The home opened on ten topic tiles and a closed workflow fold, with nothing
 * that said where a beginner starts. It now opens with "Pick a job, get a
 * number you can use" and three jobs. Each job is a built-in workflow
 * template (workflowCatalog.ts WORKFLOW_TEMPLATES): a member runs the whole
 * guided sequence; anyone else (workflows are Academy-only, owner 2026-08-13)
 * opens the job's first calculator itself, exactly as the topic tiles would
 * open it (a guest meets that calculator's usual sign-in card; nothing new).
 * Nothing here computes anything: every number still comes from the
 * calculators.
 *
 * Pure data, no imports, so the test reads it directly.
 */
export type CalcStartJob = {
  /** The built-in template it runs (WORKFLOW_TEMPLATES id). */
  templateId: string;
  /** The template's first step (workspace + calculator): what a non-member opens. */
  firstWorkspaceId: string;
  firstFnKey: string;
  /** The job, as a learner would say it. */
  label: string;
  /** What the job works out, in order. */
  steps: string;
};

export const CALC_START_TITLE = 'PICK A JOB, GET A NUMBER YOU CAN USE';

export const CALC_START_JOBS: readonly CalcStartJob[] = [
  { templateId: 'tpl-delay-speaker', firstWorkspaceId: 'wave', firstFnKey: 'speed', label: 'TIME A DELAY SPEAKER', steps: 'Speed of sound → delay time → processor latency' },
  { templateId: 'tpl-spl-estimate', firstWorkspaceId: 'speakerpower', firstFnKey: 'predictspl', label: 'HOW LOUD AT THE LISTENER?', steps: 'Speaker and amp → SPL → SPL at the seat' },
  { templateId: 'tpl-cable-drop', firstWorkspaceId: 'cable', firstFnKey: 'loss', label: 'CHECK A SPEAKER CABLE RUN', steps: 'Loss over the run → the gauge to use' },
];

/** The heading over the topic tiles: the app says "166 calculators" everywhere. */
export const calcBrowseTitle = (total: number): string => `OR BROWSE ALL ${total} CALCULATORS BY TOPIC`;
