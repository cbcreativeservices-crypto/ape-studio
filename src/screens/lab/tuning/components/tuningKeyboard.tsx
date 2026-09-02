/**
 * TuningKeyboard (spec Stage 1 §8, ch.11): a FIXED diatonic key strip. The
 * key geometry never moves; each key carries a small cents track with a
 * tuning marker at that system's deviation from equal temperament, the
 * signed cents, and the spelling. Selecting a key syncs every other display.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type TuningSystem, deviationFromEqualCents, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { ROLE } from './primitives';

const RANGE = 30; // ±cents shown on each key's track

export function TuningKeyboard({ system, selected, onSelect, rootHz }: { system: TuningSystem; selected: number; onSelect: (degreeIndex: number) => void; rootHz: number }) {
  return (
    <View style={styles.strip} accessibilityRole="tablist">
      {system.notes.map((n, i) => {
        const dev = deviationFromEqualCents(n);
        const pos = 50 + (Math.max(-RANGE, Math.min(RANGE, dev)) / RANGE) * 46;
        const role = Math.abs(dev) < 0.05 ? 'exact' : Math.abs(dev) < 10 ? 'near' : 'error';
        const sel = i === selected;
        const hz = frequencyFromRatio(rootHz, n.value.numericRatio);
        const a11y = `${n.spelling}${i === 7 ? ' octave' : ''}, ${system.shortName}, ${n.value.cents.toFixed(2)} cents above C, ${Math.abs(dev) < 0.05 ? 'exactly equal temperament' : `${Math.abs(dev).toFixed(2)} cents ${dev > 0 ? 'above' : 'below'} equal temperament`}, ${hz.toFixed(2)} hertz at the current reference.`;
        return (
          <Pressable key={i} onPress={() => onSelect(i)} style={[styles.key, sel && styles.keySel]} accessibilityRole="tab" accessibilityState={{ selected: sel }} accessibilityLabel={a11y}>
            <Text style={[styles.spelling, sel && { color: ROLE.active }]}>{n.spelling}</Text>
            <View style={styles.track}>
              <View style={styles.zero} />
              <View style={[styles.marker, { left: `${pos}%`, backgroundColor: ROLE[role] }]} />
            </View>
            <Text style={[styles.dev, { color: ROLE[role] }]}>{Math.abs(dev) < 0.05 ? '0' : `${dev > 0 ? '+' : '−'}${Math.abs(dev).toFixed(1)}`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 3 },
  key: { flex: 1, minHeight: 84, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#e8e8ec10', paddingVertical: 6, alignItems: 'center', justifyContent: 'space-between' },
  keySel: { borderColor: ROLE.active, backgroundColor: '#0f1a22' },
  spelling: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 13 },
  track: { width: '80%', height: 26, borderRadius: 4, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: colors.hairlineDim, justifyContent: 'center', overflow: 'hidden' },
  zero: { position: 'absolute', left: '50%', top: 3, bottom: 3, width: 1, backgroundColor: colors.textMuted },
  marker: { position: 'absolute', top: 5, bottom: 5, width: 4, marginLeft: -2, borderRadius: 2 },
  dev: { fontFamily: fonts.oswaldMedium, fontSize: 10.5 },
});
