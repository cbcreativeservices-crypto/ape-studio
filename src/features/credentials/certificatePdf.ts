/**
 * certificatePdf — render the credential document to a PDF and hand it to the
 * native share sheet (owner-approved 2026-08-29, launch blocker #2).
 *
 * HONESTY GATE, the shareImage.ts house pattern: expo-print and expo-sharing are
 * installed as JS, but their NATIVE halves only exist from the next dev build
 * onward. isAvailable() gates the button and every failure returns a typed
 * reason so the caller can say "needs the next app build" — never a dead or
 * lying control, and never a crash.
 *
 * Both modules are reached through optionalModule (runtime require), NOT a
 * top-level import — same reason push.ts uses a guarded lazy require: a static
 * import calls requireNativeModule at startup and hard-crashes dev clients built
 * before the module shipped.
 */
import { optionalModule } from '../tools/capture/optionalModule';
import { fetchMyQrToken, fetchMyRegistryName } from '../profile/api';
import { registryUrl } from '../profile/registry';
import { buildCertificateHtml } from './certificateHtml';

type PrintLib = {
  printToFileAsync: (opts: { html: string; width?: number; height?: number; base64?: false }) => Promise<{ uri: string }>;
};
type SharingLib = {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }) => Promise<void>;
};

let printCached: PrintLib | null | undefined;
let shareCached: SharingLib | null | undefined;
const printLib = (): PrintLib | null => {
  if (printCached === undefined) printCached = optionalModule<PrintLib>('expo-print');
  return printCached;
};
const shareLib = (): SharingLib | null => {
  if (shareCached === undefined) shareCached = optionalModule<SharingLib>('expo-sharing');
  return shareCached;
};

/** True when this build can actually produce and share a PDF. */
export function isAvailable(): boolean {
  return printLib() != null && shareLib() != null;
}

export type CertificateResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'needs_build' | 'no_share_target' | 'failed' };

/** US Letter landscape in PostScript points — expo-print's unit. */
const PAGE_W = 792;
const PAGE_H = 612;

export type CertificateRequest = {
  credentialName: string;
  awardType: 'certificate' | 'program';
  earnedAt: string | null;
};

/**
 * Build the PDF and open the share sheet. Never throws.
 *
 * The holder name comes from the SERVER copy of registry_name (the Profile
 * field "Name used in registry"), which is also what public_verify_by_token
 * returns — so the printed document and the page its QR resolves to always
 * agree. Falls back to the honest 'Academy Member' rather than inventing one.
 */
export async function exportCertificate(req: CertificateRequest): Promise<CertificateResult> {
  const print = printLib();
  const share = shareLib();
  if (!print || !share) return { ok: false, reason: 'needs_build' };

  try {
    const [holderName, qrToken] = await Promise.all([fetchMyRegistryName(), fetchMyQrToken()]);

    const html = buildCertificateHtml({
      holderName: holderName ?? 'Academy Member',
      credentialName: req.credentialName,
      awardType: req.awardType,
      earnedAt: req.earnedAt,
      qrToken,
      verifyUrl: qrToken ? registryUrl(qrToken) : null,
    });

    const { uri } = await print.printToFileAsync({ html, width: PAGE_W, height: PAGE_H });
    if (!uri) return { ok: false, reason: 'failed' };

    if (!(await share.isAvailableAsync())) return { ok: false, reason: 'no_share_target' };
    await share.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, {
      mimeType: 'application/pdf',
      dialogTitle: 'Your credential',
      UTI: 'com.adobe.pdf',
    });
    return { ok: true, uri };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
