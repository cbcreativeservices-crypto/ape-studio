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
import { FrequencyCounterScreen } from '../screens/tools/FrequencyCounterScreen';
import { DspDebugScreen } from '../screens/tools/DspDebugScreen';
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
      {/* Frequency Counter & Tuner tool (2026-07-18; tuner merged 2026-07-23). */}
      <Stack.Screen name="FrequencyCounter" component={FrequencyCounterScreen} />
      {/* Spike-0 dev-only debug (entry rendered only when __DEV__). */}
      <Stack.Screen name="DspDebug" component={DspDebugScreen} />
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
