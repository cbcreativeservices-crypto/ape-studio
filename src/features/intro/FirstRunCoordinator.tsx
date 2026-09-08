/**
 * FirstRunCoordinator — drives the first-launch connected path (plan §2.1–§2.3)
 * as a root overlay beside the navigator (same pattern as LabPreviewOverlay).
 *
 * How it works without fighting the navigator:
 *  - It shows the sampler overlay ONLY while the root stack is sitting on "Main"
 *    (the Home area) and onboarding isn't complete. Picking a stop navigates to
 *    that existing screen — the root route is no longer "Main", so the overlay
 *    hides itself and the real screen is fully usable. When the user comes back
 *    to Main (any back path), the overlay reappears in its CONTEXTUAL mode,
 *    recapping the last stop and recommending the connected next steps.
 *  - While a stop is open, sampling is ACTIVE, which hushes that screen's
 *    educational overlays (intros/coach-marks/amplitude gate) — never its
 *    permission/safety/entitlement gates.
 *  - "Take me to Home" (or Skip) marks onboarding complete permanently.
 *
 * Renders nothing once onboarding is complete. Web preview of the screen itself
 * lives at #samplerpreview (SamplerPreview); this is the on-device wiring.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { navigationRef } from '../../navigation/navigationRef';
import { FirstRunSampler } from './FirstRunSampler';
import { getStop, type StopId } from './samplerStops';
import { markChoiceVisited, setOnboardingComplete, useOnboardingFlow } from './onboardingFlow';
import { setSamplingActive } from './onboardingSampling';

/** Root-stack route name that means "the user is in the Home tabs", i.e. at a
 *  menu moment rather than inside a sampled destination. */
const HOME_ROUTE = 'Main';

function rootTopRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const state = navigationRef.getRootState();
  return state?.routes?.[state.index]?.name;
}

export function FirstRunCoordinator() {
  const { complete, visited, hydrated } = useOnboardingFlow();
  const insets = useSafeAreaInsets();
  const [onMain, setOnMain] = useState(false);
  const [armed, setArmed] = useState(false);
  const [lastStop, setLastStop] = useState<StopId | undefined>(undefined);
  const [forceMenu, setForceMenu] = useState(false);
  const wasMainRef = useRef(false);

  // Small arming delay so the app-welcome / commitment overlays lead, and so we
  // don't probe the navigator before it's ready.
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Poll the ROOT route so we know whether we're at the Home area (menu moment)
  // or inside a sampled destination. Polling (not just a state listener) keeps
  // this robust across the navigator becoming ready after mount. Stops once
  // onboarding is complete.
  useEffect(() => {
    if (complete) return;
    const tick = () => {
      const nowMain = rootTopRouteName() === HOME_ROUTE;
      setOnMain(nowMain);
      // Just returned to the Home area from a sampled destination → leave
      // sampling mode so educational overlays behave normally again.
      if (nowMain && !wasMainRef.current) setSamplingActive(false);
      wasMainRef.current = nowMain;
    };
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [complete]);

  const mode: 'initial' | 'recommend' | 'menu' = forceMenu
    ? 'menu'
    : lastStop
      ? 'recommend'
      : 'initial';

  const onSelect = (id: StopId) => {
    markChoiceVisited(id);
    setLastStop(id);
    setForceMenu(false);
    setSamplingActive(true);
    const { route } = getStop(id);
    // Cast: the coordinator lives outside the typed navigator.
    (navigationRef.navigate as (name: string, params?: object) => void)(route.name, route.params);
  };

  const onHome = () => {
    setSamplingActive(false);
    setOnboardingComplete();
  };

  // Return from a sampled destination to the walkthrough (the continuation
  // screen). Uses the navigator's own back; falls back to Main if the stack
  // can't pop — so the user is NEVER stranded on a screen with no back control.
  const backToGuide = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
    else (navigationRef.navigate as (name: string) => void)('Main');
  };

  if (!hydrated || complete || !armed) return null;

  // At the Home area → the walkthrough menu / recap overlay.
  if (onMain) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        <FirstRunSampler
          mode={mode}
          lastStop={lastStop}
          visited={visited}
          onSelect={onSelect}
          onChooseDifferent={() => setForceMenu(true)}
          onHome={onHome}
        />
      </View>
    );
  }

  // A stop is open (we sent them there) → a persistent floating escape so they
  // can always get back to the walkthrough or leave onboarding, even on a screen
  // with no back button of its own (the glossary stranding bug, 2026-09-07).
  if (lastStop) {
    return (
      <View style={[styles.escapeWrap, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        <View style={styles.escapeBar}>
          <Pressable onPress={backToGuide} accessibilityRole="button" accessibilityLabel="Back to the walkthrough" style={styles.escapeBack}>
            <Text style={styles.escapeBackText}>‹ Back to the walkthrough</Text>
          </Pressable>
          <Pressable onPress={onHome} accessibilityRole="button" accessibilityLabel="Skip the intro" style={styles.escapeSkip}>
            <Text style={styles.escapeSkipText}>Skip intro</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  escapeWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  escapeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(10,10,12,.92)',
  },
  escapeBack: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.7)',
    backgroundColor: 'rgba(255,198,77,.12)',
  },
  escapeBackText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.4, color: colors.amber },
  escapeSkip: { paddingVertical: 9, paddingHorizontal: 12 },
  escapeSkipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.5, color: colors.textSub },
});
