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
        // ALWAYS a search, '' when none (bug pass 3): popping back to a Help
        // that an earlier "?" pre-filled kept that old filter, because
        // HelpScreen re-applies the search only when one is sent.
        navigation.navigate('Help', { search: search ?? '' }, { pop: true });
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
  // Same reason as AccuracyNote's chip beside it (build 32 tester: the header
  // help keys "blend in with the page"): a #1e1e1e ring on #141414 was all but
  // invisible on a near-black header. Now the amber ring of HelpDot, the other
  // header "?" in the app. Size and hit area unchanged; static colours, so the
  // Low-Light wash dims it.
  key: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#2a2210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    lineHeight: 15,
    color: colors.amber,
  },
});
