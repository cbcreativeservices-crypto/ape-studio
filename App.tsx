/**
 * AP&E STUDIO — app root.
 * Loads the locked type families, wraps the app in a dark navigation theme +
 * safe-area provider, and renders the RootNavigator. Dark theme, portrait-only.
 */
import { useEffect, type ComponentType } from 'react';
import { useFonts } from 'expo-font';
import { AppState, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from './src/features/keyboard/keyboardControllerSafe';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Spl3dGaugePreview } from './src/screens/tools/Spl3dGaugePreview';
import { ToolPreview } from './src/screens/tools/ToolPreview';
import { MultiMeterScreen } from './src/screens/tools/MultiMeterScreen';
import { WaveformScreen } from './src/screens/tools/WaveformScreen';
import { RtaScreen } from './src/screens/tools/RtaScreen';
import { ToolsHubScreen } from './src/screens/tools/ToolsHubScreen';
import { CalcWorkspaceScreen } from './src/screens/lab/calc/CalcWorkspaceScreen';
import { CalcLabScreen } from './src/screens/lab/calc/CalcLabScreen';
import { CableInstallLabScreen } from './src/screens/lab/cableinstall/CableInstallLabScreen';
import { CableArtPreview } from './src/screens/lab/cableinstall/CableArtPreview';
import { navigationRef } from './src/navigation/navigationRef';
import {
  attachWeeklyConceptPush,
  flushWeeklyConceptNav,
  queueWeeklyConcept,
} from './src/features/notifications/push';
import { syncLocalNotificationsThrottled } from './src/features/notifications/localSchedule';
import { loadLocalSettings } from './src/features/settings/store';
import { LabPreviewOverlay } from './src/features/lab/LabPreviewOverlay';
import { endLabPreview, getLabPreview } from './src/features/lab/labPreviewStore';
import { EntitlementProvider } from './src/features/commercial/EntitlementProvider';
import { AudioOutputGate } from './src/features/audio/AudioOutputGate';
import { touchAudioActivity } from './src/features/audio/audioOutputStore';
import { AudioBorderFrame } from './src/features/audio/AudioBorderFrame';
import { ExposureCheckin } from './src/features/audio/ExposureCheckin';
import { initExposureMonitor } from './src/features/audio/exposureMonitor';
import { subscribeAudioOutput } from './src/features/audio/audioOutputStore';
import { MicFeedbackGuard } from './src/features/audio/MicFeedbackGuard';
import { SingleDeviceGuard } from './src/features/account/SingleDeviceGuard';
import { ShakeToMute } from './src/features/audio/ShakeToMute';
import { LowLightDim, LowLightProductionGate } from './src/features/settings/LowLightLayer';
import { registerLowLightTap, touchLowLight } from './src/features/settings/lowLight';
import { useAccountLocalSync } from './src/features/account/accountLocalSync';
import { lockPortrait } from './src/lib/screenOrientationSafe';
import { colors, fontAssets } from './src/theme/tokens';

// Boot the Listening Exposure Monitor once (owner 2026-08-12): its 1 s poller
// arms ONLY while the audio-output gate is open and the app is foregrounded —
// zero cost while the app cannot sound. House hydrate-on-import idiom.
initExposureMonitor(subscribeAudioOutput);

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.screenBg,
    card: colors.screenBg,
    primary: colors.amber,
    text: colors.textPrimary,
    border: colors.hairline,
    notification: colors.amber,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  // Account-switch guard (user bug 2026-07-26): wipe device-local data whenever a
  // DIFFERENT user signs in. Called before the early return to keep hook order
  // stable. Kept separate from AudioOutputGate's own onAuthStateChange.
  useAccountLocalSync();

  useEffect(() => {
    const open = (payload: Parameters<typeof queueWeeklyConcept>[0]) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('WeeklyConcept', payload);
      } else {
        queueWeeklyConcept(payload);
      }
    };
    const openLocal = (dest: string) => {
      if (!navigationRef.isReady()) return;
      if (dest === 'glossary') {
        // Glossary lives in the Study stack inside the Main tabs.
        navigationRef.navigate('Main', {
          screen: 'Study',
          params: { screen: 'Glossary', params: {} },
        });
      } else if (dest === 'awards') {
        navigationRef.navigate('Awards', { category: 'curriculum' });
      }
    };
    return attachWeeklyConceptPush(open, openLocal);
  }, []);

  // Local reminder upkeep (S11, wired 2026-08-29): each boot AND each return
  // to foreground re-arms the idle one-shot, tops up the 7-day term queue, and
  // runs the new-terms check. Throttled + guarded inside; no-op on web and on
  // dev clients without the native module.
  useEffect(() => {
    const sync = () => void loadLocalSettings().then(syncLocalNotificationsThrottled);
    sync();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  // Clear a stale Training-Lab preview if the user leaves the previewed lab by
  // any route (swipe-back, etc.) — so the grayed overlay never sticks over the
  // wrong screen (owner 2026-08-02).
  useEffect(() => {
    const unsub = navigationRef.addListener('state', () => {
      const p = getLabPreview();
      if (p.active && navigationRef.getCurrentRoute()?.name !== p.route) endLabPreview();
    });
    return unsub;
  }, []);

  // Portrait-only app, enforced at RUNTIME (owner 2026-08-18). app.json now
  // declares "default" so the OS permits rotation — required for the SPL meter's
  // fullscreen auto-rotate — but every other screen must stay portrait, so we
  // lock PORTRAIT_UP once at boot. The SPL fullscreen unlocks on entry and
  // re-locks PORTRAIT_UP on exit; nothing else touches orientation. lockPortrait
  // is a no-op (never throws) on dev clients that predate the native module.
  useEffect(() => {
    try {
      lockPortrait();
    } catch {
      /* orientation is best-effort — never let it break boot */
    }
  }, []);

  // Hold on a dark surface until fonts resolve (avoids a white flash + FOUT).
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.splashBg }} />;
  }

  // DEV + WEB ONLY: `localhost:8090/#gaugepreview` renders the standalone 3D-gauge
  // layout harness (all three modes, demo data) so Claude can see + iterate the
  // gauge in the browser — the real gauge only draws while the native engine
  // runs, which never happens on web. Inert on device and in release builds.
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash === '#gaugepreview') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Spl3dGaugePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `localhost:8090/#<tool>preview` renders a real (Skia-free
  // SVG) tool screen in a minimal navigator with the ape-dsp SIM overlay, so the
  // tool can be seen + iterated in the browser. Outside RootNavigator, so it
  // skips AmplitudeOrientation's web-Skia throw.
  const toolPreview: { name: string; component: ComponentType; initialParams?: Record<string, unknown> } | null =
    __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.hash === '#multimeterpreview'
        ? { name: 'MultiMeter', component: MultiMeterScreen as ComponentType }
        : window.location.hash === '#waveformpreview'
          ? { name: 'WaveformLive', component: WaveformScreen as ComponentType }
          : window.location.hash === '#rtapreview'
            ? { name: 'Rta', component: RtaScreen as ComponentType }
            : window.location.hash === '#toolshubpreview'
              ? { name: 'ToolsHub', component: ToolsHubScreen as ComponentType }
              : window.location.hash === '#calcworkspacepreview'
                ? { name: 'CalcWorkspace', component: CalcWorkspaceScreen as ComponentType, initialParams: { id: 'wave' } }
                : window.location.hash === '#calclabpreview'
                  ? { name: 'CalcLab', component: CalcLabScreen as ComponentType }
                  : window.location.hash === '#cableinstallpreview'
                    ? { name: 'CableInstallLab', component: CableInstallLabScreen as ComponentType }
                    : window.location.hash === '#cableartpreview'
                      ? { name: 'CableArt', component: CableArtPreview as ComponentType }
                      : null
      : null;
  if (toolPreview) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ToolPreview name={toolPreview.name} component={toolPreview.component} initialParams={toolPreview.initialParams} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Global keyboard handling (owner 2026-08-01): powers KeyboardAwareScrollView
          so focused fields lift above the keyboard instead of being covered.
          Native module — inert until a build bundles it (no crash before then). */}
      <KeyboardProvider>
      <StatusBar style="light" />
      {/* Commercial entitlement context (CM1) — inert while commercialMode is
          OFF; no consumers yet, so app behavior is unchanged. */}
      <EntitlementProvider>
        {/* Global audio-output gate (owner request 2026-07-25): the app is
            silent by default; this provider owns the enable popups and wires the
            login / foreground-idle auto-re-mute. Mounted once at the root. */}
        <AudioOutputGate>
          {/* Navigator + the global low-light dim wash (the toggle lives on the
              Profile screen). pointer-transparent, so it never blocks touches.
              The capture handler pings the low-light "last touched" clock on
              every touch (owner 2026-07-30) — it returns false so children still
              handle the touch normally; touchLowLight() is throttled + no-op
              when low-light is off. */}
          <View
            style={{ flex: 1 }}
            onStartShouldSetResponderCapture={() => {
              touchLowLight();
              // Six fast taps anywhere cancels Low-Light Production Mode (owner
              // 2026-08-01) — the escape hatch while everything else is hidden.
              registerLowLightTap();
              // Keep audio output alive while the app is being used — the 20-min
              // auto-mute only fires after real inactivity (owner 2026-07-30).
              touchAudioActivity();
              return false;
            }}
          >
            <NavigationContainer
              theme={navTheme}
              ref={navigationRef}
              onReady={() => {
                flushWeeklyConceptNav((payload) => navigationRef.navigate('WeeklyConcept', payload));
              }}
            >
              <RootNavigator />
            </NavigationContainer>
            <LowLightDim />
            {/* Low-Light Production Mode's one-time on-enable notice + the
                6-tap cancel affordance (owner 2026-08-01). */}
            <LowLightProductionGate />
            {/* Persistent thin red frame whenever audio output is enabled — a
                global "the app can sound" indicator on every screen. */}
            <AudioBorderFrame />
            {/* Listening Exposure Monitor check-ins (owner 2026-08-12): every
                15 active minutes the red line becomes the bottom edge of this
                top check-in panel. Renders nothing between check-ins. */}
            <ExposureCheckin />
            {/* Mic↔speaker feedback interlock (owner request 2026-07-26): cuts
                the speaker whenever the mic is capturing without the physical
                override. Renders nothing; mounted once at the root. */}
            <MicFeedbackGuard />
            {/* Single-device login (owner 2026-08-21): if the account is claimed
                by a newer device, this one signs out on next foreground. Renders
                nothing; fails open until the backend migration is run. */}
            <SingleDeviceGuard />
            {/* Shake-to-panic-mute (owner request 2026-07-26): while audio can
                sound, a decisive shake instantly silences everything and
                re-locks the app to silent. Renders nothing. */}
            <ShakeToMute />
            {/* Free-user Training-Lab preview: grayed, non-interactive scrim +
                Academy upgrade sheet over the live lab (owner 2026-08-02). */}
            <LabPreviewOverlay />
          </View>
        </AudioOutputGate>
      </EntitlementProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
