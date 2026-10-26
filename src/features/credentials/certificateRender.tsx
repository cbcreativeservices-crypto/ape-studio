/**
 * The learner's REAL certificate as a picture (owner 2026-10-26): the small
 * certificates on Progress, the left image box on the Certificates wall and the
 * full-screen view all show the certificate itself — their name, the title, the
 * date and the QR — not the credential's artwork.
 *
 * ONE definition of the certificate (the useCertificateImage rule): the same
 * `buildCertificateHtml` the PDF prints. On a phone it is drawn once in an
 * off-screen WebView, photographed with view-shot to a file and remembered for
 * the session; every later view is a plain image. On the web preview there is
 * no WebView or view-shot, so the page is shown in a scaled, inert iframe.
 *
 * ONE renderer at a time: each screen that shows certificates mounts a
 * `CertificateRenderHost`; the newest mounted one draws (a screen pushed over
 * Progress takes over, and hands back when it closes). Jobs run one at a
 * time, so five certificates on Progress never mean five WebViews at once.
 * Not mounted in App.tsx: app start must not load the certificate HTML
 * (perfStartTrim's start-graph cap).
 *
 * WHOSE certificate: the holder name and QR token come from THIS account and
 * are part of every cache key; the cache and the identity are dropped on any
 * sign-in / sign-out, so one account's certificate is never shown to another.
 *
 * Never throws. No WebView / view-shot (an older build) → 'unavailable', and
 * the caller shows its fallback.
 */
import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { optionalModule } from '../tools/capture/optionalModule';
import { supabase } from '../../lib/supabase';
import { fetchMyQrTokenOrThrow, fetchMyRegistryName } from '../profile/api';
import { registryUrl } from '../profile/registry';
import { buildCertificateHtml } from './certificateHtml';
import type { CertificateRequest } from './certificatePdf';

type WebViewLib = { WebView: (props: Record<string, unknown>) => ReactNode };
type ViewShotLib = {
  captureRef: (ref: unknown, opts?: { format?: 'png' | 'jpg'; quality?: number; result?: 'tmpfile' }) => Promise<string>;
};

/** The certificate is laid out for a 1056 × 816 px page (certificateHtml's
 *  meta); captured at 2/3 of that, the size useCertificateImage shares. */
export const CERT_W = 704;
export const CERT_H = 544;
export const CERT_ASPECT = CERT_W / CERT_H;
const PAGE_W = 1056;
const PAGE_H = 816;
const LOAD_TIMEOUT_MS = 8000;
/** A beat after load for fonts and the QR to paint before the capture. */
const PAINT_SETTLE_MS = 400;

const isWeb = Platform.OS === 'web';

function nativeAvailable(): boolean {
  return (
    !isWeb &&
    optionalModule<WebViewLib>('react-native-webview') != null &&
    optionalModule<ViewShotLib>('react-native-view-shot') != null
  );
}

// ── Identity + cache (module scope, reset on any auth change) ───────────────

type Identity = { holderName: string | null; qrToken: string | null };
let identity: Promise<Identity> | null = null;
let generation = 0;
const done = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
let authHooked = false;

function hookAuth(): void {
  if (authHooked) return;
  authHooked = true;
  try {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') forgetCertificateRenders();
    });
  } catch {
    // no listener: the key still carries the holder + token
  }
}

/** Forget every drawn certificate and the cached identity. Not part of the
 *  account wipe: it is in memory only and drops itself on the auth change. */
function forgetCertificateRenders(): void {
  generation += 1;
  identity = null;
  done.clear();
  pending.clear();
}

function readIdentity(): Promise<Identity> {
  hookAuth();
  if (!identity) {
    const p = Promise.all([fetchMyRegistryName(), fetchMyQrTokenOrThrow()]).then(([holderName, qrToken]) => ({
      holderName,
      qrToken,
    }));
    identity = p;
    // A failed read is not remembered: the next view asks again.
    p.catch(() => {
      if (identity === p) identity = null;
    });
  }
  return identity;
}

function pageFor(req: CertificateRequest, id: Identity): string {
  return buildCertificateHtml({
    holderName: id.holderName ?? 'Academy Member',
    credentialName: req.credentialName,
    awardType: req.awardType,
    earnedAt: req.earnedAt,
    qrToken: id.qrToken,
    verifyUrl: id.qrToken ? registryUrl(id.qrToken) : null,
  });
}

function keyFor(req: CertificateRequest, id: Identity): string {
  return [id.qrToken ?? '-', id.holderName ?? '-', req.awardType, req.credentialName, req.earnedAt ?? '-'].join('|');
}

// ── The single renderer's queue ──────────────────────────────────────────────

type Job = { html: string; resolve: (uri: string | null) => void };
const queue: Job[] = [];
let running: Job | null = null;
type HostListener = (job: Job | null) => void;
/** Mounted hosts, oldest first; the LAST one draws. */
const hosts: HostListener[] = [];
const activeHost = (): HostListener | null => hosts[hosts.length - 1] ?? null;

function pump(): void {
  const host = activeHost();
  if (running || !host) return;
  running = queue.shift() ?? null;
  host(running);
}

function finish(job: Job, uri: string | null): void {
  if (running !== job) return;
  job.resolve(uri);
  running = null;
  activeHost()?.(null);
  pump();
}

function drawNative(html: string): Promise<string | null> {
  return new Promise((resolve) => {
    queue.push({ html, resolve });
    pump();
  });
}

/** Mount one in each screen that shows certificates. Draws nothing until a
 *  certificate is asked for. */
export function CertificateRenderHost() {
  const [job, setJob] = useState<Job | null>(null);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (!nativeAvailable()) return;
    // A newer host takes over: a job the old one was drawing starts again here.
    const prev = activeHost();
    if (prev && running) {
      queue.unshift(running);
      running = null;
      prev(null);
    }
    hosts.push(setJob);
    pump();
    return () => {
      const wasActive = activeHost() === setJob;
      hosts.splice(hosts.indexOf(setJob), 1);
      if (wasActive && running) {
        // Caught mid-draw: back on the queue for the host underneath.
        queue.unshift(running);
        running = null;
      }
      pump();
    };
  }, []);

  useEffect(() => {
    if (!job) return;
    const t = setTimeout(() => finish(job, null), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [job]);

  if (!job) return null;
  const WebView = optionalModule<WebViewLib>('react-native-webview')?.WebView;
  if (!WebView) return null;
  const capture = () => {
    setTimeout(async () => {
      const vs = optionalModule<ViewShotLib>('react-native-view-shot');
      if (!vs || !viewRef.current) return finish(job, null);
      try {
        const raw = await vs.captureRef(viewRef.current, { format: 'jpg', quality: 0.92, result: 'tmpfile' });
        finish(job, raw.startsWith('file://') ? raw : `file://${raw}`);
      } catch {
        finish(job, null);
      }
    }, PAINT_SETTLE_MS);
  };
  return (
    <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View ref={viewRef} collapsable={false} style={styles.page}>
        <WebView
          source={{ html: job.html }}
          originWhitelist={['*']}
          style={styles.page}
          scrollEnabled={false}
          // view-shot cannot read Android's hardware-layer WebView.
          androidLayerType="software"
          onLoadEnd={capture}
        />
      </View>
    </View>
  );
}

// ── The hook + the component screens use ─────────────────────────────────────

export type CertificateArtState =
  | { status: 'loading' }
  | { status: 'ready'; uri: string }
  | { status: 'web'; html: string }
  | { status: 'unavailable' };

export function useCertificateArt(req: CertificateRequest | null): CertificateArtState {
  const [state, setState] = useState<CertificateArtState>({ status: 'loading' });
  const name = req?.credentialName;
  const type = req?.awardType;
  const at = req?.earnedAt ?? null;

  useEffect(() => {
    if (!name || !type) {
      setState({ status: 'unavailable' });
      return;
    }
    if (!isWeb && !nativeAvailable()) {
      setState({ status: 'unavailable' });
      return;
    }
    let alive = true;
    const r: CertificateRequest = { credentialName: name, awardType: type, earnedAt: at };
    const gen = generation;
    readIdentity()
      .then(async (id) => {
        if (isWeb) {
          if (alive) setState({ status: 'web', html: pageFor(r, id) });
          return;
        }
        const key = keyFor(r, id);
        const hit = done.get(key);
        if (hit) {
          if (alive) setState({ status: 'ready', uri: hit });
          return;
        }
        let p = pending.get(key);
        if (!p) {
          p = drawNative(pageFor(r, id));
          pending.set(key, p);
        }
        const uri = await p;
        if (gen === generation) {
          pending.delete(key);
          if (uri) done.set(key, uri);
        }
        if (alive) setState(uri ? { status: 'ready', uri } : { status: 'unavailable' });
      })
      .catch(() => {
        if (alive) setState({ status: 'unavailable' });
      });
    return () => {
      alive = false;
    };
  }, [name, type, at]);

  return state;
}

/**
 * The certificate at any size, always at the page's own proportions. Width
 * comes from the style (or the parent); the height follows. `fallback` shows
 * when the certificate cannot be drawn on this device.
 */
export function CertificateArt({
  req,
  fallback = null,
  label,
  fill = false,
}: {
  req: CertificateRequest | null;
  fallback?: ReactNode;
  label?: string;
  /** Fill the parent (contain) instead of sizing by width. */
  fill?: boolean;
}) {
  const state = useCertificateArt(req);
  const box = fill ? styles.fill : styles.byWidth;
  if (state.status === 'unavailable') return <>{fallback}</>;
  if (state.status === 'ready') {
    return (
      <Image
        source={{ uri: state.uri }}
        style={box}
        contentFit="contain"
        accessible={!!label}
        accessibilityRole={label ? 'image' : undefined}
        accessibilityLabel={label}
        accessibilityIgnoresInvertColors
      />
    );
  }
  if (state.status === 'web') return <WebPage html={state.html} fill={fill} />;
  return <View style={[box, styles.paper]} />;
}

/** Web preview only: the page in an iframe, scaled to the box, untouchable. */
function WebPage({ html, fill }: { html: string; fill: boolean }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };
  let scale = 0;
  let left = 0;
  let top = 0;
  if (size) {
    scale = fill ? Math.min(size.w / PAGE_W, size.h / PAGE_H) : size.w / PAGE_W;
    left = (size.w - PAGE_W * scale) / 2;
    top = fill ? (size.h - PAGE_H * scale) / 2 : 0;
  }
  return (
    <View style={[fill ? styles.fill : styles.byWidth, styles.clip]} onLayout={onLayout} pointerEvents="none">
      {size
        ? createElement('iframe', {
            srcDoc: html,
            title: 'Certificate',
            tabIndex: -1,
            style: {
              position: 'absolute',
              left,
              top,
              width: PAGE_W,
              height: PAGE_H,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
              background: '#ffffff',
            },
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  page: { width: CERT_W, height: CERT_H, backgroundColor: '#ffffff' },
  byWidth: { width: '100%', aspectRatio: CERT_ASPECT },
  fill: { width: '100%', height: '100%' },
  // The certificate's own paper colour while it is being drawn.
  paper: { backgroundColor: '#fbf9f4', opacity: 0.18, borderRadius: 2 },
  clip: { overflow: 'hidden' },
});
