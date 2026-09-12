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
import { useEffect, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  if (current) {
    queue.push(req);
    return;
  }
  current = req;
  emit();
}

/** Close the open dialog, run ONE of its handlers, then drain the queue. */
function resolve(which: 'confirm' | 'cancel'): void {
  const req = current;
  current = null;
  emit();
  // Handler AFTER clearing, so a handler that opens another dialog is queued
  // against an empty slot rather than colliding with the one closing.
  if (req) (which === 'confirm' ? req.onConfirm : req.onCancel)?.();
  const next = queue.shift();
  if (next) showAppDialog(next);
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
 *    covered Settings, WeeklyConcept, Institutional, About, Directory,
 *    ExposureMonitor or Paywall."
 *
 * A root-level dialog host has exactly that defect: raised FROM one of those
 * seven screens it renders UNDERNEATH the screen that raised it — invisible and
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
  if (!focused || req == null) return null;
  const isNotice = req.confirmText == null;
  return (
    <Modal
      accessibilityViewIsModal
      visible
      transparent
      animationType="fade"
      // Android BACK counts as declining, not as a silent dismissal.
      onRequestClose={() => resolve('cancel')}
    >
      <Pressable style={styles.scrim} onPress={() => resolve('cancel')} accessible={false}>
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
