/**
 * StudyAccessSheet — the Academy upsell shown ONLY when a non-member taps a
 * locked topic's study method (flashcards / homework / quiz) on the Dashboard
 * (owner copy 2026-08-13). Deliberately SEPARATE from the generic UpgradeSheet
 * ("ACADEMY MODE", used on locked course cards / tools / labs): this copy is
 * specific to the study gate and must not appear elsewhere.
 *
 * FREE-TOPIC OFFER (owner 2026-09-17): the sheet used to present one door —
 * pay, or go away. But the two auto-enrolled free topics (FREE_ENROLL_GS:
 * Pro Audio Safety gs3060 and DAW Fundamentals & Session Management gs3970)
 * are ALREADY fully studyable at every tier, guests included — `studyMethodLocked`
 * only gates a topic whose gs is not in that list. A learner who hits this sheet
 * has just been told "no" while a complete, free run of the same machinery sits
 * one tap away and nothing on screen said so. The sheet now names those topics
 * and offers to open one.
 *
 * Honesty: the offer claims a COMPLETE study path (all four methods + the quiz),
 * because that is exactly what the free topics give. It claims nothing about
 * saved progress — a guest's progress is on-device only, which the Dashboard's
 * own banner states.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/GlassButton';
import { colors, fonts } from '../../theme/tokens';

export function StudyAccessSheet({
  visible,
  onClose,
  onUnlock,
  freeTopicNames = [],
  onTryFree,
}: {
  visible: boolean;
  onClose: () => void;
  /** → the Academy paywall. */
  onUnlock: () => void;
  /** Names of the free topics this user can open right now, in display order.
   *  Empty → the free offer is hidden entirely rather than promising nothing. */
  freeTopicNames?: readonly string[];
  /** Open the first free topic on the Dashboard. Omitted → offer hidden. */
  onTryFree?: () => void;
}) {
  if (!visible) return null;
  const offerFree = !!onTryFree && freeTopicNames.length > 0;
  const names =
    freeTopicNames.length > 1
      ? `${freeTopicNames.slice(0, -1).join(', ')} and ${freeTopicNames[freeTopicNames.length - 1]}`
      : freeTopicNames[0];
  return (
    // accessibilityViewIsModal keeps VoiceOver inside the sheet (pass 5, W1):
    // this backdrop is a plain sibling, so without it VoiceOver walks straight
    // past the sheet into the screen the sheet is covering.
    <View style={styles.backdrop} accessibilityViewIsModal>
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

        {offerFree ? (
          <View style={styles.freeCard}>
            <Text style={styles.freeEyebrow}>OPEN TO YOU RIGHT NOW</Text>
            <Text style={styles.freeBody}>
              {freeTopicNames.length > 1 ? 'Two topics are' : 'One topic is'} free to study in full:{' '}
              <Text style={styles.freeName}>{names}</Text>. Same flashcards, practice activities,
              scenarios and quiz—the whole path, start to finish.
            </Text>
          </View>
        ) : null}

        <GlassButton label="UNLOCK ACADEMY ACCESS" tint="gold" height={50} fontSize={14} onPress={onUnlock} />

        {offerFree ? (
          <GlassButton
            label={freeTopicNames.length > 1 ? 'START A FREE TOPIC' : `START ${freeTopicNames[0].toUpperCase()}`}
            tint="green"
            height={46}
            fontSize={13}
            onPress={onTryFree}
          />
        ) : null}

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
  // The free offer reads as its own object, not a fourth paragraph of sales
  // copy — green because that is the app's free/go colour (categorical tint,
  // never the amplitude ramp).
  freeCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,0.45)',
    backgroundColor: 'rgba(55,224,95,0.07)',
    padding: 12,
    gap: 4,
  },
  freeEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: '#37e05f' },
  freeBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  freeName: { fontFamily: fonts.barlowMedium, color: colors.textPrimary },
  dismiss: {
    alignSelf: 'center',
    marginTop: 8,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.textSub,
  },
});
