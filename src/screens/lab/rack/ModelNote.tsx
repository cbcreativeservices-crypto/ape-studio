/**
 * ModelNote + DrawingPlaceholder — two small frame pieces (lab fix round 2,
 * phase 3, 2026-11-14; owner's decision 3: "do your recommendations for
 * these").
 *
 *   • ModelNote: the honesty disclosure as ONE plain sentence in sentence case
 *     ("This picture is a model of the EQ, not a meter."), instead of an
 *     all-caps "TEACHING MODEL · … · NOT A MEASUREMENT" line that "reads as a
 *     warning" (report pattern 10). Still on screen, never folded away: the
 *     accuracy rule does not let a disclosure be hidden to win space.
 *   • DrawingPlaceholder: a calm "drawing…" line on the dark glass while a
 *     display has not painted yet, instead of an empty black box that a
 *     beginner reads as broken (Game Audio, Foundations, Mic, Wave, Miking).
 */
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';

export const DRAWING_TEXT = 'drawing…';

/** One plain sentence, sentence case, small and grey. */
export function ModelNote({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.note, style]} numberOfLines={2} accessibilityRole="text">
      {text}
    </Text>
  );
}

/** Fills its parent (absolute) with the "drawing…" line. Not a touch target. */
export function DrawingPlaceholder() {
  return (
    <View style={styles.fill} pointerEvents="none" accessibilityLabel="The display is still drawing">
      <Text style={styles.drawing}>{DRAWING_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#8a8d94',
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 1,
    paddingHorizontal: 8,
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c0c0f' },
  drawing: { fontFamily: fonts.barlowMedium, fontSize: 13, letterSpacing: 0.4, color: '#7a7d84' },
});
