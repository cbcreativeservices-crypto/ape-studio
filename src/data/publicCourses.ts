/**
 * Public course catalog — commercial-first structure (CM1, Booth 2026-07-11).
 *
 * v2.13 LIVE (backend handoff 2026-07-16): the catalog SSoT is now the
 * anon-readable `public_courses` / `public_course_topics` tables —
 * `getPublicCatalog()` fetches them (cached per app run) and FALLS BACK to the
 * bundled seed on any error, so the carousel never blanks offline. Topic names
 * prefer the SEED's public names (Booth rule: no academic codes in public UI);
 * server rows supply the structure.
 *
 * Placement legend:
 *   "P" = primary placement · "X" = cross-listed (shared completion — one
 *   completion of the achievement satisfies every course it appears in).
 *
 * `gs` = achievements.global_sequence — resolve to achievement UUIDs at runtime
 * from the existing achievements query. NEVER hardcode UUIDs here.
 */
import seed from './public_courses_seed.json';
import { supabase } from '../lib/supabase';

export type Placement = 'P' | 'X';

export type PublicTopic = {
  seq: number; // order within the course (drives dashboard sequence + server clamp)
  gs: number; // achievements.global_sequence
  name: string;
  placement: Placement;
};

export type PublicCourse = {
  order: number; // catalog order (left→right after Audio Tools + Glossary)
  name: string;
  topics: PublicTopic[];
};

export const PUBLIC_COURSES: PublicCourse[] = (seed.courses as PublicCourse[])
  .slice()
  .sort((a, b) => a.order - b.order);

/** Free topics playable end-to-end without academy (gs0, gs36). Booth ruling:
 *  gs36 is "DAW Skills" — NEVER "DAW Fundamentals". */
export const FREE_TOPIC_GS = [0, 36] as const;
export const isFreeTopicGs = (gs: number): boolean => (FREE_TOPIC_GS as readonly number[]).includes(gs);

/** Does this course contain a free topic (gs0 / gs36)? Free-tier users can
 *  open such a course; the server clamps the non-free topics inside (CM6). */
export const courseHasFreeTopic = (c: PublicCourse): boolean =>
  c.topics.some((t) => isFreeTopicGs(t.gs));

/** The 2 free topics as standalone entries (Booth 2026-07-11): name + the
 *  course (order) where each is PRIMARY, so a free-topic card opens the right
 *  dashboard. gs36 name = "DAW Skills" (never "DAW Fundamentals"). */
export type FreeTopicEntry = { gs: number; name: string; courseOrder: number };
export const FREE_TOPICS: FreeTopicEntry[] = FREE_TOPIC_GS.map((gs) => {
  for (const c of PUBLIC_COURSES) {
    const t = c.topics.find((tt) => tt.gs === gs && tt.placement === 'P');
    if (t) return { gs, name: t.name, courseOrder: c.order };
  }
  // Fallback: first occurrence anywhere.
  for (const c of PUBLIC_COURSES) {
    const t = c.topics.find((tt) => tt.gs === gs);
    if (t) return { gs, name: t.name, courseOrder: c.order };
  }
  return { gs, name: `Topic ${gs}`, courseOrder: 1 };
});

/** All distinct global_sequence values referenced by the catalog. */
export const ALL_PUBLIC_TOPIC_GS: number[] = Array.from(
  new Set(PUBLIC_COURSES.flatMap((c) => c.topics.map((t) => t.gs))),
).sort((a, b) => a - b);

// ---- v2.13 runtime catalog (backend handoff 2026-07-16) ----

/** Seed public topic names by gs — override server (achievement) names so no
 *  academic naming leaks into public UI (Booth §1 rule). */
const SEED_NAME_BY_GS = new Map<number, string>(
  PUBLIC_COURSES.flatMap((c) => c.topics.map((t) => [t.gs, t.name] as [number, string])),
);

let catalogCache: PublicCourse[] | null = null;

/**
 * The live public catalog from `public_courses` / `public_course_topics`
 * (anon-readable), shaped exactly like PUBLIC_COURSES. Cached for the app run;
 * ANY error/empty result falls back to the bundled seed (identical structure
 * as of 2026-07-16), so callers never fail on this.
 */
export async function getPublicCatalog(): Promise<PublicCourse[]> {
  if (catalogCache) return catalogCache;
  try {
    const [{ data: courses, error: cErr }, { data: topics, error: tErr }, { data: ach, error: aErr }] =
      await Promise.all([
        supabase
          .from('public_courses')
          .select('id, slug, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order'),
        supabase.from('public_course_topics').select('public_course_id, achievement_id, placement, seq').order('seq'),
        supabase.from('achievements').select('id, name, global_sequence'),
      ]);
    if (cErr || tErr || aErr || !courses?.length || !topics?.length || !ach?.length) {
      throw new Error(cErr?.message ?? tErr?.message ?? aErr?.message ?? 'empty catalog');
    }
    const achById = new Map((ach as any[]).map((a) => [a.id, a]));
    const built: PublicCourse[] = (courses as any[]).map((c) => ({
      order: c.sort_order,
      name: c.display_name,
      topics: (topics as any[])
        .filter((t) => t.public_course_id === c.id)
        .map((t) => {
          const a = achById.get(t.achievement_id);
          if (!a) return null;
          return {
            seq: t.seq,
            gs: a.global_sequence,
            name: SEED_NAME_BY_GS.get(a.global_sequence) ?? a.name,
            placement: (t.placement === 'X' ? 'X' : 'P') as Placement,
          };
        })
        .filter(Boolean) as PublicTopic[],
    }));
    catalogCache = built;
    return built;
  } catch (e) {
    console.warn('[catalog] server catalog unavailable, using seed:', (e as Error).message);
    return PUBLIC_COURSES;
  }
}

/** Free-topic taster entries derived from a catalog (same rules as FREE_TOPICS). */
export function freeTopicsFrom(catalog: PublicCourse[]): FreeTopicEntry[] {
  return FREE_TOPIC_GS.map((gs) => {
    for (const c of catalog) {
      const t = c.topics.find((tt) => tt.gs === gs && tt.placement === 'P');
      if (t) return { gs, name: gs === 36 ? 'DAW Skills' : t.name, courseOrder: c.order };
    }
    for (const c of catalog) {
      const t = c.topics.find((tt) => tt.gs === gs);
      if (t) return { gs, name: gs === 36 ? 'DAW Skills' : t.name, courseOrder: c.order };
    }
    return { gs, name: `Topic ${gs}`, courseOrder: 1 };
  });
}
