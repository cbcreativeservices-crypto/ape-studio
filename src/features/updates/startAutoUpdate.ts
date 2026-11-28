/**
 * The native wiring for `watchForPendingUpdate` — kept apart from the rules.
 *
 * ⛔ IT DOES NOT CALL `checkForUpdateAsync` OR `fetchUpdateAsync`. The native
 * module already checks on every launch; doing it again is what raced and
 * crashed the app. See the crash note in `autoUpdate.ts`.
 */
import { AppState } from 'react-native';
import { runSoon } from '../../lib/afterInteractions';
import * as Updates from 'expo-updates';
import { trackEvent } from '../telemetry/telemetry';
import { isUpdateReloadHeld, launchEventProps, watchForPendingUpdate } from './autoUpdate';

/** Which bundle this launch runs, once per launch (fresh-install update audit 2026-11-27). */
function reportLaunch(): void {
  try {
    if (!Updates.isEnabled) return;
    trackEvent(
      'update_launch',
      launchEventProps({
        isEmbedded: Updates.isEmbeddedLaunch,
        isEmergency: Updates.isEmergencyLaunch,
        channel: Updates.channel ?? null,
        createdAt: Updates.createdAt ?? null,
        nowMs: Date.now(),
      }),
    );
  } catch {
    /* diagnostics never throw into startup */
  }
}

/** Start watching. Returns an unsubscribe for the app root's cleanup. */
export function startAutoUpdate(): () => void {
  reportLaunch();
  return watchForPendingUpdate({
    isEnabled: Updates.isEnabled,
    // ⚠️ There is no `Updates.isUpdatePending` constant — only the live
    // `isUpdatePending` inside a state-change event. A bundle that finished
    // downloading on a PREVIOUS launch is therefore already applied by the
    // native launcher before we run, so there is nothing to catch up on here.
    pendingNow: () => false,
    onPending: (cb) => {
      const sub = Updates.addUpdatesStateChangeListener((e) => {
        if (e.context.isUpdatePending) cb();
      });
      return () => sub.remove();
    },
    // ⛔ The reload only ever runs from the BACKGROUND (Sentry APE-STUDIO-D —
    // see autoUpdate.ts). 'inactive' (a permission alert, Control Centre, the
    // app-switcher peek) is not the background: the app is still on screen.
    isBackground: () => AppState.currentState === 'background',
    onBackground: (cb) => {
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'background') cb();
      });
      return () => sub.remove();
    },
    // Off the render path — the crash was a reload inside updateRendering.
    // A real macrotask: InteractionManager here was a same-tick microtask
    // that ran BEFORE the render step (RN research 2026-10-04).
    settle: (cb) => {
      runSoon(cb);
    },
    reload: () => Updates.reloadAsync(),
    now: () => Date.now(),
    // A quiz, exam or purchase in progress is never restarted (the reload hold, autoUpdate.ts).
    isHeld: isUpdateReloadHeld,
    onOutcome: (o) => {
      if (o === 'failed') console.warn('[updates] reload failed; the app carries on unchanged');
      // 'none' and 'disabled' are every ordinary launch: not sent (low noise).
      if (o !== 'none' && o !== 'disabled') trackEvent('update_apply', { outcome: o });
    },
  });
}
