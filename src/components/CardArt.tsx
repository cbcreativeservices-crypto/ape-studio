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

  const retry = () => {
    if (attempt >= MAX_ATTEMPTS - 1 || timer.current) return;
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
