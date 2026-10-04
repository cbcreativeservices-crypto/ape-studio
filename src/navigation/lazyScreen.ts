/**
 * lazyScreen — load a screen on first visit, never at app start (perf
 * decision B, owner "do your recommendations" 2026-10-04).
 *
 * The navigators used to `import` about 130 lab, tool and calculator screens at
 * the top of the file, so every one of them was evaluated before the first
 * frame. React Navigation's `getComponent` defers that to the first time the
 * route renders; the `require()` inside `load` is what Metro splits on.
 *
 * WHY THE CACHE: React Navigation calls `getComponent()` on EVERY render of the
 * route. A loader that wraps the screen (`withMembershipPreview(…)`,
 * `withAmplitudeOrientation(…)`, `withKeepAwake(…)`) builds a NEW component type
 * each time it runs, and a new type at the same spot is a REMOUNT — the lab
 * would lose its state on every parent render. So the loader runs once and the
 * same component is handed back forever after.
 *
 * A loader that throws caches nothing, so the next visit retries; the screen's
 * error boundary (RootNavigator `screenLayout`) contains the failure meanwhile.
 */
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScreenComponent = ComponentType<any>;
export type ScreenLoader = () => ScreenComponent;

export function lazyScreen(load: ScreenLoader): ScreenLoader {
  let cached: ScreenComponent | undefined;
  return () => {
    if (cached === undefined) cached = load();
    return cached;
  };
}
