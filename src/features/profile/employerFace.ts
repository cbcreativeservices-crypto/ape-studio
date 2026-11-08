/**
 * Which face the Profile EMPLOYER / INSTRUCTOR section shows (bug pass 2,
 * CODE-2-13, 2026-11-08).
 *
 * The section draws nothing for almost everyone: learners are the majority and
 * must never see employer UI. But "nothing" was also what a VERIFIED employer
 * got when both of the section's reads failed (offline): `verified` false and
 * no application, so the section vanished without a word, and a failed read
 * read as "nothing here".
 *
 * When the reads fail we cannot ask the server who this is, so the face leans
 * on what this sign-in already learned: the verified kind the sign-in fill (and
 * this section's own earlier reads) put in the feedback identity's `role`. A
 * known verifier gets the UNREADABLE face with a retry; anyone else, which is
 * every learner, still gets nothing, because "Couldn't check your employer
 * account" said to a learner claims an account they do not have.
 *
 * Import-free (type imports only) so its node test runs bare.
 */
import type { VerifierKind } from '../employer/verifierKind';

export type EmployerFace = 'hidden' | 'show' | 'unreadable';

const KINDS: readonly VerifierKind[] = ['employer', 'company', 'institution', 'instructor'];

/** The verified kind this sign-in already knows, from the feedback identity's
 *  `role` (a free string there). Anything else is no evidence. */
export function knownVerifierKind(role: string | undefined): VerifierKind | null {
  return role && (KINDS as readonly string[]).includes(role) ? (role as VerifierKind) : null;
}

export function employerSectionFace(input: {
  loaded: boolean;
  hasApp: boolean;
  verified: boolean;
  /** my_verifier_kind() answered 'unknown': the check itself failed. */
  verifyFailed: boolean;
  /** What this sign-in already knows (`knownVerifierKind`). */
  knownKind: VerifierKind | null;
}): EmployerFace {
  if (!input.loaded) return 'hidden';
  if (input.hasApp || input.verified) return 'show';
  if (input.verifyFailed && input.knownKind) return 'unreadable';
  return 'hidden';
}
