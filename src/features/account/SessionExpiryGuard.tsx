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
import { safeSession } from '../../lib/getSessionSafe';
import { navigationRef } from '../../navigation/navigationRef';
import { consumeIntentionalSignOut } from '../auth/intentionalSignOut';
import { isRealAccount } from '../commercial/realAccount';

export function SessionExpiryGuard() {
  // What KIND of session just went away. The SIGNED_OUT event carries no
  // session, so the answer has to be remembered from the last one that did.
  const wasRealAccount = useRef(false);
  useEffect(() => {
    void safeSession(supabase.auth.getSession(), 'SessionExpiryGuard')
      .then(({ data }) => {
        wasRealAccount.current = isRealAccount(data.session);
      })
      .catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) wasRealAccount.current = isRealAccount(session);
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
      navigationRef.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
