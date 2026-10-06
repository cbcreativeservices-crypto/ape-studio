/**
 * AppDialog — the app-themed confirm / notice popup, and the host that renders
 * it (owner 2026-09-13: the single-device takeover prompt "is odd compared to
 * everything else").
 *
 * This is the SAME complaint the owner made on 2026-09-10 about the tool gates'
 * native Alert — "gray card, white text, blue links … does not match the app at
 * all" — which produced MembershipGate. That fix themed the membership popups
 * and left everything else on `Alert.alert`. This themes everything else: the
 * shim in `lib/confirm.ts` routes here, so all ~72 `confirmDialog` / `notify`
 * call sites change appearance WITHOUT ONE OF THEM BEING EDITED.
 *
 * Visuals are deliberately MembershipGate's, not a second dialect: same scrim,
 * card, radius, border, amber title and quiet dismiss. One popup voice.
 *
 * ⚠️ FALLBACK IS NOT OPTIONAL. These dialogs carry destructive and
 * irreversible flows — Delete Account, sign out, the single-device takeover
 * whose CANCEL signs the user back out. A themed dialog that silently fails to
 * appear is far worse than an ugly one: the user is stranded with no way to
 * continue OR cancel. That already happened once on RN-web, where `Alert.alert`
 * is a literal no-op and the takeover prompt never appeared. So `lib/confirm.ts`
 * checks `isAppDialogHostMounted()` and falls back to the platform dialog if
 * this host is not live.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// ⛔ DimModal, NOT react-native's Modal. This component hosts ~72
//    confirmDialog/notify call sites, so importing the bare Modal meant that
//    in Low-Light Production Mode ANY confirm or notice lit the display to
//    full brightness in a dark control room — the one thing that mode
//    promises will not happen. DimModal carries the <LowLightDim/> wash and
//    passes every prop straight through.
import { Modal, rootModalHoldMs, setHostedOverlay, useModalHostOpen, usePublisherModalOpen } from './DimModal';
import { colors, fonts } from '../theme/tokens';

export type AppDialogRequest = {
  title: string;
  body: string;
  /** Confirm label. Absent ⇒ a one-button NOTICE. */
  confirmText?: string;
  cancelText?: string;
  /** Tints the confirm control red rather than amber. */
  destructive?: boolean;
  onConfirm?: () => void;
  /**
   * Runs on Cancel, on the scrim, and on Android BACK. Load-bearing: the
   * single-device flow signs the user back out when they decline, so a
   * dismissal that skipped this would leave them signed in on two devices.
   */
  onCancel?: () => void;
};

let current: AppDialogRequest | null = null;
/** Requests that arrived while one was already showing (see showAppDialog). */
const queue: AppDialogRequest[] = [];
let hostCount = 0;
/** When `current` was put on screen — see ANSWER_GUARD_MS. */
let shownAt = 0;
/**
 * A tap that lands within this long of a dialog appearing is ignored (bug hunt
 * 2026-09-29). With a queue, answering one dialog puts the NEXT one in the same
 * spot on the same frame, so the second tap of a double-tap answered a dialog
 * nobody had read — a duplicate Log out confirmed itself, a queued "Publish?"
 * said yes. 300 ms is below reading time and above a double-tap interval.
 */
export const ANSWER_GUARD_MS = 300;

/** Same title + body ⇒ the same question; used to drop duplicate requests. */
const sameDialog = (a: AppDialogRequest, b: AppDialogRequest) => a.title === b.title && a.body === b.body;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** True only while a host is actually rendered — the fallback's gate. */
export function isAppDialogHostMounted(): boolean {
  return hostCount > 0;
}

/**
 * Show a dialog. If one is already up the request is QUEUED rather than
 * dropped: several flows fire a notice immediately after a confirm resolves,
 * and swallowing the second one would lose the only feedback the user gets.
 */
export function showAppDialog(req: AppDialogRequest): void {
  // Rapid taps on one trigger (Log out, Approve, the 18+ switch…) each asked
  // the same question before the first dialog could cover the button, and the
  // queue replayed every copy (bug hunt 2026-09-29) — Log out, Publish, quiz
  // Start's "BEFORE YOU BEGIN", the quiz ‹ "Leave quiz?" (which then surfaced
  // over the Dashboard), an Enrollment ✕ "Remove X?". An identical request that
  // is already showing or waiting adds nothing — drop it.
  //
  // ⚠️ The dropped copy's handlers are deliberately NOT run: the answer given
  // to the copy on screen stands for both. Running its onCancel would fire real
  // side effects mid-question — the single-device takeover's cancel SIGNS THE
  // USER OUT while they are still deciding. No caller wraps a dialog in a
  // Promise (checked 2026-09-29), so nothing is left waiting on it.
  // The queue is checked with no dialog up as well (night pass 3,
  // 2026-10-01): while a hand-off holds the queue (holdAppDialogQueue)
  // `current` is empty and the queue is not, so a repeat of a waiting request
  // used to show at once AND again when the hold released.
  if ((current && sameDialog(current, req)) || queue.some((q) => sameDialog(q, req))) return;
  if (current) {
    queue.push(req);
    return;
  }
  // A request made DURING a hand-off waits in line too: shown now, its Modal
  // would block the modal screen the hand-off is about to present (iOS) —
  // the very thing the hold exists for — and it would jump the dialogs
  // already waiting. The hold is bounded, so this delays, never strands.
  if (drainHeldUntil > Date.now()) {
    queue.push(req);
    drainQueue();
    return;
  }
  current = req;
  shownAt = Date.now();
  emit();
}

/**
 * Drop every dialog — the one showing and everything queued — WITHOUT running
 * any of their handlers (bug hunt 2026-09-29). `current` and `queue` live at
 * module level, so they outlive a forced sign-out: SingleDeviceGuard and
 * SessionExpiryGuard reset the navigator to Splash / Auth, and a confirm that
 * was open on the old screen reappeared there — answering it ran the old
 * screen's handler against an account that was no longer signed in.
 *
 * ⚠️ Not "resolve as cancel". Cancel handlers are the old screen's code too,
 * and some act: a notice's onDone navigates (the "Account created" notice
 * proceeds into the app), the takeover prompt's cancel signs out. The account
 * those dialogs were about is gone; the right answer is no answer. Call it
 * BEFORE the reset, so a notice raised afterwards (SingleDeviceGuard's
 * "Signed out") is shown normally.
 */
export function clearAppDialogs(): void {
  queue.length = 0;
  if (current) {
    current = null;
    emit();
  }
}

/**
 * A HAND-OFF HOLDS THE QUEUE (night pass 2, 2026-10-01). A handler wrapped in
 * `afterDialogCloses` (lib/confirm.ts — "See plans" → Paywall) navigates to a
 * `presentation: 'modal'` screen HOST_DISMISS_MS later. Draining the queue at
 * once put the next dialog's Modal up first, so iOS refused to present the
 * Paywall over it (the dead tap again) — or, on Android, the Paywall opened
 * behind the card. Held, the next dialog waits for the hand-off to land and
 * then shows on the screen that is focused by then.
 */
let drainHeldUntil = 0;
export function holdAppDialogQueue(ms: number): void {
  drainHeldUntil = Math.max(drainHeldUntil, Date.now() + ms);
}
function drainQueue(): void {
  if (current) return; // a newer dialog is up; its own resolve drains
  const wait = drainHeldUntil - Date.now();
  if (wait > 0) {
    setTimeout(drainQueue, wait);
    return;
  }
  const next = queue.shift();
  if (next) showAppDialog(next);
}

/** Close the open dialog, run ONE of its handlers, then drain the queue. */
function resolve(which: 'confirm' | 'cancel'): void {
  // Too soon after this dialog appeared — the tail of a double-tap meant for
  // the one before it, not an answer to this one (see ANSWER_GUARD_MS).
  if (current && Date.now() - shownAt < ANSWER_GUARD_MS) return;
  const req = current;
  current = null;
  emit();
  // Handler AFTER clearing, so a handler that opens another dialog is queued
  // against an empty slot rather than colliding with the one closing.
  if (req) (which === 'confirm' ? req.onConfirm : req.onCancel)?.();
  // …and only drain if that handler did not open one of its own. Draining
  // unconditionally sent the next request back through showAppDialog, which
  // saw the handler's dialog in `current` and pushed it onto the BACK of the
  // queue — so [A, B] came out as handler → B → A (owner 2026-09-20 bug pass).
  if (!current) drainQueue();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/**
 * Rendered PER SCREEN from RootNavigator's `screenLayout`, NOT once at the App
 * root — the same conclusion this codebase already reached for `LowLightDim`
 * and `ScreenErrorBoundary`, for the same reason, written up in RootNavigator:
 *
 *   "A `presentation: 'modal'` screen is presented in its OWN native container,
 *    ABOVE the React root's sibling views — so the root-level LowLightDim never
 *    covered Settings, WeeklyConcept, About, Directory, ExposureMonitor or
 *    Paywall."
 *
 * A root-level dialog host has exactly that defect: raised FROM one of those
 * modal screens it renders UNDERNEATH the screen that raised it — invisible and
 * un-tappable. Settings is one of the seven, and Settings is where Log out
 * lives. Owner 2026-09-13: "logout took me to login gate", with no popup at all.
 *
 * ⚠️ WHY THE FOCUS CHECK. Unlike LowLightDim, which is a wash that can stack
 * harmlessly, every mounted host would render its OWN <Modal> for the same
 * request — one per screen in the stack. Only the FOCUSED screen's host draws.
 */
export function AppDialogHost() {
  const focused = useIsFocused();
  const req = useSyncExternalStore(subscribe, () => current, () => current);
  useEffect(() => {
    // Counts every mounted host, focused or not: the fallback in lib/confirm.ts
    // only needs to know that SOME host exists to draw the dialog.
    hostCount += 1;
    return () => {
      hostCount -= 1;
    };
  }, []);

  /**
   * ⛔ A DIALOG ASKED FOR WHILE ANOTHER MODAL IS OPEN (bug hunt 2026-09-30).
   * DimModal.tsx names "the app's dialogs" among the root surfaces that cannot
   * present over an open Modal, but only the audio gate was ever moved onto its
   * hosting mechanism. A confirm raised from a sheet or a lab's FULL SCREEN —
   * or a notice fired as that sheet closes (Settings → Redeem: close + "Code
   * applied" in one tap) — was refused by iOS, so NOTHING appeared, and
   * `current` never cleared: every later confirm (Log out included) queued
   * silently behind it until the app was killed. Now: another Modal open ⇒ the
   * card is drawn inside it; one just closed ⇒ wait out its dismissal first.
   */
  // Only THIS host's own Modal is skipped: the membership gate's popup is
  // another Modal like any sheet (bug hunt 2026-09-30, pass 1).
  const sheetOpen = useModalHostOpen(['dialog', 'gate']);
  /**
   * The AUDIO GATE's root popup is another Modal too — a notice raised while
   * "Audio output is off" / the hold / the Sound Safety Warning was up
   * presented a second root Modal: refused on iOS, `current` never cleared, and
   * every later confirm queued behind it. So the card is drawn inside the
   * gate's popup. Tie-break: the gate hosts itself inside an open dialog, so if
   * both present in one frame the DIALOG keeps its own Modal (`ownModal`, last
   * render's choice) and the gate moves in — never both moving, which would
   * flip-flop forever.
   */
  const gateOpen = usePublisherModalOpen('gate');
  const ownModal = useRef(false);
  const otherModalOpen = sheetOpen || (gateOpen && !ownModal.current);
  const live = focused && req != null;
  const hostedMode = live && otherModalOpen;
  const holdMs = live && !otherModalOpen ? rootModalHoldMs() : 0;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (holdMs <= 0) return;
    const t = setTimeout(() => setTick((n) => n + 1), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);

  const isNotice = req?.confirmText == null;
  const card =
    req == null ? null : (
      <Pressable style={styles.scrim} onPress={() => resolve('cancel')} accessible={false} accessibilityViewIsModal>
        {/* Stop card taps falling through to the scrim's dismiss. */}
        <Pressable style={styles.card} onPress={() => {}} accessible={false}>
          <Text style={styles.title}>{req.title}</Text>
          <Text style={styles.body}>{req.body}</Text>
          <Pressable
            style={[styles.cta, req.destructive && styles.ctaDestructive]}
            onPress={() => resolve(isNotice ? 'cancel' : 'confirm')}
            accessibilityRole="button"
            accessibilityLabel={isNotice ? 'OK' : req.confirmText}
          >
            <Text style={[styles.ctaText, req.destructive && styles.ctaTextDestructive]}>
              {(isNotice ? 'OK' : req.confirmText ?? '').toUpperCase()}
            </Text>
          </Pressable>
          {isNotice ? null : (
            <Pressable
              onPress={() => resolve('cancel')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={req.cancelText ?? 'Cancel'}
            >
              <Text style={styles.dismiss}>{(req.cancelText ?? 'Cancel').toUpperCase()}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    );

  // Only the focused host publishes; re-published each render so the card is
  // current, and withdrawn when this screen blurs or unmounts.
  useEffect(() => {
    if (!focused) return;
    setHostedOverlay(hostedMode && card ? { node: card, onBack: () => resolve('cancel') } : null, 'dialog');
  });
  useEffect(() => {
    if (!focused) return;
    return () => setHostedOverlay(null, 'dialog');
  }, [focused]);

  ownModal.current = live && !hostedMode && holdMs <= 0;
  if (!ownModal.current) return null;
  return (
    <Modal
      accessibilityViewIsModal
      // Hosts the audio gate if it is asked for over a dialog, but is not
      // "another Modal" to this host's own choice above.
      overlayPublisher="dialog"
      visible
      transparent
      animationType="fade"
      // Android BACK counts as declining, not as a silent dismissal.
      onRequestClose={() => resolve('cancel')}
    >
      {card}
    </Modal>
  );
}

// MembershipGate's card, deliberately — one popup voice, not two dialects.
// The TITLE differs in one respect: these titles are sentence case ("Already
// signed in elsewhere"), so the heavy 2 px tracking that suits a single
// all-caps word would hurt them. Same amber, same face, looser fit.
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
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    paddingHorizontal: 26,
    minWidth: 150,
    alignItems: 'center',
  },
  ctaDestructive: { borderColor: 'rgba(255,90,72,.6)', backgroundColor: '#1e0f0d' },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber },
  ctaTextDestructive: { color: '#ff7a68' },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6 },
});
