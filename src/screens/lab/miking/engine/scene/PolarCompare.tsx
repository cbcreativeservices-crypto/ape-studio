/**
 * PolarCompare — page 2's display: the chosen mic TYPE (generic art at its
 * documented proportions) with the IDEAL first-order lobe of the chosen
 * pattern, and a test source at SOURCE ANGLE around it (blueprint §7 row 2).
 * Abstract data → a clean geometric lobe (visual standards rule 2). A
 * pattern the cited documents do not let us draw (half-cardioid boundary,
 * "open cardioid") draws NO lobe and says so. Static: it changes only when
 * the learner moves the fader.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../theme/tokens';
import { useStageTextScale } from '../../../rack/stageAspect';
import { BoundaryMic, KickDynamicMic, SdcMic } from '../../../../../features/lab/micDrawings';
import type { MicPattern } from '../model/types.ts';
import { gain, isModelled, nullAngles } from '../physics/polar.ts';
import { micType } from '../../data/micTypes.ts';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const RED = '#ff6b5e';

export function PolarCompare({ w, h, typeId, pattern, angle, label }: { w: number; h: number; typeId: string; pattern: MicPattern; angle: number; label: string }) {
  const t = micType(typeId);
  const scaleText = useStageTextScale();
  const cx = w * 0.5;
  const cy = h * 0.52;
  const R = Math.min(w * 0.42, h * 0.42);
  // The mic points RIGHT (front = +x on screen); its body extends left.
  const k = (R * 0.55) / t.body.length.mm;
  const lobe = useMemo(() => {
    const p = Skia.Path.Make();
    if (!isModelled(pattern)) return p;
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * Math.PI * 2;
      const g = Math.abs(gain(pattern, (th * 180) / Math.PI)) * R;
      const x = cx + g * Math.cos(th);
      const y = cy - g * Math.sin(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pattern, cx, cy, R]);
  const ring = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [0.25, 0.5, 0.75, 1]) p.addCircle(cx, cy, R * f);
    return p;
  }, [cx, cy, R]);
  const nulls = isModelled(pattern) ? nullAngles(pattern) : [];
  const nullPath = useMemo(() => {
    const p = Skia.Path.Make();
    for (const n of nulls) {
      for (const s of [1, -1]) {
        const a = ((n * Math.PI) / 180) * s;
        p.moveTo(cx, cy);
        p.lineTo(cx + R * 1.08 * Math.cos(a), cy - R * 1.08 * Math.sin(a));
      }
    }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nulls.join(','), cx, cy, R]);
  const a = (angle * Math.PI) / 180;
  const sx = cx + R * 1.02 * Math.cos(a);
  const sy = cy - R * 1.02 * Math.sin(a);
  const len = t.body.length.mm;
  const r = t.body.radius.mm;
  const fs = Math.max(9, 9.5 * scaleText);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={ring} style="stroke" strokeWidth={1} color="#2e2f38" />
        <Line p1={vec(cx - R, cy)} p2={vec(cx + R, cy)} color="#3a3b46" strokeWidth={1} />
        {isModelled(pattern) ? (
          <>
            <Path path={lobe} color={BLUE} opacity={0.14} />
            <Path path={lobe} style="stroke" strokeWidth={2} color={BLUE} />
            <Path path={nullPath} style="stroke" strokeWidth={1.4} color={RED} opacity={0.8}>
              <DashPathEffect intervals={[5, 4]} />
            </Path>
          </>
        ) : null}
        <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: Math.PI / 2 }, { scale: k }]}>
          {t.art === 'boundary' ? <BoundaryMic len={len} cross={r * 2} /> : t.art === 'sdc' ? <SdcMic r={r} len={len} /> : <KickDynamicMic r={r} len={len} />}
        </Group>
        <Line p1={vec(cx, cy)} p2={vec(sx, sy)} color={AMBER} strokeWidth={1.4} opacity={0.8}>
          <DashPathEffect intervals={[6, 5]} />
        </Line>
        <Circle cx={sx} cy={sy} r={7} color={AMBER} />
        <Circle cx={sx} cy={sy} r={11} style="stroke" strokeWidth={1.5} color={AMBER} opacity={0.5} />
      </Canvas>
      <Text style={[styles.tag, { fontSize: fs, left: 6, top: 4 }]}>{isModelled(pattern) ? 'IDEAL PATTERN · same in every plane through the axis' : 'NO LOBE DRAWN · the cited guide gives no free-field pattern'}</Text>
      <Text style={[styles.tag, { fontSize: fs, right: 6, bottom: 4, color: AMBER }]}>TEST SOURCE</Text>
      <Text style={[styles.tag, { fontSize: fs, left: cx + R * 0.15, top: cy + 4, color: colors.textMuted }]}>FRONT →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { position: 'absolute', color: colors.textSubAlt, fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
});
