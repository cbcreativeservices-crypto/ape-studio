/**
 * The Glossary's "Recent" list — the last terms this reader opened, newest
 * first. Device-local (no backend table); the signup migration in
 * commercialAuth reads the same key.
 *
 * ⛔ ON THE SHARED SAFE STORE (evening hunt 1, 2026-10-02). The screen used to
 * keep this in component state, read it on every focus and write
 * `[id, ...state]` on every open. Two ways that lost the stored list:
 *   - a READ that threw left the state empty, and the next open wrote a
 *     one-term list over the whole stored history (pattern P1);
 *   - an open that landed before the read did (the post-upgrade return to a
 *     term fires on mount, beside the read) wrote `[id]` over the history, and
 *     the late read then dropped the term just opened (pattern P2).
 * createLocalStore makes both impossible: a failed read is never written over,
 * an open before the read is applied to the STORED list, and the account wipe
 * reaches the store without a hand entry.
 */
import { createLocalStore } from '../storage/localStore';

export const RECENT_TERMS_KEY = 'ape:glossaryRecent';
/** How many terms the list keeps. */
export const RECENT_TERMS_CAP = 30;

const store = createLocalStore<string[]>({
  key: RECENT_TERMS_KEY,
  empty: () => [],
  parse: (p) => {
    if (!Array.isArray(p)) throw new Error('recent terms: not a list');
    return p.filter((x): x is string => typeof x === 'string');
  },
});

/** Put a term at the head of the list (moving it if it is already there). */
export function recordRecentTerm(id: string): Promise<boolean> {
  return store.mutate((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, RECENT_TERMS_CAP));
}

/** The current list (newest first). */
export function getRecentTerms(): string[] {
  return store.get();
}

/** React: the live list. */
export function useRecentTerms(): string[] {
  return store.use();
}
