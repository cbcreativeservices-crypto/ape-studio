/**
 * Navigation param lists. Screen inventory tracks the locked nav map
 * (Design-Seed brief §2). Milestone 1 wires only Splash → Auth → Main shell;
 * later milestones add the study/quiz/reward stacks.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Params for the three Fall study methods (S2/S3/S4). */
export type StudyScreenParams = { achievementId: string; topicName: string };

export type StudyStackParamList = {
  Dashboard: { focusGs?: number | string } | undefined;
  Flashcards: StudyScreenParams;
  FillInBlank: StudyScreenParams;
  Matching: StudyScreenParams;
  Quiz: StudyScreenParams;
  /** S17 — optional preselect context (present when opened from a Dashboard). */
  Glossary: {
    courseId?: string;
    courseCode?: string;
    achievementId?: string;
    topicName?: string;
  };
  // S13 — Scenarios screen only for Fall (no content, not gate-relevant). The
  // S12 EarTraining study method was retired (Booth 2026-07-26, v4 MASTER §13);
  // the Audio Learning Lab (EarLab route) replaces it.
  Scenarios: StudyScreenParams;
};

export type AchievementsStackParamList = {
  AchievementsGrid: undefined;
  Gallery: undefined;
};

/** S7 route params — the client-held question texts back the review list. */
export type ResultsParams = {
  result: import('../features/quiz/api').SubmitResult;
  topicName: string;
  achievementId: string;
  isPractice: boolean;
  questions: { slot: number; text: string }[];
};

export type TrophyEntrySource = 'quiz_win' | 'gallery' | 'achievements_grid';

export type MainTabParamList = {
  // Tab → landing screen (seed brief §2 nav map). Real screens land per milestone.
  Home: undefined; // → Course Selection (S3*)
  Study: NavigatorScreenParams<StudyStackParamList> | undefined; // → Dashboard (S4*) + study methods
  Achievements: NavigatorScreenParams<AchievementsStackParamList> | undefined; // → S5* grid + S9 gallery
  Profile: undefined; // → Profile / Digital ID (S10)
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined; // S1 two-step register + sign-in (Milestone 2)
  /** CM2 (Booth 2026-07-11): pre-auth landing — signed-out/anonymous entry
   *  ONLY (commercialMode). NOT the bottom-nav Home destination. */
  Landing: undefined;
  /** CM2: anonymous glossary route (full anonymous rendering lands in CM4). */
  PublicGlossary: undefined;
  /** CM7: academy upgrade paywall (UI only; store wiring pending ruling). */
  Paywall: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  // Root-level (bottom nav hidden — S7 is modal per the locked spec):
  Results: ResultsParams;
  // TrophyAnim (animated reveal) removed — no award animation is used
  // (user request 2026-07-18); quiz wins route straight to Trophy.
  Trophy: {
    topicName: string;
    achievementId: string;
    badgeEarned: boolean;
    entrySource: TrophyEntrySource;
  };
  Settings: undefined; // S11 — modal, bottom nav hidden
  /** Institutional Mode parked container (user request 2026-07-17) — the
   *  academic/site-license modules, postponed until after commercial launch.
   *  Reached from the Profile screen's Institutional Mode row. */
  Institutional: undefined;
  About: undefined; // Credits/About/Contact — Dashboard logo tap (Booth 2026-07-08)
  /** Awards + Curriculum pager (Curriculum · Specialization · Program ·
   *  Directory · Enrollment), five side-by-side pages. `category` is the landing
   *  page (user request 2026-07-18; Directory + Enrollment added 2026-07-22).
   *  Bottom nav hidden. */
  Awards: { category: 'curriculum' | 'directory' | 'enrollment' | import('../screens/awards/awardsData').AwardCategory };
  /** Directory — "Get Discovered" professional-profile info (user request
   *  2026-07-22). Modal, reached from Course Selection (right of Awards). */
  Directory: undefined;
  // Measurement & Analysis tools module (Booth 2026-07-09; MVP = hub + info
  // screens — the native DSP engine is Spike 0, a separate ruling/build).
  ToolsHub: undefined;
  ToolInfo: { toolKey: import('../screens/tools/toolsData').ToolKey };
  /** Frequency Counter & Tuner tool — its own modes + results screen (user
   *  request 2026-07-18; tuner merged in 2026-07-23). Tap mode is live;
   *  Sound/Light/Tuner need the engine. */
  FrequencyCounter: undefined;
  /** Tool Learn mode — per-tool guided tutorial (Phase 1, spec of record
   *  2026-07-23). Academy-gated (tools stay free to open; tutorials are the
   *  academy unlock per the ratified marketing copy). */
  ToolLearn: { toolKey: import('../screens/tools/toolsData').ToolKey };
  /** Tool Demo mode — labeled visual training demos ("Training Demo — Not a
   *  Live Measurement"), no audio until an output path ships (ruling 2026-07-23). */
  ToolDemo: { toolKey: import('../screens/tools/toolsData').ToolKey };
  /** Professional-measurement concept module (Smaart concepts, spec §15). */
  ConceptModule: { conceptKey: import('../features/tools/learn/types').ConceptKey };
  /** Saved Measurement Library (Phase 2, spec §7) + A/B compare (§8).
   *  Device-local records; optional per-tool filter. Free to use. */
  ToolLibrary: { toolKey?: import('../screens/tools/toolsData').ToolKey } | undefined;
  /** LIVE measurement screens (engine build 2026-07-23) — each gates itself
   *  honestly via EngineGate when the engine isn't in the build. */
  SplMeter: undefined;
  Rta: undefined;
  WaveformLive: undefined;
  SignalGen: undefined;
  SpectrogramLive: undefined;
  Rt60Live: undefined;
  /** Spike-0 dev-only debug screen (ape-dsp proof) — __DEV__ entry on ToolsHub. */
  DspDebug: undefined;
  /** AUDIO LEARNING LAB landing menu (v4 MASTER §13) — reached from the pinned
   *  "Ear Training & Critical Listening Lab" HOME card. Menu into the 16 audio
   *  labs + Signal Chain Builder + Wave Physics Lab. Its own card/route (NOT a
   *  ToolsHub tile). */
  EarLab: undefined;
  /** Lab 13 "Harmonic" (v4 MASTER §7) — the hear-see-control harmonics
   *  centerpiece (additive synthesis · spectrum · distortion), with
   *  Learn/Explore/Practice/Test modes. Opened from the EarLab landing menu. */
  HarmonicLab: undefined;
  /** Lab 14 "Oscillator" (v4 §7, T1) — classic waveforms as real band-limited
   *  additive audio + analytic waveform/harmonic displays. LabShell-based. */
  OscillatorLab: undefined;
  /** Lab 11 "Noise" (v4 §7, T1) — the five native noise colors (real audio) +
   *  the idealized slope chart. LabShell-based. */
  NoiseLab: undefined;
  /** Lab 16 "Harmonograph" (v4 §7, T1) — ratio-locked interval figures with
   *  real additive interval audio. LabShell-based. */
  HarmonographLab: undefined;
  /** The 12 EFFECT labs (v4 §7 Labs 1–10/12/15) — FxLabScreen configs over the
   *  native effects path (engineVersion 6): generator → EffectChain → output,
   *  analytic teaching visuals + live GR meters. */
  EqLab: undefined;
  DelayLab: undefined;
  ReverbLab: undefined;
  ChorusLab: undefined;
  FlangerLab: undefined;
  PhaserLab: undefined;
  CompressionLab: undefined;
  GateLab: undefined;
  LimiterLab: undefined;
  DistortionLab: undefined;
  PhaseLab: undefined;
  StereoLab: undefined;
  /** Pillar B CAPSTONE (v4 §8) — the Signal Chain Builder: the full effect
   *  chain as one instrument; scenario presets teach the interactions. */
  SignalChainLab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
