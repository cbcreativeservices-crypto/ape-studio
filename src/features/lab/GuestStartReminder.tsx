/**
 * GuestStartReminder — the "you're not signed in" reminder a guest gets BEFORE
 * starting a lab (owner 2026-10-04). Render it once inside a lab's screen (the
 * shared LabShell and PagedLab, and the free labs' own hubs and module
 * screens); it draws nothing for anyone but a known guest.
 *
 *   • A centred popup (the house confirmDialog → AppDialog: popups, not
 *     pulldowns; it hosts itself inside an open Modal, so never Modal over
 *     Modal — K10), shown ONCE per activity per guest session, only while the
 *     screen is focused. "Sign in" opens the sign-in screen (a stack screen,
 *     not a modal one); "Continue as guest" closes it.
 *   • LOW-LIGHT (useOverlaysSuppressed): nothing auto-appears, so the same
 *     facts sit inline at the top of the screen instead, with a SIGN IN link.
 *   • Never to a member whose check is pending or failed (useGuestWording,
 *     D52), never in a members-only preview (it earns nothing whoever signs
 *     in), and never any upsell: it is about saving, not membership.
 *
 * The words and the once-rule: ./guestReminderRules.ts.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { confirmDialog } from '../../lib/confirm';
import { useGuestWording, useTier } from '../commercial/useTier';
import { areOverlaysSuppressed, useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { sessionCarryOpen } from './sessionCarry';
import {
  GUEST_REMINDER_CONTINUE,
  GUEST_REMINDER_SIGN_IN,
  GUEST_REMINDER_TITLE,
  claimGuestReminder,
  guestReminderBody,
  guestReminderNote,
  remindAsGuest,
  type GuestReminderKind,
} from './guestReminderRules';

export function GuestStartReminder({
  activity,
  kind = 'credit',
  style,
}: {
  /** One id per activity (a lab key / route): the reminder shows once for it. */
  activity: string;
  kind?: GuestReminderKind;
  style?: StyleProp<ViewStyle>;
}) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const tier = useTier();
  const wording = useGuestWording();
  const suppressed = useOverlaysSuppressed();
  const asGuest = remindAsGuest(tier, wording.guest);

  // One open of the sign-in screen per tap burst: once it is pushed this
  // screen is no longer focused, so a second tap does nothing (K11).
  const signIn = () => {
    if (navigation.isFocused()) (navigation as unknown as { navigate: (r: 'Auth') => void }).navigate('Auth');
  };

  useEffect(() => {
    if (!asGuest || !focused || suppressed) return;
    // AFTER THE PUSH (LabShell's audio-gate rule, 2026-09-27): a popup
    // presented mid-push can stick half-presented on iOS, and UIKit then
    // refuses every later presentation — the lab's ▶, ?, ⓘ all dead. Wait for
    // the native stack's transitionEnd; the timer covers a screen with no push
    // animation (or a tier that resolved after the push ended).
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      // Re-checked at the moment it would show: Low-Light may have come on.
      if (areOverlaysSuppressed()) return;
      // Claimed only when it actually shows: leaving before then keeps it owed.
      if (!claimGuestReminder(activity)) return;
      confirmDialog(GUEST_REMINDER_TITLE, guestReminderBody(kind, sessionCarryOpen()), GUEST_REMINDER_SIGN_IN, signIn, {
        cancelText: GUEST_REMINDER_CONTINUE,
      });
    };
    const nav = navigation as unknown as {
      addListener?: (e: 'transitionEnd', cb: (ev: { data?: { closing?: boolean } }) => void) => () => void;
    };
    let later: ReturnType<typeof setTimeout> | null = null;
    const unsub = nav.addListener?.('transitionEnd', (ev) => {
      if (!ev?.data?.closing) later = setTimeout(show, 120);
    });
    const fallback = setTimeout(show, 1200);
    return () => {
      done = true;
      clearTimeout(fallback);
      if (later) clearTimeout(later);
      unsub?.();
    };
    // `signIn` reads the live navigation object; re-running for it would
    // only be refused by the once-rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asGuest, focused, suppressed, activity, kind]);

  if (!asGuest || !suppressed) return null;
  return (
    <View style={[styles.note, style]}>
      <Text style={styles.noteText}>{guestReminderNote(kind, sessionCarryOpen())}</Text>
      <Pressable onPress={signIn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Sign in">
        <Text style={styles.link}>SIGN IN ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  noteText: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  link: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8 },
});
