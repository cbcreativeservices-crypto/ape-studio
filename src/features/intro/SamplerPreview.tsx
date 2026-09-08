/**
 * DEV + WEB harness for the first-run connected-path screen
 * (`localhost:8090/#samplerpreview`).
 *
 * Drives FirstRunSampler with local state so the whole connected loop can be
 * clicked in the browser: initial → pick a stop → contextual recommendation
 * (recap + next steps) → pick another or "choose something different" (full
 * menu) → Home. Reset restores the start. Web+dev only; never mounts on device.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { FirstRunSampler } from './FirstRunSampler';
import { SAMPLER_STOPS, type StopId } from './samplerStops';
import type { OnboardingChoice } from './onboardingFlow';

const WIDTHS = [360, 393, 412];

function widthFromHash(): number {
  const parts = (typeof window !== 'undefined' ? window.location.hash : '').split('/');
  const w = Number(parts[1]);
  return WIDTHS.includes(w) ? w : 393;
}

type Mode = 'initial' | 'recommend' | 'menu';

export function SamplerPreview() {
  const width = widthFromHash();
  const [visited, setVisited] = useState<OnboardingChoice[]>([]);
  const [mode, setMode] = useState<Mode>('initial');
  const [lastStop, setLastStop] = useState<StopId | undefined>(undefined);
  const [done, setDone] = useState(false);

  const reset = () => {
    setVisited([]);
    setMode('initial');
    setLastStop(undefined);
    setDone(false);
  };

  const sample = (id: StopId) => {
    // Simulate opening the destination, then returning to the contextual recap.
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
    setLastStop(id);
    setMode('recommend');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Text style={styles.bar}>{`FIRST-RUN PATH @ ${width}px  ·  #samplerpreview/<360|393|412>`}</Text>
        <View style={styles.controls}>
          <Pressable style={styles.ctl} onPress={reset}>
            <Text style={styles.ctlText}>RESET</Text>
          </Pressable>
          <Text style={styles.state}>
            {done
              ? 'state: HOME (complete)'
              : `mode: ${mode}${lastStop ? ` · last: ${lastStop}` : ''} · explored: ${visited.length}/${SAMPLER_STOPS.length}`}
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
              lastStop={lastStop}
              visited={visited}
              onSelect={sample}
              onChooseDifferent={() => setMode('menu')}
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
  ctl: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#161616' },
  ctlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  state: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  phone: { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
  homeStub: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: colors.screenBg },
  homeStubTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: colors.textPrimary },
  homeStubSub: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.textSub, textAlign: 'center' },
});
