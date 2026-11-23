/**
 * calcAllowanceCopy — the words of the calculators' weekly allowance, for a
 * free account AND a known guest (owner 2026-11-23: "in the calculator the
 * guest user does get an allowance per week of use").
 *
 * Pure, no imports: the workspace screen decides the two inputs through the
 * house helpers and passes them in —
 *   `guest`  — useGuestWording().guest: a KNOWN guest only, never an unknown
 *              tier. A guest's way forward is the weekly reset, or signing in
 *              / creating a free account.
 *   `upsell` — useUpsellAllowed(): may this reader see membership copy? Never
 *              a member, never before the tier is known.
 *
 * A free account's sentences are the ones the screen has shown since
 * 2026-09-01, byte for byte. The guest's add only what is certain: it never
 * promises that an account adds more calculations (the server's count per
 * account may change; see the report of 2026-11-23).
 */

export type CalcAllowanceReader = { guest: boolean; upsell: boolean };

/** The guest's way forward besides waiting for the reset. */
export const CALC_GUEST_SIGN_IN_LINE = 'You can also sign in or create a free account.';
const MEMBERSHIP_LINE = 'Academy membership removes the limit.';

const tail = (r: CalcAllowanceReader): string =>
  [r.guest ? CALC_GUEST_SIGN_IN_LINE : null, r.upsell ? MEMBERSHIP_LINE : null].filter(Boolean).join(' ');
const withTail = (lead: string, r: CalcAllowanceReader): string => {
  const t = tail(r);
  return t ? `${lead} ${t}` : lead;
};

/** CALCULATE tapped with the week already used up (the answer stays held). */
export function calcLimitReachedBody(limit: number, r: CalcAllowanceReader): string {
  return withTail(`You’ve used all ${limit} free calculations for this week. They reset one week after your first one.`, r);
}

/** The last credit of the week was just spent (the answer is shown). */
export function calcLastOneBody(limit: number, r: CalcAllowanceReader): string {
  return withTail(`That was your last free calculation this week (${limit} of ${limit}). It resets one week after your first one.`, r);
}

/** The halfway notice, strictly before the last credit. */
export function calcHalfwayBody(used: number, limit: number, r: CalcAllowanceReader): string {
  if (!r.guest) {
    return r.upsell
      ? `That’s ${used} of ${limit} free calculations this week. After ${limit} you’ll wait for the weekly reset, or Academy membership removes the limit.`
      : `That’s ${used} of ${limit} free calculations this week. After ${limit} you’ll wait for the weekly reset.`;
  }
  return withTail(`That’s ${used} of ${limit} free calculations this week. After ${limit} you’ll wait for the weekly reset.`, r);
}

/** The held-answer panel's words once a known guest's week is used up; the
 *  green SIGN IN / CREATE ACCOUNT button sits right under them. */
export function calcGuestUsedUpPanel(limit: number): string {
  return `You’ve used all ${limit} free calculations for this week. They reset one week after your first one. ${CALC_GUEST_SIGN_IN_LINE}`;
}

/** The dialogs' confirm button: a guest signs in, everyone else sees plans. */
export function calcAllowanceAction(r: CalcAllowanceReader): 'signIn' | 'membership' | null {
  if (r.guest) return 'signIn';
  return r.upsell ? 'membership' : null;
}
