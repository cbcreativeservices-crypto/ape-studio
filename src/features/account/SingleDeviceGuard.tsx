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

    void check();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') void check();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return null;
}
