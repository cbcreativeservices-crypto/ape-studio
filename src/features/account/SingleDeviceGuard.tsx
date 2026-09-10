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

/** Foreground displacement-poll interval. ~8s is near-real-time without hammering
 *  the server; lower it for snappier kicks, raise it to reduce RPC traffic. */
const POLL_MS = 8000;

export function SingleDeviceGuard() {
  const handling = useRef(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      if (handling.current) return;
      // Only meaningful for a signed-in account.
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
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

    // Near-real-time enforcement (owner 2026-09-10): while the app is in the
    // FOREGROUND, poll every POLL_MS so a displaced device signs out within a few
    // seconds of the account being claimed elsewhere — not only on the next
    // foreground. Polling stops in the background (no battery/network drain; iOS
    // suspends timers there anyway) and resumes + checks immediately on return.
    // (TRUE instant push would need a Supabase Realtime subscription on
    // active_device + an own-row SELECT RLS policy — deferred, backend-frozen.)
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
    return () => {
      alive = false;
      stopPolling();
      sub.remove();
    };
  }, []);

  return null;
}
