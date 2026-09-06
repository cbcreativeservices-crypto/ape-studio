/**
 * jogRaster — the two cached Skia rasters behind the Dashboard jog wheel
 * (blueprint 2026-09-05 §3–§5).
 *
 *  • BODY — the static puck: AO fringe, contact shadow, collar, cylinder wall,
 *    matte face, sandblast grain, rounded-edge fillet and the lit rim hairline.
 *    Nothing in it ever moves.
 *  • DISH — the finger dimple as a TRANSLUCENT shading raster (only black and
 *    white at partial alpha): wherever it lands on its orbit it darkens and
 *    lightens the local face tone and grain underneath, so the floor equals
 *    the surrounding face, the cast crescent kills the sparkle and the pool
 *    keeps it. Its shading is authored once in WORLD orientation (light from
 *    the upper-left) and never rotates — a dish is a circle, so moving it is
 *    exactly what rotating the knob looks like.
 *
 * Both are built ONCE per (size, dpr) on a CPU surface (`Skia.Surface.Make`,
 * synchronous, identical on web and native) and reused; the only per-frame
 * work the knob ever does is two image blits. IMPORTANT: nothing here may be
 * called when Skia is unavailable (the `SKIA_READY` guard lives in
 * JogWheel.tsx) — the `Skia` singleton binds to CanvasKit at module
 * evaluation on web, and none of this module's top level touches it.
 */
import { PixelRatio } from 'react-native';
import {
  AlphaType,
  BlendMode,
  BlurStyle,
  ClipOp,
  ColorType,
  FilterMode,
  MipmapMode,
  PaintStyle,
  PathOp,
  Skia,
  TileMode,
  type SkColor,
  type SkImage,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia';
import { AWAY, LIGHT, geom, grainAlpha, grainCell, type JogGeom } from './jogGeometry';

export type JogRasters = {
  body: SkImage;
  dish: SkImage;
  g: JogGeom;
  dpr: number;
};

/** Raster scale — device pixels per logical pixel, capped so a 3.5× phone
 *  does not pay for a 1.2 k² body raster it cannot resolve anyway. */
export function jogDpr(): number {
  return Math.min(PixelRatio.get(), 3);
}

/* ── colours (Float32Array RGBA 0..1 — no CSS parsing on either platform) ── */

/** Black at alpha a. */
const k = (a: number): SkColor => Float32Array.of(0, 0, 0, a);
/** White at alpha a. */
const w = (a: number): SkColor => Float32Array.of(1, 1, 1, a);
/** Opaque grey from an 8-bit triple. */
const rgb = (r: number, g: number, b: number): SkColor => Float32Array.of(r / 255, g / 255, b / 255, 1);

const paint = (): SkPaint => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  return p;
};
const blur = (sigma: number) => Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true);
const circle = (cx: number, cy: number, r: number): SkPath => {
  const p = Skia.Path.Make();
  p.addCircle(cx, cy, r);
  return p;
};
const square = (cx: number, cy: number, half: number): SkPath => {
  const p = Skia.Path.Make();
  p.addRect(Skia.XYWHRect(cx - half, cy - half, 2 * half, 2 * half));
  return p;
};

/* ── grain tile ─────────────────────────────────────────────────────────── */

const GRAIN_SIDE = 512;
const GRAIN_SEED = 0x5a17b1a5;

/** Deterministic 32-bit PRNG — the same sandblast on every device. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile: SkImage | null | undefined;

/**
 * The sandblast texture: a 512² RGBA tile, transparent by default, with 12 %
 * of its pixels a faint light point (most faint, a few reaching ~0.62) and 5 %
 * a fainter pit. Drawn with OVERLAY blend it lifts lit ground more than dark
 * ground, so the sparkle follows the light for free and vanishes inside the
 * dish crescent. Built once per app run; the ONLY `Skia.Image.MakeImage` call
 * site for the grain.
 */
export function getGrainTile(): SkImage | null {
  if (grainTile !== undefined) return grainTile;
  const n = GRAIN_SIDE * GRAIN_SIDE;
  const buf = new Uint8Array(n * 4); // zero-filled = transparent
  const rng = mulberry32(GRAIN_SEED);
  for (let i = 0; i < n; i++) {
    const u = rng();
    if (u < 0.12) {
      const v = rng();
      const o = i * 4;
      buf[o] = 236;
      buf[o + 1] = 236;
      buf[o + 2] = 242;
      buf[o + 3] = Math.round(255 * (0.12 + 0.5 * v * v * v));
    } else if (u < 0.17) {
      const o = i * 4;
      buf[o + 3] = Math.round(255 * 0.1); // rgb 0 = a faint pit
    }
  }
  grainTile = Skia.Image.MakeImage(
    { width: GRAIN_SIDE, height: GRAIN_SIDE, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    Skia.Data.fromBytes(buf),
    GRAIN_SIDE * 4,
  );
  return grainTile;
}

/* ── the body raster (§3, layers A0–A8) ─────────────────────────────────── */

function buildBodyImage(g: JogGeom, dpr: number): SkImage | null {
  const px = Math.round(g.Sc * dpr);
  const surf = Skia.Surface.Make(px, px);
  if (!surf) return null;
  const cv = surf.getCanvas();
  cv.scale(dpr, dpr); // everything below is in logical px; blur sigmas respect the CTM
  const { R, C, Cb, t } = g;

  // A0 — AO fringe: 360° occlusion seating the puck on the panel.
  {
    const p = paint();
    p.setColor(k(0.4));
    p.setMaskFilter(blur(g.aoSigma));
    cv.drawCircle(Cb.x, Cb.y, g.aoR, p);
  }
  // A1 — contact shadow, offset AWAY from the light (down-right).
  {
    const p = paint();
    p.setColor(k(0.6));
    p.setMaskFilter(blur(g.shadowSigma));
    cv.drawCircle(g.shadowC.x, g.shadowC.y, R, p);
  }
  // A2 — collar ring: the tight near-black gap where the base meets the panel.
  {
    const p = paint();
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(g.collarW);
    p.setColor(k(0.9));
    p.setMaskFilter(blur(g.collarSigma));
    cv.drawCircle(Cb.x, Cb.y, g.collarR, p);
  }
  // A3 — cylinder wall: Lambert around the drum. Sweep 0° = +x, clockwise on
  // screen; darkest at 60° (facing straight away from the light), lit at 180°.
  // The 180–360° half is hidden under the face.
  {
    const p = paint();
    p.setShader(
      Skia.Shader.MakeSweepGradient(
        Cb.x,
        Cb.y,
        [rgb(0x11, 0x11, 0x14), rgb(0x08, 0x08, 0x0a), rgb(0x0b, 0x0b, 0x0d), rgb(0x1a, 0x1a, 0x1d), rgb(0x1a, 0x1a, 0x1d), rgb(0x11, 0x11, 0x14)],
        [0, 0.167, 0.333, 0.5, 0.75, 1],
        TileMode.Clamp,
      ),
    );
    cv.drawCircle(Cb.x, Cb.y, R, p);
  }
  // A4 — wall top-to-base falloff: a hair lighter just under the rounded edge,
  // darker toward the base (clipped to the wall). Two gradients, not one:
  // Skia interpolates gradient colours in UNPREMUL space, so a white stop
  // fading into a black stop passes through mid-grey at half alpha — a haze
  // that lit the wall base to panel brightness. Every gradient in this file
  // keeps white next to white and black next to black.
  {
    cv.save();
    cv.clipPath(circle(Cb.x, Cb.y, R), ClipOp.Intersect, true);
    const lift = paint();
    lift.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(C.x, C.y), R + t, [w(0.05), w(0.05), w(0)], [0, 0.917, 0.95], TileMode.Clamp));
    cv.drawCircle(C.x, C.y, R + t, lift);
    const base = paint();
    base.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(C.x, C.y), R + t, [k(0), k(0), k(0.45)], [0, 0.94, 1], TileMode.Clamp));
    cv.drawCircle(C.x, C.y, R + t, base);
    cv.restore();
  }
  // A5 — face diffuse: ONE broad off-centre gradient (matte, no hot spot),
  // its crest below the panel's #1f2021 so the knob stays the darkest raised
  // object in the hero. Dithered — it is the banding killer for a 16-level
  // ramp over a 280 px face.
  {
    const p = paint();
    p.setDither(true);
    p.setShader(
      Skia.Shader.MakeRadialGradient(
        Skia.Point(C.x + LIGHT.x * 0.5 * R, C.y + LIGHT.y * 0.5 * R),
        1.55 * R,
        [rgb(0x1c, 0x1c, 0x1f), rgb(0x17, 0x17, 0x19), rgb(0x11, 0x11, 0x13), rgb(0x0c, 0x0c, 0x0e)],
        [0, 0.35, 0.72, 1],
        TileMode.Clamp,
      ),
    );
    cv.drawCircle(C.x, C.y, R, p);
  }
  // A6 — sandblast grain, overlay-blended (§5). One texel = `cell` device px.
  {
    const tile = getGrainTile();
    if (tile) {
      const cell = grainCell(g.S, dpr);
      const alpha = grainAlpha(g.S, dpr);
      const p = paint();
      p.setShader(
        tile.makeShaderOptions(TileMode.Repeat, TileMode.Repeat, FilterMode.Nearest, MipmapMode.None, Skia.Matrix().scale(cell / dpr, cell / dpr)),
      );
      p.setBlendMode(BlendMode.Overlay);
      p.setAlphaf(alpha);
      cv.drawCircle(C.x, C.y, 0.99 * R, p);
      // A6b — the same grain, half strength, on the visible wall lune.
      cv.save();
      cv.clipPath(circle(Cb.x, Cb.y, R), ClipOp.Intersect, true);
      cv.clipPath(circle(C.x, C.y, R), ClipOp.Difference, true);
      p.setAlphaf(0.5 * alpha);
      cv.drawCircle(Cb.x, Cb.y, R, p);
      cv.restore();
    }
  }
  // A7 — rounded-edge fillet shade: darker than the face on the shadow side
  // (60°), neutral at the tangents, faintly lifted toward the light (240°).
  // The alpha-0 double stops at the tangents keep the black→white swaps
  // fully transparent (see A4).
  {
    const p = paint();
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(g.filletW);
    p.setShader(
      Skia.Shader.MakeSweepGradient(
        C.x,
        C.y,
        [k(0.3), k(0.45), k(0), w(0), w(0.03), w(0), k(0), k(0.3)],
        [0, 0.167, 0.417, 0.418, 0.667, 0.917, 0.918, 1],
        TileMode.Clamp,
      ),
    );
    p.setMaskFilter(blur(g.filletSigma));
    cv.drawCircle(C.x, C.y, g.filletR, p);
  }
  // A8 — lit rim hairline: a crisp thin line over the ~160° lit arc only,
  // absent on the lower-right. White 0.16 (HUB_LIGHT rung 3); HARD CAP 0.22 —
  // above it the edge reads as gloss (owner 2026-08-05).
  {
    const p = paint();
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(g.rimW);
    p.setShader(Skia.Shader.MakeSweepGradient(C.x, C.y, [w(0), w(0), w(0.16), w(0), w(0)], [0, 0.417, 0.667, 0.917, 1], TileMode.Clamp));
    cv.drawCircle(C.x, C.y, g.rimR, p);
  }

  surf.flush();
  const img = surf.makeImageSnapshot();
  // The snapshot owns its pixels (copy-on-write); the surface can go.
  surf.dispose();
  return img;
}

/* ── the dish raster (§4, layers D0–D4) — translucent, world-lit ────────── */

function buildDishImage(g: JogGeom, dpr: number): SkImage | null {
  const { dR, dishSide } = g;
  const px = Math.round(dishSide * dpr);
  const surf = Skia.Surface.Make(px, px);
  if (!surf) return null;
  const cv = surf.getCanvas();
  cv.scale(dpr, dpr);
  cv.translate(dishSide / 2, dishSide / 2); // local origin = dish centre

  // D0 — wall darkening + the soft face-to-dish fillet: floor = face tone,
  // rim ≈ 0.72×, fading over the last 5 % so there is no hard circle anywhere.
  {
    const p = paint();
    p.setShader(
      Skia.Shader.MakeRadialGradient(Skia.Point(0, 0), 1.05 * dR, [k(0), k(0.03), k(0.14), k(0.16), k(0)], [0, 0.6, 0.86, 0.95, 1], TileMode.Clamp),
    );
    cv.drawCircle(0, 0, 1.05 * dR, p);
  }
  cv.save();
  cv.clipPath(circle(0, 0, 0.985 * dR), ClipOp.Intersect, true);
  // D1 — cast crescent: the rim's own shadow hugging the UPPER-LEFT inner wall
  // (the wall nearest the light faces away from it). A big square minus a
  // circle shifted AWAY from the light, blurred, clipped to the dish.
  {
    const cres = Skia.Path.MakeFromOp(square(0, 0, 1.5 * dR), circle(AWAY.x * 0.22 * dR, AWAY.y * 0.22 * dR, dR), PathOp.Difference);
    if (cres) {
      const p = paint();
      p.setColor(k(0.75));
      p.setMaskFilter(blur(g.crescentSigma));
      cv.drawPath(cres, p);
    }
  }
  // D2 — Lambert term: dark toward the lit-side wall, a lit pool on the far
  // (lower-right) wall. The 0.48/0.52 gap keeps the black→white swap fully
  // transparent.
  {
    const p = paint();
    p.setShader(
      Skia.Shader.MakeLinearGradient(
        Skia.Point(LIGHT.x * dR, LIGHT.y * dR),
        Skia.Point(-LIGHT.x * dR, -LIGHT.y * dR),
        [k(0.3), k(0), w(0), w(0.08)],
        [0, 0.48, 0.52, 1],
        TileMode.Clamp,
      ),
    );
    cv.drawCircle(0, 0, 0.985 * dR, p);
  }
  cv.restore();
  // D3 — bounce spot: light off the wall onto the floor, near its centre. Only
  // when the dish is large enough for it to read (overlay only).
  if (g.bounceSpot) {
    const p = paint();
    const cx = 0.06 * dR;
    const cy = 0.1 * dR;
    p.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(cx, cy), 0.42 * dR, [w(0.045), w(0.015), w(0)], [0, 0.55, 1], TileMode.Clamp));
    cv.drawCircle(cx, cy, 0.42 * dR, p);
  }
  // D4 — far lip: the thin light lip on the LOWER-RIGHT rim where the face's
  // rounded edge into the dish catches the key. Peaks at 60° (= AWAY); the
  // near/upper rim stays dark, defined only by D0/D1.
  {
    const arc = Skia.Path.Make();
    arc.addArc(Skia.XYWHRect(-1.03 * dR, -1.03 * dR, 2.06 * dR, 2.06 * dR), -10, 140);
    const p = paint();
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(g.lipW);
    // `undefined`, NOT `null`, for the optional localMatrix: the native JSI
    // binding rejects null ("Value is null, expected an Object") while CanvasKit
    // on the web preview accepted it — this line crashed both phones' Dashboard
    // (owner screenshots, 2026-09-05 17:48) after passing on web.
    p.setShader(Skia.Shader.MakeSweepGradient(0, 0, [w(0), w(0.13), w(0)], [0, 0.5, 1], TileMode.Clamp, undefined, 0, -10, 130));
    p.setMaskFilter(blur(g.lipSigma));
    cv.drawPath(arc, p);
  }

  surf.flush();
  const img = surf.makeImageSnapshot();
  surf.dispose();
  return img;
}

/* ── cache ──────────────────────────────────────────────────────────────── */

const MAX_CACHE = 4;
const cache = new Map<string, JogRasters>();
/** Sizes whose raster build threw or returned null — served the SVG wheel. */
const failed = new Set<string>();

/**
 * The rasters for a box of side S, built synchronously on first use and
 * cached per (round(S), dpr). Returns null only if Skia cannot make a CPU
 * surface — the caller then draws the SVG fallback instead of a blank.
 */
export function getJogRasters(S: number): JogRasters | null {
  const dpr = jogDpr();
  const key = `${Math.round(S)}@${dpr}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (failed.has(key)) return null;
  const g = geom(S);
  // NEVER let a raster failure reach render (owner screenshots 2026-09-05: a
  // JSI argument mismatch between CanvasKit-on-web and the native binding
  // crashed both phones' Dashboard with "Value is null, expected an Object").
  // A failure here degrades to the SVG wheel and, in dev, logs the stack so the
  // offending jogRaster.ts line is named in Metro rather than guessed at.
  let body: SkImage | null = null;
  let dish: SkImage | null = null;
  try {
    body = buildBodyImage(g, dpr);
    if (body) dish = buildDishImage(g, dpr);
  } catch (e) {
    if (__DEV__) console.log(`[jog] raster build failed (S=${S}, dpr=${dpr}): ${(e as Error)?.stack ?? String(e)}`);
    failed.add(key); // don't retry every render — one log, then the SVG wheel
    return null;
  }
  if (!body || !dish) {
    if (__DEV__) console.log(`[jog] raster returned null (body=${!!body}, dish=${!!dish}) for S=${S}`);
    failed.add(key);
    return null;
  }
  const entry: JogRasters = { body, dish, g, dpr };
  if (cache.size >= MAX_CACHE) {
    // Evict the oldest entry. It is NOT disposed: a canvas mid-rotation may
    // still be holding it for one more frame, and a deleted image is a crash
    // on web; the JS GC releases it once nothing references it.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, entry);
  return entry;
}

/** Build (and cache) the rasters for S ahead of first use — the overlay calls
 *  this after the Dashboard's first paint so the first open never waits. */
export function prewarmJogRasters(S: number): void {
  try {
    getJogRasters(S);
  } catch {
    // A failed pre-warm is not an error: getJogRasters is retried on demand.
  }
}
