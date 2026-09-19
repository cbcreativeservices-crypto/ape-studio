/**
 * The native wiring for `runAutoUpdate` — kept apart from the rules it runs.
 *
 * `expo-updates` cannot be resolved by the test runner, so importing it here
 * and nowhere else is what lets `autoUpdate.ts` be covered by tests. See the
 * note at the top of that file for what this is for and why it is JavaScript
 * rather than an app.json flag.
 */
import * as Updates from 'expo-updates';
import { runAutoUpdate } from './autoUpdate';

/** Fire-and-forget from the app root. Never rejects. */
export function startAutoUpdate(): void {
  void runAutoUpdate({
    isEnabled: Updates.isEnabled,
    check: () => Updates.checkForUpdateAsync(),
    fetch: () => Updates.fetchUpdateAsync(),
    reload: () => Updates.reloadAsync(),
    now: () => Date.now(),
  })
    .then((outcome) => {
      if (outcome === 'failed') console.warn('[updates] check failed; the app carries on unchanged');
    })
    .catch(() => {
      /* startAutoUpdate must never reject into the launch path */
    });
}
