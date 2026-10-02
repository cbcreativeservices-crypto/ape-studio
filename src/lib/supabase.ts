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
import { createBoundedFetch } from './boundedCall';

/**
 * Every request this client makes has a deadline (pattern hunt A4,
 * 2026-10-02). React Native's fetch never times out on its own, so a stalled
 * socket used to be a promise that never settled. `global.fetch` is the one
 * door REST, auth, functions and storage all go through; see boundedCall.ts
 * for the budgets and what it does NOT cover (the keychain token read).
 */
const boundedFetch = createBoundedFetch(undefined, 'supabase');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No deep-link/URL session detection in a native app.
    detectSessionInUrl: false,
  },
  global: { fetch: boundedFetch },
});

// Only refresh the JWT while the app is foregrounded (Supabase RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
