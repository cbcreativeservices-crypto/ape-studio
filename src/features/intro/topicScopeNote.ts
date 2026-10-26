/**
 * "Don't see a term?" (owner 2026-10-26) — a one-time note in the FREE topic's
 * flashcards (DAW Fundamentals & Session Management). A learner who meets EQ
 * or compression terms there may wonder where the rest are; the note says each
 * term lives in the topic that covers it fully, and names those topics.
 *
 * It shows ONCE, at whichever comes first:
 *  - the ALL list has been open TOPIC_SCOPE_LIST_MS (drawn inside that list:
 *    a second root Modal over an open one is refused on iOS), or
 *  - the TOPIC_SCOPE_CARDS-th card shown in this topic, counted across visits.
 * The seen flag is the intro flag (`ape:intro:flashcardsTopicScope`); the count
 * sits in the device-level `ape:onboarding:` family, so an account wipe keeps
 * both, like the glossary use timer.
 */
import { createLocalStore } from '../storage/localStore';
import { OFFICIAL_TOPIC_NAMES } from '../../data/officialTopicNames';

export const TOPIC_SCOPE_CARDS = 30;
export const TOPIC_SCOPE_LIST_MS = 7000;
const DAW_GS = 3970;

/** The flashcard screen knows its topic by name; this is the codified one. */
export function isTopicScopeTopic(topicName: string | null | undefined): boolean {
  return (topicName ?? '').trim() === OFFICIAL_TOPIC_NAMES[DAW_GS];
}

const store = createLocalStore<number>({
  key: 'ape:onboarding:dawFlashcardsShown',
  empty: () => 0,
  parse: (parsed) => {
    if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) throw new Error('dawFlashcardsShown: not a count');
    return Math.floor(parsed);
  },
});

/** One more card shown; resolves to the new total (null if it could not be read). */
export async function countTopicScopeCard(): Promise<number | null> {
  const ok = await store.mutate((n) => n + 1, { reportFailure: false });
  if (!ok) return null;
  return store.get();
}
