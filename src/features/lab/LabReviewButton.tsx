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
import { markLabReviewed, useLabCompletion, useLabCompletionUnreadable, type LabKey } from './labCompletion';
import { useGuestWording } from '../commercial/useTier';
import { useLabPreview } from './labPreviewStore';
import { sessionCarryOpen } from './sessionCarry';
import { reviewCreditLine } from '../../screens/lab/kit/labEnd';
import { ProgressUnreadableNote } from '../../screens/lab/kit/ProgressUnreadableNote';

export function LabReviewButton({ labKey }: { labKey: LabKey }) {
  const { complete } = useLabCompletion(labKey);
  // The stored units could NOT BE READ (hunt 8, 2026-10-03; D51 / owner "do
  // 2"): a lab reviewed on an earlier visit would read "MARK AS REVIEWED" as
  // if it never was. The shared note says so; the button stays (marking again
  // is idempotent and merges with the stored copy once it reads).
  const unreadable = useLabCompletionUnreadable();
  // A guest's mark is held for this session only (final round C, 2026-10-03):
  // "counts toward your credit" is said only where it is true — the labs'
  // end-screen wording otherwise (kit/labEnd reviewCreditLine).
  const wording = useGuestWording();
  const preview = useLabPreview().active;
  const credit = reviewCreditLine({ guest: wording.guest, preview, carry: sessionCarryOpen(), account: wording.account });

  if (complete) {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <Text style={styles.doneText}>✓ REVIEWED</Text>
        <Text style={styles.sub}>{credit ?? 'This lab counts toward your Audio Fundamentals credit.'}</Text>
      </View>
    );
  }

  const button = (
    <Pressable
      style={styles.card}
      onPress={() => markLabReviewed(labKey)}
      accessibilityRole="button"
      accessibilityLabel="Mark this lab as reviewed"
    >
      <Text style={styles.btnText}>MARK AS REVIEWED</Text>
      <Text style={styles.sub}>
        This lab is an open workspace — mark it once you’ve worked through it.{' '}
        {credit ?? 'It counts toward your Audio Fundamentals credit.'}
      </Text>
    </Pressable>
  );
  if (!unreadable) return button;
  return (
    <View style={styles.stack}>
      <ProgressUnreadableNote />
      {button}
    </View>
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
  stack: { gap: 6, marginTop: 4 },
  cardDone: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.green },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
