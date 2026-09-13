/**
 * Supabase client — the ONLY backend entry point for this app.
 *
 * Backend is DONE and LIVE (project yjgolswjggmlpeowvtxr, SCHEMA v2.12).
 * NO backend changes may be made from this client — RPC calls only.
 *
 * Session storage (vibe-security 2026-09-04): on device the JWT + refresh token
 * live in the OS keychain via `authStorage` (encrypted `expo-secure-store`),
 * NOT AsyncStorage plaintext. On web it falls back to AsyncStorage. Auto-refresh
 * is gated on app foreground. `authStorage.native.ts` is a NATIVE module and
 * needs a fresh dev/native build to take effect on the device.
 */
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';
import { authStorage } from './authStorage';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No deep-link/URL session detection in a native app.
    detectSessionInUrl: false,
  },
});

// Only refresh the JWT while the app is foregrounded (Supabase RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * DEV-ONLY boot line for the session-logout investigation (2026-09-13).
 *
 * The Pixel landed on the auth gate twice after a reload, which would be a
 * launch blocker if a cold start loses the session. The storage layer has since
 * been CLEARED: expo-secure-store is present on the device, and the chunked
 * keychain adapter round-trips 1.2 KB / 4 KB / 9 KB payloads intact — so the
 * scariest explanation (every user logged out on every launch) is not it.
 *
 * This one line is what settles the rest: sign in, reload, and read it.
 *   session=YES → the session persisted; the earlier observation was something
 *                 else (most likely the app was not actually signed in then).
 *   session=no  → a real loss, and `storedLen` says whether the token was
 *                 written at all or written and then removed.
 *
 * Never logs a token — presence and length only. REMOVE once resolved.
 */
if (__DEV__) {
  void (async () => {
    try {
      const ref = SUPABASE_URL.split('//')[1]?.split('.')[0] ?? '';
      const raw = await authStorage.getItem(`sb-${ref}-auth-token`);
      const { data } = await supabase.auth.getSession();
      console.warn(`[authprobe] storedLen=${raw ? raw.length : 'null'} session=${data.session ? 'YES' : 'no'}`);
    } catch (e) {
      console.warn('[authprobe] threw:', e instanceof Error ? e.message : String(e));
    }
  })();
}
