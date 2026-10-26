/**
 * The quiet line under a term (owner 2026-10-24: "minimal and not take much
 * attention"): "Research and learn more ⧉ · View images ⧉". The first opens
 * the Wikipedia / Google popup; the second opens Google Images directly.
 * The mark after each is the owner's browser-window-with-arrow (WebLinkIcon,
 * 2026-10-26), which replaced the ↗ — same colour and size as the words.
 */
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { WebLinkIcon } from '../../components/WebLinkIcon';
import { colors, fonts } from '../../theme/tokens';
import { openResearchMore, openViewImages } from './researchLinks';

export function ResearchMoreLink({
  term,
  wikipediaUrl,
  searchQuery,
  style,
  textStyle,
}: {
  term: string;
  wikipediaUrl?: string | null;
  /** Per-term search phrase from the server (Comp B context); optional. */
  searchQuery?: string | null;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const name = term.trim();
  if (!name) return null;
  // The icon takes the words' own colour and size, whatever the host passes.
  const flat = StyleSheet.flatten([styles.text, textStyle]);
  const iconColor = typeof flat.color === 'string' ? flat.color : colors.textSub;
  const iconSize = Math.round((flat.fontSize ?? 13) * 1.1);
  return (
    <View style={[styles.row, style]}>
      <Pressable
        onPress={() => openResearchMore(name, wikipediaUrl, searchQuery)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Research and learn more about ${name}`}
      >
        <View style={styles.linkRow}>
          <Text style={[styles.text, textStyle]}>Research and learn more</Text>
          <WebLinkIcon size={iconSize} color={iconColor} />
        </View>
      </Pressable>
      <Text style={[styles.text, textStyle]} accessible={false}>
        {'  ·  '}
      </Text>
      <Pressable
        onPress={() => openViewImages(name, searchQuery)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`View images of ${name}`}
      >
        <View style={styles.linkRow}>
          <Text style={[styles.text, textStyle]}>View images</Text>
          <WebLinkIcon size={iconSize} color={iconColor} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4 },
  text: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub, letterSpacing: 0.2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
