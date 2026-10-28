/**
 * WEB SEAM for the certificate renderer (D15, 2026-10-27).
 *
 * `../../credentials/certificateHtml.ts` is a byte-for-byte copy of the app's
 * src/features/credentials/certificateHtml.ts (guarded by
 * test/webCertificateCopy_20261027.test.ts at the repo root). It imports
 * `optionalModule` from this relative path. The app's real optionalModule has
 * literal require rows (expo-print, react-native-view-shot, …) that a
 * Next bundle cannot resolve, so the website gets this file at the same path
 * instead: the ONE module the certificate needs (qrcode, a pure-JS dependency
 * of web/package.json) and null for anything else — the same contract as the
 * app's version.
 *
 * Static import on purpose: the whole certificate module graph is reached only
 * through a dynamic import() in components/CertificateGallery.tsx, so qrcode
 * lands in that lazy chunk, never in the page bundle.
 */
import * as qrcode from "qrcode";

export function optionalModule<T = unknown>(name: string): T | null {
  return name === "qrcode" ? (qrcode as unknown as T) : null;
}
