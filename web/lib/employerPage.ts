/**
 * The public page of a verified EMPLOYER or INSTRUCTOR — /e/<public_token>
 * (must-do H5, owner GO 2026-10-29: "yes build the public page for employers
 * and instructors").
 *
 * The member's page is /u/<token> (web/lib/community.ts). This is its
 * counterpart for the other side of a contact request: a member who was
 * written to can check who is asking, and an employer or instructor can hand
 * the link to anyone.
 *
 * `employer_profile_public(p_token)` (live, read 2026-10-29) is SECURITY
 * DEFINER, callable by anon, and answers the row when the token matches and
 * `revoked_at is null`. It does NOT check `verified_at`, so this page does:
 * a row with no verified date is shown as not found, never as a page with a
 * badge it has not earned. Tokens are random uuids and cannot be listed
 * (migration 2026091905), so the page is reachable only by its link.
 *
 * Nothing private is returned: company name, website, about, verified date,
 * kind. No email, no person's name, no user id.
 */
import { getSupabaseBrowser } from "./supabase";
import { cleanToken, pageFromRow, type EmployerPageOutcome } from "./employerPageRules";

export * from "./employerPageRules";

export async function fetchEmployerPage(token: string): Promise<EmployerPageOutcome> {
  const t = cleanToken(token);
  if (!t) return { status: "notFound" };
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.rpc("employer_profile_public", { p_token: t });
    if (error) return { status: "error" };
    const page = pageFromRow(((data ?? []) as unknown[])[0]);
    return page ? { status: "found", page } : { status: "notFound" };
  } catch {
    return { status: "error" };
  }
}
