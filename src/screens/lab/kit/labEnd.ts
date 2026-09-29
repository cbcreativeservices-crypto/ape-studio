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
 * 2026-08-12: guests neither restore nor persist).
 */
export function endLead(
  w: WhatsLeft,
  opts: { mode: 'credit' | 'progress'; noun: string; guest?: boolean },
): string {
  const { mode, noun, guest } = opts;
  const plural = (n: number) => `${n} ${noun}${n === 1 ? '' : 's'}`;
  // A check row (final exam / understanding check) is not a module or page —
  // count it separately so "8 modules + the check" never reads "9 modules of 9".
  const all = [...w.left, ...w.credited];
  const unitsTotal = all.filter((r) => r.kind !== 'check').length;
  const unitsLeft = w.left.filter((r) => r.kind !== 'check').length;
  const checkLeft = w.left.some((r) => r.kind === 'check');
  const what = `${plural(unitsLeft)} of ${unitsTotal}${checkLeft ? ' plus the check' : ''}`;
  const onlyCheck = unitsLeft === 0 && checkLeft;
  if (guest) {
    return w.complete
      ? `You have been through every ${noun}. You are browsing as a guest, so none of this is saved — sign in to keep your progress.`
      : `${onlyCheck ? 'Only the check is left' : `${what} still to go`}. You are browsing as a guest, so nothing here is saved — sign in to keep your progress.`;
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
