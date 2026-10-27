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
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemberGate } from './useTier';
import { Modal } from '../../components/DimModal';
import { GlassButton } from '../../components/GlassButton';
import { colors, fonts } from '../../theme/tokens';

/**
 * MY CUSTOM LIST VARIANT (popup review 2 D1, owner OK 2026-10-27). The list is
 * not a topic: it has no Topic Quiz and no "MEMBERS TOPIC", so the topic copy
 * was untrue for it. Its methods are studyGate `customListMethods()` plus its
 * own practice quiz (`customListHasQuiz()`) — all five since D12 (2026-10-27).
 * Adding terms is never gated (the Glossary toggle has no membership check),
 * so the body says so. The topic copy below is owner copy (2026-08-13) and is
 * unchanged.
 */
export const CUSTOM_LIST_SHEET_COPY = {
  eyebrow: '🔒 MY CUSTOM LIST',
  title: 'Studying My Custom List is part of Academy membership',
  how: 'To study it, tap UNLOCK ACADEMY ACCESS below and choose a membership. Your list opens the moment it is active.',
  howGuest:
    'To study it you need an account and a membership: tap UNLOCK ACADEMY ACCESS below, choose a membership, and create your account when asked (or sign in if you have one).',
  body: 'You can keep adding terms to your list from the Glossary. Membership lets you study them with flashcards, fill-in-the-blank, matching and scenarios, and take a practice quiz once your list has 30 terms.',
  freeTail: 'The whole study path, start to finish.',
} as const;

export function StudyAccessSheet({
  visible,
  onClose,
  onUnlock,
  freeTopicNames = [],
  onTryFree,
  guest = false,
  customList = false,
}: {
  /**
   * The sheet was opened from My Custom List (the dial is on it), not from a
   * topic: show `CUSTOM_LIST_SHEET_COPY` instead of the topic copy.
   */
  customList?: boolean;
  /**
   * A KNOWN guest (no account — `remindAsGuest(tier, useGuestWording().guest)`,
   * never a pending or unconfirmed member, D52). Owner, TestFlight build 32: a
   * guest tester was not told how to open a members topic. A membership is
   * attached to an account, so for a guest the how-to names the account step
   * first — the Paywall asks for it at the purchase ("Create an account first").
   */
  guest?: boolean;
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
  /**
   * BECAME A MEMBER WITH THE SHEET UP (toddler pass 2026-10-13): an Ask to Buy
   * approval or a purchase the root listener finished landed under an open
   * "Membership required" sheet, which kept offering UNLOCK to a member. Close
   * it on the change to 'open' (only then — never for a sheet opened as one).
   */
  const memberGate = useMemberGate();
  const prevMemberGate = useRef(memberGate);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const was = prevMemberGate.current;
    prevMemberGate.current = memberGate;
    if (visible && was !== 'open' && memberGate === 'open') closeRef.current();
  }, [memberGate, visible]);
  const offerFree = !!onTryFree && freeTopicNames.length > 0;
  const names =
    freeTopicNames.length > 1
      ? `${freeTopicNames.slice(0, -1).join(', ')} and ${freeTopicNames[freeTopicNames.length - 1]}`
      : freeTopicNames[0];
  return (
    /**
     * ⛔ A CENTRED POPUP, NOT A BOTTOM SHEET (owner, TestFlight 2026-09-28):
     * a free-account tester tapped a locked topic's flashcards, "it wasn't
     * opening", and nothing made it clear that membership was required or how
     * to get it. The old sheet was an in-tree bottom sheet inside the
     * Dashboard — the tab bar is drawn over the bottom of that screen, so the
     * sheet's own buttons sat under it and the learner saw a dimmed screen
     * that "did nothing". A Modal draws above everything, centred (the house
     * popup rule), and says it plainly: MEMBERSHIP REQUIRED, what is locked,
     * what is free, and how to unlock.
     */
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <ScrollView bounces={false} contentContainerStyle={{ gap: 12 }}>
        {customList ? (
          <>
            <Text style={styles.eyebrow}>{CUSTOM_LIST_SHEET_COPY.eyebrow}</Text>
            <Text style={styles.title}>{CUSTOM_LIST_SHEET_COPY.title}</Text>
            <Text style={styles.how}>{guest ? CUSTOM_LIST_SHEET_COPY.howGuest : CUSTOM_LIST_SHEET_COPY.how}</Text>
            <Text style={styles.body}>{CUSTOM_LIST_SHEET_COPY.body}</Text>
          </>
        ) : (
          <>
        <Text style={styles.eyebrow}>🔒 MEMBERS TOPIC</Text>
        <Text style={styles.title}>Membership required to study this topic</Text>
        <Text style={styles.how}>
          {guest
            ? 'To study it you need an account and a membership: tap UNLOCK ACADEMY ACCESS below, choose a membership, and create your account when asked (or sign in if you have one). Everything on this topic opens the moment the membership is active.'
            : 'To study it: tap UNLOCK ACADEMY ACCESS below and choose a membership. Everything on this topic opens the moment it is active.'}
        </Text>
        <Text style={styles.body}>
          You can explore individual terms in the glossary for free (14 definitions a
          week). Academy membership unlocks the complete study path for this topic—including flashcards,
          homework (fill-in-the-blank and matching), scenarios, and the Topic Quiz.
        </Text>
          </>
        )}
        <Text style={styles.body}>
          {/* Popup review C6 (owner OK 2026-10-26): a guest's work is never saved (D57). */}
          {guest ? 'With an account and membership, your progress is saved' : 'Your progress is saved'} as you
          complete topics, earn achievements, and work toward certificates and verified completion records.
        </Text>

        {offerFree ? (
          <View style={styles.freeCard}>
            <Text style={styles.freeEyebrow}>OPEN TO YOU RIGHT NOW</Text>
            <Text style={styles.freeBody}>
              {freeTopicNames.length > 1 ? 'Two topics are' : 'One topic is'} free to study in full:{' '}
              <Text style={styles.freeName}>{names}</Text>.{' '}
              {/* My Custom List variant: "Same … scenarios and quiz" compared the
                  free topics with a list that then had neither (D1); its quiz
                  is still a practice quiz, not a topic's, so the tail stays. */}
              {customList
                ? CUSTOM_LIST_SHEET_COPY.freeTail
                : 'Same flashcards, practice activities, scenarios and quiz—the whole path, start to finish.'}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3a3226',
    padding: 20,
  },
  how: {
    fontFamily: fonts.barlowMedium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    paddingLeft: 10,
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
