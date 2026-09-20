/**
 * shareCredential — the three ways a member shares what they have earned
 * (owner 2026-09-18: "the user should be able to share easily their QR code,
 * their unique URL and their printed certificate").
 *
 * ── WHAT EXISTED BEFORE, AND WHAT DID NOT ────────────────────────────────────
 *
 * The printed certificate already shared, as a PDF with the QR embedded
 * (`certificatePdf.exportCertificate`, wired in three screens).
 *
 * The other two did not exist at all. The QR was DRAWN in four places — the
 * Profile ID card, the full-screen ID, the Directory — and could not leave the
 * screen except by somebody photographing the phone. And the registry URL was
 * built in exactly one place, `registryUrl()`, whose only consumer was the QR
 * inside that PDF: there was no copy, no share, no way for a member to send an
 * employer a link to their own verified record.
 *
 * ── EVERY PATH RESOLVES TO THE SAME TOKEN ────────────────────────────────────
 *
 * The link, the QR and the certificate all carry `my_identity().qr_token`, and
 * `public_verify_by_token` is what resolves it. So a member cannot hand out two
 * addresses for themselves, and a shared link always agrees with a scanned QR.
 *
 * ── AND NOTHING HERE LIES ABOUT AVAILABILITY ─────────────────────────────────
 *
 * The clipboard and the share sheet are optional native modules. Every function
 * returns a discriminated result rather than throwing or silently doing
 * nothing, so the caller can say what actually happened — the app has been bitten
 * before by controls that appear to work and do not.
 */
import { Share } from 'react-native';

import { optionalModule } from '../tools/capture/optionalModule';
import { fetchMyQrToken } from '../profile/api';
import { registryUrl } from '../profile/registry';

type ClipboardLib = { setStringAsync(text: string): Promise<boolean | void> };

let clipCached: ClipboardLib | null | undefined;
const clipboard = (): ClipboardLib | null => {
  if (clipCached === undefined) clipCached = optionalModule<ClipboardLib>('expo-clipboard');
  return clipCached;
};

export type ShareOutcome =
  | { ok: true }
  /** No qr_token on the account — nothing to link to yet. */
  | { ok: false; reason: 'no_token' }
  /** The native module is not in this build. */
  | { ok: false; reason: 'needs_build' }
  /** The user backed out of the share sheet. Not an error, and must not be
   *  reported as one. */
  | { ok: false; reason: 'dismissed' }
  | { ok: false; reason: 'failed' };

/** True when the clipboard is usable in this build. */
export function canCopy(): boolean {
  return clipboard() != null;
}

/**
 * The member's own verified-record URL, or null when the account has no token.
 *
 * Exported because the share CARD prints it under the QR: seeing the address
 * you are handing someone is the difference between sharing a link and sharing
 * a mystery.
 */
export async function myRegistryLink(): Promise<string | null> {
  const token = await fetchMyQrToken();
  return token ? registryUrl(token) : null;
}

/** Copy the registry link to the clipboard. */
export async function copyRegistryLink(): Promise<ShareOutcome> {
  const clip = clipboard();
  if (!clip) return { ok: false, reason: 'needs_build' };
  try {
    const url = await myRegistryLink();
    if (!url) return { ok: false, reason: 'no_token' };
    await clip.setStringAsync(url);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Open the OS share sheet with the registry link.
 *
 * Uses React Native's own `Share` rather than expo-sharing: expo-sharing shares
 * FILES, and a URL sent through it arrives as an attachment rather than a
 * tappable link.
 */
export async function shareRegistryLink(credentialName?: string): Promise<ShareOutcome> {
  try {
    const url = await myRegistryLink();
    if (!url) return { ok: false, reason: 'no_token' };
    // The words matter as much as the link: a bare URL in a message tells the
    // recipient nothing about what they are being sent or who it is from.
    const message = credentialName
      ? `${credentialName} — verify this credential at Pro Audio Training Academy: ${url}`
      : `My verified record at Pro Audio Training Academy: ${url}`;
    const res = await Share.share({ message, url });
    if (res.action === Share.dismissedAction) return { ok: false, reason: 'dismissed' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** One sentence for each outcome, so no caller has to invent its own. */
export function shareOutcomeMessage(outcome: ShareOutcome, what: string): string | null {
  if (outcome.ok) return null;
  switch (outcome.reason) {
    case 'no_token':
      // Deliberately not "something went wrong": the account genuinely has no
      // verified record yet, and telling them to retry would waste their time.
      return 'Your verified record is still being set up — try again shortly.';
    case 'needs_build':
      return `Sharing your ${what} isn’t available on this device.`;
    case 'dismissed':
      // The user closed the sheet. Saying anything here would be nagging.
      return null;
    default:
      return `Could not share your ${what}. Try again.`;
  }
}
