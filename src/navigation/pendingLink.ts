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
 */
/** Just the two members we use, so the lazy require needs no RN type import. */
type LinkingLike = {
  getInitialURL(): Promise<string | null>;
  addEventListener(type: 'url', handler: (event: { url: string }) => void): { remove(): void };
};

export function attachLinkCapture(): () => void {
  let linking: LinkingLike | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = eval('require')('react-native') as { Linking?: LinkingLike };
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
