import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client for the companion site.
 *
 * Same backend as the mobile app (project yjgolswjggmlpeowvtxr). Uses the
 * PUBLISHABLE anon key only — never a service-role key in the browser. All
 * reads are RLS-scoped to the signed-in user (own_user / ent_self_read /
 * own_enrollment / own_achievement_progress), exactly like the app.
 *
 * Accounts are created in the mobile app (email/password + registration code);
 * the web is SIGN-IN ONLY.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

/** Lazily create a singleton browser client (client components only). */
export function getSupabaseBrowser(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Web: allow password-recovery links to establish a session from the URL.
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
