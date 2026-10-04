/**
 * credentialCopy, loaded on first use (perf decision B, 2026-10-04).
 *
 * credentialCopy.ts is ~98 KB of authored copy that is only ever read when a
 * credential's artwork or detail is opened — never on the first frame. A
 * static import put it in the start-up graph (Home → Study Area EXPLORE →
 * CredentialThumb → CredentialAboutPanel), so this accessor `require`s it the
 * first time a slug is actually asked for. Same answers, same nulls; the data
 * file itself is unchanged (it stays the Computer B deliverable that
 * scripts/buildSubjectAudit.mjs reads). Pattern: TopicAboutPanel / topicAbout.
 */
import type { CredentialCopy } from './credentialCopy';

type CredentialCopyModule = typeof import('./credentialCopy');

let copyModule: CredentialCopyModule | null = null;
function loadCopy(): CredentialCopyModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (!copyModule) copyModule = require('./credentialCopy') as CredentialCopyModule;
  return copyModule;
}

/** Per-credential copy by slug, or null if none — loads the copy on first call. */
export function credentialCopyLazy(slug: string): CredentialCopy | null {
  return loadCopy().credentialCopy(slug);
}
