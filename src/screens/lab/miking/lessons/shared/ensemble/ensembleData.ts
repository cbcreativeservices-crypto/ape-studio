/**
 * What a Lab 5 ensemble lesson supplies as DATA (pure; the lesson object
 * carries it as `ensemble`, so the learner-text test walks every word):
 * its seatings, its STARTING SETUPS (arrays and supports, drawn whole on the
 * stage), the Placement Studio's starting points for the array's centre,
 * the worked example, and the page words. Read by ensemblePages.tsx.
 */
import type { Lesson, PatternId, Vec3 } from '../../../engine/model/types.ts';
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
  /** group 2: `dimTo` draws the white distance from the rig to that point (a mouth) instead of its height and front distance. */
  rig?: { id: ArrayPresetId; params?: ArrayParams; place: ArrayPlacement; mount?: ArrayMount; dimTo?: Vec3 };
  /** group 2: `art` a handheld vocal dynamic; `dimTo` the singer's lips (the
   *  white distance drawn to them); `aimLen` a shorter amber aim. */
  singles?: readonly { key: string; p: Vec3; aim: Vec3; pattern: PatternId; label: string; art?: 'sdc' | 'vocalDynamic'; dimTo?: Vec3; aimLen?: number; boomDir?: Vec3 }[];
  /** group 2: frame only these seats and the mics (a close vocal setup). */
  focus?: readonly string[];
  /** group 2: the ARRAY readout's word for a setup of single mics ("HANDHELDS", "AREA MICS"). */
  short?: string;
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
    /** group 2: per seating, where the mic stands (a shared mic sits in each group's own middle). */
    mainAtBy?: Readonly<Record<string, Vec3>>;
    /** group 2: what stands there (default a spaced pair): one shared mic for a vocal group. */
    mainRig?: { id: ArrayPresetId; face?: number; tilt?: number; label: string };
  };
  /** BEFORE ANY MIC points. */
  before: readonly { title: string; text: string }[];
  /** The rigging / access / hearing line (a warning). */
  safety: string;
  /** The worked example's words: where to begin, and clearance. group 2:
   *  optional HEIGHT / HOW FAR FORWARD / AIM words in place of the main
   *  array's (a shared vocal mic is not above anyone's head). */
  workedWords: { begin: string; clearance: string; height?: string; forward?: string; aim?: string };
  /** The Placement Studio's "how the starting points work" paragraphs. */
  learnZones: readonly string[];
  /** group 2: the views this lesson draws (default all three). E06 shows
   *  children from above only: ['plan']. */
  views?: readonly StageView[];
};
export type EnsembleLesson = Lesson & { ensemble: EnsembleData };
