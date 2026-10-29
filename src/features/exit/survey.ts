/**
 * Exit survey content — ONE module for the codes, branches and copy of the
 * membership-cancellation and account-deletion flows (spec: Pro-Audio-User-
 * Exit-Plan §3, §5, §6; owner decisions in the 2026-10-15 build plan).
 *
 * Import-free (no React Native) so the tests can read the real lists.
 *
 * ⛔ The Question 1 reason codes are the spec's, verbatim. The server RPC
 * (submit_exit_feedback, Comp A) checks codes against the same fixed lists, so
 * a change here is a change there. The Question 2 codes are not named in the
 * spec; the ones below are the app's and must be mirrored server-side.
 */

export const EXIT_FLOW_VERSION = 1;

export type ExitFlow = 'cancel' | 'delete';

export type ReasonCode =
  | 'budget'
  | 'temporary_break'
  | 'goal_completed'
  | 'content_gap'
  | 'technical_problem'
  | 'usability'
  | 'expectations'
  | 'alternative_resource'
  | 'privacy';

export type Choice<C extends string = string> = { code: C; label: string };

/** Question 1 — one selection, nothing preselected. `privacy` is deletion only. */
export const REASONS: readonly Choice<ReasonCode>[] = [
  { code: 'budget', label: 'It does not fit my budget right now' },
  { code: 'temporary_break', label: 'I am taking a break from learning' },
  { code: 'goal_completed', label: 'I completed what I came here to learn' },
  { code: 'content_gap', label: 'I could not find the content or tools I needed' },
  { code: 'technical_problem', label: 'I had technical problems' },
  { code: 'usability', label: 'I found the app difficult to use' },
  { code: 'expectations', label: 'The membership did not meet my expectations' },
  { code: 'alternative_resource', label: 'I am using another resource' },
  { code: 'privacy', label: 'I want to remove my personal information' },
] as const;

export const REASON_CODES: readonly ReasonCode[] = REASONS.map((r) => r.code);

/**
 * Deletion asks a SHORTER question (owner 2026-10-15: "too many options and
 * too long to read"): five reasons; the three "it didn't work for me" reasons
 * fold into one, split by its follow-up. Same stable reason codes.
 */
export const DELETE_REASONS: readonly Choice<ReasonCode>[] = [
  { code: 'budget', label: 'It does not fit my budget right now' },
  { code: 'temporary_break', label: 'I am taking a break' },
  { code: 'goal_completed', label: 'I got what I needed' },
  { code: 'expectations', label: 'The app did not work well for me' },
  { code: 'privacy', label: 'I want my personal information removed' },
] as const;

export function reasonsFor(flow: ExitFlow): readonly Choice<ReasonCode>[] {
  return flow === 'delete' ? DELETE_REASONS : REASONS.filter((r) => r.code !== 'privacy');
}

export const Q1_PROMPT: Record<ExitFlow, string> = {
  cancel: 'What is the main reason you are considering ending your paid membership?',
  delete: 'Why are you leaving? (optional)',
};

export type FollowUpId = 'technical' | 'content' | 'usability' | 'return' | 'expectations' | 'privacy';
export type FollowUp = { id: FollowUpId; prompt: string; choices: readonly Choice[] };

/** Question 2 — one branch, chosen by the first answer (spec §5). */
export const FOLLOW_UPS: Record<FollowUpId, FollowUp> = {
  technical: {
    id: 'technical',
    prompt: 'What went wrong?',
    choices: [
      { code: 'crashes_freezes', label: 'Crashes or freezes' },
      { code: 'audio_tools', label: 'Audio tools' },
      { code: 'sign_in', label: 'Sign in' },
      { code: 'billing', label: 'Billing' },
      { code: 'progress_not_saved', label: 'Progress not saved' },
    ],
  },
  content: {
    id: 'content',
    prompt: 'Which area were you looking for?',
    choices: [
      { code: 'glossary', label: 'Glossary' },
      { code: 'calculators', label: 'Calculators' },
      { code: 'audio_tools', label: 'Audio tools' },
      { code: 'learning_labs', label: 'Learning labs' },
      { code: 'courses_credentials', label: 'Courses or credentials' },
    ],
  },
  usability: {
    id: 'usability',
    prompt: 'Where did you get stuck?',
    choices: [
      { code: 'starting_point', label: 'Finding a starting point' },
      { code: 'navigation_search', label: 'Navigation or search' },
      { code: 'enrollment', label: 'Understanding enrollment' },
      { code: 'tool_or_lab', label: 'Using a tool or lab' },
      { code: 'tracking_progress', label: 'Tracking progress' },
    ],
  },
  return: {
    id: 'return',
    prompt: 'Do you expect to return?',
    choices: [
      { code: 'likely', label: 'Likely' },
      { code: 'possibly', label: 'Possibly' },
      { code: 'unlikely', label: 'Unlikely' },
      { code: 'unsure', label: 'Unsure' },
    ],
  },
  expectations: {
    id: 'expectations',
    prompt: 'Which area fell short?',
    choices: [
      { code: 'learning_content', label: 'Learning content' },
      { code: 'tools', label: 'Tools' },
      { code: 'ease_of_use', label: 'Ease of use' },
      { code: 'credentials', label: 'Credentials' },
      { code: 'overall_value', label: 'Overall value' },
    ],
  },
  privacy: {
    id: 'privacy',
    prompt: 'Did you find the account and privacy controls easy to locate?',
    choices: [
      { code: 'yes', label: 'Yes' },
      { code: 'somewhat', label: 'Somewhat' },
      { code: 'no', label: 'No' },
    ],
  },
};

/** The follow-up for a first answer. A blank first answer gets "Do you expect to return?". */
export function followUpFor(reason: ReasonCode | null): FollowUp {
  switch (reason) {
    case 'technical_problem':
      return FOLLOW_UPS.technical;
    case 'content_gap':
      return FOLLOW_UPS.content;
    case 'usability':
      return FOLLOW_UPS.usability;
    case 'expectations':
      return FOLLOW_UPS.expectations;
    case 'privacy':
      return FOLLOW_UPS.privacy;
    case 'budget':
    case 'temporary_break':
    case 'goal_completed':
    case 'alternative_resource':
    case null:
    default:
      return FOLLOW_UPS.return;
  }
}

/** Deletion follow-up: only "did not work well" asks one more thing (owner 2026-10-15). */
export const DELETE_WHAT_WENT_WRONG: FollowUp = {
  id: 'expectations',
  prompt: 'What went wrong? (optional)',
  choices: [
    { code: 'technical_problem', label: 'Technical problems' },
    { code: 'usability', label: 'Hard to use' },
    { code: 'content_gap', label: 'Missing what I needed' },
    { code: 'overall_value', label: 'Not worth the price' },
  ],
};
export function deleteFollowUpFor(reason: ReasonCode | null): FollowUp | null {
  return reason === 'expectations' ? DELETE_WHAT_WENT_WRONG : null;
}

/** Question 3 — optional comment. */
export const COMMENT_MAX = 500;
export const Q3_PROMPT = 'What is one thing we could improve?';
// OWNER-APPROVED COPY (2026-10-24) (spec: "warn briefly not to include payment information or other sensitive details").
export const Q3_WARNING = 'Please do not include payment details or other sensitive information.';
/** Spec §9 suggested post-feedback copy. */
export const COMMENT_THANKS = 'Thank you for explaining what happened. We review feedback to decide where improvements are needed.';
// OWNER-APPROVED COPY (2026-10-24).
export const COMMENT_FAILED = 'We could not send that. You can try again, or leave it.';

export const FEEDBACK_NOTICE = 'Your selected answers are shared with us when you continue or cancel.';

// ── Billing providers ────────────────────────────────────────────────────────
export type Provider = 'apple' | 'google';
// "Google Play" rather than "Google": the subscription lives in Google Play.
export const PROVIDER_NAME: Record<Provider, string> = { apple: 'Apple', google: 'Google Play' };

export function continueToCancelLabel(p: Provider): string {
  return `Continue to ${PROVIDER_NAME[p]} to cancel`;
}
// OWNER-APPROVED COPY (2026-10-24) (spec C1: "explain that cancellation must be completed there").
export function completeThereNote(p: Provider): string {
  return `Canceling is finished on ${PROVIDER_NAME[p]}'s subscription page. We check the result when you come back.`;
}

// ── Cancellation copy (spec §3, verbatim) ────────────────────────────────────
export const C1_TITLE = 'Before you decide';
export const C1_INTRO =
  'We are always working to improve Pro Audio Training Academy. Two quick questions can help us understand your experience and what we could do better. Thank you for sharing your feedback.';
export const C3_TITLE = 'Choose what works for you';
export function c3Body(accessEnd: string | null): string {
  return accessEnd
    ? `If you cancel, your paid access continues until ${accessEnd}. Your account and saved learning progress will remain, and you can return when you are ready.`
    : // OWNER-APPROVED fallback (2026-10-24) when no end date is known: the dated clause is dropped.
      'If you cancel, your account and saved learning progress will remain, and you can return when you are ready.';
}
export const C4_NOT_CONFIRMED = 'We have not confirmed your membership change yet';
export const C4_TITLE = 'Your membership will not renew.';
export function c4Body(accessEnd: string | null): string {
  const rest =
    'After that, your account will remain available with free access. Your saved learning progress will stay with your account under our retention policy.';
  return accessEnd
    ? `You can use your paid features until ${accessEnd}. ${rest}`
    : // OWNER-APPROVED fallback (2026-10-24) when no end date is known.
      'After your paid period ends, your account will remain available with free access. Your saved learning progress will stay with your account under our retention policy.';
}

/**
 * "Thank you, {first_name}, for being part of…" — the name is omitted
 * naturally when missing (never derived from an email), and the feedback
 * sentence only when answers were given.
 */
export function thankYou(firstName: string | null | undefined, gaveFeedback: boolean): string {
  const name = (firstName ?? '').trim();
  const head = name
    ? `Thank you, ${name}, for being part of Pro Audio Training Academy and giving the app a try.`
    : 'Thank you for being part of Pro Audio Training Academy and giving the app a try.';
  const fb = gaveFeedback ? ' Your feedback helps us understand what to improve.' : '';
  return `${head}${fb} You are welcome back whenever you are ready.`;
}

// ── Deletion copy (spec §6 + owner decisions) ───────────────────────────────
export const D1_TITLE = 'Delete your account and personal data';
// Shortened (owner 2026-10-15: "too long to read").
export const D1_BODY = 'This removes your account, progress, favorites and custom lists. It cannot be undone.';
export const D1_CONTINUE = 'Continue with account deletion';
export const D1_KEEP_ACCOUNT = 'Only want to stop paying? Cancel your membership instead';

export type KeepChoice = 'delete_all' | 'keep_record';
export const CERT_CHOICES: readonly Choice<KeepChoice>[] = [
  { code: 'delete_all', label: 'Delete everything. No one can verify your certificates afterwards.' },
  {
    code: 'keep_record',
    label: 'Keep a verification record: only your name, certificate, date and code stay, so employers and instructors can still check it.',
  },
] as const;
// OWNER-APPROVED COPY (2026-10-24).
export const CERT_QUESTION = 'What should happen to your certificates?';

export function subscriptionWarning(p: Provider): string {
  const n = PROVIDER_NAME[p];
  return `Deleting this account does not cancel your ${n} subscription. Cancel it with ${n} to stop future renewal.`;
}
export const D2_DELETE = 'Delete my account';
export const D3_TITLE = 'Your account has been deleted';
