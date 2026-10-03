/**
 * labEnd — the pure half of the shared lab END SCREEN (owner 2026-09-29).
 *
 * Owner hard rule: "Labs NEVER block navigation; every lab ends with a
 * 'what's left' screen." Owner rule added 2026-09-29: "always keep credit and
 * progress for users, but always allow them to review and redo labs for
 * practice (without losing any previous credit)."
 *
 * This file decides WHAT the end screen says; LabEndScreen.tsx only draws it.
 * Kept React-free so the rule is unit-tested without Metro (test/labEndScreen).
 *
 * Every lab hands in its units in lab order — modules, pages, sections, steps,
 * plus its understanding check / final where it has one — and the set of unit
 * ids it has already banked. Nothing here ever REMOVES a unit from that set:
 * a practice run is a fresh pass over the lab, never a credit wipe.
 */
import { MEMBERSHIP_NOT_CONFIRMED } from '../../../features/commercial/tier.ts';

/** useGuestWording()'s honest middle state (tier sweep 2026-10-03): the lab
 *  holds / blocks as for a guest, but no read confirmed the learner is signed
 *  out, so the wording never says "not signed in". */
export type AccountWording = 'checking' | 'unconfirmed';

/** The one sentence for that state — the end screen's `account` line, reused
 *  by the labs' own in-lab save wording (test/labGuestWording_20261003). */
export function accountWhy(account: AccountWording): string {
  return account === 'unconfirmed' ? MEMBERSHIP_NOT_CONFIRMED : 'Still checking your account.';
}

/** The credit line under MARK AS REVIEWED / ✓ REVIEWED (LabReviewButton,
 *  final round C 2026-10-03), in the end screen's words. null = the plain
 *  member line ("counts toward your Audio Fundamentals credit") is true. A
 *  guest's mark is held for this session and carried into the account they
 *  sign in to before closing the app (owner ruling 2026-10-01). */
export function reviewCreditLine(opts: { guest: boolean; preview?: boolean; carry?: boolean; account?: AccountWording }): string | null {
  const { guest, preview, carry = true, account } = opts;
  if (preview) return 'This is a members-only preview, so nothing here is saved or credited.';
  if (guest && !carry) return 'You are not signed in, so nothing here is saved.';
  if (guest) return 'You are not signed in, so this is kept for this session only — sign in before you close the app to keep it toward your Audio Fundamentals credit.';
  if (account) return accountWhy(account);
  return null;
}

/** One thing a lab asks the learner to do, in lab order. */
export type LabEndUnit = {
  /** Stable id — the lab's own unit id (module id, `p3`, section key…). */
  id: string;
  /** What the learner reads: the module / page / section name. */
  label: string;
  /** Optional second line (e.g. "Every answer correct — retry until you are"). */
  detail?: string;
  /** An assessment rather than a page: listed last, worded as a check. */
  kind?: 'unit' | 'check';
};

export type LabEndRow = LabEndUnit & {
  /** 1-based position in the lab, for "MODULE 3" / "PAGE 12" labels. */
  num: number;
  /** Banked (credit mode) or done (progress mode). */
  credited: boolean;
};

export type WhatsLeft = {
  /** Units still to do, in lab order — the WHAT'S LEFT list. */
  left: LabEndRow[];
  /** Units already banked, in lab order — shown collapsed/dimmed. */
  credited: LabEndRow[];
  total: number;
  /** True only when there is at least one unit and none is left. */
  complete: boolean;
};

/**
 * The what's-left list: which of a lab's units are still to do, and which are
 * already banked. Unit ids repeated in `units` count once (first wins); ids in
 * `cleared` that the lab does not list are ignored (a retired unit never makes
 * a lab read complete, and never makes it read unfinished either).
 */
export function whatsLeft(units: readonly LabEndUnit[], cleared: ReadonlySet<string>): WhatsLeft {
  const seen = new Set<string>();
  const left: LabEndRow[] = [];
  const credited: LabEndRow[] = [];
  let num = 0;
  for (const u of units) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    num += 1;
    const row: LabEndRow = { ...u, num, credited: cleared.has(u.id) };
    (row.credited ? credited : left).push(row);
  }
  return { left, credited, total: num, complete: num > 0 && left.length === 0 };
}

/** The big title: LAB COMPLETE only when everything is banked. */
export function endTitle(w: WhatsLeft): "LAB COMPLETE" | "WHAT'S LEFT" {
  return w.complete ? 'LAB COMPLETE' : "WHAT'S LEFT";
}

/**
 * The lead line under the title. `mode` says whether this lab banks CREDIT
 * (a certificate-bearing lab) or only records PROGRESS on this device; a
 * `guest` is never told anything is saved (house guest rule, owner
 * 2026-08-12: guests neither restore nor persist) — but IS told the truth
 * that signing in before the app is closed keeps this session's work (owner
 * ruling 2026-10-01; features/lab/sessionCarry). A members-only `preview`
 * earns nothing (owner 2026-09-01) and is never offered that.
 */
export function endLead(
  w: WhatsLeft,
  opts: {
    mode: 'credit' | 'progress';
    noun: string;
    guest?: boolean;
    preview?: boolean;
    carry?: boolean;
    /** Tier sweep 2026-10-03: a signed-in learner whose membership read has
     *  not produced a tier ('checking') or gave up ('unconfirmed'). Neither
     *  "you are not signed in" (false) nor "everything is saved" (unknown):
     *  the honest state. Ignored when `guest` is set. */
    account?: AccountWording;
  },
): string {
  // `carry` (full run 2, 2026-10-01): false when signing in now would carry
  // nothing (after a sign-out, before Guest Mode starts a fresh guest
  // session — sessionCarryOpen). The guest is then told the plain truth.
  const { mode, noun, guest, preview, carry = true, account } = opts;
  const plural = (n: number) => `${n} ${noun}${n === 1 ? '' : 's'}`;
  // A check row (final exam / understanding check) is not a module or page —
  // count it separately so "8 modules + the check" never reads "9 modules of 9".
  const all = [...w.left, ...w.credited];
  const unitsTotal = all.filter((r) => r.kind !== 'check').length;
  const unitsLeft = w.left.filter((r) => r.kind !== 'check').length;
  const checkLeft = w.left.some((r) => r.kind === 'check');
  const what = `${plural(unitsLeft)} of ${unitsTotal}${checkLeft ? ' plus the check' : ''}`;
  const onlyCheck = unitsLeft === 0 && checkLeft;
  if (guest && preview) {
    return w.complete
      ? `You have been through every ${noun}. This is a members-only preview, so none of this is saved or credited.`
      : `${onlyCheck ? 'Only the check is left' : `${what} still to go`}. This is a members-only preview, so nothing here is saved or credited.`;
  }
  if (guest && !carry) {
    return w.complete
      ? `You have been through every ${noun}. You are not signed in, so nothing here is saved.`
      : `${onlyCheck ? 'Only the check is left' : `${what} still to go`}. You are not signed in, so nothing here is saved.`;
  }
  if (guest) {
    return w.complete
      ? `You have been through every ${noun}. You are not signed in, so none of this is saved yet — sign in before you close the app to keep it.`
      : `${onlyCheck ? 'Only the check is left' : `${what} still to go`}. You are not signed in, so nothing here is saved yet — sign in before you close the app to keep your progress.`;
  }
  if (account) {
    const why = accountWhy(account);
    return w.complete
      ? `You have been through every ${noun}. ${why}`
      : `${onlyCheck ? 'Only the check is left' : `${what} still to go`}. ${why}`;
  }
  if (w.complete) {
    return mode === 'credit'
      ? `Every ${noun} is credited. Review any of them, or practise the whole lab again — practising never removes credit you have earned.`
      : `Every ${noun} is done. Review any of them, or practise the whole lab again — practising never clears what you have done.`;
  }
  return mode === 'credit'
    ? `${onlyCheck ? 'Only the check is left' : `${what} still to finish`} before this lab counts toward your credit. Everything you have done is saved — jump straight to any of them.`
    : `${onlyCheck ? 'Only the check is left' : `${what} not done yet`}. Everything you have done is saved on this device — jump straight to any of them.`;
}
