/**
 * THE HEADROOM CHAIN, drawn (headroom.ts). The chain runs top to bottom as
 * the real pieces — the mic, a transmitter, a receiver, a preamp's gain
 * knob, the converter, the mix fader — each with a meter beside it: the level
 * that stage sees against its own limit (the meter's right end), on the
 * house loudness colours (levelColor.ts), peak red where it is over. A stage
 * that carries a clip from upstream shows a red hatch, however low its own
 * meter reads. The one number printed is the converter's dBFS. Built once
 * by group 2 (lab7-g5). Static; text ≥ 9 pt and zooming with full screen.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { levelColorForDb } from '../../../../../../features/tools/levelColor';
import { ShotgunArt } from '../fieldmics/FieldMicArt';
import { STAGES, fmtDbfs, readChain, type ChainSettings, type EventId, type StageId } from './headroom.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const PEAK_RED = '#ff5a48';
const RANGE = 40; // the meter shows the 40 dB below each stage's limit

function rr(x: number, y: number, w: number, h: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
  return p;
}

/** A device icon for a stage, drawn in a box (x, y, w, h). */
function Device({ id, x, y, w, h }: { id: StageId; x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (id === 'capsule') return <ShotgunArt x={x + w * 0.12} y={cy} angleDeg={180} scale={(w * 0.8) / 250} mount={false} />;
  if (id === 'tx') {
    const s = Math.min(w * 0.42, h * 0.95);
    return (
      <Group>
        <Path path={rr(cx - s * 0.36, cy - s * 0.5, s * 0.72, s, s * 0.1)}>
          <LinearGradient start={vec(cx - s, cy - s)} end={vec(cx + s, cy + s)} colors={['#5b5f69', '#25272c']} />
        </Path>
        <Path path={rr(cx - s * 0.24, cy - s * 0.36, s * 0.48, s * 0.22, 2)} color="#4f7a5a" />
        <Path
          path={(() => {
            const p = make();
            p.moveTo(cx + s * 0.22, cy - s * 0.5);
            p.lineTo(cx + s * 0.3, cy - s * 0.98);
            return p;
          })()}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          color="#9aa0ab"
        />
      </Group>
    );
  }
  if (id === 'rx') {
    const bw = w * 0.86;
    const bh = Math.min(h * 0.6, 26);
    return (
      <Group>
        <Path path={rr(cx - bw / 2, cy - bh / 2, bw, bh, 3)}>
          <LinearGradient start={vec(cx, cy - bh)} end={vec(cx, cy + bh)} colors={['#4a4e57', '#1d1e23']} />
        </Path>
        {[0, 1, 2, 3].map((i) => (
          <Circle key={i} cx={cx - bw * 0.3 + i * 7} cy={cy} r={2.2} color={i < 3 ? '#5bff85' : '#2a2c32'} />
        ))}
        {[-1, 1].map((s) => (
          <Path
            key={s}
            path={(() => {
              const p = make();
              p.moveTo(cx + s * bw * 0.4, cy - bh / 2);
              p.lineTo(cx + s * bw * 0.46, cy - bh / 2 - 12);
              return p;
            })()}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            color="#9aa0ab"
          />
        ))}
      </Group>
    );
  }
  if (id === 'preamp') {
    const r = Math.min(w, h) * 0.32;
    return (
      <Group>
        <Path path={rr(x + 4, y + 2, w - 8, h - 4, 4)} color="#1b1c20" />
        <Circle cx={cx} cy={cy} r={r}>
          <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#c7ccd4', '#6b707b', '#30333a']} />
        </Circle>
        <Path
          path={(() => {
            const p = make();
            p.moveTo(cx, cy);
            p.lineTo(cx + r * 0.6, cy - r * 0.6);
            return p;
          })()}
          style="stroke"
          strokeWidth={2.4}
          strokeCap="round"
          color="#ffffff"
        />
      </Group>
    );
  }
  if (id === 'adc') {
    const bw = w * 0.8;
    const bh = Math.min(h * 0.7, 28);
    return (
      <Group>
        <Path path={rr(cx - bw / 2, cy - bh / 2, bw, bh, 3)}>
          <LinearGradient start={vec(cx, cy - bh)} end={vec(cx, cy + bh)} colors={['#3a3d45', '#15161a']} />
        </Path>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Path key={i} path={rr(cx - bw * 0.36 + i * (bw * 0.12), cy - 3, bw * 0.09, 6, 1)} color={i < 4 ? '#5bff85' : i === 4 ? '#ffc64d' : PEAK_RED} opacity={0.85} />
        ))}
      </Group>
    );
  }
  // bus: a fader cap in its slot.
  return (
    <Group>
      <Path path={rr(cx - 3, y + 3, 6, h - 6, 3)} color="#0b0c0f" />
      <Path path={rr(cx - w * 0.2, cy - 6, w * 0.4, 12, 2)}>
        <LinearGradient start={vec(cx, cy - 6)} end={vec(cx, cy + 6)} colors={['#e0e3e8', '#8b9099']} />
      </Path>
    </Group>
  );
}

export function HeadroomDisplay({ w, h, s, ev, a11y }: { w: number; h: number; s: ChainSettings; ev: EventId; a11y: string }) {
  const k = useStageTextScale();
  const r = useMemo(() => readChain(s, ev), [s, ev]);
  const n = STAGES.length;
  const top = 6;
  const rowH = (h - top - 6) / n;
  const iconW = Math.min(96, w * 0.24);
  const labelW = Math.min(110 * k, w * 0.3);
  const mx = 10 + iconW + 8;
  const mw = Math.max(40, w - mx - labelW - 14);
  const bars = r.stages.map((q, i) => {
    const y = top + i * rowH + rowH * 0.5;
    const t = Math.max(0, Math.min(1, (q.level - (q.limit - RANGE)) / RANGE));
    return { q, y, t };
  });
  const cable = useMemo(() => {
    const p = make();
    const cx = 10 + iconW / 2;
    p.moveTo(cx, top + rowH * 0.8);
    p.lineTo(cx, top + rowH * (n - 0.8));
    return p;
  }, [iconW, rowH, n]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Path path={cable} style="stroke" strokeWidth={3} color="#0b0c0f" />
        {bars.map(({ q, y, t }, i) => {
          const over = q.over;
          const fill = over ? PEAK_RED : levelColorForDb(q.level - q.limit, -RANGE, 0);
          return (
            <Group key={q.id}>
              <Device id={q.id} x={10} y={top + i * rowH + 3} w={iconW} h={rowH - 6} />
              <Path path={rr(mx, y - 6, mw, 12, 3)} color="#0b0c0f" />
              {t > 0 ? <Path path={rr(mx, y - 6, mw * t, 12, 3)} color={fill} /> : null}
              {q.clippedBefore ? (
                <Path
                  path={(() => {
                    const p = make();
                    for (let x = mx; x < mx + mw; x += 8) {
                      p.moveTo(x, y + 6);
                      p.lineTo(x + 8, y - 6);
                    }
                    return p;
                  })()}
                  style="stroke"
                  strokeWidth={1.2}
                  color={PEAK_RED}
                  opacity={0.7}
                />
              ) : null}
              <Path path={rr(mx + mw - 2, y - 9, 3, 18, 1)} color={over ? PEAK_RED : '#e0e3e8'} />
            </Group>
          );
        })}
      </Canvas>
      {bars.map(({ q, y }) => {
        const st = STAGES.find((x) => x.id === q.id)!;
        const text = q.over ? `${st.short} · OVER` : q.clippedBefore ? `${st.short} · CLIPPED` : q.id === 'adc' ? `${st.short} · ${fmtDbfs(r.adcDbfs)}` : st.short;
        return (
          <Text key={q.id} style={[styles.label, { top: y - 7 * k, left: w - labelW - 6, width: labelW, fontSize: Math.max(9, 9.5 * k), color: q.over || q.clippedBefore ? PEAK_RED : q.id === 'adc' ? '#ffc64d' : colors.textSecondary }]} {...fitValue(Math.max(9, 9.5 * k))}>
            {text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8, textAlign: 'left' },
});
