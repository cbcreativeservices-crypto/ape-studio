/**
 * authReMute — when does an auth event re-mute the audio output gate?
 *
 * The documented rule (AudioOutputGate, 2026-07-25): a SIGN-IN starts the
 * new session silent. What it never meant was "every SIGNED_IN event".
 *
 * supabase-js also announces SIGNED_IN for the SAME person when it merely
 * re-reads the stored session: at start-up (`_recoverAndRefresh`), and on the
 * web every time the tab becomes visible again (`_onVisibilityChanged`) or
 * another tab writes the session (BroadcastChannel). Each of those re-locked a
 * gate the learner had just opened — switch tabs and come back, and sound was
 * off again, with a fresh five-second hold to get it back (owner 2026-09-30:
 * "it just keeps turning off every time I change the screen").
 *
 * So the gate remembers WHO it last saw signed in, and only a sign-in by a
 * DIFFERENT real account (or the first one after a sign-out) mutes. Anonymous
 * glossary sessions never mute (see realAccount.ts).
 *
 * Pure and import-light, so it is tested directly.
 */
import { isRealAccount, type MaybeSession } from '../commercial/realAccount';

type AuthSession = (MaybeSession & { user?: { id?: string | null; is_anonymous?: boolean | null } | null }) | null | undefined;

/**
 * Decide one auth event. `known` is the real-account user id the gate last saw
 * (null = nobody / signed out). Returns whether to mute, and the id to remember.
 */
export function authEventReMute(
  event: string,
  session: AuthSession,
  known: string | null,
): { mute: boolean; known: string | null } {
  if (event === 'SIGNED_OUT') return { mute: false, known: null };
  const real = isRealAccount(session);
  const id = real ? session?.user?.id ?? null : null;
  if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
    if (!real) return { mute: false, known };
    // Same person re-announced (session restore, tab refocus) → keep sound on.
    if (id != null && id === known) return { mute: false, known };
    return { mute: true, known: id };
  }
  // INITIAL_SESSION / TOKEN_REFRESHED / USER_UPDATED: no mute, but learn who
  // is signed in so a later re-announcement of them is recognised.
  if (real && id != null) return { mute: false, known: id };
  return { mute: false, known };
}
