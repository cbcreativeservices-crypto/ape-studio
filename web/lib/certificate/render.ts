/**
 * Certificate HTML for the two public credential pages (D15, owner Option A).
 *
 * Loaded ONLY through `import()` from components/CertificateGallery.tsx, and
 * only once a credentials list is on screen — the renderer carries ~520 KB of
 * embedded fonts, seal and paper art, which must never weigh down the page for
 * everyone else.
 *
 * Every certificate either renders exactly as the app prints it, or not at
 * all: a row whose certificate cannot be drawn (a name or title that does not
 * fit the two-line layout, an unknown award type, a QR that did not render)
 * gets `null` and keeps its text without a thumbnail. Never a broken frame,
 * and never the "Verification unavailable" panel for a credential the server
 * has just verified.
 */
import { buildCertificateHtml } from "./credentials/certificateHtml";

export const REGISTRY_BASE = "https://www.proaudiotrainingacademy.com/registry/";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^[0-9A-F]{8}$/;

export type CertificateInput = {
  holderName: string | null;
  credentialName: string;
  credentialType: string;
  earnedAt: string | null;
};

/** Where the verification on the certificate comes from. */
export type CertificateSource =
  | { kind: "registry"; token: string }
  | { kind: "code"; code: string };

function renderOne(item: CertificateInput, source: CertificateSource): string | null {
  try {
    const awardType = item.credentialType === "program" ? "program" : item.credentialType === "certificate" ? "certificate" : null;
    if (!awardType) return null;
    const base = {
      holderName: item.holderName,
      credentialName: item.credentialName,
      awardType,
      earnedAt: item.earnedAt,
    } as const;

    if (source.kind === "registry") {
      const token = source.token.trim();
      if (!UUID_RE.test(token)) return null;
      const html = buildCertificateHtml({ ...base, qrToken: token, verifyUrl: REGISTRY_BASE + token });
      // The real, scannable QR or nothing.
      return html.includes('aria-label="QR code for the public registry"') ? html : null;
    }

    const code = source.code.trim().toUpperCase();
    if (!CODE_RE.test(code)) return null;
    const html = buildCertificateHtml({ ...base, qrToken: null, verifyUrl: null }, { verifiedCode: code });
    return html.includes('<div class="qr-code-value">') ? html : null;
  } catch {
    // fitText refuses (never clips) a name or title past the two-line layout.
    return null;
  }
}

export function renderCertificates(items: CertificateInput[], source: CertificateSource): (string | null)[] {
  return items.map((item) => renderOne(item, source));
}
