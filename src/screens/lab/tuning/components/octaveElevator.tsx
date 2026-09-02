/**
 * OctaveElevator (spec Stage 1 §8, ch.3): three stacked octave regions, a
 * ratio tile that moves one region per ×2 / ÷2, the operation shown beside
 * it, and before/after values that stay visible. Reduced motion: immediate
 * before/after with the operation label retained.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type Frac, fracLabel, fracValue } from '../../../../features/tuning/tuningMath';
import { ROLE } from './primitives';

const REGION_H = 56;

/** Which region a ratio sits in: 0 = below (r < 1), 1 = comparison octave, 2 = above (r ≥ 2). */
const regionOf = (r: number) => (r < 1 ? 0 : r < 2 ? 1 : 2);

export function OctaveElevator({
  value, history, reduceMotion,
}: {
  /** Current exact ratio. */
  value: Frac;
  /** Operations already applied, oldest first, each with its result. */
  history: { op: '×2' | '÷2'; before: Frac; after: Frac }[];
  reduceMotion?: boolean;
}) {
  const y = useRef(new Animated.Value(regionY(regionOf(fracValue(value))))).current;
  useEffect(() => {
    const target = regionY(regionOf(fracValue(value)));
    if (reduceMotion) {
      y.setValue(target);
      return;
    }
    Animated.timing(y, { toValue: target, duration: 480, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [value, reduceMotion, y]);
  const v = fracValue(value);
  const inRange = v >= 1 && v < 2;
  const a11y = `Octave elevator. Current ratio ${fracLabel(value)}, ${inRange ? 'inside the comparison octave' : v >= 2 ? 'above the comparison octave' : 'below the comparison octave'}. ${history.map((h) => `${fracLabel(h.before)} ${h.op} = ${fracLabel(h.after)}`).join('; ')}`;
  return (
    <View style={styles.wrap} accessible accessibilityLabel={a11y}>
      <View style={styles.regions}>
        {['ABOVE · ratio ≥ 2', 'COMPARISON OCTAVE · 1 ≤ ratio < 2', 'BELOW · ratio < 1'].map((t, i) => (
          <View key={t} style={[styles.region, i === 1 && styles.regionMain]}>
            <Text style={[styles.regionLabel, i === 1 && { color: ROLE.exact }]}>{t}</Text>
          </View>
        ))}
        <Animated.View style={[styles.tile, { transform: [{ translateY: y }] }, inRange ? styles.tileIn : styles.tileOut]}>
          <Text style={[styles.tileText, { color: inRange ? ROLE.exact : ROLE.operation }]}>{fracLabel(value)}</Text>
        </Animated.View>
      </View>
      <View style={styles.ops}>
        {history.length === 0 ? <Text style={styles.opLine}>No operation yet.</Text> : null}
        {history.map((h, i) => (
          <Text key={i} style={styles.opLine}>
            <Text style={{ color: colors.textSecondary }}>{fracLabel(h.before)}</Text>
            <Text style={{ color: ROLE.octave, fontFamily: fonts.oswaldMedium }}>  {h.op}  </Text>
            <Text style={{ color: colors.textSecondary }}>= {fracLabel(h.after)}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

function regionY(region: 0 | 1 | 2): number {
  // region 2 (above) is the top row, 0 (below) the bottom row
  return (2 - region) * REGION_H + 10;
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  regions: { height: REGION_H * 3, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0a0a0c', overflow: 'hidden' },
  region: { height: REGION_H, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim, paddingHorizontal: 10, justifyContent: 'center' },
  regionMain: { backgroundColor: '#0f1a14' },
  regionLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  tile: { position: 'absolute', right: 14, top: 0, minWidth: 74, height: REGION_H - 20, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  tileIn: { borderColor: ROLE.exact, backgroundColor: '#0f2416' },
  tileOut: { borderColor: ROLE.operation, backgroundColor: '#1f1a0e' },
  tileText: { fontFamily: fonts.oswaldSemiBold, fontSize: 17 },
  ops: { gap: 2 },
  opLine: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 14 },
});
