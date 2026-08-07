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
