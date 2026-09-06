/**
 * JogSkia — the one Skia canvas per knob (blueprint 2026-09-05 §2.2).
 *
 * Two `<Image>` nodes: the static body raster and the translucent dish
 * raster. When a `spin` shared value is given (the overlay) the dish's x/y are
 * two `useDerivedValue` scalars — one sin, one cos, two adds on the UI thread
 * — and NOTHING else changes per frame: no paint, shader, path, filter or
 * noise is ever constructed after the rasters exist. The dial passes plain
 * numbers and, being memoised on its raster reference, never re-renders with
 * the Dashboard's live meters.
 *
 * Both canvases carry `pointerEvents="none"` as a prop AND as a style:
 * react-native-web ignores the prop on the Skia Canvas (overnight audit
 * 2026-09-04; fix precedent CourseSelectionScreen.tsx), and a canvas that
 * swallowed touches would kill the dial's press and the overlay's drags.
 */
import React, { memo } from 'react';
import type { ViewStyle } from 'react-native';
import { Canvas, Image as SkiaImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { DIMPLE_REST_DEG, dishOrigin, type JogGeom } from './jogGeometry';
import type { JogRasters } from './jogRaster';

const DEG = Math.PI / 180;

function canvasStyle(g: JogGeom): ViewStyle {
  return { position: 'absolute', left: -g.pad, top: -g.pad, width: g.Sc, height: g.Sc, pointerEvents: 'none' };
}

/** The dial: the dimple parked at 2 o'clock, plain-number props. */
function StaticStack({ rasters }: { rasters: JogRasters }) {
  const g = rasters.g;
  const o = dishOrigin(0, g);
  return (
    <Canvas pointerEvents="none" style={canvasStyle(g)}>
      <SkiaImage image={rasters.body} x={0} y={0} width={g.Sc} height={g.Sc} fit="fill" />
      <SkiaImage image={rasters.dish} x={o.x} y={o.y} width={g.dishSide} height={g.dishSide} fit="fill" />
    </Canvas>
  );
}

/** The overlay: the dish follows `spin` on the UI thread; its shading stays
 *  locked to the light because only its POSITION is driven. */
function LiveStack({ rasters, spin }: { rasters: JogRasters; spin: SharedValue<number> }) {
  const g = rasters.g;
  const half = g.dishSide / 2;
  const dishX = useDerivedValue(() => g.C.x + g.orbit * Math.cos((spin.value + DIMPLE_REST_DEG) * DEG) - half, [g, spin]);
  const dishY = useDerivedValue(() => g.C.y + g.orbit * Math.sin((spin.value + DIMPLE_REST_DEG) * DEG) - half, [g, spin]);
  return (
    <Canvas pointerEvents="none" style={canvasStyle(g)}>
      <SkiaImage image={rasters.body} x={0} y={0} width={g.Sc} height={g.Sc} fit="fill" />
      <SkiaImage image={rasters.dish} x={dishX} y={dishY} width={g.dishSide} height={g.dishSide} fit="fill" />
    </Canvas>
  );
}

/** Memoised on the (cached, reference-stable) raster pair and the shared
 *  value, so parent re-renders never reach the Skia reconciler. */
export const JogSkiaStack = memo(function JogSkiaStack({ rasters, spin }: { rasters: JogRasters; spin?: SharedValue<number> }) {
  return spin ? <LiveStack rasters={rasters} spin={spin} /> : <StaticStack rasters={rasters} />;
});
