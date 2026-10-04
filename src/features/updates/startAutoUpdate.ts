/**
 * The native wiring for `watchForPendingUpdate` — kept apart from the rules.
 *
 * ⛔ IT DOES NOT CALL `checkForUpdateAsync` OR `fetchUpdateAsync`. The native
 * module already checks on every launch; doing it again is what raced and
 * crashed the app. See the crash note in `autoUpdate.ts`.
 */
import { runSoon } from '../../lib/afterInteractions';
import * as Updates from 'expo-updates';
import { watchForPendingUpdate } from './autoUpdate';

/** Start watching. Returns an unsubscribe for the app root's cleanup. */
export function startAutoUpdate(): () => void {
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
    // Off the render path — the crash was a reload inside updateRendering.
    // A real macrotask: InteractionManager here was a same-tick microtask
    // that ran BEFORE the render step (RN research 2026-10-04).
    settle: (cb) => {
      runSoon(cb);
    },
    reload: () => Updates.reloadAsync(),
    now: () => Date.now(),
    onOutcome: (o) => {
      if (o === 'failed') console.warn('[updates] reload failed; the app carries on unchanged');
    },
  });
}
