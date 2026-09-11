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
import { KeyboardProvider, KeyboardToolbar } from './src/features/keyboard/keyboardControllerSafe';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RootErrorBoundary } from './src/components/RootErrorBoundary';
import { Spl3dGaugePreview } from './src/screens/tools/Spl3dGaugePreview';
import { PatchbayPreview } from './src/screens/lab/patchbay/PatchbayPreview';
import { BeginningMixingLabScreen } from './src/screens/lab/mixing/BeginningMixingLabScreen';
import { AdvancedMixingLabScreen } from './src/screens/lab/mixing/AdvancedMixingLabScreen';
import { ConnectorSelectLabScreen } from './src/screens/lab/connectorselect/ConnectorSelectLabScreen';
import { ToolPreview } from './src/screens/tools/ToolPreview';
import { MicPrinciplesLabScreen } from './src/screens/lab/micspeaker/MicPrinciplesLabScreen';
import { MultiMeterScreen } from './src/screens/tools/MultiMeterScreen';
import { FrequencyCounterScreen } from './src/screens/tools/FrequencyCounterScreen';
import { WaveformScreen } from './src/screens/tools/WaveformScreen';
import { RtaScreen } from './src/screens/tools/RtaScreen';
import { ToolsHubScreen } from './src/screens/tools/ToolsHubScreen';
import { CalcWorkspaceScreen } from './src/screens/lab/calc/CalcWorkspaceScreen';
import { CalcLabScreen } from './src/screens/lab/calc/CalcLabScreen';
import { CableInstallLabScreen } from './src/screens/lab/cableinstall/CableInstallLabScreen';
import { CableArtPreview } from './src/screens/lab/cableinstall/CableArtPreview';
// Audio Career Finder (owner brief 2026-09-03) — `#careerfinderpreview` runs
// the whole six-screen flow in the browser harness.
import { CareerFinderScreen } from './src/screens/careerfinder/CareerFinderScreen';
import { CareerFinderQuizScreen } from './src/screens/careerfinder/CareerFinderQuizScreen';
import { CareerFinderResultsScreen } from './src/screens/careerfinder/CareerFinderResultsScreen';
import { CareerFamilyScreen } from './src/screens/careerfinder/CareerFamilyScreen';
import { CareerFamilyListScreen } from './src/screens/careerfinder/CareerFamilyListScreen';
import { CareerFinderAboutScreen } from './src/screens/careerfinder/CareerFinderAboutScreen';
import { navigationRef } from './src/navigation/navigationRef';
import { linking } from './src/navigation/linking';
import { attachLinkCapture } from './src/navigation/pendingLink';
import { recordAppSession } from './src/features/review/reviewPrompt';
import {
  attachWeeklyConceptPush,
  flushLocalDestNav,
  flushWeeklyConceptNav,
  queueLocalDest,
  queueWeeklyConcept,
} from './src/features/notifications/push';
import { syncLocalNotificationsThrottled } from './src/features/notifications/localSchedule';
import { loadLocalSettings } from './src/features/settings/store';
import { NotifySchedulePreview } from './src/features/settings/NotifySchedulePreview';
import { SettingsPreview } from './src/screens/settings/SettingsPreview';
import { SamplerPreview } from './src/features/intro/SamplerPreview';
import { FirstRunCoordinator } from './src/features/intro/FirstRunCoordinator';
import { ProfilePreview } from './src/screens/profile/ProfilePreview';
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
import { SessionExpiryGuard } from './src/features/account/SessionExpiryGuard';
import { ShakeToMute } from './src/features/audio/ShakeToMute';
import { LowLightProductionGate } from './src/features/settings/LowLightLayer';
import { MembershipGateHost } from './src/features/commercial/MembershipGate';
import { registerLowLightTap, touchLowLight } from './src/features/settings/lowLight';
import { useAccountLocalSync } from './src/features/account/accountLocalSync';
import { lockPortrait } from './src/lib/screenOrientationSafe';
import { colors, fontAssets } from './src/theme/tokens';

// Prime the accessibility runtime from storage at boot so anything that reads
// it synchronously (motion, haptics) has the user's real choice, not defaults.
void loadLocalSettings();

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

/** Route a LOCAL reminder's `dest` to its screen. Module scope so both the
 *  live listener and NavigationContainer's cold-start drain share one map —
 *  the two paths silently diverging is how the cold-start tap got lost. */
function routeLocalDest(dest: string): void {
  if (dest === 'glossary') {
    // Glossary lives in the Study stack inside the Main tabs. `pop: true`
    // returns to the existing Main (RN7 navigate() would otherwise push a
    // second tab shell when a root-level screen is on top).
    navigationRef.navigate(
      'Main',
      {
        screen: 'Study',
        params: { screen: 'Glossary', params: {} },
      },
      { pop: true }
    );
  } else if (dest === 'awards') {
    navigationRef.navigate('Awards', { category: 'curriculum' });
  }
}

export default function App() {
  // Capture the error tuple: a font-load failure must NOT hang the app forever on
  // the dark surface — fall through to render with system fonts (bug audit 2026-09-09).
  const [fontsLoaded, fontError] = useFonts(fontAssets);

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
      // A cold-start tap arrives before NavigationContainer mounts (App is
      // still on its font-loading placeholder) — park it and let onReady
      // drain it, exactly as the weekly-concept payload does. Without this
      // the reminder opened the app at Home and the destination was lost.
      if (!navigationRef.isReady()) {
        queueLocalDest(dest);
        return;
      }
      routeLocalDest(dest);
    };
    return attachWeeklyConceptPush(open, openLocal);
  }, []);

  // Local reminder upkeep (S11, wired 2026-08-29): each boot AND each return
  // to foreground re-arms the idle one-shot, tops up the 7-day term queue, and
  // runs the new-terms check. Throttled + guarded inside; no-op on web and on
  // dev clients without the native module.
  useEffect(() => {
    // .catch is NOT optional here: this runs on the boot path and again on every
    // foreground, so a single rejection (a corrupt settings blob, a dev client
    // without the native notifications module) became an unhandled rejection at
    // launch. Reminders are best-effort upkeep — failing quietly is correct.
    const sync = () =>
      void loadLocalSettings()
        .then(syncLocalNotificationsThrottled)
        .catch(() => {});
    sync();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  // DEEP-LINK DESTINATION CAPTURE (2026-09-05). React Navigation's linking
  // handles a URL only once a navigator can receive it; a launch with no
  // session goes Splash → Auth, and the reset throws the destination away. So
  // remember it here and let AuthScreen resume it after sign-in. setPendingLink
  // validates against the same contract the linking filter uses, so a hostile
  // or unknown URL is never stored. Splash clears it when a session already
  // exists (linking will have handled it directly).
  useEffect(() => attachLinkCapture(), []);

  // Store-review eligibility (launch readiness, 2026-09-06): count this launch
  // as a session. The prompt itself is only ever requested after a genuine
  // success, and only once the thresholds in reviewEligibility.ts are met.
  useEffect(() => {
    void recordAppSession();
  }, []);

  // Clear a stale Training-Lab preview if the user leaves the previewed lab by
  // any route (swipe-back, etc.) — so the grayed overlay never sticks over the
  // wrong screen (owner 2026-08-02).
  useEffect(() => {
    const unsub = navigationRef.addListener('state', () => {
      const p = getLabPreview();
      // A deliberate leave (leaveLab) keeps its own scrim through the pop and
      // clears it after 350ms — the safety net must not preempt that (B-066).
      if (p.active && !p.leaving && navigationRef.getCurrentRoute()?.name !== p.route) endLabPreview();
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

  // Hold on a dark surface until fonts resolve (avoids a white flash + FOUT) —
  // but a font-load ERROR falls through so a failed asset renders with system
  // fonts instead of hanging on a blank screen forever (bug audit 2026-09-09).
  if (!fontsLoaded && !fontError) {
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

  // DEV + WEB ONLY: `localhost:8090/#patchbaypreview` — the Patchbay lab's core
  // visual gallery (all configurations, interactive jacks) for browser design
  // iteration. SVG + RN Animated only, so the web render is faithful.
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.startsWith('#patchbaypreview')) {
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
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.startsWith('#notifyschedulepreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NotifySchedulePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#profilepreview/<width>` — Profile is behind login too.
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.startsWith('#profilepreview')) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ProfilePreview />
      </SafeAreaProvider>
    );
  }

  // DEV + WEB ONLY: `#settingspreview/<width>` — the Settings screen is behind
  // login, so this is the only way to review its layout in the browser.
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.startsWith('#settingspreview')) {
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
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.startsWith('#samplerpreview')) {
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
    __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.hash === '#careerfinderpreview'
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
      : window.location.hash === '#multimeterpreview'
        ? { name: 'MultiMeter', component: MultiMeterScreen as ComponentType }
        : window.location.hash === '#hzcounterpreview'
          ? { name: 'FrequencyCounter', component: FrequencyCounterScreen as ComponentType }
        : window.location.hash === '#mixinglabpreview'
          ? { name: 'BeginningMixingLab', component: BeginningMixingLabScreen as ComponentType }
        : window.location.hash === '#advmixingpreview'
          ? { name: 'AdvancedMixingLab', component: AdvancedMixingLabScreen as ComponentType }
        : window.location.hash === '#connectorselectpreview'
          ? { name: 'ConnectorSelectLab', component: ConnectorSelectLabScreen as ComponentType }
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
                      : window.location.hash === '#micprinciplespreview'
                        ? { name: 'MicPrinciples', component: MicPrinciplesLabScreen as ComponentType }
                        : null
      : null;
  if (toolPreview) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ToolPreview name={toolPreview.name} component={toolPreview.component} initialParams={toolPreview.initialParams} screens={toolPreview.screens} />
      </SafeAreaProvider>
    );
  }

  return (
    // Last line of defence (QA night 2026-09-01): before this, ONE uncaught
    // render error unmounted the whole app to a white screen with no way back.
    <RootErrorBoundary>
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
              // Deep links / universal links (2026-09-05) — the URL → screen map
              // lives in src/navigation/linking.ts alongside the claimed paths.
              linking={linking}
              onReady={() => {
                flushWeeklyConceptNav((payload) => navigationRef.navigate('WeeklyConcept', payload));
                // Drain a cold-start LOCAL reminder tap too — same contract.
                flushLocalDestNav(routeLocalDest);
              }}
            >
              <RootNavigator />
            </NavigationContainer>
            {/* The dim wash is applied per-SCREEN inside RootNavigator now — a
                modal-presented screen sits above this level, so a root wash
                missed Settings and six others (owner 2026-08-31). */}
            {/* Low-Light Production Mode's one-time on-enable notice + the
                6-tap cancel affordance (owner 2026-08-01). */}
            <LowLightProductionGate />
            {/* App-themed "Academy membership required" popup (owner
                2026-09-10) — one host serves every tool gate. */}
            <MembershipGateHost />
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
            {/* Silent session-loss rescue (QA Wave D, D-1): on an UNEXPECTED
                SIGNED_OUT (token expired/revoked) resets to Auth so the user
                isn't stranded on a protected screen. Skips app-initiated
                sign-outs (they navigate themselves). Renders nothing. */}
            <SessionExpiryGuard />
            {/* Shake-to-panic-mute (owner request 2026-07-26): while audio can
                sound, a decisive shake instantly silences everything and
                re-locks the app to silent. Renders nothing. */}
            <ShakeToMute />
            {/* Free-user Training-Lab preview: grayed, non-interactive scrim +
                Academy upgrade sheet over the live lab (owner 2026-08-02). */}
            <LabPreviewOverlay />
            {/* First-launch connected-path onboarding (plan §2.1–§2.3): a root
                overlay that appears over Home for brand-new users, opens each
                existing stop (glossary/calc/labs/meter/career), recaps + recommends
                the next connected step on return, and ends permanently at Home.
                Renders nothing once onboarding is complete. */}
            <FirstRunCoordinator />
          </View>
        </AudioOutputGate>
      </EntitlementProvider>
      {/* ALWAYS A WAY OUT OF THE KEYBOARD (owner 2026-08-31). Mounted once,
          inside the provider and outside the navigator, so EVERY TextInput in
          the app — not just the ones inside a scroll view — gets a DONE bar
          above the keyboard. Renders nothing while the keyboard is closed, and
          nothing at all on a build without the native module. Dark theme both
          ways: this app is dark, and a white bar would flash in a theater. */}
      <KeyboardToolbar
        showArrows={false}
        theme={{
          light: { primary: '#ffc64d', disabled: '#5a5a5a', background: '#181818', ripple: '#2a2a2a' },
          dark: { primary: '#ffc64d', disabled: '#5a5a5a', background: '#181818', ripple: '#2a2a2a' },
        }}
      />
      </KeyboardProvider>
    </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
