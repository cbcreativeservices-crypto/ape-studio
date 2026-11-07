/**
 * The verified account kinds: employer, company, institution, instructor. One
 * vocabulary for all of them (must-do R1, 2026-10-27; four kinds 2026-11-07).
 *
 * Since 2026-10-04 the server has two kinds of verified account: an employer,
 * and an instructor or school (owner: "audio instructors and schools verify
 * like employers: same application, same right to contact members"). The
 * application, the approval and the profile row are the same; only `kind`
 * differs ('employer' | 'instructor', a CHECK constraint on both
 * employer_applications and employer_profiles). The app turned every
 * non-'employer' kind into a plain member, so a verified instructor wrote to a
 * member with no badge at all.
 *
 * Import-free on purpose, so the node tests load it without React Native.
 */

/** The four kinds the server allows (employer_profiles_kind_check). An
 *  Employer hires, a Company does not, an Institution is a school or program,
 *  an Instructor teaches. */
export type VerifierKind = 'employer' | 'company' | 'institution' | 'instructor';

/** Who is on the other end of a contact thread. */
export type ContactKind = 'member' | VerifierKind;

/**
 * `contact_threads.other_kind` → the app's kind.
 *
 * Anything we do not recognise is a MEMBER: an older server that does not send
 * the column, or a kind added later, must never be drawn with a verified badge
 * the app cannot explain.
 */
export function contactKindOf(raw: unknown): ContactKind {
  return raw === 'employer' || raw === 'company' || raw === 'institution' || raw === 'instructor' ? raw : 'member';
}

/**
 * A kind read from the account's OWN row (`my_verifier_kind()`, or the
 * application's `kind`). The row exists, so the account is a verifier of SOME
 * kind; an unrecognised value falls back to 'employer', the column's default,
 * because that is the wording every existing account has always seen.
 */
export function verifierKindOf(raw: unknown): VerifierKind {
  return raw === 'instructor' || raw === 'company' || raw === 'institution' ? raw : 'employer';
}

/** Every word the app shows that depends on the kind. */
export const VERIFIER_COPY: Record<
  VerifierKind,
  {
    /** The Profile section's heading. */
    accountHead: string;
    /** The badge beside the name in a contact thread. */
    badge: string;
    /** The badge, read aloud. */
    badgeA11y: string;
    /** The admin list's tag. */
    adminTag: string;
    /** The verified account's first line in Profile. */
    activeBody: string;
    /** The three choice rows' headings (area / role / open_to). */
    areaHead: string;
    roleHead: string;
    offerHead: string;
    /** The verified check could not be read. */
    checkFailed: string;
    /** The apply link, read aloud. */
    openApplicationA11y: string;
  }
> = {
  employer: {
    accountHead: 'EMPLOYER ACCOUNT',
    badge: 'VERIFIED EMPLOYER',
    badgeA11y: 'Verified employer. We checked this organization.',
    adminTag: 'EMPLOYER',
    activeBody:
      'Your employer account is active. Choose what you are looking for. Your choices are kept on your account.',
    areaHead: 'AREAS YOU HIRE IN',
    roleHead: 'ROLES YOU ARE LOOKING FOR',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your employer account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your employer application on the website',
  },
  company: {
    accountHead: 'COMPANY ACCOUNT',
    badge: 'VERIFIED COMPANY',
    badgeA11y: 'Verified company. We checked this organization.',
    adminTag: 'COMPANY',
    activeBody:
      'Your company account is active. Choose what you work in and what you offer. Your choices are kept on your account.',
    areaHead: 'AREAS YOU WORK IN',
    roleHead: 'ROLES YOU WORK WITH',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your company account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your company application on the website',
  },
  institution: {
    accountHead: 'INSTITUTION ACCOUNT',
    badge: 'VERIFIED INSTITUTION',
    badgeA11y: 'Verified institution. We checked this school or program.',
    adminTag: 'INSTITUTION',
    activeBody:
      'Your institution account is active. Choose what you teach and what you offer. Your choices are kept on your account.',
    areaHead: 'AREAS YOU TEACH',
    roleHead: 'ROLES YOU TRAIN PEOPLE FOR',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your institution account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your institution application on the website',
  },
  instructor: {
    accountHead: 'INSTRUCTOR ACCOUNT',
    badge: 'VERIFIED INSTRUCTOR',
    badgeA11y: 'Verified instructor. We checked this school or instructor.',
    adminTag: 'INSTRUCTOR OR SCHOOL',
    activeBody:
      'Your instructor account is active. Choose what you teach and what you offer. Your choices are kept on your account.',
    areaHead: 'AREAS YOU TEACH',
    roleHead: 'ROLES YOU TRAIN PEOPLE FOR',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your instructor account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your instructor application on the website',
  },
};


/* ── Company ⇄ Employer ─────────────────────────────────────────────── */

/** verified_account_status(), as the Profile row needs it. */
export type VerifiedStatus = {
  kind: VerifierKind | null;
  canSwitch: boolean;
  switchTo: VerifierKind | null;
  /** The switch was used recently; it can be used again from this moment. */
  nextSwitchAt: string | null;
};

export function verifiedStatusOf(raw: unknown): VerifiedStatus {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const to = r.switch_to;
  return {
    kind: typeof r.kind === 'string' && r.kind ? verifierKindOf(r.kind) : null,
    canSwitch: r.can_switch === true,
    switchTo: to === 'company' || to === 'employer' ? to : null,
    nextSwitchAt: typeof r.next_switch_at === 'string' ? r.next_switch_at : null,
  };
}

const SWITCH_REFUSALS: Record<string, string> = {
  not_available: 'Switching between Employer and Company is not open yet.',
  bad_kind: 'That kind of account is not available.',
  kind_locked: 'This kind of account cannot be switched.',
  too_soon: 'You switched recently. You can switch again after a day.',
  not_verified: 'Only a verified account can switch.',
  account_restricted: 'Your account cannot switch right now.',
  sign_in: 'Sign in to switch your account.',
  switch_failed: 'The switch did not go through. Your account is unchanged.',
};

/** Words for a `verified:<code>` refusal. Never the raw code. */
export function switchRefusal(message: string | null | undefined): string {
  const code = /\bverified:([a-z_]+)/.exec(message ?? '')?.[1];
  return (code && SWITCH_REFUSALS[code]) || 'We could not reach the server. Your account is unchanged.';
}
