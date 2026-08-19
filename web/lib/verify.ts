import { getSupabaseBrowser } from "./supabase";

export type VerifiedCredential = {
  holder_label: string;
  credential_type: string;
  credential_name: string;
  level_or_tier: string | null;
  track: string | null;
  earned_at: string | null;
};

export type VerifyOutcome =
  | { status: "found"; holder: string; credentials: VerifiedCredential[] }
  | { status: "notFound" }
  | { status: "error" };

/** Normalize a user-entered code for display/URLs (uppercase; O→0, I/L→1). */
export function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[OIL]/g, (c) => (c === "O" ? "0" : "1"))
    .replace(/[^0-9A-Z]/g, "");
}

/** Call the public, PII-minimal verifier RPC (anon-safe). */
export async function verifyCode(code: string): Promise<VerifyOutcome> {
  const clean = normalizeCode(code);
  if (!clean) return { status: "notFound" };
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.rpc("public_verify_credentials", {
      p_code: clean,
    });
    if (error) return { status: "error" };
    const rows = (data ?? []) as VerifiedCredential[];
    if (rows.length === 0) return { status: "notFound" };
    return { status: "found", holder: rows[0].holder_label, credentials: rows };
  } catch {
    return { status: "error" };
  }
}
