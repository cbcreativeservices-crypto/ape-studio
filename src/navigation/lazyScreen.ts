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

// ── tabBack (folded in here 2026-10-14 to keep the start graph at its cap — test/perfStartTrim_20261004; same pure, node-importable shape) ──
/**
 * tabBack — what Android BACK does BETWEEN the bottom tabs (owner bug report
 * 2026-10-14, Pixel: "the back swipe jumps straight to Home instead of going
 * back to the previous screen").
 *
 * ROOT CAUSE. MainTabs set no `backBehavior`, and React Navigation's tab
 * default is 'firstRoute': once the focused tab's own stack has nothing left to
 * pop, GO_BACK always lands on the FIRST tab — Home — whatever the user was on
 * before. Profile → Achievements (the "View trophies" row) → BACK went Home, not
 * Profile; Study → Profile → BACK went Home, not Study.
 *
 * THE RULE (one place, pure, node-tested with the real TabRouter):
 *   1. BACK retraces the tabs the user actually visited ('history').
 *   2. Home is the root. Arriving on Home — by tab press, a HOME key, the
 *      Glossary's exit, anything — clears the tab history, so BACK on Home
 *      always leaves the app (it never ping-pongs back into a tab the user
 *      just left for Home).
 *   3. A non-Home tab with nothing behind it (a cold-start deep link to a
 *      topic, a restored state) still goes Home first, as before — never
 *      straight out of the app.
 *
 * Wired through the navigator's `UNSTABLE_router` override (core 7.x merges it
 * over the TabRouter once, in useNavigationBuilder); `canGoBack()` asks the
 * same overridden router, so safeGoBack sees the same answer BACK does.
 *
 * No React and no react-native imports: test/tabBackHistory_20261014.test.ts
 * drives it with @react-navigation/routers' real TabRouter.
 */

/** The bottom-tab root. Must match MainTabs' first <Tab.Screen>. */
export const TAB_HOME = 'Home';

type HistoryItem = { type: string; key: string; params?: object };
type TabLikeState = {
  key: string;
  index: number;
  routes: { key: string; name: string }[];
  history?: HistoryItem[];
};
type AnyRouter = {
  getStateForAction(state: any, action: any, options: any): any;
  getStateForRouteFocus(state: any, key: string): any;
};

/** Home focused → the history is just Home. Anything else is left alone. */
function homeIsRoot<S extends TabLikeState>(state: S, home: string): S {
  const focused = state.routes[state.index];
  if (!focused || focused.name !== home) return state;
  const h = state.history;
  if (Array.isArray(h) && h.length === 1 && h[0]?.key === focused.key) return state;
  return { ...state, history: [{ type: 'route', key: focused.key }] };
}

export function tabBackRouter(home: string = TAB_HOME) {
  return <R extends AnyRouter>(original: R): Partial<R> =>
    ({
      getStateForAction(state: TabLikeState, action: { type: string; target?: string }, options: unknown) {
        const next = original.getStateForAction(state, action, options);
        if (next !== null) {
          // Only a real tab state carries a history to normalise (a RESET can
          // return a partial/stale one — the builder rehydrates it after us).
          return next && next.stale === false && Array.isArray(next.routes) && typeof next.index === 'number'
            ? homeIsRoot(next, home)
            : next;
        }
        if (action.type !== 'GO_BACK') return null;
        // Nothing left in the history: a non-Home tab falls back to Home
        // (rule 3); Home itself returns null so BACK bubbles out of the app.
        const focused = state.routes[state.index];
        if (!focused || focused.name === home) return null;
        const homeIdx = state.routes.findIndex((r) => r.name === home);
        if (homeIdx < 0) return null;
        return { ...state, index: homeIdx, history: [{ type: 'route', key: state.routes[homeIdx].key }] };
      },
      getStateForRouteFocus(state: TabLikeState, key: string) {
        return homeIsRoot(original.getStateForRouteFocus(state, key), home);
      },
    }) as unknown as Partial<R>;
}
