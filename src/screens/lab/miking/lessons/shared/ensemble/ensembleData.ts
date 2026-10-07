/**
 * What a Lab 5 ensemble lesson supplies as DATA (pure; the lesson object
 * carries it as `ensemble`, so the learner-text test walks every word):
 * its seatings, its STARTING SETUPS (arrays and supports, drawn whole on the
 * stage), the Placement Studio's starting points for the array's centre,
 * the worked example, and the page words. Read by ensemblePages.tsx.
 */
import type { Lesson, Vec3 } from '../../../engine/model/types.ts';
import type { StageView } from './frameS.ts';
import type { SeatingId } from './seating.ts';
import type { ArrayParams, ArrayPlacement, ArrayPresetId } from './stereoArray.ts';

/** How an array is held (ArrayArt.tsx): a tall stand under the bar, or a
 *  boom stand `reach` mm behind it (toward the hall). */
export type ArrayMount = { kind: 'stand' } | { kind: 'boom'; reach: number };

/** A STARTING SETUP on a stage: a main array, supports or spots, or both. */
export type EnsembleSetup = {
  id: string;
  /** The role, on the card ("MAIN PAIR · SPACED"). */
  role: string;
  title: string;
  /** Only in these variants (default: all). */
  variants?: readonly string[];
  rig?: { id: ArrayPresetId; params?: ArrayParams; place: ArrayPlacement; mount?: ArrayMount };
  singles?: readonly { key: string; p: Vec3; aim: Vec3; pattern: 'cardioid' | 'omni' | 'supercardioid'; label: string }[];
  /** The mics, in words. */
  mics: string;
  /** Where to start, in words. */
  start: string;
  /** What it tends to do, and its trade-off. */
  line: string;
  /** Counts for STARTING SETUPS' credit (the rest are there to explore). */
  core: boolean;
  /** The view it opens in. */
  view?: StageView;
};
/** A recommended starting point for the MAIN ARRAY's centre (the Placement Studio). */
export type PlaceZone = { id: string; label: string; band: string; box: { min: Vec3; max: Vec3 }; variants?: readonly string[]; tendency: string };
export type EnsembleData = {
  /** variant → its seating preset. */
  seatings: Readonly<Record<string, SeatingId>>;
  setups: readonly EnsembleSetup[];
  placeZones: readonly PlaceZone[];
  /** The worked example: a setup with a rig, per variant. */
  worked: Readonly<Record<string, string>>;
  meet: {
    figureTitle: string;
    figureBadge: string;
    /** THE SECTIONS' note before a section is picked. */
    sectionsNote: string;
    /** WHERE THE SOUND LEAVES: what the arcs mean. */
    soundNote: string;
    /** The main position the near/far readout is taken from. */
    mainAt: Vec3;
  };
  /** BEFORE ANY MIC points. */
  before: readonly { title: string; text: string }[];
  /** The rigging / access / hearing line (a warning). */
  safety: string;
  /** The worked example's words: where to begin, and clearance. */
  workedWords: { begin: string; clearance: string };
  /** The Placement Studio's "how the starting points work" paragraphs. */
  learnZones: readonly string[];
};
export type EnsembleLesson = Lesson & { ensemble: EnsembleData };
