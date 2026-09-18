/**
 * tenure — has this member held one complete paid month?
 *
 * ── THE RULE (owner, 2026-09-18) ─────────────────────────────────────────────
 *
 * A certificate requires ONE COMPLETE PAID MONTH of membership. The clock starts
 * on the first paid day; a lapse resets it; an admin grant counts as paid; a
 * refund earns nothing.
 *
 * What that means at the Final Exam, in the owner's words:
 *
 *   • If the month is not yet complete, remind them of the policy before they
 *     start. Once the month has passed, that reminder never appears again.
 *   • They may sit the exam anyway. The results are NOT released until the month
 *     completes — then graded, then awarded.
 *   • If they close their membership before the month ends, the exam is wiped:
 *     not graded, not applied. That has to be said BEFORE they sit it, not after.
 *
 * ── WHY THIS RETURNS 'unknown' TODAY ─────────────────────────────────────────
 *
 * The rule cannot be evaluated yet. `entitlements` has no `member_since` and no
 * `refunded_at` column — `supabase/migrations/2026091801_paid_month_before_credential.sql`
 * adds them and has never been applied (verified against production
 * 2026-09-18) — so `member_month_complete` does not exist to be called.
 *
 * That is a real state and it is neither 'yes' nor 'no', so it is its own value.
 * Guessing either way is worse than admitting it:
 *
 *   • Guess 'incomplete' and a member of two years is told their results will be
 *     held. That is alarming, wrong, and generates a support email.
 *   • Guess 'complete' and a day-one member is told nothing, which is the
 *     omission the rule exists to prevent.
 *
 * So on 'unknown' the briefing states the POLICY — which is true for everyone
 * and alarming to no one — and says nothing about this person's standing. The
 * moment the server can answer, the same screen starts naming their date. No
 * client change is needed for that; only this function starts returning a real
 * answer.
 */
import { supabase } from '../../lib/supabase';
import { classifyGatewayError } from '../glossary/gatewayFault';

export type TenureState =
  /** One complete paid month is on the record. No reminder is shown. */
  | 'complete'
  /** Definitely not yet. The full "your results will be held" warning applies. */
  | 'incomplete'
  /** The server cannot answer. State the policy; assert nothing about them. */
  | 'unknown';

/**
 * Read the member's tenure standing.
 *
 * NEVER THROWS and never blocks: this runs in front of a graded exam, and a
 * failure here must not be able to stop somebody sitting it. Every failure —
 * the function missing, a denial, a timeout, an unreadable answer — resolves to
 * 'unknown', which shows the policy and lets them through.
 */
export async function readTenureState(): Promise<TenureState> {
  try {
    // THE ARGUMENT IS THE AUTH ID, AND IT IS NOT OPTIONAL (corrected 2026-09-18).
    //
    // The deployed signature is `member_month_complete(p_uid uuid)` and it
    // resolves identity by joining `users u on u.auth_id = p_uid`, because
    // `entitlements.user_id` is `public.users.id` and NOT the auth id
    // (validate-purchase/index.ts:213 makes that explicit).
    //
    // My first version called it with no argument and would have failed
    // forever — landing in 'unknown', which is safe but silently permanent.
    // Worse, my first draft of the migration defined it against `auth.uid()`
    // directly, which would have matched nothing and told every member their
    // month was incomplete.
    const { data: sess } = await supabase.auth.getSession();
    const authUid = sess.session?.user?.id ?? null;
    // No session is not a failure to read tenure — it is a guest, who has none.
    // Still 'unknown' rather than 'incomplete': the briefing should state the
    // policy, not accuse someone who is not a member of failing it.
    if (!authUid) return 'unknown';

    const { data, error } = await supabase.rpc('member_month_complete', { p_uid: authUid });
    if (error) {
      const fault = classifyGatewayError(error);
      if (fault === 'not-deployed') {
        // Expected until the migration lands. Not worth a warning every time.
        return 'unknown';
      }
      console.warn('[tenure] could not read member_month_complete:', error.message);
      return 'unknown';
    }
    // The RPC is expected to answer with a boolean. Anything else is an answer
    // we do not understand, which is 'unknown' rather than a coin toss.
    if (data === true) return 'complete';
    if (data === false) return 'incomplete';
    return 'unknown';
  } catch (e) {
    console.warn('[tenure] member_month_complete threw:', (e as Error)?.message);
    return 'unknown';
  }
}
