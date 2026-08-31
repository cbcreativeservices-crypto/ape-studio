import { getSupabaseBrowser } from "./supabase";

/**
 * The public Audio Community Directory profile.
 *
 * Reached at /u/<public_token>. This token belongs to the COMMUNITY PROFILE and
 * is deliberately not the credential QR token: a member can delete their
 * community profile without disturbing a credential link they have already
 * handed out (spec §4.4). Both RPCs are gated server-side on the profile being
 * published, so unpublishing makes this page resolve to "not found" rather than
 * merely hiding parts of it.
 *
 * No email address is returned by either call, for anyone, ever.
 */

export type CommunityPublicProfile = {
  display_name: string;
  about: string | null;
  country_code: string | null;
  region: string | null;
  work_pref: "remote" | "local" | "either" | null;
  primary_area: string | null;
  areas: string[] | null;
  specialties: string[] | null;
  roles: string[] | null;
  open_to: string[] | null;
  languages: string[] | null;
  contact_enabled: boolean;
};

export type CommunityPublicCredential = {
  credential_type: string;
  credential_name: string;
  level_or_tier: string | null;
  earned_at: string | null;
  verify_token: string | null;
};

export type CommunityOutcome =
  | { status: "found"; profile: CommunityPublicProfile; credentials: CommunityPublicCredential[] }
  | { status: "notFound" }
  | { status: "error" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchCommunityProfile(token: string): Promise<CommunityOutcome> {
  const t = token.trim();
  if (!UUID_RE.test(t)) return { status: "notFound" };
  try {
    const supabase = getSupabaseBrowser();
    const [p, c] = await Promise.all([
      supabase.rpc("community_profile_public", { p_token: t }),
      supabase.rpc("community_profile_public_credentials", { p_token: t }),
    ]);
    if (p.error) return { status: "error" };
    const profile = ((p.data ?? []) as CommunityPublicProfile[])[0];
    if (!profile) return { status: "notFound" };
    return {
      status: "found",
      profile,
      credentials: (c.data ?? []) as CommunityPublicCredential[],
    };
  } catch {
    return { status: "error" };
  }
}
