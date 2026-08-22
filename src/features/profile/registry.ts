/**
 * Registry credential URL (owner 2026-08-21, QR feature — option B).
 *
 * Every user's permanent `users.qr_token` (uuid) resolves to their public
 * transcript at the Academy Registry. The QR in Profile + Directory encodes this
 * URL; the website /registry/<token> page reads it via public_verify_by_token.
 */
export const REGISTRY_BASE_URL = 'https://proaudiotrainingacademy.com';

/** The public verification URL for a user's credential token. */
export function registryUrl(qrToken: string): string {
  return `${REGISTRY_BASE_URL}/registry/${qrToken}`;
}
