/**
 * WEB ONLY — keep Skia drawing when the browser cannot give it WebGL.
 *
 * ⛔ Sentry APE-STUDIO-G (11 events, web preview, 2026-09-20): "failed to
 * create webgl context: err 0". On web, react-native-skia draws every <Canvas>
 * through `CanvasKit.MakeWebGLCanvasSurface`, and CanvasKit THROWS (a bare
 * string) when the browser will not hand out a WebGL context — no GPU, WebGL
 * switched off, a headless or hidden preview pane, or the browser's cap on
 * live contexts (~16) reached on a screen with several canvases. The throw
 * lands in the canvas's onLayout, uncaught, so the screen loses the drawing
 * and Sentry gets an error. Home's featured-card shimmer mounts a fresh Canvas
 * every pass, so it hit the cap fastest.
 *
 * The fix: wrap `MakeWebGLCanvasSurface` once, right after CanvasKit loads
 * (index.ts). A WebGL failure falls back to CanvasKit's own CPU raster surface
 * (`MakeSWCanvasSurface`) — the same drawing, just not GPU-accelerated. Only
 * if even a 2-D canvas is impossible does it return null (Skia then reports
 * its own "Could not create surface"; no browser that runs the app gets there).
 *
 * Pure (takes the CanvasKit object), so it is unit-tested with a fake.
 */
type SurfaceFactory = (canvas: unknown, ...rest: unknown[]) => unknown;
type CanvasKitLike = {
  MakeWebGLCanvasSurface?: SurfaceFactory;
  MakeSWCanvasSurface?: SurfaceFactory;
  __apeWebGlGuard?: boolean;
};

export function installSkiaWebFallback(ck: unknown, onFallback?: (why: unknown) => void): boolean {
  const kit = ck as CanvasKitLike | null | undefined;
  if (!kit || typeof kit.MakeWebGLCanvasSurface !== 'function' || kit.__apeWebGlGuard) return false;
  const gl = kit.MakeWebGLCanvasSurface.bind(kit);
  const sw = typeof kit.MakeSWCanvasSurface === 'function' ? kit.MakeSWCanvasSurface.bind(kit) : null;
  kit.MakeWebGLCanvasSurface = (canvas: unknown, ...rest: unknown[]) => {
    try {
      const s = gl(canvas, ...rest);
      if (s) return s;
    } catch (e) {
      onFallback?.(e);
    }
    if (!sw) return null;
    try {
      return sw(canvas) ?? null;
    } catch {
      return null;
    }
  };
  kit.__apeWebGlGuard = true;
  return true;
}
