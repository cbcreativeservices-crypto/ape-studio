/**
 * pendingLink — hold a deep-link destination across a sign-in / registration
 * detour (owner SEO brief §3: "Preserve the requested destination through
 * login, account creation, or membership purchase").
 *
 * The problem it solves: someone taps a link to a glossary term or a lab, the
 * app opens with no session, Splash routes to Auth, and Auth's `reset` to Main
 * throws the requested destination away. The user signs in and lands on Home,
 * with no sign the link ever pointed anywhere. That is exactly the "silently
 * sent to the home screen" behaviour the brief calls out.
 *
 * Deliberately in-memory only. A destination is a single navigation intent for
 * THIS launch: persisting it would resurrect a stale link days later, which is
 * more surprising than losing it. It is also single-use — consuming clears it,
 * so a later manual sign-out/sign-in never replays an old link.
 *
 * Stores only a validated app path (never a full URL, never a query string), so
 * nothing sensitive can be parked here. Validation is `isAcceptedLink`, the same
 * gate the navigation linking filter uses.
 */
import { isAcceptedLink, parseLink } from './linkPaths.ts';

let pendingPath: string | null = null;

/**
 * Remember where the user was heading. Ignores anything the link contract does
 * not accept, so a hostile or malformed URL can never be parked and replayed.
 * Returns true when the destination was accepted and stored.
 */
export function setPendingLink(url: string): boolean {
  if (!isAcceptedLink(url)) return false;
  const path = parseLink(url)?.path ?? '';
  if (!path) return false;
  pendingPath = path;
  return true;
}

/** Peek without consuming — for deciding whether to show "continue to …" copy. */
export function peekPendingLink(): string | null {
  return pendingPath;
}

/**
 * Take the destination and clear it. Single-use by design: two screens racing
 * to handle the same link must not both navigate.
 */
export function consumePendingLink(): string | null {
  const p = pendingPath;
  pendingPath = null;
  return p;
}

/** Drop it — e.g. the user backed out of sign-in, or signed out. */
export function clearPendingLink(): void {
  pendingPath = null;
}

/**
 * The canonical in-app URL for a stored path, ready for
 * `Linking.openURL` / React Navigation's own URL handling. Uses the custom
 * scheme so it never leaves the app or touches the network.
 */
export function pendingLinkUrl(path: string): string {
  return `proaudio://${path}`;
}

/**
 * Start remembering incoming URLs. Returns an unsubscribe function.
 *
 * `Linking` is resolved at CALL time rather than imported at the top of
 * App.tsx. On the Expo web preview the lazy bundle leaves the react-native-web
 * `Linking` binding out of scope at module-evaluation time, so a top-level
 * import threw `ReferenceError: Linking is not defined` during boot. This is
 * the app's root: nothing here may be able to throw, and a missing Linking
 * simply means no deep links on that platform — never a broken launch.
 *
 * ⛔ LITERAL `require`, NEVER `eval('require')` (bug hunt 2026-09-29). Every
 * lazy load in this function used to go through `eval('require')(…)` to hide
 * it from Metro. Under Metro/Hermes there is no global `require` for eval to
 * find, so each one THREW, the catch swallowed it, and this whole function was
 * a silent no-op in every shipped build: `setPendingLink` was never called
 * (so `consumePendingLink()` always returned null and no link survived
 * sign-in), and the NOTHING-SITS-ABOVE-`Auth` correction below never ran (so a
 * link arriving while signed out pushed a members' lab straight over the login
 * screen). Same trap as `features/tools/capture/optionalModule.ts`, which
 * documents it. A literal `require` inside a try is what Metro bundles; the
 * node tests that import this module never CALL this function, so they still
 * load nothing from React Native or React Navigation.
 */
/** Just the two members we use, so the lazy require needs no RN type import. */
/** Only what the warm-link guard touches. */
type NavRefLike = {
  isReady(): boolean;
  getRootState(): { routes?: { name?: string; params?: unknown }[] } | undefined;
  dispatch(action: unknown): void;
};

type LinkingLike = {
  getInitialURL(): Promise<string | null>;
  addEventListener(type: 'url', handler: (event: { url: string }) => void): { remove(): void };
};

export function attachLinkCapture(): () => void {
  let linking: LinkingLike | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('react-native') as { Linking?: LinkingLike };
    linking = rn?.Linking ?? null;
  } catch {
    linking = null;
  }
  if (!linking) return () => {};

  try {
    void linking.getInitialURL().then((url) => {
      if (url) setPendingLink(url);
    }).catch(() => {});
    const sub = linking.addEventListener('url', ({ url }) => {
      if (url) setPendingLink(url);
      /**
       * ⛔ NOTHING SITS ABOVE `Auth` — INCLUDING A LINK THAT ARRIVES LATE.
       *
       * Pass 2 established that rule, but the fix lived entirely inside
       * Splash's cold-start hand-off, which runs once. React Navigation's
       * `linking` keeps listening for `url` events for the life of the
       * container, and its only filter is `isAcceptedLink`, which checks the
       * PATH, not the session. So a person sitting signed-out on the login
       * screen who taps an app link in Mail or Chrome gets the destination
       * pushed straight over `Auth` — the same state pass 2 removed, reached by
       * a different door. On Android those paths are autoVerify'd, so the OS
       * hands them straight to the app.
       *
       * The stack itself says whether they are signed out: Splash makes `Auth`
       * the BASE route in exactly that case, so no auth lookup is needed here.
       * If a link has pushed anything above an Auth-based stack, drop it — the
       * URL is already held in `pendingLink` above and resumes after sign-in,
       * which is what the paywall's welcome already assumes.
       *
       * Deferred a tick because React Navigation has not applied the URL yet
       * when this fires, and scoped to link arrivals only: an ordinary push
       * above Auth during registration is none of this function's business.
       */
      const correct = () => {
        try {
          /**
           * Required LAZILY, like the `react-native` require above and for the
           * same reason: this module is loaded by node tests that have neither
           * React Navigation nor a navigation container. A static import here
           * pulled both into their module graph and broke linkPaths.test.ts.
           * Literal requires — see the ⛔ note above this function.
           */
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const nav = require('./navigationRef') as { navigationRef?: NavRefLike };
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const rnav = require('@react-navigation/native') as {
            CommonActions?: { reset(cfg: unknown): unknown };
          };
          const navigationRef = nav?.navigationRef;
          const CommonActions = rnav?.CommonActions;
          if (!navigationRef || !CommonActions) return;
          if (!navigationRef.isReady()) return;
          const state = navigationRef.getRootState();
          const routes = state?.routes ?? [];
          const base = routes[0]?.name;
          if (base === 'Auth') {
            if (routes.length > 1) {
              navigationRef.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'Auth', params: routes[0].params }] }),
              );
            }
            return;
          }
          // SIGNED IN (the base is the app, not Auth or the booting Splash):
          // React Navigation has already opened the link, so there is nothing
          // to resume. Holding it would replay a stale destination after a
          // later sign-out → sign-in in this launch (bug hunt 2026-09-29).
          if (base && base !== 'Splash') clearPendingLink();
        } catch {
          /* navigation not mounted — nothing to correct */
        }
      };
      // A tick for React Navigation to apply the URL, and once more shortly
      // after in case its dispatch landed later than that tick.
      setTimeout(correct, 0);
      setTimeout(correct, 250);
    });
    return () => {
      try {
        sub.remove();
      } catch {
        /* already gone */
      }
    };
  } catch {
    return () => {};
  }
}
