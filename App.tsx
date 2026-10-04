/**
 * AP&E STUDIO — app root.
 * Loads the locked type families, wraps the app in a dark navigation theme +
 * safe-area provider, and renders the RootNavigator. Dark theme, portrait-only.
 */
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AppState, Dimensions, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider, KeyboardToolbar } from './src/features/keyboard/keyboardControllerSafe';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setMeasurementFailureReporter } from './src/features/tools/measure/measurementStore';
import { setSaveFailurePresenter } from './src/features/storage/saveFailureNotice';
import { notify } from './src/lib/confirm';
import { RootErrorBoundary } from './src/components/RootErrorBoundary';
import { navigationRef } from './src/navigation/navigationRef';
import { linking, navigateToPath } from './src/navigation/linking';
import { attachLinkCapture, clearPendingLink, pendingLinkUrl, setPendingLink } from './src/navigation/pendingLink';
import { recordAppSession } from './src/features/review/reviewPrompt';
import { startAutoUpdate } from './src/features/updates/startAutoUpdate';
import { drainStudyQueue } from './src/features/study/sync';
import { flushScenarioQueue } from './src/features/study/scenarioHomework';
import {
  attachWeeklyConceptPush,
  flushCommunityPathNav,
  flushLocalDestNav,
  flushWeeklyConceptNav,
  queueCommunityPath,
  queueLocalDest,
  queueWeeklyConcept,
} from './src/features/notifications/push';
import { runSoon } from './src/lib/afterInteractions';
import { refreshCommunityInbox } from './src/features/directory/CommunityBadge';
import { syncLocalNotificationsThrottled } from './src/features/notifications/localSchedule';
import { loadLocalSettings } from './src/features/settings/store';
import { FirstRunCoordinator } from './src/features/intro/FirstRunCoordinator';
import { LabPreviewOverlay } from './src/features/lab/LabPreviewOverlay';
import { endLabPreview, getLabPreview } from './src/features/lab/labPreviewStore';
import { EntitlementProvider } from './src/features/commercial/EntitlementProvider';
import { GlossaryPrefetchRoot } from './src/features/glossary/GlossaryPrefetchRoot';
import { PurchaseListenerRoot } from './src/features/commercial/PurchaseListenerRoot';
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
import { registerLowLightTap, touchLowLight } from './src/features/settings/lowLight';
import { useAccountLocalSync } from './src/features/account/accountLocalSync';
import { lockPortrait } from './src/lib/screenOrientationSafe';
import { isTabletDisplay } from './src/theme/useIsTablet';
import { initTelemetry, trackScreen, wrapRoot } from './src/features/telemetry/telemetry';
import { colors, fontAssets } from './src/theme/tokens';

// Crash reporting + anonymous analytics (owner-approved 2026-09-16), booted
// FIRST so a failure anywhere below is already caught. Privacy contract +
// the single kill switch: src/features/telemetry/telemetry.ts.
initTelemetry();

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

/** The public link path for each LOCAL reminder `dest`, so a tap that arrives
 *  signed out can be parked in pendingLink and resumed after sign-in. */
const LOCAL_DEST_PATH: Record<string, string> = {
  glossary: 'glossary',
  awards: 'awards/curriculum',
};

/** Route a LOCAL reminder's `dest` to its screen. Module scope so both the
 *  live listener and NavigationContainer's cold-start drain share one map —
 *  the two paths silently diverging is how the cold-start tap got lost. */
function routeLocalDest(dest: string): void {
  /**
   * ⛔ NOTHING SITS ABOVE `Auth` — A REMINDER TAP INCLUDED (bug hunt 2026-09-29).
   *
   * A reminder tapped while signed out navigated straight to Main / Awards on
   * top of the login screen: the app shell with no account behind it, the
   * state Splash and pendingLink.ts already forbid for deep links. The stack
   * says whether they are signed out (Splash makes `Auth` the base in exactly
   * that case), so park the destination in pendingLink — AuthScreen resumes it
   * after sign-in — and navigate nowhere.
   *
   * Still on Splash (a cold-start tap, drained from onReady): navigate as
   * before AND park it. Signed in, Splash keeps the pushed route and clears
   * the parked copy; signed out, Splash drops the route and the parked copy
   * is what survives sign-in.
   */
  let base: string | undefined;
  try {
    base = navigationRef.isReady() ? navigationRef.getRootState()?.routes?.[0]?.name : undefined;
  } catch {
    base = undefined;
  }
  if (base === 'Auth' || base === 'Splash') {
    const path = LOCAL_DEST_PATH[dest];
    if (path) setPendingLink(pendingLinkUrl(path));
    if (base === 'Auth') return;
  }
  if (dest === 'glossary') {
    // Glossary lives in the Study stack inside the Main tabs. `pop: true`
    // returns to the existing Main (RN7 navigate() would otherwise push a
    // second tab shell when a root-level screen is on top).
    // `initial: false` + `from` match Home's OPEN GLOSSARY: the Study stack
    // mounts as [Dashboard, Glossary] (never Glossary as its root, which is how
    // the STUDY tab used to land on the Glossary), and because the person came
    // from a notification, not the Dashboard, the Glossary's exits return to
    // Home instead of revealing a Dashboard they never opened (tester report
    // 2026-09-27 on the Home button — same trap). See GlossaryParams.
    const glossaryParams: import('./src/screens/glossary/GlossaryScreen').GlossaryParams = {
      from: 'notification',
    };
    navigationRef.navigate(
      'Main',
      {
        screen: 'Study',
        params: { screen: 'Glossary', params: glossaryParams, initial: false },
      },
      { pop: true }
    );
  } else if (dest === 'awards') {
    // `pop: true` like the glossary branch above (bug hunt 2026-09-30, pass
    // 2): a reminder tapped with Awards already lower in the stack pushed a
    // SECOND Awards, and BACK walked through both.
    navigationRef.navigate('Awards', { category: 'curriculum' }, { pop: true });
  }
}

/**
 * Open a tapped member alert's conversation (owner 2026-10-04) by the deep-link
 * rules, not a hand-built route: the path is remembered as a pending link
 * FIRST, then navigated through linking's own table. Signed out (Auth is the
 * base), nothing is pushed above Auth — AuthScreen resumes the link after
 * sign-in. Signed in, it opens now and the remembered link is dropped so a
 * later sign-out → sign-in cannot replay it; during the cold-start Splash it
 * is kept, and Splash itself clears it once it finds a session.
 */
function openCommunityPath(path: string): void {
  setPendingLink(pendingLinkUrl(path));
  let base: string | undefined;
  try {
    base = navigationRef.getRootState()?.routes?.[0]?.name;
  } catch {
    base = undefined;
  }
  if (base === 'Auth') return;
  navigateToPath(path);
  if (base && base !== 'Splash') clearPendingLink();
}

// A failed measurement write has to reach a HUMAN (2026-09-17). The store is
// deliberately free of react-native so its node test can load it, so it calls
// out through this hook instead. Set once, at module scope, before any tool can
// run — not in an effect, because the first save could beat the effect.
setMeasurementFailureReporter((title, body) => notify(title, body));
// The same for every OTHER device-local write the device refuses and no screen
// reports itself (owner ruling 2026-10-03: "if it fails the user needs to
// know"): one shared, rate-limited notice — src/features/storage/saveFailureNotice.ts.
setSaveFailurePresenter((title, body, onDismiss) => notify(title, body, onDismiss));

function App() {
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
        // ⛔ NOTHING SITS ABOVE `Auth` (bug hunt 2026-09-30): routeLocalDest and
        // pendingLink already refuse this, but a weekly-concept push tapped
        // while signed out pushed its card straight over the login screen.
        // Splash as the base is fine — it drops the route if signed out.
        let base: string | undefined;
        try {
          base = navigationRef.getRootState()?.routes?.[0]?.name;
        } catch {
          base = undefined;
        }
        if (base === 'Auth') return;
        // `pop: true`: a second push tapped while an earlier card is lower
        // in the stack returns to it with the new payload, not a second card.
        navigationRef.navigate('WeeklyConcept', payload, { pop: true });
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
    // A tapped MEMBER alert (message / contact request, owner 2026-10-04)
    // opens its conversation through the ordinary link rules: parked until
    // the navigator mounts, then remembered as a pending link (so a tap while
    // signed out resumes after sign-in, and Splash / the link capture clear it
    // once signed in) and navigated through the one URL→screen table.
    const openCommunity = (path: string) => {
      if (!navigationRef.isReady()) {
        queueCommunityPath(path);
        return;
      }
      openCommunityPath(path);
    };
    return attachWeeklyConceptPush(open, openLocal, {
      open: openCommunity,
      received: () => void refreshCommunityInbox(true),
    });
  }, []);

  // Community unread counts + this phone's alert registration (owner
  // 2026-10-04): read on launch, on every return to the foreground, and every
  // two minutes while the app is in front. Each read is newest-wins and fenced
  // against an account switch inside the store (features/directory/inboxCounts).
  useEffect(() => {
    const tick = () => {
      void refreshCommunityInbox(true);
      // Required here, not imported: keeps the alert-registration code (and the
      // device-id module) out of the app-start graph (perf start trim budget).
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      void (require('./src/features/notifications/communityPush') as typeof import('./src/features/notifications/communityPush')).syncCommunityDevice();
    };
    // The first read waits until the launch has settled (off the render path).
    const first = runSoon(tick, { idleTimeoutMs: 3000 });
    let timer: ReturnType<typeof setInterval> | null = setInterval(tick, 120_000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        tick();
        if (!timer) timer = setInterval(tick, 120_000);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      first.cancel();
      sub.remove();
      if (timer) clearInterval(timer);
    };
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

  // ⛔ APPLY AN OTA ON THIS LAUNCH, not the one after it (owner 2026-09-19).
  // ⚠️ The first version of this CRASHED a production build — it ran its own
  // check/fetch alongside the native one and reloaded mid-render. This one
  // only listens for the native downloader and reloads after interactions.
  // Read the crash note at the top of autoUpdate.ts before touching it.
  useEffect(() => startAutoUpdate(), []);

  /**
   * ⛔ DRAIN QUEUED STUDY PROGRESS ON LAUNCH AND ON EVERY FOREGROUND.
   *
   * Offline study batches persist to SQLite, but the only thing that ever
   * replayed them was a LIVE study session's flush. A learner who studied on
   * a train, got home to wifi and opened the app saw their pre-offline
   * numbers — the work looked lost until they happened to re-enter a study
   * method and stay there. Some of them would just do it again.
   *
   * Never throws into the launch path; the drain is internally serialised so
   * it cannot race a session's own flush.
   */
  useEffect(() => {
    const drain = () => {
      drainStudyQueue();
      // Scenarios keeps its own queue (different shape, different RPCs) and
      // needs the same launch/foreground push — see scenarioQueue.ts.
      void flushScenarioQueue().catch(() => {});
    };
    drain();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') drain();
    });
    return () => sub.remove();
  }, []);

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
      // Anonymous screen-view count (route NAME only — never params).
      trackScreen(navigationRef.getCurrentRoute()?.name);
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
  //
  // Phones only (owner 2026-09-29, Android large-screen pass): on a tablet
  // lockPortrait() UNLOCKS — see screenOrientationSafe / navOrientation. A
  // foldable changes class under a running app (folded = phone, unfolded =
  // tablet), so the rule is re-applied when — and only when — the display
  // class flips; a plain rotation never re-locks (a full screen may be up).
  useEffect(() => {
    try {
      lockPortrait();
    } catch {
      /* orientation is best-effort — never let it break boot */
    }
    let tablet = isTabletDisplay();
    const sub = Dimensions.addEventListener('change', () => {
      const now = isTabletDisplay();
      if (now === tablet) return;
      tablet = now;
      try {
        lockPortrait();
      } catch {
        /* best-effort */
      }
    });
    return () => sub.remove();
  }, []);

  // Hold on a dark surface until fonts resolve (avoids a white flash + FOUT) —
  // but a font-load ERROR falls through so a failed asset renders with system
  // fonts instead of hanging on a blank screen forever (bug audit 2026-09-09).
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.splashBg }} />;
  }

  // DEV + WEB ONLY: the browser preview harness (`#labpreview/<Screen>`,
  // `#rtapreview`, `#careerfinderpreview`, …). It lives in src/dev/webPreviews
  // and is REQUIRED here, inside the guard, so its ~80 lab and tool screens are
  // never evaluated on a phone or at app start (perf decision B, 2026-10-04).
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderWebPreview } = require('./src/dev/webPreviews') as typeof import('./src/dev/webPreviews');
    const preview = renderWebPreview(window.location.hash);
    if (preview) return <GestureHandlerRootView style={{ flex: 1 }}>{preview}</GestureHandlerRootView>;
  }

  return (
    // Gesture Handler's root (owner 2026-10-04, final lab): drags and pinch run
    // on the UI thread. It must sit above every view that uses a gesture. A
    // React Native <Modal> is a separate native root on Android, so a modal
    // that holds a gesture needs its own GestureHandlerRootView inside.
    <GestureHandlerRootView style={{ flex: 1 }}>
    {/* Last line of defence (QA night 2026-09-01): before this, ONE uncaught
        render error unmounted the whole app to a white screen with no way back. */}
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
        {/* Store purchases are listened for from BOOT, not just while the
            paywall is open (2026-09-18). Ask-to-Buy, SCA challenges and any
            purchase the store completes later used to land nowhere, so
            finishTransaction never ran — and an unacknowledged Google purchase
            is auto-refunded after 72 hours. Renders nothing. */}
        <PurchaseListenerRoot />
        {/* The glossary saves itself to the phone in the background for members
            (owner 2026-09-22: 5.4 MB, "seems small for a phone to carry"), so
            it is already there on a ship or a flight rather than waiting for
            someone to open the screen and find a button. Renders nothing, waits
            for launch to settle, and honours the off switch in Settings. */}
        <GlossaryPrefetchRoot />
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
                // …and a cold-start MEMBER alert tap.
                flushCommunityPathNav(openCommunityPath);
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
    </GestureHandlerRootView>
  );
}

// Sentry's root wrap (touch-event breadcrumbs + profiler); the bare App when
// telemetry is off.
export default wrapRoot(App);
