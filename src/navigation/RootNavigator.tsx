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
import { NAV_FADE, NAV_PUSH, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { ResultsScreen } from '../screens/results/ResultsScreen';
import { TrophyScreen } from '../screens/results/TrophyScreen';
import { AwardProgressScreen } from '../screens/awards/AwardProgressScreen';
import { FinalExamScreen } from '../screens/exam/FinalExamScreen';
import { FinalExamResultScreen } from '../screens/exam/FinalExamResultScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { WeeklyConceptScreen } from '../screens/notifications/WeeklyConceptScreen';
import { InstitutionalScreen } from '../screens/institutional/InstitutionalScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import { AwardsScreen } from '../screens/awards/AwardsScreen';
import { DirectoryScreen } from '../screens/directory/DirectoryScreen';
import { AudioCommunityDirectoryScreen } from '../screens/directory/AudioCommunityDirectoryScreen';
import { ToolsHubScreen } from '../screens/tools/ToolsHubScreen';
import { ToolInfoScreen } from '../screens/tools/ToolInfoScreen';
import { ToolLearnScreen } from '../screens/tools/ToolLearnScreen';
import { ToolDemoScreen } from '../screens/tools/ToolDemoScreen';
import { ConceptModuleScreen } from '../screens/tools/ConceptModuleScreen';
import { MeasurementLibraryScreen } from '../screens/tools/MeasurementLibraryScreen';
import { SplMeterScreen } from '../screens/tools/SplMeterScreen';
import { RtaScreen } from '../screens/tools/RtaScreen';
import { WaveformScreen } from '../screens/tools/WaveformScreen';
import { SignalGenScreen } from '../screens/tools/SignalGenScreen';
import { SpectrogramScreen } from '../screens/tools/SpectrogramScreen';
import { Rt60Screen } from '../screens/tools/Rt60Screen';
import { FrequencyCounterScreen } from '../screens/tools/FrequencyCounterScreen';
import { MultiMeterScreen } from '../screens/tools/MultiMeterScreen';
import { DspDebugScreen } from '../screens/tools/DspDebugScreen';
import { AudioLearningScreen } from '../screens/lab/AudioLearningScreen';
import { EarLabScreen } from '../screens/lab/EarLabScreen';
import { LabCategoryScreen } from '../screens/lab/LabCategoryScreen';
import { HarmonicLabScreen } from '../screens/lab/HarmonicLabScreen';
import { OscillatorLabScreen } from '../screens/lab/OscillatorLabScreen';
import { NoiseLabScreen } from '../screens/lab/NoiseLabScreen';
import { HarmonographLabScreen } from '../screens/lab/HarmonographLabScreen';
import {
  EqLabScreen,
  DelayLabScreen,
  ReverbLabScreen,
  ChorusLabScreen,
  FlangerLabScreen,
  PhaserLabScreen,
  CompressionLabScreen,
  GateLabScreen,
  LimiterLabScreen,
  DistortionLabScreen,
  PhaseLabScreen,
  StereoLabScreen,
} from '../screens/lab/fxLabConfigs';
import { SignalChainLabScreen } from '../screens/lab/SignalChainLabScreen';
import { BassLabScreen } from '../screens/lab/BassLabScreen';
import { AutotuneLabScreen } from '../screens/lab/AutotuneLabScreen';
import { FmLabScreen } from '../screens/lab/FmLabScreen';
import { BinauralLabScreen } from '../screens/lab/BinauralLabScreen';
import { ModularLabScreen } from '../screens/lab/ModularLabScreen';
import { MicPrinciplesLabScreen } from '../screens/lab/micspeaker/MicPrinciplesLabScreen';
import { SpeakerCoverageLabScreen } from '../screens/lab/micspeaker/SpeakerCoverageLabScreen';
import { VacuumTubeLabScreen } from '../screens/lab/tube/VacuumTubeLabScreen';
import { TubeReferenceScreen } from '../screens/lab/tube/TubeReferenceScreen';
import { TubeCardScreen } from '../screens/lab/tube/TubeCardScreen';
import { CalcLabScreen } from '../screens/lab/calc/CalcLabScreen';
import { CalcWorkspaceScreen } from '../screens/lab/calc/CalcWorkspaceScreen';
import { CalcSymbolsKeyScreen } from '../screens/lab/calc/CalcSymbolsKeyScreen';
import { CalcWorkflowsScreen } from '../screens/lab/calc/CalcWorkflowsScreen';
import { CalcWorkflowEditScreen } from '../screens/lab/calc/CalcWorkflowEditScreen';
import { CalcWorkflowRunScreen } from '../screens/lab/calc/CalcWorkflowRunScreen';
import { CalcProjectsScreen } from '../screens/lab/calc/CalcProjectsScreen';
import { CalcResultsScreen } from '../screens/lab/calc/CalcResultsScreen';
import { DigitalLabHomeScreen } from '../screens/lab/digital/DigitalLabHomeScreen';
import { DigitalModuleScreen } from '../screens/lab/digital/DigitalModuleScreen';
import { WaveLabHomeScreen } from '../screens/lab/wave/WaveLabHomeScreen';
import { WaveModuleScreen } from '../screens/lab/wave/WaveModuleScreen';
// Ear Training Lab (owner brief 2026-09-02) — home + generic module shell.
import { EarTrainingLabScreen } from '../screens/lab/eartraining/EarTrainingLabScreen';
import { EarModuleScreen } from '../screens/lab/eartraining/EarModuleScreen';
// Amplifier Principles Lab (owner build spec 2026-09-02): home + module shell.
import { AmpLabHomeScreen } from '../screens/lab/amp/AmpLabHomeScreen';
import { AmpModuleScreen } from '../screens/lab/amp/AmpModuleScreen';
// Tuning & Temperament Lab (owner build spec 2026-09-02): one paced screen.
import { TuningLabScreen } from '../screens/lab/tuning/TuningLabScreen';
// Sound Envelope & Transients Lab (owner brief 2026-09-02): visual, paged.
import { EnvelopeLabScreen } from '../screens/lab/envelope/EnvelopeLabScreen';
import { SpeechLabScreen } from '../screens/lab/speech/SpeechLabScreen';
import { SmartProcessorsLabScreen } from '../screens/lab/deesser/SmartProcessorsLabScreen';
import { DeEsserLabScreen } from '../screens/lab/deesser/DeEsserLabScreen';
import { MeterLabHomeScreen } from '../screens/lab/meter/MeterLabHomeScreen';
import { MeterModuleScreen } from '../screens/lab/meter/MeterModuleScreen';
import { EqLabHomeScreen } from '../screens/lab/eq/EqLabHomeScreen';
import { EqModuleScreen } from '../screens/lab/eq/EqModuleScreen';
import { GainLabHomeScreen } from '../screens/lab/gain/GainLabHomeScreen';
import { GainModuleScreen } from '../screens/lab/gain/GainModuleScreen';
import { FoundationsCourseScreen } from '../screens/lab/foundations/FoundationsCourseScreen';
import { FoundationsPlaygroundScreen } from '../screens/lab/foundations/FoundationsPlaygroundScreen';
import { PublicGlossaryScreen } from '../screens/landing/PublicGlossaryScreen';
import { PaywallScreen } from '../screens/commercial/PaywallScreen';
import { AmplitudeLabScreen, withAmplitudeOrientation } from '../screens/lab/amplitude/AmplitudeOrientation';
import { MicSelectLabScreen } from '../screens/lab/micselect/MicSelectLabScreen';
import { CableLabScreen } from '../screens/lab/cable/CableLabScreen';
import { CableInstallLabScreen } from '../screens/lab/cableinstall/CableInstallLabScreen';
import { ExposureMonitorScreen } from '../screens/tools/ExposureMonitorScreen';
// Audio Career Finder (owner brief 2026-09-03) — Career Discovery Lab, Beta.
import { CareerFinderScreen } from '../screens/careerfinder/CareerFinderScreen';
import { CareerFinderQuizScreen } from '../screens/careerfinder/CareerFinderQuizScreen';
import { CareerFinderResultsScreen } from '../screens/careerfinder/CareerFinderResultsScreen';
import { CareerFamilyScreen } from '../screens/careerfinder/CareerFamilyScreen';
import { CareerFamilyListScreen } from '../screens/careerfinder/CareerFamilyListScreen';
import { CareerFinderAboutScreen } from '../screens/careerfinder/CareerFinderAboutScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Amplitude color-language orientation gate (owner spec 2026-08-12): every
// INTERACTIVE audio lab / tool / module screen funnels through the one-time
// "Understanding Level & Amplitude" orientation until it has been completed
// once — either at a gated screen (Path B) or as the Foundations of Sound
// START HERE step (Path A; same flag). This block is the SINGLE registry of
// gated experiences — wrap future audio visualizers here, never inside the
// screens. Hubs, info/reference/records pages, calculators, and the
// Foundations course itself (it OPENS with the orientation) stay ungated.
const Gated = {
  ToolDemo: withAmplitudeOrientation(ToolDemoScreen),
  SplMeter: withAmplitudeOrientation(SplMeterScreen),
  Rta: withAmplitudeOrientation(RtaScreen),
  Waveform: withAmplitudeOrientation(WaveformScreen),
  SignalGen: withAmplitudeOrientation(SignalGenScreen),
  Spectrogram: withAmplitudeOrientation(SpectrogramScreen),
  Rt60: withAmplitudeOrientation(Rt60Screen),
  FrequencyCounter: withAmplitudeOrientation(FrequencyCounterScreen),
  MultiMeter: withAmplitudeOrientation(MultiMeterScreen),
  HarmonicLab: withAmplitudeOrientation(HarmonicLabScreen),
  OscillatorLab: withAmplitudeOrientation(OscillatorLabScreen),
  NoiseLab: withAmplitudeOrientation(NoiseLabScreen),
  HarmonographLab: withAmplitudeOrientation(HarmonographLabScreen),
  EqLab: withAmplitudeOrientation(EqLabScreen),
  DelayLab: withAmplitudeOrientation(DelayLabScreen),
  ReverbLab: withAmplitudeOrientation(ReverbLabScreen),
  ChorusLab: withAmplitudeOrientation(ChorusLabScreen),
  FlangerLab: withAmplitudeOrientation(FlangerLabScreen),
  PhaserLab: withAmplitudeOrientation(PhaserLabScreen),
  CompressionLab: withAmplitudeOrientation(CompressionLabScreen),
  GateLab: withAmplitudeOrientation(GateLabScreen),
  LimiterLab: withAmplitudeOrientation(LimiterLabScreen),
  DistortionLab: withAmplitudeOrientation(DistortionLabScreen),
  PhaseLab: withAmplitudeOrientation(PhaseLabScreen),
  StereoLab: withAmplitudeOrientation(StereoLabScreen),
  SignalChainLab: withAmplitudeOrientation(SignalChainLabScreen),
  BassLab: withAmplitudeOrientation(BassLabScreen),
  AutotuneLab: withAmplitudeOrientation(AutotuneLabScreen),
  FmLab: withAmplitudeOrientation(FmLabScreen),
  BinauralLab: withAmplitudeOrientation(BinauralLabScreen),
  ModularLab: withAmplitudeOrientation(ModularLabScreen),
  MicLab: withAmplitudeOrientation(MicPrinciplesLabScreen),
  MicSelectLab: withAmplitudeOrientation(MicSelectLabScreen),
  CableLab: withAmplitudeOrientation(CableLabScreen),
  CableInstallLab: withAmplitudeOrientation(CableInstallLabScreen),
  SpeakerLab: withAmplitudeOrientation(SpeakerCoverageLabScreen),
  TubeLab: withAmplitudeOrientation(VacuumTubeLabScreen),
  DigitalModule: withAmplitudeOrientation(DigitalModuleScreen),
  WaveModule: withAmplitudeOrientation(WaveModuleScreen),
  MeterModule: withAmplitudeOrientation(MeterModuleScreen),
  EqModule: withAmplitudeOrientation(EqModuleScreen),
  GainModule: withAmplitudeOrientation(GainModuleScreen),
  FoundationsPlayground: withAmplitudeOrientation(FoundationsPlaygroundScreen),
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
  const swipe = { gestureEnabled: true } as const; // safe pilot set only
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, gestureEnabled: false, ...push }}
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
       */
      screenLayout={({ children }) => (
        <>
          {children}
          <LowLightDim />
        </>
      )}
    >
      {/* App-entry area switches — fade-through, never a push. */}
      <Stack.Screen name="Splash" component={SplashScreen} options={NAV_FADE} />
      <Stack.Screen name="Auth" component={AuthScreen} options={NAV_FADE} />
      <Stack.Screen name="Main" component={MainTabs} options={NAV_FADE} />
      {/* Reward loop — exits are explicit buttons/auto-advance, never a back gesture. */}
      <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Trophy" component={TrophyScreen} options={{ gestureEnabled: false }} />
      {/* Final Exam (R6b capstone) — one sitting, no back gesture, no pause. */}
      <Stack.Screen name="AwardProgress" component={AwardProgressScreen} options={swipe} />
      <Stack.Screen name="FinalExam" component={FinalExamScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="FinalExamResult" component={FinalExamResultScreen} options={{ gestureEnabled: false }} />
      {/* S11 — modal, bottom nav hidden, exits via ✕ */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WeeklyConcept" component={WeeklyConceptScreen} options={{ presentation: 'modal' }} />
      {/* Institutional Mode parked container (user request 2026-07-17). */}
      <Stack.Screen name="Institutional" component={InstitutionalScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'modal' }} />
      {/* Awards (Booth 2026-07-15) — Certificates/Diplomas/Hall of Fame, bottom
          nav hidden. An AREA-level destination (Dashboard ⇄ Certificates) → fade. */}
      <Stack.Screen name="Awards" component={AwardsScreen} options={NAV_FADE} />
      {/* Directory — "Get Discovered" profile info (user request 2026-07-22) — modal. */}
      <Stack.Screen name="Directory" component={DirectoryScreen} options={{ presentation: 'modal' }} />
      {/* Audio Community Directory (spec 2026-08-31 §5). Full screen rather than
          a modal: it has three destinations of its own and a member sheet on
          top, and a modal-in-modal is the black-screen trap this codebase has
          hit before. */}
      <Stack.Screen name="AudioCommunityDirectory" component={AudioCommunityDirectoryScreen} />
      {/* Measurement & Analysis tools (Booth 2026-07-09v) — bottom nav hidden.
          The TOOLS AREA root (Dashboard ⇄ Tools) → fade; everything inside it
          pushes. */}
      <Stack.Screen name="ToolsHub" component={ToolsHubScreen} options={NAV_FADE} />
      <Stack.Screen name="ToolInfo" component={ToolInfoScreen} options={swipe} />
      {/* Phase-1 training layer (spec of record 2026-07-23): Learn/Demo per
          tool + Smaart concept modules. Academy-gated at content level. */}
      <Stack.Screen name="ToolLearn" component={ToolLearnScreen} options={swipe} />
      <Stack.Screen name="ToolDemo" component={Gated.ToolDemo} />
      <Stack.Screen name="ConceptModule" component={ConceptModuleScreen} options={swipe} />
      {/* Phase-2 saved-measurement library + A/B compare (spec §7/§8). */}
      <Stack.Screen name="ToolLibrary" component={MeasurementLibraryScreen} options={swipe} />
      {/* LIVE measurement screens (engine build 2026-07-23) — each gates
          itself honestly via EngineGate when the engine isn't in the build. */}
      <Stack.Screen name="SplMeter" component={Gated.SplMeter} />
      <Stack.Screen name="Rta" component={Gated.Rta} />
      <Stack.Screen name="WaveformLive" component={Gated.Waveform} />
      <Stack.Screen name="SignalGen" component={Gated.SignalGen} />
      <Stack.Screen name="SpectrogramLive" component={Gated.Spectrogram} />
      <Stack.Screen name="Rt60Live" component={Gated.Rt60} />
      {/* Frequency Counter & Tuner tool (2026-07-18; tuner merged 2026-07-23). */}
      <Stack.Screen name="FrequencyCounter" component={Gated.FrequencyCounter} />
      {/* Pro Audio MultiMeter (Mono) — all-in-one live meter (owner 2026-07-29). */}
      <Stack.Screen name="MultiMeter" component={Gated.MultiMeter} />
      {/* Listening Exposure Monitor (owner 2026-08-12) — a POPUP (modal) opened
          from the ToolsHub dosimeter chip and the check-in panel; the ONLY
          places the user interacts with dosimeter readings/settings. UNGATED
          on purpose: hearing-safety info is never behind the orientation or a
          paywall. */}
      <Stack.Screen name="ExposureMonitor" component={ExposureMonitorScreen} options={{ presentation: 'modal' }} />
      {/* Spike-0 dev-only debug (entry rendered only when __DEV__). */}
      <Stack.Screen name="DspDebug" component={DspDebugScreen} />
      {/* Audio Learning Lab (v4 MASTER §13) — the pinned Home card opens the
          EarLab landing menu; HarmonicLab is the one live lab today. Bottom nav
          hidden like the other tool screens. */}
      <Stack.Screen name="AudioLearning" component={AudioLearningScreen} options={swipe} />
      <Stack.Screen name="EarLab" component={EarLabScreen} options={swipe} />
      <Stack.Screen name="LabCategory" component={LabCategoryScreen} options={swipe} />
      <Stack.Screen name="HarmonicLab" component={Gated.HarmonicLab} />
      <Stack.Screen name="OscillatorLab" component={Gated.OscillatorLab} />
      <Stack.Screen name="NoiseLab" component={Gated.NoiseLab} />
      <Stack.Screen name="HarmonographLab" component={Gated.HarmonographLab} />
      {/* The 12 effect labs (native effects path, engineVersion 6). */}
      <Stack.Screen name="EqLab" component={Gated.EqLab} />
      <Stack.Screen name="DelayLab" component={Gated.DelayLab} />
      <Stack.Screen name="ReverbLab" component={Gated.ReverbLab} />
      <Stack.Screen name="ChorusLab" component={Gated.ChorusLab} />
      <Stack.Screen name="FlangerLab" component={Gated.FlangerLab} />
      <Stack.Screen name="PhaserLab" component={Gated.PhaserLab} />
      <Stack.Screen name="CompressionLab" component={Gated.CompressionLab} />
      <Stack.Screen name="GateLab" component={Gated.GateLab} />
      <Stack.Screen name="LimiterLab" component={Gated.LimiterLab} />
      <Stack.Screen name="DistortionLab" component={Gated.DistortionLab} />
      <Stack.Screen name="PhaseLab" component={Gated.PhaseLab} />
      <Stack.Screen name="StereoLab" component={Gated.StereoLab} />
      <Stack.Screen name="SignalChainLab" component={Gated.SignalChainLab} />
      {/* Expansion labs (owner 2026-07-26). */}
      <Stack.Screen name="BassLab" component={Gated.BassLab} />
      <Stack.Screen name="AutotuneLab" component={Gated.AutotuneLab} />
      <Stack.Screen name="FmLab" component={Gated.FmLab} />
      <Stack.Screen name="BinauralLab" component={Gated.BinauralLab} />
      <Stack.Screen name="ModularLab" component={Gated.ModularLab} />
      <Stack.Screen name="MicLab" component={Gated.MicLab} />
      {/* Microphone Selection Lab (owner spec 2026-08-12) — selection &
          characteristics, no audio/engine dependency. */}
      <Stack.Screen name="MicSelectLab" component={Gated.MicSelectLab} />
      <Stack.Screen name="CableLab" component={Gated.CableLab} />
      <Stack.Screen name="CableInstallLab" component={Gated.CableInstallLab} />
      <Stack.Screen name="SpeakerLab" component={Gated.SpeakerLab} />
      <Stack.Screen name="TubeLab" component={Gated.TubeLab} />
      <Stack.Screen name="TubeReference" component={TubeReferenceScreen} options={swipe} />
      <Stack.Screen name="TubeCard" component={TubeCardScreen} options={swipe} />
      <Stack.Screen name="CalcLab" component={CalcLabScreen} />
      <Stack.Screen name="CalcWorkspace" component={CalcWorkspaceScreen} />
      <Stack.Screen name="CalcSymbolsKey" component={CalcSymbolsKeyScreen} />
      <Stack.Screen name="CalcWorkflows" component={CalcWorkflowsScreen} />
      <Stack.Screen name="CalcWorkflowEdit" component={CalcWorkflowEditScreen} />
      <Stack.Screen name="CalcWorkflowRun" component={CalcWorkflowRunScreen} />
      <Stack.Screen name="CalcProjects" component={CalcProjectsScreen} />
      <Stack.Screen name="CalcResults" component={CalcResultsScreen} />
      <Stack.Screen name="DigitalLab" component={DigitalLabHomeScreen} />
      <Stack.Screen name="DigitalModule" component={Gated.DigitalModule} />
      <Stack.Screen name="WaveLab" component={WaveLabHomeScreen} />
      <Stack.Screen name="WaveModule" component={Gated.WaveModule} />
      <Stack.Screen name="EarTrainingLab" component={EarTrainingLabScreen} />
      <Stack.Screen name="EarModule" component={EarModuleScreen} />
      <Stack.Screen name="AmpLab" component={AmpLabHomeScreen} />
      <Stack.Screen name="AmpModule" component={AmpModuleScreen} />
      <Stack.Screen name="TuningLab" component={TuningLabScreen} />
      <Stack.Screen name="EnvelopeLab" component={EnvelopeLabScreen} />
      <Stack.Screen name="SpeechLab" component={SpeechLabScreen} />
      <Stack.Screen name="SmartProcessorsLab" component={SmartProcessorsLabScreen} />
      <Stack.Screen name="DeEsserLab" component={DeEsserLabScreen} />
      <Stack.Screen name="MeterLab" component={MeterLabHomeScreen} />
      <Stack.Screen name="MeterModule" component={Gated.MeterModule} />
      <Stack.Screen name="EqLabHome" component={EqLabHomeScreen} />
      <Stack.Screen name="EqModule" component={Gated.EqModule} />
      <Stack.Screen name="GainLabHome" component={GainLabHomeScreen} />
      <Stack.Screen name="GainModule" component={Gated.GainModule} />
      {/* Understanding Level & Amplitude — the first lab in Audio Fundamentals
          (owner 2026-08-12). UNGATED: it IS the orientation, so it must never
          be wrapped in withAmplitudeOrientation (that would gate it behind
          itself). */}
      <Stack.Screen name="AmplitudeLab" component={AmplitudeLabScreen} options={swipe} />
      {/* Foundations of Sound — the Ear Lab's first module (course + sandbox). */}
      <Stack.Screen name="FoundationsCourse" component={FoundationsCourseScreen} />
      <Stack.Screen name="FoundationsPlayground" component={Gated.FoundationsPlayground} />
      {/* Audio Career Finder (owner brief 2026-09-03). No audio visualizer, so
          NOT behind the amplitude orientation; read-only pages take swipe-back,
          the questions do not (a stray swipe mid-answer is the one gesture
          that would surprise). */}
      <Stack.Screen name="CareerFinder" component={CareerFinderScreen} options={swipe} />
      <Stack.Screen name="CareerFinderQuiz" component={CareerFinderQuizScreen} />
      <Stack.Screen name="CareerFinderResults" component={CareerFinderResultsScreen} options={swipe} />
      <Stack.Screen name="CareerFamily" component={CareerFamilyScreen} options={swipe} />
      <Stack.Screen name="CareerFamilyList" component={CareerFamilyListScreen} options={swipe} />
      <Stack.Screen name="CareerFinderAbout" component={CareerFinderAboutScreen} options={swipe} />
      {/* Anonymous public glossary (commercial browse path). */}
      <Stack.Screen name="PublicGlossary" component={PublicGlossaryScreen} />
      {/* CM7: academy paywall (modal; UI only). */}
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
