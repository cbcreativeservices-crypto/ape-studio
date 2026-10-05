/**
 * RootNavigator — native stack. Flow (seed brief §2):
 *   Splash (0) → [session? Main : Auth]
 *   Auth (S1) → Main
 * Bottom nav lives inside Main (MainTabs). Results (S7) + the trophy loop
 * (S5/S8) live HERE so the bottom nav is hidden on them (locked spec);
 * Settings (S11) joins in M7.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LowLightDim } from '../features/settings/LowLightLayer';
import { AppDialogHost } from '../components/AppDialog';
import { MembershipGateHost } from '../features/commercial/MembershipGate';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { NAV_FADE, NAV_PUSH, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { useNavOrientation } from './navOrientation'; // bug hunt 2026-09-29 — see that file
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { withMembershipPreview } from '../features/lab/withMembershipPreview';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { withKeepAwake } from '../features/tools/withKeepAwake';
import { lazyScreen, type ScreenComponent } from './lazyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── LAZY SCREENS (perf decision B, 2026-10-04) ────────────────────────────────
// Only Splash, Auth and Main (the tab shell) are imported above: they are first
// paint. Every other route is registered with `getComponent` and a
// `lazyScreen` loader, so its module is evaluated the first time the route is
// visited instead of before the first frame. Each loader runs ONCE and caches
// the component it built — React Navigation calls getComponent on every render,
// and a wrapper rebuilt per render would remount the screen (see lazyScreen.ts).
// Route names, params, deep links and the membership wrappers are unchanged;
// only WHEN the screen code loads has moved.
/* eslint-disable @typescript-eslint/no-var-requires */
/** withAmplitudeOrientation, loaded with the first gated screen (it pulls in Skia). */
const orient = (C: ScreenComponent): ScreenComponent =>
  (require('../screens/lab/amplitude/AmplitudeOrientation') as typeof import('../screens/lab/amplitude/AmplitudeOrientation')).withAmplitudeOrientation(C);

// Amplitude color-language orientation gate (owner spec 2026-08-12): every
// INTERACTIVE audio lab / tool / module screen funnels through the one-time
// "Understanding Level & Amplitude" orientation until it has been completed
// once — either at a gated screen (Path B) or as the Foundations of Sound
// START HERE step (Path A; same flag). This block is the SINGLE registry of
// gated experiences — wrap future audio visualizers here, never inside the
// screens. Hubs, info/reference/records pages, calculators, and the
// Foundations course itself (it OPENS with the orientation) stay ungated.
const Gated = {
  ToolDemo: lazyScreen(() => orient(require('../screens/tools/ToolDemoScreen').ToolDemoScreen)),
  SplMeter: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/SplMeterScreen').SplMeterScreen), 'spl')),
  Rta: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/RtaScreen').RtaScreen), 'rta')),
  Waveform: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/WaveformScreen').WaveformScreen), 'waveform')),
  SignalGen: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/SignalGenScreen').SignalGenScreen), 'signalgen')),
  Spectrogram: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/SpectrogramScreen').SpectrogramScreen), 'spectrogram')),
  Rt60: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/Rt60Screen').Rt60Screen), 'rt60')),
  FrequencyCounter: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/FrequencyCounterScreen').FrequencyCounterScreen), 'freqcounter')),
  MultiMeter: lazyScreen(() => withKeepAwake(orient(require('../screens/tools/MultiMeterScreen').MultiMeterScreen), 'multimeter')),
  HarmonicLab: lazyScreen(() => orient(require('../screens/lab/HarmonicLabScreen').HarmonicLabScreen)),
  OscillatorLab: lazyScreen(() => orient(require('../screens/lab/OscillatorLabScreen').OscillatorLabScreen)),
  NoiseLab: lazyScreen(() => orient(require('../screens/lab/NoiseLabScreen').NoiseLabScreen)),
  HarmonographLab: lazyScreen(() => orient(require('../screens/lab/HarmonographLabScreen').HarmonographLabScreen)),
  EqLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').EqLabScreen)),
  DelayLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').DelayLabScreen)),
  ReverbLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').ReverbLabScreen)),
  ChorusLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').ChorusLabScreen)),
  FlangerLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').FlangerLabScreen)),
  PhaserLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').PhaserLabScreen)),
  CompressionLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').CompressionLabScreen)),
  GateLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').GateLabScreen)),
  LimiterLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').LimiterLabScreen)),
  DistortionLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').DistortionLabScreen)),
  PhaseLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').PhaseLabScreen)),
  StereoLab: lazyScreen(() => orient(require('../screens/lab/fxLabConfigs').StereoLabScreen)),
  SignalChainLab: lazyScreen(() => orient(require('../screens/lab/SignalChainLabScreen').SignalChainLabScreen)),
  BassLab: lazyScreen(() => orient(require('../screens/lab/BassLabScreen').BassLabScreen)),
  AutotuneLab: lazyScreen(() => orient(require('../screens/lab/AutotuneLabScreen').AutotuneLabScreen)),
  FmLab: lazyScreen(() => orient(require('../screens/lab/FmLabScreen').FmLabScreen)),
  BinauralLab: lazyScreen(() => orient(require('../screens/lab/BinauralLabScreen').BinauralLabScreen)),
  ModularLab: lazyScreen(() => orient(require('../screens/lab/ModularLabScreen').ModularLabScreen)),
  MicLab: lazyScreen(() => orient(require('../screens/lab/micspeaker/MicPrinciplesLabScreen').MicPrinciplesLabScreen)),
  MicSelectLab: lazyScreen(() => orient(require('../screens/lab/micselect/MicSelectLabScreen').MicSelectLabScreen)),
  CableLab: lazyScreen(() => orient(require('../screens/lab/cable/CableLabScreen').CableLabScreen)),
  CableInstallLab: lazyScreen(() => orient(require('../screens/lab/cableinstall/CableInstallLabScreen').CableInstallLabScreen)),
  SpeakerLab: lazyScreen(() => orient(require('../screens/lab/micspeaker/SpeakerCoverageLabScreen').SpeakerCoverageLabScreen)),
  TubeLab: lazyScreen(() => orient(require('../screens/lab/tube/VacuumTubeLabScreen').VacuumTubeLabScreen)),
  DigitalModule: lazyScreen(() => orient(require('../screens/lab/digital/DigitalModuleScreen').DigitalModuleScreen)),
  CymaticsModule: lazyScreen(() => orient(require('../screens/lab/cymatics/CymaticsModuleScreen').CymaticsModuleScreen)),
  CymaticsPlateStudio: lazyScreen(() => orient(require('../screens/lab/cymatics/PlateStudioScreen').PlateStudioScreen)),
  CymaticsLiquidStudio: lazyScreen(() => orient(require('../screens/lab/cymatics/LiquidStudioScreen').LiquidStudioScreen)),
  CymaticsMembraneStudio: lazyScreen(() => orient(require('../screens/lab/cymatics/MembraneStudioScreen').MembraneStudioScreen)),
  CymaticsGallery: lazyScreen(() => orient(require('../screens/lab/cymatics/GalleryScreen').GalleryScreen)),
  ProductionStage: lazyScreen(() => require('../screens/lab/production/ProductionStageScreen').ProductionStageScreen),
  ProductionActivity: lazyScreen(() => require('../screens/lab/production/ProductionActivityScreen').ProductionActivityScreen),
  WaveModule: lazyScreen(() => orient(require('../screens/lab/wave/WaveModuleScreen').WaveModuleScreen)),
  MeterModule: lazyScreen(() => orient(require('../screens/lab/meter/MeterModuleScreen').MeterModuleScreen)),
  EqModule: lazyScreen(() => orient(require('../screens/lab/eq/EqModuleScreen').EqModuleScreen)),
  GainModule: lazyScreen(() => orient(require('../screens/lab/gain/GainModuleScreen').GainModuleScreen)),
  FoundationsPlayground: lazyScreen(() => orient(require('../screens/lab/foundations/FoundationsPlaygroundScreen').FoundationsPlaygroundScreen)),
} as const;

// Every other route that is not part of first paint, loaded on first visit.
// Plain screens (no wrapper); the gated ones are in Gated / MemberGated.
const Lazy = {
  Results: lazyScreen(() => require('../screens/results/ResultsScreen').ResultsScreen),
  Trophy: lazyScreen(() => require('../screens/results/TrophyScreen').TrophyScreen),
  Celebration: lazyScreen(() => require('../screens/results/CelebrationScreen').CelebrationScreen),
  AwardProgress: lazyScreen(() => require('../screens/awards/AwardProgressScreen').AwardProgressScreen),
  FinalExam: lazyScreen(() => require('../screens/exam/FinalExamScreen').FinalExamScreen),
  FinalExamResult: lazyScreen(() => require('../screens/exam/FinalExamResultScreen').FinalExamResultScreen),
  Settings: lazyScreen(() => require('../screens/settings/SettingsScreen').SettingsScreen),
  Help: lazyScreen(() => require('../screens/help/HelpScreen').HelpScreen),
  WeeklyConcept: lazyScreen(() => require('../screens/notifications/WeeklyConceptScreen').WeeklyConceptScreen),
  Institutional: lazyScreen(() => require('../screens/institutional/InstitutionalScreen').InstitutionalScreen),
  About: lazyScreen(() => require('../screens/about/AboutScreen').AboutScreen),
  Awards: lazyScreen(() => require('../screens/awards/AwardsScreen').AwardsScreen),
  AudioCommunityDirectory: lazyScreen(() => require('../screens/directory/AudioCommunityDirectoryScreen').AudioCommunityDirectoryScreen),
  EmployerAdmin: lazyScreen(() => require('../screens/admin/EmployerAdminScreen').EmployerAdminScreen),
  ReportsAdmin: lazyScreen(() => require('../screens/admin/ReportsAdminScreen').ReportsAdminScreen),
  ToolsHub: lazyScreen(() => require('../screens/tools/ToolsHubScreen').ToolsHubScreen),
  ToolInfo: lazyScreen(() => require('../screens/tools/ToolInfoScreen').ToolInfoScreen),
  ToolLearn: lazyScreen(() => require('../screens/tools/ToolLearnScreen').ToolLearnScreen),
  ConceptModule: lazyScreen(() => require('../screens/tools/ConceptModuleScreen').ConceptModuleScreen),
  ToolLibrary: lazyScreen(() => require('../screens/tools/MeasurementLibraryScreen').MeasurementLibraryScreen),
  ExposureMonitor: lazyScreen(() => require('../screens/tools/ExposureMonitorScreen').ExposureMonitorScreen),
  DspDebug: lazyScreen(() => require('../screens/tools/DspDebugScreen').DspDebugScreen),
  AudioLearning: lazyScreen(() => require('../screens/lab/AudioLearningScreen').AudioLearningScreen),
  EarLab: lazyScreen(() => require('../screens/lab/EarLabScreen').EarLabScreen),
  LabCategory: lazyScreen(() => require('../screens/lab/LabCategoryScreen').LabCategoryScreen),
  CalcLab: lazyScreen(() => require('../screens/lab/calc/CalcLabScreen').CalcLabScreen),
  CalcWorkspace: lazyScreen(() => require('../screens/lab/calc/CalcWorkspaceScreen').CalcWorkspaceScreen),
  CalcSymbolsKey: lazyScreen(() => require('../screens/lab/calc/CalcSymbolsKeyScreen').CalcSymbolsKeyScreen),
  CalcWorkflows: lazyScreen(() => require('../screens/lab/calc/CalcWorkflowsScreen').CalcWorkflowsScreen),
  CalcWorkflowEdit: lazyScreen(() => require('../screens/lab/calc/CalcWorkflowEditScreen').CalcWorkflowEditScreen),
  CalcWorkflowRun: lazyScreen(() => require('../screens/lab/calc/CalcWorkflowRunScreen').CalcWorkflowRunScreen),
  CalcProjects: lazyScreen(() => require('../screens/lab/calc/CalcProjectsScreen').CalcProjectsScreen),
  CalcResults: lazyScreen(() => require('../screens/lab/calc/CalcResultsScreen').CalcResultsScreen),
  WaveLab: lazyScreen(() => require('../screens/lab/wave/WaveLabHomeScreen').WaveLabHomeScreen),
  AmplitudeLab: lazyScreen(() => require('../screens/lab/amplitude/AmplitudeOrientation').AmplitudeLabScreen),
  FoundationsCourse: lazyScreen(() => require('../screens/lab/foundations/FoundationsCourseScreen').FoundationsCourseScreen),
  CareerFinder: lazyScreen(() => require('../screens/careerfinder/CareerFinderScreen').CareerFinderScreen),
  CareerFinderQuiz: lazyScreen(() => require('../screens/careerfinder/CareerFinderQuizScreen').CareerFinderQuizScreen),
  CareerFinderResults: lazyScreen(() => require('../screens/careerfinder/CareerFinderResultsScreen').CareerFinderResultsScreen),
  CareerFamily: lazyScreen(() => require('../screens/careerfinder/CareerFamilyScreen').CareerFamilyScreen),
  CareerFamilyList: lazyScreen(() => require('../screens/careerfinder/CareerFamilyListScreen').CareerFamilyListScreen),
  CareerFinderAbout: lazyScreen(() => require('../screens/careerfinder/CareerFinderAboutScreen').CareerFinderAboutScreen),
  StartHere: lazyScreen(() => require('../screens/startHere/StartHereScreen').StartHereScreen),
  StartHereTerms: lazyScreen(() => require('../screens/startHere/StartHereTermsScreen').StartHereTermsScreen),
  PublicGlossary: lazyScreen(() => require('../screens/landing/PublicGlossaryScreen').PublicGlossaryScreen),
  Paywall: lazyScreen(() => require('../screens/commercial/PaywallScreen').PaywallScreen),
} as const;

// Members-only Training-Lab gate at the SCREEN (navigation bug hunt 2026-09-14,
// E1). The Ear Lab arms the free-user preview before it navigates to a locked
// lab, but a custom-scheme deep link (proaudio://labs/compression) and a
// pendingLink resume after sign-in both reach the lab screen WITHOUT passing the
// Ear Lab — so a non-member opened these members-only labs live. Wrapping each
// members-only lab route that carries a deep-link path (navigation/linking.ts)
// closes both vectors in one place; the HOC no-ops for members and reads the
// members-only rule from labCatalog. INVARIANT: any lab given a deep-link path
// in linkPaths.ts that is members-only per labCatalog MUST be wrapped here too.
const MemberGated = {
  HarmonographLab: lazyScreen(() => withMembershipPreview(Gated.HarmonographLab())),
  HarmonicLab: lazyScreen(() => withMembershipPreview(Gated.HarmonicLab())),
  OscillatorLab: lazyScreen(() => withMembershipPreview(Gated.OscillatorLab())),
  NoiseLab: lazyScreen(() => withMembershipPreview(Gated.NoiseLab())),
  EqLab: lazyScreen(() => withMembershipPreview(Gated.EqLab())),
  CompressionLab: lazyScreen(() => withMembershipPreview(Gated.CompressionLab())),
  ReverbLab: lazyScreen(() => withMembershipPreview(Gated.ReverbLab())),
  DelayLab: lazyScreen(() => withMembershipPreview(Gated.DelayLab())),
  MicLab: lazyScreen(() => withMembershipPreview(Gated.MicLab())),
  SpeakerLab: lazyScreen(() => withMembershipPreview(Gated.SpeakerLab())),
  TubeLab: lazyScreen(() => withMembershipPreview(Gated.TubeLab())),
  CableInstallLab: lazyScreen(() => withMembershipPreview(Gated.CableInstallLab())),
  DigitalLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/digital/DigitalLabHomeScreen').DigitalLabHomeScreen)),
  CymaticsLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/cymatics/CymaticsHomeScreen').CymaticsHomeScreen)),
  ProductionLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/production/ProductionLabScreen').ProductionLabScreen)),

  // ── THE CHILD ROUTES OF THE TWO FLAGSHIP LABS (2026-09-17) ────────────────
  //
  // `CymaticsLab` and `ProductionLab` are members-only and gated above. These
  // are the screens INSIDE them, and they were registered through the
  // orientation wrapper alone, which checks nothing — the same confusion that
  // left 31 lab routes open in pass 1, one level deeper.
  //
  // Nobody reaches them without passing the parent today only because
  // `isClaimedPath` happens to reject `labs/` URLs of more than two segments —
  // and that rejection is itself filed as a bug to fix. Fixing it without this
  // would hand a non-member both flagship labs, fully unlocked, by URL.
  //
  // `membershipGating.test.ts` derives its set from catalog LEAVES, so it
  // structurally cannot see a child route. They are listed here by hand, and
  // the test's own second assertion still proves each one really wraps.
  CymaticsModule: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/cymatics/CymaticsModuleScreen').CymaticsModuleScreen))),
  CymaticsPlateStudio: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/cymatics/PlateStudioScreen').PlateStudioScreen))),
  CymaticsLiquidStudio: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/cymatics/LiquidStudioScreen').LiquidStudioScreen))),
  CymaticsMembraneStudio: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/cymatics/MembraneStudioScreen').MembraneStudioScreen))),
  CymaticsGallery: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/cymatics/GalleryScreen').GalleryScreen))),
  ProductionStage: lazyScreen(() => withMembershipPreview(require('../screens/lab/production/ProductionStageScreen').ProductionStageScreen)),
  ProductionActivity: lazyScreen(() => withMembershipPreview(require('../screens/lab/production/ProductionActivityScreen').ProductionActivityScreen)),
  // The packet screen (2026-10-04, design review #5): inside the paid lab, so
  // gated like its siblings, and lazy like every lab route.
  ProductionPacket: lazyScreen(() => withMembershipPreview(require('../screens/lab/production/ProductionPacketScreen').ProductionPacketScreen)),

  // ── THE PREDICATE IS NOT THE GATE EITHER (2026-09-17, pass 5) ──────────
  //
  // Pass 4 added these eight to `MEMBER_ONLY_EXTRA_ROUTES` so the predicate
  // would answer correctly — and left them registered with `Gated.X` or bare, so
  // NOTHING ASKED IT. `isMemberOnlyLabRoute` has exactly one consumer, which is
  // `withMembershipPreview`; a route that is not wrapped never reaches it.
  //
  // That is the third time this week the same mistake has been made from a
  // different direction: the wrapper without the predicate gates nothing, and
  // the predicate without the wrapper is never consulted. Both halves are
  // needed, and `membershipGating.test.ts` now asserts both for every one.
  DigitalModule: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/digital/DigitalModuleScreen').DigitalModuleScreen))),
  EqModule: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/eq/EqModuleScreen').EqModuleScreen))),
  GainModule: lazyScreen(() => withMembershipPreview(orient(require('../screens/lab/gain/GainModuleScreen').GainModuleScreen))),
  EarModule: lazyScreen(() => withMembershipPreview(require('../screens/lab/eartraining/EarModuleScreen').EarModuleScreen)),
  AmpModule: lazyScreen(() => withMembershipPreview(require('../screens/lab/amp/AmpModuleScreen').AmpModuleScreen)),
  TubeReference: lazyScreen(() => withMembershipPreview(require('../screens/lab/tube/TubeReferenceScreen').TubeReferenceScreen)),
  TubeCard: lazyScreen(() => withMembershipPreview(require('../screens/lab/tube/TubeCardScreen').TubeCardScreen)),
  DeEsserLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/deesser/DeEsserLabScreen').DeEsserLabScreen)),

  // ── ADDED 2026-09-17, after a bug-hunt pass found the hole ────────────────
  //
  // These are members-only in labCatalog.ts and were registered with `Gated.X`
  // (which is the ORIENTATION wrapper) or with a bare screen — so nothing
  // checked membership. Tapping them from the catalog looked correct because
  // the catalog draws its own padlock, but every OTHER way in opened the lab
  // fully unlocked: the `labs/:id` deep link, Career Finder's "try a lab",
  // the Glossary's "Launch Lab", and any restored navigation state.
  //
  // The list was derived mechanically — every catalog leaf with `member: true`
  // or in the `training` section, minus the alwaysFree Calculator Lab, diffed
  // against the components actually registered — rather than by eye, because
  // by eye is how 31 of them were missed.
  AdvancedMixingLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/mixing/AdvancedMixingLabScreen').AdvancedMixingLabScreen)),
  AmpLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/amp/AmpLabHomeScreen').AmpLabHomeScreen)),
  AutotuneLab: lazyScreen(() => withMembershipPreview(Gated.AutotuneLab())),
  BassLab: lazyScreen(() => withMembershipPreview(Gated.BassLab())),
  BeginningMixingLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/mixing/BeginningMixingLabScreen').BeginningMixingLabScreen)),
  // Mastering Lab (2026-10-01): members-only via its catalog leaf in the
  // Mixing category; one route, so the predicate sees it directly.
  MasteringLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/mastering/MasteringLabScreen').MasteringLabScreen)),
  // Drum Tuning Lab (2026-10-01): members-only via its catalog leaf in the
  // Pitch & Tuning category; one route.
  DrumTuningLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/drumtuning/DrumTuningLabScreen').DrumTuningLabScreen)),
  // Miking Labs (2026-10-04): the hub is the catalog row (Instruments &
  // Recording, training); the lesson host is a child route the catalog
  // cannot name (MEMBER_ONLY_EXTRA_ROUTES). Both gated, both lazy.
  MikingHub: lazyScreen(() => withMembershipPreview(require('../screens/lab/miking/MikingHubScreen').MikingHubScreen)),
  MikingLesson: lazyScreen(() => withMembershipPreview(require('../screens/lab/miking/MikingLessonScreen').MikingLessonScreen)),
  BinauralLab: lazyScreen(() => withMembershipPreview(Gated.BinauralLab())),
  CableLab: lazyScreen(() => withMembershipPreview(Gated.CableLab())),
  ChorusLab: lazyScreen(() => withMembershipPreview(Gated.ChorusLab())),
  ConnectorSelectLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/connectorselect/ConnectorSelectLabScreen').ConnectorSelectLabScreen)),
  // Sound Systems Lab (2026-09-25): the hub is the catalog row; its five mode
  // screens are children the catalog cannot see (MEMBER_ONLY_EXTRA_ROUTES).
  SoundSystemsLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/SoundSystemsLabScreen').SoundSystemsLabScreen)),
  // Room Design & Monitoring Lab (2026-10-01): members-only via its Acoustics
  // catalog leaf (`member: true`, the Speaker Placement precedent).
  RoomDesignLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/roomdesign/RoomDesignLabScreen').RoomDesignLabScreen)),
  SoundSystemsLearn: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/modeScreens').SoundSystemsLearnScreen)),
  SoundSystemsBuild: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/modeScreens').SoundSystemsBuildScreen)),
  SoundSystemsRoute: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/modeScreens').SoundSystemsRouteScreen)),
  SoundSystemsOperate: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/modeScreens').SoundSystemsOperateScreen)),
  SoundSystemsTroubleshoot: lazyScreen(() => withMembershipPreview(require('../screens/lab/soundsystems/modeScreens').SoundSystemsTroubleshootScreen)),
  DistortionLab: lazyScreen(() => withMembershipPreview(Gated.DistortionLab())),
  EarTrainingLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/eartraining/EarTrainingLabScreen').EarTrainingLabScreen)),
  EnvelopeLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/envelope/EnvelopeLabScreen').EnvelopeLabScreen)),
  EqLabHome: lazyScreen(() => withMembershipPreview(require('../screens/lab/eq/EqLabHomeScreen').EqLabHomeScreen)),
  FlangerLab: lazyScreen(() => withMembershipPreview(Gated.FlangerLab())),
  FmLab: lazyScreen(() => withMembershipPreview(Gated.FmLab())),
  FoundationsPlayground: lazyScreen(() => withMembershipPreview(Gated.FoundationsPlayground())),
  GainLabHome: lazyScreen(() => withMembershipPreview(require('../screens/lab/gain/GainLabHomeScreen').GainLabHomeScreen)),
  GateLab: lazyScreen(() => withMembershipPreview(Gated.GateLab())),
  LimiterLab: lazyScreen(() => withMembershipPreview(Gated.LimiterLab())),
  MeterLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/meter/MeterLabHomeScreen').MeterLabHomeScreen)),
  MeterModule: lazyScreen(() => withMembershipPreview(Gated.MeterModule())),
  MicSelectLab: lazyScreen(() => withMembershipPreview(Gated.MicSelectLab())),
  ModularLab: lazyScreen(() => withMembershipPreview(Gated.ModularLab())),
  PatchbayLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/patchbay/PatchbayLabScreen').PatchbayLabScreen)),
  PhaseLab: lazyScreen(() => withMembershipPreview(Gated.PhaseLab())),
  PhaserLab: lazyScreen(() => withMembershipPreview(Gated.PhaserLab())),
  SignalChainLab: lazyScreen(() => withMembershipPreview(Gated.SignalChainLab())),
  SmartProcessorsLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/deesser/SmartProcessorsLabScreen').SmartProcessorsLabScreen)),
  SpeechLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/speech/SpeechLabScreen').SpeechLabScreen)),
  StereoLab: lazyScreen(() => withMembershipPreview(Gated.StereoLab())),
  TuningLab: lazyScreen(() => withMembershipPreview(require('../screens/lab/tuning/TuningLabScreen').TuningLabScreen)),
} as const;

export function RootNavigator() {
  // gestureEnabled:false is the app-wide DEFAULT (owner 2026-08-11): the iOS
  // edge swipe-back was stealing full-width sliders' horizontal drags on every
  // lab/tool/calc/module screen, since a slider's left end sits in the edge
  // zone. Every screen here has a ‹ back button, so no navigation is lost.
  // Screens that genuinely want a horizontal swipe own it via their OWN
  // component gesture (e.g. full-screen flashcards in StudyStack) — unaffected
  // by this navigator setting. Opt a single screen back IN with
  // options={{ gestureEnabled: true }} if ever needed.
  //
  // TRANSITION STANDARD (owner 2026-08-16): switching areas FADES, opening
  // content PUSHES. Default here = the push (platform-native horizontal;
  // 'default' on iOS = UIKit push w/ native easing + swipe-back support,
  // 'slide_from_right' on Android = subtle horizontal push). Area-level
  // destinations (Awards/Certificates, ToolsHub, Splash/Auth/Main) override
  // with NAV_FADE. Under Reduce Motion the push becomes a very short fade.
  // Swipe-back is enabled per-screen ONLY on read-only content pages with no
  // full-width sliders (the 2026-08-11 ruling still governs slider screens).
  const reduceMotion = useReduceMotionNav();
  const push = reduceMotion ? NAV_PUSH_REDUCED : NAV_PUSH;
  // Portrait on phones, free on tablets (owner 2026-09-29, Android large-screen pass).
  const navOrientation = useNavOrientation();
  const swipe = { gestureEnabled: true } as const; // safe pilot set only
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, gestureEnabled: false, ...navOrientation, ...push }}
      /*
       * LOW-LIGHT WASH LIVES HERE, not at the app root (owner 2026-08-31:
       * "I opened Settings in low-light and it wasn't in low-light").
       *
       * A `presentation: 'modal'` screen is presented in its OWN native
       * container, ABOVE the React root's sibling views — so the root-level
       * LowLightDim never covered Settings, WeeklyConcept, Institutional,
       * About, Directory, ExposureMonitor or Paywall. Seven screens broke the
       * mode's promise that "the display stays dim and steady".
       *
       * screenLayout wraps EVERY screen, so the wash follows the user into any
       * screen — including ones added later, which is how this was missed in
       * the first place. Root-level siblings need no wash: ExposureCheckin
       * refuses to render while overlays are suppressed, and AudioBorderFrame
       * already painted above the wash.
       *
       * PER-SCREEN ERROR CONTAINMENT (2026-09-11) rides on the same hook, for
       * the same reason: it covers every screen, present and future. The
       * boundary wraps the SCREEN ONLY — it is inside the native card, below
       * the header, and sees none of the Screen-level options — so transitions,
       * `presentation` and the swipe-back gesture are untouched. It renders a
       * Fragment while healthy, so it adds no view and no layout.
       *
       * LowLightDim stays OUTSIDE the boundary on purpose: if a screen does
       * fail, low-light mode must still hold the display dim over the error
       * card — the mode's whole promise is that nothing brightens during a show.
       */
      screenLayout={({ children, navigation, route }) => (
        <>
          <ScreenErrorBoundary navigation={navigation} routeName={route.name}>
            {children}
          </ScreenErrorBoundary>
          <LowLightDim />
          {/* App-themed confirm / notice popups (owner 2026-09-13). HERE, not at
              the App root, for the reason spelled out above: a
              `presentation: 'modal'` screen sits ABOVE the root's siblings, so a
              root-level dialog raised FROM Settings / About / Paywall and the
              other four rendered UNDERNEATH them — invisible and un-tappable.
              Settings is where Log out lives, and the owner got no popup at all.
              Per-screen covers every screen present and future, which is the
              same argument LowLightDim and ScreenErrorBoundary are here for.
              The host itself only draws on the FOCUSED screen. */}
          <AppDialogHost />
          {/* Same move, same reason (2026-09-13): the membership gate was a
              root-level sibling too, and would have been buried by any modal
              screen that raised it. */}
          <MembershipGateHost />
        </>
      )}
    >
      {/* App-entry area switches — fade-through, never a push. */}
      <Stack.Screen name="Splash" component={SplashScreen} options={NAV_FADE} />
      <Stack.Screen name="Auth" component={AuthScreen} options={NAV_FADE} />
      <Stack.Screen name="Main" component={MainTabs} options={NAV_FADE} />
      {/* Reward loop — exits are explicit buttons/auto-advance, never a back gesture. */}
      <Stack.Screen name="Results" getComponent={Lazy.Results} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Trophy" getComponent={Lazy.Trophy} options={{ gestureEnabled: false }} />
      {/* Celebrations replace the quiz-win trophy (owner 2026-09-17). Back is
          disabled for the same reason Trophy disables it: the attempt behind
          this screen is finished and returning to it is meaningless. */}
      <Stack.Screen name="Celebration" getComponent={Lazy.Celebration} options={{ gestureEnabled: false }} />
      {/* Final Exam (R6b capstone) — one sitting, no back gesture, no pause. */}
      <Stack.Screen name="AwardProgress" getComponent={Lazy.AwardProgress} options={swipe} />
      <Stack.Screen name="FinalExam" getComponent={Lazy.FinalExam} options={{ gestureEnabled: false }} />
      <Stack.Screen name="FinalExamResult" getComponent={Lazy.FinalExamResult} options={{ gestureEnabled: false }} />
      {/* S11 — modal, bottom nav hidden, exits via ✕ */}
      <Stack.Screen name="Settings" getComponent={Lazy.Settings} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Help" getComponent={Lazy.Help} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WeeklyConcept" getComponent={Lazy.WeeklyConcept} options={{ presentation: 'modal' }} />
      {/* Institutional Mode parked container (user request 2026-07-17). */}
      <Stack.Screen name="Institutional" getComponent={Lazy.Institutional} options={{ presentation: 'modal' }} />
      <Stack.Screen name="About" getComponent={Lazy.About} options={{ presentation: 'modal' }} />
      {/* Awards (Booth 2026-07-15) — Certificates/Diplomas/Hall of Fame, bottom
          nav hidden. An AREA-level destination (Dashboard ⇄ Certificates) → fade. */}
      <Stack.Screen name="Awards" getComponent={Lazy.Awards} options={NAV_FADE} />
      {/* "Get Discovered" registry info is no longer a standalone route — it
          lives as the DirectoryView page inside the Awards pager. The old
          `Directory` modal route was unreachable and was removed 2026-09-10. */}
      {/* Audio Community Directory (spec 2026-08-31 §5). Full screen rather than
          a modal: it has three destinations of its own and a member sheet on
          top, and a modal-in-modal is the black-screen trap this codebase has
          hit before. */}
      <Stack.Screen name="AudioCommunityDirectory" getComponent={Lazy.AudioCommunityDirectory} />
      <Stack.Screen name="EmployerAdmin" getComponent={Lazy.EmployerAdmin} />
      <Stack.Screen name="ReportsAdmin" getComponent={Lazy.ReportsAdmin} />
      {/* Measurement & Analysis tools (Booth 2026-07-09v) — bottom nav hidden.
          The TOOLS AREA root (Dashboard ⇄ Tools) → fade; everything inside it
          pushes. */}
      <Stack.Screen name="ToolsHub" getComponent={Lazy.ToolsHub} options={NAV_FADE} />
      <Stack.Screen name="ToolInfo" getComponent={Lazy.ToolInfo} options={swipe} />
      {/* Phase-1 training layer (spec of record 2026-07-23): Learn/Demo per
          tool + Smaart concept modules. Academy-gated at content level. */}
      <Stack.Screen name="ToolLearn" getComponent={Lazy.ToolLearn} options={swipe} />
      <Stack.Screen name="ToolDemo" getComponent={Gated.ToolDemo} />
      <Stack.Screen name="ConceptModule" getComponent={Lazy.ConceptModule} options={swipe} />
      {/* Phase-2 saved-measurement library + A/B compare (spec §7/§8). */}
      <Stack.Screen name="ToolLibrary" getComponent={Lazy.ToolLibrary} options={swipe} />
      {/* LIVE measurement screens (engine build 2026-07-23) — each gates
          itself honestly via EngineGate when the engine isn't in the build. */}
      <Stack.Screen name="SplMeter" getComponent={Gated.SplMeter} />
      <Stack.Screen name="Rta" getComponent={Gated.Rta} />
      <Stack.Screen name="WaveformLive" getComponent={Gated.Waveform} />
      <Stack.Screen name="SignalGen" getComponent={Gated.SignalGen} />
      <Stack.Screen name="SpectrogramLive" getComponent={Gated.Spectrogram} />
      <Stack.Screen name="Rt60Live" getComponent={Gated.Rt60} />
      {/* Frequency Counter & Tuner tool (2026-07-18; tuner merged 2026-07-23). */}
      <Stack.Screen name="FrequencyCounter" getComponent={Gated.FrequencyCounter} />
      {/* Pro Audio MultiMeter (Mono) — all-in-one live meter (owner 2026-07-29). */}
      <Stack.Screen name="MultiMeter" getComponent={Gated.MultiMeter} />
      {/* Listening Exposure Monitor (owner 2026-08-12) — a POPUP (modal) opened
          from the ToolsHub dosimeter chip and the check-in panel; the ONLY
          places the user interacts with dosimeter readings/settings. UNGATED
          on purpose: hearing-safety info is never behind the orientation or a
          paywall. */}
      <Stack.Screen name="ExposureMonitor" getComponent={Lazy.ExposureMonitor} options={{ presentation: 'modal' }} />
      {/* Spike-0 dev-only debug (entry rendered only when __DEV__). */}
      <Stack.Screen name="DspDebug" getComponent={Lazy.DspDebug} />
      {/* Audio Learning Lab (v4 MASTER §13) — the pinned Home card opens the
          EarLab landing menu; HarmonicLab is the one live lab today. Bottom nav
          hidden like the other tool screens. */}
      <Stack.Screen name="AudioLearning" getComponent={Lazy.AudioLearning} options={swipe} />
      <Stack.Screen name="EarLab" getComponent={Lazy.EarLab} options={swipe} />
      <Stack.Screen name="LabCategory" getComponent={Lazy.LabCategory} options={swipe} />
      <Stack.Screen name="HarmonicLab" getComponent={MemberGated.HarmonicLab} />
      <Stack.Screen name="OscillatorLab" getComponent={MemberGated.OscillatorLab} />
      <Stack.Screen name="NoiseLab" getComponent={MemberGated.NoiseLab} />
      <Stack.Screen name="HarmonographLab" getComponent={MemberGated.HarmonographLab} />
      {/* The 12 effect labs (native effects path, engineVersion 6). */}
      <Stack.Screen name="EqLab" getComponent={MemberGated.EqLab} />
      <Stack.Screen name="DelayLab" getComponent={MemberGated.DelayLab} />
      <Stack.Screen name="ReverbLab" getComponent={MemberGated.ReverbLab} />
      <Stack.Screen name="ChorusLab" getComponent={MemberGated.ChorusLab} />
      <Stack.Screen name="FlangerLab" getComponent={MemberGated.FlangerLab} />
      <Stack.Screen name="PhaserLab" getComponent={MemberGated.PhaserLab} />
      <Stack.Screen name="CompressionLab" getComponent={MemberGated.CompressionLab} />
      <Stack.Screen name="GateLab" getComponent={MemberGated.GateLab} />
      <Stack.Screen name="LimiterLab" getComponent={MemberGated.LimiterLab} />
      <Stack.Screen name="DistortionLab" getComponent={MemberGated.DistortionLab} />
      <Stack.Screen name="PhaseLab" getComponent={MemberGated.PhaseLab} />
      <Stack.Screen name="StereoLab" getComponent={MemberGated.StereoLab} />
      <Stack.Screen name="SignalChainLab" getComponent={MemberGated.SignalChainLab} />
      {/* Expansion labs (owner 2026-07-26). */}
      <Stack.Screen name="BassLab" getComponent={MemberGated.BassLab} />
      <Stack.Screen name="AutotuneLab" getComponent={MemberGated.AutotuneLab} />
      <Stack.Screen name="FmLab" getComponent={MemberGated.FmLab} />
      <Stack.Screen name="BinauralLab" getComponent={MemberGated.BinauralLab} />
      <Stack.Screen name="ModularLab" getComponent={MemberGated.ModularLab} />
      <Stack.Screen name="MicLab" getComponent={MemberGated.MicLab} />
      {/* Microphone Selection Lab (owner spec 2026-08-12) — selection &
          characteristics, no audio/engine dependency. */}
      <Stack.Screen name="MicSelectLab" getComponent={MemberGated.MicSelectLab} />
      <Stack.Screen name="CableLab" getComponent={MemberGated.CableLab} />
      <Stack.Screen name="CableInstallLab" getComponent={MemberGated.CableInstallLab} />
      <Stack.Screen name="SpeakerLab" getComponent={MemberGated.SpeakerLab} />
      <Stack.Screen name="TubeLab" getComponent={MemberGated.TubeLab} />
      <Stack.Screen name="TubeReference" getComponent={MemberGated.TubeReference} options={swipe} />
      {/* No swipe-back on TubeCard (2026-10-04): the card is a drag surface —
          a horizontal swipe flips sheets and a zoomed one-finger drag pans,
          both of which start at the left edge as often as anywhere, where the
          iOS interactive pop would take them. The ‹ back button stays. */}
      <Stack.Screen name="TubeCard" getComponent={MemberGated.TubeCard} />
      <Stack.Screen name="CalcLab" getComponent={Lazy.CalcLab} />
      <Stack.Screen name="CalcWorkspace" getComponent={Lazy.CalcWorkspace} />
      <Stack.Screen name="CalcSymbolsKey" getComponent={Lazy.CalcSymbolsKey} />
      <Stack.Screen name="CalcWorkflows" getComponent={Lazy.CalcWorkflows} />
      <Stack.Screen name="CalcWorkflowEdit" getComponent={Lazy.CalcWorkflowEdit} />
      <Stack.Screen name="CalcWorkflowRun" getComponent={Lazy.CalcWorkflowRun} />
      <Stack.Screen name="CalcProjects" getComponent={Lazy.CalcProjects} />
      <Stack.Screen name="CalcResults" getComponent={Lazy.CalcResults} />
      <Stack.Screen name="DigitalLab" getComponent={MemberGated.DigitalLab} />
      <Stack.Screen name="DigitalModule" getComponent={MemberGated.DigitalModule} />
      <Stack.Screen name="CymaticsLab" getComponent={MemberGated.CymaticsLab} />
      {/* Both production labs share one screen; the route just fixes the param.
          Named entries exist so each lab can be linked to on its own. */}
      <Stack.Screen
        name="PreProdLab"
        getComponent={MemberGated.ProductionLab}
        initialParams={{ lab: 'preprod' }}
      />
      <Stack.Screen
        name="PostProdLab"
        getComponent={MemberGated.ProductionLab}
        initialParams={{ lab: 'postprod' }}
      />
      <Stack.Screen name="ProductionLab" getComponent={MemberGated.ProductionLab} />
      <Stack.Screen name="ProductionStage" getComponent={MemberGated.ProductionStage} />
      <Stack.Screen name="ProductionActivity" getComponent={MemberGated.ProductionActivity} />
      <Stack.Screen name="ProductionPacket" getComponent={MemberGated.ProductionPacket} />
      <Stack.Screen name="CymaticsModule" getComponent={MemberGated.CymaticsModule} />
      <Stack.Screen name="CymaticsPlateStudio" getComponent={MemberGated.CymaticsPlateStudio} />
      <Stack.Screen name="CymaticsLiquidStudio" getComponent={MemberGated.CymaticsLiquidStudio} />
      <Stack.Screen name="CymaticsMembraneStudio" getComponent={MemberGated.CymaticsMembraneStudio} />
      <Stack.Screen name="CymaticsGallery" getComponent={MemberGated.CymaticsGallery} />
      <Stack.Screen name="WaveLab" getComponent={Lazy.WaveLab} />
      <Stack.Screen name="WaveModule" getComponent={Gated.WaveModule} />
      <Stack.Screen name="EarTrainingLab" getComponent={MemberGated.EarTrainingLab} />
      <Stack.Screen name="EarModule" getComponent={MemberGated.EarModule} />
      <Stack.Screen name="AmpLab" getComponent={MemberGated.AmpLab} />
      <Stack.Screen name="AmpModule" getComponent={MemberGated.AmpModule} />
      <Stack.Screen name="TuningLab" getComponent={MemberGated.TuningLab} />
      <Stack.Screen name="EnvelopeLab" getComponent={MemberGated.EnvelopeLab} />
      <Stack.Screen name="PatchbayLab" getComponent={MemberGated.PatchbayLab} />
      <Stack.Screen name="ConnectorSelectLab" getComponent={MemberGated.ConnectorSelectLab} />
      <Stack.Screen name="SoundSystemsLab" getComponent={MemberGated.SoundSystemsLab} />
      <Stack.Screen name="RoomDesignLab" getComponent={MemberGated.RoomDesignLab} />
      <Stack.Screen name="SoundSystemsLearn" getComponent={MemberGated.SoundSystemsLearn} />
      <Stack.Screen name="SoundSystemsBuild" getComponent={MemberGated.SoundSystemsBuild} />
      <Stack.Screen name="SoundSystemsRoute" getComponent={MemberGated.SoundSystemsRoute} />
      <Stack.Screen name="SoundSystemsOperate" getComponent={MemberGated.SoundSystemsOperate} />
      <Stack.Screen name="SoundSystemsTroubleshoot" getComponent={MemberGated.SoundSystemsTroubleshoot} />
      <Stack.Screen name="BeginningMixingLab" getComponent={MemberGated.BeginningMixingLab} />
      <Stack.Screen name="AdvancedMixingLab" getComponent={MemberGated.AdvancedMixingLab} />
      <Stack.Screen name="MasteringLab" getComponent={MemberGated.MasteringLab} />
      <Stack.Screen name="DrumTuningLab" getComponent={MemberGated.DrumTuningLab} />
      <Stack.Screen name="MikingHub" getComponent={MemberGated.MikingHub} />
      <Stack.Screen name="MikingLesson" getComponent={MemberGated.MikingLesson} />
      <Stack.Screen name="SpeechLab" getComponent={MemberGated.SpeechLab} />
      <Stack.Screen name="SmartProcessorsLab" getComponent={MemberGated.SmartProcessorsLab} />
      <Stack.Screen name="DeEsserLab" getComponent={MemberGated.DeEsserLab} />
      <Stack.Screen name="MeterLab" getComponent={MemberGated.MeterLab} />
      <Stack.Screen name="MeterModule" getComponent={MemberGated.MeterModule} />
      <Stack.Screen name="EqLabHome" getComponent={MemberGated.EqLabHome} />
      <Stack.Screen name="EqModule" getComponent={MemberGated.EqModule} />
      <Stack.Screen name="GainLabHome" getComponent={MemberGated.GainLabHome} />
      <Stack.Screen name="GainModule" getComponent={MemberGated.GainModule} />
      {/* Understanding Level & Amplitude — the first lab in Audio Fundamentals
          (owner 2026-08-12). UNGATED: it IS the orientation, so it must never
          be wrapped in withAmplitudeOrientation (that would gate it behind
          itself). */}
      <Stack.Screen name="AmplitudeLab" getComponent={Lazy.AmplitudeLab} options={swipe} />
      {/* Foundations of Sound — the Ear Lab's first module (course + sandbox). */}
      <Stack.Screen name="FoundationsCourse" getComponent={Lazy.FoundationsCourse} />
      <Stack.Screen name="FoundationsPlayground" getComponent={MemberGated.FoundationsPlayground} />
      {/* Audio Career Finder (owner brief 2026-09-03). No audio visualizer, so
          NOT behind the amplitude orientation; read-only pages take swipe-back,
          the questions do not (a stray swipe mid-answer is the one gesture
          that would surprise). */}
      <Stack.Screen name="CareerFinder" getComponent={Lazy.CareerFinder} options={swipe} />
      <Stack.Screen name="CareerFinderQuiz" getComponent={Lazy.CareerFinderQuiz} />
      <Stack.Screen name="CareerFinderResults" getComponent={Lazy.CareerFinderResults} options={swipe} />
      <Stack.Screen name="CareerFamily" getComponent={Lazy.CareerFamily} options={swipe} />
      <Stack.Screen name="CareerFamilyList" getComponent={Lazy.CareerFamilyList} options={swipe} />
      <Stack.Screen name="CareerFinderAbout" getComponent={Lazy.CareerFinderAbout} options={swipe} />
      {/* Start Here (owner 2026-09-29): FREE for everyone, guests included —
          deliberately NOT wrapped in withMembershipPreview / MemberGated.
          No swipe-back: its rack pages carry full-width faders. */}
      <Stack.Screen name="StartHere" getComponent={Lazy.StartHere} />
      <Stack.Screen name="StartHereTerms" getComponent={Lazy.StartHereTerms} options={swipe} />
      {/* Anonymous public glossary (commercial browse path). */}
      <Stack.Screen name="PublicGlossary" getComponent={Lazy.PublicGlossary} />
      {/* CM7: academy paywall (modal; UI only). */}
      <Stack.Screen name="Paywall" getComponent={Lazy.Paywall} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
