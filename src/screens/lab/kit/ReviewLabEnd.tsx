/**
 * ReviewLabEnd — the small "what's left" end screen for the ONE-PAGE labs
 * credited by MARK AS REVIEWED (owner ruling 2026-10-14, #21): Understanding
 * Level & Amplitude, Sound Playground, Signal Chain Builder.
 *
 *   Owner hard rule: "Labs NEVER block navigation; every lab ends with a
 *   'what's left' screen." These three had none — the review button was the
 *   last thing on the page.
 *
 * A FINISH · SEE WHAT'S LEFT link (the shared in-flow LabEndLink) opens the
 * shared LabEndScreen over the lab — a full-screen layer, so the sandbox keeps
 * its state underneath and BACK TO THE LAB returns to it exactly as left. The
 * lab's one unit is its review; MARK AS REVIEWED is offered right there while
 * it is still left. PRACTISE AGAIN and the row both return to the lab (nothing
 * is cleared — a review, once given, is never taken back). DONE leaves the lab.
 * Nothing auto-appears (Low-Light Production Mode): only a tap opens it.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../../components/DimModal';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { LabReviewButton } from '../../../features/lab/LabReviewButton';
import { useLabCompletion, useLabCompletionUnreadable, type LabKey } from '../../../features/lab/labCompletion';
import { safeGoBack } from '../../../lib/safeGoBack';
import { runSoon } from '../../../lib/afterInteractions';
import { LabEndLink, LabEndScreen } from './LabEndScreen';
import { REVIEW_UNIT_ID, reviewLabUnits } from './labEnd';

const NONE: ReadonlySet<string> = new Set();
const REVIEWED: ReadonlySet<string> = new Set([REVIEW_UNIT_ID]);

export function ReviewLabEnd({
  labKey,
  labTitle,
  onOpen,
  stepLabel,
  stepDetail,
  offerReview = true,
}: {
  labKey: LabKey;
  labTitle: string;
  /** e.g. stop the lab's sound. */
  onOpen?: () => void;
  /** The one unit's words (default: work through it, then mark it reviewed). */
  stepLabel?: string;
  stepDetail?: string;
  /** false where the credit needs more than a tap (Amplitude: the ramp
   *  check) — the end screen then only points back to it. */
  offerReview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { complete } = useLabCompletion(labKey);
  const unreadable = useLabCompletionUnreadable();
  const close = () => setOpen(false);
  return (
    <>
      <LabEndLink
        onPress={() => {
          onOpen?.();
          setOpen(true);
        }}
      />
      <Modal visible={open} animationType="none" onRequestClose={close} statusBarTranslucent>
        <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Back to ${labTitle}`}>
              <Text style={styles.back}>‹ BACK TO THE LAB</Text>
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">Where you are</Text>
          </View>
          <LabEndScreen
            labTitle={labTitle}
            units={reviewLabUnits(stepLabel, stepDetail)}
            cleared={complete ? REVIEWED : NONE}
            unreadable={unreadable}
            mode="credit"
            noun="step"
            extra={complete || !offerReview ? undefined : <LabReviewButton labKey={labKey} />}
            onJump={close}
            onPracticeAgain={close}
            onDone={() => {
              close();
              // Off this tap, once the layer is closing (never two screens at once).
              runSoon(() => safeGoBack(navigation));
            }}
            bottomInset
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { paddingHorizontal: 16, paddingBottom: 4, gap: 4 },
  back: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, minHeight: 44, textAlignVertical: 'center', paddingTop: 12 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1 },
});
