/**
 * PlayerTop — a club-class media player seen from above, AUTHORED IN
 * MILLIMETRES (320 × 410, geometry/boothGeometry.PLAYER). Generic: no brand
 * likeness.
 *
 * What moves, and from what (one clock, motion.ts):
 *   - the SCREEN: the zoomed waveform scrolls past a fixed playhead at the
 *     deck's real position (min/max of the real audio, art/waves.ts), the
 *     ANALYSED beat grid scrolls with it, the overview's playhead walks the
 *     whole track; time and bar.beat count from the same position;
 *   - the JOG display's position marker turns at 33⅓ rpm × the tempo rate;
 *   - PLAY is lit while the deck plays; hot-cue pads light once stored; the
 *     loop keys light while a loop holds; the tempo fader sits at the
 *     deck's pitch (+ toward the DJ, the common convention).
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
import { gridPath, wavePath, WAVE_COLOURS, WAVE_POSITIONS } from './waves';
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

/** Seconds of track visible across the zoomed waveform. */
export const ZOOM_SPAN_S = 6;


/** The player's screen: zoomed waveform + grid, overview, readouts. */
function Screen({ deck, d }: { deck: DeckId; d: DeckState }) {
  const S = PLAYER.screen;
  const pos = useDeckPos(d);
  const track = d.track;
  const zoom = track ? wavePath(track) : null;
  const over = track ? wavePath(track, 4) : null;
  const grid = analysedGrid(d);
  const lines = track && grid ? gridPath(track, grid) : null;
  // zoomed window (inside the screen)
  const zx = S.x + 6;
  const zw = S.w - 12;
  const zy = S.y + 22;
  const zh = 58;
  const zc = zy + zh / 2;
  const pxPerSec = zw / ZOOM_SPAN_S;
  const head = zx + zw / 2;
  const zoomXf = useDerivedValue(() => [{ translateX: head - pos.value * pxPerSec }, { translateY: zc }, { scaleX: pxPerSec }, { scaleY: zh / 2 - 2 }]);
  // overview strip
  const total = track ? trackSeconds(track) : 1;
  const ox = S.x + 6;
  const ow = S.w - 12;
  const oy = S.y + 88;
  const oh = 16;
  const overXf = useMemo(() => [{ translateX: ox }, { translateY: oy + oh / 2 }, { scaleX: ow / total }, { scaleY: oh / 2 - 1 }], [ox, oy, oh, ow, total]);
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
  const barText = useDerivedValue(() => {
    if (!g) return '';
    const b = ((pos.value - g.firstBeatSec) * g.bpm) / 60;
    return b < 0 ? '0.0' : `${Math.floor(b / 4) + 1}.${(((Math.floor(b) % 4) + 4) % 4) + 1}`;
  });
  const shownBpm = grid ? grid.bpm * (1 + d.pitch / 100) : 0;
  return (
    <Group>
      {/* bezel */}
      <RoundedRect x={S.x - 3} y={S.y - 3} width={S.w + 6} height={S.h + 6} r={5} color="#050506" />
      <RoundedRect x={S.x} y={S.y} width={S.w} height={S.h} r={3}>
        <LinearGradient start={vec(S.x, S.y)} end={vec(S.x, S.y + S.h)} colors={[INK.lcdHi, INK.lcdLo]} />
      </RoundedRect>
      <Group clip={Skia.XYWHRect(S.x, S.y, S.w, S.h)}>
        {/* header */}
        {track ? (
          <>
            <SceneText x={S.x + 6} y={S.y + 15} size={12.5} text={TRACKS[track].title.toUpperCase()} color={INK.white} face="label" />
            <SceneText x={S.x + S.w - 6} y={S.y + 15} size={12.5} text={shownBpm.toFixed(1)} color={INK.amber} align="right" />
          </>
        ) : null}
        {/* zoomed waveform */}
        <Group clip={Skia.XYWHRect(zx, zy, zw, zh)}>
          <Rect x={zx} y={zy} width={zw} height={zh} color="#040a11" />
          {zoom ? (
            <Group transform={zoomXf}>
              {lines ? <Path path={lines.beats} style="stroke" strokeWidth={0.012} color="rgba(255,255,255,0.22)" /> : null}
              {lines ? <Path path={lines.bars} style="stroke" strokeWidth={0.03} color="rgba(255,198,77,0.65)" /> : null}
              <Path path={zoom}>
                <LinearGradient start={vec(0, -1)} end={vec(0, 1)} colors={WAVE_COLOURS} positions={WAVE_POSITIONS} />
              </Path>
            </Group>
          ) : null}
          <Line p1={vec(zx, zc)} p2={vec(zx + zw, zc)} color="rgba(47,116,255,0.5)" strokeWidth={0.5} />
          {d.loop && zoom ? <LoopBand d={d} head={head} pxPerSec={pxPerSec} zy={zy} zh={zh} /> : null}
          {zoom ? <CueMarks d={d} head={head} pxPerSec={pxPerSec} zy={zy} zh={zh} /> : null}
          <Line p1={vec(head, zy)} p2={vec(head, zy + zh)} color={INK.white} strokeWidth={0.9} />
        </Group>
        {/* overview */}
        {over ? (
          <Group>
            <Rect x={ox} y={oy} width={ow} height={oh} color="#040a11" />
            <Group transform={overXf}>
              <Path path={over}>
                <LinearGradient start={vec(0, -1)} end={vec(0, 1)} colors={WAVE_COLOURS} positions={WAVE_POSITIONS} />
              </Path>
            </Group>
            <Rect x={ox} y={oy} width={playedW} height={oh} color="rgba(0,0,0,0.45)" />
            <Line p1={playP1} p2={playP2} color={INK.white} strokeWidth={0.9} />
          </Group>
        ) : null}
        {/* an empty deck says so, over its empty lane */}
        {track ? null : (
          <>
            <SceneText x={S.x + S.w / 2} y={S.y + 52} size={13} text="NO TRACK" color={INK.print} face="label" align="center" />
            <SceneText x={S.x + S.w / 2} y={S.y + 74} size={12.5} text="BROWSE TO LOAD" color={INK.printDim} face="label" align="center" />
          </>
        )}
        {/* footer readouts */}
        {track ? (
          <>
            <SceneText x={S.x + 6} y={S.y + S.h - 4} size={11} text={timeText} color={INK.white} />
            <SceneText x={S.x + S.w / 2} y={S.y + S.h - 4} size={11} text={`${d.pitch >= 0 ? '+' : '−'}${Math.abs(d.pitch).toFixed(1)}%`} color={INK.print} align="center" />
            <SceneText x={S.x + S.w - 6} y={S.y + S.h - 4} size={11} text={barText} color={INK.amber} align="right" />
          </>
        ) : null}
      </Group>
      {/* glass */}
      <RoundedRect x={S.x} y={S.y} width={S.w} height={S.h * 0.45} r={3} color={INK.lcdGlass} />
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
      p.moveTo(x - 3, zy);
      p.lineTo(x + 3, zy);
      p.lineTo(x, zy + 4.5);
      p.close();
      p.moveTo(x, zy + 4.5);
      p.lineTo(x, zy + zh);
      out.push({ path: p.detach(), c: m.c });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.cueSec, d.hotCues.join(','), pxPerSec, zy, zh]);
  return (
    <Group transform={xf}>
      {tri.map((m, i) => (
        <Path key={i} path={m.path} color={m.c} style="stroke" strokeWidth={0.8} />
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
      <Path path={arc} style="stroke" strokeWidth={2.2} color={INK.blue} strokeCap="round" />
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

export const PlayerTop = memo(function PlayerTop({ x, y, deck, d, highlight = [], quantizeLit, syncLit }: { x: number; y: number; deck: DeckId; d: DeckState; highlight?: readonly PlayerPart[]; quantizeLit?: boolean; syncLit?: boolean }) {
  const P = PLAYER;
  const W = PLAYER_W;
  const D = PLAYER_D;
  const tempoValue = 1 - (d.pitch + PITCH_RANGE_PCT) / (2 * PITCH_RANGE_PCT);
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
      <Screen deck={deck} d={d} />
      <Knob cx={P.browse.x} cy={P.browse.y} d={P.browse.d} value={0.5} scale={false} capTone="black" />
      <Key x={P.load.x} y={P.load.y} w={P.load.w} h={P.load.h} />
      <Key x={P.back.x} y={P.back.y} w={P.back.w} h={P.back.h} />
      {/* hot cue pads */}
      {P.hotCues.xs.map((hx, i) => (
        <Key key={i} x={hx} y={P.hotCues.y} w={P.hotCues.w} h={P.hotCues.h} lit={d.hotCues[i] != null} colour={CUE_COLOURS[i]} />
      ))}
      {/* loop and beat-jump keys */}
      {[0, 1, 2, 3].map((i) => (
        <Key key={`lp${i}`} x={P.loop.x} y={P.loop.y + i * P.loop.gap} w={P.loop.w} h={P.loop.h} lit={!!d.loop && i < 2} colour={INK.green} />
      ))}
      <Key x={P.jump.x} y={P.jump.y} w={P.jump.w} h={P.jump.h} />
      <Key x={P.jump.x} y={P.jump.y + P.jump.gap} w={P.jump.w} h={P.jump.h} />
      <Jog d={d} />
      <RoundButton cx={P.cue.cx} cy={P.cue.cy} d={P.cue.d} lit={!d.playing && !!d.track && Math.abs(d.posSec - d.cueSec) < 0.01} colour={INK.amber} glyph="cue" />
      <RoundButton cx={P.play.cx} cy={P.play.cy} d={P.play.d} lit={d.playing} colour={INK.green} glyph="play" />
      <Key x={P.quantize.x} y={P.quantize.y} w={P.quantize.w} h={P.quantize.h} lit={quantizeLit ?? d.quantize} colour={INK.red} />
      <Key x={P.sync.x} y={P.sync.y} w={P.sync.w} h={P.sync.h} lit={!!syncLit} colour={INK.blue} />
      <Key x={P.masterBtn.x} y={P.masterBtn.y} w={P.masterBtn.w} h={P.masterBtn.h} />
      <Fader x={P.tempo.x} y={P.tempo.top} len={P.tempo.len} value={tempoValue} capW={P.tempo.capW} capL={P.tempo.capL} ticks={9} accent={Math.abs(d.pitch) < 0.05 ? INK.green : INK.white} />
      <Key x={P.tempoRange.x} y={P.tempoRange.y} w={P.tempoRange.w} h={P.tempoRange.h} />
      <SceneText x={P.browse.x} y={P.back.y + P.back.h + 16} size={12} text={deck} color={INK.amber} face="label" align="center" />
      {highlight.map((p) => (
        <Halo key={p} b={playerPartBox(p)} round={p === 'jog' || p === 'cue' || p === 'play' || p === 'browse'} />
      ))}
    </Group>
  );
});
