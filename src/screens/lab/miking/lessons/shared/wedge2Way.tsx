/**
 * A 2-way floor monitor wedge (12" + 1") seen FROM ABOVE, at true size in
 * millimetres — 600 mm wide × 420 mm deep (owner 2026-10-10: a stage wedge,
 * not a guitar-amp box). Every Miking plan draws its wedges from these
 * parts so they read alike.
 *
 * Local frame: centred on the wedge, FRONT toward +x (callers rotate +x onto
 * the direction the wedge faces), width along y. The baffle slopes up toward
 * the performer at ~45°, so from above it fills the front ~70 % of the
 * footprint, foreshortened by the slope: the 12" woofer reads as an ellipse,
 * the HF horn's rectangular mouth sits above it on the high side, all behind
 * a perforated grille with its edge frame. The flat top panel is the rear
 * strip, with the recessed input panel and its connector on the rear edge.
 * Handle recesses sit in both side panels. Nothing here is a keep-out or
 * collision model — those stay with the lesson data.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, RadialGradient, Skia, vec, type SkPath } from '@shopify/react-native-skia';

export const WEDGE_W_MM = 600;
export const WEDGE_D_MM = 420;

function rr(x0: number, y0: number, x1: number, y1: number, r: number) {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0), r, r));
  return p;
}

export type WedgeParts = {
  cab: SkPath;
  top: SkPath;
  baffle: SkPath;
  holes: SkPath;
  woofer: SkPath;
  cap: SkPath;
  horn: SkPath;
  throat: SkPath;
  handles: SkPath;
  panel: SkPath;
  jack: SkPath;
};

/** The wedge's parts, `W` wide × `D` deep (default true size), front +x. */
export function wedgeParts(W = WEDGE_W_MM, D = WEDGE_D_MM): WedgeParts {
  const k = W / WEDGE_W_MM;
  const HW = W / 2;
  const HD = D / 2;
  const topX = -HD + D * 0.3; // top panel (rear) | baffle (front)
  const cab = rr(-HD, -HW, HD, HW, 18 * k);
  const top = rr(-HD + 8 * k, -HW + 8 * k, topX, HW - 8 * k, 12 * k);
  const baffle = rr(topX + 8 * k, -HW + 14 * k, HD - 10 * k, HW - 14 * k, 14 * k);
  const holes = Skia.Path.Make();
  for (let x = topX + 22 * k; x < HD - 16 * k; x += 20 * k) for (let y = -HW + 28 * k; y < HW - 20 * k; y += 20 * k) holes.addCircle(x, y, 4.2 * k);
  // 12" cone, foreshortened along the slope (×0.7), on the low (front) side
  const wx1 = HD - 18 * k;
  const wx0 = wx1 - (D * 216) / WEDGE_D_MM;
  const woofer = Skia.Path.Make();
  woofer.addOval(Skia.XYWHRect(wx0, -152 * k, wx1 - wx0, 304 * k));
  const cap = Skia.Path.Make();
  cap.addOval(Skia.XYWHRect((wx0 + wx1) / 2 - 32 * k, -46 * k, 64 * k, 92 * k));
  // the HF horn's rectangular mouth, above the woofer on the high side
  const horn = rr(topX + 10 * k, -115 * k, Math.min(topX + 52 * k, wx0 - 6 * k), 115 * k, 6 * k);
  const throat = Skia.Path.Make();
  throat.moveTo(topX + 12 * k, -108 * k);
  throat.lineTo(topX + 34 * k, -18 * k);
  throat.moveTo(topX + 12 * k, 108 * k);
  throat.lineTo(topX + 34 * k, 18 * k);
  // handle recesses in both side panels
  const handles = Skia.Path.Make();
  handles.addRRect(Skia.RRectXY(Skia.XYWHRect(-60 * k, -HW - 2 * k, 120 * k, 22 * k), 9 * k, 9 * k));
  handles.addRRect(Skia.RRectXY(Skia.XYWHRect(-60 * k, HW - 20 * k, 120 * k, 22 * k), 9 * k, 9 * k));
  // the recessed rear input panel and its connector
  const panel = rr(-HD + 6 * k, -55 * k, -HD + 50 * k, 55 * k, 6 * k);
  const jack = Skia.Path.Make();
  jack.addCircle(-HD + 28 * k, 0, 15 * k);
  return { cab, top, baffle, holes, woofer, cap, horn, throat, handles, panel, jack };
}

/** The wedge glyph in its local frame (front +x). */
export function Wedge2WayTop({ shadow = false, highlight, highlightW = 22 }: { shadow?: boolean; highlight?: string; highlightW?: number }) {
  const g = useMemo(() => wedgeParts(), []);
  const HW = WEDGE_W_MM / 2;
  const HD = WEDGE_D_MM / 2;
  const topX = -HD + WEDGE_D_MM * 0.3;
  return (
    <Group>
      {shadow ? (
        <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
          <Path path={g.cab} color="#000" opacity={0.6}>
            <BlurMask blur={22} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Path path={g.cab}>
        <LinearGradient start={vec(-HD, -HW)} end={vec(HD, HW)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      {/* the flat top panel at the back catches the light */}
      <Path path={g.top} color="#33363e" />
      {/* the sloped baffle: perforated grille with its edge frame */}
      <Path path={g.baffle} color="#0f1013" />
      <Path path={g.holes} color="#3f434b" opacity={0.85} />
      <Path path={g.woofer} color="#0a0b0d" />
      <Path path={g.woofer} style="stroke" strokeWidth={5} color="#3d4148" />
      <Path path={g.cap} color="#24262c" />
      <Path path={g.horn} color="#0a0b0d" />
      <Path path={g.horn} style="stroke" strokeWidth={4} color="#3d4148" />
      <Path path={g.throat} style="stroke" strokeWidth={3} color="#2a2c31" />
      <Path path={g.baffle}>
        <RadialGradient c={vec(topX + 40, -HW + 80)} r={460} colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']} />
      </Path>
      <Path path={g.baffle} style="stroke" strokeWidth={5} color="#5d616c" />
      <Path path={g.handles} color="#050506" />
      <Path path={g.panel} color="#0d0e11" />
      <Path path={g.panel} style="stroke" strokeWidth={3} color="#4a4e56" />
      <Path path={g.jack} color="#050506" />
      <Path path={g.jack} style="stroke" strokeWidth={3} color="#8d9199" />
      <Path path={g.cab} style="stroke" strokeWidth={4} color="#70747f" opacity={0.9} />
      {highlight ? <Path path={g.cab} style="stroke" strokeWidth={highlightW} color={highlight} opacity={0.9} /> : null}
    </Group>
  );
}
