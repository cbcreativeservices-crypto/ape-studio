/**
 * PlayerTop — a club-class media player seen from above, AUTHORED IN
 * MILLIMETRES (320 × 410, geometry/boothGeometry.PLAYER: a 7-inch screen,
 * a Ø 206 mm jog, a 100 mm tempo fader). Generic: no brand likeness.
 *
 * What moves, and from what (one clock, motion.ts):
 *   - the SCREEN: the zoomed waveform (the real audio's peak envelope, RMS
 *     core and low band — waveDraw) scrolls past a fixed playhead at the
 *     deck's real position, the ANALYSED beat grid on top of it, the
 *     overview's playhead walks the whole track; time and bar.beat count
 *     from the same position;
 *   - the JOG display's position marker turns at 33⅓ rpm × the tempo rate;
 *   - PLAY is lit while the deck plays; hot-cue pads light once stored (and
 *     flash while a sampler pad on this deck sounds); the loop keys light
 *     while a loop holds; the tempo fader sits at the deck's pitch.
 *
 * The printed legends (LOAD, BACK, IN / OUT, SYNC, MASTER, QUANTIZE, the pad
 * numbers…) are drawn at their real silk-screen size and appear once the
 * zoom renders them at 9 pt or more (sceneText).
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { DeckId, DeckState } from '../model/djModel';
import { analysedGrid } from '../model/djDeck';
import { TRACKS, trackSeconds } from '../engine/djMusic';
import { PITCH_RANGE_PCT } from '../model/djTime';
import { PLAYER, PLAYER_D, PLAYER_W } from '../geometry/boothGeometry';
import { CUE_COLOURS, INK } from './ink';
import { Fader, Halo, Key, Knob, RoundButton } from './parts';
import { useDeckPos, useSpinAngle } from './motion';
import { GridOver, WaveBody } from './waveDraw';
import { SceneText } from './sceneText';

export type PlayerPart = 'screen' | 'browse' | 'load' | 'hotCues' | 'loop' | 'jump' | 'jog' | 'cue' | 'play' | 'sync' | 'quantize' | 'tempo' | 'slots';

export function playerPartBox(p: PlayerPart): { x: number; y: number; w: number; h: number } {
  const P = PLAYER;
  switch (p) {
    case 'screen': return { x: P.screen.x - 4, y: P.screen.y - 4, w: P.screen.w + 8, h: P.screen.h + 8 };
    case 'browse': return { x: P.browse.x - 16, y: P.browse.y - 16, w: 32, h: 32 };
    case 'load': return { x: P.load.x - 4, y: P.load.y - 4, w: P.load.w + 8, h: P.back.y + P.back.h - P.load.y + 8 };
    case 'hotCues': return { x: P.hotCues.xs[0] - 4, y: P.hotCues.y - 4, w: P.hotCues.xs[3] + P.hotCues.w - P.hotCues.xs[0] + 8, h: P.hotCues.h + 8 };
    case 'loop': return { x: P.loop.x - 4, y: P.loop.y - 4, w: P.loop.w + 8, h: P.loop.gap * 3 + P.loop.h + 8 };
    case 'jump': return { x: P.jump.x - 4, y: P.jump.y - 4, w: P.jump.w + 8, h: P.jump.gap + P.jump.h + 8 };
    case 'jog': return { x: P.jog.cx - P.jog.d / 2 - 5, y: P.jog.cy - P.jog.d / 2 - 5, w: P.jog.d + 10, h: P.jog.d + 10 };
    case 'cue': return { x: P.cue.cx - 22, y: P.cue.cy - 22, w: 44, h: 44 };
    case 'play': return { x: P.play.cx - 22, y: P.play.cy - 22, w: 44, h: 44 };
    case 'sync': return { x: P.sync.x - 4, y: P.sync.y - 4, w: P.sync.w + 8, h: P.masterBtn.y + P.masterBtn.h - P.sync.y + 8 };
    case 'quantize': return { x: P.quantize.x - 4, y: P.quantize.y - 4, w: P.quantize.w + 8, h: P.quantize.h + 8 };
    case 'tempo': return { x: P.tempo.x - 16, y: P.tempo.top - 14, w: 32, h: P.tempo.len + 28 };
    case 'slots': return { x: P.slots.usb.x - 4, y: P.slots.usb.y - 4, w: P.slots.usb.w + 8, h: P.slots.sd.y + P.slots.sd.h - P.slots.usb.y + 8 };
  }
}

/** Every control's box (local mm) — the labels' obstacles. */
export const PLAYER_PARTS: readonly PlayerPart[] = ['screen', 'browse', 'load', 'hotCues', 'loop', 'jump', 'jog', 'cue', 'play', 'sync', 'quantize', 'tempo', 'slots'];

/** Seconds of track visible across the zoomed waveform. */
export const ZOOM_SPAN_S = 6;

/** Legend type: 4 mm (capitals ≈ 3 mm, real silk-screen size). */
const LEG = 4;

/** The player's screen: zoomed waveform + grid, overview, readouts. */
function Screen({ d }: { d: DeckState }) {
  const S = PLAYER.screen;
  const pos = useDeckPos(d);
  const track = d.track;
  const grid = analysedGrid(d);
  // zoomed window (inside the screen)
  const zx = S.x + 4;
  const zw = S.w - 8;
  const zy = S.y + 16;
  const zh = 42;
  const zc = zy + zh / 2;
  const pxPerSec = zw / ZOOM_SPAN_S;
  const head = zx + zw / 2;
  const zoomXf = useDerivedValue(() => [{ translateX: head - pos.value * pxPerSec }, { translateY: zc }, { scaleX: pxPerSec }, { scaleY: zh / 2 - 1 }]);
  // overview strip
  const total = track ? trackSeconds(track) : 1;
  const ox = S.x + 4;
  const ow = S.w - 8;
  const oy = S.y + 62;
  const oh = 11;
  const overXf = useMemo(() => [{ translateX: ox }, { translateY: oy + oh / 2 }, { scaleX: ow / total }, { scaleY: oh / 2 - 0.5 }], [ox, oy, oh, ow, total]);
  const playX = useDerivedValue(() => ox + (pos.value / total) * ow);
  const playP1 = useDerivedValue(() => vec(playX.value, oy - 1));
  const playP2 = useDerivedValue(() => vec(playX.value, oy + oh + 1));
  const playedW = useDerivedValue(() => Math.max(0, playX.value - ox));
  // readouts
  const timeText = useDerivedValue(() => {
    const left = Math.max(0, total - 1 - pos.value);
    const m = Math.floor(left / 60);
    const s = left - m * 60;
    return `-${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  });
  const g = grid;
  // bar.beat, padded to a fixed five-character slot (right-aligned without
  // measuring a moving string: it can never run out of its window, D36)
  const barText = useDerivedValue(() => {
    if (!g) return '';
    const b = ((pos.value - g.firstBeatSec) * g.bpm) / 60;
    const t = b < 0 ? '0.0' : `${Math.floor(b / 4) + 1}.${(((Math.floor(b) % 4) + 4) % 4) + 1}`;
    return ('     ' + t).slice(-5);
  });
  const shownBpm = grid ? grid.bpm * (1 + d.pitch / 100) : 0;
  return (
    <Group>
      {/* bezel and glass */}
      <RoundedRect x={S.x - 3.5} y={S.y - 3.5} width={S.w + 7} height={S.h + 7} r={5} color="#050506" />
      <RoundedRect x={S.x - 3.5} y={S.y - 3.5} width={S.w + 7} height={S.h + 7} r={5} style="stroke" strokeWidth={0.7} color="rgba(255,255,255,0.08)" />
      <RoundedRect x={S.x} y={S.y} width={S.w} height={S.h} r={2.5}>
        <LinearGradient start={vec(S.x, S.y)} end={vec(S.x, S.y + S.h)} colors={[INK.lcdHi, INK.lcdLo]} />
      </RoundedRect>
      <Group clip={Skia.XYWHRect(S.x, S.y, S.w, S.h)}>
        {track ? (
          <>
            <SceneText x={S.x + 4} y={S.y + 11.5} size={9.5} text={TRACKS[track].title.toUpperCase()} color={INK.white} face="label" />
            <SceneText x={S.x + S.w - 4} y={S.y + 11.5} size={9.5} text={shownBpm.toFixed(1)} color={INK.amber} align="right" />
          </>
        ) : null}
        {/* zoomed waveform */}
        <Group clip={Skia.XYWHRect(zx, zy, zw, zh)}>
          <Rect x={zx} y={zy} width={zw} height={zh} color="#040a11" />
          {track ? (
            <Group transform={zoomXf}>
              <WaveBody id={track} />
              {grid ? <GridOver id={track} grid={grid} pps={pxPerSec} k={0.45} /> : null}
            </Group>
          ) : null}
          {d.loop && track ? <LoopBand d={d} head={head} pxPerSec={pxPerSec} zy={zy} zh={zh} /> : null}
          {track ? <CueMarks d={d} head={head} pxPerSec={pxPerSec} zy={zy} zh={zh} /> : null}
          {track ? (
            <Group>
              <Line p1={vec(head, zy)} p2={vec(head, zy + zh)} color="rgba(0,0,0,0.7)" strokeWidth={1.8} />
              <Line p1={vec(head, zy)} p2={vec(head, zy + zh)} color={INK.white} strokeWidth={0.8} />
            </Group>
          ) : null}
        </Group>
        {/* overview */}
        {track ? (
          <Group>
            <Rect x={ox} y={oy} width={ow} height={oh} color="#040a11" />
            <Group transform={overXf}>
              <WaveBody id={track} step={4} low={false} />
            </Group>
            <Rect x={ox} y={oy} width={playedW} height={oh} color="rgba(0,0,0,0.45)" />
            <Line p1={playP1} p2={playP2} color={INK.white} strokeWidth={0.9} />
          </Group>
        ) : null}
        {/* an empty deck says so, on a clean screen (no playhead through it) */}
        {track ? null : (
          <>
            <SceneText x={S.x + S.w / 2} y={S.y + 40} size={14} text="NO TRACK" color={INK.print} face="label" align="center" />
            <SceneText x={S.x + S.w / 2} y={S.y + 62} size={13} text="BROWSE TO LOAD" color={INK.printDim} face="label" align="center" />
          </>
        )}
        {track ? (
          <>
            <SceneText x={S.x + 4} y={S.y + S.h - 3.5} size={9} text={timeText} color={INK.white} />
            <SceneText x={S.x + S.w / 2} y={S.y + S.h - 3.5} size={9} text={`${d.pitch >= 0 ? '+' : '−'}${Math.abs(d.pitch).toFixed(1)}%`} color={INK.print} align="center" />
            <SceneText x={S.x + S.w - 4} y={S.y + S.h - 3.5} size={9} text={barText} color={INK.amber} align="right" slot={5} />
          </>
        ) : null}
      </Group>
      {/* the glass's reflection */}
      <RoundedRect x={S.x} y={S.y} width={S.w} height={S.h * 0.42} r={2.5} color={INK.lcdGlass} />
    </Group>
  );
}

function LoopBand({ d, head, pxPerSec, zy, zh }: { d: DeckState; head: number; pxPerSec: number; zy: number; zh: number }) {
  const pos = useDeckPos(d);
  const s0 = d.loop!.startSec;
  const len = d.loop!.lengthSec;
  const x = useDerivedValue(() => head + (s0 - pos.value) * pxPerSec);
  return <Rect x={x} y={zy} width={len * pxPerSec} height={zh} color="rgba(91,255,133,0.16)" />;
}

function CueMarks({ d, head, pxPerSec, zy, zh }: { d: DeckState; head: number; pxPerSec: number; zy: number; zh: number }) {
  const pos = useDeckPos(d);
  const marks = [{ t: d.cueSec, c: INK.amber }, ...d.hotCues.map((t, i) => (t == null ? null : { t, c: CUE_COLOURS[i] })).filter(Boolean)] as { t: number; c: string }[];
  const xf = useDerivedValue(() => [{ translateX: head - pos.value * pxPerSec }]);
  const tri = useMemo(() => {
    const out: { path: ReturnType<typeof Skia.Path.Make>; c: string }[] = [];
    for (const m of marks) {
      const p = Skia.PathBuilder.Make();
      const x = m.t * pxPerSec;
      p.moveTo(x - 2.4, zy);
      p.lineTo(x + 2.4, zy);
      p.lineTo(x, zy + 3.6);
      p.close();
      p.moveTo(x, zy + 3.6);
      p.lineTo(x, zy + zh);
      out.push({ path: p.detach(), c: m.c });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.cueSec, d.hotCues.join(','), pxPerSec, zy, zh]);
  return (
    <Group transform={xf}>
      {tri.map((m, i) => (
        <Path key={i} path={m.path} color={m.c} style="stroke" strokeWidth={0.7} />
      ))}
      {tri.map((m, i) => (
        <Path key={`f${i}`} path={m.path} color={m.c} />
      ))}
    </Group>
  );
}

/** The jog wheel: a brushed metal ring, the touch plate and its centre
 *  display, whose marker turns with the music. */
function Jog({ d }: { d: DeckState }) {
  const J = PLAYER.jog;
  const r = J.d / 2;
  const angle = useSpinAngle(d);
  const markerXf = useDerivedValue(() => [{ rotate: angle.value }]);
  const dimples = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      p.addCircle(J.cx + Math.cos(a) * r * 0.89, J.cy + Math.sin(a) * r * 0.89, 0.9);
    }
    return p.detach();
  }, [J.cx, J.cy, r]);
  const progress = useDeckPos(d);
  const total = d.track ? trackSeconds(d.track) : 1;
  const dispR = J.displayD / 2;
  const arc = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    const f = Math.max(0, Math.min(1, progress.value / total));
    p.addArc(Skia.XYWHRect(J.cx - dispR * 0.86, J.cy - dispR * 0.86, dispR * 1.72, dispR * 1.72), -90, Math.max(0.5, f * 360));
    return p.detach();
  });
  return (
    <Group>
      <Circle cx={J.cx + 3} cy={J.cy + 5} r={r + 2} color="rgba(0,0,0,0.7)">
        <BlurMask blur={8} style="normal" />
      </Circle>
      {/* the outer platter ring: brushed aluminium */}
      <Circle cx={J.cx} cy={J.cy} r={r}>
        <SweepGradient c={vec(J.cx, J.cy)} colors={['#9da3ac', '#d9dde3', '#7d838c', '#c5cad1', '#8b919a', '#e0e4ea', '#9da3ac']} />
      </Circle>
      <Circle cx={J.cx} cy={J.cy} r={r} style="stroke" strokeWidth={1.2} color="rgba(0,0,0,0.5)" />
      {/* the touch plate */}
      <Circle cx={J.cx} cy={J.cy} r={r * 0.93}>
        <RadialGradient c={vec(J.cx - r * 0.3, J.cy - r * 0.35)} r={r * 1.3} colors={['#34373d', '#17181b', '#0b0c0e']} positions={[0, 0.55, 1]} />
      </Circle>
      <Path path={dimples} color="rgba(0,0,0,0.55)" />
      {/* the centre display */}
      <Circle cx={J.cx} cy={J.cy} r={dispR + 2} color="#050506" />
      <Circle cx={J.cx} cy={J.cy} r={dispR}>
        <RadialGradient c={vec(J.cx, J.cy - dispR * 0.4)} r={dispR * 1.3} colors={[INK.lcdHi, INK.lcdLo]} />
      </Circle>
      <Circle cx={J.cx} cy={J.cy} r={dispR * 0.86} style="stroke" strokeWidth={2.2} color="rgba(255,255,255,0.08)" />
      {d.track ? <Path path={arc} style="stroke" strokeWidth={2.2} color={INK.blue} strokeCap="round" /> : null}
      <Group origin={vec(J.cx, J.cy)} transform={markerXf}>
        <RoundedRect x={J.cx - 1.6} y={J.cy - dispR * 0.98} width={3.2} height={dispR * 0.4} r={1.2} color={INK.white} />
      </Group>
      {/* the glass dome highlight */}
      <Circle cx={J.cx - dispR * 0.3} cy={J.cy - dispR * 0.4} r={dispR * 0.35} color="rgba(255,255,255,0.10)">
        <BlurMask blur={dispR * 0.25} style="normal" />
      </Circle>
      <Circle cx={J.cx - r * 0.45} cy={J.cy - r * 0.55} r={r * 0.25} color="rgba(255,255,255,0.06)">
        <BlurMask blur={r * 0.2} style="normal" />
      </Circle>
    </Group>
  );
}

/** A legend in the panel's print colour, at silk-screen size. */
function Leg({ x, y, t, align = 'center', dim = false, size = LEG }: { x: number; y: number; t: string; align?: 'left' | 'center' | 'right'; dim?: boolean; size?: number }) {
  return <SceneText x={x} y={y} size={size} text={t} color={dim ? INK.printDim : INK.print} face="label" align={align} />;
}

/** Stage 2 (Screen 14, additive — drawn only on a deck that carries the
 *  setting): KEY LOCK (lit when on) and KEY − / KEY + in the clear space left
 *  of the tempo-range key, outside the jog's well. */
export const KEY_LOCK_KEYS = { lock: { x: 232, y: 352, w: 38, h: 10 }, minus: { x: 232, y: 372, w: 17, h: 9 }, plus: { x: 253, y: 372, w: 17, h: 9 } } as const;
function KeyLockKeys({ d }: { d: DeckState }) {
  const K = KEY_LOCK_KEYS;
  const sh = d.keyShift ?? 0;
  return (
    <Group>
      <Key x={K.lock.x} y={K.lock.y} w={K.lock.w} h={K.lock.h} lit={!!d.keyLock} colour={INK.blue} />
      <Leg x={K.lock.x + K.lock.w / 2} y={K.lock.y + K.lock.h / 2 + 3.4 * 0.36} t="KEY LOCK" size={3.4} />
      <Key x={K.minus.x} y={K.minus.y} w={K.minus.w} h={K.minus.h} lit={sh < 0} colour={INK.amber} />
      <Key x={K.plus.x} y={K.plus.y} w={K.plus.w} h={K.plus.h} lit={sh > 0} colour={INK.amber} />
      <Leg x={K.minus.x + K.minus.w / 2} y={K.minus.y + K.minus.h / 2 + 3.4 * 0.36} t="KEY −" size={3.4} />
      <Leg x={K.plus.x + K.plus.w / 2} y={K.plus.y + K.plus.h / 2 + 3.4 * 0.36} t="KEY +" size={3.4} />
    </Group>
  );
}

export const PlayerTop = memo(function PlayerTop({ x, y, deck, d, highlight = [], quantizeLit, syncLit, padFlash }: { x: number; y: number; deck: DeckId; d: DeckState; highlight?: readonly PlayerPart[]; quantizeLit?: boolean; syncLit?: boolean; padFlash?: boolean }) {
  const P = PLAYER;
  const W = PLAYER_W;
  const D = PLAYER_D;
  // Stage 2 (additive): a deck may carry its own tempo range (±16 % on Screen 14)
  const range = d.tempoRange ?? PITCH_RANGE_PCT;
  const tempoValue = 1 - (d.pitch + range) / (2 * range);
  const loopWords = ['IN', 'OUT', 'EXIT', '4 BEAT'];
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={5} y={9} width={W} height={D} r={14} color="rgba(0,0,0,0.75)">
        <BlurMask blur={10} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={D} r={14}>
        <LinearGradient start={vec(0, 0)} end={vec(W, D)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} positions={[0, 0.45, 1]} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={W - 1.2} height={D - 1.2} r={13.5} style="stroke" strokeWidth={1.2} color={INK.bevel} />
      {/* the jog's recessed well */}
      <Circle cx={P.jog.cx} cy={P.jog.cy} r={P.jog.d / 2 + 7} color="#0d0e11" />
      <Circle cx={P.jog.cx} cy={P.jog.cy} r={P.jog.d / 2 + 7} style="stroke" strokeWidth={0.9} color="rgba(255,255,255,0.07)" />
      {/* media slots */}
      <RoundedRect x={P.slots.usb.x} y={P.slots.usb.y} width={P.slots.usb.w} height={P.slots.usb.h} r={1.5} color="#050506" />
      <RoundedRect x={P.slots.usb.x + 5} y={P.slots.usb.y + 2.2} width={P.slots.usb.w - 10} height={P.slots.usb.h - 4.4} r={0.8} color="#1e2a3a" />
      <RoundedRect x={P.slots.sd.x} y={P.slots.sd.y} width={P.slots.sd.w} height={P.slots.sd.h} r={1.2} color="#050506" />
      <Leg x={P.slots.usb.x + P.slots.usb.w / 2} y={P.slots.usb.y - 3} t="USB" />
      <Leg x={P.slots.sd.x + P.slots.sd.w / 2} y={P.slots.sd.y + P.slots.sd.h + 5} t="SD" dim />
      <Screen d={d} />
      <Knob cx={P.browse.x} cy={P.browse.y} d={P.browse.d} value={0.5} scale={false} capTone="black" />
      <Leg x={P.browse.x} y={P.browse.y - P.browse.d / 2 - 4} t="BROWSE" />
      <Key x={P.load.x} y={P.load.y} w={P.load.w} h={P.load.h} />
      <Key x={P.back.x} y={P.back.y} w={P.back.w} h={P.back.h} />
      <Leg x={P.load.x + P.load.w / 2} y={P.load.y + P.load.h / 2 + LEG * 0.36} t="LOAD" />
      <Leg x={P.back.x + P.back.w / 2} y={P.back.y + P.back.h / 2 + LEG * 0.36} t="BACK" />
      {/* hot cue pads (numbered) */}
      {P.hotCues.xs.map((hx, i) => (
        <Group key={i}>
          <Key x={hx} y={P.hotCues.y} w={P.hotCues.w} h={P.hotCues.h} lit={d.hotCues[i] != null || !!padFlash} colour={CUE_COLOURS[i]} />
          <Leg x={hx + P.hotCues.w / 2} y={P.hotCues.y + P.hotCues.h / 2 + 5 * 0.36} t={String(i + 1)} size={5} />
        </Group>
      ))}
      <Leg x={P.hotCues.xs[0]} y={P.hotCues.y - 3} t="HOT CUE" align="left" dim />
      {/* loop and beat-jump keys */}
      {[0, 1, 2, 3].map((i) => (
        <Group key={`lp${i}`}>
          <Key x={P.loop.x} y={P.loop.y + i * P.loop.gap} w={P.loop.w} h={P.loop.h} lit={!!d.loop && i < 2} colour={INK.green} />
          <Leg x={P.loop.x + P.loop.w / 2} y={P.loop.y + i * P.loop.gap + P.loop.h / 2 + LEG * 0.36} t={loopWords[i]} />
        </Group>
      ))}
      <Leg x={P.loop.x} y={P.loop.y - 3} t="LOOP" align="left" dim />
      <Key x={P.jump.x} y={P.jump.y} w={P.jump.w} h={P.jump.h} />
      <Key x={P.jump.x} y={P.jump.y + P.jump.gap} w={P.jump.w} h={P.jump.h} />
      <Leg x={P.jump.x + P.jump.w / 2} y={P.jump.y + P.jump.h / 2 + LEG * 0.36} t="◀ JUMP" />
      <Leg x={P.jump.x + P.jump.w / 2} y={P.jump.y + P.jump.gap + P.jump.h / 2 + LEG * 0.36} t="JUMP ▶" />
      <Jog d={d} />
      <RoundButton cx={P.cue.cx} cy={P.cue.cy} d={P.cue.d} lit={!d.playing && !!d.track && Math.abs(d.posSec - d.cueSec) < 0.01} colour={INK.amber} glyph="cue" />
      <RoundButton cx={P.play.cx} cy={P.play.cy} d={P.play.d} lit={d.playing} colour={INK.green} glyph="play" />
      <Leg x={P.cue.cx} y={P.cue.cy - P.cue.d / 2 - 3} t="CUE" />
      <Leg x={P.play.cx} y={P.play.cy - P.play.d / 2 - 3} t="PLAY / PAUSE" />
      <Key x={P.quantize.x} y={P.quantize.y} w={P.quantize.w} h={P.quantize.h} lit={quantizeLit ?? d.quantize} colour={INK.red} />
      <Key x={P.sync.x} y={P.sync.y} w={P.sync.w} h={P.sync.h} lit={!!syncLit} colour={INK.blue} />
      <Key x={P.masterBtn.x} y={P.masterBtn.y} w={P.masterBtn.w} h={P.masterBtn.h} />
      <Leg x={P.quantize.x + P.quantize.w / 2} y={P.quantize.y + P.quantize.h / 2 + 3.4 * 0.36} t="QUANTIZE" size={3.4} />
      <Leg x={P.sync.x + P.sync.w / 2} y={P.sync.y + P.sync.h / 2 + LEG * 0.36} t="SYNC" />
      <Leg x={P.masterBtn.x + P.masterBtn.w / 2} y={P.masterBtn.y + P.masterBtn.h / 2 + 3.4 * 0.36} t="MASTER" size={3.4} />
      <Fader x={P.tempo.x} y={P.tempo.top} len={P.tempo.len} value={tempoValue} capW={P.tempo.capW} capL={P.tempo.capL} ticks={9} accent={Math.abs(d.pitch) < 0.05 ? INK.green : INK.white} />
      <Leg x={P.tempo.x} y={P.tempo.top - 9} t="TEMPO" />
      <Leg x={P.tempo.x - 12} y={P.tempo.top + 2} t="−" align="right" dim />
      <Leg x={P.tempo.x - 12} y={P.tempo.top + P.tempo.len + 2} t="+" align="right" dim />
      <Key x={P.tempoRange.x} y={P.tempoRange.y} w={P.tempoRange.w} h={P.tempoRange.h} />
      <Leg x={P.tempoRange.x + P.tempoRange.w / 2} y={P.tempoRange.y + P.tempoRange.h / 2 + LEG * 0.36} t={`±${range}%`} />
      {d.keyLock !== undefined ? <KeyLockKeys d={d} /> : null}
      <SceneText x={P.browse.x} y={P.back.y + P.back.h + 16} size={12} text={deck} color={INK.amber} face="label" align="center" />
      {highlight.map((p) => (
        <Halo key={p} b={playerPartBox(p)} round={p === 'jog' || p === 'cue' || p === 'play' || p === 'browse'} />
      ))}
    </Group>
  );
});
