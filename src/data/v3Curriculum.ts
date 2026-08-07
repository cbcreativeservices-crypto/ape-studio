/**
 * v3 curriculum (owner 2026-08-06) — the LIVE curriculum the app browses/enrolls.
 * The old bundled v2 matrix (courseTopicMatrix.ts) + the public_courses catalog
 * are RETIRED. v3 topics are organized FIELD → SUBJECT → TOPIC and enrolled per
 * topic via "My Enrollments" (user_topic_enrollments), which is the master list
 * the backend gates study/quiz on. Fetched at runtime from Supabase so the client
 * doesn't carry a 171-topic static file; topic identity is `gs`
 * (achievements.global_sequence), same key the enrollment store uses.
 */
import { supabase } from '../lib/supabase';

/** The active v3 curriculum version id (resolve-by-status is the source of truth,
 *  but this is the current active id; kept in one place for the client filter). */
export const V3_CURRICULUM_VERSION_ID = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';

export type V3Topic = {
  gs: number; // achievements.global_sequence — the enrollment key
  achievementId: string;
  name: string;
  field: string;
  subject: string;
  free: boolean;
  methods: string[];
};

export type V3Subject = { subject: string; topics: V3Topic[] };
export type V3Field = { field: string; subjects: V3Subject[] };

/**
 * Fetch the whole v3 curriculum grouped Field → Subject → Topic. Falls back to an
 * empty list on error (callers render an honest empty state rather than crash).
 */
export async function fetchV3Curriculum(): Promise<V3Field[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, name, global_sequence, field, subject, always_free, applicable_methods')
      .eq('curriculum_version_id', V3_CURRICULUM_VERSION_ID)
      .eq('is_active', true)
      .order('field')
      .order('subject')
      .order('global_sequence');
    if (error || !data) return [];

    const byField = new Map<string, Map<string, V3Topic[]>>();
    for (const r of data as any[]) {
      const field = (r.field as string) ?? 'Other';
      const subject = (r.subject as string) ?? 'General';
      const topic: V3Topic = {
        gs: r.global_sequence as number,
        achievementId: r.id as string,
        name: r.name as string,
        field,
        subject,
        free: !!r.always_free,
        methods: (r.applicable_methods as string[]) ?? [],
      };
      if (!byField.has(field)) byField.set(field, new Map());
      const subs = byField.get(field)!;
      if (!subs.has(subject)) subs.set(subject, []);
      subs.get(subject)!.push(topic);
    }

    return [...byField.entries()].map(([field, subs]) => ({
      field,
      subjects: [...subs.entries()].map(([subject, topics]) => ({ subject, topics })),
    }));
  } catch {
    return [];
  }
}

/** Flat list of all v3 topics (for lookups by gs / achievementId). */
export function flattenV3(fields: V3Field[]): V3Topic[] {
  return fields.flatMap((f) => f.subjects.flatMap((s) => s.topics));
}

/** A v3 credential (program or certificate) with its member-topic gs list — the
 *  shape the enrollment browse consumes (owner 2026-08-06). */
export type V3Credential = { slug: string; name: string; topicsGs: number[] };

/** Active v3 PROGRAMS with their required (non-elective) member topics, ordered. */
export async function fetchV3Programs(): Promise<V3Credential[]> {
  try {
    const { data: progs } = await supabase
      .from('programs')
      .select('id, slug, name, sequence')
      .eq('is_active', true)
      .order('sequence');
    if (!progs?.length) return [];
    const ids = (progs as any[]).map((p) => p.id);
    const { data: links } = await supabase
      .from('program_topics')
      .select('program_id, gs, seq, is_elective')
      .in('program_id', ids)
      .order('seq');
    const byProg = new Map<string, number[]>();
    for (const l of (links ?? []) as any[]) {
      if (l.is_elective) continue;
      if (l.gs == null) continue;
      if (!byProg.has(l.program_id)) byProg.set(l.program_id, []);
      byProg.get(l.program_id)!.push(l.gs);
    }
    return (progs as any[])
      .map((p) => ({ slug: p.slug as string, name: p.name as string, topicsGs: byProg.get(p.id) ?? [] }))
      .filter((p) => p.topicsGs.length > 0);
  } catch {
    return [];
  }
}

/** Active v3 CERTIFICATES with their required member topics, ordered. */
export async function fetchV3Certs(): Promise<V3Credential[]> {
  try {
    const { data: certs } = await supabase
      .from('certificates')
      .select('id, slug, name, sequence')
      .eq('is_active', true)
      .order('sequence');
    if (!certs?.length) return [];
    const ids = (certs as any[]).map((c) => c.id);
    const { data: links } = await supabase
      .from('certificate_topics')
      .select('certificate_id, gs, seq, is_required')
      .in('certificate_id', ids)
      .order('seq');
    const byCert = new Map<string, number[]>();
    for (const l of (links ?? []) as any[]) {
      if (l.gs == null) continue;
      if (!byCert.has(l.certificate_id)) byCert.set(l.certificate_id, []);
      byCert.get(l.certificate_id)!.push(l.gs);
    }
    return (certs as any[])
      .map((c) => ({ slug: c.slug as string, name: c.name as string, topicsGs: byCert.get(c.id) ?? [] }))
      .filter((c) => c.topicsGs.length > 0);
  } catch {
    return [];
  }
}
