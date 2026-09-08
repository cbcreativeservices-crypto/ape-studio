/**
 * FirstRunCoordinator — drives the first-launch GUIDED LINEAR walkthrough
 * (plan §2.1–§2.6) as a root overlay beside the navigator.
 *
 * The user is walked through the stops IN ORDER (no skip-ahead):
 *   lead(step i) → open the stop → [real: leave the overlay, show a persistent
 *   escape bar; canned: show the demo] → complete(step i) recap → Next →
 *   lead(step i+1) → … → after the last step, the END menu (revisit any) →
 *   "Enter Pro Audio Training Academy" (marks onboarding complete, lands Home).
 *
 * Real stops navigate to their existing screen with educational overlays hushed
 * (sampling); canned stops render a self-contained look-real demo (built in a
 * later step — for now they advance straight to their recap). A "Skip intro"
 * escape is always available. Renders nothing once onboarding is complete.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { navigationRef } from '../../navigation/navigationRef';
import { FirstRunSampler, type FlowPhase } from './FirstRunSampler';
import { SAMPLER_STOPS, getStop, type StopId } from './samplerStops';
import { markChoiceVisited, setOnboardingComplete, useOnboardingFlow } from './onboardingFlow';
import { setSamplingActive } from './onboardingSampling';

const HOME_ROUTE = 'Main';
const LAST_INDEX = SAMPLER_STOPS.length - 1;

// ⏸ PARKED (owner 2026-09-08): the first-run walkthrough is set aside until it's
// finished — the app must NOT show it on entry. Flip back to `true` to re-enable.
// The `#samplerpreview` web harness (SamplerPreview) still renders the screen for
// continued development, so this only disables the on-device first-run trigger.
const FIRST_RUN_ENABLED = false;

/** Internal phase: the visible FlowPhase plus 'sampling' (a real stop is open). */
type Phase = FlowPhase | 'sampling';

function rootTopRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const state = navigationRef.getRootState();
  return state?.routes?.[state.index]?.name;
}

export function FirstRunCoordinator() {
  // Parked — never mount the first-run walkthrough on entry (owner 2026-09-08).
  // Constant every render, so hook order stays consistent.
  if (!FIRST_RUN_ENABLED) return null;
  const { complete, visited, hydrated } = useOnboardingFlow();
  const insets = useSafeAreaInsets();
  const [onMain, setOnMain] = useState(false);
  const [armed, setArmed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('lead');
  const phaseRef = useRef<Phase>('lead');
  const revisitingRef = useRef(false);
  const wasMainRef = useRef(false);
  phaseRef.current = phase;

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Poll the root route. On return to Home from a REAL stop (phase 'sampling'),
  // advance to the step-complete recap (or back to the end menu if revisiting).
  useEffect(() => {
    if (complete) return;
    const tick = () => {
      const nowMain = rootTopRouteName() === HOME_ROUTE;
      setOnMain(nowMain);
      if (nowMain && !wasMainRef.current && phaseRef.current === 'sampling') {
        setSamplingActive(false);
        const backToEnd = revisitingRef.current;
        revisitingRef.current = false;
        setPhase(backToEnd ? 'end' : 'complete');
      }
      wasMainRef.current = nowMain;
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [complete]);

  const openStop = (id: StopId, revisit: boolean) => {
    markChoiceVisited(id);
    const stop = getStop(id);
    if (stop.canned) {
      // Canned demo not yet built (plan §2.6, build #2/#3) → for now, count it
      // seen and go straight to its recap (or back to the end menu on revisit).
      setPhase(revisit ? 'end' : 'complete');
      return;
    }
    revisitingRef.current = revisit;
    setSamplingActive(true);
    setPhase('sampling');
    (navigationRef.navigate as (name: string, params?: object) => void)(stop.route.name, stop.route.params);
  };

  const onStart = () => openStop(SAMPLER_STOPS[stepIndex].id, false);

  const onNext = () => {
    if (stepIndex < LAST_INDEX) {
      setStepIndex((i) => i + 1);
      setPhase('lead');
    } else {
      setPhase('end');
    }
  };

  // Step backward: from a recap back to this step's lead; from a lead back to
  // the previous step's lead. (End menu has its own navigation.)
  const onBack = () => {
    if (phase === 'complete') setPhase('lead');
    else if (phase === 'lead' && stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setPhase('lead');
    }
  };
  const canBack = phase === 'complete' || (phase === 'lead' && stepIndex > 0);

  const finish = () => {
    setSamplingActive(false);
    setOnboardingComplete();
  };

  const backToGuide = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
    else (navigationRef.navigate as (name: string) => void)('Main');
  };

  if (!hydrated || complete || !armed) return null;

  // A real stop is open → persistent escape so the user is never stranded.
  if (!onMain) {
    if (phase !== 'sampling') return null;
    return (
      <View style={[styles.escapeWrap, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        <View style={styles.escapeBar}>
          <Pressable onPress={backToGuide} accessibilityRole="button" accessibilityLabel="Back to the walkthrough" style={styles.escapeBack}>
            <Text style={styles.escapeBackText}>‹ Back to the walkthrough</Text>
          </Pressable>
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip the intro" style={styles.escapeSkip}>
            <Text style={styles.escapeSkipText}>Skip intro</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // At Home and mid-transition from a stop → wait a tick for the poll to flip
  // 'sampling' to its recap (avoids a one-frame flash of the wrong panel).
  if (phase === 'sampling') return null;

  const currentId = SAMPLER_STOPS[stepIndex].id;
  const nextStop: StopId | undefined = stepIndex < LAST_INDEX ? SAMPLER_STOPS[stepIndex + 1].id : undefined;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <FirstRunSampler
        phase={phase}
        stop={currentId}
        stepIndex={stepIndex}
        stepCount={SAMPLER_STOPS.length}
        nextStop={nextStop}
        visited={visited}
        onStart={onStart}
        onNext={onNext}
        onEnter={finish}
        onSelect={(id) => openStop(id, true)}
        onSkip={finish}
        onBack={canBack ? onBack : undefined}
      />
    </View>
  );
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
