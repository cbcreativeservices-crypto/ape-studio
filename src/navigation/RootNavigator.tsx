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
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { ResultsScreen } from '../screens/results/ResultsScreen';
import { TrophyScreen } from '../screens/results/TrophyScreen';
import { CelebrationScreen } from '../screens/results/CelebrationScreen';
import { AwardProgressScreen } from '../screens/awards/AwardProgressScreen';
import { FinalExamScreen } from '../screens/exam/FinalExamScreen';
import { FinalExamResultScreen } from '../screens/exam/FinalExamResultScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { HelpScreen } from '../screens/help/HelpScreen';
import { WeeklyConceptScreen } from '../screens/notifications/WeeklyConceptScreen';
import { InstitutionalScreen } from '../screens/institutional/InstitutionalScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import { AwardsScreen } from '../screens/awards/AwardsScreen';
import { AudioCommunityDirectoryScreen } from '../screens/directory/AudioCommunityDirectoryScreen';
import { EmployerAdminScreen } from '../screens/admin/EmployerAdminScreen';
import { ReportsAdminScreen } from '../screens/admin/ReportsAdminScreen';
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
import { CymaticsHomeScreen } from '../screens/lab/cymatics/CymaticsHomeScreen';
import { ProductionLabScreen } from '../screens/lab/production/ProductionLabScreen';
import { ProductionStageScreen } from '../screens/lab/production/ProductionStageScreen';
import { ProductionActivityScreen } from '../screens/lab/production/ProductionActivityScreen';
import { CymaticsModuleScreen } from '../screens/lab/cymatics/CymaticsModuleScreen';
import { PlateStudioScreen } from '../screens/lab/cymatics/PlateStudioScreen';
import { LiquidStudioScreen } from '../screens/lab/cymatics/LiquidStudioScreen';
import { MembraneStudioScreen } from '../screens/lab/cymatics/MembraneStudioScreen';
import { GalleryScreen } from '../screens/lab/cymatics/GalleryScreen';
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
import { PatchbayLabScreen } from '../screens/lab/patchbay/PatchbayLabScreen';
import { ConnectorSelectLabScreen } from '../screens/lab/connectorselect/ConnectorSelectLabScreen';
import { BeginningMixingLabScreen } from '../screens/lab/mixing/BeginningMixingLabScreen';
import { AdvancedMixingLabScreen } from '../screens/lab/mixing/AdvancedMixingLabScreen';
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
import { withMembershipPreview } from '../features/lab/withMembershipPreview';
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
  CymaticsModule: withAmplitudeOrientation(CymaticsModuleScreen),
  CymaticsPlateStudio: withAmplitudeOrientation(PlateStudioScreen),
  CymaticsLiquidStudio: withAmplitudeOrientation(LiquidStudioScreen),
  CymaticsMembraneStudio: withAmplitudeOrientation(MembraneStudioScreen),
  CymaticsGallery: withAmplitudeOrientation(GalleryScreen),
  ProductionStage: ProductionStageScreen,
  ProductionActivity: ProductionActivityScreen,
  WaveModule: withAmplitudeOrientation(WaveModuleScreen),
  MeterModule: withAmplitudeOrientation(MeterModuleScreen),
  EqModule: withAmplitudeOrientation(EqModuleScreen),
  GainModule: withAmplitudeOrientation(GainModuleScreen),
  FoundationsPlayground: withAmplitudeOrientation(FoundationsPlaygroundScreen),
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
  HarmonographLab: withMembershipPreview(Gated.HarmonographLab),
  HarmonicLab: withMembershipPreview(Gated.HarmonicLab),
  OscillatorLab: withMembershipPreview(Gated.OscillatorLab),
  NoiseLab: withMembershipPreview(Gated.NoiseLab),
  EqLab: withMembershipPreview(Gated.EqLab),
  CompressionLab: withMembershipPreview(Gated.CompressionLab),
  ReverbLab: withMembershipPreview(Gated.ReverbLab),
  DelayLab: withMembershipPreview(Gated.DelayLab),
  MicLab: withMembershipPreview(Gated.MicLab),
  SpeakerLab: withMembershipPreview(Gated.SpeakerLab),
  TubeLab: withMembershipPreview(Gated.TubeLab),
  CableInstallLab: withMembershipPreview(Gated.CableInstallLab),
  DigitalLab: withMembershipPreview(DigitalLabHomeScreen),
  CymaticsLab: withMembershipPreview(CymaticsHomeScreen),
  ProductionLab: withMembershipPreview(ProductionLabScreen),

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
  CymaticsModule: withMembershipPreview(withAmplitudeOrientation(CymaticsModuleScreen)),
  CymaticsPlateStudio: withMembershipPreview(withAmplitudeOrientation(PlateStudioScreen)),
  CymaticsLiquidStudio: withMembershipPreview(withAmplitudeOrientation(LiquidStudioScreen)),
  CymaticsMembraneStudio: withMembershipPreview(withAmplitudeOrientation(MembraneStudioScreen)),
  CymaticsGallery: withMembershipPreview(withAmplitudeOrientation(GalleryScreen)),
  ProductionStage: withMembershipPreview(ProductionStageScreen),
  ProductionActivity: withMembershipPreview(ProductionActivityScreen),

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
  DigitalModule: withMembershipPreview(withAmplitudeOrientation(DigitalModuleScreen)),
  EqModule: withMembershipPreview(withAmplitudeOrientation(EqModuleScreen)),
  GainModule: withMembershipPreview(withAmplitudeOrientation(GainModuleScreen)),
  EarModule: withMembershipPreview(EarModuleScreen),
  AmpModule: withMembershipPreview(AmpModuleScreen),
  TubeReference: withMembershipPreview(TubeReferenceScreen),
  TubeCard: withMembershipPreview(TubeCardScreen),
  DeEsserLab: withMembershipPreview(DeEsserLabScreen),

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
  AdvancedMixingLab: withMembershipPreview(AdvancedMixingLabScreen),
  AmpLab: withMembershipPreview(AmpLabHomeScreen),
  AutotuneLab: withMembershipPreview(Gated.AutotuneLab),
  BassLab: withMembershipPreview(Gated.BassLab),
  BeginningMixingLab: withMembershipPreview(BeginningMixingLabScreen),
  BinauralLab: withMembershipPreview(Gated.BinauralLab),
  CableLab: withMembershipPreview(Gated.CableLab),
  ChorusLab: withMembershipPreview(Gated.ChorusLab),
  ConnectorSelectLab: withMembershipPreview(ConnectorSelectLabScreen),
  DistortionLab: withMembershipPreview(Gated.DistortionLab),
  EarTrainingLab: withMembershipPreview(EarTrainingLabScreen),
  EnvelopeLab: withMembershipPreview(EnvelopeLabScreen),
  EqLabHome: withMembershipPreview(EqLabHomeScreen),
  FlangerLab: withMembershipPreview(Gated.FlangerLab),
  FmLab: withMembershipPreview(Gated.FmLab),
  FoundationsPlayground: withMembershipPreview(Gated.FoundationsPlayground),
  GainLabHome: withMembershipPreview(GainLabHomeScreen),
  GateLab: withMembershipPreview(Gated.GateLab),
  LimiterLab: withMembershipPreview(Gated.LimiterLab),
  MeterLab: withMembershipPreview(MeterLabHomeScreen),
  MeterModule: withMembershipPreview(Gated.MeterModule),
  MicSelectLab: withMembershipPreview(Gated.MicSelectLab),
  ModularLab: withMembershipPreview(Gated.ModularLab),
  PatchbayLab: withMembershipPreview(PatchbayLabScreen),
  PhaseLab: withMembershipPreview(Gated.PhaseLab),
  PhaserLab: withMembershipPreview(Gated.PhaserLab),
  SignalChainLab: withMembershipPreview(Gated.SignalChainLab),
  SmartProcessorsLab: withMembershipPreview(SmartProcessorsLabScreen),
  SpeechLab: withMembershipPreview(SpeechLabScreen),
  StereoLab: withMembershipPreview(Gated.StereoLab),
  TuningLab: withMembershipPreview(TuningLabScreen),
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
      <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Trophy" component={TrophyScreen} options={{ gestureEnabled: false }} />
      {/* Celebrations replace the quiz-win trophy (owner 2026-09-17). Back is
          disabled for the same reason Trophy disables it: the attempt behind
          this screen is finished and returning to it is meaningless. */}
      <Stack.Screen name="Celebration" component={CelebrationScreen} options={{ gestureEnabled: false }} />
      {/* Final Exam (R6b capstone) — one sitting, no back gesture, no pause. */}
      <Stack.Screen name="AwardProgress" component={AwardProgressScreen} options={swipe} />
      <Stack.Screen name="FinalExam" component={FinalExamScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="FinalExamResult" component={FinalExamResultScreen} options={{ gestureEnabled: false }} />
      {/* S11 — modal, bottom nav hidden, exits via ✕ */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WeeklyConcept" component={WeeklyConceptScreen} options={{ presentation: 'modal' }} />
      {/* Institutional Mode parked container (user request 2026-07-17). */}
      <Stack.Screen name="Institutional" component={InstitutionalScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'modal' }} />
      {/* Awards (Booth 2026-07-15) — Certificates/Diplomas/Hall of Fame, bottom
          nav hidden. An AREA-level destination (Dashboard ⇄ Certificates) → fade. */}
      <Stack.Screen name="Awards" component={AwardsScreen} options={NAV_FADE} />
      {/* "Get Discovered" registry info is no longer a standalone route — it
          lives as the DirectoryView page inside the Awards pager. The old
          `Directory` modal route was unreachable and was removed 2026-09-10. */}
      {/* Audio Community Directory (spec 2026-08-31 §5). Full screen rather than
          a modal: it has three destinations of its own and a member sheet on
          top, and a modal-in-modal is the black-screen trap this codebase has
          hit before. */}
      <Stack.Screen name="AudioCommunityDirectory" component={AudioCommunityDirectoryScreen} />
      <Stack.Screen name="EmployerAdmin" component={EmployerAdminScreen} />
      <Stack.Screen name="ReportsAdmin" component={ReportsAdminScreen} />
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
      <Stack.Screen name="HarmonicLab" component={MemberGated.HarmonicLab} />
      <Stack.Screen name="OscillatorLab" component={MemberGated.OscillatorLab} />
      <Stack.Screen name="NoiseLab" component={MemberGated.NoiseLab} />
      <Stack.Screen name="HarmonographLab" component={MemberGated.HarmonographLab} />
      {/* The 12 effect labs (native effects path, engineVersion 6). */}
      <Stack.Screen name="EqLab" component={MemberGated.EqLab} />
      <Stack.Screen name="DelayLab" component={MemberGated.DelayLab} />
      <Stack.Screen name="ReverbLab" component={MemberGated.ReverbLab} />
      <Stack.Screen name="ChorusLab" component={MemberGated.ChorusLab} />
      <Stack.Screen name="FlangerLab" component={MemberGated.FlangerLab} />
      <Stack.Screen name="PhaserLab" component={MemberGated.PhaserLab} />
      <Stack.Screen name="CompressionLab" component={MemberGated.CompressionLab} />
      <Stack.Screen name="GateLab" component={MemberGated.GateLab} />
      <Stack.Screen name="LimiterLab" component={MemberGated.LimiterLab} />
      <Stack.Screen name="DistortionLab" component={MemberGated.DistortionLab} />
      <Stack.Screen name="PhaseLab" component={MemberGated.PhaseLab} />
      <Stack.Screen name="StereoLab" component={MemberGated.StereoLab} />
      <Stack.Screen name="SignalChainLab" component={MemberGated.SignalChainLab} />
      {/* Expansion labs (owner 2026-07-26). */}
      <Stack.Screen name="BassLab" component={MemberGated.BassLab} />
      <Stack.Screen name="AutotuneLab" component={MemberGated.AutotuneLab} />
      <Stack.Screen name="FmLab" component={MemberGated.FmLab} />
      <Stack.Screen name="BinauralLab" component={MemberGated.BinauralLab} />
      <Stack.Screen name="ModularLab" component={MemberGated.ModularLab} />
      <Stack.Screen name="MicLab" component={MemberGated.MicLab} />
      {/* Microphone Selection Lab (owner spec 2026-08-12) — selection &
          characteristics, no audio/engine dependency. */}
      <Stack.Screen name="MicSelectLab" component={MemberGated.MicSelectLab} />
      <Stack.Screen name="CableLab" component={MemberGated.CableLab} />
      <Stack.Screen name="CableInstallLab" component={MemberGated.CableInstallLab} />
      <Stack.Screen name="SpeakerLab" component={MemberGated.SpeakerLab} />
      <Stack.Screen name="TubeLab" component={MemberGated.TubeLab} />
      <Stack.Screen name="TubeReference" component={MemberGated.TubeReference} options={swipe} />
      <Stack.Screen name="TubeCard" component={MemberGated.TubeCard} options={swipe} />
      <Stack.Screen name="CalcLab" component={CalcLabScreen} />
      <Stack.Screen name="CalcWorkspace" component={CalcWorkspaceScreen} />
      <Stack.Screen name="CalcSymbolsKey" component={CalcSymbolsKeyScreen} />
      <Stack.Screen name="CalcWorkflows" component={CalcWorkflowsScreen} />
      <Stack.Screen name="CalcWorkflowEdit" component={CalcWorkflowEditScreen} />
      <Stack.Screen name="CalcWorkflowRun" component={CalcWorkflowRunScreen} />
      <Stack.Screen name="CalcProjects" component={CalcProjectsScreen} />
      <Stack.Screen name="CalcResults" component={CalcResultsScreen} />
      <Stack.Screen name="DigitalLab" component={MemberGated.DigitalLab} />
      <Stack.Screen name="DigitalModule" component={MemberGated.DigitalModule} />
      <Stack.Screen name="CymaticsLab" component={MemberGated.CymaticsLab} />
      {/* Both production labs share one screen; the route just fixes the param.
          Named entries exist so each lab can be linked to on its own. */}
      <Stack.Screen
        name="PreProdLab"
        component={MemberGated.ProductionLab}
        initialParams={{ lab: 'preprod' }}
      />
      <Stack.Screen
        name="PostProdLab"
        component={MemberGated.ProductionLab}
        initialParams={{ lab: 'postprod' }}
      />
      <Stack.Screen name="ProductionLab" component={MemberGated.ProductionLab} />
      <Stack.Screen name="ProductionStage" component={MemberGated.ProductionStage} />
      <Stack.Screen name="ProductionActivity" component={MemberGated.ProductionActivity} />
      <Stack.Screen name="CymaticsModule" component={MemberGated.CymaticsModule} />
      <Stack.Screen name="CymaticsPlateStudio" component={MemberGated.CymaticsPlateStudio} />
      <Stack.Screen name="CymaticsLiquidStudio" component={MemberGated.CymaticsLiquidStudio} />
      <Stack.Screen name="CymaticsMembraneStudio" component={MemberGated.CymaticsMembraneStudio} />
      <Stack.Screen name="CymaticsGallery" component={MemberGated.CymaticsGallery} />
      <Stack.Screen name="WaveLab" component={WaveLabHomeScreen} />
      <Stack.Screen name="WaveModule" component={Gated.WaveModule} />
      <Stack.Screen name="EarTrainingLab" component={MemberGated.EarTrainingLab} />
      <Stack.Screen name="EarModule" component={MemberGated.EarModule} />
      <Stack.Screen name="AmpLab" component={MemberGated.AmpLab} />
      <Stack.Screen name="AmpModule" component={MemberGated.AmpModule} />
      <Stack.Screen name="TuningLab" component={MemberGated.TuningLab} />
      <Stack.Screen name="EnvelopeLab" component={MemberGated.EnvelopeLab} />
      <Stack.Screen name="PatchbayLab" component={MemberGated.PatchbayLab} />
      <Stack.Screen name="ConnectorSelectLab" component={MemberGated.ConnectorSelectLab} />
      <Stack.Screen name="BeginningMixingLab" component={MemberGated.BeginningMixingLab} />
      <Stack.Screen name="AdvancedMixingLab" component={MemberGated.AdvancedMixingLab} />
      <Stack.Screen name="SpeechLab" component={MemberGated.SpeechLab} />
      <Stack.Screen name="SmartProcessorsLab" component={MemberGated.SmartProcessorsLab} />
      <Stack.Screen name="DeEsserLab" component={MemberGated.DeEsserLab} />
      <Stack.Screen name="MeterLab" component={MemberGated.MeterLab} />
      <Stack.Screen name="MeterModule" component={MemberGated.MeterModule} />
      <Stack.Screen name="EqLabHome" component={MemberGated.EqLabHome} />
      <Stack.Screen name="EqModule" component={MemberGated.EqModule} />
      <Stack.Screen name="GainLabHome" component={MemberGated.GainLabHome} />
      <Stack.Screen name="GainModule" component={MemberGated.GainModule} />
      {/* Understanding Level & Amplitude — the first lab in Audio Fundamentals
          (owner 2026-08-12). UNGATED: it IS the orientation, so it must never
          be wrapped in withAmplitudeOrientation (that would gate it behind
          itself). */}
      <Stack.Screen name="AmplitudeLab" component={AmplitudeLabScreen} options={swipe} />
      {/* Foundations of Sound — the Ear Lab's first module (course + sandbox). */}
      <Stack.Screen name="FoundationsCourse" component={FoundationsCourseScreen} />
      <Stack.Screen name="FoundationsPlayground" component={MemberGated.FoundationsPlayground} />
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
