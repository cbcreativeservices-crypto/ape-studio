/**
 * AP&E STUDIO — app root.
 * Loads the locked type families, wraps the app in a dark navigation theme +
 * safe-area provider, and renders the RootNavigator. Dark theme, portrait-only.
 */
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from './src/features/keyboard/keyboardControllerSafe';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { LabPreviewOverlay } from './src/features/lab/LabPreviewOverlay';
import { endLabPreview, getLabPreview } from './src/features/lab/labPreviewStore';
import { EntitlementProvider } from './src/features/commercial/EntitlementProvider';
import { AudioOutputGate } from './src/features/audio/AudioOutputGate';
import { touchAudioActivity } from './src/features/audio/audioOutputStore';
import { AudioBorderFrame } from './src/features/audio/AudioBorderFrame';
import { MicFeedbackGuard } from './src/features/audio/MicFeedbackGuard';
import { ShakeToMute } from './src/features/audio/ShakeToMute';
import { LowLightDim, LowLightProductionGate } from './src/features/settings/LowLightLayer';
import { registerLowLightTap, touchLowLight } from './src/features/settings/lowLight';
import { useAccountLocalSync } from './src/features/account/accountLocalSync';
import { colors, fontAssets } from './src/theme/tokens';

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

  // Hold on a dark surface until fonts resolve (avoids a white flash + FOUT).
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.splashBg }} />;
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
            <NavigationContainer theme={navTheme} ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
            <LowLightDim />
            {/* Low-Light Production Mode's one-time on-enable notice + the
                6-tap cancel affordance (owner 2026-08-01). */}
            <LowLightProductionGate />
            {/* Persistent thin red frame whenever audio output is enabled — a
                global "the app can sound" indicator on every screen. */}
            <AudioBorderFrame />
            {/* Mic↔speaker feedback interlock (owner request 2026-07-26): cuts
                the speaker whenever the mic is capturing without the physical
                override. Renders nothing; mounted once at the root. */}
            <MicFeedbackGuard />
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
