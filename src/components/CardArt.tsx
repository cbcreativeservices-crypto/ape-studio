/**
 * CardArt — a resilient ImageBackground for the Home carousel art (owner report
 * 2026-09-05: "both phones are not always showing their menu-screen carousel
 * image card — instead they show an image placeholder").
 *
 * ROOT CAUSES found:
 *  1. The course-cards bucket serves every object with `Cache-Control: no-cache`
 *     (verified with a HEAD request). On iOS the default request policy then
 *     REVALIDATES on every render — so every FlatList recycle and every launch
 *     re-fetched the art over the network, and on a weak connection the card
 *     sat on its dark fallback. `Image.prefetch` warming was defeated the same
 *     way. `cache: 'force-cache'` (iOS) returns the stored bytes regardless of
 *     that header once the first load has succeeded. Android's Fresco keys its
 *     disk cache by URI and already ignores the header.
 *  2. A single failed request (timeout, flaky Wi-Fi) left the RN Image BLANK for
 *     good — there was no onError, so nothing ever retried until the card was
 *     recycled. This component retries with backoff; the final attempt adds a
 *     cache-busting query so a poisoned cache entry cannot win three times.
 *  3. Boot fired 26 parallel prefetches (3.2 MB) that queued AHEAD of the
 *     visible cards' own requests; see CourseSelectionScreen.warmCardArt.
 *
 * Behaviour: renders the same ImageBackground the cards always used, plus
 * retry. No layout change, no new dependency. fadeDuration 0 on Android so a
 * cached hit paints immediately instead of fading in like a fresh load.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ImageBackground, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const MAX_ATTEMPTS = 3;
const RETRY_MS = [700, 1600]; // backoff before attempt 2 and attempt 3

export function CardArt({
  uri,
  style,
  imageStyle,
  children,
}: {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setAttempt(0); // a new uri starts fresh
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [uri]);

  const source = useMemo(() => {
    if (!uri) return undefined;
    // Only the LAST attempt busts the cache — the first retry may simply have
    // hit a transient network error, and the cached copy is what we want.
    const u = attempt >= MAX_ATTEMPTS - 1 ? `${uri}${uri.includes('?') ? '&' : '?'}r=${attempt}` : uri;
    return { uri: u, cache: 'force-cache' as const };
  }, [uri, attempt]);

  return (
    <ImageBackground
      source={source}
      style={style}
      imageStyle={imageStyle}
      fadeDuration={0}
      onError={() => {
        if (attempt >= MAX_ATTEMPTS - 1 || timer.current) return;
        timer.current = setTimeout(() => {
          timer.current = null;
          setAttempt((a) => a + 1);
        }, RETRY_MS[attempt] ?? 1600);
      }}
    >
      {children}
    </ImageBackground>
  );
}
