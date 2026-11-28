/**
 * HelpKey — the consistent per-screen Help key (Pillar C, plan §4; WCAG
 * Consistent Help). A small key that opens the Help hub, optionally landing
 * with the search pre-filled so the answers for THIS screen surface first.
 * Same look and placement (header right) everywhere it appears.
 *
 * ⛔ IT SAYS "HELP" IN WORDS (lab fix round 1, 2026-11-14, section 3 row 6 /
 * quick win 6; owner: "Begin fixing all bugs found and do obvious ... fixes
 * as you suggested in the report"). As a bare "?" beside the screen guide's ⓘ
 * and the accuracy chip, "a beginner cannot tell them apart" (G2, G8, G4):
 * one explains the screen, one opens the app's Help. The word says which.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme/tokens';
import { labProbe } from '../features/lab/labProbe';

/** The key's word (row 6). */
export const HELP_KEY_TEXT = 'HELP';

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
      <Text style={styles.glyph} maxFontSizeMultiplier={1.3}>{HELP_KEY_TEXT}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Same reason as AccuracyNote's chip beside it (build 32 tester: the header
  // help keys "blend in with the page"): a #1e1e1e ring on #141414 was all but
  // invisible on a near-black header. Now the amber ring of HelpDot, the other
  // header "?" in the app. Size and hit area unchanged; static colours, so the
  // Low-Light wash dims it.
  // 24 pt tall as before; a word now, so the width follows it (min 24).
  key: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#2a2210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: colors.amber,
  },
});
