/**
 * BezelReadouts — the readouts printed ON the display: a strip of backlit
 * legend windows under the stage glass (the "readouts inside the display"
 * global default; per-viz IN-CANVAS readouts remain a phase-2 upgrade path).
 * Carries ReadoutGrid's {k, v, helpKey} contract so wave/digital readout
 * items map across 1:1. Long-press a cell = its guided-lesson entry; cells
 * with onPress keep the tools' tap-to-reset behavior. New component → fonts
 * at the MIN_FONT 12 floor.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { BezelItem } from './rackTypes';

export function BezelReadouts({
  items,
  onGuide,
  onHelp,
}: {
  items: BezelItem[];
  /** ⓘ display-guide slot at the strip's end. */
  onGuide?: () => void;
  onHelp?: (helpKey?: string) => void;
}) {
  return (
    <View style={styles.strip}>
      {items.map((it, i) => (
        <Pressable
          key={`${it.k}${i}`}
          style={[styles.cell, { flex: it.flex ?? 1 }, i === 0 && styles.cellFirst]}
          onPress={it.onPress}
          onLongPress={it.helpKey ? () => onHelp?.(it.helpKey) : undefined}
          delayLongPress={350}
          disabled={!it.onPress && !it.helpKey}
          accessibilityRole={it.onPress ? 'button' : 'text'}
          accessibilityLabel={`${it.k}: ${it.v}${it.helpKey ? ' — long-press for its lesson' : ''}`}
        >
          <Text style={styles.k} numberOfLines={1}>
            {it.k}
          </Text>
          <Text style={[styles.v, it.tint ? { color: it.tint } : null]} numberOfLines={1}>
            {it.v}
          </Text>
        </Pressable>
      ))}
      {onGuide ? (
        <Pressable
          style={styles.guide}
          onPress={onGuide}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="What the display shows"
        >
          <Text style={styles.guideGlyph}>ⓘ</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#3a3a44',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#121316',
    overflow: 'hidden',
    minHeight: 44, // interactive cells (tap-to-reset / long-press lesson)
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#26262c',
    gap: 1,
  },
  cellFirst: { borderLeftWidth: 0 },
  k: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  v: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.amber },
  guide: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#26262c',
  },
  guideGlyph: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSub },
});
