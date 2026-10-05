/**
 * M13 TABLA — the two heads seen from above, side by side as the PLAYER sees
 * them (the player at the bottom, the audience at the top; the bayan on the
 * left, the dayan on the right in this layout): the black patch CENTRED on
 * the dayan and OFF-CENTRE (toward the player) on the bayan, the outer ring of
 * skin and the braided rim; and, on the bayan, the heel of the hand pressing
 * the head — the PRESS fader is the learner's, nothing moves by itself (D8).
 *
 * Sizes and the patch offset are the lesson's drawing defaults (model.ts);
 * pressing is drawn as a pad and a tension ring, never as a pitch number.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Circle, DashPathEffect, Group, Path, RadialGradient, Skia, vec, Canvas } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { BAYAN, DAYAN, type TablaDrum } from './geometry.ts';

const SKIN = ['#efe2c4', '#dccaa2', '#b8a072'];
const PATCH = ['#3a3d45', '#15161a', '#050506'];
const AMBER = '#ffc64d';
/** Plan positions of the two heads (mm): the drums' own z, side by side. */
const POS = { dayan: { u: DAYAN.H.z + 40, v: 0 }, bayan: { u: BAYAN.H.z - 40, v: 0 } };

function patchOffset(d: TablaDrum): number {
  // In the head's plane, toward the audience (+) or the player (−).
  const dx = d.patchC.x - d.H.x;
  const dy = d.patchC.y - d.H.y;
  return dx * d.ex.x + dy * d.ex.y;
}

function Head({ d, focus }: { d: TablaDrum; focus: boolean }) {
  const p = POS[d.id];
  const off = patchOffset(d);
  return (
    <Group opacity={focus ? 1 : 0.72}>
      <Circle cx={p.u + 10} cy={p.v + 14} r={d.headR + 24} color="#000" opacity={0.5}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      <Circle cx={p.u} cy={p.v} r={d.headR + 16} color="#5c3417" />
      <Circle cx={p.u} cy={p.v} r={d.headR + 11} style="stroke" strokeWidth={5} color="#c48f52" opacity={0.75}>
        <DashPathEffect intervals={[9, 7]} />
      </Circle>
      <Circle cx={p.u} cy={p.v} r={d.headR}>
        <RadialGradient c={vec(p.u - d.headR * 0.4, p.v - d.headR * 0.45)} r={d.headR * 1.7} colors={SKIN} />
      </Circle>
      <Circle cx={p.u} cy={p.v} r={d.headR - 12} style="stroke" strokeWidth={2} color="#9c8256" opacity={0.75} />
      <Circle cx={p.u} cy={p.v - off} r={d.patchR}>
        <RadialGradient c={vec(p.u - d.patchR * 0.35, p.v - off - d.patchR * 0.4)} r={d.patchR * 1.5} colors={PATCH} />
      </Circle>
      <Circle cx={p.u - d.patchR * 0.35} cy={p.v - off - d.patchR * 0.38} r={d.patchR * 0.22} color="#ffffff" opacity={0.14}>
        <BlurMask blur={d.patchR * 0.2} style="normal" />
      </Circle>
      {/* the centre, dotted, so "off-centre" can be seen, not only read */}
      <Path path={cross(p.u, p.v, 14)} style="stroke" strokeWidth={2.5} color="#ffffff" opacity={0.85} />
    </Group>
  );
}

function cross(u: number, v: number, s: number) {
  const q = Skia.Path.Make();
  q.moveTo(u - s, v);
  q.lineTo(u + s, v);
  q.moveTo(u, v - s);
  q.lineTo(u, v + s);
  return q;
}

export function TablaHeads({ w, h, focus, press, accessibilityLabel }: { w: number; h: number; focus: 'dayan' | 'bayan'; press: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = { u0: POS.bayan.u - BAYAN.headR - 60, u1: POS.dayan.u + DAYAN.headR + 60, v0: -BAYAN.headR - 80, v1: BAYAN.headR + 80 };
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = POS.bayan;
  // The heel of the hand on the bayan, on the player's side; pressing slides
  // it a little toward the patch (drawing default).
  const heel = useMemo(() => {
    const q = Skia.Path.Make();
    const cv = b.v + BAYAN.headR * (0.78 - 0.18 * press);
    q.addRRect(Skia.RRectXY(Skia.XYWHRect(b.u - 70, cv - 40, 140, 80), 40, 40));
    return q;
  }, [press, b.u, b.v]);
  const ripple = useMemo(() => {
    const q = Skia.Path.Make();
    q.addCircle(b.u, b.v, BAYAN.headR * 0.62);
    q.addCircle(b.u, b.v, BAYAN.headR * 0.84);
    return q;
  }, [b.u, b.v]);
  const labels: StaticLabel[] = [
    { id: 'dayan', text: 'DAYAN · CENTRED', short: 'DAYAN', u: POS.dayan.u, v: -BAYAN.headR - 40, align: 'center', tone: focus === 'dayan' ? undefined : 'muted' },
    { id: 'bayan', text: 'BAYAN · OFF-CENTRE', short: 'BAYAN', u: POS.bayan.u, v: -BAYAN.headR - 40, align: 'center', tone: focus === 'bayan' ? undefined : 'muted' },
    { id: 'player', text: 'PLAYER ↓', u: (POS.bayan.u + POS.dayan.u) / 2, v: BAYAN.headR + 50, align: 'center', tone: 'muted' },
    { id: 'aud', text: 'AUDIENCE ↑', u: (POS.bayan.u + POS.dayan.u) / 2, v: -BAYAN.headR - 40, align: 'center', tone: 'muted' },
  ];
  if (press > 0.05) labels.push({ id: 'heel', text: 'HEEL OF THE HAND', short: 'HEEL', u: b.u - 80, v: b.v + BAYAN.headR + 50, align: 'right', tone: 'amber' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Head d={BAYAN} focus={focus === 'bayan'} />
          <Head d={DAYAN} focus={focus === 'dayan'} />
          {press > 0.05 ? (
            <>
              <Path path={ripple} style="stroke" strokeWidth={2 + 5 * press} color={AMBER} opacity={0.25 + 0.5 * press}>
                <DashPathEffect intervals={[10, 10]} />
              </Path>
              <Path path={heel} color={AMBER} opacity={0.2 + 0.35 * press} />
              <Path path={heel} style="stroke" strokeWidth={4} color={AMBER} />
            </>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
