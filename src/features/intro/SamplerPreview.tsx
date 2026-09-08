/**
 * DEV + WEB harness for the first-run sampler screen
 * (`localhost:8090/#samplerpreview`).
 *
 * The sampler runs only on a brand-new first launch, so it can't be reviewed in
 * the normal app flow. This drives FirstRunSampler with local state: tap a card
 * to "sample" it (marks ✓ Explored and flips to the continuation mode); tap Home
 * to see the finished state. Reset restores the initial screen. Web+dev only —
 * this never mounts on device.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { FirstRunSampler, SAMPLER_CHOICES } from './FirstRunSampler';
import type { OnboardingChoice } from './onboardingFlow';

const WIDTHS = [360, 393, 412];

function widthFromHash(): number {
  const parts = (typeof window !== 'undefined' ? window.location.hash : '').split('/');
  const w = Number(parts[1]);
  return WIDTHS.includes(w) ? w : 393;
}

export function SamplerPreview() {
  const width = widthFromHash();
  const [visited, setVisited] = useState<OnboardingChoice[]>([]);
  const [mode, setMode] = useState<'initial' | 'continuation'>('initial');
  const [done, setDone] = useState(false);

  const reset = () => {
    setVisited([]);
    setMode('initial');
    setDone(false);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Text style={styles.bar}>
          {`FIRST-RUN SAMPLER @ ${width}px  ·  #samplerpreview/<360|393|412>`}
        </Text>
        <View style={styles.controls}>
          <Pressable style={styles.ctl} onPress={reset}>
            <Text style={styles.ctlText}>RESET</Text>
          </Pressable>
          <Text style={styles.state}>
            {done ? 'state: HOME (complete)' : `mode: ${mode}  ·  explored: ${visited.length}/${SAMPLER_CHOICES.length}`}
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
              mode={mode}
              visited={visited}
              onSelect={(c) => {
                // Simulate: open the destination (stubbed), sample it, return to
                // the continuation screen with it marked ✓ Explored.
                setVisited((v) => (v.includes(c) ? v : [...v, c]));
                setMode('continuation');
              }}
              onHome={() => setDone(true)}
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
  ctl: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#161616',
  },
  ctlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  state: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  phone: { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
  homeStub: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: colors.screenBg },
  homeStubTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: colors.textPrimary },
  homeStubSub: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.textSub, textAlign: 'center' },
});
