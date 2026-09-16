/**
 * v3 curriculum (owner 2026-08-06) — the LIVE curriculum the app browses/enrolls.
 * v3 topics are organized FIELD → SUBJECT → TOPIC and enrolled per
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
  /** achievements.icon_url — the topic's trophy art (Storage path); may be null
   *  until art is uploaded. Consumed by the Achievements trophy grid. */
  iconUrl: string | null;
};

export type V3Subject = { subject: string; topics: V3Topic[] };
export type V3Field = { field: string; subjects: V3Subject[] };

/**
 * ERROR MODEL (audit night 2026-09-13 — the "dishonest empty" root cause).
 * These helpers used to swallow EVERY failure into `[]`, so a dead connection
 * was indistinguishable from an empty catalog and screens rendered silent
 * blanks. The truth now lives in the `…Strict` functions, which REJECT on
 * failure and resolve `[]` only for a genuinely empty result set. Screens with
 * a loading/error/Retry state machine (CurriculumScreen M15, EnrollmentScreen
 * BROWSE & ADD) must use the Strict variants.
 *
 * The original names are kept as LENIENT wrappers (`Strict().catch(() => [])`)
 * ONLY because their remaining callers are bare `.then()` chains in files this
 * change may not touch — throwing there would manufacture unhandled rejections
 * (the audit's Q3 class). Those callers either compensate locally (AwardsScreen
 * `v3Loaded`) or use the data as non-fatal name enrichment (HomeSetupSheet,
 * CourseSelectionScreen, CareerFamilyScreen, ProfileScreen, achievements/api —
 * whose screens catch). New code: use the Strict variants.
 */
// Session memo (Bug+Hater night A1-07): every Achievements screen + Explore +
// Enrollments refetched the full 166-row curriculum on focus (3–4 s fills).
// The catalog is static for a session, so the first fetch is shared; a FAILED
// or empty result is NOT cached so a transient error retries next time.
let curriculumPromise: Promise<V3Field[]> | null = null;

/** Fetch the whole v3 curriculum grouped Field → Subject → Topic.
 *  REJECTS on any query/network failure; resolves `[]` only for a genuinely
 *  empty result set (which for the live 171-topic curriculum never happens, so
 *  M15-style screens may treat empty as error too). Shares the session memo. */
export function fetchV3CurriculumStrict(): Promise<V3Field[]> {
  if (!curriculumPromise) {
    curriculumPromise = loadV3Curriculum().then(
      (fields) => {
        if (fields.length === 0) curriculumPromise = null;
        return fields;
      },
      (err) => {
        curriculumPromise = null; // never cache a failure — Retry refetches
        throw err;
      },
    );
  }
  return curriculumPromise;
}

/** LENIENT legacy wrapper — `[]` on failure. See the error-model note above;
 *  prefer `fetchV3CurriculumStrict` anywhere that renders a load state. */
export function fetchV3Curriculum(): Promise<V3Field[]> {
  return fetchV3CurriculumStrict().catch(() => []);
}

async function loadV3Curriculum(): Promise<V3Field[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('id, name, global_sequence, field, subject, always_free, applicable_methods, icon_url')
    .eq('curriculum_version_id', V3_CURRICULUM_VERSION_ID)
    .eq('is_active', true)
    .order('field')
    .order('subject')
    .order('global_sequence');
  if (error) throw new Error(`v3 curriculum read failed: ${error.message}`);
  if (!data) throw new Error('v3 curriculum read failed: no data');

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
      iconUrl: (r.icon_url as string | null) ?? null,
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
}

/** Flat list of all v3 topics (for lookups by gs / achievementId). */
export function flattenV3(fields: V3Field[]): V3Topic[] {
  return fields.flatMap((f) => f.subjects.flatMap((s) => s.topics));
}

/** A v3 credential (program or certificate) with its member-topic gs list — the
 *  shape the enrollment browse consumes (owner 2026-08-06). */
/** `id` is the certificates/programs UUID — required by the Final Exam and
 *  award RPCs (award_required_topics / start_final_exam), which key on the
 *  award id, not the slug. */
export type V3Credential = { id: string; slug: string; name: string; topicsGs: number[]; electivesGs?: number[] };

/** Active v3 PROGRAMS with their required (non-elective) member topics, ordered.
 *  REJECTS on any query/network failure; `[]` only when no active program with
 *  member topics genuinely exists. */
export async function fetchV3ProgramsStrict(): Promise<V3Credential[]> {
  const { data: progs, error: progsError } = await supabase
    .from('programs')
    .select('id, slug, name, sequence')
    .eq('is_active', true)
    .order('sequence');
  if (progsError) throw new Error(`v3 programs read failed: ${progsError.message}`);
  if (!progs?.length) return [];
  const ids = (progs as any[]).map((p) => p.id);
  const { data: links, error: linksError } = await supabase
    .from('program_topics')
    .select('program_id, gs, seq, is_elective')
    .in('program_id', ids)
    .order('seq');
  if (linksError) throw new Error(`v3 program topics read failed: ${linksError.message}`);
  const byProg = new Map<string, number[]>();
  const electivesByProg = new Map<string, number[]>();
  for (const l of (links ?? []) as any[]) {
    if (l.gs == null) continue;
    const target = l.is_elective ? electivesByProg : byProg;
    if (!target.has(l.program_id)) target.set(l.program_id, []);
    target.get(l.program_id)!.push(l.gs);
  }
  return (progs as any[])
    .map((p) => ({
      id: p.id as string,
      slug: p.slug as string,
      name: p.name as string,
      topicsGs: byProg.get(p.id) ?? [],
      electivesGs: electivesByProg.get(p.id) ?? [],
    }))
    .filter((p) => p.topicsGs.length > 0);
}

/** LENIENT legacy wrapper — `[]` on failure. See the error-model note above. */
export function fetchV3Programs(): Promise<V3Credential[]> {
  return fetchV3ProgramsStrict().catch(() => []);
}

/** Active v3 CERTIFICATES with their required member topics, ordered.
 *  REJECTS on any query/network failure; `[]` only when no active certificate
 *  with member topics genuinely exists. */
export async function fetchV3CertsStrict(): Promise<V3Credential[]> {
  const { data: certs, error: certsError } = await supabase
    .from('certificates')
    .select('id, slug, name, sequence')
    .eq('is_active', true)
    .order('sequence');
  if (certsError) throw new Error(`v3 certificates read failed: ${certsError.message}`);
  if (!certs?.length) return [];
  const ids = (certs as any[]).map((c) => c.id);
  const { data: links, error: linksError } = await supabase
    .from('certificate_topics')
    .select('certificate_id, gs, seq, is_required')
    .in('certificate_id', ids)
    .order('seq');
  if (linksError) throw new Error(`v3 certificate topics read failed: ${linksError.message}`);
  const byCert = new Map<string, number[]>();
  for (const l of (links ?? []) as any[]) {
    if (l.gs == null) continue;
    if (!byCert.has(l.certificate_id)) byCert.set(l.certificate_id, []);
    byCert.get(l.certificate_id)!.push(l.gs);
  }
  return (certs as any[])
    .map((c) => ({ id: c.id as string, slug: c.slug as string, name: c.name as string, topicsGs: byCert.get(c.id) ?? [] }))
    .filter((c) => c.topicsGs.length > 0);
}

/** LENIENT legacy wrapper — `[]` on failure. See the error-model note above. */
export function fetchV3Certs(): Promise<V3Credential[]> {
  return fetchV3CertsStrict().catch(() => []);
}
