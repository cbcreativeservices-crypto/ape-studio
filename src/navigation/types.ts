/**
 * Navigation param lists. Screen inventory tracks the locked nav map
 * (Design-Seed brief §2). Milestone 1 wires only Splash → Auth → Main shell;
 * later milestones add the study/quiz/reward stacks.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Params for the three Fall study methods (S2/S3/S4). */
export type StudyScreenParams = { achievementId: string; topicName: string };

export type StudyStackParamList = {
  Dashboard: undefined;
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
  // S12/S13 — screens only for Fall (no content, not gate-relevant).
  EarTraining: StudyScreenParams;
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
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
