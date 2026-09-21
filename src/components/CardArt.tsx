/**
 * CardArt — the Home carousel's card art, made reliable (owner report
 * 2026-09-05: "both phones are not always showing their menu-screen carousel
 * image card — instead they show an image placeholder").
 *
 * ROOT CAUSE (verified with a HEAD request): the course-cards bucket serves
 * every object with `Cache-Control: no-cache`. React Native's iOS image loader
 * then revalidates on every render and every launch, `Image.prefetch` warming is
 * defeated the same way, and a single failed request left the RN Image BLANK
 * for good because nothing retried.
 *
 * TWO PATHS, chosen at runtime:
 *  1. `expo-image` (installed 2026-09-05, ships in the NEXT native build): its
 *     own memory + disk cache keys on the URL and ignores that header, decodes
 *     off the JS thread, and reports errors. Used whenever its native module is
 *     present.
 *  2. React Native `ImageBackground` fallback for the dev clients built before
 *     expo-image was added: iOS `force-cache` (stored bytes win over the header
 *     once loaded), fadeDuration 0, and a retry with backoff whose last attempt
 *     cache-busts so a poisoned entry cannot win three times.
 *
 * In __DEV__ every load/failure is logged as `[cardart] …` so the phone's Metro
 * output says exactly which file failed and why.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { ImageBackground, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type ExpoImageBackground = ComponentType<{
  source?: { uri: string };
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  transition?: number;
  recyclingKey?: string;
  onLoad?: () => void;
  onError?: (e: { error: string }) => void;
  children?: ReactNode;
}>;

/** expo-image's ImageBackground when its native module is in this binary, else
 *  null. Gated on the NATIVE module first so a dev client built before the
 *  package was added never evaluates expo-image's JS (which would throw). The
 *  require is a literal string so Metro bundles the module for the build. */
const EXPO_IMAGE_BG: ExpoImageBackground | null = (() => {
  try {
    if (!requireOptionalNativeModule('ExpoImage')) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('expo-image') as { ImageBackground?: ExpoImageBackground };
    return lib.ImageBackground ?? null;
  } catch {
    return null;
  }
})();

const MAX_ATTEMPTS = 3;
const RETRY_MS = [700, 1600]; // backoff before attempt 2 and attempt 3

const tag = (uri: string | null | undefined) => uri?.split('/').pop() ?? '(none)';

export function CardArt({
  uri,
  style,
  imageStyle,
  children,
  onLoad,
  onExhausted,
}: {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: ReactNode;
  /** Fires once the image has decoded and is on screen (either loader). */
  onLoad?: () => void;
  /**
   * Fires ONCE per uri when every retry has failed and no image will appear.
   *
   * ── WHY THIS EXISTS (2026-09-18) ──────────────────────────────────────────
   *
   * This component retries three times and then simply stays blank, by design —
   * so the fallback has always been each caller's job. Only ONE of the four
   * callers actually did it (CredentialWall's `artFailed` set). The others drew
   * an empty dark rectangle, and CredentialDetailModal painted the words
   * "Simulated possible work environment" across it as a watermark and
   * announced "<name> artwork" to a screen reader — for artwork that is not
   * there. Only 66 of 128 certificates have art uploaded, so that is the
   * MAJORITY of credentials, and the same credential read as a proper badge on
   * the Achievements wall and an empty box on the chooser.
   *
   * Callers cannot detect this themselves: `onError` fires on every attempt,
   * including the ones that will be retried, so reacting to it would flash a
   * fallback over an image that is about to load.
   */
  onExhausted?: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards `onExhausted` against the several onError events one failure can
   *  produce. Reset per uri, alongside the attempt counter. */
  const exhausted = useRef(false);
  useEffect(() => {
    setAttempt(0); // a new uri starts fresh
    exhausted.current = false;
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
  }, [uri]);

  const retry = () => {
    // A retry is already queued — this error belongs to an attempt we have
    // already responded to.
    if (timer.current) return;
    if (attempt >= MAX_ATTEMPTS - 1) {
      if (!exhausted.current) {
        exhausted.current = true;
        onExhausted?.();
      }
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setAttempt((a) => a + 1);
    }, RETRY_MS[attempt] ?? 1600);
  };

  // Only the LAST attempt busts the cache — the first retry may simply have hit
  // a transient network error, and the cached copy is what we want.
  const bustedUri = useMemo(() => {
    if (!uri) return null;
    return attempt >= MAX_ATTEMPTS - 1 ? `${uri}${uri.includes('?') ? '&' : '?'}r=${attempt}` : uri;
  }, [uri, attempt]);

  if (EXPO_IMAGE_BG && bustedUri) {
    const ExpoBg = EXPO_IMAGE_BG;
    return (
      <ExpoBg
        source={{ uri: bustedUri }}
        style={style}
        imageStyle={imageStyle}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        recyclingKey={uri ?? undefined}
        onLoad={() => {
          if (__DEV__) console.log(`[cardart] ok  (expo-image) attempt=${attempt} ${tag(uri)}`);
          onLoad?.();
        }}
        onError={(e) => {
          if (__DEV__) console.log(`[cardart] ERR (expo-image) attempt=${attempt} ${tag(uri)} :: ${e?.error ?? 'unknown'}`);
          retry();
        }}
      >
        {children}
      </ExpoBg>
    );
  }

  const source = bustedUri ? { uri: bustedUri, cache: 'force-cache' as const } : undefined;
  return (
    <ImageBackground
      source={source}
      style={style}
      imageStyle={imageStyle}
      fadeDuration={0}
      onLoad={() => {
        if (__DEV__) console.log(`[cardart] ok  (rn) attempt=${attempt} ${tag(uri)}`);
        onLoad?.();
      }}
      onError={(e) => {
        if (__DEV__) console.log(`[cardart] ERR (rn) attempt=${attempt} ${tag(uri)} :: ${String(e?.nativeEvent?.error ?? 'unknown')}`);
        retry();
      }}
    >
      {children}
    </ImageBackground>
  );
}
