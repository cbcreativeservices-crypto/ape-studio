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
    blurb:
      'Everything that should happen before recording, filming, broadcasting or presenting begins. Build a plan, ' +
      'find what is missing, and leave with a packet a crew could actually work from.',
    packetName: 'Production Packet',
    newProjectNoun: 'project',
    stages: PREPROD_STAGES,
    outline: PREPROD_OUTLINE,
  },
  postprod: {
    lab: 'postprod',
    title: 'Audio Post-Production',
    subtitle: 'Take a finished recording through to a verified delivery.',
    blurb:
      'Everything between a folder of recordings and a delivery somebody has accepted. Organise it, edit it, ' +
      'build it, mix it, finish it to the specification, and prove it arrived intact.',
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
  return LABS[lab].stages.find((s) => s.stageId === stageId);
}

/** The stage carrying an activity, within one lab. */
export function stageForActivity(lab: LabKind, activityId: string): StageDef | undefined {
  return LABS[lab].stages.find((s) => s.activity?.activityId === activityId);
}

/** Every lab, in the order the catalog lists them. */
export const ALL_LABS: LabDef[] = [LABS.preprod, LABS.postprod];
