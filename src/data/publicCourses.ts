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

/** The two free tasters, playable end-to-end without academy.
 *
 *  Owner 2026-09-03: these are the v3 topics now, not the v1 pair [0, 36].
 *  Everything else already agreed on v3 — the enrollment store seeds
 *  FREE_ENROLL_GS = [3060, 3970], and the database paywall gate in
 *  glossary_study_v names the same pair. Home was the last thing still
 *  keyed on v1, and gs0 is being converted to 3060 by the topic package,
 *  which would have broken these cards outright. */
export const FREE_TOPIC_GS = [3060, 3970] as const;
export const isFreeTopicGs = (gs: number): boolean => (FREE_TOPIC_GS as readonly number[]).includes(gs);

/** Does this course contain one of the free tasters? Always false now: the
 *  tasters are v3 topics and the surviving seed course holds only v1 gs0.
 *  Kept because the type is exported; no live caller depends on it. */
export const courseHasFreeTopic = (c: PublicCourse): boolean =>
  c.topics.some((t) => isFreeTopicGs(t.gs));

/** The 2 free topics as standalone entries (Booth 2026-07-11). `courseOrder`
 *  is vestigial — the cards navigate by `gs` now. */
export type FreeTopicEntry = { gs: number; name: string; courseOrder: number };

/**
 * Names for the two free tasters. These are the codified v3 names and they are
 * exactly what the carousel shows — no screen-side re-titling any more, which
 * is what the old v1 pair needed (gs0 was re-titled by the Home screen and
 * gs36 by CARD_TITLE_RENAMES). Change a string here and the card changes.
 */
const FREE_TOPIC_NAME: Record<number, string> = {
  3060: 'Pro Audio Safety',
  3970: 'DAW Fundamentals & Session Management',
};

/** Legacy course context for the taster cards. The v1 catalog no longer holds
 *  these topics, so nothing resolves through it; the cards navigate by gs. */
const FREE_TOPIC_HOME_ORDER = 1;

export const FREE_TOPICS: FreeTopicEntry[] = FREE_TOPIC_GS.map((gs) => ({
  gs,
  name: FREE_TOPIC_NAME[gs] ?? 'this topic',
  courseOrder: FREE_TOPIC_HOME_ORDER,
}));

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

/** Free-topic taster entries. The catalog argument is ignored now that the
 *  tasters are v3 topics and the v1 catalog cannot describe them; it stays on
 *  the signature so the Home screen call site is unchanged. */
export function freeTopicsFrom(_catalog: PublicCourse[]): FreeTopicEntry[] {
  return FREE_TOPICS;
}
