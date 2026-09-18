/**
 * SoundSafetyWarning — the once-ever gate a user must pass before this app is
 * allowed to make any sound at all.
 *
 * Owner 2026-09-17. It sits IN FRONT of the existing per-session audio-output
 * gate (AudioOutputGate's explain → 5-second hold), not instead of it:
 *
 *     first launch   →  THIS  →  explain  →  hold 5s  →  sound
 *     every launch after       →  explain  →  hold 5s  →  sound
 *
 * ── THE RULES THIS SCREEN OBEYS, AND WHY EACH ONE MATTERS ────────────────────
 *
 *  • The box starts UNCHECKED and is never pre-selected.
 *  • ENABLE SOUND is DISABLED until the box is checked — it is not merely
 *    styled as disabled, it does not fire.
 *  • Tapping the scrim or pressing BACK does NOT accept. Both resolve as
 *    "keep sound off", because a dismissal is not an agreement.
 *  • Nothing plays before acceptance. This component produces no sound itself
 *    and returns control to the gate, which is still muted.
 *  • If the acknowledgment CANNOT BE RECORDED, sound is not enabled. An
 *    acknowledgment nobody wrote down did not happen.
 *
 * ── SCROLLED, AND WHY THAT IS NOT A GESTURE OF DEFEAT ────────────────────────
 *
 * The warning is long and is meant to be. It is in a ScrollView with the
 * acknowledgment and both buttons BELOW it, inside the scroll — so reaching the
 * checkbox means passing the text. The buttons are deliberately NOT pinned to
 * the bottom of the card, which is the usual pattern here (see
 * CredentialDetailModal's measured footer) precisely because a pinned ACCEPT
 * button can be tapped without the text ever having moved.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import {
  SOUND_SAFETY_ACCEPT,
  SOUND_SAFETY_ACK,
  SOUND_SAFETY_BODY,
  SOUND_SAFETY_DECLINE,
  SOUND_SAFETY_INTRO,
  SOUND_SAFETY_LIMITS,
  SOUND_SAFETY_PROTECTIONS,
  SOUND_SAFETY_PROTECTIONS_TITLE,
  SOUND_SAFETY_STEPS,
  SOUND_SAFETY_STEPS_TITLE,
  SOUND_SAFETY_TITLE,
} from './soundSafetyText';

export function SoundSafetyWarning({
  visible,
  onAccept,
  onDecline,
}: {
  visible: boolean;
  /** Called only when the box is ticked AND the accept button is pressed. */
  onAccept: () => void;
  /** Every other exit: the decline button, the scrim, the hardware back key. */
  onDecline: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const { height } = useWindowDimensions();

  // The box resets every time the warning opens. A declined-then-reopened
  // warning must not remember a tick from a session the user abandoned.
  const close = useCallback(() => {
    setChecked(false);
    onDecline();
  }, [onDecline]);

  const accept = useCallback(() => {
    if (!checked) return; // belt and braces — the button is already disabled
    setChecked(false);
    onAccept();
  }, [checked, onAccept]);

  return (
    <Modal
      accessibilityViewIsModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        {/* The scrim closes WITHOUT accepting. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close without enabling sound"
        />
        <View style={[styles.card, { maxHeight: height * 0.86 }]}>
          <View style={styles.headerBar}>
            <Text style={styles.title}>{SOUND_SAFETY_TITLE}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <Text style={styles.intro}>{SOUND_SAFETY_INTRO}</Text>

            {SOUND_SAFETY_BODY.map((p) => (
              <Text key={p.slice(0, 24)} style={styles.body}>
                {p}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>{SOUND_SAFETY_STEPS_TITLE}</Text>
            {SOUND_SAFETY_STEPS.map((s) => (
              <View key={s.slice(0, 24)} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}

            {/* The app's own protections. Told here, before they are needed,
                rather than discovered later in a popup. */}
            <Text style={[styles.sectionTitle, styles.sectionTitleGreen]}>
              {SOUND_SAFETY_PROTECTIONS_TITLE}
            </Text>
            {SOUND_SAFETY_PROTECTIONS.map((s) => (
              <View key={s.slice(0, 24)} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, styles.bulletDotGreen]}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}

            <Text style={styles.limits}>{SOUND_SAFETY_LIMITS}</Text>

            {/* ── the acknowledgment ─────────────────────────────────────── */}
            <Pressable
              style={styles.ackRow}
              onPress={() => setChecked((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              // RNW 0.21 drops accessibilityState; aria-checked is what reaches
              // the DOM and is required on role=checkbox.
              aria-checked={checked}
              accessibilityLabel={SOUND_SAFETY_ACK}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.ackText}>{SOUND_SAFETY_ACK}</Text>
            </Pressable>

            {/* Buttons live INSIDE the scroll, below the text. See the header. */}
            <Pressable
              style={[styles.acceptBtn, !checked && styles.acceptBtnOff]}
              onPress={accept}
              disabled={!checked}
              accessibilityRole="button"
              accessibilityState={{ disabled: !checked }}
              accessibilityLabel={
                checked
                  ? SOUND_SAFETY_ACCEPT
                  : 'Enable sound. Unavailable until you confirm you have read the warning.'
              }
            >
              <Text style={[styles.acceptText, !checked && styles.acceptTextOff]}>
                {SOUND_SAFETY_ACCEPT}
              </Text>
            </Pressable>

            <Pressable
              style={styles.declineBtn}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={SOUND_SAFETY_DECLINE}
            >
              <Text style={styles.declineText}>{SOUND_SAFETY_DECLINE}</Text>
            </Pressable>

            <Text style={styles.footNote}>
              You can read this again at any time from Help.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const RED = '#ff6b5e';
const GREEN = colors.green;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,8,10,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,42,42,.55)',
    overflow: 'hidden',
  },
  headerBar: {
    backgroundColor: 'rgba(255,42,42,.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,42,42,.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 1.1,
    color: RED,
    textAlign: 'center',
  },
  scroll: { flexGrow: 0 },
  scrollBody: { padding: 16, gap: 10 },
  intro: { fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  sectionTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12.5,
    letterSpacing: 1,
    color: RED,
    marginTop: 6,
  },
  sectionTitleGreen: { color: GREEN },
  bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  bulletDot: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: RED },
  bulletDotGreen: { color: GREEN },
  bulletText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  limits: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSub,
    marginTop: 6,
  },
  ackRow: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    padding: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#6a6a6a',
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(55,224,95,.85)', backgroundColor: 'rgba(55,224,95,.16)' },
  checkboxMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 17, color: GREEN },
  ackText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  acceptBtn: {
    marginTop: 12,
    borderRadius: 9,
    backgroundColor: 'rgba(55,224,95,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  acceptBtnOff: { backgroundColor: '#141414', borderColor: '#3a3a3a' },
  acceptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: GREEN, textAlign: 'center' },
  acceptTextOff: { color: colors.textMuted },
  declineBtn: {
    marginTop: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    paddingVertical: 13,
    alignItems: 'center',
  },
  declineText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
  footNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
