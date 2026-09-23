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
  | {
      status: "found";
      profile: CommunityPublicProfile;
      credentials: CommunityPublicCredential[];
      /** TRUE when the credentials read FAILED, as distinct from a member who
       *  genuinely holds none. The view must not present the two the same way. */
      credentialsUnavailable?: boolean;
    }
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
    /**
     * ⛔ `c.error` USED TO BE DROPPED ON THE FLOOR while `p.error` was checked.
     * This is the page a member shares with a prospective employer, and
     * `CommunityProfileView` hides the whole "Verified credentials" block when
     * the list is empty — so a failed credentials read presented that member as
     * holding NO CREDENTIALS AT ALL. Stated as fact, with no error and no retry.
     *
     * And the likely trigger is not a blip. It is the failure this project has
     * already shipped once: a public-catalog RPC with an RLS policy but NO GRANT
     * returns zero rows rather than an error, so EVERY profile would show zero
     * credentials, permanently, and nothing would look broken.
     *
     * The app fixed exactly this on 2026-09-18 (`src/features/directory/api.ts`,
     * which returns a three-state result); this web copy was missed until the
     * 2026-09-23 hunt. The profile still renders — losing the whole page over
     * the credentials block would be the wrong trade — but the block now says
     * it could not be loaded rather than implying there is nothing to show.
     */
    return {
      status: "found",
      profile,
      credentials: c.error ? [] : ((c.data ?? []) as CommunityPublicCredential[]),
      credentialsUnavailable: !!c.error,
    };
  } catch {
    return { status: "error" };
  }
}
