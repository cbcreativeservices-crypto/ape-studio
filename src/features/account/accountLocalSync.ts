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

/** Handle a SIGNED_IN event: wipe + reset only when the user actually changed. */
async function syncLocalToUser(userId: string): Promise<void> {
  let prev: string | null = null;
  try {
    prev = await AsyncStorage.getItem(LOCAL_USER_ID_KEY); // OLD marker, BEFORE clear
  } catch {
    prev = null;
  }
  if (prev === userId) return; // same user re-auth / session restore — never wipe

  await clearLocalAccountData(); // removes ape:localUserId among the rest
  resetAllLocalStores();
  try {
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, userId); // NEW marker, AFTER clear
  } catch {
    // best-effort — a failed write just means we re-check next SIGNED_IN
  }
}

/**
 * Mount once at the app root. Subscribes to auth state and clears device-local
 * data whenever the signed-in user differs from the one on the device. Cleans
 * up its subscription on unmount.
 */
export function useAccountLocalSync(): void {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN') return;
      const userId = session?.user?.id;
      if (!userId) return;
      void syncLocalToUser(userId);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
}
