/**
 * gpuWarmup — build the iPad/iPhone graphics chip's drawing instructions
 * (Metal shaders) BEFORE a lab needs them. [MD:D69]
 *
 * WHY (Sentry, 2026-11-18): every "App Hanging >= 2 s" report from iOS build 39
 * but one was Skia compiling a Metal shader on the MAIN thread the first time a
 * screen drew a circle / convex path / outlined shape (GrCompileMtlShaderLibrary,
 * GrMtlPipelineStateBuilder::finalize), mostly on older iPads (A10). iOS keeps
 * compiled shaders in an on-disk cache per app, so each person froze once.
 *
 * WHAT: a few seconds after the main menu settles, draw one of each basic shape
 * the labs use onto a small OFF-SCREEN GPU surface (Skia.Surface.MakeOffscreen).
 * That surface lives on the JS thread with its own Skia context, in the SAME
 * pixel format as the on-screen canvases (BGRA8, no MSAA), so iOS compiles the
 * same shaders off the main thread and the later on-screen draw is a cache hit.
 *
 * SAFETY: iOS only; once per app run; every step in try/catch; a missing
 * surface (null) does nothing. Draws nothing visible, stores nothing, sends
 * nothing. Loaded by a lazy `require` from the main menu so the app-start graph
 * does not grow.
 */
import { Platform } from 'react-native';

let done = false;

/** For tests: has the warm-up run (or been skipped) this app run? */
export const gpuWarmupRan = (): boolean => done;

/** Pure rule: only iOS, only once. */
export function shouldWarm(os: string, alreadyDone: boolean): boolean {
  return os === 'ios' && !alreadyDone;
}

export function warmGpuShaders(): void {
  if (!shouldWarm(Platform.OS, done)) return;
  done = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sk = require('@shopify/react-native-skia') as typeof import('@shopify/react-native-skia');
    const { Skia, PaintStyle, StrokeCap, StrokeJoin, TileMode, BlendMode } = sk;
    const surface = Skia.Surface.MakeOffscreen(256, 256);
    if (!surface) return;
    const c = surface.getCanvas();
    const col = (s: string) => Skia.Color(s);

    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    fill.setColor(col('#ffb400'));
    const stroke = Skia.Paint();
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);
    stroke.setStrokeWidth(2);
    stroke.setColor(col('#48c8ff'));
    const thick = stroke.copy();
    thick.setStrokeWidth(6);
    thick.setStrokeCap(StrokeCap.Round);
    thick.setStrokeJoin(StrokeJoin.Round);
    const faint = fill.copy();
    faint.setAlphaf(0.4);

    const step = (fn: () => void) => {
      try {
        fn();
      } catch {
        /* one shape failing must not stop the rest */
      }
    };

    // Circles and ovals: filled, outlined, thick, see-through (CircleOp family).
    step(() => c.drawCircle(40, 40, 20, fill));
    step(() => c.drawCircle(40, 40, 28, stroke));
    step(() => c.drawCircle(40, 40, 34, thick));
    step(() => c.drawCircle(90, 40, 12, faint));
    step(() => c.drawOval(Skia.XYWHRect(120, 20, 60, 30), fill));
    // Rectangles and rounded rectangles.
    step(() => c.drawRect(Skia.XYWHRect(10, 90, 50, 30), fill));
    step(() => c.drawRect(Skia.XYWHRect(10, 90, 50, 30), stroke));
    step(() => c.drawRRect(Skia.RRectXY(Skia.XYWHRect(70, 90, 60, 30), 8, 8), fill));
    step(() => c.drawRRect(Skia.RRectXY(Skia.XYWHRect(70, 90, 60, 30), 8, 8), thick));
    // Convex path (AAConvexPathOp) and a curved, concave one (flattening / tessellated).
    step(() => {
      const tri = Skia.Path.Make();
      tri.moveTo(150, 90);
      tri.lineTo(200, 90);
      tri.lineTo(175, 130);
      tri.close();
      c.drawPath(tri, fill);
      c.drawPath(tri, stroke);
    });
    step(() => {
      const wave = Skia.Path.Make();
      wave.moveTo(10, 180);
      for (let x = 10; x <= 246; x += 6) wave.lineTo(x, 180 + Math.sin(x / 12) * 18);
      c.drawPath(wave, stroke);
      c.drawPath(wave, thick);
      const blob = Skia.Path.Make();
      blob.moveTo(200, 150);
      blob.cubicTo(250, 140, 250, 210, 210, 200);
      blob.quadTo(170, 230, 180, 180);
      blob.lineTo(215, 175);
      blob.close();
      c.drawPath(blob, fill);
    });
    // Lines.
    step(() => c.drawLine(10, 240, 240, 240, stroke));
    step(() => c.drawLine(10, 248, 240, 248, thick));
    // Colour fades: linear, radial, sweep.
    step(() => {
      const p = Skia.Paint();
      p.setAntiAlias(true);
      p.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: 256, y: 0 }, [col('#000000'), col('#ffb400')], null, TileMode.Clamp));
      c.drawRect(Skia.XYWHRect(0, 200, 256, 20), p);
      p.setShader(Skia.Shader.MakeRadialGradient({ x: 128, y: 128 }, 60, [col('#ffffff'), col('#00000000')], null, TileMode.Clamp));
      c.drawCircle(128, 128, 60, p);
      p.setShader(Skia.Shader.MakeSweepGradient(128, 128, [col('#ff5a48'), col('#48c8ff'), col('#ff5a48')], null, TileMode.Clamp));
      c.drawCircle(128, 128, 30, p);
    });
    // A blend mode the meters use for glow.
    step(() => {
      const p = fill.copy();
      p.setBlendMode(BlendMode.Plus);
      c.drawCircle(60, 150, 20, p);
    });
    // Text (glyph atlas shaders).
    step(() => {
      const font = Skia.Font(undefined, 14);
      c.drawText('Pro Audio 0123', 10, 70, fill, font);
    });

    surface.flush();
    // Release the surface's memory where the library allows it.
    step(() => (surface as unknown as { dispose?: () => void }).dispose?.());
  } catch {
    /* the warm-up is an optimisation; never let it hurt the app */
  }
}

/** Start the warm-up a few seconds after the caller mounts, when the JS thread is idle. */
export function scheduleGpuWarmup(delayMs = 3000): () => void {
  if (!shouldWarm(Platform.OS, done)) return () => {};
  let soon: { cancel: () => void } | null = null;
  const t = setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runSoon } = require('./afterInteractions') as typeof import('./afterInteractions');
    soon = runSoon(warmGpuShaders, { idleTimeoutMs: 4000 });
  }, delayMs);
  return () => {
    clearTimeout(t);
    soon?.cancel();
  };
}
