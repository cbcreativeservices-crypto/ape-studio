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
import { StyleSheet, View } from 'react-native';
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

  if (!hydrated || complete || !armed || !onMain) return null;

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
