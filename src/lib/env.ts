/**
 * Environment access. Values come from .env via Expo's EXPO_PUBLIC_* inlining.
 * The anon key is the *publishable* key — safe to embed (Code brief §1).
 * Never place any other Supabase key here.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loud in dev: a missing .env is the single most common setup miss.
  console.warn(
    '[env] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing. ' +
      'Create ape-studio/.env (see .env.example) and restart the Metro bundler.',
  );
}

export const SUPABASE_URL = url ?? '';
export const SUPABASE_ANON_KEY = anonKey ?? '';
