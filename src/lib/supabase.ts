/**
 * Supabase client — the ONLY backend entry point for this app.
 *
 * Backend is DONE and LIVE (project yjgolswjggmlpeowvtxr, SCHEMA v2.12).
 * NO backend changes may be made from this client — RPC calls only.
 * Session persisted in AsyncStorage; auto-refresh gated on app foreground.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
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
