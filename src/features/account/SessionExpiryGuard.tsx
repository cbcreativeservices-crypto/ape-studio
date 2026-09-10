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
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { navigationRef } from '../../navigation/navigationRef';
import { consumeIntentionalSignOut } from '../auth/intentionalSignOut';

export function SessionExpiryGuard() {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return;
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
