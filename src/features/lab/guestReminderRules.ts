/**
 * guestReminderRules — the words and the once-per-activity rule for the
 * reminder a guest sees BEFORE starting a lab (owner 2026-10-04: "guests yes
 * get a save reminder before they begin about progress not being saved or
 * credited").
 *
 * WHO: a KNOWN guest only — `tier === 'guest'` (never the unknown window,
 * never a members-only preview, which earns nothing whoever signs in) AND
 * `useGuestWording().guest` (a signed-in learner whose membership read is
 * pending or failed is never told they are signed out — D52).
 *
 * WHAT IT PROMISES: what the shared ledger (./sessionCarry) actually does.
 * A guest's lab work in THIS app session is written to the account they sign
 * in to in the same session; closing the app first, or a sign-out, drops it.
 * When the ledger is closed (a sign-out earlier this session, before a fresh
 * Guest Mode start) nothing done now would be carried, so the words say
 * "sign in first" instead.
 *
 * ONCE per activity per guest session: keyed by the ledger's epoch (bumped by
 * every sign-out and every fresh Guest Mode start) and cleared by the account
 * wipe, so a new guest session is reminded again and a page or module inside
 * the same lab is not.
 *
 * Pure apart from the ledger reads — tested in test/guestCareer_20261004.
 */
import type { Tier } from '../commercial/tier';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import { sessionCarryEpoch } from './sessionCarry';

/** 'credit': the activity banks certificate credit and progress (a lab);
 *  'progress': it keeps progress only (Start Here — no credit for anyone). */
export type GuestReminderKind = 'credit' | 'progress';

export const GUEST_REMINDER_TITLE = 'You’re not signed in';
export const GUEST_REMINDER_SIGN_IN = 'Sign in';
export const GUEST_REMINDER_CONTINUE = 'Continue as guest';

const what = (kind: GuestReminderKind) => (kind === 'credit' ? 'saved or credited' : 'saved');

/** The popup's body. `carryOpen` = sessionCarryOpen() at the moment it shows. */
export function guestReminderBody(kind: GuestReminderKind, carryOpen: boolean): string {
  if (!carryOpen) return `Your progress won’t be ${what(kind)}. Sign in first to keep it.`;
  return `Your progress in this session won’t be ${what(kind)} unless you sign in. Sign in before you close the app and what you did this session is kept. Close the app first and it’s erased.`;
}

/** The Low-Light inline note (nothing auto-appears there): same facts, short. */
export function guestReminderNote(kind: GuestReminderKind, carryOpen: boolean): string {
  const isnt = kind === 'credit' ? 'isn’t saved or credited' : 'isn’t saved';
  return carryOpen
    ? `Not signed in — progress here ${isnt}. Sign in before you close the app to keep it.`
    : `Not signed in — progress here ${isnt}. Sign in first to keep it.`;
}

/** Speak to this person as a guest about saving? A KNOWN guest only. */
export function remindAsGuest(tier: Tier, guestWording: boolean): boolean {
  return tier === 'guest' && guestWording;
}

const shown = new Set<string>();

/** True the FIRST time `activity` asks in this guest session; false after. */
export function claimGuestReminder(activity: string): boolean {
  const key = `${sessionCarryEpoch()}|${activity}`;
  if (shown.has(key)) return false;
  shown.add(key);
  return true;
}

/** The account wipe (and tests): every activity reminds again. */
export function resetGuestReminders(): void {
  shown.clear();
}
registerLocalStoreReset(resetGuestReminders);
