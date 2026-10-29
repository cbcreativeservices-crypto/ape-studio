/**
 * Verified EMPLOYER or verified INSTRUCTOR — one vocabulary for both (must-do
 * R1, 2026-10-27).
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

/** The two kinds the server allows (employer_profiles_kind_check). */
export type VerifierKind = 'employer' | 'instructor';

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
  return raw === 'employer' || raw === 'instructor' ? raw : 'member';
}

/**
 * A kind read from the account's OWN row (`my_verifier_kind()`, or the
 * application's `kind`). The row exists, so the account is a verifier of SOME
 * kind; an unrecognised value falls back to 'employer', the column's default,
 * because that is the wording every existing account has always seen.
 */
export function verifierKindOf(raw: unknown): VerifierKind {
  return raw === 'instructor' ? 'instructor' : 'employer';
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
      'Your employer account is active. Choose what you are looking for — members can see this, and it is how the right people find you.',
    areaHead: 'AREAS YOU HIRE IN',
    roleHead: 'ROLES YOU ARE LOOKING FOR',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your employer account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your employer application on the website',
  },
  instructor: {
    accountHead: 'INSTRUCTOR ACCOUNT',
    badge: 'VERIFIED INSTRUCTOR',
    badgeA11y: 'Verified instructor. We checked this school or instructor.',
    adminTag: 'INSTRUCTOR OR SCHOOL',
    activeBody:
      'Your instructor account is active. Choose what you teach and what you offer — members can see this, and it is how the right people find you.',
    areaHead: 'AREAS YOU TEACH',
    roleHead: 'ROLES YOU TRAIN PEOPLE FOR',
    offerHead: 'WHAT YOU ARE OFFERING',
    checkFailed: 'Couldn’t check your instructor account just now. Check your connection and reopen this screen.',
    openApplicationA11y: 'Open your instructor application on the website',
  },
};
