/**
 * SessionExpiryGuard (QA Wave D, D-1 2026-09-10) — rescues the user from a
 * silent, UNEXPECTED session loss.
 *
 * When the refresh token expires or is revoked mid-use (password changed
 * elsewhere, server revoke, a race the single-device guard didn't catch),
 * Supabase emits SIGNED_OUT but nothing navigates — the user is stranded on
 * whatever protected screen they were on (labs/tools have no Back-to-Login
 * escape). This listens for SIGNED_OUT and resets to Auth, but ONLY when the
 * sign-out was NOT app-initiated: logout / delete / Guest entry / single-device
 * displacement / self-heal / Back-to-Login all mark the intentional flag and
 * handle their own navigation, so the guard stays out of their way (crucially,
 * entering Guest mode signs out to establish the anon session and must NOT be
 * bounced to login).
 *
 * Renders nothing; mounted once at the app root alongside the other guards.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { readDeviceAccountMarker } from './accountLocalSync';
import { navigationRef } from '../../navigation/navigationRef';
import { consumeIntentionalSignOut } from '../auth/intentionalSignOut';
import { isRealAccount } from '../commercial/realAccount';
import { clearAppDialogs } from '../../components/AppDialog';

export function SessionExpiryGuard() {
  // What KIND of session just went away. The SIGNED_OUT event carries no
  // session, so the answer has to be remembered from the last one that did.
  const wasRealAccount = useRef(false);
  /** An auth event has carried a session — its answer outranks the boot read. */
  const sessionSeen = useRef(false);
  useEffect(() => {
    void safeSessionResult(supabase.auth.getSession(), 'SessionExpiryGuard')
      .then(async ({ result: { data }, timedOut }) => {
        if (!timedOut) {
          wasRealAccount.current = isRealAccount(data.session);
          return;
        }
        // ⛔ A BOOT READ THAT COULD NOT TELL IS NOT "NO ACCOUNT" (hunt 12,
        // 2026-10-04). A member's expired token on a dead connection answers
        // `{ session: null, error: AuthRetryableFetchError }` with the session
        // still stored — and INITIAL_SESSION is null too — so this stayed
        // false, and when the stored refresh token was then found dead (a
        // password changed elsewhere, a server revoke) the SIGNED_OUT left
        // the member stranded, signed out, on a protected screen: the exact
        // loss this guard exists to rescue. The device's account marker
        // (accountLocalSync) says whose session that is: '' for a guest or a
        // glossary device key, a uid for an account.
        const marker = await readDeviceAccountMarker();
        if (!sessionSeen.current) wasRealAccount.current = !!marker;
      })
      .catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        sessionSeen.current = true;
        wasRealAccount.current = isRealAccount(session);
      }
      if (event !== 'SIGNED_OUT') return;
      // ⚠️ An expired ANONYMOUS session is not a session LOSS to rescue — it is
      // the glossary's temporary device key reaching its 7-day end, exactly as
      // promised. Bouncing to the login screen would punish a guest for a
      // deletion we scheduled on their behalf; the glossary mints a new key on
      // its own. (The same reasoning as the Guest-entry exemption above.)
      if (!wasRealAccount.current) return;
      // App-initiated sign-out → the caller navigates; do nothing.
      if (consumeIntentionalSignOut()) return;
      if (!navigationRef.isReady()) return;
      const current = navigationRef.getCurrentRoute()?.name;
      // Already at login / boot — nothing to rescue.
      if (current === 'Auth' || current === 'Splash') return;
      // A confirm left open on the old screen would reappear over Auth and run
      // its handler with no session behind it (bug hunt 2026-09-29).
      clearAppDialogs();
      navigationRef.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
