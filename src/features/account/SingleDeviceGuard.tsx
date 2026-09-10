/**
 * SingleDeviceGuard (owner 2026-08-21) — enforces one active device per account.
 * Renders nothing; mounted once at the app root alongside the other guards.
 *
 * On mount and whenever the app returns to the foreground, it asks the server
 * whether THIS device is still the account's active device. If a newer device
 * has taken over (claim_device from that device), this one signs out, wipes local
 * account data, and returns to Splash → login. Fails OPEN: no session, un-migrated
 * backend, or any error → no action (never a spurious logout).
 */
import { useEffect, useRef } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { notify } from '../../lib/confirm';
import { supabase } from '../../lib/supabase';
import { navigationRef } from '../../navigation/navigationRef';
import { clearLocalAccountData, resetAllLocalStores } from './clearLocalAccountData';
import { isDisplaced } from './singleDevice';
import { markIntentionalSignOut } from '../auth/intentionalSignOut';

/** Foreground displacement-poll interval — now just a BACKSTOP to the realtime
 *  subscription (which carries the instant case), so it runs slowly to reduce RPC
 *  traffic. Raised 8s→30s once realtime went live (owner 2026-09-10). */
const POLL_MS = 30000;

export function SingleDeviceGuard() {
  const handling = useRef(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      if (handling.current) return;
      // Only meaningful for a signed-in account.
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      // Do NOT enforce while on the login/boot screens. A device that just signed
      // in on the Auth screen but hasn't pressed "Continue" yet has NOT claimed
      // itself, so it reads as "displaced" (the other device is still active) —
      // enforcing here raced the claim popup and signed the device out before it
      // could take over, locking the account out of a 2nd-device login (owner bug
      // 2026-09-10). The Auth flow (claimAndProceed) owns the claim/cancel choice;
      // the guard only enforces once the user is actually inside the app.
      const route = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
      if (!route || route === 'Auth' || route === 'Splash') return;
      if (!(await isDisplaced())) return;
      if (!alive || handling.current) return;
      handling.current = true;
      try {
        // This guard handles its own navigation (reset to Splash below), so mark
        // the sign-out intentional — SessionExpiryGuard must not also reset.
        markIntentionalSignOut();
        await supabase.auth.signOut().catch(() => {});
        await clearLocalAccountData();
        resetAllLocalStores();
        if (navigationRef.isReady()) {
          navigationRef.reset({ index: 0, routes: [{ name: 'Splash' as never }] });
        }
        notify(
          'Signed out',
          'Your account was signed in on another device. Only one device can be signed in at a time.',
        );
      } finally {
        handling.current = false;
      }
    };

    // FALLBACK poll (owner 2026-09-10): while FOREGROUNDED, poll every POLL_MS so
    // a displaced device still signs out even if realtime is unavailable/dropped.
    // Realtime (below) carries the instant case; this is the backstop. Polling
    // stops in the background (no battery/network drain; iOS suspends timers there
    // anyway) and resumes + checks immediately on return.
    let poll: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (poll) return;
      poll = setInterval(() => void check(), POLL_MS);
    };
    const stopPolling = () => {
      if (poll) {
        clearInterval(poll);
        poll = undefined;
      }
    };

    void check();
    startPolling();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        void check();
        startPolling();
      } else {
        stopPolling();
      }
    });

    // TRUE REALTIME (owner 2026-09-10; APE_ACTIVE_DEVICE_REALTIME_2026_09_10.SQL
    // applied): subscribe to our OWN active_device row (RLS-scoped delivery). Any
    // change means another device may have claimed → re-run the same vetted
    // check() so a displaced device signs out within ~1s instead of waiting for
    // the poll. Reuses check() so realtime + poll share one sign-out path.
    const channel = supabase
      .channel('active_device_watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_device' },
        () => void check(),
      )
      .subscribe();

    return () => {
      alive = false;
      stopPolling();
      sub.remove();
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
