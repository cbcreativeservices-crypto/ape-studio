/**
 * completeCopy — what the Cable Install completion screen says about SAVING
 * (owner 2026-10-01: "fix Cable Install's finish screen to correctly inform
 * the user and offer them membership to save before it is lost").
 *
 * The screen told everyone "Everything you have done so far is saved". That
 * was false for a signed-out guest (the lab neither restores nor persists for
 * them — house guest rule, owner 2026-08-12) and for a non-member preview
 * (PREVIEW EARNS NOTHING, 2026-09-01: markLabUnit refuses every unit).
 *
 * What saving actually requires HERE: Cable Dressing & Installation is a
 * members-only lab (labCatalog `member: true`, wrapped by
 * withMembershipPreview). A free account opens it as a preview and banks
 * nothing, so a free account is NOT enough — membership is. A guest who
 * signs up or signs in cannot keep this run either: the first sign-in on a
 * device wipes every `ape:*` key (accountLocalSync → clearLocalAccountData),
 * and nothing carries guest work into an account. So the copy offers to save
 * the NEXT run, never this one.
 *
 * Pure and React-free so test/cableInstallComplete.test.ts reads it directly.
 */

/** 'saved' = signed in with a save path (members, and anyone whose tier is
 *  not yet known — the lab's own rule: unknown ⇒ not a guest).
 *  'guest' = resolved and signed out. 'preview' = a signed-in non-member
 *  previewing this members-only lab. */
export type CiSaveState = 'saved' | 'guest' | 'preview';

/**
 * `endGuest` = the shared lab rule, useLabEndGuest() (preview active, or
 * resolved && anonymous). `noAccount` = the lab's own noAccountRef reading
 * (resolved && anonymous). A member is always 'saved' — members never see an
 * offer.
 */
export function ciSaveState(o: { endGuest: boolean; noAccount: boolean; isMember: boolean }): CiSaveState {
  if (o.isMember || !o.endGuest) return 'saved';
  return o.noAccount ? 'guest' : 'preview';
}

/** The lead line when stages are still outstanding (the WHAT IS LEFT state). */
export function ciLeftLead(state: CiSaveState, o: { unbanked: number; replayOnly: number; total: number }): string {
  const { unbanked, replayOnly, total } = o;
  if (state !== 'saved') {
    // Never "saved", never "credited" — nothing in this run is kept.
    const n = unbanked + replayOnly;
    return `${n} of ${total} stage${n === 1 ? '' : 's'} still to go.`;
  }
  return unbanked > 0
    ? `${unbanked} of ${total} stage${unbanked === 1 ? '' : 's'} still to finish before this lab counts toward your credit. Everything you have done so far is saved — pick up wherever you like.${replayOnly > 0 ? ` ${replayOnly} more not replayed this run — already credited.` : ''}`
    : `${replayOnly} of ${total} stage${replayOnly === 1 ? '' : 's'} not replayed this run. Your credit for every stage is already banked — replay them or leave them; nothing is lost.`;
}

export type CiSaveNotice = {
  title: string;
  body: string;
  /** Opens the membership screen (Paywall). */
  join: string;
  /** Guest only: an existing member signs in (Auth). */
  signIn?: string;
};

/** The "not saved" notice + offer. null for a signed-in learner who saves. */
export function ciSaveNotice(state: CiSaveState): CiSaveNotice | null {
  if (state === 'guest') {
    return {
      title: 'THIS RUN IS NOT SAVED',
      body:
        'You are not signed in, so nothing in this run is saved. Your place, your scores and the stages you finished will be lost when you leave the lab or close the app. Saving your progress and credit in this lab needs a membership. This run cannot be carried over — join now and your next run is saved.',
      join: 'BECOME A MEMBER',
      signIn: 'ALREADY A MEMBER? SIGN IN',
    };
  }
  if (state === 'preview') {
    return {
      title: 'THIS PREVIEW IS NOT SAVED',
      body:
        'This lab is part of membership, and a preview earns nothing: no stage you finish here is credited, and none of it counts toward the lab. Members keep their progress and their credit. This run cannot be carried over — join now and your next run is saved.',
      join: 'SEE MEMBERSHIP',
    };
  }
  return null;
}
