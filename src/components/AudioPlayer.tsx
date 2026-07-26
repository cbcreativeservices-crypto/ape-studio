/**
 * AudioPlayer — S12 player panel, PLACEHOLDER EDITION (no native audio).
 *
 * expo-av was removed from this project on purpose: the EAS iOS build failed
 * with EXAV / ExpoModulesCore errors, and no Fall audio content exists to
 * play anyway. This component preserves the locked S12 layout and the same
 * prop contract ({ uri }) so ScenariosScreen is untouched (the EarTraining
 * study method that also used it was retired 2026-07-26, v4 MASTER §13), but
 * it imports NO audio module and renders the disabled state
 * permanently. When audio content ships (Spring) and the team picks a
 * working audio library for SDK 57+ (e.g. expo-audio), reimplement playback
 * here — callers won't change.
 *
 * Visuals (design-reference 20-s12-ear-training panel): 48px play/pause cap,
 * recessed progress bar, "N PLAYS" (left) + "m:ss / m:ss" mono (right).
 */
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';

export function AudioPlayer({ uri }: { uri: string | null }) {
  // No native audio module — always the disabled state. `uri` is accepted
  // (and ignored) to keep the caller contract stable for the Spring rewire.
  void uri;

  return (
    <View style={styles.card}>
      <View style={styles.pilotDot} />
      <View style={styles.mainRow}>
        <LinearGradient colors={['#3a3a3a', '#2a2a2a']} style={styles.playCap}>
          <Text style={styles.playGlyph}>▶</Text>
        </LinearGradient>
        <View style={styles.barTrack} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>NO AUDIO</Text>
        <Text style={styles.meta}>–:–– / –:––</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#060606',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  pilotDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playGlyph: { fontSize: 16, color: '#666666' },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#000000',
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: '#8f8f8f' },
});
