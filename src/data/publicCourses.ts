/**
 * Public course catalog — the Home carousel's course content.
 *
 * OWNER RULING 2026-09-03: catalog orders 2–9 were courses at Booth's college
 * and have no relation to this app. They are gone — from this seed, from the
 * Home carousel, and (by the accompanying SQL package) from the database.
 * Only order 1, the Pro Audio Safety free taster, remains.
 *
 * That ruling also retired the v1 `public_courses` / `public_course_topics`
 * fetch: `getPublicCatalog()` no longer touches the database, because leaving
 * the query in place would let the removed college courses reappear in the
 * carousel the moment the tables answered. The bundled seed is now the only
 * source, which is exactly what it always rendered — the two were compared
 * row for row before the fetch was cut, and produced an identical deck.
 *
 * Placement legend:
 *   "P" = primary placement · "X" = cross-listed (shared completion — one
 *   completion of the achievement satisfies every course it appears in).
 *
 * `gs` = achievements.global_sequence — resolve to achievement UUIDs at runtime
 * from the existing achievements query. NEVER hardcode UUIDs here.
 */
import seed from './public_courses_seed.json';

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

/**
 * Names for the two free tasters, held here rather than read out of the
 * catalog. gs36's host course was Music Production — one of the college
 * courses removed on 2026-09-03 — so the catalog can no longer supply its
 * name, and without this the card would render the placeholder "this topic".
 * Both names are the pre-override raw titles: the Home screen re-titles gs0 to
 * "Pro Audio Safety", and CARD_TITLE_RENAMES re-titles gs36 to
 * "DAW Fundamentals & Session Management". Changing either string here changes
 * what the carousel shows.
 */
const FREE_TOPIC_NAME: Record<number, string> = {
  0: 'Professional Audio Safety',
  36: 'DAW Skills',
};

/** Every free taster opens the surviving order-1 course context. */
const FREE_TOPIC_HOME_ORDER = 1;

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
  return { gs, name: FREE_TOPIC_NAME[gs] ?? 'this topic', courseOrder: FREE_TOPIC_HOME_ORDER };
});

/** All distinct global_sequence values referenced by the catalog. */
export const ALL_PUBLIC_TOPIC_GS: number[] = Array.from(
  new Set(PUBLIC_COURSES.flatMap((c) => c.topics.map((t) => t.gs))),
).sort((a, b) => a - b);

/**
 * The public catalog. Reads the bundled seed and nothing else.
 *
 * This used to fetch `public_courses` / `public_course_topics` and fall back to
 * the seed. The fetch is gone (owner 2026-09-03): those tables still hold the
 * eight college courses, so querying them would put the removed cards straight
 * back into the carousel. Still async so every caller is unchanged.
 */
export async function getPublicCatalog(): Promise<PublicCourse[]> {
  return PUBLIC_COURSES;
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
    return { gs, name: FREE_TOPIC_NAME[gs] ?? 'this topic', courseOrder: FREE_TOPIC_HOME_ORDER };
  });
}
