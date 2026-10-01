/**
 * OctaveElevator (spec Stage 1 §8, ch.3): three stacked octave regions, a
 * ratio tile that moves one region per ×2 / ÷2, the operation shown beside
 * it, and before/after values that stay visible. Reduced motion: immediate
 * before/after with the operation label retained.
 *
 * ON THE RACK (2026-09-30): the elevator is view-built (React Native Text,
 * not SVG), so FULL SCREEN cannot scale it through a viewBox. Given a `box`
 * it fills that (w, h) — each region a third of the height — and every
 * point constant (region height, tile size, font sizes) is multiplied by
 * useStageTextScale(), 1 on the glass and `rendered ÷ glass width` in full
 * screen, so the whole drawing zooms (D35). The history lines stay in the
 * well (the chapter prints them) — the glass carries the picture.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type Frac, fracLabel, fracValue } from '../../../../features/tuning/tuningMath';
import { useStageTextScale } from '../../rack/stageAspect';
import { ROLE } from './primitives';

const REGION_H = 56;

/** Which region a ratio sits in: 0 = below (r < 1), 1 = comparison octave, 2 = above (r ≥ 2). */
const regionOf = (r: number) => (r < 1 ? 0 : r < 2 ? 1 : 2);

export function OctaveElevator({
  value, history, reduceMotion, box, op = null,
}: {
  /** Current exact ratio. */
  value: Frac;
  /** Operations already applied, oldest first, each with its result. */
  history: { op: '×2' | '÷2'; before: Frac; after: Frac }[];
  reduceMotion?: boolean;
  /** Rack stage: fill this box; the history lines are left to the well. */
  box?: { w: number; h: number };
  /** The operation ABOUT to be applied (ch.3's SHOW OP step, review
   *  2026-09-30): printed beside the tile in the octave colour, so the key's
   *  press changes the glass — before, only a well line appeared, invisible
   *  in full screen. */
  op?: '×2' | '÷2' | null;
}) {
  const v = fracValue(value);
  const scale = useStageTextScale();
  // Region height: a third of the box on the glass, the fixed 56 inline.
  const regionH = box ? box.h / 3 : REGION_H;
  const tileH = Math.max(24, regionH - 20 * scale);
  const regionY = (region: 0 | 1 | 2) => (2 - region) * regionH + (regionH - tileH) / 2; // region 2 (above) is the top row
  const y = useRef(new Animated.Value(regionY(regionOf(v)))).current;
  // Keyed on the NUMBER, not the Frac object: chapters rebuild the fraction
  // every render, and re-running this on identity restarted the slide on
  // every parent re-render (each audio status tick).
  useEffect(() => {
    const target = regionY(regionOf(v));
    if (reduceMotion) {
      y.setValue(target);
      return;
    }
    Animated.timing(y, { toValue: target, duration: 480, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, reduceMotion, y, regionH, tileH]);
  const inRange = v >= 1 && v < 2;
  const a11y = `Octave elevator. Current ratio ${fracLabel(value)}, ${inRange ? 'inside the comparison octave' : v >= 2 ? 'above the comparison octave' : 'below the comparison octave'}.${op ? ` Next operation: ${op}.` : ''} ${history.map((h) => `${fracLabel(h.before)} ${h.op} = ${fracLabel(h.after)}`).join('; ')}`;
  const regionsStyle = box ? { width: box.w, height: box.h, borderRadius: 0, borderWidth: 0 } : { height: REGION_H * 3 };
  return (
    <View style={box ? undefined : styles.wrap} accessible accessibilityLabel={a11y}>
      <View style={[styles.regions, regionsStyle]}>
        {['ABOVE · ratio ≥ 2', 'COMPARISON OCTAVE · 1 ≤ ratio < 2', 'BELOW · ratio < 1'].map((t, i) => (
          <View key={t} style={[styles.region, { height: regionH, paddingHorizontal: 10 * scale }, i === 1 && styles.regionMain]}>
            <Text style={[styles.regionLabel, { fontSize: 9.5 * scale, letterSpacing: 1.5 * scale }, i === 1 && { color: ROLE.exact }]}>{t}</Text>
          </View>
        ))}
        <Animated.View style={[styles.tile, { right: 14 * scale, minWidth: 74 * scale, height: tileH, borderRadius: 8 * scale, paddingHorizontal: 10 * scale, transform: [{ translateY: y }] }, inRange ? styles.tileIn : styles.tileOut]}>
          <Text style={[styles.tileText, { fontSize: 17 * scale, color: inRange ? ROLE.exact : ROLE.operation }]}>{fracLabel(value)}</Text>
        </Animated.View>
        {op ? (
          <Animated.View pointerEvents="none" style={[styles.opTag, { right: (14 + 74 + 10) * scale, height: tileH, transform: [{ translateY: y }] }]}>
            <Text style={[styles.opTagText, { fontSize: 15 * scale, letterSpacing: 1 * scale }]}>{op === '÷2' ? '▼ ÷2' : '▲ ×2'}</Text>
          </Animated.View>
        ) : null}
      </View>
      {box ? null : (
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
      )}
    </View>
  );
}

/** The history lines on their own — the rack chapter prints them in the well
 *  under the stage, where the elevator itself no longer lists them. */
export function ElevatorHistory({ history }: { history: { op: '×2' | '÷2'; before: Frac; after: Frac }[] }) {
  return (
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
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  regions: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0a0a0c', overflow: 'hidden' },
  region: { borderBottomWidth: 1, borderBottomColor: colors.hairlineDim, justifyContent: 'center' },
  regionMain: { backgroundColor: '#0f1a14' },
  regionLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium },
  tile: { position: 'absolute', top: 0, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tileIn: { borderColor: ROLE.exact, backgroundColor: '#0f2416' },
  tileOut: { borderColor: ROLE.operation, backgroundColor: '#1f1a0e' },
  tileText: { fontFamily: fonts.oswaldSemiBold },
  opTag: { position: 'absolute', top: 0, justifyContent: 'center' },
  opTagText: { fontFamily: fonts.oswaldSemiBold, color: ROLE.octave },
  ops: { gap: 2 },
  opLine: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 14 },
});
