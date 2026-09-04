/**
 * credentialArt — bundled trophy art for earned CERTIFICATES and PROGRAMS,
 * keyed by the credential's `slug`.
 *
 * There is no DB art column for certificates/programs (the backend is frozen),
 * so — exactly like the app's bundled nav icons — credential art ships as local
 * assets referenced here. This registry is intentionally EMPTY at launch: the
 * owner supplies the art in a later session, at which point each credential is
 * one `require()` + one map entry, no architecture change. Until then the
 * Certificates/Programs screens fall back to the `CredentialBadge` disc, which
 * is the "degrade gracefully with placeholders" behavior the owner asked for.
 *
 * When adding art: drop the PNG under `assets/credentials/` and add
 *   'live-sound-production': require('../../../assets/credentials/live-sound-production.png'),
 */
import type { ImageSourcePropType } from 'react-native';

export const CREDENTIAL_ART: Partial<Record<string, ImageSourcePropType>> = {
  // (empty — owner supplies art later)
};

/** The bundled art for a credential slug, or null to fall back to CredentialBadge. */
export function credentialArtFor(slug: string | null | undefined): ImageSourcePropType | null {
  if (!slug) return null;
  return CREDENTIAL_ART[slug] ?? null;
}
