/**
 * LabReviewButton — the honest completion control for the exploratory labs that
 * have no modules, sections, or challenge to "clear" (owner 2026-08-12, §1.7:
 * no fabricated progress). The learner tells us when they've worked through a
 * read-through / sandbox lab; that records the R6c completion for its lab key.
 *
 * Used by: Understanding Level & Amplitude, Sound Playground, Signal Chain
 * Builder. Idempotent — once reviewed it stays reviewed (no un-review).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { markLabReviewed, useLabCompletion, type LabKey } from './labCompletion';

export function LabReviewButton({ labKey }: { labKey: LabKey }) {
  const { complete } = useLabCompletion(labKey);

  if (complete) {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <Text style={styles.doneText}>✓ REVIEWED</Text>
        <Text style={styles.sub}>This lab counts toward your Audio Fundamentals credit.</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => markLabReviewed(labKey)}
      accessibilityRole="button"
      accessibilityLabel="Mark this lab as reviewed"
    >
      <Text style={styles.btnText}>MARK AS REVIEWED</Text>
      <Text style={styles.sub}>
        This lab is an open workspace — mark it once you’ve worked through it. It counts toward your
        Audio Fundamentals credit.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2b2b31',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 5,
    marginTop: 4,
  },
  cardDone: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.green },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
