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

/* ── the devices (each in a box ICON × ICON·0.8, origin top-left) ──
 *
 * An ICON ROW: each device is drawn internally true to its real proportions
 * (mm, drawing defaults for the class), fitted to the icon box:
 *   PA cabinet (front)      12-inch two-way, 600 × 370 mm; woofer Ø 305 mm in
 *                           the lower part, a 90 × 40° horn above it
 *   floor wedge (side)      12-inch wedge, 520 mm long, 330 mm at the back,
 *                           the baffle sloping about 30° toward the talker
 *   headphones (front)      closed-back, cups about 100 × 80 mm, band 190 mm
 *   program meters          a stereo bar meter: two segmented columns
 *   stream encoder          a half-rack box, 1U (44 mm) high, with its display
 *   recorder                a half-rack recorder: display, record key, card slot
 *   earpiece (IFB)          a moulded earpiece on a clear acoustic tube to the
 *                           belt receiver's plug
 *   talkback station        a sloped desk panel, push-to-talk key and a short
 *                           gooseneck mic
 *   press feed box          a box with twelve XLR outputs (two rows of six)
 *   laptop                  a 14-inch laptop, open, from the front
 *   playback (jingles)      a desk cart player: a display and two rows of keys
 */

type DeviceLayers = { body: SkPath; recess: SkPath; metal: SkPath; line: SkPath; lamp: SkPath; glass: SkPath; hot: SkPath };

function rr(p: SkPath, x: number, y: number, w: number, h: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
}

/** One XLR female socket face at (cx, cy), radius r: its shell and three pin holes. */
function xlrFace(recess: SkPath, metal: SkPath, cx: number, cy: number, r: number) {
  metal.addCircle(cx, cy, r);
  recess.addCircle(cx, cy, r * 0.74);
  // Pins 1, 2, 3 (looking into the socket): 1 and 2 across the top, 3 below.
  for (const [dx, dy] of [
    [-0.32, -0.18],
    [0.32, -0.18],
    [0, 0.34],
  ]) metal.addCircle(cx + dx * r, cy + dy * r, r * 0.13);
}

function deviceArt(id: DestId | 'laptop' | 'talkback' | 'player'): DeviceLayers {
  const L: DeviceLayers = { body: make(), recess: make(), metal: make(), line: make(), lamp: make(), glass: make(), hot: make() };
  const s = ICON;
  switch (id) {
    case 'pa': {
      // 600 × 370 mm → 80 units tall, 49 wide, centred.
      const H = 80;
      const Wd = (H * 370) / 600;
      const x0 = (s - Wd) / 2;
      const y0 = 2;
      rr(L.body, x0, y0, Wd, H, 5);
      // The grille's perforated field (the whole front, inset) and the horn mouth above the woofer.
      rr(L.recess, x0 + 3, y0 + 3, Wd - 6, H - 6, 3);
      const cx = s / 2;
      const wy = y0 + H * 0.64;
      const wr = (Wd * 305) / 370 / 2;
      L.metal.addCircle(cx, wy, wr);
      L.recess.addCircle(cx, wy, wr * 0.8);
      L.metal.addCircle(cx, wy, wr * 0.22); // the dust cap
      // The horn: a rectangular mouth flaring to a small throat.
      L.metal.moveTo(cx - Wd * 0.36, y0 + H * 0.1);
      L.metal.lineTo(cx + Wd * 0.36, y0 + H * 0.1);
      L.metal.lineTo(cx + Wd * 0.08, y0 + H * 0.26);
      L.metal.lineTo(cx - Wd * 0.08, y0 + H * 0.26);
      L.metal.close();
      L.recess.addRect(Skia.XYWHRect(cx - Wd * 0.05, y0 + H * 0.15, Wd * 0.1, H * 0.08));
      break;
    }
    case 'monitor': {
      // A floor wedge from the side, the talker to the right: back 330, length 520 mm.
      L.body.moveTo(10, 80);
      L.body.lineTo(10, 32);
      L.body.quadTo(10, 28, 14, 28);
      L.body.lineTo(36, 28);
      L.body.lineTo(94, 62);
      L.body.lineTo(96, 66);
      L.body.lineTo(96, 80);
      L.body.close();
      // The baffle's grille along the sloping face.
      L.recess.moveTo(37, 31);
      L.recess.lineTo(93, 64);
      L.recess.lineTo(90, 68);
      L.recess.lineTo(35, 36);
      L.recess.close();
      // A side handle recess and the rubber feet.
      rr(L.recess, 18, 44, 20, 8, 4);
      rr(L.metal, 14, 79, 12, 3, 1.5);
      rr(L.metal, 80, 79, 12, 3, 1.5);
      break;
    }
    case 'phones': {
      // The band: an arc with its padded underside.
      L.line.moveTo(22, 46);
      L.line.cubicTo(20, 4, 84, 4, 82, 46);
      L.recess.moveTo(30, 30);
      L.recess.cubicTo(36, 12, 68, 12, 74, 30);
      L.recess.lineTo(70, 31);
      L.recess.cubicTo(64, 18, 40, 18, 34, 31);
      L.recess.close();
      // The yokes and the cups, cushions toward the middle.
      for (const sx of [1, -1]) {
        const cxp = s / 2 - sx * 36;
        rr(L.metal, cxp - 2, 38, 4, 10, 1.5);
        rr(L.body, cxp - 10, 44, 20, 34, 9);
        rr(L.recess, sx > 0 ? cxp + 6 : cxp - 10, 47, 4, 28, 2);
      }
      break;
    }
    case 'program': {
      // A stereo bar meter: housing, two columns of segments, a scale between.
      rr(L.body, 22, 4, 60, 76, 5);
      rr(L.recess, 27, 9, 50, 66, 3);
      for (const x of [33, 59]) for (let k = 0; k < 12; k++) {
        const y = 66 - k * 4.8;
        rr(k < 8 ? L.glass : L.lamp, x, y, 12, 3.4, 0.8);
      }
      for (let k = 0; k <= 4; k++) {
        L.line.moveTo(50, 69 - k * 14.4);
        L.line.lineTo(54, 69 - k * 14.4);
      }
      break;
    }
    case 'stream': {
      // A half-rack 1U box: 216 × 44 mm → 92 × 19, its rack ear, display and status lamps.
      rr(L.body, 6, 40, 92, 22, 3);
      rr(L.recess, 14, 45, 30, 12, 2);
      rr(L.glass, 16, 47, 26, 8, 1);
      for (const x of [52, 60, 68]) L.lamp.addCircle(x, 51, 2.4);
      L.metal.addCircle(86, 51, 5);
      // The radio-wave mark above it (sent out live).
      for (const r of [9, 17, 25]) {
        L.line.moveTo(52 - r, 32 - r * 0.15);
        L.line.quadTo(52, 30 - r * 1.05, 52 + r, 32 - r * 0.15);
      }
      L.lamp.addCircle(52, 33, 3);
      break;
    }
    case 'recorder': {
      // A half-rack recorder, 2U: display, card slot, transport and the red record key.
      rr(L.body, 6, 26, 92, 40, 4);
      rr(L.recess, 13, 32, 38, 18, 2);
      rr(L.glass, 15, 34, 34, 14, 1);
      rr(L.recess, 13, 55, 26, 3, 1); // the card slot
      for (const x of [60, 72]) rr(L.metal, x, 40, 9, 9, 2);
      L.hot.addCircle(88, 44.5, 5);
      L.metal.addCircle(64, 58, 1);
      break;
    }
    case 'ifb': {
      // A moulded earpiece, its clear tube coiling down to the receiver's plug.
      L.body.moveTo(28, 10);
      L.body.cubicTo(44, 6, 54, 18, 50, 30);
      L.body.cubicTo(47, 38, 36, 40, 30, 34);
      L.body.cubicTo(22, 27, 18, 14, 28, 10);
      L.body.close();
      L.recess.addCircle(42, 22, 4);
      L.glass.moveTo(36, 37);
      L.glass.cubicTo(38, 48, 56, 44, 56, 52);
      L.glass.cubicTo(56, 60, 40, 58, 42, 64);
      L.glass.cubicTo(44, 70, 60, 70, 66, 70);
      rr(L.metal, 66, 66, 14, 8, 2);
      L.metal.moveTo(80, 70);
      L.metal.lineTo(92, 70);
      L.metal.lineTo(92, 71.5);
      L.metal.lineTo(80, 71.5);
      L.metal.close();
      break;
    }
    case 'talkback': {
      // A sloped desk panel, its push-to-talk key and a short gooseneck mic.
      L.body.moveTo(8, 78);
      L.body.lineTo(12, 56);
      L.body.lineTo(92, 50);
      L.body.lineTo(96, 78);
      L.body.close();
      rr(L.hot, 58, 58, 22, 10, 2);
      for (const x of [26, 38]) L.metal.addCircle(x, 66, 3.4);
      L.line.moveTo(22, 56);
      L.line.cubicTo(20, 34, 30, 20, 44, 16);
      L.metal.addCircle(22, 56, 4);
      rr(L.body, 42, 10, 18, 10, 4);
      rr(L.recess, 54, 11, 6, 8, 2);
      L.lamp.addCircle(22, 50, 2);
      break;
    }
    case 'pressBox': {
      // A press box: twelve isolated XLR outputs, two rows of six.
      rr(L.body, 2, 20, 100, 50, 5);
      for (let k = 0; k < 12; k++) xlrFace(L.recess, L.metal, 12 + (k % 6) * 16, 33 + Math.floor(k / 6) * 22, 6.4);
      break;
    }
    case 'remoteReturn':
    case 'laptop': {
      // A 14-inch laptop open, from the front: lid with its bezel, base below.
      rr(L.body, 20, 4, 64, 44, 3);
      rr(L.glass, 23, 7, 58, 37, 1);
      L.body.moveTo(12, 52);
      L.body.lineTo(92, 52);
      L.body.lineTo(98, 60);
      L.body.lineTo(6, 60);
      L.body.close();
      L.recess.moveTo(14, 53.5);
      L.recess.lineTo(90, 53.5);
      L.recess.lineTo(93, 57.5);
      L.recess.lineTo(11, 57.5);
      L.recess.close();
      break;
    }
    case 'player': {
      // A desk cart player for jingles and clips: a display and two rows of keys.
      rr(L.body, 8, 22, 88, 50, 5);
      rr(L.recess, 14, 28, 34, 12, 2);
      rr(L.glass, 16, 30, 30, 8, 1);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) rr(r === 0 && c === 1 ? L.lamp : L.metal, 14 + c * 20, 46 + r * 12, 15, 9, 2);
      L.hot.moveTo(76, 30);
      L.hot.lineTo(86, 35);
      L.hot.lineTo(76, 40);
      L.hot.close();
      break;
    }
  }
  return L;
}

function Device({ id, x, y, lit, bad }: { id: DestId | 'laptop' | 'talkback' | 'player'; x: number; y: number; lit: boolean; bad: boolean }) {
  const p = useMemo(() => deviceArt(id), [id]);
  const b = p.body.getBounds();
  const screenBlue = id === 'remoteReturn' || id === 'laptop';
  const glass = id === 'program' ? '#5bff85' : id === 'ifb' ? '#c9dbe8' : screenBlue ? '#2c5a96' : '#3f6f8f';
  const lamp = id === 'program' ? '#ffc64d' : id === 'player' ? '#ffc64d' : '#5bff85';
  const lineW = id === 'phones' ? 7 : id === 'talkback' ? 4 : 3;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Path path={p.line} style="stroke" strokeWidth={lineW + 2.4} strokeCap="round" color="#060607" />
      <Path path={p.line} style="stroke" strokeWidth={lineW} strokeCap="round" color={id === 'stream' ? '#8fbcff' : '#5a5e68'} />
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#6d727d', '#3a3d45', '#1a1b20']} />
      </Path>
      <Path path={p.recess} color="#0b0c0f" />
      <Path path={p.metal}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#c3c8d1', '#7c818b', '#3f434b']} />
      </Path>
      {id === 'ifb' ? <Path path={p.glass} style="stroke" strokeWidth={3} strokeCap="round" color={glass} opacity={0.75} /> : <Path path={p.glass} color={glass} opacity={id === 'program' ? 0.9 : 0.85} />}
      <Path path={p.lamp} color={lamp} />
      <Path path={p.hot} color="#ff5a48" />
      <Group transform={[{ translateX: -1 }, { translateY: -1.2 }]}>
        <Path path={p.body} style="stroke" strokeWidth={1.2} color="#e6e9ef" opacity={0.28} />
      </Group>
      <Path path={p.body} style="stroke" strokeWidth={2.4} color={bad ? RED : lit ? AMBER : '#060607'} />
    </Group>
  );
}

/** The console in the middle, from above: a meter bridge, three channel
 *  strips (gain and EQ knobs over a long-throw fader), the master section. */
function Console({ h }: { h: number }) {
  const p = useMemo(() => {
    const body = make();
    const bridge = make();
    const knobs = make();
    const caps = make();
    const slots = make();
    const leds = make();
    const y0 = h * 0.18;
    const y1 = h * 0.82;
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(MIX.x0, y0, MIX.x1 - MIX.x0, y1 - y0), 10, 10));
    bridge.addRRect(Skia.RRectXY(Skia.XYWHRect(MIX.x0 + 6, y0 + 6, MIX.x1 - MIX.x0 - 12, 26), 4, 4));
    for (let k = 0; k < 3; k++) {
      const x = MIX.x0 + 20 + k * 25;
      for (let j = 0; j < 5; j++) leds.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 4, y0 + 26 - j * 4.2, 8, 2.8), 1, 1));
      for (let j = 0; j < 4; j++) knobs.addCircle(x, y0 + 46 + j * 17, 6.5);
      slots.moveTo(x, y0 + 126);
      slots.lineTo(x, y1 - 16);
      caps.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 9, y0 + 126 + (y1 - y0 - 160) * (0.35 + (k % 3) * 0.12), 18, 24), 3, 3));
    }
    return { body, bridge, knobs, caps, slots, leds };
  }, [h]);
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#4f535c', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.bridge} color="#0b0c0f" />
      <Path path={p.leds} color="#5bff85" opacity={0.85} />
      <Path path={p.knobs}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + 60)} colors={['#9aa0aa', '#3a3d45']} />
      </Path>
      <Path path={p.knobs} style="stroke" strokeWidth={1.4} color="#050506" />
      <Path path={p.slots} style="stroke" strokeWidth={4} strokeCap="round" color="#050506" />
      <Path path={p.caps}>
        <LinearGradient start={vec(b.x, 0)} end={vec(b.x, 40)} colors={['#e6e9ef', '#7c818b']} />
      </Path>
      <Path path={p.caps} style="stroke" strokeWidth={1.2} color="#050506" />
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
