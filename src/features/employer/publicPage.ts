/**
 * The public page of a verified employer or instructor on the website:
 * https://www.proaudiotrainingacademy.com/e/<public_token> (must-do H5, owner
 * GO 2026-10-29). The page lives in web/app/e/[token].
 *
 * The token is employer_profiles.public_token, NOT a community-profile token:
 * `contact_threads.other_token` is the member's community token and is never
 * used here. Anything that is not a uuid gives no URL, so a missing or odd
 * server value hides the link instead of opening a broken page.
 *
 * Import-free except the site constant, so the node tests load it.
 */
import { REGISTRY_BASE_URL } from '../profile/registry.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A well-formed public token, or null. */
export function employerPageToken(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return UUID_RE.test(t) ? t.toLowerCase() : null;
}

/** The page URL for a token, or null when the token is not usable. */
export function employerPageUrl(raw: unknown): string | null {
  const t = employerPageToken(raw);
  return t ? `${REGISTRY_BASE_URL}/e/${t}` : null;
}
