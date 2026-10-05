/**
 * HOW IT SOUNDS for an UPRIGHT drum (the snare, the toms) — the kick's
 * soundArt.tsx approach, for a drum whose heads lie flat (LESSON_JOURNEY §6
 * stage 2). The drum's own cutaway (DrumSection, the shared family) under an
 * EXPLANATORY OVERLAY, in millimetres of the drum's local frame (x across,
 * y down into the drum, the batter at y = 0).
 *
 *   StrikeSequence  the events, numbered, revealed by `reveal` (1 … n):
 *                   ① the stick's tip meets the batter head; ② the head is
 *                   pushed in; ③ the air pushes the bottom head out (or,
 *                   with no bottom head, leaves through the open end);
 *                   ④ on a snare with the snares on, the head springs back
 *                   faster than the wires can follow — they lose contact and
 *                   slap back (the buzz); ⑤/④ where the sound leaves.
 *   CoupledHeads    the two heads' lowest shape coupled through the enclosed
 *                   air (the Drum Tuning Lab's two-head model): TOGETHER (the
 *                   lower of the pair) or OPPOSED (the higher).
 *
 * HONESTY (as the kick's): the head outline is the IDEAL membrane's lowest
 * shape J0(2.405 r/R) (engine/physics/membrane.ts), drawn many times larger
 * than it moves, with the rest position still drawn; arrows show the ORDER
 * of events and their direction, never a speed, a pressure or a level; the
 * wires' gap is drawn larger too ("motion drawn larger"). Nothing loops (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { VariantId, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { lowestProfile } from '../../../engine/physics/membrane.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { DrumSpec } from './drumSpec.ts';
import { DrumSection, Stick } from './DrumArt';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

/** What one variant shows: the drum, whether it has its bottom head, and
 *  (a snare) whether the snares are on. */
export type UprightSetup = { spec: DrumSpec; reso: boolean; wires: 'on' | 'off' | null };

/* ── the head profile, sampled once (plain numbers: safe in worklets) ── */
const N = 40;
const PROFILE: number[] = Array.from({ length: N + 1 }, (_, i) => lowestProfile(-1 + (2 * i) / N));

/** A flat head's outline at plane y0, displaced by `amp` mm (down = +). */
function headPath(R: number, y0: number, amp: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const x = -R + (2 * R * i) / N;
    const y = y0 + amp * PROFILE[i];
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
function headFill(R: number, y0: number, amp: number): SkPath {
  'worklet';
  const p = headPath(R, y0, amp);
  p.lineTo(R, y0);
  p.lineTo(-R, y0);
  p.close();
  return p;
}
/** The wire set, a band following the head's shape at `amp` (its length L). */
function wiresPath(L: number, R: number, y0: number, amp: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + (L * i) / n;
    const k = Math.round(((x + R) / (2 * R)) * N);
    const y = y0 + amp * PROFILE[Math.max(0, Math.min(N, k))];
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 16) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
function arcs(p: SkPath, cx: number, cy: number, radii: number[], a0: number, a1: number) {
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0, a1 - a0);
}

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};

/** The scene box for a drum's sound steps (its local frame, mm). */
export function uprightSoundBox(spec: DrumSpec): ViewBox {
  const R = spec.d.mm / 2;
  const D = spec.depth.mm;
  return { u0: -R - 175, u1: R + 150, v0: -Math.max(190, R * 1.1), v1: D + Math.max(150, R * 0.95) };
}

export type UprightStrikeProps = { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };
export type UprightCoupledProps = { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string };

/**
 * The two sound scenes for a lesson whose drums are upright. `setupOf`
 * picks the drum for a variant (the toms' rack pair or floor tom; the
 * snare's snares on or off). Amplitudes are a fraction of the head's radius.
 */
export function makeUprightSound(setupOf: (v: VariantId) => UprightSetup, names: { batter: string; reso: string }): {
  StrikeSequence: (p: UprightStrikeProps) => ReactElement;
  CoupledHeads: (p: UprightCoupledProps) => ReactElement;
} {
  function StrikeSequence({ w, h, variant, reveal, shown, accessibilityLabel }: UprightStrikeProps) {
    const S = setupOf(variant);
    const spec = S.spec;
    const R = spec.d.mm / 2;
    const D = spec.depth.mm;
    const box = useMemo(() => uprightSoundBox(spec), [spec]);
    const textScale = useStageTextScale();
    const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
    const bAmpMax = R * 0.2;
    const rAmpMax = R * 0.15;
    // A snare drum has a wires event (④), snares on or off; a tom has none.
    const snare = !!spec.wires && S.wires != null;
    const buzz = S.wires === 'on';
    const n = snare ? 5 : 4;
    const last = n - 1; // the radiation event's index
    const wireL = spec.wires ? spec.wires.length.mm : 0;
    const wireY = D + 3 + (S.wires === 'off' && spec.wires ? spec.wires.dropOff.mm : 0);
    // Static overlay paths.
    const o = useMemo(() => {
      const strike = Skia.Path.Make();
      arrow(strike, -46, -64, -6, -10, 16);
      const push = Skia.Path.Make();
      arrow(push, 0, 8, 0, 56, 14);
      const air = Skia.Path.Make();
      for (const x of [-R * 0.5, 0, R * 0.5]) arrow(air, x, D * 0.22, x, D * 0.78, 13);
      const pushR = Skia.Path.Make();
      arrow(pushR, 0, D + 10, 0, D + 62, 14);
      const openAir = Skia.Path.Make();
      for (const x of [-R * 0.55, 0, R * 0.55]) arrow(openAir, x, D * 0.6, x, D + 90, 14);
      const up = Skia.Path.Make();
      arcs(up, 0, 30, [R * 0.75, R * 0.95, R * 1.15], 222, 318);
      const down = Skia.Path.Make();
      arcs(down, 0, D - 30, [R * 0.75, R * 0.95, R * 1.15], 42, 138);
      return { strike, push, air, pushR, openAir, up, down };
    }, [R, D]);
    const op = (i: number) => {
      'worklet';
      const on = clamp01(reveal.value - i);
      return on * (reveal.value >= i + 1.98 ? 0.4 : 1);
    };
    const o1 = useDerivedValue(() => op(0));
    const o2 = useDerivedValue(() => op(1));
    const o3 = useDerivedValue(() => op(2));
    const o4 = useDerivedValue(() => (buzz ? op(3) : 0));
    const oLast = useDerivedValue(() => clamp01(reveal.value - last));
    const bAmp = useDerivedValue(() => bAmpMax * clamp01(reveal.value - 1));
    // The bottom head is pushed down (③); a snare's then springs back up past
    // rest (④) while the wires, which cannot follow it that fast, stay down.
    const rAmp = useDerivedValue(() => rAmpMax * clamp01(reveal.value - 2) - (snare ? 1.7 * rAmpMax * clamp01(reveal.value - 3) : 0));
    const wAmp = useDerivedValue(() => (S.wires === 'on' ? rAmpMax * clamp01(reveal.value - 2) : 0));
    const bLine = useDerivedValue(() => headPath(R, 0, bAmp.value));
    const bFill = useDerivedValue(() => headFill(R, 0, bAmp.value));
    const rLine = useDerivedValue(() => headPath(R, D, rAmp.value));
    const rFill = useDerivedValue(() => headFill(R, D, rAmp.value));
    const wLine = useDerivedValue(() => wiresPath(wireL, R, wireY + 2, wAmp.value));
    const headOn = useDerivedValue(() => clamp01(reveal.value - 1));
    const resoOn = useDerivedValue(() => (S.reso ? clamp01(reveal.value - 2) : 0));
    const wiresOn = useDerivedValue(() => (spec.wires && S.wires ? clamp01(reveal.value - 2) : 0));

    const labels: StaticLabel[] = [];
    if (shown >= 1) labels.push({ id: 's1', text: '① STRIKE', u: -90, v: -96, align: 'center', tone: 'amber' });
    if (shown >= 2) labels.push({ id: 's2', text: '② HEAD PUSHED IN', short: '② HEAD IN', u: R * 0.25, v: -28, align: 'left', tone: 'blue' });
    if (shown >= 3) labels.push({ id: 's3', text: S.reso ? `③ AIR PUSHES THE ${names.reso}` : '③ AIR OUT OF THE OPEN END', short: S.reso ? '③ AIR → HEAD' : '③ AIR OUT', u: R + 20, v: D * 0.5, align: 'left', tone: 'blue' });
    if (buzz && shown >= 4) labels.push({ id: 's4', text: '④ WIRES LOSE CONTACT, SLAP BACK', short: '④ WIRES BUZZ', u: -R, v: D + rAmpMax + 40, align: 'left', tone: 'amber' });
    if (snare && !buzz && shown >= 4) labels.push({ id: 'off', text: '④ SNARES OFF: WIRES HANG STILL', short: '④ WIRES STILL', u: -R, v: D + 46, align: 'left', tone: 'muted' });
    if (shown >= n) {
      labels.push({ id: 'up', text: `${n === 5 ? '⑤' : '④'} UP: PLAYER, TOP MIC`, short: `${n === 5 ? '⑤' : '④'} UP`, u: R * 0.15, v: -R * 1.05, align: 'left', tone: 'blue' });
      labels.push({ id: 'dn', text: `${n === 5 ? '⑤' : '④'} DOWN: FLOOR, BOTTOM MIC`, short: `${n === 5 ? '⑤' : '④'} DOWN`, u: R * 0.15, v: D + R * 0.98, align: 'left', tone: 'blue' });
    }
    labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u0 + 10, v: box.v1 - 14, align: 'left', tone: 'illustrative' });

    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <DrumSection spec={spec} reso={S.reso} wires={S.wires} />
            <Stick from={{ x: -R - 160, y: -125 }} to={{ x: -6, y: -9 }} />
            {/* ① the stick's tip at the strike point */}
            <Group opacity={o1}>
              <Path path={o.strike} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
              <Circle cx={0} cy={0} r={16} style="stroke" strokeWidth={5} color={AMBER} />
            </Group>
            {/* ② the batter head bowed in (rest plane still drawn by the section) */}
            <Group opacity={headOn}>
              <Path path={bFill} color="rgba(111,168,255,0.28)" />
              <Path path={bLine} style="stroke" strokeWidth={6} color={BLUE} />
            </Group>
            <Group opacity={o2}>
              <Path path={o.push} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
            </Group>
            {/* ③ the air: it pushes the bottom head — or leaves the open end */}
            <Group opacity={o3}>
              <Path path={S.reso ? o.air : o.openAir} style="stroke" strokeWidth={5} color={AIR} strokeCap="round" strokeJoin="round">
                <DashPathEffect intervals={[16, 10]} />
              </Path>
              {S.reso ? <Path path={o.pushR} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" /> : null}
            </Group>
            <Group opacity={resoOn}>
              <Path path={rFill} color="rgba(111,168,255,0.28)" />
              <Path path={rLine} style="stroke" strokeWidth={6} color={BLUE} />
            </Group>
            {/* the wires, following the head down, left behind as it springs back */}
            <Group opacity={wiresOn}>
              <Path path={wLine} style="stroke" strokeWidth={5} color="#c9ced8" />
            </Group>
            <Group opacity={o4}>
              <Path path={wLine} style="stroke" strokeWidth={9} color={AMBER} opacity={0.45} />
            </Group>
            {/* the last event: where sound leaves (an overlay: direction, not amount) */}
            <Group opacity={oLast}>
              <Path path={o.up} style="stroke" strokeWidth={5} color={AIR} opacity={0.9}>
                <DashPathEffect intervals={[20, 13]} />
              </Path>
              <Path path={o.down} style="stroke" strokeWidth={5} color={AIR} opacity={0.9}>
                <DashPathEffect intervals={[20, 13]} />
              </Path>
            </Group>
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }

  function CoupledHeads({ w, h, variant, mode, swing, accessibilityLabel }: UprightCoupledProps) {
    const S = setupOf(variant);
    const spec = S.spec;
    const R = spec.d.mm / 2;
    const D = spec.depth.mm;
    const rIn = R - spec.tShell.mm;
    const box = useMemo(() => uprightSoundBox(spec), [spec]);
    const textScale = useStageTextScale();
    const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
    // +y is down. TOGETHER: both heads move the same way in space. OPPOSED:
    // the batter moves down while the bottom head moves up (both inward).
    const b = R * 0.2 * swing;
    const r = S.reso ? (mode === 'together' ? 1 : -1) * R * 0.15 * swing : 0;
    const paths = useMemo(() => ({ bLine: headPath(R, 0, b), bFill: headFill(R, 0, b), rLine: headPath(R, D, r), rFill: headFill(R, D, r) }), [R, D, b, r]);
    const squeeze = S.reso && mode === 'opposed' ? swing : 0;
    const tint = squeeze > 0 ? `rgba(111,168,255,${(0.32 * squeeze).toFixed(3)})` : `rgba(232,234,238,${(0.12 * -squeeze).toFixed(3)})`;
    const labels: StaticLabel[] = [
      { id: 'b', text: swing === 0 ? `${names.batter} · AT REST` : swing > 0 ? `${names.batter} ↓ IN` : `${names.batter} ↑ OUT`, short: names.batter, u: -R, v: -R * 0.42, align: 'left', tone: 'blue' },
      S.reso
        ? { id: 'r', text: r === 0 ? `${names.reso} · AT REST` : r > 0 ? `${names.reso} ↓ OUT` : `${names.reso} ↑ IN`, short: names.reso, u: -R, v: D + R * 0.42, align: 'left', tone: 'blue' }
        : { id: 'r', text: 'NO BOTTOM HEAD: THE AIR GOES OUT', short: 'OPEN BOTTOM', u: -R, v: D + R * 0.42, align: 'left', tone: 'blue' },
      { id: 'air', text: !S.reso ? 'ONE HEAD, OPEN BELOW' : mode === 'together' ? 'AIR CARRIED ALONG' : squeeze > 0.05 ? 'AIR SQUEEZED' : squeeze < -0.05 ? 'AIR EASED' : 'AIR AT REST', short: 'AIR', u: R + 16, v: D * 0.5, align: 'left', tone: 'blue' },
      { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: box.u0 + 10, v: box.v1 - 14, align: 'left', tone: 'illustrative' },
    ];
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <DrumSection spec={spec} reso={S.reso} wires={S.wires} />
            <Rect x={-rIn + 6} y={8} width={2 * rIn - 12} height={D - 16} color={tint} />
            <Path path={paths.bFill} color="rgba(111,168,255,0.28)" />
            <Path path={paths.bLine} style="stroke" strokeWidth={6} color={BLUE} />
            {S.reso ? (
              <>
                <Path path={paths.rFill} color="rgba(111,168,255,0.28)" />
                <Path path={paths.rLine} style="stroke" strokeWidth={6} color={BLUE} />
              </>
            ) : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }

  return { StrikeSequence, CoupledHeads };
}
