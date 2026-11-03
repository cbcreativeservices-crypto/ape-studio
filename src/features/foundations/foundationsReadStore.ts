/**
 * Topic Foundations "I've read this" — device-local, per learner + topic
 * (D47, owner GO 2026-11-03).
 *
 * ONE `ape:` key on the house store (createLocalStore — AGENTS.md D47):
 *  - a failed READ is UNREADABLE: nothing is written over the stored copy and
 *    the Flashcards popup does not auto-appear (the state is unknown);
 *  - the store's reset registers itself in the account-wipe registry at
 *    creation, and the key is inside the `ape:*` sweep (not on KEEP or
 *    GUEST_KEEP), so a sign-out, an account switch and the guest wipe all
 *    clear it — a guest's reads are ephemeral (D57).
 *
 * Entries are keyed `<uid>:<achievementId>` (foundationsReadKey). The uid is
 * the signed-in user's id or 'guest' for a session KNOWN to have no account;
 * a session read that did not answer gets no key at all (never a guest).
 */
import { createLocalStore } from '../storage/localStore';
import {
  FOUNDATIONS_READ_STORE_KEY,
  foundationsReadKey,
  isFoundationsRead,
  parseFoundationsReadMap,
} from './foundationsText';

export const foundationsReadStore = createLocalStore<Record<string, string>>({
  key: FOUNDATIONS_READ_STORE_KEY,
  empty: () => ({}),
  parse: parseFoundationsReadMap,
});

/** Is it read, from what the store holds now (false while not hydrated). */
export function readNow(uid: string, achievementId: string): boolean {
  return isFoundationsRead(foundationsReadStore.get(), uid, achievementId);
}

/**
 * Mark read. Answers the WRITE RESULT (true only when the device kept it). A
 * refused write is told to the learner by the shared save-failure notice and
 * the in-memory mark is taken back, so a ✓ never stands on a write that did
 * not land.
 */
export async function markFoundationsRead(uid: string, achievementId: string): Promise<boolean> {
  const k = foundationsReadKey(uid, achievementId);
  const ok = await foundationsReadStore.mutate((m) => (k in m ? m : { ...m, [k]: new Date().toISOString() }));
  if (!ok) {
    // A second refusal here folds into the same notice (it is rate-limited:
    // one per failure burst).
    void foundationsReadStore.mutate((m) => {
      if (!(k in m)) return m;
      const next = { ...m };
      delete next[k];
      return next;
    });
  }
  return ok;
}
