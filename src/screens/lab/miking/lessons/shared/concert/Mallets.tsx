/**
 * Beaters for Lab 1's concert lessons, side view: a TIMPANI MALLET (a wood
 * shaft and a felt-covered ball), a BASS-DRUM MALLET (a longer shaft and a
 * large felt head) and a SNARE STICK (tapered wood, a bead tip). Real
 * objects, lit from the upper left; sizes are drawing defaults (no source in
 * the research gives them — each lesson lists them in its unknowns). Static:
 * nothing here moves (D8).
 */
import { useMemo } from 'react';
import { Circle, Group, LinearGradient, Oval, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { FELT, INK } from './paths.ts';

export type MalletKind = 'timpani' | 'bass' | 'stick';

/** Drawing defaults (mm). */
export const MALLET_SIZES: Readonly<Record<MalletKind, { headR: number; shaftR: number }>> = {
  timpani: { headR: 19, shaftR: 5 },
  bass: { headR: 42, shaftR: 8 },
  stick: { headR: 5, shaftR: 7.5 },
};

/** A beater from `grip` (the hand end) to `head` (the head's centre). */
export function Mallet({ kind, grip, head, opacity = 1 }: { kind: MalletKind; grip: { x: number; y: number }; head: { x: number; y: number }; opacity?: number }) {
  const sz = MALLET_SIZES[kind];
  const { shaft, hi, ang, len } = useMemo(() => {
    const dx = head.x - grip.x;
    const dy = head.y - grip.y;
    const l = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    // In the beater's own frame: x along the shaft (0 at the grip), y across.
    const p = Skia.Path.Make();
    if (kind === 'stick') {
      // A tapered stick: full at the butt, narrowing to the shoulder, then the tip.
      p.moveTo(0, -sz.shaftR);
      p.lineTo(l * 0.72, -sz.shaftR * 0.85);
      p.quadTo(l * 0.93, -sz.shaftR * 0.35, l - sz.headR * 1.6, -sz.headR * 0.55);
      p.lineTo(l - sz.headR * 1.6, sz.headR * 0.55);
      p.quadTo(l * 0.93, sz.shaftR * 0.35, l * 0.72, sz.shaftR * 0.85);
      p.lineTo(0, sz.shaftR);
      p.close();
    } else {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(0, -sz.shaftR, l - sz.headR * 0.6, sz.shaftR * 2), sz.shaftR, sz.shaftR));
    }
    const h = Skia.Path.Make();
    h.moveTo(sz.shaftR * 2, -sz.shaftR * 0.45);
    h.lineTo(l * 0.8, -sz.shaftR * 0.45);
    return { shaft: p, hi: h, ang: a, len: l };
  }, [grip.x, grip.y, head.x, head.y, kind, sz.headR, sz.shaftR]);
  const r = sz.headR;
  return (
    <Group opacity={opacity} transform={[{ translateX: grip.x }, { translateY: grip.y }, { rotate: ang }]}>
      <Path path={shaft}>
        <LinearGradient start={vec(0, -sz.shaftR)} end={vec(0, sz.shaftR)} colors={['#f2d3a0', '#c48f52', '#7a4a20']} />
      </Path>
      <Path path={shaft} style="stroke" strokeWidth={0.9} color="#3a2210" />
      <Path path={hi} style="stroke" strokeWidth={1.4} strokeCap="round" color="#fff0d0" opacity={0.6} />
      {kind === 'stick' ? (
        <Oval x={len - r * 1.9} y={-r * 0.95} width={r * 2.2} height={r * 1.9}>
          <RadialGradient c={vec(len - r * 1.2, -r * 0.4)} r={r * 1.8} colors={['#f6dcae', '#c48f52', '#6e4318']} />
        </Oval>
      ) : kind === 'bass' ? (
        <>
          {/* a large felt head, a little wider than long */}
          <Oval x={len - r * 1.1} y={-r} width={r * 2.1} height={r * 2}>
            <RadialGradient c={vec(len - r * 0.5, -r * 0.45)} r={r * 1.7} colors={FELT} />
          </Oval>
          <Oval x={len - r * 1.1} y={-r} width={r * 2.1} height={r * 2} style="stroke" strokeWidth={1.2} color="#6e6655" />
          <Path path={seamPath(len - r * 0.05, r)} style="stroke" strokeWidth={1.1} color="#8f866f" opacity={0.7} />
        </>
      ) : (
        <>
          {/* a felt-covered ball, the seam drawn across it */}
          <Circle cx={len} cy={0} r={r}>
            <RadialGradient c={vec(len - r * 0.4, -r * 0.45)} r={r * 1.6} colors={FELT} />
          </Circle>
          <Circle cx={len} cy={0} r={r} style="stroke" strokeWidth={1.1} color="#6e6655" />
          <Path path={seamPath(len, r)} style="stroke" strokeWidth={0.9} color="#8f866f" opacity={0.7} />
        </>
      )}
      <Circle cx={0} cy={0} r={sz.shaftR * 0.6} color={INK} opacity={0.35} />
    </Group>
  );
}

const seams = new Map<string, ReturnType<typeof Skia.Path.Make>>();
function seamPath(cx: number, r: number) {
  const k = `${cx}:${r}`;
  let p = seams.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(cx - r * 0.35, -r, r * 0.7, r * 2), -90, 180);
    seams.set(k, p);
  }
  return p;
}
