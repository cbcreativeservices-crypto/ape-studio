/**
 * Browser preview harness — DEV + WEB ONLY (moved out of App.tsx 2026-10-04,
 * perf decision B).
 *
 * Every `#…preview` hash (`#labpreview/<Screen>/<id>`, `#rtapreview`,
 * `#careerfinderpreview`, …) renders one screen in a minimal navigator so it
 * can be seen and measured in the browser. These used to be ~80 static imports
 * at the top of App.tsx, so every lab and tool screen was evaluated before the
 * first frame on EVERY platform, release builds included, only to serve a
 * harness that runs on web in development. App.tsx now `require`s this module
 * inside its `__DEV__ && Platform.OS === 'web'` branch, so a phone never
 * evaluates it. The hashes, names and screens are unchanged.
 */
import type { ComponentType, ReactElement } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Spl3dGaugePreview } from '../screens/tools/Spl3dGaugePreview';
import { PatchbayPreview } from '../screens/lab/patchbay/PatchbayPreview';
import { BeginningMixingLabScreen } from '../screens/lab/mixing/BeginningMixingLabScreen';
import { AdvancedMixingLabScreen } from '../screens/lab/mixing/AdvancedMixingLabScreen';
import { ConnectorSelectLabScreen } from '../screens/lab/connectorselect/ConnectorSelectLabScreen';
import { ToolPreview } from '../screens/tools/ToolPreview';
import { MicPrinciplesLabScreen } from '../screens/lab/micspeaker/MicPrinciplesLabScreen';
import { SpeakerCoverageLabScreen } from '../screens/lab/micspeaker/SpeakerCoverageLabScreen';
import { VacuumTubeLabScreen } from '../screens/lab/tube/VacuumTubeLabScreen';
// The two window-width-driven screens (2026-09-13). Both size their carousel
// from the live window, and NEITHER had a harness of any kind - so the iPad
// layout of the FIRST screen a store reviewer sees could not be looked at.
// ToolPreview renders full-bleed at the viewport width, so `resize_window` on
// the browser is what actually exercises the width path (see previewWidth.ts).
import { CourseSelectionScreen } from '../screens/courses/CourseSelectionScreen';
import { AwardsScreen } from '../screens/awards/AwardsScreen';
import { MultiMeterScreen } from '../screens/tools/MultiMeterScreen';
import { FrequencyCounterScreen } from '../screens/tools/FrequencyCounterScreen';
import { WaveformScreen } from '../screens/tools/WaveformScreen';
import { RtaScreen } from '../screens/tools/RtaScreen';
import { SpectrogramScreen } from '../screens/tools/SpectrogramScreen';
import { ToolsHubScreen } from '../screens/tools/ToolsHubScreen';
import { ToolDemoPreview } from '../screens/tools/ToolDemoPreview';
import { CalcWorkspaceScreen } from '../screens/lab/calc/CalcWorkspaceScreen';
import { EqModuleScreen } from '../screens/lab/eq/EqModuleScreen';
import { CompressionLabScreen, GateLabScreen, StereoLabScreen } from '../screens/lab/fxLabConfigs';
import { GrLadderPreview } from '../screens/lab/GrLadderPreview';
import { CalcLabScreen } from '../screens/lab/calc/CalcLabScreen';
import { CableInstallLabScreen } from '../screens/lab/cableinstall/CableInstallLabScreen';
import { CableArtPreview } from '../screens/lab/cableinstall/CableArtPreview';
// Audio Career Finder (owner brief 2026-09-03) — `#careerfinderpreview` runs
// the whole six-screen flow in the browser harness.
import { CareerFinderScreen } from '../screens/careerfinder/CareerFinderScreen';
import { CareerFinderQuizScreen } from '../screens/careerfinder/CareerFinderQuizScreen';
import { CareerFinderResultsScreen } from '../screens/careerfinder/CareerFinderResultsScreen';
import { CareerFamilyScreen } from '../screens/careerfinder/CareerFamilyScreen';
import { CareerFamilyListScreen } from '../screens/careerfinder/CareerFamilyListScreen';
import { CareerFinderAboutScreen } from '../screens/careerfinder/CareerFinderAboutScreen';
// Sound Systems Lab (2026-09-25) — `#soundsystemspreview` walks the hub and
// all five modes in the browser harness.
import { SoundSystemsLabScreen } from '../screens/lab/soundsystems/SoundSystemsLabScreen';
import { StartHereScreen } from '../screens/startHere/StartHereScreen';
import { StartHereTermsScreen } from '../screens/startHere/StartHereTermsScreen';
import { PlateStudioScreen } from '../screens/lab/cymatics/PlateStudioScreen';
import { TuningLabScreen } from '../screens/lab/tuning/TuningLabScreen';
import { DigitalModuleScreen } from '../screens/lab/digital/DigitalModuleScreen';
import { GainModuleScreen } from '../screens/lab/gain/GainModuleScreen';
import { CymaticsModuleScreen } from '../screens/lab/cymatics/CymaticsModuleScreen';
import { LiquidStudioScreen } from '../screens/lab/cymatics/LiquidStudioScreen';
import { MembraneStudioScreen } from '../screens/lab/cymatics/MembraneStudioScreen';
import { GalleryScreen as CymaticsGalleryScreen } from '../screens/lab/cymatics/GalleryScreen';
// `#labpreview/<Screen>/<id>` (2026-09-25 legibility pass): any lab screen in
// the browser harness by name, so a display can be measured without walking
// Home → OPEN LABS (the app root sometimes rendered blank in the preview).
import { DeEsserLabScreen } from '../screens/lab/deesser/DeEsserLabScreen';
import { SpeechLabScreen } from '../screens/lab/speech/SpeechLabScreen';
import { PatchbayLabScreen } from '../screens/lab/patchbay/PatchbayLabScreen';
import { EarTrainingLabScreen } from '../screens/lab/eartraining/EarTrainingLabScreen';
import { EarModuleScreen } from '../screens/lab/eartraining/EarModuleScreen';
import { WaveLabHomeScreen } from '../screens/lab/wave/WaveLabHomeScreen';
import { WaveModuleScreen } from '../screens/lab/wave/WaveModuleScreen';
import { MeterLabHomeScreen } from '../screens/lab/meter/MeterLabHomeScreen';
import { MeterModuleScreen } from '../screens/lab/meter/MeterModuleScreen';
import { FoundationsCourseScreen } from '../screens/lab/foundations/FoundationsCourseScreen';
import { FoundationsPlaygroundScreen } from '../screens/lab/foundations/FoundationsPlaygroundScreen';
import { AmpLabHomeScreen } from '../screens/lab/amp/AmpLabHomeScreen';
import { AmpModuleScreen } from '../screens/lab/amp/AmpModuleScreen';
import { OscillatorLabScreen } from '../screens/lab/OscillatorLabScreen';
// Full-screen build, group 2 (2026-09-30): the seven single-page rack labs.
import { NoiseLabScreen } from '../screens/lab/NoiseLabScreen';
import { HarmonicLabScreen } from '../screens/lab/HarmonicLabScreen';
import { FmLabScreen } from '../screens/lab/FmLabScreen';
import { ModularLabScreen } from '../screens/lab/ModularLabScreen';
import { BinauralLabScreen } from '../screens/lab/BinauralLabScreen';
import { AutotuneLabScreen } from '../screens/lab/AutotuneLabScreen';
import { HarmonographLabScreen } from '../screens/lab/HarmonographLabScreen';
import { EnvelopeLabScreen } from '../screens/lab/envelope/EnvelopeLabScreen';
import { BassLabScreen } from '../screens/lab/BassLabScreen';
import { EqLabScreen } from '../screens/lab/fxLabConfigs';
// Lab navigation migration WP5 (2026-10-01): the two stepped cable / mic
// labs by name, so the shared strip can be walked in the browser harness.
import { CableLabScreen } from '../screens/lab/cable/CableLabScreen';
import { MicSelectLabScreen } from '../screens/lab/micselect/MicSelectLabScreen';
// Mastering Lab (2026-10-01): `#labpreview/MasteringLab` walks all eight modules.
import { MasteringLabScreen } from '../screens/lab/mastering/MasteringLabScreen';
// Drum Tuning Lab (2026-10-01): `#labpreview/DrumTuningLab` walks all seven chapters.
import { DrumTuningLabScreen } from '../screens/lab/drumtuning/DrumTuningLabScreen';
// Miking Labs (2026-10-04): `#labpreview/MikingHub`, `#labpreview/MikingLesson/M01`
// (add `?page=placement` before the hash to open a page).
import { MikingHubScreen } from '../screens/lab/miking/MikingHubScreen';
// The Labs menu itself (`#labpreview/EarLab`), so a Miking family tile can be
// tapped through to its lesson menu (2026-10-06).
import { EarLabScreen } from '../screens/lab/EarLabScreen';
import { MikingLessonScreen } from '../screens/lab/miking/MikingLessonScreen';
// Mixing Guides (2026-10-07): `#labpreview/MixingGuides`, `#labpreview/MixingGuide/pop`.
import { MixingGuidesHubScreen } from '../screens/lab/mixingGuides/MixingGuidesHubScreen';
import { MixingGuideScreen } from '../screens/lab/mixingGuides/MixingGuideScreen';
// Room Design & Monitoring Lab (2026-10-01): SVG plan + side views, so the
// whole lab measures in the browser harness (`#labpreview/RoomDesignLab`).
import { RoomDesignLabScreen } from '../screens/lab/roomdesign/RoomDesignLabScreen';
import {
  SoundSystemsBuildScreen,
  SoundSystemsLearnScreen,
  SoundSystemsOperateScreen,
  SoundSystemsRouteScreen,
  SoundSystemsTroubleshootScreen,
} from '../screens/lab/soundsystems/modeScreens';
import { NotifySchedulePreview } from '../features/settings/NotifySchedulePreview';
import { SettingsPreview } from '../screens/settings/SettingsPreview';
import { HelpPreview } from '../screens/help/HelpPreview';
import { SamplerPreview } from '../features/intro/SamplerPreview';
import { ProfilePreview } from '../screens/profile/ProfilePreview';
import { CenterLockTuner } from '../screens/tools/CenterLockTuner';
import { AuthScreen } from '../screens/auth/AuthScreen';
// Onboarding landing page (owner spec 2026-10-09): `#labpreview/OnboardingLanding`.
import { OnboardingLandingScreen } from '../screens/onboarding/OnboardingLandingScreen';

const LAB_PREVIEW_SCREENS: Record<string, ComponentType> = {
  OnboardingLanding: OnboardingLandingScreen as ComponentType,
  RoomDesignLab: RoomDesignLabScreen as ComponentType,
  DeEsserLab: DeEsserLabScreen as ComponentType,
  SpeechLab: SpeechLabScreen as ComponentType,
  // Full-screen pass group 6 (2026-09-30): the patchbay, the connectors
  // lab and the ear-training trial shell, by name.
  PatchbayLab: PatchbayLabScreen as ComponentType,
  ConnectorSelectLab: ConnectorSelectLabScreen as ComponentType,
  EarTrainingLab: EarTrainingLabScreen as ComponentType,
  EarModule: EarModuleScreen as ComponentType,
  WaveLab: WaveLabHomeScreen as ComponentType,
  WaveModule: WaveModuleScreen as ComponentType,
  MeterLab: MeterLabHomeScreen as ComponentType,
  MeterModule: MeterModuleScreen as ComponentType,
  FoundationsCourse: FoundationsCourseScreen as ComponentType,
  FoundationsPlayground: FoundationsPlaygroundScreen as ComponentType,
  AmpLab: AmpLabHomeScreen as ComponentType,
  AmpModule: AmpModuleScreen as ComponentType,
  OscillatorLab: OscillatorLabScreen as ComponentType,
  NoiseLab: NoiseLabScreen as ComponentType,
  HarmonicLab: HarmonicLabScreen as ComponentType,
  FmLab: FmLabScreen as ComponentType,
  ModularLab: ModularLabScreen as ComponentType,
  BinauralLab: BinauralLabScreen as ComponentType,
  AutotuneLab: AutotuneLabScreen as ComponentType,
  HarmonographLab: HarmonographLabScreen as ComponentType,
  EnvelopeLab: EnvelopeLabScreen as ComponentType,
  BassLab: BassLabScreen as ComponentType,
  EqLab: EqLabScreen as ComponentType,
  EqModule: EqModuleScreen as ComponentType,
  MicPrinciples: MicPrinciplesLabScreen as ComponentType,
  // Full-screen build group 4 (2026-09-30): the coverage maps and the tube lab, by name.
  SpeakerCoverage: SpeakerCoverageLabScreen as ComponentType,
  VacuumTube: VacuumTubeLabScreen as ComponentType,
  CableInstallLab: CableInstallLabScreen as ComponentType,
  CableLab: CableLabScreen as ComponentType,
  MicSelect: MicSelectLabScreen as ComponentType,
  SoundSystemsLab: SoundSystemsLabScreen as ComponentType,
  CenterLockTuner: CenterLockTuner as ComponentType,
  AuthScreen: AuthScreen as ComponentType,
  // The two live tools with the 2026-09-29 full screen (member-gated routes).
  RtaScreen: RtaScreen as ComponentType,
  SpectrogramScreen: SpectrogramScreen as ComponentType,
  SoundSystemsLearn: SoundSystemsLearnScreen as ComponentType,
  SoundSystemsBuild: SoundSystemsBuildScreen as ComponentType,
  SoundSystemsRoute: SoundSystemsRouteScreen as ComponentType,
  SoundSystemsOperate: SoundSystemsOperateScreen as ComponentType,
  SoundSystemsTroubleshoot: SoundSystemsTroubleshootScreen as ComponentType,
  CompressionLab: CompressionLabScreen as ComponentType,
  GateLab: GateLabScreen as ComponentType,
  StereoLab: StereoLabScreen as ComponentType,
  // Start Here (2026-09-29): the free beginner experience + its words.
  StartHere: StartHereScreen as ComponentType,
  StartHereTerms: StartHereTermsScreen as ComponentType,
  // Cymatics Chladni plate (TestFlight build 32 fix pass): the dock and the
  // bezel can be measured here; the plate itself needs Skia (native only).
  CymaticsPlateStudio: PlateStudioScreen as ComponentType,
  // Tuning & Temperament (TestFlight build 32 rack rebuild, 2026-09-30).
  TuningLab: TuningLabScreen as ComponentType,
  // The rest of the Cymatics Lab (full-screen pass 2026-09-30): the rack
  // modules by id (CymaticsModule/nodes|change|harmony|systems), the Liquid
  // and Membrane studios and the Gallery art board. The Skia studios show
  // their dock and bezel here; the drawing itself is native-only.
  CymaticsModule: CymaticsModuleScreen as ComponentType,
  CymaticsLiquidStudio: LiquidStudioScreen as ComponentType,
  CymaticsMembraneStudio: MembraneStudioScreen as ComponentType,
  CymaticsGallery: CymaticsGalleryScreen as ComponentType,
  // Full-screen build, group 3 (2026-09-30): Digital Audio + Gain Staging
  // module pages (`/<id>`). The Digital Skia scenes need CanvasKit (native
  // only); the rack chrome and the Gain chain columns measure here.
  DigitalModule: DigitalModuleScreen as ComponentType,
  GainModule: GainModuleScreen as ComponentType,
  MasteringLab: MasteringLabScreen as ComponentType,
  DrumTuningLab: DrumTuningLabScreen as ComponentType,
  MikingHub: MikingHubScreen as ComponentType,
  EarLab: EarLabScreen as ComponentType,
  MikingLesson: MikingLessonScreen as ComponentType,
  MixingGuides: MixingGuidesHubScreen as ComponentType,
  MixingGuide: MixingGuideScreen as ComponentType,
};
/** `#labpreview/<Screen>/<id>` → a ToolPreview of that lab, every other lab
 *  screen registered as a sibling so in-lab navigation (a home → a module)
 *  works. `<id>` becomes `{ id }` for module screens. */
function labPreviewFromHash(hash: string): { name: string; component: ComponentType; initialParams?: Record<string, unknown>; screens: { name: string; component: ComponentType }[] } | null {
  if (!hash.startsWith('#labpreview/')) return null;
  const [name, id] = hash.slice('#labpreview/'.length).split('/');
  const component = LAB_PREVIEW_SCREENS[name];
  if (!component) return null;
  return {
    name,
    component,
    initialParams: id ? { id } : undefined,
    screens: Object.entries(LAB_PREVIEW_SCREENS)
      .filter(([n]) => n !== name)
      .map(([n, c]) => ({ name: n, component: c })),
  };
}

/** The preview for this location hash, or null when the hash names none. */
export function renderWebPreview(hash: string): ReactElement | null {
  // DEV + WEB ONLY: `localhost:8090/#gaugepreview` renders the standalone 3D-gauge
  // layout harness (all three modes, demo data) so Claude can see + iterate the
  // gauge in the browser — the real gauge only draws while the native engine
  // runs, which never happens on web. Inert on device and in release builds.
  if (hash === '#gaugepreview') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Spl3dGaugePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `localhost:8090/#patchbaypreview` — the Patchbay lab's core
  // visual gallery (all configurations, interactive jacks) for browser design
  // iteration. SVG + RN Animated only, so the web render is faithful.
  if (hash.startsWith('#patchbaypreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <PatchbayPreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `localhost:8090/#notifyschedulepreview` renders the
  // notification schedule modal (all three modes, at phone widths). It lives
  // behind login inside Settings, so without this it cannot be seen in the
  // browser — which is how a stepper layout overflow shipped unnoticed.
  // startsWith, not equality: the harness takes `/mode/width` suffixes.
  if (hash.startsWith('#notifyschedulepreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NotifySchedulePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#profilepreview/<width>` — Profile is behind login too.
  if (hash.startsWith('#profilepreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ProfilePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#helppreview/<width>` — the Help hub is gated behind
  // HELP_HUB_ENABLED until its copy is ratified; review it here meanwhile.
  if (hash.startsWith('#helppreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <HelpPreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#settingspreview/<width>` — the Settings screen is behind
  // login, so this is the only way to review its layout in the browser.
  if (hash.startsWith('#settingspreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SettingsPreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#samplerpreview/<width>` — the first-run sampler screen
  // (plan §2.1) only runs on a brand-new first launch, so this is the only way
  // to review it in the browser. SamplerPreview brings its own SafeAreaProvider.
  // DEV harness for the GR ladder's FILL — the web preview has no audio engine,
  // so every ladder in the real labs renders honestly dark and the one thing
  // worth checking cannot be seen on the surface we can drive (2026-09-11).
  if (hash.startsWith('#grladderpreview')) {
    return (
      <>
        <StatusBar style="light" />
        <GrLadderPreview />
      </>
    );
  }

  if (hash.startsWith('#samplerpreview')) {
    return (
      <>
        <StatusBar style="light" />
        <SamplerPreview />
      </>
    );
  }

  // DEV + WEB ONLY: `localhost:8090/#<tool>preview` renders a real (Skia-free
  // SVG) tool screen in a minimal navigator with the ape-dsp SIM overlay, so the
  // tool can be seen + iterated in the browser. Outside RootNavigator, so it
  // skips AmplitudeOrientation's web-Skia throw.
  const toolPreview: { name: string; component: ComponentType; initialParams?: Record<string, unknown>; screens?: { name: string; component: ComponentType }[] } | null =
    hash === '#careerfinderpreview'
        ? {
            name: 'CareerFinder',
            component: CareerFinderScreen as ComponentType,
            screens: [
              { name: 'CareerFinderQuiz', component: CareerFinderQuizScreen as ComponentType },
              { name: 'CareerFinderResults', component: CareerFinderResultsScreen as ComponentType },
              { name: 'CareerFamily', component: CareerFamilyScreen as ComponentType },
              { name: 'CareerFamilyList', component: CareerFamilyListScreen as ComponentType },
              { name: 'CareerFinderAbout', component: CareerFinderAboutScreen as ComponentType },
            ],
          }
      : hash === '#soundsystemspreview'
        // Sound Systems Lab (owner GO 2026-09-25): the hub plus its five mode
        // screens, so the whole lab can be walked in the browser harness.
        ? {
            name: 'SoundSystemsLab',
            component: SoundSystemsLabScreen as ComponentType,
            screens: [
              { name: 'SoundSystemsLearn', component: SoundSystemsLearnScreen as ComponentType },
              { name: 'SoundSystemsBuild', component: SoundSystemsBuildScreen as ComponentType },
              { name: 'SoundSystemsRoute', component: SoundSystemsRouteScreen as ComponentType },
              { name: 'SoundSystemsOperate', component: SoundSystemsOperateScreen as ComponentType },
              { name: 'SoundSystemsTroubleshoot', component: SoundSystemsTroubleshootScreen as ComponentType },
            ],
          }
      : hash === '#multimeterpreview'
        ? { name: 'MultiMeter', component: MultiMeterScreen as ComponentType }
        : hash === '#hzcounterpreview'
          ? { name: 'FrequencyCounter', component: FrequencyCounterScreen as ComponentType }
        : hash === '#mixinglabpreview'
          ? { name: 'BeginningMixingLab', component: BeginningMixingLabScreen as ComponentType }
        : hash === '#advmixingpreview'
          ? { name: 'AdvancedMixingLab', component: AdvancedMixingLabScreen as ComponentType }
        : hash === '#connectorselectpreview'
          ? { name: 'ConnectorSelectLab', component: ConnectorSelectLabScreen as ComponentType }
        : hash === '#waveformpreview'
          ? { name: 'WaveformLive', component: WaveformScreen as ComponentType }
          : hash === '#rtapreview'
            ? { name: 'Rta', component: RtaScreen as ComponentType }
            : hash === '#toolshubpreview'
              ? { name: 'ToolsHub', component: ToolsHubScreen as ComponentType }
              : hash === '#calcworkspacepreview'
                ? { name: 'CalcWorkspace', component: CalcWorkspaceScreen as ComponentType, initialParams: { id: 'wave' } }
              : hash === '#stereolabpreview'
                // WIDTH is one of only two effect faders with an honest home
                // (100% = the image as recorded) — the double-tap harness.
                ? { name: 'StereoLab', component: StereoLabScreen as ComponentType }
              : hash === '#gatelabpreview'
                ? { name: 'GateLab', component: GateLabScreen as ComponentType }
              : hash === '#complabpreview'
                // The compressor — a dynamics lab, for the GR-meter pass
                // (2026-09-11). Gate/limiter share the same screen + config
                // shape, so this one exercises all three.
                ? { name: 'CompressionLab', component: CompressionLabScreen as ComponentType }
              : hash === '#eqmodulepreview'
                // A RackUnit lab with a bound ParamLane — the gear design pass's
                // browser harness for the dock fader (2026-09-11).
                ? { name: 'EqModule', component: EqModuleScreen as ComponentType, initialParams: { id: 'parametric' } }
                : hash === '#calclabpreview'
                  ? { name: 'CalcLab', component: CalcLabScreen as ComponentType }
                  : hash === '#cableinstallpreview'
                    ? { name: 'CableInstallLab', component: CableInstallLabScreen as ComponentType }
                    : hash === '#cableartpreview'
                      ? { name: 'CableArt', component: CableArtPreview as ComponentType }
                      : hash === '#micprinciplespreview'
                        ? { name: 'MicPrinciples', component: MicPrinciplesLabScreen as ComponentType }
                      : hash.startsWith('#tooldemopreview')
                        // The member-only tool DEMOS, ungated (the gate lives in
                        // ToolDemoScreen, not the components) — design pass 2026-09-13.
                        ? { name: 'ToolDemoPreview', component: ToolDemoPreview as ComponentType }
                      : hash === '#homepreview'
                        // The Home deck - proportional card width against a FIXED
                        // card height, which is how it rendered LANDSCAPE cards at
                        // iPad width. Resize the browser to see it.
                        ? { name: 'CourseSelection', component: CourseSelectionScreen as ComponentType }
                      : hash === '#awardspreview'
                        // The Awards pager - page width, getItemLayout and the
                        // settle-index maths all read the window width.
                        ? {
                            name: 'Awards',
                            component: AwardsScreen as ComponentType,
                            initialParams: { category: 'specialization' },
                          }
                        : labPreviewFromHash(hash);
  if (toolPreview) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ToolPreview name={toolPreview.name} component={toolPreview.component} initialParams={toolPreview.initialParams} screens={toolPreview.screens} />
      </SafeAreaProvider>
    );
  }
  return null;
}
