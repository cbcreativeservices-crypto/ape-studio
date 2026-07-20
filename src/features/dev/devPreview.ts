/**
 * devPreview — TEMPORARY (user request 2026-07-18). A one-shot request the Dev
 * Visual Index sets right before navigating to a screen, so that screen can
 * auto-open one of its state-bound popups for preview. Remove before release.
 */
let pending: string | null = null;

/** Queue a popup to auto-open on the next screen that consumes this key. */
export function requestDevPreview(key: string): void {
  pending = key;
}

/** If `key` is the pending request, consume it (returns true once). */
export function consumeDevPreview(key: string): boolean {
  if (pending === key) {
    pending = null;
    return true;
  }
  return false;
}
