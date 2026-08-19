import { getSupabaseBrowser } from "./supabase";

export type TubeFamily = "preamp" | "power" | "dht" | "rectifier";

export type Tube = {
  num: number;
  id: string;
  short: string;
  name: string;
  alt: string[];
  family: TubeFamily;
  base: string;
  role: string;
  stem: string;
};

export const TUBE_PAGES = 2 as const;

export const FAMILY_META: { key: TubeFamily; title: string; note: string }[] = [
  { key: "preamp", title: "Preamp & Small-Signal Triodes", note: "Voltage gain at the front of the chain." },
  { key: "power", title: "Power Pentodes & Beam Tetrodes", note: "Current into the output transformer." },
  { key: "dht", title: "Directly-Heated Triodes", note: "The filament is the cathode — classic single-ended sound." },
  { key: "rectifier", title: "Rectifiers", note: "AC → DC for the B+ supply; sag and warm-up character." },
];

/** Read the web tube catalog (metadata only) from the tubes table (DB-4).
 *  RLS restricts this to signed-in members. */
export async function fetchTubes(): Promise<Tube[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("tubes")
    .select("num, id, short, name, alt, family, base, role, stem")
    .eq("is_active", true)
    .order("num");
  if (error) throw error;
  return (data ?? []) as Tube[];
}

export async function getTube(id: string): Promise<Tube | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("tubes")
    .select("num, id, short, name, alt, family, base, role, stem")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data as Tube) ?? null;
}

export function searchTubes(tubes: Tube[], query: string): Tube[] {
  const q = query.trim().toLowerCase();
  if (!q) return tubes;
  return tubes.filter((t) =>
    [t.short, t.name, t.base, t.role, ...t.alt].join(" ").toLowerCase().includes(q),
  );
}

/**
 * Request a short-lived signed URL for one secured card page via the
 * entitlement-gated Edge Function (DB-5). The function verifies the caller's
 * session + active academy entitlement server-side before issuing the URL, so
 * the private bucket is never exposed. Returns null if not signed in, not
 * entitled, or the function isn't reachable/deployed yet.
 */
export async function fetchTubePageUrl(
  stem: string,
  page: 1 | 2,
): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/functions/v1/tube-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(anon ? { apikey: anon } : {}),
      },
      body: JSON.stringify({ stem, page }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { url?: string };
    return j.url ?? null;
  } catch {
    return null;
  }
}
