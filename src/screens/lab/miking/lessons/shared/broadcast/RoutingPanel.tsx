/**
 * THE ROUTING PANEL — where each mic goes (Lab 7; the model is routing.ts).
 * A signal-flow drawing: the SOURCES on the left (each drawn as the real
 * thing — the mic itself, a laptop for a remote guest, a talkback station),
 * the mixing console in the middle, the DESTINATIONS on the right (the PA
 * cabinet, a monitor wedge, headphones, the program meters, a stream encoder,
 * a recorder, an earpiece, the press feed box with its row of isolated
 * outputs, the remote guest's return). One source is TRACED: its wire and
 * every destination it reaches are lit amber; a destination with a routing
 * problem is outlined red AND marked "✕" in its label (colour never alone).
 * Labels are native text, never under 9 pt (StaticLabels). One labelled
 * canvas (accessible); static — it changes only when a control changes it.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import type { MicArtId } from '../../../engine/model/types.ts';
import { DESTINATIONS, reaches, type DestId, type RouteProblem, type RoutingPlan } from './routing.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const DIM = '#3a3d45';

/** The drawing's box (design units). */
const W = 900;
const ICON = 104;
const SRC_X = 10;
const DST_X = 590;
const MIX = { x0: 450, x1: 540 };

/** How each source is drawn: a mic type's own art, or a device. */
export type SourceLook = { art: MicArtId; r: number; len: number } | 'laptop' | 'talkback' | 'player';

function rows(n: number, h: number): number[] {
  const step = h / n;
  return Array.from({ length: n }, (_, i) => step * (i + 0.5));
}

/* ── the devices (each in a box ICON × ICON·0.8, origin top-left) ── */

function deviceArt(id: DestId | 'laptop' | 'talkback' | 'player'): { fill: SkPath; detail: SkPath; glow?: SkPath } {
  const fill = make();
  const detail = make();
  const s = ICON;
  switch (id) {
    case 'pa': {
      fill.moveTo(s * 0.22, s * 0.04);
      fill.lineTo(s * 0.78, s * 0.04);
      fill.lineTo(s * 0.7, s * 0.78);
      fill.lineTo(s * 0.3, s * 0.78);
      fill.close();
      detail.addOval(Skia.XYWHRect(s * 0.34, s * 0.34, s * 0.32, s * 0.32));
      detail.addOval(Skia.XYWHRect(s * 0.42, s * 0.1, s * 0.16, s * 0.12));
      break;
    }
    case 'monitor': {
      fill.moveTo(s * 0.08, s * 0.78);
      fill.lineTo(s * 0.3, s * 0.2);
      fill.lineTo(s * 0.92, s * 0.44);
      fill.lineTo(s * 0.92, s * 0.78);
      fill.close();
      detail.moveTo(s * 0.18, s * 0.66);
      detail.lineTo(s * 0.33, s * 0.28);
      break;
    }
    case 'phones': {
      detail.moveTo(s * 0.2, s * 0.5);
      detail.cubicTo(s * 0.2, s * 0.02, s * 0.8, s * 0.02, s * 0.8, s * 0.5);
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.1, s * 0.42, s * 0.22, s * 0.34), 8, 8));
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.68, s * 0.42, s * 0.22, s * 0.34), 8, 8));
      break;
    }
    case 'program': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.1, s * 0.06, s * 0.8, s * 0.7), 6, 6));
      for (const x of [0.32, 0.56]) detail.addRect(Skia.XYWHRect(s * x, s * 0.16, s * 0.12, s * 0.5));
      break;
    }
    case 'stream': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.04, s * 0.34, s * 0.92, s * 0.3), 5, 5));
      for (const r of [0.14, 0.24]) {
        detail.moveTo(s * 0.5 - s * r, s * 0.26);
        detail.quadTo(s * 0.5, s * 0.26 - s * r * 1.2, s * 0.5 + s * r, s * 0.26);
      }
      detail.addRect(Skia.XYWHRect(s * 0.7, s * 0.44, s * 0.14, s * 0.1));
      break;
    }
    case 'recorder': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.08, s * 0.14, s * 0.84, s * 0.6), 7, 7));
      detail.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.16, s * 0.22, s * 0.4, s * 0.24), 3, 3));
      for (const x of [0.66, 0.78]) detail.addOval(Skia.XYWHRect(s * x, s * 0.5, s * 0.1, s * 0.1));
      break;
    }
    case 'ifb': {
      fill.addOval(Skia.XYWHRect(s * 0.18, s * 0.12, s * 0.32, s * 0.3));
      detail.moveTo(s * 0.34, s * 0.42);
      detail.cubicTo(s * 0.5, s * 0.6, s * 0.3, s * 0.66, s * 0.5, s * 0.78);
      detail.lineTo(s * 0.86, s * 0.78);
      break;
    }
    case 'talkback': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.1, s * 0.44, s * 0.8, s * 0.34), 6, 6));
      detail.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.56, s * 0.52, s * 0.22, s * 0.16), 3, 3));
      detail.moveTo(s * 0.28, s * 0.44);
      detail.cubicTo(s * 0.28, s * 0.2, s * 0.4, s * 0.12, s * 0.5, s * 0.1);
      break;
    }
    case 'pressBox': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.02, s * 0.2, s * 0.96, s * 0.46), 5, 5));
      for (let k = 0; k < 12; k++) detail.addOval(Skia.XYWHRect(s * (0.07 + (k % 6) * 0.15), s * (0.27 + Math.floor(k / 6) * 0.18), s * 0.1, s * 0.1));
      break;
    }
    case 'remoteReturn':
    case 'laptop': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.18, s * 0.06, s * 0.64, s * 0.46), 4, 4));
      fill.moveTo(s * 0.06, s * 0.6);
      fill.lineTo(s * 0.94, s * 0.6);
      fill.lineTo(s * 0.86, s * 0.72);
      fill.lineTo(s * 0.14, s * 0.72);
      fill.close();
      detail.addRect(Skia.XYWHRect(s * 0.24, s * 0.12, s * 0.52, s * 0.34));
      break;
    }
    case 'player': {
      fill.addRRect(Skia.RRectXY(Skia.XYWHRect(s * 0.1, s * 0.2, s * 0.8, s * 0.48), 6, 6));
      detail.moveTo(s * 0.42, s * 0.32);
      detail.lineTo(s * 0.62, s * 0.44);
      detail.lineTo(s * 0.42, s * 0.56);
      detail.close();
      break;
    }
  }
  return { fill, detail };
}

function Device({ id, x, y, lit, bad }: { id: DestId | 'laptop' | 'talkback' | 'player'; x: number; y: number; lit: boolean; bad: boolean }) {
  const p = useMemo(() => deviceArt(id), [id]);
  const b = p.fill.getBounds();
  const blue = id === 'remoteReturn' || id === 'laptop';
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Path path={p.fill}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#6d727d', '#3a3d45', '#16171b']} />
      </Path>
      <Path path={p.detail} style={id === 'phones' || id === 'ifb' || id === 'stream' || id === 'talkback' ? 'stroke' : 'fill'} strokeWidth={5} strokeCap="round" color={blue ? '#1d3a66' : id === 'program' ? '#5bff85' : '#0b0c0f'} />
      <Path path={p.fill} style="stroke" strokeWidth={2.4} color={bad ? RED : lit ? AMBER : '#060607'} />
    </Group>
  );
}

/** The console in the middle: a desk of fader strips. */
function Console({ h }: { h: number }) {
  const p = useMemo(() => {
    const body = make();
    const caps = make();
    const slots = make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(MIX.x0, h * 0.18, MIX.x1 - MIX.x0, h * 0.64), 12, 12));
    for (let k = 0; k < 3; k++) {
      const x = MIX.x0 + 20 + k * 25;
      slots.moveTo(x, h * 0.3);
      slots.lineTo(x, h * 0.72);
      caps.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 10, h * (0.4 + (k % 3) * 0.08), 20, 26), 4, 4));
    }
    return { body, caps, slots };
  }, [h]);
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#4f535c', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.slots} style="stroke" strokeWidth={4} strokeCap="round" color="#050506" />
      <Path path={p.caps}>
        <LinearGradient start={vec(b.x, 0)} end={vec(b.x, 40)} colors={['#e6e9ef', '#7c818b']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={2.4} color="#060607" />
    </Group>
  );
}

export function RoutingPanel({ w, h, plan, trace, problems, looks, a11y }: { w: number; h: number; plan: RoutingPlan; trace: string | null; problems: readonly RouteProblem[]; looks: Readonly<Record<string, SourceLook>>; a11y: string }) {
  const textScale = useStageTextScale();
  const H = Math.max(560, Math.max(plan.sources.length, plan.dests.length) * 96);
  const box = { u0: 0, u1: W, v0: 0, v1: H };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, H]); // eslint-disable-line react-hooks/exhaustive-deps
  const srcY = rows(plan.sources.length, H);
  const dstY = rows(plan.dests.length, H);
  const bad = new Set(problems.flatMap((p) => ('dest' in p ? [p.dest] : p.code === 'echo' ? ['remoteReturn'] : p.code === 'ambienceInPa' ? ['pa'] : [])));
  const wires = useMemo(() => {
    const dim = make();
    const lit = make();
    const red = make();
    plan.sources.forEach((s, i) => {
      const p = s.id === trace ? lit : dim;
      p.moveTo(SRC_X + ICON + 6, srcY[i]);
      p.cubicTo((SRC_X + ICON + MIX.x0) / 2, srcY[i], (SRC_X + ICON + MIX.x0) / 2, H / 2, MIX.x0, H / 2);
    });
    plan.dests.forEach((d, i) => {
      const on = trace != null && reaches(plan, trace, d);
      const p = bad.has(d) && on ? red : on ? lit : dim;
      p.moveTo(MIX.x1, H / 2);
      p.cubicTo((MIX.x1 + DST_X) / 2, H / 2, (MIX.x1 + DST_X) / 2, dstY[i], DST_X - 6, dstY[i]);
    });
    return { dim, lit, red };
  }, [plan, trace, H, problems]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels: StaticLabel[] = [
    ...plan.sources.map((s, i) => ({ id: `s.${s.id}`, text: s.label.toUpperCase(), short: s.short, u: SRC_X + ICON + 14, v: srcY[i] - 36, align: 'left' as const, tone: s.id === trace ? ('amber' as const) : undefined })),
    ...plan.dests.map((d, i) => {
      const on = trace != null && reaches(plan, trace, d);
      const x = bad.has(d) ? '✕ ' : '';
      return { id: `d.${d}`, text: `${x}${DESTINATIONS[d].short}`, short: `${x}${DESTINATIONS[d].short}`, u: DST_X + ICON + 14, v: dstY[i], align: 'left' as const, tone: on ? ('amber' as const) : ('muted' as const) };
    }),
    { id: 'mix', text: 'MIXER', u: (MIX.x0 + MIX.x1) / 2, v: H * 0.12, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <RoundedRect x={0} y={0} width={W} height={H} r={18} color="#0d0f13" />
          <Path path={wires.dim} style="stroke" strokeWidth={4} color={DIM} />
          <Path path={wires.lit} style="stroke" strokeWidth={6} color={AMBER} />
          <Path path={wires.red} style="stroke" strokeWidth={6} color={RED}>
            <DashPathEffect intervals={[16, 10]} />
          </Path>
          <Console h={H} />
          {plan.sources.map((s, i) => {
            const look = looks[s.id] ?? (s.kind === 'remote' ? 'laptop' : s.kind === 'talkback' ? 'talkback' : 'player');
            const y = srcY[i];
            return (
              <Group key={s.id}>
                {typeof look === 'string' ? (
                  <Device id={look} x={SRC_X} y={y - ICON * 0.4} lit={s.id === trace} bad={false} />
                ) : (
                  // A mic drawn pointing left, its body toward the console.
                  <Group transform={[{ translateX: SRC_X + 4 }, { translateY: y }, { rotate: -Math.PI / 2 }, { scale: Math.min(1.4, (ICON - 8) / look.len) }]}>
                    <MikingMicArt art={look.art} r={look.r} len={look.len} />
                  </Group>
                )}
                {s.id === trace ? <Circle cx={SRC_X + ICON + 6} cy={y} r={8} color={AMBER} /> : null}
              </Group>
            );
          })}
          {plan.dests.map((d, i) => (
            <Device key={d} id={d} x={DST_X} y={dstY[i] - ICON * 0.4} lit={trace != null && reaches(plan, trace, d)} bad={bad.has(d)} />
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
