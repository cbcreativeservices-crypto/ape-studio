/**
 * MY PROFILE across a tab switch (bug pass 2026-11-08, P1).
 *
 * MyProfileView MOUNTS FRESH each time its tab opens and flushes the last
 * unsent edit when it unmounts. Two things went wrong between those:
 *
 * CODE-1-04. The save queue was per instance. Leave and come straight back,
 * and the new instance's first read raced the old instance's flush: when the
 * read won, the editor showed the older About, and the next chip tap saved
 * that whole older profile over the text just typed. The queue now lives
 * here, ONE for the app, and the mount read waits behind it.
 *
 * CODE-1-11. The flush ignored its answer (`.catch(() => {})`), so a refused
 * About (an email address, a phone number) vanished with no word. Now an
 * About the rules already refuse is never sent, and a refused or failed flush
 * keeps the words here, in memory, for the next mount to put back with the
 * reason. Tied to the account (the wipe count) so it never crosses to the
 * next member.
 *
 * Pure, so the rule is tested without React Native.
 */
import { aboutProblem } from './rules.ts';
import { localStoreWipeCount, registerLocalStoreReset } from '../storage/localStoreRegistry.ts';
import { sampleGen } from './sampleThreads.ts';
import type { CommunityProfile } from './api.ts';

/**
 * The one save queue for the community profile, the featured-credential
 * writes included. Every write goes behind it, and so does the mount read.
 */
export const profileSaveChain: { current: Promise<unknown> } = { current: Promise.resolve() };

/**
 * WHERE A WRITE BELONGS: this account (the wipe count) and this world, the
 * dev sample or the live server (`sampleGen`). Captured when the view
 * mounts; a queued write whose key no longer matches is dropped, never sent
 * somewhere else. Release builds never change `gen`.
 */
export type LeaveKey = { wipe: number; gen: number };

export function currentKey(): LeaveKey {
  return { wipe: localStoreWipeCount(), gen: sampleGen() };
}

/** The account or the sample changed since `k` was taken. */
export function keyStale(k: LeaveKey): boolean {
  const now = currentKey();
  return now.wipe !== k.wipe || now.gen !== k.gen;
}

type Unsaved = { profile: CommunityProfile; error: string; key: LeaveKey };
let unsaved: Unsaved | null = null;

/** Keep an edit that did not reach the server, with the reason to show. */
export function stashUnsaved(profile: CommunityProfile, error: string, key: LeaveKey): void {
  unsaved = { profile, error, key };
}

/**
 * The kept edit for THIS account in THIS world, once (it is removed either
 * way). Words kept in the dev sample never land on a real profile, nor real
 * words in the sample: opening or closing a sample changes `gen`.
 */
export function takeUnsaved(key: LeaveKey): { profile: CommunityProfile; error: string } | null {
  const u = unsaved;
  unsaved = null;
  if (!u || u.key.wipe !== key.wipe || u.key.gen !== key.gen) return null;
  return { profile: u.profile, error: u.error };
}

export function clearUnsaved(): void {
  unsaved = null;
}
// Sign-out drops the kept words with the rest of the account's state.
registerLocalStoreReset(clearUnsaved);

/** What the member reads when their words came back. */
export function unsavedLine(reason: string): string {
  return `Your last change was not saved. ${reason} Your words are still here.`;
}

/**
 * What the flush on leave should do with this edit: refuse it here when the
 * rules already refuse its About (nothing is sent), or send it.
 */
export function leaveDecision(latest: CommunityProfile): { send: true } | { send: false; error: string } {
  const problem = aboutProblem(latest.about);
  return problem ? { send: false, error: unsavedLine(problem) } : { send: true };
}

/** The flush's answer: a refusal or a failure keeps the words; a save clears. */
export function noteLeaveSave(
  latest: CommunityProfile,
  r: { ok: true } | { ok: false; error: string } | undefined,
  key: LeaveKey,
): void {
  if (!r) return; // not sent: the account or the sample changed while it waited
  if (r.ok) {
    if (unsaved?.profile === latest) unsaved = null;
    return;
  }
  stashUnsaved(latest, unsavedLine(r.error), key);
}

/**
 * The kept words laid over the profile just read: the member's own fields
 * from the edit, the switches and the token from the server (they may have
 * changed since, and the edit never set them).
 */
export function mergeUnsaved(loaded: CommunityProfile, edit: CommunityProfile): CommunityProfile {
  return {
    ...loaded,
    displayName: edit.displayName,
    about: edit.about,
    countryCode: edit.countryCode,
    region: edit.region,
    workPref: edit.workPref,
    primaryArea: edit.primaryArea,
    areas: edit.areas,
    specialties: edit.specialties,
    roles: edit.roles,
    openTo: edit.openTo,
    languages: edit.languages,
  };
}
