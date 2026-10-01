/**
 * MembershipGate — the app-themed "Academy membership required" popup
 * (owner 2026-09-10: the native Alert the tool gates used — gray card, white
 * text, blue links — "does not match the app at all").
 *
 * One HOST at the App root + a tiny external store, so every gate call site
 * (useSaveGate across the tool screens, and any future gate) opens the SAME
 * styled card with no per-screen wiring — the tunerFrameStore pattern.
 * NOTE: useFullScreenGate no longer reaches here — full screens went free to
 * every tier on 2026-09-13 (governance R1). Visuals are the app's standing
 * member-popup voice, first set by ColorWheelButton's now-removed MEMBER
 * FEATURE card: dimmed scrim, dark card, amber title, GET MEMBERSHIP
 * glass-adjacent CTA → Paywall, quiet NOT NOW.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// ⛔ DimModal, not react-native's Modal — otherwise this surface lights a
//    dark control room to full brightness in Low-Light Production Mode.
import { Modal, rootModalHoldMs, setHostedOverlay, useModalHostOpen } from '../../components/DimModal';
import { navigationRef } from '../../navigation/navigationRef';
import { colors, fonts } from '../../theme/tokens';

export type MembershipGatePayload = {
  /** Card headline (defaults to ACADEMY MEMBERSHIP). */
  title?: string;
  /** One short paragraph on what membership unlocks here. */
  body: string;
};

let current: MembershipGatePayload | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openMembershipGate(payload: MembershipGatePayload): void {
  current = payload;
  // A new gate supersedes an earlier hosted GET MEMBERSHIP that is still
  // waiting — its answer (NOT NOW included) is the one that counts.
  paywallPending = null;
  emit();
}

export function closeMembershipGate(): void {
  if (current == null) return;
  current = null;
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

function useMembershipGate(): MembershipGatePayload | null {
  return useSyncExternalStore(subscribe, () => current, () => current);
}

/**
 * ⛔ GET MEMBERSHIP FROM A HOSTED CARD (bug pass 2, 2026-09-30). The Paywall is
 * a `presentation: 'modal'` screen. Navigating to it while the DimModal that
 * HOSTS this card (a sheet, a lab's full screen) is still up is the refusal the
 * hosting exists to avoid — iOS presents nothing, Android draws the Paywall
 * behind — so the button read as dead. A hosted tap now records the request
 * here, and the focused host opens the Paywall once no other Modal is open and
 * the last one has finished animating away (see the effect in the host).
 *
 * ⛔ PASS 3 (2026-09-30): the request is tied to the HOST that took the tap and
 * is short-lived. As a bare `true` it fired on whichever screen was focused
 * next (a sheet that navigated away handed an unrelated screen a Paywall), and
 * it fired however long the full screen stayed open (close it ten minutes
 * later → a Paywall out of nowhere). Now it is dropped when that screen blurs
 * or unmounts, when a newer gate opens, and when it is older than
 * PAYWALL_PENDING_TTL_MS; the timer re-checks it is still THE request, so two
 * hosts can never both navigate.
 */
type PaywallRequest = { host: number; at: number };
const PAYWALL_PENDING_TTL_MS = 60_000;
let paywallPending: PaywallRequest | null = null;
let hostSeq = 0;
const getPaywallPending = () => paywallPending;
function setPaywallPending(v: PaywallRequest | null): void {
  if (paywallPending === v) return;
  paywallPending = v;
  emit();
}

/**
 * Rendered PER SCREEN from RootNavigator's `screenLayout` (2026-09-13), NOT once
 * at the App root as it was from 2026-09-10. A root-level overlay is INVISIBLE
 * on the seven `presentation: 'modal'` screens - RootNavigator spells out why,
 * and AppDialogHost hit it for real: a themed confirm raised from Settings
 * rendered underneath Settings and the owner got no popup at all.
 *
 * This host had the same latent defect and simply had not been caught, because
 * tool gates fire from non-modal screens - but `useSaveGate` reached from a
 * modal screen would have found it.
 *
 * ⚠️ Focus-gated for the same reason as AppDialogHost: every mounted host would
 * otherwise render its OWN <Modal> for one request, one per screen in the stack.
 */
export function MembershipGateHost() {
  const focused = useIsFocused();
  const gate = useMembershipGate();

  /**
   * ⛔ THE GATE ASKED FOR WHILE ANOTHER MODAL IS OPEN (bug hunt 2026-09-30) —
   * AppDialogHost's fix, applied here. iOS refuses to present this host's own
   * Modal over an open sheet or a lab's FULL SCREEN (NOTHING appears; Android
   * draws it behind). Now: another Modal open ⇒ the card is drawn inside it
   * via DimModal's keyed hosting ('membership'); one just closed ⇒ wait out its
   * dismissal first; otherwise present our own Modal exactly as before.
   */
  // Bug pass 3 (2026-09-30): `true` ignored the dialog's and the audio gate's
  // popups, so the card asked for over either presented a second root Modal —
  // refused on iOS. They count now, with AppDialog's tie-break: whichever of us
  // already holds its own Modal keeps it and the other moves in (no flip-flop).
  const sheetOpen = useModalHostOpen(true);
  const anyOtherOpen = useModalHostOpen('membership');
  const ownModal = useRef(false);
  const otherModalOpen = sheetOpen || (anyOtherOpen && !ownModal.current);
  const live = focused && gate != null;
  const hostedMode = live && otherModalOpen;
  const holdMs = live && !otherModalOpen ? rootModalHoldMs() : 0;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (holdMs <= 0) return;
    const t = setTimeout(() => setTick((n) => n + 1), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);

  // The Paywall a HOSTED card asked for: opened by the focused screen's host
  // once nothing else is on screen to refuse it. A Modal opening again inside
  // the wait re-runs this and cancels the timer.
  const [hostId] = useState(() => ++hostSeq);
  const pending = useSyncExternalStore(subscribe, getPaywallPending, getPaywallPending);
  useEffect(() => {
    if (!pending || pending.host !== hostId) return;
    // Left the screen that asked (or it went away): the request goes with it.
    if (!focused) return setPaywallPending(null);
    if (otherModalOpen) return;
    // Too late to still be an answer to that tap — never a Paywall out of nowhere.
    if (Date.now() - pending.at > PAYWALL_PENDING_TTL_MS) return setPaywallPending(null);
    const t = setTimeout(() => {
      if (paywallPending !== pending) return; // superseded or already taken
      setPaywallPending(null);
      if (navigationRef.isReady()) navigationRef.navigate('Paywall');
    }, rootModalHoldMs());
    return () => clearTimeout(t);
  }, [focused, pending, otherModalOpen, hostId]);
  useEffect(
    () => () => {
      if (paywallPending?.host === hostId) setPaywallPending(null);
    },
    [hostId],
  );

  const card =
    gate == null ? null : (
      <Pressable style={styles.scrim} onPress={closeMembershipGate} accessible={false} accessibilityViewIsModal>
        {/* Stop card taps from falling through to the scrim's dismiss. */}
        <Pressable style={styles.card} onPress={() => {}} accessible={false}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.title}>{gate.title ?? 'ACADEMY MEMBERSHIP'}</Text>
          <Text style={styles.body}>{gate.body}</Text>
          <Pressable
            style={styles.cta}
            onPress={() => {
              closeMembershipGate();
              // Hosted inside another Modal: the Paywall cannot present over it
              // yet — ask for it once that Modal has closed (see paywallPending).
              // ⛔ OUR OWN Modal too (night bug pass 1, 2026-10-01). The
              // un-hosted card is a DimModal that this very tap is unmounting,
              // and navigating to the `presentation: 'modal'` Paywall in the
              // same tick is the Modal-over-Modal refusal every other hand-off
              // waits out (afterDialogCloses / HOST_DISMISS_MS): iOS presented
              // nothing and GET MEMBERSHIP read as dead. The pending request
              // waits rootModalHoldMs(), which this unmount has just armed.
              setPaywallPending({ host: hostId, at: Date.now() });
            }}
            accessibilityRole="button"
            accessibilityLabel="Get Academy membership"
          >
            <Text style={styles.ctaText}>GET MEMBERSHIP</Text>
          </Pressable>
          <Pressable onPress={closeMembershipGate} hitSlop={8} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={styles.dismiss}>NOT NOW</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    );

  // Only the focused host publishes; re-published each render so the card is
  // current, cleared (null) once the gate closes, and withdrawn on blur/unmount.
  useEffect(() => {
    if (!focused) return;
    setHostedOverlay(hostedMode && card ? { node: card, onBack: closeMembershipGate } : null, 'membership');
  });
  useEffect(() => {
    if (!focused) return;
    return () => setHostedOverlay(null, 'membership');
  }, [focused]);

  ownModal.current = live && !hostedMode && holdMs <= 0;
  if (!ownModal.current) return null;
  return (
    <Modal
      accessibilityViewIsModal
      // Hosts other overlays (the audio gate) if asked for over the gate, but
      // is not "another Modal" to this host's own choice above.
      overlayPublisher="membership"
      visible
      transparent
      animationType="fade"
      onRequestClose={closeMembershipGate}
    >
      {card}
    </Modal>
  );
}

// The app's member-popup voice (originally ColorWheelButton's card, since removed).
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  lock: { fontSize: 30 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6 },
});
