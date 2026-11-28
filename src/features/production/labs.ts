/**
 * The two production labs, as data.
 *
 * Pre-Production and Post-Production are one engine and two content sets (plan
 * §0.1). This module is where that stops being an aspiration: the screens read
 * a lab from here rather than importing one lab's registry, so a third lab
 * would be a row in this file and no new screen at all.
 *
 * Importing this module registers BOTH labs' rule logic and activity checks,
 * because each registry's index performs those side-effect imports.
 */
import type { StageDef } from './schema';
import type { LabKind } from './types';
import { PREPROD_STAGES, PREPROD_OUTLINE } from './preprod';
import { POSTPROD_STAGES, POSTPROD_OUTLINE } from './postprod';

export type LabOutlineRow = {
  stageId: string;
  num: number;
  title: string;
  /** Post-Production groups its eight stages into the owner's three chapters. */
  chapter?: 1 | 2 | 3;
};

export type LabDef = {
  lab: LabKind;
  /** The lab's name, as the catalog and the screen header show it. */
  title: string;
  /** One line under the title, for the catalog row. */
  subtitle: string;
  /** The paragraph under the header on the lab's home screen. */
  blurb: string;
  /** What the export is called in this lab. */
  packetName: string;
  /** What a new project is called before the user renames it. */
  newProjectNoun: string;
  stages: StageDef[];
  outline: LabOutlineRow[];
  /** Chapter headings, where the lab groups its stages. */
  chapters?: { num: 1 | 2 | 3; title: string }[];
};

export const LABS: Record<LabKind, LabDef> = {
  preprod: {
    lab: 'preprod',
    title: 'Audio Pre-Production',
    subtitle: 'Turn a brief into a production a crew can run.',
    // PP-04 (owner 2026-11-15: "build waves 1 thru 3", D62): a short plain
    // first line, then how the stages work; it replaces the long sentence.
    blurb:
      'Plan a recording or a show before anyone presses record. The lab asks a producer’s questions one stage at a time, ' +
      'names what is still missing, and leaves you with a packet a crew could work from.',
    packetName: 'Production Packet',
    newProjectNoun: 'project',
    stages: PREPROD_STAGES,
    outline: PREPROD_OUTLINE,
  },
  postprod: {
    lab: 'postprod',
    title: 'Audio Post-Production',
    subtitle: 'Take a folder of recordings through to a verified delivery.',
    // PO-06 (same go): the learner is handed a folder; three chapters take it
    // to an accepted delivery; NEXT OUTSTANDING is the way through. It
    // replaces the old paragraph (a line in, a line out).
    blurb:
      'You have been handed a folder of recordings. Three chapters (Prepare and Edit, Build and Mix, Finish and Deliver) ' +
      'take it to a delivery somebody has accepted. In a project, follow NEXT OUTSTANDING.',
    packetName: 'Delivery Package',
    newProjectNoun: 'project',
    stages: POSTPROD_STAGES,
    outline: POSTPROD_OUTLINE,
    chapters: [
      { num: 1, title: 'Prepare and Edit' },
      { num: 2, title: 'Build and Mix' },
      { num: 3, title: 'Finish and Deliver' },
    ],
  },
};

export function labDef(lab: LabKind): LabDef {
  return LABS[lab];
}

/** The authored stage, within one lab. */
export function authoredStage(lab: LabKind, stageId: string): StageDef | undefined {
  // `?.`: a hand-typed deep link can carry any :lab (2026-09-30) — an
  // unknown one reads as 'not available', never a render crash.
  return LABS[lab]?.stages.find((s) => s.stageId === stageId);
}

/** The stage carrying an activity, within one lab. */
export function stageForActivity(lab: LabKind, activityId: string): StageDef | undefined {
  return LABS[lab]?.stages.find((s) => s.activity?.activityId === activityId);
}

/** Every lab, in the order the catalog lists them. */
export const ALL_LABS: LabDef[] = [LABS.preprod, LABS.postprod];
