/**
 * The last verified kind the SERVER confirmed for this account, kept on the
 * device (bug pass 2, CODE-2-13 follow-up, 2026-11-08).
 *
 * Why: a verified employer who opens Profile on a cold, offline launch gets
 * both reads failing ('unknown' and an application error). With nothing known
 * in memory the section had to draw nothing, which says "nothing here". This
 * keeps the last confirmed kind so that face can say "Couldn't check your
 * employer account" with a retry instead.
 *
 * Never a claim the server has not made:
 *  - written only from a successful my_verifier_kind() answer for `uid`
 *    (`recordVerifierAnswer`); a clean 'none' FORGETS it; 'unknown' changes
 *    nothing;
 *  - kept per account: the saved `uid` must be the signed-in account, or it is
 *    no evidence (`rememberedKindFor`);
 *  - an unread or unreadable store answers null (createLocalStore: a failed
 *    read is never an empty value written over the disk copy);
 *  - wiped on sign-out and account switch: createLocalStore registers its
 *    reset with the account wipe at creation (localStoreRegistry), and the
 *    `ape:*` sweep removes the key (it is not on any KEEP list);
 *  - it only words the couldn't-check face. Every verified-only row (chips,
 *    instructor code, kind switch, public page) still waits for `verified`.
 */
import { createLocalStore } from '../storage/localStore';
import type { VerifierKind } from '../employer/verifierKind';
import { knownVerifierKind } from './employerFace';

export type SavedVerifierKind = { uid: string; kind: VerifierKind } | null;

export const VERIFIER_KIND_KEY = 'ape:profile:lastVerifierKind';

/** Throws on a blob that cannot be trusted (createLocalStore sets it aside). */
export function parseSavedVerifierKind(raw: unknown): SavedVerifierKind {
  if (raw === null || raw === undefined) return null;
  const r = raw as { uid?: unknown; kind?: unknown };
  const kind = knownVerifierKind(typeof r.kind === 'string' ? r.kind : undefined);
  if (typeof r.uid !== 'string' || !r.uid || !kind) throw new Error('not a saved verifier kind');
  return { uid: r.uid, kind };
}

const store = createLocalStore<SavedVerifierKind>({
  key: VERIFIER_KIND_KEY,
  empty: () => null,
  parse: parseSavedVerifierKind,
  // Nothing remembered = no key at all.
  serialize: (v) => (v ? JSON.stringify(v) : null),
});

/** The remembered kind, only for the account signed in now. */
export function rememberedKindFor(saved: SavedVerifierKind, uid: string | null | undefined): VerifierKind | null {
  return saved && uid && saved.uid === uid ? saved.kind : null;
}

/** What the next value is after a server answer for `uid` ('unknown' = no change). */
export function nextSavedVerifierKind(cur: SavedVerifierKind, uid: string, answer: string): SavedVerifierKind {
  if (answer === 'none') return null;
  const kind = knownVerifierKind(answer);
  if (!kind) return cur;
  return cur && cur.uid === uid && cur.kind === kind ? cur : { uid, kind };
}

/**
 * Record a SUCCESSFUL my_verifier_kind() answer for the account `uid`. Pass
 * the raw answer: a kind is kept, 'none' forgets, 'unknown' does nothing. A
 * write that would change nothing is skipped.
 */
export function recordVerifierAnswer(uid: string, answer: string): Promise<boolean> {
  if (!uid || answer === 'unknown') return Promise.resolve(false);
  if (store.isHydrated() && nextSavedVerifierKind(store.get(), uid, answer) === store.get()) {
    return Promise.resolve(true);
  }
  return store.mutate((cur) => nextSavedVerifierKind(cur, uid, answer));
}

/** For the Profile section: re-renders when the saved kind is read or changes. */
export function useRememberedVerifierKind(uid: string | null | undefined): VerifierKind | null {
  return rememberedKindFor(store.use(), uid);
}

/** Tests: the store as it is now, and a hydrate to await. */
export const verifierKindStoreForTests = {
  get: () => store.get(),
  hydrate: () => store.hydrate(),
  reset: () => store.reset(),
};
