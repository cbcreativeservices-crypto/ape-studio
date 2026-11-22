import { getSupabaseBrowser } from "./supabase";

/**
 * The public credential catalog shown on the verify / registry pages (owner
 * 2026-10-31): every active Specialization Certificate and Professional
 * Certificate Program, with the topics each one requires — read live from the
 * same tables the app uses (anon SELECT: certificates, certificate_topics,
 * programs, program_topics, achievements).
 *
 * Labs (D35, live 2026-11-22): the labs each credential requires beyond the
 * shared Audio Fundamentals come from Comp A's read-only
 * public_credential_labs() (anon + authenticated). If that read fails, the
 * catalog still shows, just without the labs list.
 */

/** Required of every certificate and program (app: COREQ_TOPIC_GS in src/screens/awards/awardsData.ts). */
export const CORE_TOPIC_GS = [3060, 3070, 3081, 4370];
/** Audio Fundamentals (3081) is the required LABS for everyone, not a topic (owner 2026-11-01). */
export const AUDIO_FUNDAMENTALS_GS = 3081;

export type CatalogKind = "certificate" | "program";

export type CatalogEntry = {
  kind: CatalogKind;
  id: string;
  name: string;
  /** Anchor id used by the holder's credential list to jump here. */
  anchor: string;
  track: string | null;
  topics: string[];
  /** Labs this credential requires beyond the shared Audio Fundamentals, in catalog order. */
  labs: string[];
};

export type Catalog = {
  core: string[];
  certificates: CatalogEntry[];
  programs: CatalogEntry[];
};

/** Stable anchor from a credential's kind + name (the verify rows carry the name, not the id). */
export function catalogAnchor(kind: string, name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${kind.toLowerCase() === "program" ? "program" : "certificate"}-${slug}`;
}

type TopicRow = { gs: number; seq: number | null };
type LabRow = { credential_type: string; credential_id: string; lab_name: string; sort_order: number | null };

/** credential id → lab names (sorted). An unreadable list gives an empty map, never a failed catalog. */
async function credentialLabs(): Promise<Map<string, string[]>> {
  const m = new Map<string, LabRow[]>();
  try {
    const { data, error } = await getSupabaseBrowser().rpc("public_credential_labs");
    if (error) return new Map();
    for (const r of (data ?? []) as LabRow[]) m.set(r.credential_id, [...(m.get(r.credential_id) ?? []), r]);
  } catch {
    return new Map();
  }
  const out = new Map<string, string[]>();
  for (const [id, rows] of m) {
    const names = rows
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.lab_name.localeCompare(b.lab_name))
      .map((r) => r.lab_name);
    out.set(id, [...new Set(names)]);
  }
  return out;
}
type CredRow = { id: string; name: string; track: string | null; is_active: boolean };

async function allRows<T>(table: string, columns: string): Promise<T[]> {
  const supabase = getSupabaseBrowser();
  const out: T[] = [];
  // PostgREST caps a response at 1000 rows; program_topics has more.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return out;
  }
}

export async function loadCatalog(): Promise<Catalog | null> {
  try {
    const [certs, progs, certTopics, progTopics, achievements, labs] = await Promise.all([
      allRows<CredRow>("certificates", "id,name,track,is_active").then((r) => r.filter((x) => x.is_active)),
      allRows<CredRow>("programs", "id,name,track,is_active").then((r) => r.filter((x) => x.is_active)),
      allRows<TopicRow & { certificate_id: string; is_required: boolean }>(
        "certificate_topics",
        "certificate_id,gs,seq,is_required",
      ),
      allRows<TopicRow & { program_id: string }>("program_topics", "program_id,gs,seq"),
      allRows<{ global_sequence: number; name: string }>("achievements", "global_sequence,name"),
      credentialLabs(),
    ]);

    const topicName = new Map(achievements.map((a) => [a.global_sequence, a.name]));
    const names = (rows: TopicRow[]) =>
      rows
        .slice()
        // The core topics are listed once, above; not again per credential.
        .filter((r) => !CORE_TOPIC_GS.includes(r.gs))
        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
        .map((r) => topicName.get(r.gs))
        .filter((n): n is string => !!n);

    const byOwner = <R extends TopicRow>(rows: R[], key: (r: R) => string) => {
      const m = new Map<string, R[]>();
      for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
      return m;
    };
    const ct = byOwner(certTopics.filter((r) => r.is_required), (r) => r.certificate_id);
    const pt = byOwner(progTopics, (r) => r.program_id);
    const byName = (a: CatalogEntry, b: CatalogEntry) => a.name.localeCompare(b.name);

    return {
      core: CORE_TOPIC_GS.filter((gs) => gs !== AUDIO_FUNDAMENTALS_GS)
        .map((gs) => topicName.get(gs))
        .filter((n): n is string => !!n),
      certificates: certs
        .map((c) => ({
          kind: "certificate" as const,
          id: c.id,
          name: c.name,
          anchor: catalogAnchor("certificate", c.name),
          track: c.track,
          topics: names(ct.get(c.id) ?? []),
          labs: labs.get(c.id) ?? [],
        }))
        .sort(byName),
      programs: progs
        .map((p) => ({
          kind: "program" as const,
          id: p.id,
          name: p.name,
          anchor: catalogAnchor("program", p.name),
          track: p.track,
          topics: names(pt.get(p.id) ?? []),
          labs: labs.get(p.id) ?? [],
        }))
        .sort(byName),
    };
  } catch {
    return null;
  }
}
