/**
 * StudyAccessSheet — the Academy upsell shown ONLY when a non-member taps a
 * locked topic's study method (flashcards / homework / quiz) on the Dashboard
 * (owner copy 2026-08-13). Deliberately SEPARATE from the generic UpgradeSheet
 * ("ACADEMY MODE", used on locked course cards / tools / labs): this copy is
 * specific to the study gate and must not appear elsewhere.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/GlassButton';
import { colors, fonts } from '../../theme/tokens';

export function StudyAccessSheet({
  visible,
  onClose,
  onUnlock,
}: {
  visible: boolean;
  onClose: () => void;
  /** → the Academy paywall. */
  onUnlock: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.backdrop}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <Text style={styles.eyebrow}>ACADEMY STUDY</Text>
        <Text style={styles.title}>Ready to study this topic?</Text>
        <Text style={styles.body}>
          You can explore individual terms in the glossary for free. Academy membership unlocks the
          complete study path for this topic—including flashcards, practice activities, scenario
          questions, and the proficiency quiz.
        </Text>
        <Text style={styles.body}>
          Your progress is saved as you complete topics, earn achievements, and work toward
          certificates and verified completion records.
        </Text>

        <GlassButton label="UNLOCK ACADEMY ACCESS" tint="gold" height={50} fontSize={14} onPress={onUnlock} />

        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Not now">
          <Text style={styles.dismiss}>NOT NOW</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 19, lineHeight: 24, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  dismiss: {
    alignSelf: 'center',
    marginTop: 8,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.textSub,
  },
});
