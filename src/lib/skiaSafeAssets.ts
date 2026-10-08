/**
 * Skia image / font loading that can FAIL QUIETLY.
 *
 * ⛔ Sentry APE-STUDIO-E (web, 2026-09-19): "TypeError: Failed to fetch" from
 * Skia's `loadData` → `Skia.Data.fromURI` inside an effect. react-native-skia's
 * own `useImage` / `useFont` / `useTypeface` / `useData` call
 * `loadData(...).then(setData)` with NO rejection handler, so a fetch that
 * fails (offline, a dev-server restart, a blocked asset URL) is an unhandled
 * promise rejection — an error report and, on native, a red box in dev —
 * instead of simply "no image yet".
 *
 * These hooks load through the same `loadData`, but a failure is caught and
 * reads as `null` — exactly what the screens already render while loading.
 * Use them instead of Skia's hooks (a ratchet in
 * test/sentryRootCauses_20261008.test.ts bans the unguarded ones in src/).
 */
import { useEffect, useMemo, useState } from 'react';
import { loadData, Skia, type DataSourceParam, type SkData, type SkFont, type SkImage, type SkTypeface } from '@shopify/react-native-skia';

function useSafeSkiaData<T>(source: DataSourceParam, factory: (d: SkData) => T | null): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    loadData(source, factory)
      .then((v) => {
        if (live) setValue(v);
      })
      .catch(() => {
        if (live) setValue(null); // failed to fetch / decode → "not loaded", never a throw
      });
    return () => {
      live = false;
    };
    // `factory` is a stable module-level function at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
  return value;
}

const imageFactory = (d: SkData) => Skia.Image.MakeImageFromEncoded(d);
const typefaceFactory = (d: SkData) => Skia.Typeface.MakeFreeTypeFaceFromData(d);

/** Skia's `useImage`, minus the unhandled rejection. */
export function useSafeSkiaImage(source: DataSourceParam): SkImage | null {
  return useSafeSkiaData(source, imageFactory);
}

/** Skia's `useFont`, minus the unhandled rejection. */
export function useSafeSkiaFont(source: DataSourceParam, size = 14): SkFont | null {
  const typeface = useSafeSkiaData<SkTypeface>(source, typefaceFactory);
  return useMemo(() => (typeface ? Skia.Font(typeface, size) : null), [typeface, size]);
}
