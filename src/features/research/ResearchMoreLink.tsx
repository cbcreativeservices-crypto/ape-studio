/**
 * The quiet "Research more ↗" text button under a term (owner 2026-10-24:
 * "minimal and not take much attention"). Opens the Research more popup.
 */
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { openResearchMore } from './researchLinks';

export function ResearchMoreLink({
  term,
  wikipediaUrl,
  style,
}: {
  term: string;
  wikipediaUrl?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  if (!term.trim()) return null;
  return (
    <Pressable
      onPress={() => openResearchMore(term, wikipediaUrl)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Research and learn more about ${term.trim()}`}
      style={[styles.wrap, style]}
    >
      <Text style={styles.text}>Research and learn more ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', paddingVertical: 4 },
  text: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub, letterSpacing: 0.2 },
});
