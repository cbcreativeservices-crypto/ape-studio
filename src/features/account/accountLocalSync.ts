/**
 * accountLocalSync — ACCOUNT-SWITCH detection (user bug 2026-07-26).
 *
 * Logging in as a DIFFERENT user erases the backend link but historically left
 * the PREVIOUS user's device-local data on the phone. This hook subscribes to
 * Supabase auth and, on SIGNED_IN, compares the new user id against a stored
 * marker (`ape:localUserId`):
 *   • DIFFERENT user (or first-ever login, marker absent) → wipe device-local
 *     data + reset in-memory store caches, then write the new id.
 *   • SAME user (session restore / token re-auth) → do nothing (must NOT wipe).
 *
 * Mounted once at the app root (App.tsx), kept SEPARATE from the audio
 * onAuthStateChange in AudioOutputGate.
 *
 * ORDERING (critical): clearLocalAccountData() removes `ape:localUserId` (it's
 * `ape:*` and not on the KEEP allowlist), so the OLD marker is read BEFORE
 * clearing and the NEW marker is written AFTER clearing.
 */
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { clearLocalAccountData, resetAllLocalStores } from './clearLocalAccountData';

/** Marker holding the id of the user whose data currently lives on the device.
 *  Deliberately NOT on clearLocalAccountData's KEEP list — it is re-written
 *  AFTER every clear rather than preserved through it. */
const LOCAL_USER_ID_KEY = 'ape:localUserId';

/** The device's current IDENTITY = the signed-in user id, or '' for no-account
 *  (guest / signed-out). Wipe + reset only when it actually CHANGES. */
async function syncLocalToIdentity(identity: string): Promise<void> {
  let prev: string | null = null;
  try {
    prev = await AsyncStorage.getItem(LOCAL_USER_ID_KEY); // OLD marker, BEFORE clear
  } catch {
    prev = null;
  }
  if (prev === identity) return; // same identity (session restore / re-auth) — never wipe

  await clearLocalAccountData(); // removes ape:localUserId among the rest
  resetAllLocalStores();
  try {
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, identity); // NEW marker, AFTER clear
  } catch {
    // best-effort — a failed write just means we re-check on the next event
  }
}

/**
 * Mount once at the app root. Clears device-local data whenever the IDENTITY
 * changes — a different user signs in, OR the user signs OUT / enters no-account
 * (identity ''). This is what makes a LOG OUT (and a fresh Guest start) reset the
 * previous account's enrollment list, Home cards, and lab/tool state instead of
 * leaking them into the next session (user bug 2026-08-13). A same-user session
 * restore keeps everything. Cleans up its subscription on unmount.
 */
export function useAccountLocalSync(): void {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_IN (login), SIGNED_OUT (logout → guest), INITIAL_SESSION (cold
      // start). TOKEN_REFRESHED and the like keep the same identity, so the
      // prev===identity guard above no-ops them.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        void syncLocalToIdentity(session?.user?.id ?? '');
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
}
