/**
 * cardArtPrefetch — warm the Home carousel's card art in the SAME cache the
 * card draws from (perf hunt 2026-10-03).
 *
 * `CardArt` draws through expo-image (memory + disk cache, keyed on the URL)
 * whenever its native module is in the binary — every current build. Home's
 * warm-up still called React Native's `Image.prefetch`, which fills RN's OWN
 * image cache: a cache expo-image never reads. So the warm-up paid for every
 * card (≈3.2 MB) and the visible cards then downloaded it all AGAIN through
 * expo-image — twice the bytes on a cold launch, and the cards the warm-up was
 * for still waited on the network. With the course-cards bucket's
 * `Cache-Control: no-cache`, RN's copy was not even kept across launches.
 *
 * Now the warm-up goes through expo-image's `prefetch` into 'memory-disk', so
 * a card's first paint is a cache hit, and on the next launch a disk hit with
 * no network at all. A dev client built before expo-image keeps the old RN
 * path (CardArt draws through RN there, so that is the cache it reads).
 */
import { Image as RNImage } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type ExpoImageStatics = { prefetch: (urls: string | string[], cachePolicy?: 'memory-disk' | 'disk' | 'memory') => Promise<boolean> };

/** expo-image's Image class when its native module is present (same gate as
 *  CardArt), else null. */
const EXPO_IMAGE: ExpoImageStatics | null = (() => {
  try {
    if (!requireOptionalNativeModule('ExpoImage')) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('expo-image') as { Image?: ExpoImageStatics };
    return lib.Image && typeof lib.Image.prefetch === 'function' ? lib.Image : null;
  } catch {
    return null;
  }
})();

/** Warm one card image into the cache CardArt will read it from. Never throws. */
export function prefetchCardArt(uri: string): void {
  try {
    const p = EXPO_IMAGE ? EXPO_IMAGE.prefetch(uri, 'memory-disk') : RNImage.prefetch(uri);
    void Promise.resolve(p).catch(() => {});
  } catch {
    /* warming is best-effort */
  }
}
