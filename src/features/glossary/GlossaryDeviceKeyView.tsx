/**
 * The NOT NOW state of the glossary device-key consent (owner 2026-09-13).
 *
 * ⚠️ "It must be re-askable — never a dead end, and never a state the user
 * cannot get out of without reinstalling." (build plan). So this card carries
 * THREE ways forward and no way to get stuck: allow it after all, sign in to a
 * real account instead, or leave. Declining is remembered for the visit only —
 * nothing is written to storage — which is the honest reading of "nothing was
 * stored".
 *
 * Visually this is `GlossaryLockView` wearing a key instead of a padlock: same
 * scrim, card, type ramp and button ladder. One voice for "the glossary is not
 * open right now", two different reasons.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import { COPY } from '../../lib/copy';

const AMBER = '#FFC64D';

/** A key, not a padlock — what was declined is an identifier, not a purchase. */
function KeyGlyph({ size = 46, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={8} cy={12} r={3.6} stroke={color} strokeWidth={1.8} />
      <Path d="M11.6 12 H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M17.2 12 v3.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M19.8 12 v2.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* The dashed bow reads "temporary" without a word of explanation. */}
      <Circle cx={8} cy={12} r={6.4} stroke={color} strokeWidth={1.1} strokeDasharray="2.2 2.6" opacity={0.5} />
    </Svg>
  );
}

export function GlossaryDeviceKeyView({
  visible,
  onAllow,
  onSignIn,
  onExit,
}: {
  visible: boolean;
  /** Re-raise the consent dialog. */
  onAllow: () => void;
  /** The other way through: a real account is metered by uid, no device ID. */
  onSignIn: () => void;
  onExit: () => void;
}) {
  // Re-mount the glyph's entrance on each appearance without animating anything
  // heavy behind a modal (the glossary is still mounted underneath).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (visible) setShown(true);
  }, [visible]);
  if (!shown && !visible) return null;

  return (
    <Modal
      accessibilityViewIsModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onExit}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <KeyGlyph />
          <Text style={styles.kicker}>PRO AUDIO GLOSSARY</Text>
          <Text style={styles.title} accessibilityRole="header">
            {COPY.glossaryDeviceKeyDeclinedTitle}
          </Text>
          <Text style={styles.body}>{COPY.glossaryDeviceKeyDeclinedBody}</Text>

          <Pressable
            style={styles.btnPrimary}
            onPress={onAllow}
            accessibilityRole="button"
            accessibilityLabel="Allow the temporary device ID"
          >
            <Text style={styles.btnPrimaryText}>ALLOW TEMPORARY ID</Text>
          </Pressable>
          <Pressable
            style={styles.btnSecondary}
            onPress={onSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in to your account instead"
          >
            <Text style={styles.btnSecondaryText}>SIGN IN INSTEAD</Text>
          </Pressable>
          <Pressable
            style={styles.btnSecondary}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Exit to menu"
          >
            <Text style={styles.btnSecondaryText}>EXIT TO MENU</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.82)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.28)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.textMuted, marginTop: 2 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 21, color: colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  btnPrimary: {
    marginTop: 6,
    alignSelf: 'stretch',
    borderRadius: 10,
    backgroundColor: AMBER,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.8, color: colors.black },
  btnSecondary: {
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
});
