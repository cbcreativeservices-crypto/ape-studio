/**
 * Topic Foundations — where the lesson text comes from (D47, 2026-11-03).
 *
 * LIVE: the nullable text column `achievements.foundations_text`, which Comp A
 * adds once all lessons are approved (before A2). It does NOT exist yet, so:
 *  - it is read by its OWN small query, never added to an existing select
 *    (that would break those queries today);
 *  - ANY error — the missing column (42703 / PGRST204), offline, a timeout —
 *    is "no text": no dashboard row, no popup, flashcards exactly as before,
 *    and no error shown (owner decision 3);
 *  - the shared, bounded client (src/lib/supabase.ts) — never another one.
 *
 * DEV PREVIEW: with no server text, a dev build falls back to the 5 approved
 * lessons (devFoundations.ts), require()d only inside `if (__DEV__)` so a
 * production bundle never contains them.
 *
 * Answers are remembered for the session per topic once SETTLED (text, no
 * text, or the column missing), and one read is in flight per topic, so the
 * Dashboard and Flashcards share a lookup. A failed read is asked again next
 * time.
 */
import { supabase } from '../../lib/supabase';
import { foundationsFromQuery, parseFoundationsText, type FoundationsLesson } from './foundationsText';

const settled = new Map<string, FoundationsLesson | null>();
const inflight = new Map<string, Promise<FoundationsLesson | null>>();

/** The remembered answer: a lesson, null (settled: none), or undefined (not
 *  asked yet / last read failed). */
export function cachedFoundations(achievementId: string): FoundationsLesson | null | undefined {
  return settled.get(achievementId);
}

async function readServer(achievementId: string): Promise<{ lesson: FoundationsLesson | null; settled: boolean }> {
  try {
    const res = await supabase.from('achievements').select('foundations_text').eq('id', achievementId).maybeSingle();
    return foundationsFromQuery(res);
  } catch {
    return { lesson: null, settled: false };
  }
}

/** DEV ONLY: the approved preview lesson for this topic, by its gs. */
async function devFallback(achievementId: string, gs: number | null | undefined): Promise<FoundationsLesson | null> {
  // ⛔ The require stays INSIDE this block: a release build folds
  // `if (false) { … }` away before dependencies are collected, so the preview
  // copy is not in the production bundle at all.
  if (__DEV__) {
    let g = gs ?? null;
    if (g == null) {
      try {
        const { data } = await supabase.from('achievements').select('global_sequence').eq('id', achievementId).maybeSingle();
        const v = (data as { global_sequence?: unknown } | null)?.global_sequence;
        g = typeof v === 'number' ? v : null;
      } catch {
        g = null;
      }
    }
    if (g == null) return null;
    const dev = require('./devFoundations') as typeof import('./devFoundations');
    return parseFoundationsText(dev.DEV_FOUNDATIONS[g]);
  }
  return null;
}

/**
 * The lesson for a topic, or null for "show nothing". Never throws. `gs`
 * (achievements.global_sequence) is used only by the dev preview fallback;
 * without it the dev build looks it up.
 */
export function loadFoundations(achievementId: string, gs?: number | null): Promise<FoundationsLesson | null> {
  if (!achievementId) return Promise.resolve(null);
  if (settled.has(achievementId)) return Promise.resolve(settled.get(achievementId) ?? null);
  const running = inflight.get(achievementId);
  if (running) return running;
  const p = (async () => {
    const live = await readServer(achievementId);
    let lesson = live.lesson;
    let done = live.settled;
    if (!lesson && __DEV__) {
      lesson = await devFallback(achievementId, gs);
      if (lesson) done = true;
    }
    if (done) settled.set(achievementId, lesson);
    return lesson;
  })()
    .catch(() => null)
    .finally(() => {
      inflight.delete(achievementId);
    });
  inflight.set(achievementId, p);
  return p;
}
