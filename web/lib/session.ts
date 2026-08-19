import { getSupabaseBrowser } from "./supabase";

export type Tier = "anonymous" | "free" | "academy" | "lapsed";

/**
 * Client session + entitlement tier, mirroring the app's EntitlementProvider:
 * no session ⇒ anonymous; active non-expired academy entitlement ⇒ academy;
 * an academy row that's inactive/expired ⇒ lapsed; else ⇒ free.
 */
export async function getSessionState(): Promise<{
  signedIn: boolean;
  tier: Tier;
}> {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { signedIn: false, tier: "anonymous" };
  try {
    const { data: ents } = await supabase
      .from("entitlements")
      .select("status, expires_at")
      .eq("product", "academy");
    const acad = (ents ?? [])[0] as
      | { status?: string; expires_at?: string | null }
      | undefined;
    if (acad) {
      const notExpired =
        !acad.expires_at || new Date(acad.expires_at).getTime() > Date.now();
      return {
        signedIn: true,
        tier: acad.status === "active" && notExpired ? "academy" : "lapsed",
      };
    }
  } catch {
    // fall through to free
  }
  return { signedIn: true, tier: "free" };
}
