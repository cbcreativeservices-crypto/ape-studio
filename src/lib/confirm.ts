/**
 * confirm — the app's confirm/notice dialogs.
 *
 * Two problems, one shim.
 *
 * 1. RN-web ships `Alert.alert` as a literal NO-OP, so every unshimmed confirm
 *    was a DEAD interaction on the web preview (QA night 2026-09-01: Log out,
 *    Delete Account's final confirm, redeem results, reset confirmations, the
 *    single-device notices…). That is why this shim exists.
 * 2. On NATIVE the platform Alert is the OS's grey card — owner 2026-09-13, of
 *    the single-device takeover prompt: "it is odd compared to everything
 *    else". The same complaint they made on 2026-09-10 about the tool gates,
 *    which produced MembershipGate.
 *
 * So both platforms now route to the app-themed `AppDialogHost`, and the ~72
 * call sites across 25 files change appearance WITHOUT ONE OF THEM BEING
 * EDITED — the signatures below are unchanged.
 *
 * ⚠️ THE FALLBACK IS LOAD-BEARING. These carry destructive and irreversible
 * flows — Delete Account, sign out, the single-device takeover whose CANCEL
 * signs the user back out. If the host is not mounted (a screen rendered
 * outside the App root: the dev preview harnesses, a test renderer, or any
 * future entry point that forgets it) a themed dialog would simply never
 * appear, stranding the user with no way to continue OR cancel. That is
 * strictly worse than an ugly dialog, and it is exactly the RN-web failure
 * above wearing a different hat. So: host mounted ⇒ themed; otherwise fall back
 * to the platform dialog, which is ugly but WORKS.
 */
import { Alert, Platform } from 'react-native';
import { isAppDialogHostMounted, showAppDialog } from '../components/AppDialog';

/** Two-button confirm. `onCancel` (optional) runs on explicit cancel too —
 *  needed by flows where "Cancel" has a side effect (e.g. sign-out). It also
 *  runs on the scrim and on Android BACK, which are declines, not no-ops. */
export function confirmDialog(
  title: string,
  body: string,
  yesText: string,
  onYes: () => void,
  opts?: { cancelText?: string; destructive?: boolean; onCancel?: () => void },
): void {
  if (isAppDialogHostMounted()) {
    showAppDialog({
      title,
      body,
      confirmText: yesText,
      cancelText: opts?.cancelText,
      destructive: opts?.destructive,
      onConfirm: onYes,
      onCancel: opts?.onCancel,
    });
    return;
  }
  // ── Fallback: host not mounted (see the docblock) ──
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n\n${body}`)) onYes();
    else opts?.onCancel?.();
    return;
  }
  Alert.alert(title, body, [
    { text: opts?.cancelText ?? 'Cancel', style: 'cancel', onPress: opts?.onCancel },
    { text: yesText, style: opts?.destructive ? 'destructive' : undefined, onPress: onYes },
  ]);
}

/** One-button notice; `onDone` runs after dismissal — including dismissal by
 *  scrim or BACK, since acknowledging a notice is the only thing it offers. */
export function notify(title: string, body: string, onDone?: () => void): void {
  if (isAppDialogHostMounted()) {
    // No confirmText ⇒ the host renders the one-button NOTICE shape, and routes
    // every dismissal (OK, scrim, BACK) through onCancel.
    showAppDialog({ title, body, onCancel: onDone });
    return;
  }
  // ── Fallback: host not mounted (see the docblock) ──
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${body}`);
    onDone?.();
    return;
  }
  if (onDone) Alert.alert(title, body, [{ text: 'OK', onPress: onDone }]);
  else Alert.alert(title, body);
}
