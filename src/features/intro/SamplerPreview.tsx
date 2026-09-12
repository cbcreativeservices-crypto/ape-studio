/**
 * DEV + WEB harness for the first-run GUIDED LINEAR walkthrough
 * (`localhost:8090/#samplerpreview`).
 *
 * Drives FirstRunSampler's phases locally so the whole walkthrough can be
 * clicked in the browser: lead(step i) → "See it / Open it" → step-complete
 * recap → Next → … → end menu → Enter the app. (Real navigation is stubbed
 * here; the on-device flow is wired in FirstRunCoordinator.) Web+dev only.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { previewWidthFromHash, previewWidthLabel } from '../dev/previewWidth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { FirstRunSampler, type FlowPhase } from './FirstRunSampler';
import { SAMPLER_STOPS, type StopId } from './samplerStops';
import type { OnboardingChoice } from './onboardingFlow';

const LAST = SAMPLER_STOPS.length - 1;

export function SamplerPreview() {
  const width = previewWidthFromHash();
  // The BROWSER viewport - which is what the previewed screen's own window
  // APIs report, NOT the box below. See previewWidth.ts: routinely different.
  const { width: viewportW } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<FlowPhase>('lead');
  const [visited, setVisited] = useState<OnboardingChoice[]>([]);
  const [done, setDone] = useState(false);

  const reset = () => {
    setStepIndex(0);
    setPhase('lead');
    setVisited([]);
    setDone(false);
  };

  const markVisited = (id: StopId) => setVisited((v) => (v.includes(id) ? v : [...v, id]));

  const currentId = SAMPLER_STOPS[stepIndex].id;
  const nextStop: StopId | undefined = stepIndex < LAST ? SAMPLER_STOPS[stepIndex + 1].id : undefined;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Text style={styles.bar}>{previewWidthLabel('FIRST-RUN WALKTHROUGH', width, viewportW)}</Text>
        <View style={styles.controls}>
          <Pressable style={styles.ctl} onPress={reset}>
            <Text style={styles.ctlText}>RESET</Text>
          </Pressable>
          <Text style={styles.state}>
            {done ? 'state: HOME (complete)' : `phase: ${phase} · step ${stepIndex + 1}/${SAMPLER_STOPS.length} · seen ${visited.length}`}
          </Text>
        </View>
        <View style={[styles.phone, { width }]}>
          {done ? (
            <View style={styles.homeStub}>
              <Text style={styles.homeStubTitle}>→ Home screen</Text>
              <Text style={styles.homeStubSub}>Onboarding complete (permanent). Tap RESET to replay.</Text>
            </View>
          ) : (
            <FirstRunSampler
              phase={phase}
              stop={currentId}
              stepIndex={stepIndex}
              stepCount={SAMPLER_STOPS.length}
              nextStop={nextStop}
              visited={visited}
              onStart={() => {
                // Stub the destination: mark seen and jump to the recap.
                markVisited(currentId);
                setPhase('complete');
              }}
              onNext={() => {
                if (stepIndex < LAST) {
                  setStepIndex((i) => i + 1);
                  setPhase('lead');
                } else {
                  setPhase('end');
                }
              }}
              onEnter={() => setDone(true)}
              onSelect={(id) => markVisited(id)}
              onSkip={() => setDone(true)}
              onBack={
                phase === 'complete' || (phase === 'lead' && stepIndex > 0)
                  ? () => {
                      if (phase === 'complete') setPhase('lead');
                      else {
                        setStepIndex((i) => i - 1);
                        setPhase('lead');
                      }
                    }
                  : undefined
              }
            />
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0c', alignItems: 'center' },
  bar: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber, paddingVertical: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 8 },
  ctl: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#161616' },
  ctlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  state: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  phone: { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
  homeStub: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: colors.screenBg },
  homeStubTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: colors.textPrimary },
  homeStubSub: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.textSub, textAlign: 'center' },
});
