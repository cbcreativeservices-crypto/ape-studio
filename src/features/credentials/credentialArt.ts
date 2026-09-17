/**
 * credentialArt — artwork for earned CERTIFICATES and PROGRAMS, keyed by slug.
 *
 * WIRED TO SUPABASE STORAGE (owner 2026-09-17: "all of the topic, certificate
 * and program art needs to be wired in").
 *
 * This registry used to hold BUNDLED assets and shipped empty, so every earned
 * credential on the Progress screens fell back to the plain CredentialBadge
 * disc even though the real art already existed. It does exist: the art lives
 * in the public `course-cards` bucket keyed by the credential slug, which is
 * what the chooser's CredentialThumb has been loading all along. So this now
 * resolves that same URL and every surface shows the same file for a slug.
 *
 * Precedence: a bundled asset added to CREDENTIAL_ART still wins, so the owner
 * can override any individual credential locally without touching callers.
 *
 * Coverage is incremental. As of 2026-09-17, 66 of 128 certificates and all 36
 * programs have art uploaded; a slug without art resolves to a URL that 404s,
 * and the caller falls back to the badge on load error. Uploading the file is
 * the only step needed to light one up — no code change.
 */
import type { ImageSourcePropType } from 'react-native';
import { credentialArtUrl } from '../../screens/awards/CredentialThumb';

/** Optional BUNDLED overrides. Takes precedence over the remote bucket.
 *  When adding: drop the file under `assets/credentials/` and map it here:
 *    'cert-mixing-engineer-v3': require('../../../assets/credentials/mixing.png'), */
export const CREDENTIAL_ART: Partial<Record<string, ImageSourcePropType>> = {
  // (empty — the remote bucket serves every credential today)
};

/** The art for a credential slug: a bundled override if one exists, otherwise
 *  the `course-cards` bucket URL. Null only when there is no slug at all. */
export function credentialArtFor(slug: string | null | undefined): ImageSourcePropType | null {
  if (!slug) return null;
  return CREDENTIAL_ART[slug] ?? { uri: credentialArtUrl(slug) };
}
