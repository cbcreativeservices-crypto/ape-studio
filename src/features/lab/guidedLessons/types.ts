/**
 * Guided-Lesson content model (v4 MASTER §5 — the REQUIRED per-control lesson
 * stack: Definition · Formula · Practical uses · Common mistakes · Pro tips).
 *
 * This is the typed content layer behind every lab's Guided Lessons. It is
 * authored ONCE (see content.ts) from the two approved companion specs
 * (docs/APE_LAB_CONTROLS_AND_COMMON_MISTAKES_5LABS… and …COMMON_MISTAKES_11LABS…)
 * and rendered everywhere by one reusable sheet (GuidedLessonSheet). This is the
 * content pipeline the spec flags as risk R6 — Common Mistakes for every control.
 *
 * Honesty: content is standard signal-processing fundamentals (high confidence);
 * nothing here is an invented product requirement. Control ranges/defaults are
 * the industry-conventional proposals from the companions (confirm/override per
 * house style — they are not locked engine values).
 */

/** Stable lab identifiers — the 16 audio labs (v4 MASTER §7) + capstone +
 *  the expansion labs (owner request 2026-07-26). */
export type LabId =
  | 'eq'
  | 'delay'
  | 'reverb'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'compression'
  | 'gate'
  | 'limiter'
  | 'distortion'
  | 'noise'
  | 'phase'
  | 'harmonic'
  | 'oscillator'
  | 'stereo'
  | 'harmonograph'
  | 'chain' // Signal Chain Builder (Pillar B capstone, §8)
  | 'bass' // Bass Guitar Lab — string division / harmonics / intervals
  | 'autotune' // Autotune Lab — pitch correction on the cents grid
  | 'fm' // FM Synth Lab — carrier + modulator, ratio, index, sidebands
  | 'binaural' // Binaural Panner Lab — ITD/ILD localization (simplified model)
  | 'modular' // Modular Synth Lab — VCO→VCF→VCA + LFO/ENV/SEQ signal flow
  | 'foundations'; // Foundations of Sound — the prerequisite mental model

/** Native-engine feasibility tier (v4 MASTER §12) — informational. */
export type LabTier = 'T1' | 'T2' | 'T3';

/** One control's lesson. `name` is always present; the richer fields are filled
 *  where the companions authored per-control detail (Labs 5/6/8/9/15 today) and
 *  fall back to the lab-level lesson otherwise. */
export type ControlLesson = {
  /** Stable key (kebab/snake) for lookup + analytics. */
  key: string;
  name: string;
  /** What the control does. */
  definition?: string;
  /** Conventional range · default (e.g. "0.05–10 Hz · default ~0.2 Hz"). */
  range?: string;
  /** Practical use / when to reach for it. */
  practical?: string;
  /** Marks advanced / optional controls so the UI can flag them. */
  advanced?: boolean;
};

/** A full lab lesson: the lab-level stack + its controls. */
export type LabLesson = {
  id: LabId;
  /** Spec order 1..16. */
  num: number;
  name: string;
  tier: LabTier;
  /** One-line hook. */
  tagline?: string;
  /** Definition / overview of the effect. */
  whatItIs: string;
  controls: ControlLesson[];
  /** The mandatory Common-Mistakes element (never empty). */
  commonMistakes: string[];
  proTips: string[];
  /** Teaching formula / concept note. */
  formula: string;
};
