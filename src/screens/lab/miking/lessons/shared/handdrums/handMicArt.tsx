/**
 * HAND-DRUM FAMILY — the miniature clip-on condenser, drawn (charter §6: a
 * real object, upper-left light, rim highlight). Front at the origin, the
 * body along local +y, in mm — the same contract as the shared mic drawings
 * (features/lab/micDrawings.tsx), so the scene's MicGlyph transform applies.
 * Generic: no brand's likeness. The gooseneck and its clamp are drawn by the
 * scene from the mount's `neck` capsule (PlacementScene NeckPath).
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

type SkPath = ReturnType<typeof Skia.Path.Make>;

function build(r: number, len: number) {
  const cap = len * 0.34;
  const grille: SkPath = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, cap), r * 0.55, r * 0.55));
  const mesh: SkPath = Skia.Path.Make();
  const step = Math.max(1.1, r * 0.28);
  for (let y = step * 0.6; y < cap; y += step) {
    mesh.moveTo(-r, y);
    mesh.lineTo(r, y);
  }
  for (let x = -r + step * 0.6; x < r; x += step) {
    mesh.moveTo(x, 0);
    mesh.lineTo(x, cap);
  }
  const body: SkPath = Skia.Path.Make();
  body.moveTo(-r * 0.96, cap);
  body.lineTo(r * 0.96, cap);
  body.lineTo(r * 0.72, len * 0.9);
  body.quadTo(r * 0.6, len, 0, len);
  body.quadTo(-r * 0.6, len, -r * 0.72, len * 0.9);
  body.close();
  const ring: SkPath = Skia.Path.Make();
  ring.addRect(Skia.XYWHRect(-r, cap - len * 0.02, r * 2, len * 0.06));
  const shadow: SkPath = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  return { grille, mesh, body, ring, shadow };
}

/** A miniature clip-on condenser: radius `r`, length `len`, front at the origin. */
export function ClipMiniMic({ r, len }: { r: number; len: number }) {
  const p = useMemo(() => build(r, len), [r, len]);
  const hair = Math.max(0.3, r * 0.06);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.15 }, { translateY: r * 0.12 }]}>
        <Path path={p.shadow} color="#000" opacity={0.5}>
          <BlurMask blur={r * 0.25} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#5b606b', '#2a2c33', '#15161a', '#0b0b0e']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.grille}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#8d929d', '#3d414a', '#16171b']} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, r * 0.07)} color="#0a0b0d" opacity={0.75} />
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#f4f6fa', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color="#e3e7ef" opacity={0.35} />
    </Group>
  );
}
