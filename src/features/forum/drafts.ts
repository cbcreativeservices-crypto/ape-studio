/**
 * Drafts saved, so a long answer isn't lost when the phone rings. One draft per
 * reply box and per Ask form, kept on this device.
 *
 * A failed read is UNREADABLE and is never overwritten (createLocalStore): the
 * box starts blank and says nothing was restored, rather than losing what is
 * stored. The dev sample keeps its drafts in memory, so looking at the sample
 * never touches a real draft.
 */
import { createLocalStore } from '../storage/localStore';
import { localStoreWipeCount } from '../storage/localStoreRegistry';
import { sampleForumOn } from './sampleSwitch.ts';

type Drafts = Record<string, string>;

/** Enough for the longest post; older drafts make way past this many. */
const MAX_DRAFTS = 20;

const store = createLocalStore<Drafts>({
  key: 'ape:forum-drafts',
  empty: () => ({}),
  parse: (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('forum drafts');
    const out: Drafts = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === 'string') out[k] = v;
    return out;
  },
});

const sampleDrafts: Drafts = {};

export async function readDraft(key: string): Promise<string> {
  if (sampleForumOn()) return sampleDrafts[key] ?? '';
  await store.hydrate();
  return store.get()[key] ?? '';
}

/** True only when the device accepted the write. */
export async function saveDraft(key: string, text: string): Promise<boolean> {
  if (sampleForumOn()) {
    if (text.trim()) sampleDrafts[key] = text;
    else delete sampleDrafts[key];
    return true;
  }
  // A refused write raises the shared save-failure notice: someone relying on
  // their draft needs to know it did not save.
  return store.mutate((all) => {
    const next = { ...all };
    delete next[key];
    if (text.trim()) next[key] = text;
    const keys = Object.keys(next);
    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_DRAFTS))) delete next[old];
    return next;
  });
}

export const clearDraft = (key: string) => saveDraft(key, '');

/**
 * Whose drafts a screen is writing: this account (the wipe count) and this
 * world (the dev sample or the real store). Taken when the screen mounts
 * (bug pass 2, CODE-2-06). A forced sign-out runs the wipe FIRST and then
 * unmounts the screen, so its last-words flush landed in the next member's
 * store; a write whose owner changed is dropped.
 */
export type DraftOwner = { wipe: number; sample: boolean };

export function draftOwner(): DraftOwner {
  return { wipe: localStoreWipeCount(), sample: sampleForumOn() };
}

/** The account was wiped, or the sample opened or closed, since `o` was taken. */
export function draftOwnerStale(o: DraftOwner): boolean {
  return o.wipe !== localStoreWipeCount() || o.sample !== sampleForumOn();
}
