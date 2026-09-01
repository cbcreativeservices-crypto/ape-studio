/**
 * confirm — cross-platform confirm/notify dialogs.
 *
 * RN-web ships `Alert.alert` as a literal no-op, so every unshimmed confirm
 * or notice is a DEAD interaction on the web preview (QA night 2026-09-01:
 * Log out, Delete Account's final confirm, redeem results, reset
 * confirmations, the single-device notices…). ProfileScreen and
 * MyProfileView each grew their own local shim; this is the shared home.
 * On web: window.confirm / window.alert. On native: Alert.alert unchanged.
 */
import { Alert, Platform } from 'react-native';

/** Two-button confirm. `onCancel` (optional) runs on explicit cancel too —
 *  needed by flows where "Cancel" has a side effect (e.g. sign-out). */
export function confirmDialog(
  title: string,
  body: string,
  yesText: string,
  onYes: () => void,
  opts?: { cancelText?: string; destructive?: boolean; onCancel?: () => void },
): void {
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

/** One-button notice; `onDone` runs after dismissal (immediately after the
 *  blocking window.alert on web). */
export function notify(title: string, body: string, onDone?: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${body}`);
    onDone?.();
    return;
  }
  if (onDone) Alert.alert(title, body, [{ text: 'OK', onPress: onDone }]);
  else Alert.alert(title, body);
}
