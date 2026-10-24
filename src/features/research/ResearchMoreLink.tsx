/**
 * The quiet line under a term (owner 2026-10-24: "minimal and not take much
 * attention"): "Research and learn more ↗ · View images ↗". The first opens
 * the Wikipedia / Google popup; the second opens Google Images directly.
 */
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { openResearchMore, openViewImages } from './researchLinks';

export function ResearchMoreLink({
  term,
  wikipediaUrl,
  style,
  textStyle,
}: {
  term: string;
  wikipediaUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const name = term.trim();
  if (!name) return null;
  return (
    <View style={[styles.row, style]}>
      <Pressable
        onPress={() => openResearchMore(name, wikipediaUrl)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Research and learn more about ${name}`}
      >
        <Text style={[styles.text, textStyle]}>Research and learn more ↗</Text>
      </Pressable>
      <Text style={[styles.text, textStyle]} accessible={false}>
        {'  ·  '}
      </Text>
      <Pressable
        onPress={() => openViewImages(name)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`View images of ${name}`}
      >
        <Text style={[styles.text, textStyle]}>View images ↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4 },
  text: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub, letterSpacing: 0.2 },
});
