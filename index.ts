import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

/**
 * WEB ONLY — load Skia's CanvasKit BEFORE the app module graph is evaluated
 * (2026-08-25).
 *
 * Skia draws through CanvasKit (a WASM module). On native it is linked into the
 * build; on web it must be fetched at runtime, and until it resolves every
 * <Canvas> renders NOTHING. That is why `SKIA_READY` guards exist across the
 * tools (WaveformScreen &c.) and why Skia labs were invisible in the :8090 web
 * preview — you could not browser-iterate any Skia art.
 *
 * ── WHY App IS IMPORTED DYNAMICALLY ────────────────────────────────────────
 * The `Skia` singleton binds to CanvasKit at MODULE-EVALUATION time. A static
 * `import App from './App'` is hoisted above this code, so the whole screen
 * graph — and with it Skia — would initialise before CanvasKit existed, and
 * every draw call would then throw `undefined is not an object (Skia.Path)`.
 * Importing App only after the load settles is what makes the ordering correct.
 *
 * `canvaskit.wasm` is copied to `public/` (Expo Metro serves the root `public/`
 * directory at the web root — SDK 57 "customizing Metro"), so this is a local
 * fetch with no CDN dependency. On failure the app still boots and the existing
 * SKIA_READY SVG fallbacks take over exactly as before.
 *
 * Native is untouched: `require` + `registerRootComponent` run synchronously as
 * they always have.
 */
if (Platform.OS === 'web') {
  void (async () => {
    try {
      const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
      await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
    } catch (e) {
      // Non-fatal: the app boots without Skia and falls back to SVG.
      console.warn('[skia-web] CanvasKit failed to load; Skia views fall back to SVG.', e);
    }
    const { default: App } = await import('./App');
    registerRootComponent(App);
  })();
} else {
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  registerRootComponent(require('./App').default);
}
