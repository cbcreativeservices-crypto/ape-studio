/**
 * fxArt — Screen 13's drawings: the mixer's EFFECTS SECTION as the real
 * panel (authored in mm, 300 × 84), the ROUTING MAP of where the effect sits
 * in the signal path (s2Diagram), and the FX SCOPE — the level going INTO
 * the effect and coming OUT of it over the last seconds, from the render's
 * own 10 ms blocks (never a drawing of an echo), with the deck's beat lines.
 *
 * Generic hardware: no brand likeness. Legends at real silk-screen size
 * (4 mm) appear when the zoom renders them at 9 pt or more; the LCD's lines
 * are drawn large enough to read on a phone.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { Key, Knob, SlideSwitch } from './parts';
import { useMotion } from './motion';
import { SceneText } from './sceneText';
import { DNode, DWire, DLegend } from './s2Diagram';
import { fxTimeSec, fxTimeWord, usesFeedback, type FxState, type FxType } from '../model/djEffects';
import type { Box } from '../geometry/boothGeometry';

const LEG = 4;
export const FX_PANEL = { w: 300, h: 84 } as const;
/** Control centres on the panel (local mm). */
export const FXP = {
  type: { x: 30, y: 44, d: 24 },
  lcd: { x: 60, y: 14, w: 104, h: 50 },
  beatL: { x: 66, y: 68, w: 22, h: 10 },
  beatR: { x: 136, y: 68, w: 22, h: 10 },
  level: { x: 186, y: 34, d: 22 },
  feedback: { x: 222, y: 34, d: 18 },
  send1: { x: 186, y: 68, d: 13 },
  send2: { x: 222, y: 68, d: 13 },
  route: { x: 256, y: 34, d: 18 },
  ret: { x: 244, y: 64, w: 24, h: 8 },
  on: { x: 270, y: 58, w: 22, h: 18 },
} as const;
export type FxPart = 'type' | 'time' | 'level' | 'feedback' | 'sends' | 'route' | 'ret' | 'on';

/** Each part's box (local mm), for halos and as label obstacles. */
export function fxPartBox(p: FxPart): Box {
  const k = (c: { x: number; y: number; d: number }) => ({ x: c.x - c.d * 0.8, y: c.y - c.d * 0.8, w: c.d * 1.6, h: c.d * 1.6 });
  switch (p) {
    case 'type': return k(FXP.type);
    case 'time': return { x: FXP.lcd.x - 2, y: FXP.lcd.y - 2, w: FXP.lcd.w + 4, h: FXP.beatL.y + FXP.beatL.h - FXP.lcd.y + 4 };
    case 'level': return k(FXP.level);
    case 'feedback': return k(FXP.feedback);
    case 'sends': return { x: FXP.send1.x - 10, y: FXP.send1.y - 9, w: FXP.send2.x - FXP.send1.x + 20, h: 18 };
    case 'route': return k(FXP.route);
    case 'ret': return { x: FXP.ret.x - 2, y: FXP.ret.y - 2, w: FXP.ret.w + 4, h: FXP.ret.h + 4 };
    case 'on': return { x: FXP.on.x - 2, y: FXP.on.y - 2, w: FXP.on.w + 4, h: FXP.on.h + 4 };
  }
}
export const FX_PARTS: readonly FxPart[] = ['type', 'time', 'level', 'feedback', 'sends', 'route', 'ret', 'on'];

const TYPE_POS: Record<FxType, number> = { ECHO: 0.2, REVERB: 0.4, FILTER: 0.6, FLANGER: 0.8 };
const ROUTE_POS = { CH1: 0.2, CH2: 0.4, MASTER: 0.6, SEND: 0.8 } as const;

/** The effects section of the mixer, seen from above, in its real state. */
export function FxPanel({ x, y, fx, bpm, highlight = [] }: { x: number; y: number; fx: FxState; bpm: number; highlight?: readonly FxPart[] }) {
  const W = FX_PANEL.w;
  const H = FX_PANEL.h;
  const L = FXP.lcd;
  const ms = Math.round(fxTimeSec(fx, bpm) * 1000);
  const fbLive = usesFeedback(fx.type);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={3} y={5} width={W} height={H} r={8} color="rgba(0,0,0,0.7)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={8}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={W - 1.2} height={H - 1.2} r={7.5} style="stroke" strokeWidth={1.1} color={INK.bevel} />
      <SceneText x={10} y={10} size={LEG} text="EFFECTS" color={INK.amber} face="label" />
      {/* TYPE: a rotary selector with its four legends around it */}
      <Knob cx={FXP.type.x} cy={FXP.type.y} d={FXP.type.d} value={TYPE_POS[fx.type]} capTone="black" scale={false} />
      {(['ECHO', 'REVERB', 'FILTER', 'FLANGER'] as FxType[]).map((t) => {
        const a = (-150 + TYPE_POS[t] * 300) * (Math.PI / 180);
        const r = FXP.type.d * 0.82;
        return <SceneText key={t} x={FXP.type.x + Math.sin(a) * r} y={FXP.type.y - Math.cos(a) * r + 1.5} size={3.2} text={t} color={fx.type === t ? INK.amber : INK.printDim} face="label" align="center" />;
      })}
      {/* the LCD: type, time and tempo, in lines big enough to read */}
      <RoundedRect x={L.x - 1.5} y={L.y - 1.5} width={L.w + 3} height={L.h + 3} r={4} color="#050506" />
      <RoundedRect x={L.x} y={L.y} width={L.w} height={L.h} r={3}>
        <LinearGradient start={vec(0, L.y)} end={vec(0, L.y + L.h)} colors={[INK.lcdHi, INK.lcdLo]} />
      </RoundedRect>
      <SceneText x={L.x + 5} y={L.y + 13} size={8.4} text={fx.type} color={fx.on ? INK.amber : INK.printDim} face="label" />
      <SceneText x={L.x + L.w - 5} y={L.y + 13} size={8.4} text={fx.on ? 'ON' : 'OFF'} color={fx.on ? INK.green : INK.printDim} face="label" align="right" />
      <SceneText x={L.x + L.w / 2} y={L.y + 31} size={12} text={fxTimeWord(fx.type, fx.time)} color={INK.white} face="label" align="center" />
      <SceneText x={L.x + L.w / 2} y={L.y + 45} size={7.6} text={fx.type === 'REVERB' ? 'DECAY' : `${ms} ms · ${bpm.toFixed(1)} BPM`} color={INK.blue} face="mono" align="center" />
      <RoundedRect x={L.x} y={L.y} width={L.w} height={L.h * 0.42} r={3} color="rgba(140,180,230,0.05)" />
      <Key x={FXP.beatL.x} y={FXP.beatL.y} w={FXP.beatL.w} h={FXP.beatL.h} />
      <Key x={FXP.beatR.x} y={FXP.beatR.y} w={FXP.beatR.w} h={FXP.beatR.h} />
      <SceneText x={FXP.beatL.x + FXP.beatL.w / 2} y={FXP.beatL.y + 6.6} size={LEG} text="<" color={INK.print} face="label" align="center" />
      <SceneText x={FXP.beatR.x + FXP.beatR.w / 2} y={FXP.beatR.y + 6.6} size={LEG} text=">" color={INK.print} face="label" align="center" />
      <SceneText x={(FXP.beatL.x + FXP.beatR.x + FXP.beatR.w) / 2} y={FXP.beatL.y + 7} size={LEG} text="BEAT" color={INK.printDim} face="label" align="center" />
      {/* LEVEL/DEPTH (dry/wet, or RETURN on a send) and FEEDBACK */}
      <Knob cx={FXP.level.x} cy={FXP.level.y} d={FXP.level.d} value={fx.wet} arc={fx.on ? INK.amber : undefined} />
      <SceneText x={FXP.level.x} y={FXP.level.y - FXP.level.d * 0.85} size={LEG} text={fx.route === 'SEND' ? 'RETURN' : 'LEVEL'} color={INK.print} face="label" align="center" />
      <Group opacity={fbLive ? 1 : 0.45}>
        <Knob cx={FXP.feedback.x} cy={FXP.feedback.y} d={FXP.feedback.d} value={fx.feedback} />
        <SceneText x={FXP.feedback.x} y={FXP.feedback.y - FXP.feedback.d * 0.9} size={LEG} text="FEEDBACK" color={INK.print} face="label" align="center" />
      </Group>
      <Knob cx={FXP.send1.x} cy={FXP.send1.y} d={FXP.send1.d} value={fx.send[1]} />
      <Knob cx={FXP.send2.x} cy={FXP.send2.y} d={FXP.send2.d} value={fx.send[2]} />
      <SceneText x={FXP.send1.x} y={FXP.send1.y + 12} size={3.4} text="SEND 1" color={INK.printDim} face="label" align="center" />
      <SceneText x={FXP.send2.x} y={FXP.send2.y + 12} size={3.4} text="SEND 2" color={INK.printDim} face="label" align="center" />
      {/* CH SELECT: 1 · 2 · MST · SEND */}
      <Knob cx={FXP.route.x} cy={FXP.route.y} d={FXP.route.d} value={ROUTE_POS[fx.route]} capTone="black" scale={false} />
      {(['CH1', 'CH2', 'MASTER', 'SEND'] as const).map((t) => {
        const a = (-150 + ROUTE_POS[t] * 300) * (Math.PI / 180);
        const r = FXP.route.d * 0.86;
        const word = t === 'MASTER' ? 'MST' : t === 'CH1' ? '1' : t === 'CH2' ? '2' : 'SEND';
        return <SceneText key={t} x={FXP.route.x + Math.sin(a) * r} y={FXP.route.y - Math.cos(a) * r + 1.4} size={3.2} text={word} color={fx.route === t ? INK.amber : INK.printDim} face="label" align="center" />;
      })}
      <SlideSwitch x={FXP.ret.x} y={FXP.ret.y} w={FXP.ret.w} h={FXP.ret.h} pos={fx.returnTo === 'BUS' ? 0 : 1} positions={2} />
      <SceneText x={FXP.ret.x + FXP.ret.w / 2} y={FXP.ret.y + 13} size={3.2} text="RETURN TO BUS · CH2" color={INK.printDim} face="label" align="center" />
      {/* FX ON */}
      <Key x={FXP.on.x} y={FXP.on.y} w={FXP.on.w} h={FXP.on.h} lit={fx.on} colour={INK.red} />
      <SceneText x={FXP.on.x + FXP.on.w / 2} y={FXP.on.y + 11.4} size={LEG} text="ON" color={fx.on ? INK.white : INK.print} face="label" align="center" />
      {highlight.map((h) => (
        <RoundedRect key={h} x={fxPartBox(h).x} y={fxPartBox(h).y} width={fxPartBox(h).w} height={fxPartBox(h).h} r={5} style="stroke" strokeWidth={1.2} color={INK.amber} opacity={0.9} />
      ))}
    </Group>
  );
}

/* ── the routing map ─────────────────────────────────────────────────── */

export const ROUTE_MAP = { w: 300, h: 150 } as const;
const N = {
  deckA: { x: 0, y: 10, w: 40, h: 24 },
  deckB: { x: 0, y: 66, w: 40, h: 24 },
  ch1: { x: 52, y: 10, w: 48, h: 24 },
  ch2: { x: 52, y: 66, w: 48, h: 24 },
  ins1: { x: 112, y: 10, w: 48, h: 24 },
  ins2: { x: 112, y: 66, w: 48, h: 24 },
  bus: { x: 172, y: 36, w: 34, h: 28 },
  mfx: { x: 213, y: 36, w: 48, h: 28 },
  out: { x: 268, y: 36, w: 34, h: 28 },
  sfx: { x: 112, y: 116, w: 48, h: 24 },
} as const;
const mid = (b: Box): [number, number] => [b.x + b.w / 2, b.y + b.h / 2];
const right = (b: Box): [number, number] => [b.x + b.w, b.y + b.h / 2];
const left = (b: Box): [number, number] => [b.x, b.y + b.h / 2];

/**
 * Where the effect sits: the four places it can go (dashed when empty), the
 * channel and bus wires lit by what is really playing, the SEND taps and
 * the RETURN — drawn RED, round to channel 2, when it makes a loop.
 */
export function FxRouteMap({ x, y, fx, live, loop, flow }: { x: number; y: number; fx: FxState; live: { a: boolean; b: boolean; bus: boolean; fx: boolean }; loop: boolean; flow: boolean }) {
  const slot = fx.route === 'CH1' ? 'ins1' : fx.route === 'CH2' ? 'ins2' : fx.route === 'MASTER' ? 'mfx' : 'sfx';
  const unit = (k: keyof typeof N, title: string) =>
    slot === k ? <DNode b={N[k]} title={fx.type} sub={fx.on ? 'FX ON' : 'FX OFF'} live={fx.on || live.fx} tone={fx.on ? 'amber' : 'plain'} /> : <DNode b={N[k]} title={title} slot />;
  const sendOn = fx.route === 'SEND';
  const toCh2 = sendOn && fx.returnTo === 'CH2';
  const sx1 = N.ch1.x + N.ch1.w + 5;
  const sx2 = N.ch2.x + N.ch2.w + 7;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <DNode b={N.deckA} title="DECK A" live={live.a} tone="blue" />
      <DNode b={N.deckB} title="DECK B" live={live.b} tone="blue" />
      <DNode b={N.ch1} title="CH1" sub="FADER" live={live.a} tone="blue" />
      <DNode b={N.ch2} title="CH2" sub="FADER" live={live.b || (toCh2 && live.fx)} tone={toCh2 && loop ? 'red' : 'blue'} />
      {unit('ins1', 'INSERT 1')}
      {unit('ins2', 'INSERT 2')}
      {unit('mfx', 'MASTER FX')}
      {unit('sfx', 'SEND FX')}
      <DNode b={N.bus} title="MIX" sub="BUS" live={live.bus} tone="blue" />
      <DNode b={N.out} title="CROWD" sub="MASTER" live={live.bus} tone="blue" />
      <DWire pts={[right(N.deckA), left(N.ch1)]} kind="audio" live={live.a} flow={flow} />
      <DWire pts={[right(N.deckB), left(N.ch2)]} kind="audio" live={live.b} flow={flow} />
      <DWire pts={[right(N.ch1), left(N.ins1)]} kind="audio" live={live.a} flow={flow} />
      <DWire pts={[right(N.ch2), left(N.ins2)]} kind="audio" live={live.b || (toCh2 && live.fx)} flow={flow} />
      <DWire pts={[right(N.ins1), [166, 22], [166, 44], left(N.bus)]} kind="audio" live={live.a || (fx.route === 'CH1' && live.fx)} flow={flow} />
      <DWire pts={[right(N.ins2), [166, 78], [166, 56], [N.bus.x, 56]]} kind="audio" live={live.b || (fx.route === 'CH2' && live.fx)} flow={flow} />
      <DWire pts={[right(N.bus), left(N.mfx)]} kind="audio" live={live.bus} flow={flow} />
      <DWire pts={[right(N.mfx), left(N.out)]} kind="audio" live={live.bus} flow={flow} />
      {/* the SEND taps (after the faders) and the RETURN */}
      <DWire pts={[[sx1, mid(N.ch1)[1]], [sx1, 46], [104, 46], [104, 124], left(N.sfx)]} kind="audio" live={sendOn && fx.send[1] > 0 && live.a} w={1.1} />
      <DWire pts={[[sx2, mid(N.ch2)[1]], [sx2, 102], [106, 102], [106, 132], [N.sfx.x, 132]]} kind={toCh2 && fx.send[2] > 0 ? 'loop' : 'audio'} live={sendOn && fx.send[2] > 0 && (live.b || (toCh2 && live.fx))} w={1.1} />
      <SceneText x={sx1 + 2} y={44} size={8} text="SEND 1" color={INK.printDim} face="label" />
      <SceneText x={sx2 - 40} y={100} size={8} text="SEND 2" color={INK.printDim} face="label" />
      {toCh2 ? (
        <DWire pts={[right(N.sfx), [176, 128], [176, 100], [46, 100], [46, 78], left(N.ch2)]} kind={loop ? 'loop' : 'audio'} live={live.fx} />
      ) : (
        <DWire pts={[right(N.sfx), [189, 128], [189, N.bus.y + N.bus.h]]} kind="audio" live={sendOn && live.fx} />
      )}
      <SceneText x={toCh2 ? 178 : 192} y={124} size={8} text={toCh2 ? 'RETURN TO CH2' : 'RETURN'} color={toCh2 && loop ? INK.red : INK.printDim} face="label" />
      <DLegend x={218} y={140} kinds={loop ? ['audio', 'loop'] : ['audio']} size={8} />
    </Group>
  );
}

/** Each map block's box (local mm), for callouts and obstacles. */
export const ROUTE_NODES = N;

/* ── the FX scope ─────────────────────────────────────────────────────── */

export type FxSeg = { t0: number; inDb: Float32Array; outDb: Float32Array };

const SPAN_S = 3.2;
const TOP_DB = 0;
const BOT_DB = -48;

/**
 * The level INTO the effect (white) and OUT of it (blue), per 10 ms block,
 * scrolling right to left under the one clock; the deck's beat lines (thin)
 * and, for an echo, a bar the length of one delay so the repeats can be
 * checked against it. Screen points.
 */
export function FxScope({ b, segs, beatTimes, delaySec, k = 1, title }: { b: Box; segs: readonly FxSeg[]; beatTimes: readonly number[]; delaySec: number | null; k?: number; title: string }) {
  const { clock } = useMotion();
  const inner = { x: b.x + 6, y: b.y + 18 * k, w: b.w - 12, h: b.h - 24 * k };
  const pps = inner.w / SPAN_S;
  const yOf = (db: number) => inner.y + ((TOP_DB - Math.max(BOT_DB, Math.min(TOP_DB, db))) / (TOP_DB - BOT_DB)) * inner.h;
  // paths in POINTS from a reference time, so strokes keep their width;
  // the clock only translates them
  const tRef = segs.length ? segs[0].t0 : 0;
  const paths = useMemo(() => {
    const X = (t: number) => (t - tRef) * pps;
    const pin = Skia.PathBuilder.Make();
    const pout = Skia.PathBuilder.Make();
    const fill = Skia.PathBuilder.Make();
    for (const s of segs) {
      const n = s.inDb.length;
      for (let i = 0; i < n; i++) {
        const x = X(s.t0 + i * 0.01);
        if (i === 0) {
          pin.moveTo(x, yOf(s.inDb[i]));
          pout.moveTo(x, yOf(s.outDb[i]));
          fill.moveTo(x, yOf(BOT_DB));
        } else {
          pin.lineTo(x, yOf(s.inDb[i]));
          pout.lineTo(x, yOf(s.outDb[i]));
        }
        fill.lineTo(x, yOf(s.outDb[i]));
      }
      if (n) fill.lineTo(X(s.t0 + (n - 1) * 0.01), yOf(BOT_DB));
      fill.close();
    }
    const beats = Skia.PathBuilder.Make();
    for (const t of beatTimes) {
      beats.moveTo(X(t), inner.y);
      beats.lineTo(X(t), inner.y + inner.h);
    }
    return { pin: pin.detach(), pout: pout.detach(), fill: fill.detach(), beats: beats.detach() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segs, beatTimes, inner.y, inner.h, pps, tRef]);
  // time on x: "now" at the right edge
  const right0 = inner.x + inner.w;
  const xf = useDerivedValue(() => [{ translateX: right0 - (clock.value - tRef) * pps }]);
  const fs = 9.5 * k;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      {[-12, -24, -36].map((d) => (
        <Line key={d} p1={vec(inner.x, yOf(d))} p2={vec(inner.x + inner.w, yOf(d))} color="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      <Group clip={Skia.XYWHRect(inner.x, inner.y, inner.w, inner.h)}>
        <Group transform={xf}>
          <Path path={paths.fill}>
            <LinearGradient start={vec(0, inner.y)} end={vec(0, inner.y + inner.h)} colors={['rgba(111,168,255,0.40)', 'rgba(111,168,255,0.02)']} />
          </Path>
          <Path path={paths.pin} style="stroke" strokeWidth={1.2} color="rgba(244,246,248,0.6)" strokeJoin="round" />
          <Path path={paths.pout} style="stroke" strokeWidth={3} color={INK.blue} opacity={0.35} strokeJoin="round">
            <BlurMask blur={2} style="normal" />
          </Path>
          <Path path={paths.pout} style="stroke" strokeWidth={1.8} color={INK.blue} strokeJoin="round" />
          {/* the deck's beats, on top (thin, keylined) */}
          <Path path={paths.beats} style="stroke" strokeWidth={2.4} color="rgba(0,0,0,0.5)" />
          <Path path={paths.beats} style="stroke" strokeWidth={1} color="rgba(255,198,77,0.55)" />
        </Group>
      </Group>
      <Line p1={vec(inner.x + inner.w, inner.y - 2)} p2={vec(inner.x + inner.w, inner.y + inner.h + 2)} color={INK.amber} strokeWidth={1.4} />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={fs} text={title} color={INK.amber} face="label" minPt={9.5} />
      <Circle cx={b.x + b.w - 136 * k} cy={b.y + 9.5 * k} r={3} color="rgba(244,246,248,0.7)" />
      <SceneText x={b.x + b.w - 130 * k} y={b.y + 13 * k} size={fs} text="INTO FX" color={INK.print} face="label" minPt={9.5} />
      <Circle cx={b.x + b.w - 68 * k} cy={b.y + 9.5 * k} r={3} color={INK.blue} />
      <SceneText x={b.x + b.w - 62 * k} y={b.y + 13 * k} size={fs} text="OUT OF IT" color={INK.blue} face="label" minPt={9.5} />
      {delaySec ? (
        <Group>
          <Line p1={vec(inner.x + inner.w - delaySec * pps, inner.y + inner.h - 3)} p2={vec(inner.x + inner.w, inner.y + inner.h - 3)} color={INK.amber} strokeWidth={2} />
          <SceneText x={inner.x + inner.w - delaySec * pps - 4} y={inner.y + inner.h - 0.5} size={fs} text="ONE DELAY" color={INK.amber} face="label" align="right" minPt={9.5} />
        </Group>
      ) : null}
      <SceneText x={inner.x + inner.w - 3} y={inner.y + 10 * k} size={fs} text="NOW" color={INK.amber} face="label" align="right" minPt={9.5} />
    </Group>
  );
}
