/**
 * AppWelcomeOverlay — the "Welcome to Pro Audio Training Academy" greeting shown
 * BEFORE the login screen on the very first app open (user request 2026-07-23).
 *
 * Rules:
 *  - Shows once (persisted via the shared screen-intro flag `ape:intro:appWelcome`);
 *    never again unless Settings → "Reset onboarding hints" clears it.
 *  - "Let's get started" is live from the first frame (owner 2026-09-20). The
 *    9-second minimum is gone; see the note on the component.
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { colors, fonts } from '../../theme/tokens';
import { LowLightDim } from '../settings/LowLightLayer';
import { SCREEN_INTROS } from './screenIntros';
import { useScreenIntro } from './ScreenIntroOverlay';

/**
 * ⛔ NO DWELL. "LET'S GET STARTED" IS THERE FROM THE FIRST FRAME
 * (owner 2026-09-20: "take the timer off of the intro pop ups, make them
 * tappable to close immediately").
 *
 * This supersedes the ratified 9-second hold (APE_BACKEND_HANDOFF_2026_07_23
 * §2.3) — the owner ratified it and has now withdrawn it.
 *
 * The strongest argument for removing it is in the code it required: this is
 * the FIRST screen a new user ever sees, it held for nine seconds, and the
 * button did not exist until the end. That is indistinguishable from a freeze,
 * which is why it needed a "ONE MOMENT…" line and then a VoiceOver
 * announcement so a blind user would not conclude the app had hung. A hold
 * that has to reassure people it is not a crash is not making anyone read
 * more carefully — and a reader who wants the time can simply take it.
 */
export function AppWelcomeOverlay() {
  const { visible, dismiss } = useScreenIntro('appWelcome');

  if (!visible) return null;
  const copy = SCREEN_INTROS.appWelcome;
  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
            <Text style={styles.title}>{copy.title}</Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{copy.body}</Text>
          </ScrollView>
          <Pressable style={styles.btn} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Let's get started">
            <Text style={styles.btnText}>LET’S GET STARTED</Text>
          </Pressable>
        </View>
      </View>
      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxHeight: '84%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 20,
    gap: 12,
  },
  scroll: { gap: 10 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, lineHeight: 29, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1, marginBottom: 4 },
  body: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  btn: {
    alignSelf: 'center',
    marginTop: 2,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.1)',
  },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: '#37e05f' },
});
