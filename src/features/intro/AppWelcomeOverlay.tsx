/**
 * AppWelcomeOverlay — the "Welcome to Pro Audio Training Academy" greeting shown
 * BEFORE the login screen on the very first app open (user request 2026-07-23).
 *
 * Rules:
 *  - Shows once (persisted via the shared screen-intro flag `ape:intro:appWelcome`);
 *    never again unless Settings → "Reset onboarding hints" clears it.
 *  - The "Let's get started" button only appears after a 9-second minimum, so the
 *    greeting can't be skipped instantly.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { LowLightDim } from '../settings/LowLightLayer';
import { SCREEN_INTROS } from './screenIntros';
import { useScreenIntro } from './ScreenIntroOverlay';
import { devBypass } from '../../config/devMode';

/** Governed dwell time (ratified: 9 s before "LET'S GET STARTED" appears).
 *  Left intact — the `instantIntros` dev bypass zeroes it only in __DEV__. */
const WELCOME_DELAY_MS = 9000;

export function AppWelcomeOverlay() {
  const { visible, dismiss } = useScreenIntro('appWelcome');
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCanContinue(false);
      return;
    }
    if (devBypass('instantIntros')) {
      setCanContinue(true);
      return;
    }
    setCanContinue(false);
    const t = setTimeout(() => setCanContinue(true), WELCOME_DELAY_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  const copy = SCREEN_INTROS.appWelcome;
  return (
    <Modal accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={() => {
        if (canContinue) dismiss();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
            <Text style={styles.title}>{copy.title}</Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{copy.body}</Text>
          </ScrollView>
          {canContinue ? (
            <Pressable style={styles.btn} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Let's get started">
              <Text style={styles.btnText}>LET’S GET STARTED</Text>
            </Pressable>
          ) : null}
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
  wait: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: 4,
  },
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
