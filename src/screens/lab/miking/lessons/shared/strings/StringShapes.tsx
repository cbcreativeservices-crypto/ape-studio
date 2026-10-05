/**
 * StringShapes — ONE vibration shape of an IDEAL string, face-on (Lab 4's
 * HOW IT SOUNDS, LESSON_JOURNEY §7 strings row): the string between its two
 * ends, drawn in shape n at `swing` (−1 … 1, dragged by hand — nothing
 * loops, D8), its still points ringed, the + / − halves tinted, and the
 * strike, pluck or pickup point marked with how much of the shape it meets
 * (engine/physics/stringModes.ts). The rest line stays drawn.
 *
 * HONESTY: an ideal, flexible string; the motion is drawn many times larger
 * than it is ("motion drawn larger"); the ends are drawn as real parts (the
 * lesson names them) but the string's real length is not to scale here.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { shapeAtFrac, stillPoints } from '../../../engine/physics/stringModes.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
/** Drawing units: the string runs 0 … LEN; its swing is AMP at most. */
const LEN = 1000;
const AMP = 120;
const BOX = { u0: -90, u1: LEN + 90, v0: -AMP - 90, v1: AMP + 110 };

export type StringEnds = { left: string; right: string; tone?: 'piano' | 'harp' | 'clav' };

export function StringShapes({ w, h, n, swing, point, pointWord, ends, accessibilityLabel }: { w: number; h: number; n: number; swing: number; point: number; pointWord: string; ends: StringEnds; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const paths = useMemo(() => {
    const line = Skia.Path.Make();
    const plus = Skia.Path.Make();
    const minus = Skia.Path.Make();
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const y = -AMP * swing * shapeAtFrac(n, s);
      if (i === 0) line.moveTo(0, y);
      else line.lineTo(s * LEN, y);
    }
    // The halves: a fill between the rest line and the shape, per lobe.
    for (let k = 0; k < n; k++) {
      const p = Skia.Path.Make();
      const s0 = k / n;
      const s1 = (k + 1) / n;
      p.moveTo(s0 * LEN, 0);
      for (let i = 0; i <= 24; i++) {
        const s = s0 + ((s1 - s0) * i) / 24;
        p.lineTo(s * LEN, -AMP * swing * shapeAtFrac(n, s));
      }
      p.lineTo(s1 * LEN, 0);
      p.close();
      // + = up (toward the viewer's top) at this moment.
      const up = swing * shapeAtFrac(n, (s0 + s1) / 2) > 0;
      (up ? plus : minus).addPath(p);
    }
    const rest = Skia.Path.Make();
    rest.moveTo(0, 0);
    rest.lineTo(LEN, 0);
    // The ends as real parts: a pin through a block (left), a bridge with
    // its pin (right). Drawn, not measured.
    const leftBlock = Skia.Path.Make();
    leftBlock.addRRect(Skia.RRectXY(Skia.XYWHRect(-70, -26, 70, 52), 8, 8));
    const rightBlock = Skia.Path.Make();
    rightBlock.moveTo(LEN, -14);
    rightBlock.lineTo(LEN + 70, -6);
    rightBlock.lineTo(LEN + 74, 60);
    rightBlock.lineTo(LEN - 6, 60);
    rightBlock.close();
    return { line, plus, minus, rest, leftBlock, rightBlock };
  }, [n, swing]);
  const still = stillPoints(n);
  const px = point * LEN;
  const py = -AMP * swing * shapeAtFrac(n, point);
  const tone = ends.tone ?? 'piano';
  // The clavinet's string runs from its bridge (left, wood) to the anvil (right, steel).
  const leftCols = tone === 'harp' ? ['#c7a466', '#8a6a3a'] : tone === 'clav' ? ['#e8cf9c', '#9a7638'] : ['#f3d98d', '#8f6a22'];
  const rightCols = tone === 'clav' ? ['#c9ced6', '#565b63'] : ['#e8cf9c', '#9a7638'];
  const labels: StaticLabel[] = [
    { id: 'l', text: ends.left, u: -35, v: 62, align: 'center', tone: 'muted' },
    { id: 'r', text: ends.right, u: LEN + 34, v: 92, align: 'center', tone: 'muted' },
    { id: 'p', text: pointWord, u: px, v: -AMP - 52, align: 'center', tone: 'amber' },
    { id: 'big', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: LEN / 2, v: AMP + 82, align: 'center', tone: 'illustrative' },
  ];
  if (still.length && still.length <= 4) labels.push({ id: 's', text: still.length === 1 ? 'STILL POINT' : 'STILL POINTS', u: still[0] * LEN, v: 46, align: 'center', tone: 'blue' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={paths.rest} style="stroke" strokeWidth={2} color="#8a8f99" opacity={0.6}>
            <DashPathEffect intervals={[12, 10]} />
          </Path>
          <Path path={paths.plus} color="rgba(111,168,255,0.26)" />
          <Path path={paths.minus} color="rgba(255,198,77,0.22)" />
          <Path path={paths.line} style="stroke" strokeWidth={7} color="#0d0e11" />
          <Path path={paths.line} style="stroke" strokeWidth={4} color="#e6e9ef" />
          {still.map((s) => (
            <Circle key={s} cx={s * LEN} cy={0} r={14} style="stroke" strokeWidth={4} color={BLUE} />
          ))}
          {/* the strike / pluck / pickup point, on the string */}
          <Path path={dash(px)} style="stroke" strokeWidth={3} color={AMBER} opacity={0.8}>
            <DashPathEffect intervals={[10, 8]} />
          </Path>
          <Circle cx={px} cy={py} r={16} color={AMBER} />
          <Circle cx={px} cy={py} r={16} style="stroke" strokeWidth={3} color="#5c4313" />
          <Path path={paths.leftBlock}>
            <LinearGradient start={vec(-70, -26)} end={vec(0, 26)} colors={leftCols} />
          </Path>
          <Circle cx={-14} cy={0} r={8} color="#d9dde5" />
          <Path path={paths.rightBlock}>
            <LinearGradient start={vec(LEN, -14)} end={vec(LEN + 74, 60)} colors={rightCols} />
          </Path>
          <Circle cx={LEN + 14} cy={-8} r={7} color="#4b4f58" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

const dashCache = new Map<number, ReturnType<typeof Skia.Path.Make>>();
function dash(x: number) {
  const k = Math.round(x);
  let p = dashCache.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.moveTo(x, -AMP - 30);
    p.lineTo(x, AMP + 30);
    dashCache.set(k, p);
  }
  return p;
}
