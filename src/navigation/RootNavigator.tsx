/**
 * RootNavigator — native stack. Flow (seed brief §2):
 *   Splash (0) → [session? Main : Auth]
 *   Auth (S1) → Main
 * Bottom nav lives inside Main (MainTabs). Results (S7) + the trophy loop
 * (S5/S8) live HERE so the bottom nav is hidden on them (locked spec);
 * Settings (S11) joins in M7.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { ResultsScreen } from '../screens/results/ResultsScreen';
import { TrophyScreen } from '../screens/results/TrophyScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { InstitutionalScreen } from '../screens/institutional/InstitutionalScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import { AwardsScreen } from '../screens/awards/AwardsScreen';
import { DirectoryScreen } from '../screens/directory/DirectoryScreen';
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
import { DspDebugScreen } from '../screens/tools/DspDebugScreen';
import { EarLabScreen } from '../screens/lab/EarLabScreen';
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
import { CalcLabScreen } from '../screens/lab/calc/CalcLabScreen';
import { CalcWorkspaceScreen } from '../screens/lab/calc/CalcWorkspaceScreen';
import { DigitalLabHomeScreen } from '../screens/lab/digital/DigitalLabHomeScreen';
import { DigitalModuleScreen } from '../screens/lab/digital/DigitalModuleScreen';
import { FoundationsCourseScreen } from '../screens/lab/foundations/FoundationsCourseScreen';
import { FoundationsPlaygroundScreen } from '../screens/lab/foundations/FoundationsPlaygroundScreen';
import { LandingScreen } from '../screens/landing/LandingScreen';
import { PublicGlossaryScreen } from '../screens/landing/PublicGlossaryScreen';
import { PaywallScreen } from '../screens/commercial/PaywallScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      {/* Reward loop — exits are explicit buttons/auto-advance, never a back gesture. */}
      <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Trophy" component={TrophyScreen} options={{ gestureEnabled: false }} />
      {/* S11 — modal, bottom nav hidden, exits via ✕ */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      {/* Institutional Mode parked container (user request 2026-07-17). */}
      <Stack.Screen name="Institutional" component={InstitutionalScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'modal' }} />
      {/* Awards (Booth 2026-07-15) — Certificates/Diplomas/Hall of Fame, bottom nav hidden. */}
      <Stack.Screen name="Awards" component={AwardsScreen} />
      {/* Directory — "Get Discovered" profile info (user request 2026-07-22) — modal. */}
      <Stack.Screen name="Directory" component={DirectoryScreen} options={{ presentation: 'modal' }} />
      {/* Measurement & Analysis tools (Booth 2026-07-09v) — bottom nav hidden. */}
      <Stack.Screen name="ToolsHub" component={ToolsHubScreen} />
      <Stack.Screen name="ToolInfo" component={ToolInfoScreen} />
      {/* Phase-1 training layer (spec of record 2026-07-23): Learn/Demo per
          tool + Smaart concept modules. Academy-gated at content level. */}
      <Stack.Screen name="ToolLearn" component={ToolLearnScreen} />
      <Stack.Screen name="ToolDemo" component={ToolDemoScreen} />
      <Stack.Screen name="ConceptModule" component={ConceptModuleScreen} />
      {/* Phase-2 saved-measurement library + A/B compare (spec §7/§8). */}
      <Stack.Screen name="ToolLibrary" component={MeasurementLibraryScreen} />
      {/* LIVE measurement screens (engine build 2026-07-23) — each gates
          itself honestly via EngineGate when the engine isn't in the build. */}
      <Stack.Screen name="SplMeter" component={SplMeterScreen} />
      <Stack.Screen name="Rta" component={RtaScreen} />
      <Stack.Screen name="WaveformLive" component={WaveformScreen} />
      <Stack.Screen name="SignalGen" component={SignalGenScreen} />
      <Stack.Screen name="SpectrogramLive" component={SpectrogramScreen} />
      <Stack.Screen name="Rt60Live" component={Rt60Screen} />
      {/* Frequency Counter & Tuner tool (2026-07-18; tuner merged 2026-07-23). */}
      <Stack.Screen name="FrequencyCounter" component={FrequencyCounterScreen} />
      {/* Spike-0 dev-only debug (entry rendered only when __DEV__). */}
      <Stack.Screen name="DspDebug" component={DspDebugScreen} />
      {/* Audio Learning Lab (v4 MASTER §13) — the pinned Home card opens the
          EarLab landing menu; HarmonicLab is the one live lab today. Bottom nav
          hidden like the other tool screens. */}
      <Stack.Screen name="EarLab" component={EarLabScreen} />
      <Stack.Screen name="HarmonicLab" component={HarmonicLabScreen} />
      <Stack.Screen name="OscillatorLab" component={OscillatorLabScreen} />
      <Stack.Screen name="NoiseLab" component={NoiseLabScreen} />
      <Stack.Screen name="HarmonographLab" component={HarmonographLabScreen} />
      {/* The 12 effect labs (native effects path, engineVersion 6). */}
      <Stack.Screen name="EqLab" component={EqLabScreen} />
      <Stack.Screen name="DelayLab" component={DelayLabScreen} />
      <Stack.Screen name="ReverbLab" component={ReverbLabScreen} />
      <Stack.Screen name="ChorusLab" component={ChorusLabScreen} />
      <Stack.Screen name="FlangerLab" component={FlangerLabScreen} />
      <Stack.Screen name="PhaserLab" component={PhaserLabScreen} />
      <Stack.Screen name="CompressionLab" component={CompressionLabScreen} />
      <Stack.Screen name="GateLab" component={GateLabScreen} />
      <Stack.Screen name="LimiterLab" component={LimiterLabScreen} />
      <Stack.Screen name="DistortionLab" component={DistortionLabScreen} />
      <Stack.Screen name="PhaseLab" component={PhaseLabScreen} />
      <Stack.Screen name="StereoLab" component={StereoLabScreen} />
      <Stack.Screen name="SignalChainLab" component={SignalChainLabScreen} />
      {/* Expansion labs (owner 2026-07-26). */}
      <Stack.Screen name="BassLab" component={BassLabScreen} />
      <Stack.Screen name="AutotuneLab" component={AutotuneLabScreen} />
      <Stack.Screen name="FmLab" component={FmLabScreen} />
      <Stack.Screen name="BinauralLab" component={BinauralLabScreen} />
      <Stack.Screen name="ModularLab" component={ModularLabScreen} />
      <Stack.Screen name="MicLab" component={MicPrinciplesLabScreen} />
      <Stack.Screen name="SpeakerLab" component={SpeakerCoverageLabScreen} />
      <Stack.Screen name="TubeLab" component={VacuumTubeLabScreen} />
      <Stack.Screen name="CalcLab" component={CalcLabScreen} />
      <Stack.Screen name="CalcWorkspace" component={CalcWorkspaceScreen} />
      <Stack.Screen name="DigitalLab" component={DigitalLabHomeScreen} />
      <Stack.Screen name="DigitalModule" component={DigitalModuleScreen} />
      {/* Foundations of Sound — the Ear Lab's first module (course + sandbox). */}
      <Stack.Screen name="FoundationsCourse" component={FoundationsCourseScreen} />
      <Stack.Screen name="FoundationsPlayground" component={FoundationsPlaygroundScreen} />
      {/* CM2 (commercialMode): pre-auth Landing + anonymous glossary. Only
          reached when the flag is ON (Splash routes there); registering them
          unconditionally changes nothing with the flag OFF. */}
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="PublicGlossary" component={PublicGlossaryScreen} />
      {/* CM7: academy paywall (modal; UI only). */}
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
