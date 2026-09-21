/**
 * TrophyImage — renders a topic/trophy image from a public Supabase Storage path
 * ("<bucket>/<file>"), with a graceful fallback when the URL is absent or the
 * image ultimately fails to load.
 *
 * HARDENED like CardArt (load audit 2026-09-09): the Storage buckets serve
 * `Cache-Control: no-cache`, which makes iOS RN `Image` revalidate on every
 * render/launch and drop to the fallback on a single transient failure. Since
 * this now backs the Dashboard current-topic art and EVERY Achievements topic
 * tile (topic-tiles bucket), it uses the same two-path strategy as CardArt:
 *   1. expo-image (when its native module is in the build) — its own memory+disk
 *      cache keys on the URL and ignores the header; decodes off the JS thread.
 *   2. RN `Image` fallback with iOS `cache:'force-cache'` for older dev clients.
 * Plus a backoff retry whose LAST attempt cache-busts, so one failed request no
 * longer means a permanently blank tile; only after MAX_ATTEMPTS do we fall back.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { SUPABASE_URL } from '../lib/env';

type ExpoImageComp = ComponentType<{
  source?: { uri: string };
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  transition?: number;
  recyclingKey?: string;
  onLoad?: () => void;
  onError?: (e: { error?: string }) => void;
}>;

/** expo-image's Image when its native module is in this binary, else null.
 *  Gated on the NATIVE module first so a dev client built before the package
 *  was added never evaluates expo-image's JS. */
const EXPO_IMAGE: ExpoImageComp | null = (() => {
  try {
    if (!requireOptionalNativeModule('ExpoImage')) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('expo-image') as { Image?: ExpoImageComp };
    return lib.Image ?? null;
  } catch {
    return null;
  }
})();

const MAX_ATTEMPTS = 3;
const RETRY_MS = [700, 1600]; // backoff before attempt 2 and attempt 3

/**
 * Warm absolute image URLs into expo-image's memory + disk cache (no-op on a
 * binary without the native module). Used by the detail popups to prefetch the
 * neighbouring items' art so a swipe never waits on the network (2026-09-15).
 */
export function prefetchImages(urls: readonly string[]): void {
  if (!urls.length) return;
  try {
    if (!requireOptionalNativeModule('ExpoImage')) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('expo-image') as { Image?: { prefetch?: (u: string[], cachePolicy?: 'memory-disk') => Promise<boolean> } };
    void lib.Image?.prefetch?.([...urls], 'memory-disk')?.catch(() => {});
  } catch {
    // Prefetch is a nicety; never let it throw.
  }
}

/** Build the public object URL for an achievements.icon_url value. */
export function trophyIconUrl(iconUrl: string | null | undefined): string | null {
  if (!iconUrl) return null;
  // Encode each path segment (filenames contain spaces) but keep the slashes.
  const encoded = iconUrl.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${encoded}`;
}

export function TrophyImage({
  iconUrl,
  size,
  radius = 10,
  fill = false,
  style,
  fallback,
  grayed = false,
  onLoad,
}: {
  iconUrl: string | null | undefined;
  /** Fixed square size; ignored when `fill` (fills the parent instead). */
  size?: number;
  radius?: number;
  /** Fill the parent container (for percentage-sized cells like the grid). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Rendered when there's no URL or the image errors out after all retries. */
  fallback: ReactNode;
  /** Not-yet-earned state: desaturate to grayscale + dim to 85% brightness
   *  (owner 2026-09-09). Uses the RN 0.86 native `filter` style (New Arch). */
  grayed?: boolean;
  /** Fires once the image has decoded and is on screen (either loader). */
  onLoad?: () => void;
}) {
  const url = trophyIconUrl(iconUrl);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    return () => {
      // ⛔ NULL IT. Both the error path and the retry open with
      // `if (timer.current) return;`, so a cleared-but-not-nulled handle
      // wedges this image FOREVER: no further retry, never the cache-busting
      // last attempt, and `failed` never set — so the fallback never renders
      // either. The Dashboard re-points one of these on every jog detent and
      // the credential pager on every swipe, both well inside the backoff
      // (owner 2026-09-20 bug pass).
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [url]);

  const onErr = () => {
    if (attempt >= MAX_ATTEMPTS - 1) {
      setFailed(true); // exhausted retries → show the fallback
      return;
    }
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setAttempt((a) => a + 1);
    }, RETRY_MS[attempt] ?? 1600);
  };

  // Only the LAST attempt busts the cache — earlier retries may have hit a
  // transient error, and the cached copy is what we want.
  const bustedUri = useMemo(() => {
    if (!url) return null;
    return attempt >= MAX_ATTEMPTS - 1 ? `${url}${url.includes('?') ? '&' : '?'}r=${attempt}` : url;
  }, [url, attempt]);

  if (!url || failed || !bustedUri) {
    return <>{fallback}</>;
  }

  const box: ViewStyle = fill
    ? { width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden' }
    : { width: size, height: size, borderRadius: radius, overflow: 'hidden' };

  const ExpoImg = EXPO_IMAGE;
  return (
    <View style={[box, style, grayed && styles.grayed]}>
      {ExpoImg ? (
        <ExpoImg
          source={{ uri: bustedUri }}
          style={styles.img}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          recyclingKey={url}
          onLoad={onLoad}
          onError={onErr}
        />
      ) : (
        <Image
          accessible={false}
          importantForAccessibility="no"
          source={{ uri: bustedUri, cache: 'force-cache' }}
          style={styles.img}
          resizeMode="contain"
          onLoad={onLoad}
          onError={onErr}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  // Not-yet-earned: full grayscale + 85% brightness (owner 2026-09-09). Native
  // `filter` (RN 0.86 New Arch) — also maps to CSS filter on web.
  grayed: { filter: [{ grayscale: 1 }, { brightness: 0.85 }] },
});
