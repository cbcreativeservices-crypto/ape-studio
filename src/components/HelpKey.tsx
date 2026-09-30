/**
 * HelpKey — the consistent per-screen "?" (Pillar C, plan §4; WCAG Consistent
 * Help). A small circled key that opens the Help hub, optionally landing with
 * the search pre-filled so the answers for THIS screen surface first. Same
 * look and placement (header right) everywhere it appears.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme/tokens';
import { labProbe } from '../features/lab/labProbe';

export function HelpKey({ search }: { search?: string }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => {
        labProbe('? pressed'); // TEMP probe
        // `pop: true` (bug hunt 2026-09-30, pass 2): React Navigation 7's
        // navigate() PUSHES a second Help when one is already lower in the
        // stack (Help → a linked screen → ?), so BACK walked through two.
        // Popping back to the existing Help keeps one, with these params.
        navigation.navigate('Help', search ? { search } : undefined, { pop: true });
      }}
      hitSlop={10}
      style={({ pressed }) => [styles.key, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel="Help for this screen"
    >
      <Text style={styles.glyph}>?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    lineHeight: 15,
    color: colors.textSubAlt,
  },
});
