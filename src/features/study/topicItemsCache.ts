/**
 * topicItemsCache — a short session cache for a topic's study terms
 * (perf decisions 2026-10-04, owner: "favoring consistency and learning
 * outcomes").
 *
 * Flashcards, Matching and Fill-in each re-fetched the same topic's terms
 * (`fetchTopicItems`) on every open — the same `glossary_study_v` rows, read
 * again a few seconds apart.
 *
 * ⛔ THE KEY IS (auth uid, tier, achievementId). `common_mistakes` is masked
 * per entitlement on the server, so a member's answer carries it and a
 * non-member's does not. A cached member answer must never be served to a
 * non-member (it would hand them members-only content), and a non-member's
 * must never be served to a member (it would hide what they paid for).
 *
 * • The whole cache is dropped on ANY identity or tier change (noteIdentity,
 *   called on every read and on every auth event) and by the account wipe
 *   (registered with the wipe registry at load — the house way).
 * • Never caches a failure (a throw passes straight through) or an empty
 *   result. An unknown identity or tier (`null`) bypasses the cache.
 * • A short lifetime (TOPIC_ITEMS_TTL_MS) so an edit to the glossary reaches
 *   a learner within the session.
 *
 * Pure: no React, no Supabase — testable in node.
 */
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import type { GlossaryItem } from './api';

export const TOPIC_ITEMS_TTL_MS = 10 * 60 * 1000;

type Entry = { at: number; items: GlossaryItem[] };
const cache = new Map<string, Entry>();
/** The (uid, tier) the cache currently belongs to; undefined = none yet. */
let owner: string | undefined;

const identityOf = (uid: string, tier: string) => `${uid}\u0001${tier}`;

/** A read: a different (uid, tier) from the cache's owner drops every entry. */
export function noteTopicIdentity(uid: string | null, tier: string | null): void {
  const next = uid != null && tier != null ? identityOf(uid, tier) : '';
  if (owner !== undefined && owner !== next) cache.clear();
  owner = next;
}

/** An auth event: a different signed-in identity drops every entry (a token
 *  refresh for the same uid keeps them). */
export function noteTopicAuthUid(uid: string | null): void {
  if (owner === undefined) return;
  if (owner === '' || owner.split('\u0001')[0] !== (uid ?? '')) {
    cache.clear();
    owner = undefined;
  }
}

// The account wipe forgets everything (registered at load, like the quiz and
// final-exam caches — the house way, never an exemption).
registerLocalStoreReset(() => {
  cache.clear();
  owner = undefined;
});

/**
 * The cached read. `uid` / `tier` null = not known for sure → no cache, the
 * read goes straight through. Callers get a copy of the array, so a deck that
 * sorts or shuffles in place cannot change what the next screen is served.
 */
export async function cachedTopicItems(
  uid: string | null,
  tier: string | null,
  achievementId: string,
  read: () => Promise<GlossaryItem[]>,
  now: () => number = Date.now,
): Promise<GlossaryItem[]> {
  noteTopicIdentity(uid, tier);
  if (uid == null || tier == null) return read();
  const who = identityOf(uid, tier);
  const key = `${who}\u0001${achievementId}`;
  const hit = cache.get(key);
  if (hit && now() - hit.at < TOPIC_ITEMS_TTL_MS) return hit.items.slice();
  const items = await read();
  // Still the same reader when it landed? A sign-out or a tier change during
  // the read must not file this answer under the new identity's cache.
  if (items.length > 0 && owner === who) cache.set(key, { at: now(), items: items.slice() });
  return items;
}
