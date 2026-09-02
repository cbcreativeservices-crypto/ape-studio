/**
 * earTypes — the Ear Training Lab's trial contract (spec §3,
 * docs/APE_EAR_TRAINING_SPEC_2026_09_02.md).
 *
 * A MODULE is data + a pure trial factory: `makeTrial(level, seed)` renders
 * everything a trial needs (clips, question, answers, truth, visuals) with no
 * React and no side effects — so one generic shell screen runs all fourteen
 * modules, and the factories are verifiable in Node exactly like earDsp.
 */
import type { Buf } from './earDsp';

/** What the post-answer "See it" panel draws — computed from the SAME buffers
 *  the ear heard (the measurement-tool bridge; never separately synthesized). */
export type SeeIt =
  | {
      kind: 'spectrum';
      /** Which clips to overlay (indices into trial.clips). */
      clips: number[];
      /** Log-axis highlight band centre (Hz), e.g. the answer frequency. */
      highlightHz?: number;
      /** Labeled band regions (Band ID module). */
      bands?: { label: string; lo: number; hi: number }[];
      /** Draw 0 / −3 / −6 dB-per-octave reference slopes anchored to the
       *  first trace's own 1 kHz level (noise-colour trials) — the learner
       *  reads which guide the measured trace follows. */
      slopeGuides?: boolean;
      caption: string;
    }
  | {
      kind: 'wave';
      clips: number[];
      /** Marker times in seconds (delay onsets, dropout position…). */
      markersSec?: number[];
      caption: string;
    }
  | {
      kind: 'levels';
      /** Relative dB bars — drawn on the app amplitude ramp (levels are the
       *  one visual allowed to wear it). */
      bars: { label: string; db: number }[];
      caption: string;
    }
  | {
      kind: 'gonio';
      /** Goniometer (Lissajous) per clip, max 2 side by side, with the
       *  correlation value computed from the same buffer. */
      clips: number[];
      caption: string;
    };

export type EarClip = {
  /** Transport chip label — 'A', 'B', 'X', or a single clip's '▶'. */
  label: string;
  buf: Buf;
};

export type EarTrial = {
  clips: EarClip[];
  question: string;
  answers: { label: string }[];
  /** Index into answers. */
  correct: number;
  /** Half-credit answer indices (adjacent band/step — spec scoring rules). */
  near?: number[];
  /** Set when `answers` is an ordered ladder (frequency grid, dB steps,
   *  delay times, severities…). The shell then turns a miss into targeted
   *  feedback — "2 steps too low" — using these direction words for a pick
   *  below / above the truth. Omit for categorical decks. */
  ordered?: { low: string; high: string };
  /** Feedback truth line, e.g. "+6 dB peak at 250 Hz (wide, Q 1.4)". */
  reveal: string;
  seeIt: SeeIt;
};

export type EarModuleId =
  | 'frequency'
  | 'eq'
  | 'band'
  | 'noise'
  | 'defect'
  | 'stereo'
  | 'loudness'
  | 'delay'
  | 'reverb'
  | 'compression'
  | 'pitch'
  | 'polarity'
  | 'comb'
  | 'clipping';

export type PhonesNeed = 'required' | 'recommended' | 'any';

export type EarModule = {
  id: EarModuleId;
  num: string; // display number, owner's original numbering kept in copy
  title: string;
  blurb: string;
  phones: PhonesNeed;
  /** One-line playback note shown in the module dock (spec §4 table). */
  playbackNote: string;
  /** The listening objective — ONE line, always visible above the trial, so a
   *  learner knows what to attend to before the first clip (never hidden in
   *  a disclosure). */
  listenFor: string;
  levels: number; // ladder height
  /** Level descriptions for the dock (index 0 = level 1). */
  levelNames: string[];
  /** Pure trial factory. `seed` keys the PRNG — same seed, same trial.
   *  opts.subBassOk=false (spec §4 opt-out) excludes ≤80 Hz trials so a
   *  learner is never punished for their transducer. */
  makeTrial: (level: number, seed: number, opts?: { subBassOk?: boolean }) => EarTrial;
  /** True for modules that have ≤80 Hz trials — the shell then offers the
   *  "my playback can't do sub-bass" toggle. */
  hasSubBassTrials?: boolean;
};
