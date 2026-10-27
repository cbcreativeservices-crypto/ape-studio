/**
 * "Allow my instructor to see my progress" — the PURE half (must-do H2,
 * owner GO 2026-10-27). Import-free so the node tests load it.
 *
 * ── THE SERVER (live since 2026-10-04; definitions re-read 2026-10-27) ──────
 *   instructor_share_lookup(p_code) → (instructor_name, school). No row = the
 *       code is wrong, revoked, not an instructor, or your own.
 *   instructor_share_on(p_code) → (instructor_name, school, granted_at,
 *       instructor_active). Replaces any earlier instructor. Raises
 *       "please sign in first" / "that instructor code is not right" /
 *       "that is your own instructor code".
 *   instructor_share_off() → boolean (true = a share was removed).
 *   instructor_share_mine() → the same four columns; NO ROW = off.
 * All four are granted to `authenticated` only and resolve the caller with
 * directory_me(), so a guest (no account) can never share. Every on/off is
 * logged server-side. Codes ignore case, spaces and dashes; O reads as 0 and
 * I/L as 1.
 *
 * ── WHAT THE INSTRUCTOR SEES (owner 2026-10-04 + 2026-10-26, and exactly what
 * the instructor-side progress functions return, read live 2026-10-27) ──────
 * Topics = the ones you are enrolled in, have studied, or have completed —
 * including topics completed before you shared (no date filter, owner
 * 2026-10-26). Labs = the certificate labs of those topics plus the Audio
 * Fundamentals labs, with any other lab you finished listed apart. Scores and
 * dates, never answers. Only ONE verified instructor (kind 'instructor', not
 * revoked) at a time; employers never.
 */

export type InstructorShare = {
  instructorName: string;
  school: string | null;
  grantedAt: string | null;
  /** False once the instructor lost verification: nothing is shared then. */
  instructorActive: boolean;
};

/** A code as the instructor reads it out: letters and digits only. */
export function cleanInstructorCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** instructor_my_code() makes 8-character codes. Checked before asking. */
export const INSTRUCTOR_CODE_LENGTH = 8;

export function codeLooksRight(raw: string): boolean {
  return cleanInstructorCode(raw).length === INSTRUCTOR_CODE_LENGTH;
}

/** One row of instructor_share_mine / instructor_share_on → the app's shape. */
export function shareFromRow(row: unknown): InstructorShare | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  return {
    instructorName: typeof r.instructor_name === 'string' && r.instructor_name ? r.instructor_name : 'Your instructor',
    school: typeof r.school === 'string' && r.school.trim() ? r.school : null,
    grantedAt: typeof r.granted_at === 'string' ? r.granted_at : null,
    instructorActive: r.instructor_active === true,
  };
}

/** "Ina S · Miramar College", or the name alone. */
export function whoLabel(s: { instructorName: string; school: string | null }): string {
  return s.school ? `${s.instructorName} · ${s.school}` : s.instructorName;
}

/** The server's three refusals, in plain words; anything else is a connection
 *  problem we cannot confirm either way. */
export function shareErrorCopy(message: string | undefined): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('instructor code is not right')) return SHARE_COPY.codeWrong;
  if (m.includes('your own instructor code')) return SHARE_COPY.ownCode;
  if (m.includes('sign in first')) return SHARE_COPY.needsAccount;
  return SHARE_COPY.notConfirmed;
}

/** Every word the student reads. */
export const SHARE_COPY = {
  sectionTitle: 'MY INSTRUCTOR',
  switchLabel: 'Allow my instructor to see my progress',
  intro:
    'If your instructor or school uses the Academy, you can let them see your progress. It is off unless you turn it on, and you can turn it off at any time.',
  employersNever: 'Employers never see this.',
  seesHead: 'WHAT YOUR INSTRUCTOR SEES',
  sees: [
    // private.person_label: registry_name, else first name + last initial,
    // else users.nickname — which register_commercial_user fills with the
    // part of the email before the @. Said plainly rather than hidden.
    'Your name: the name on your certificates. If you have not set one, your account name, which starts out as the part of your email address before the @.',
    'Each topic you are enrolled in, have studied or have completed — including topics you completed before you turned this on: done or in progress, your best score, and how far you are in each study method, flashcards included.',
    'Your quiz attempts, practice ones too: how many, each score and the date.',
    'Your labs: the labs for those topics’ certificates and the Audio Fundamentals labs, plus any other lab you finished.',
    'Your final exam attempts (score, pass or not) and the certificates you have earned.',
    'When you last studied.',
  ] as readonly string[],
  neverHead: 'NEVER SHOWN',
  never: [
    'Your answers to any question.',
    'Your notes, your full email address, and the private user name you set in Profile.',
  ] as readonly string[],
  oneAtATime: 'You can share with one instructor at a time. A new code replaces the old one.',
  guest: 'Sharing needs an account. Sign in or create one to share your progress with an instructor.',
  readFailed:
    'Couldn’t check whether you are sharing just now. Check your connection and reopen Profile — nothing has been changed.',
  checking: 'Checking…',
  inactive: 'Your instructor’s account is no longer verified — nothing is being shared.',
  // The code popup.
  enterTitle: 'Your instructor’s code',
  enterBody: 'Type the 8-character code your instructor gave you. Capitals and dashes don’t matter.',
  codeShape: 'Instructor codes are 8 letters and numbers. Check the code and try again.',
  lookUp: 'FIND MY INSTRUCTOR',
  confirmTitle: 'Share your progress?',
  share: 'SHARE MY PROGRESS',
  differentCode: 'USE A DIFFERENT CODE',
  cancel: 'CANCEL',
  codeWrong: 'That code doesn’t match a verified instructor. Check it with your instructor.',
  ownCode: 'That is your own instructor code.',
  needsAccount: 'Sharing needs an account. Sign in first.',
  notConfirmed:
    'Couldn’t reach the Academy to confirm that. Check your connection — this section shows what the server last said.',
  // Results.
  sharedTitle: 'Sharing is on',
  stopTitle: 'Stop sharing?',
  stopYes: 'Stop sharing',
  notConfirmedTitle: 'Couldn’t confirm',
  stoppedTitle: 'Sharing is off',
  stoppedBody: 'Your instructor can no longer see your progress.',
};

/** "Sharing with Ina S · Miramar College since 27 Oct 2026." */
export function sharingSince(s: InstructorShare): string {
  const d = s.grantedAt ? new Date(s.grantedAt) : null;
  const when =
    d && !Number.isNaN(d.getTime())
      ? ` since ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : '';
  return `Sharing with ${whoLabel(s)}${when}.`;
}

/** The confirm card's line — asked before the switch flips. */
export function confirmLine(s: { instructorName: string; school: string | null }): string {
  return `Share your progress with ${whoLabel(s)}? They will see what is listed under “What your instructor sees”, until you turn this off.`;
}

/** After turning it off. */
export function stopLine(s: InstructorShare): string {
  return `${whoLabel(s)} will no longer see your progress. You can share again later with their code.`;
}
