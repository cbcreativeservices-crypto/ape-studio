/**
 * Share the CERTIFICATE ITSELF as an image (owner 2026-09-18: "their printed
 * certificate (image)"; in the iOS 37 / Android 21 build, owner 2026-10-24).
 *
 * ONE definition of the certificate: the same `buildCertificateHtml` the PDF
 * prints is rendered in an off-screen WebView, photographed with view-shot and
 * handed to the share sheet (`captureAndShare`, the SHARE QR path). No second
 * React drawing that could drift from the printed one.
 *
 * The WebView is mounted only while a share is in progress, laid out for real
 * (a hidden or zero-size view captures BLANK — see CredentialShareRow) and
 * moved off-screen. Android draws a WebView on a hardware layer that view-shot
 * cannot read, so it renders on a software layer here.
 *
 * Never throws; every failure is a typed reason the screen states honestly.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureAndShare, isAvailable as canShareImage } from '../../screens/lab/calc/shareImage';
import { optionalModule } from '../tools/capture/optionalModule';
import { fetchMyQrTokenOrThrow, fetchMyRegistryName } from '../profile/api';
import { registryUrl } from '../profile/registry';
import { buildCertificateHtml } from './certificateHtml';
import type { CertificateRequest } from './certificatePdf';

type WebViewLib = { WebView: (props: Record<string, unknown>) => ReactNode };

/** The certificate is laid out for a 1056 px viewport (certificateHtml's meta). */
const VIEW_W = 704;
const VIEW_H = 544;
const LOAD_TIMEOUT_MS = 8000;
/** A beat after load for fonts and the QR image to paint before the capture. */
const PAINT_SETTLE_MS = 400;

export type CertificateImageResult = { ok: true } | { ok: false; reason: 'needs_build' | 'failed' };

export function certificateImageAvailable(): boolean {
  return canShareImage() && optionalModule<WebViewLib>('react-native-webview') != null;
}

/** `node` must be rendered somewhere in the screen; `share` does the rest. */
export function useCertificateImage(): { node: ReactNode; share: (req: CertificateRequest) => Promise<CertificateImageResult> } {
  const [html, setHtml] = useState<string | null>(null);
  const viewRef = useRef<View>(null);
  const loadedRef = useRef<(() => void) | null>(null);

  const share = useCallback(async (req: CertificateRequest): Promise<CertificateImageResult> => {
    if (!certificateImageAvailable()) return { ok: false, reason: 'needs_build' };
    try {
      const [holderName, qrToken] = await Promise.all([fetchMyRegistryName(), fetchMyQrTokenOrThrow()]);
      const verifyUrl = qrToken ? registryUrl(qrToken) : null;
      const page = buildCertificateHtml({
        holderName: holderName ?? 'Academy Member',
        credentialName: req.credentialName,
        awardType: req.awardType,
        earnedAt: req.earnedAt,
        qrToken,
        verifyUrl,
      });
      const loaded = new Promise<boolean>((resolve) => {
        const t = setTimeout(() => resolve(false), LOAD_TIMEOUT_MS);
        loadedRef.current = () => {
          clearTimeout(t);
          resolve(true);
        };
      });
      setHtml(page);
      const ok = await loaded;
      loadedRef.current = null;
      if (!ok) {
        setHtml(null);
        return { ok: false, reason: 'failed' };
      }
      await new Promise((r) => setTimeout(r, PAINT_SETTLE_MS));
      const shared = await captureAndShare(viewRef.current, 'Your certificate', verifyUrl ? `Verify at ${verifyUrl}` : undefined);
      setHtml(null);
      return shared ? { ok: true } : { ok: false, reason: 'failed' };
    } catch {
      setHtml(null);
      return { ok: false, reason: 'failed' };
    }
  }, []);

  const lib = html ? optionalModule<WebViewLib>('react-native-webview') : null;
  const WebView = lib?.WebView;
  const node = html && WebView ? (
    <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View ref={viewRef} collapsable={false} style={styles.page}>
        <WebView
          source={{ html }}
          originWhitelist={['*']}
          style={styles.page}
          scrollEnabled={false}
          androidLayerType="software"
          onLoadEnd={() => loadedRef.current?.()}
        />
      </View>
    </View>
  ) : null;

  return { node, share };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  page: { width: VIEW_W, height: VIEW_H, backgroundColor: '#ffffff' },
});
