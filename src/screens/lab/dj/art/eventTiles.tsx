/**
 * eventTiles — the DEVICES on the signal-flow boards of screens 23 and 24,
 * drawn as the real objects (house rule: no primitive stand-ins; lab-art
 * grade 2026-10-19: "plain boxes with tiny icons, empty bodies at 3×").
 *
 * Each tile is authored in its own units (below) and fitted by the board's
 * card into the room its words leave (EventFlow.cardLayout): at 1× the words
 * are big and the device is a clear picture; zoomed in, the words shrink
 * relative to the card and the device grows to fill it, showing its detail —
 * the laptop's screen and keyboard, the player's jog, screen and stick, the
 * channel strip's selector, knobs, CUE and fader at the board's REAL fader
 * position, the speaker's horn and woofer behind the grille.
 *
 *   laptop    an open laptop, three-quarter front (100 × 78): the DJ
 *             software on its screen (two deck waveforms and the library),
 *             FROZEN washed out with a busy wheel; the USB plug in its side.
 *   player    a media player from above (80 × 100): the screen (waveform,
 *             NO MEDIA, FILE ERROR), the USB stick in its port, hot-cue pads,
 *             the jog, CUE and PLAY (lit), the tempo fader.
 *   channel   one mixer channel strip (34 × 120): the input selector (PHONO
 *             · LINE · USB), TRIM, HI / MID / LOW, CUE, the channel fader and
 *             the crossfader assign (A · THRU · B).
 *   micch     the mixer's mic section (34 × 84): LEVEL, ON, TALK OVER and
 *             the BOOTH / REC sends.
 *   master    the master section (34 × 300): MASTER, BOOTH, PHONES level and
 *             CUE / MASTER blend, SPLIT CUE, the crossfader curve and the
 *             crossfader.
 *   speaker   a powered PA speaker, front (60 × 100); monitors — the booth
 *             monitor PAIR (120 × 84).
 *   phones    closed DJ headphones (90 × 80). recorder — a handheld stereo
 *             recorder (40 × 86). mic — a handheld mic in the clip of a desk
 *             stand (70 × 80).
 *   wall      a duplex wall plate (30 × 48, board units, never rescaled: the
 *             cords end in its receptacles).
 *
 * Legends sit at sizes that read only once the zoom renders them at 9 pt or
 * more (sceneText) — drawn in BOARD units outside the tile's scale transform,
 * so the floor check sees their true size. Light from the upper left. Generic:
 * no brand, no logo.
 */
import { memo, useMemo, type ReactNode } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Oval, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { Key, Knob, SlideSwitch } from './parts';
import { HandheldMic, MIC_TRUE, MicXlrPlug } from './MicGear';
import { SceneText } from './sceneText';
import type { InputSel, XfAssign } from '../model/djModel';
import { TILE_SIZE, WALL_PLATE } from './eventBoardGeometry';

export type TileArt =
  | { kind: 'laptop'; screen: 'playing' | 'ready' | 'frozen' | 'off'; usb: boolean }
  | { kind: 'player'; screen: 'playing' | 'cued' | 'empty' | 'error' | 'off'; stick: boolean }
  | { kind: 'channel'; input: InputSel; trim: number; eq: { hi: number; mid: number; lo: number }; fader: number; cue: boolean; xf: XfAssign }
  | { kind: 'micch'; level: number; on: boolean; talkover: boolean; toBooth: boolean; toRec: boolean }
  | { kind: 'master'; master: number; booth: number; phones: number; cueMix: number; xf: number }
  | { kind: 'speaker'; on: boolean; clip?: boolean }
  | { kind: 'monitors'; on: boolean }
  | { kind: 'phones' }
  | { kind: 'recorder'; armed: boolean; clip: boolean }
  | { kind: 'mic'; on: boolean }
  | { kind: 'wall' };

export { TILE_SIZE, WALL_PLATE, type TileKind } from './eventBoardGeometry';

type B = { x: number; y: number; w: number; h: number };

/** A legend in the tile's units, drawn in board units (so the 9 pt floor
 *  sees its real size: it appears only once the zoom makes it readable). */
function Leg({ b, g, x, y, size, text, color = INK.print, align = 'center' }: { b: B; g: number; x: number; y: number; size: number; text: string; color?: string; align?: 'left' | 'center' | 'right' }) {
  return <SceneText x={b.x + x * g} y={b.y + y * g} size={size * g} text={text} color={color} face="label" align={align} />;
}

function Scaled({ b, g, children }: { b: B; g: number; children: ReactNode }) {
  return <Group transform={[{ translateX: b.x }, { translateY: b.y }, { scale: g }]}>{children}</Group>;
}

/** A waveform as a row of bars (deterministic: the same picture every
 *  render), centred on `cy`, between x0 and x1. */
function barsPath(x0: number, x1: number, cy: number, amp: number, step: number, seed: number) {
  const p = Skia.PathBuilder.Make();
  for (let x = x0; x <= x1; x += step) {
    const a = 0.3 + 0.7 * Math.abs(Math.sin(x * 0.37 + seed) * Math.sin(x * 0.113 + seed * 2.1));
    const h = Math.max(0.3, a * amp);
    p.addRect(Skia.XYWHRect(x, cy - h, step * 0.62, h * 2));
  }
  return p.detach();
}

/* ── the laptop (100 × 78) ────────────────────────────────────────────── */

const LaptopTile = memo(function LaptopTile({ b, screen, usb }: { b: B; screen: 'playing' | 'ready' | 'frozen' | 'off'; usb: boolean }) {
  const g = b.w / TILE_SIZE.laptop.w;
  const keys = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let r = 0; r < 4; r++) {
      const y0 = 54.4 + r * 2.35;
      const xl = 17 - (y0 - 53.5) * 0.5;
      const xr = 83 + (y0 - 53.5) * 0.5;
      const n = r === 3 ? 1 : 13;
      if (r === 3) {
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(xl + (xr - xl) * 0.3, y0, (xr - xl) * 0.4, 1.8), 0.4, 0.4));
        continue;
      }
      const kw = (xr - xl - (n + 1) * 0.45) / n;
      for (let i = 0; i < n; i++) p.addRRect(Skia.RRectXY(Skia.XYWHRect(xl + 0.45 + i * (kw + 0.45), y0, kw, 1.8), 0.35, 0.35));
    }
    return p.detach();
  }, []);
  const base = useMemo(() => Skia.Path.MakeFromSVGString('M12 51.5 L88 51.5 L97 72 L3 72 Z')!, []);
  const well = useMemo(() => Skia.Path.MakeFromSVGString('M17 53.5 L83 53.5 L88 63.8 L12 63.8 Z')!, []);
  const pad = useMemo(() => Skia.Path.MakeFromSVGString('M42.5 65.2 L57.5 65.2 L58.4 70.6 L41.6 70.6 Z')!, []);
  const lip = useMemo(() => Skia.Path.MakeFromSVGString('M3 72 L97 72 L96.4 75 Q96.2 76 95 76 L5 76 Q3.8 76 3.6 75 Z')!, []);
  const w1 = useMemo(() => barsPath(17, 83, 12.2, 3.4, 1.1, 0.6), []);
  const w2 = useMemo(() => barsPath(17, 83, 22.2, 3.4, 1.1, 2.4), []);
  const on = screen !== 'off';
  return (
    <Group>
      <Scaled b={b} g={g}>
        <Oval x={2} y={71} width={96} height={8} color="rgba(0,0,0,0.6)">
          <BlurMask blur={2.4} style="normal" />
        </Oval>
        {/* the lid, its bezel and the screen */}
        <RoundedRect x={11} y={0} width={78} height={50} r={3.2}>
          <LinearGradient start={vec(11, 0)} end={vec(89, 50)} colors={['#555962', '#2c2e34', '#1c1d21']} />
        </RoundedRect>
        <RoundedRect x={11.3} y={0.3} width={77.4} height={49.4} r={3} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.18)" />
        <RoundedRect x={13} y={2} width={74} height={45.5} r={2} color="#050607" />
        <Circle cx={50} cy={3} r={0.5} color="#1d2026" />
        <Group clip={Skia.XYWHRect(15, 4, 70, 41)}>
          <Rect x={15} y={4} width={70} height={41}>
            <LinearGradient start={vec(0, 4)} end={vec(0, 45)} colors={on ? ['#0e1724', '#05090e'] : ['#040506', '#020203']} />
          </Rect>
          {on ? (
            <Group>
              <Rect x={15} y={4} width={70} height={2.6} color="#17232f" />
              {[8, 18].map((y, i) => (
                <Rect key={y} x={16} y={y} width={68} height={8.4} color="#081019" />
              ))}
              <Path path={w1} color={INK.blue} opacity={screen === 'playing' ? 0.95 : 0.55} />
              <Path path={w2} color="#ff9e57" opacity={0.5} />
              <Line p1={vec(50, 7.4)} p2={vec(50, 27)} color={screen === 'playing' ? '#ff5a48' : '#c9ccd2'} strokeWidth={0.6} />
              {screen === 'playing' ? <Path path={Skia.Path.MakeFromSVGString('M17 8.6 L20 10.4 L17 12.2 Z')!} color={INK.green} /> : null}
              {[29.5, 32.3, 35.1, 37.9, 40.7].map((y, i) => (
                <Group key={y}>
                  <Rect x={16} y={y} width={68} height={2.2} color={i === 1 ? '#173452' : '#0b1520'} />
                  <Rect x={18} y={y + 0.8} width={22 + ((i * 7) % 13)} height={0.6} color="#4a5a6c" />
                  <Rect x={60} y={y + 0.8} width={10} height={0.6} color="#34404e" />
                </Group>
              ))}
              {screen === 'frozen' ? (
                <Group>
                  <Rect x={15} y={4} width={70} height={41} color="rgba(220,224,232,0.30)" />
                  {Array.from({ length: 10 }, (_, i) => {
                    const a = (i / 10) * Math.PI * 2;
                    return <Line key={i} p1={vec(50 + Math.cos(a) * 3.2, 21 + Math.sin(a) * 3.2)} p2={vec(50 + Math.cos(a) * 5.6, 21 + Math.sin(a) * 5.6)} color="#ffffff" strokeWidth={1.1} strokeCap="round" opacity={0.25 + 0.75 * (i / 9)} />;
                  })}
                </Group>
              ) : null}
            </Group>
          ) : null}
          {/* the glass */}
          <Rect x={15} y={4} width={70} height={41}>
            <LinearGradient start={vec(15, 4)} end={vec(60, 45)} colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']} />
          </Rect>
        </Group>
        {/* the hinge and the base: keyboard, trackpad, the front lip */}
        <RoundedRect x={12} y={49.6} width={76} height={2.4} r={1}>
          <LinearGradient start={vec(0, 49.6)} end={vec(0, 52)} colors={['#141518', '#3a3d43']} />
        </RoundedRect>
        <Path path={base}>
          <LinearGradient start={vec(0, 51.5)} end={vec(0, 72)} colors={['#4a4d54', '#2c2e33']} />
        </Path>
        <Line p1={vec(12.2, 51.7)} p2={vec(87.8, 51.7)} color="rgba(255,255,255,0.2)" strokeWidth={0.4} />
        <Path path={well} color="#141518" />
        <Path path={keys} color="#2b2d32" />
        <Path path={keys} style="stroke" strokeWidth={0.18} color="rgba(255,255,255,0.10)" />
        <Path path={pad} color="#393c42" />
        <Path path={pad} style="stroke" strokeWidth={0.3} color="rgba(255,255,255,0.16)" />
        <Path path={lip}>
          <LinearGradient start={vec(0, 72)} end={vec(0, 76)} colors={['#2a2c31', '#0f1012']} />
        </Path>
        <RoundedRect x={46} y={72} width={8} height={1} r={0.5} color="#0a0a0c" />
        {/* the USB port on the right side, and its plug when connected */}
        <RoundedRect x={92.4} y={66.2} width={2.6} height={2} r={0.4} color="#050506" />
        {usb ? (
          <Group>
            <RoundedRect x={93.6} y={65.6} width={4} height={3.2} r={0.4}>
              <LinearGradient start={vec(0, 65.6)} end={vec(0, 68.8)} colors={['#e6e9ee', '#8a9099', '#4a4f57']} />
            </RoundedRect>
            <RoundedRect x={97.4} y={65.1} width={4.2} height={4.2} r={1.1} color="#1a1b1f" />
            <Line p1={vec(101.4, 67.2)} p2={vec(104, 67.2)} color="#1a1b1f" strokeWidth={1.8} strokeCap="round" />
          </Group>
        ) : null}
      </Scaled>
      {screen === 'frozen' ? <Leg b={b} g={g} x={50} y={36} size={6.2} text="NOT RESPONDING" color="#ffffff" /> : null}
    </Group>
  );
});

/* ── the media player from above (80 × 100) ───────────────────────────── */

const PlayerTile = memo(function PlayerTile({ b, screen, stick }: { b: B; screen: 'playing' | 'cued' | 'empty' | 'error' | 'off'; stick: boolean }) {
  const g = b.w / TILE_SIZE.player.w;
  const wave = useMemo(() => barsPath(12, 68, 14.5, 4.6, 0.9, 1.7), []);
  const over = useMemo(() => barsPath(12, 68, 24.2, 1.3, 0.7, 4.2), []);
  const knurl = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      p.moveTo(37 + Math.cos(a) * 18.4, 66 + Math.sin(a) * 18.4);
      p.lineTo(37 + Math.cos(a) * 20.2, 66 + Math.sin(a) * 20.2);
    }
    return p.detach();
  }, []);
  const warn = useMemo(() => Skia.Path.MakeFromSVGString('M40 8.6 L45.4 17.8 L34.6 17.8 Z')!, []);
  const playG = useMemo(() => Skia.Path.MakeFromSVGString('M6.6 91.4 L10 93.4 L6.6 95.4 Z')!, []);
  const on = screen !== 'off';
  const playing = screen === 'playing';
  const lcd = screen === 'error' ? ['#2b0b08', '#120403'] : on ? [INK.lcdHi, INK.lcdLo] : ['#030405', '#020203'];
  return (
    <Group>
      <Scaled b={b} g={g}>
        <RoundedRect x={1.6} y={2.4} width={80} height={100} r={5} color="rgba(0,0,0,0.6)">
          <BlurMask blur={2.6} style="normal" />
        </RoundedRect>
        <RoundedRect x={0} y={0} width={80} height={100} r={4.5}>
          <LinearGradient start={vec(0, 0)} end={vec(80, 100)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
        </RoundedRect>
        <RoundedRect x={0.4} y={0.4} width={79.2} height={99.2} r={4.2} style="stroke" strokeWidth={0.7} color={INK.bevel} />
        {/* the screen */}
        <RoundedRect x={9} y={4} width={62} height={25} r={1.6} color="#050506" />
        <Rect x={10.4} y={5.4} width={59.2} height={22.2}>
          <LinearGradient start={vec(0, 5.4)} end={vec(0, 27.6)} colors={lcd} />
        </Rect>
        {screen === 'playing' || screen === 'cued' ? (
          <Group>
            <Path path={wave} color={INK.blue} opacity={playing ? 0.95 : 0.6} />
            <Path path={over} color="#8fbcff" opacity={0.6} />
            <Line p1={vec(40, 7)} p2={vec(40, 21.5)} color="#ffffff" strokeWidth={0.6} />
            <Path path={Skia.Path.MakeFromSVGString('M36 6.4 L38.4 6.4 L37.2 8.2 Z')!} color={INK.amber} />
            <Line p1={vec(12 + (playing ? 22 : 4), 22.8)} p2={vec(12 + (playing ? 22 : 4), 25.8)} color="#ff5a48" strokeWidth={0.6} />
          </Group>
        ) : screen === 'error' ? (
          <Group>
            <Path path={warn} color="#ff5a48" />
            <Rect x={39.5} y={11} width={1} height={4} color="#120403" />
            <Rect x={39.5} y={15.8} width={1} height={1} color="#120403" />
          </Group>
        ) : null}
        <Rect x={10.4} y={5.4} width={59.2} height={22.2}>
          <LinearGradient start={vec(10, 5)} end={vec(50, 28)} colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']} />
        </Rect>
        {/* the USB port, with the stick in it */}
        <RoundedRect x={3.6} y={33.4} width={15.4} height={5.2} r={1} color="#050506" />
        {stick ? (
          <Group>
            <RoundedRect x={4.6} y={34.2} width={9.6} height={3.6} r={0.6}>
              <LinearGradient start={vec(0, 34.2)} end={vec(0, 37.8)} colors={['#e6e9ee', '#8a9099', '#4a4f57']} />
            </RoundedRect>
            <RoundedRect x={12.6} y={33.8} width={6} height={4.4} r={1.2}>
              <LinearGradient start={vec(0, 33.8)} end={vec(0, 38.2)} colors={['#4f86e0', '#1d3f78']} />
            </RoundedRect>
            <Circle cx={17.2} cy={36} r={0.6} color={playing ? INK.green : '#22402c'} />
          </Group>
        ) : null}
        {/* hot-cue pads */}
        {[0, 1, 2, 3].map((i) => (
          <RoundedRect key={i} x={23 + i * 13.4} y={33.4} width={11.6} height={5.2} r={1}>
            <LinearGradient start={vec(0, 33.4)} end={vec(0, 38.6)} colors={[INK.padHi, INK.padLo]} />
          </RoundedRect>
        ))}
        {/* the jog */}
        <Circle cx={38} cy={67.4} r={22.6} color="rgba(0,0,0,0.6)">
          <BlurMask blur={2} style="normal" />
        </Circle>
        <Circle cx={37} cy={66} r={22}>
          <RadialGradient c={vec(30, 58)} r={30} colors={['#b9bec6', '#5c626b', '#2a2c31']} />
        </Circle>
        <Circle cx={37} cy={66} r={20.4}>
          <RadialGradient c={vec(31, 59)} r={26} colors={['#34373d', '#121316', '#08090a']} />
        </Circle>
        <Path path={knurl} style="stroke" strokeWidth={0.35} color="rgba(0,0,0,0.6)" />
        <Circle cx={37} cy={66} r={8} color="#050608" />
        <Circle cx={37} cy={66} r={8} style="stroke" strokeWidth={0.6} color={playing ? INK.blue : '#1d2a3a'} />
        <Line p1={vec(37, 66)} p2={vec(37 + Math.cos(-0.7) * 6.6, 66 + Math.sin(-0.7) * 6.6)} color={on ? '#ffffff' : '#3a3d43'} strokeWidth={0.8} strokeCap="round" />
        <Oval x={24} y={50} width={14} height={8} color="rgba(255,255,255,0.10)">
          <BlurMask blur={2} style="normal" />
        </Oval>
        {/* CUE and PLAY */}
        {[
          { cy: 82, lit: screen === 'cued', col: INK.amber },
          { cy: 93.4, lit: playing, col: INK.green },
        ].map((k) => (
          <Group key={k.cy}>
            {k.lit ? (
              <Circle cx={8.4} cy={k.cy} r={5.4} color={k.col} opacity={0.45}>
                <BlurMask blur={1.6} style="normal" />
              </Circle>
            ) : null}
            <Circle cx={8.4} cy={k.cy} r={4.4} color="#0b0c0e" />
            <Circle cx={8.4} cy={k.cy} r={4.4} style="stroke" strokeWidth={0.8} color={k.lit ? k.col : 'rgba(255,255,255,0.14)'} />
          </Group>
        ))}
        <Path path={playG} color={playing ? INK.green : '#5c626b'} transform={[{ translateX: 0.4 }, { translateY: -0.1 }]} />
        {/* the tempo fader */}
        <RoundedRect x={71.6} y={46} width={2.4} height={46} r={1} color="#050506" />
        <RoundedRect x={68.2} y={66.6} width={9.2} height={5} r={1}>
          <LinearGradient start={vec(0, 66.6)} end={vec(0, 71.6)} colors={['#e6e9ee', '#8a9099', '#3c4048']} />
        </RoundedRect>
        <Line p1={vec(68.4, 69.1)} p2={vec(77.2, 69.1)} color="#ffffff" strokeWidth={0.4} />
      </Scaled>
      {screen === 'empty' ? <Leg b={b} g={g} x={40} y={19.4} size={6.4} text="NO MEDIA" color={INK.printDim} /> : null}
      {screen === 'error' ? <Leg b={b} g={g} x={40} y={26.4} size={6.4} text="FILE ERROR" color="#ff8a7e" /> : null}
      <Leg b={b} g={g} x={11.3} y={46.4} size={6.4} text="USB" />
    </Group>
  );
});

/* ── a mixer strip panel (shared) ─────────────────────────────────────── */

function StripPanel({ h }: { h: number }) {
  return (
    <Group>
      <RoundedRect x={1} y={1.6} width={34} height={h} r={2.6} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={34} height={h} r={2.6}>
        <LinearGradient start={vec(0, 0)} end={vec(34, h)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
      </RoundedRect>
      <RoundedRect x={0.3} y={0.3} width={33.4} height={h - 0.6} r={2.4} style="stroke" strokeWidth={0.5} color={INK.bevel} />
    </Group>
  );
}

/** A 2-position slide (a send switch), face-on (left = off). */
function Slide2({ x, y, w, h, on }: { x: number; y: number; w: number; h: number; on: boolean }) {
  const kw = w / 2;
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.3} color="#050506" />
      <RoundedRect x={x + (on ? kw : 0) + kw * 0.1} y={y + h * 0.14} width={kw * 0.8} height={h * 0.72} r={h * 0.2}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={on ? ['#ffe08a', '#b8862a'] : ['#b9bec6', '#5c626b']} />
      </RoundedRect>
    </Group>
  );
}

/** A vertical fader slot and its cap (0 = bottom). */
function VFader({ cx, y0, len, value }: { cx: number; y0: number; len: number; value: number }) {
  const cy = y0 + len - Math.max(0, Math.min(1, value)) * len;
  return (
    <Group>
      {Array.from({ length: 6 }, (_, i) => (
        <Line key={i} p1={vec(cx - 6.4, y0 + (len * i) / 5)} p2={vec(cx - 4.4, y0 + (len * i) / 5)} color={INK.printDim} strokeWidth={0.4} />
      ))}
      <RoundedRect x={cx - 1} y={y0 - 2} width={2} height={len + 4} r={1} color="#050506" />
      <RoundedRect x={cx - 5.6 + 0.5} y={cy - 3 + 0.8} width={11.2} height={6} r={1.2} color="rgba(0,0,0,0.6)">
        <BlurMask blur={0.8} style="normal" />
      </RoundedRect>
      <RoundedRect x={cx - 5.6} y={cy - 3} width={11.2} height={6} r={1.2}>
        <LinearGradient start={vec(0, cy - 3)} end={vec(0, cy + 3)} colors={['#3a3c42', '#16171a', '#0b0b0d']} />
      </RoundedRect>
      <Line p1={vec(cx - 5, cy)} p2={vec(cx + 5, cy)} color="#f4f6f8" strokeWidth={0.6} />
    </Group>
  );
}

const SEL: Record<InputSel, number> = { PHONO: 0, LINE: 1, USB: 2 };
const XFP: Record<XfAssign, number> = { A: 0, THRU: 1, B: 2 };

const ChannelTile = memo(function ChannelTile({ b, a }: { b: B; a: Extract<TileArt, { kind: 'channel' }> }) {
  const g = b.w / TILE_SIZE.channel.w;
  return (
    <Group>
      <Scaled b={b} g={g}>
        <StripPanel h={120} />
        <SlideSwitch x={6} y={4.4} w={22} h={5.4} pos={SEL[a.input]} />
        <Knob cx={17} cy={25.5} d={10} value={a.trim} scale={false} />
        <Knob cx={17} cy={39} d={8.6} value={a.eq.hi} centre scale={false} capTone="black" />
        <Knob cx={17} cy={51} d={8.6} value={a.eq.mid} centre scale={false} capTone="black" />
        <Knob cx={17} cy={63} d={8.6} value={a.eq.lo} centre scale={false} capTone="black" />
        <Key x={9} y={70.4} w={16} h={5.4} lit={a.cue} colour={INK.amber} />
        <VFader cx={17} y0={83} len={22} value={a.fader} />
        <SlideSwitch x={7} y={111.4} w={20} h={4.6} pos={XFP[a.xf]} />
      </Scaled>
      <Leg b={b} g={g} x={17} y={17.4} size={7.4} text={a.input} color={INK.amber} />
    </Group>
  );
});

const MicChTile = memo(function MicChTile({ b, a }: { b: B; a: Extract<TileArt, { kind: 'micch' }> }) {
  const g = b.w / TILE_SIZE.micch.w;
  return (
    <Group>
      <Scaled b={b} g={g}>
        <StripPanel h={84} />
        <Knob cx={17} cy={11} d={11} value={a.level} scale={false} />
        <Key x={7} y={21} w={20} h={7} lit={a.on} colour={INK.red} />
        <Key x={7} y={31} w={20} h={7} lit={a.talkover} colour={INK.amber} />
        <Slide2 x={8} y={43} w={18} h={5} on={a.toBooth} />
        <Slide2 x={8} y={62} w={18} h={5} on={a.toRec} />
      </Scaled>
      <Leg b={b} g={g} x={17} y={57} size={6.6} text="BOOTH" color={a.toBooth ? INK.amber : INK.print} />
      <Leg b={b} g={g} x={17} y={76} size={6.6} text="REC" color={a.toRec ? INK.amber : INK.print} />
    </Group>
  );
});

const MasterTile = memo(function MasterTile({ b, a }: { b: B; a: Extract<TileArt, { kind: 'master' }> }) {
  const g = b.w / TILE_SIZE.master.w;
  const xcx = 6 + Math.max(0, Math.min(1, a.xf)) * 22;
  return (
    <Group>
      <Scaled b={b} g={g}>
        <StripPanel h={300} />
        <Knob cx={17} cy={20} d={15} value={a.master} scale={false} />
        <Knob cx={17} cy={68} d={13} value={a.booth} scale={false} />
        <Knob cx={17} cy={116} d={12} value={a.phones} scale={false} capTone="black" />
        <Knob cx={17} cy={162} d={12} value={a.cueMix} centre scale={false} capTone="black" />
        <Key x={8} y={200} w={18} h={7} />
        <SlideSwitch x={7} y={236} w={20} h={5} pos={1} />
        {/* the crossfader */}
        <RoundedRect x={4} y={274} width={26} height={2.4} r={1} color="#050506" />
        <RoundedRect x={xcx - 3.4 + 0.5} y={268.6 + 0.8} width={6.8} height={13} r={1.2} color="rgba(0,0,0,0.6)">
          <BlurMask blur={0.8} style="normal" />
        </RoundedRect>
        <RoundedRect x={xcx - 3.4} y={268.6} width={6.8} height={13} r={1.2}>
          <LinearGradient start={vec(xcx - 3.4, 0)} end={vec(xcx + 3.4, 0)} colors={['#3a3c42', '#16171a', '#0b0b0d']} />
        </RoundedRect>
        <Line p1={vec(xcx, 269.4)} p2={vec(xcx, 280.8)} color="#f4f6f8" strokeWidth={0.6} />
      </Scaled>
      <Leg b={b} g={g} x={17} y={42} size={7.2} text="MASTER" />
      <Leg b={b} g={g} x={17} y={88} size={7.2} text="BOOTH" />
      <Leg b={b} g={g} x={17} y={135} size={7.2} text="PHONES" />
      <Leg b={b} g={g} x={17} y={181} size={7.2} text="BLEND" />
      <Leg b={b} g={g} x={17} y={220} size={6.6} text="SPLIT" />
      <Leg b={b} g={g} x={17} y={254} size={6.6} text="CURVE" />
      <Leg b={b} g={g} x={17} y={295} size={6.6} text="X-FADER" />
    </Group>
  );
});

/* ── speakers ─────────────────────────────────────────────────────────── */

/** One powered speaker front: tapered cabinet, perforated grille with the
 *  drivers showing through it, the handle, the front LED. `tweeter`: a
 *  booth monitor's dome instead of the PA's horn. */
function SpeakerFront({ x, y, w, h, on, clip = false, tweeter = false }: { x: number; y: number; w: number; h: number; on: boolean; clip?: boolean; tweeter?: boolean }) {
  const shell = useMemo(() => {
    const t = w * 0.03;
    const r = w * 0.06;
    const p = Skia.PathBuilder.Make();
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y);
    p.quadTo(x + w, y, x + w, y + r);
    p.lineTo(x + w - t, y + h - r);
    p.quadTo(x + w - t, y + h, x + w - t - r, y + h);
    p.lineTo(x + t + r, y + h);
    p.quadTo(x + t, y + h, x + t, y + h - r);
    p.lineTo(x, y + r);
    p.quadTo(x, y, x + r, y);
    p.close();
    return p.detach();
  }, [x, y, w, h]);
  const gx = x + w * 0.09;
  const gy = y + h * 0.09;
  const gw = w * 0.82;
  const gh = h * 0.84;
  const holes = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const pitch = w * 0.045;
    let row = 0;
    for (let yy = gy + pitch; yy < gy + gh - pitch * 0.5; yy += pitch * 0.87, row++) {
      for (let xx = gx + pitch * 0.8 + (row % 2) * (pitch / 2); xx < gx + gw - pitch * 0.5; xx += pitch) p.addCircle(xx, yy, pitch * 0.3);
    }
    return p.detach();
  }, [gx, gy, gw, gh, w]);
  const wR = w * (tweeter ? 0.33 : 0.37);
  const wcy = gy + gh * 0.64;
  return (
    <Group>
      <Path path={shell} color="rgba(0,0,0,0.6)" transform={[{ translateX: w * 0.03 }, { translateY: h * 0.03 }]}>
        <BlurMask blur={w * 0.04} style="normal" />
      </Path>
      <Path path={shell}>
        <LinearGradient start={vec(x, y)} end={vec(x + w, y + h)} colors={['#34373d', '#1a1b1f', '#0e0f11']} />
      </Path>
      <Path path={shell} style="stroke" strokeWidth={w * 0.012} color="rgba(255,255,255,0.14)" />
      <RoundedRect x={x + w * 0.36} y={y + h * 0.025} width={w * 0.28} height={h * 0.035} r={h * 0.015} color="#050506" />
      <RoundedRect x={gx} y={gy} width={gw} height={gh} r={w * 0.04} color="#0b0c0e" />
      {/* the drivers, seen through the grille */}
      {tweeter ? (
        <Group>
          <Circle cx={x + w / 2} cy={gy + gh * 0.2} r={w * 0.13} color="#16171a" />
          <Circle cx={x + w / 2} cy={gy + gh * 0.2} r={w * 0.07}>
            <RadialGradient c={vec(x + w / 2 - w * 0.02, gy + gh * 0.18)} r={w * 0.09} colors={['#5c626b', '#16171a']} />
          </Circle>
        </Group>
      ) : (
        <Group>
          <RoundedRect x={x + w * 0.22} y={gy + gh * 0.08} width={w * 0.56} height={gh * 0.2} r={w * 0.06}>
            <RadialGradient c={vec(x + w / 2, gy + gh * 0.18)} r={w * 0.3} colors={['#050506', '#1d1f23']} />
          </RoundedRect>
          <Oval x={x + w * 0.45} y={gy + gh * 0.15} width={w * 0.1} height={gh * 0.06} color="#020203" />
        </Group>
      )}
      <Circle cx={x + w / 2} cy={wcy} r={wR}>
        <RadialGradient c={vec(x + w / 2 - wR * 0.3, wcy - wR * 0.35)} r={wR * 1.3} colors={['#26282d', '#0d0e10', '#050506']} />
      </Circle>
      <Circle cx={x + w / 2} cy={wcy} r={wR * 0.93} style="stroke" strokeWidth={wR * 0.07} color="#2c2f35" />
      <Circle cx={x + w / 2} cy={wcy} r={wR * 0.28}>
        <RadialGradient c={vec(x + w / 2 - wR * 0.1, wcy - wR * 0.12)} r={wR * 0.32} colors={['#4a4d54', '#121316']} />
      </Circle>
      {/* the perforated steel grille in front of them */}
      <Path path={holes} color="rgba(255,255,255,0.075)" />
      <RoundedRect x={gx} y={gy} width={gw} height={gh} r={w * 0.04} style="stroke" strokeWidth={w * 0.012} color="rgba(255,255,255,0.12)" />
      {/* the front LED */}
      {on ? (
        <Circle cx={x + w / 2} cy={y + h * 0.955} r={w * 0.035} color={clip ? INK.peak : INK.green} opacity={0.5}>
          <BlurMask blur={w * 0.03} style="normal" />
        </Circle>
      ) : null}
      <Circle cx={x + w / 2} cy={y + h * 0.955} r={w * 0.018} color={on ? (clip ? INK.peak : INK.green) : '#1d2a22'} />
    </Group>
  );
}

const SpeakerTile = memo(function SpeakerTile({ b, on, clip }: { b: B; on: boolean; clip?: boolean }) {
  const g = b.w / TILE_SIZE.speaker.w;
  return (
    <Scaled b={b} g={g}>
      <SpeakerFront x={0} y={0} w={60} h={100} on={on} clip={clip} />
    </Scaled>
  );
});

const MonitorsTile = memo(function MonitorsTile({ b, on }: { b: B; on: boolean }) {
  const g = b.w / TILE_SIZE.monitors.w;
  return (
    <Scaled b={b} g={g}>
      <SpeakerFront x={0} y={0} w={54} h={84} on={on} tweeter />
      <SpeakerFront x={66} y={0} w={54} h={84} on={on} tweeter />
    </Scaled>
  );
});

/* ── headphones (90 × 80) ─────────────────────────────────────────────── */

const PhonesTile = memo(function PhonesTile({ b }: { b: B }) {
  const g = b.w / TILE_SIZE.phones.w;
  const band = useMemo(() => Skia.Path.MakeFromSVGString('M16 42 C16 6 74 6 74 42')!, []);
  const cable = useMemo(() => Skia.Path.MakeFromSVGString('M14 72 C14 78 20 79 24 77')!, []);
  return (
    <Scaled b={b} g={g}>
      <Path path={band} style="stroke" strokeWidth={8} color="rgba(0,0,0,0.5)" strokeCap="round" transform={[{ translateX: 1.2 }, { translateY: 1.6 }]}>
        <BlurMask blur={1.4} style="normal" />
      </Path>
      <Path path={band} style="stroke" strokeWidth={7.4} strokeCap="round">
        <LinearGradient start={vec(0, 10)} end={vec(0, 40)} colors={['#3a3c42', '#121316']} />
      </Path>
      <Path path={band} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.16)" strokeCap="round" transform={[{ translateY: -2.4 }]} />
      {[16, 74].map((cx) => (
        <Group key={cx}>
          <RoundedRect x={cx - 1.4} y={38} width={2.8} height={10} r={1}>
            <LinearGradient start={vec(cx - 1.4, 0)} end={vec(cx + 1.4, 0)} colors={['#e6e9ee', '#8a9099']} />
          </RoundedRect>
          <Oval x={cx - 13 + (cx < 45 ? -2 : 2)} y={46} width={26} height={30} color="rgba(0,0,0,0.55)">
            <BlurMask blur={1.6} style="normal" />
          </Oval>
          <Oval x={cx - 12} y={44} width={24} height={30}>
            <RadialGradient c={vec(cx - 4, 52)} r={20} colors={['#3a3d43', '#16171a', '#08090a']} />
          </Oval>
          <Oval x={cx - 7} y={51} width={14} height={16} style="stroke" strokeWidth={0.7} color="rgba(255,255,255,0.12)" />
        </Group>
      ))}
      <Path path={cable} style="stroke" strokeWidth={1.6} color="#101113" strokeCap="round" />
    </Scaled>
  );
});

/* ── a handheld stereo recorder (40 × 86) ─────────────────────────────── */

const RecorderTile = memo(function RecorderTile({ b, armed, clip }: { b: B; armed: boolean; clip: boolean }) {
  const g = b.w / TILE_SIZE.recorder.w;
  const guard = useMemo(() => Skia.Path.MakeFromSVGString('M6 20 C6 1 34 1 34 20')!, []);
  return (
    <Group>
      <Scaled b={b} g={g}>
        {/* the crossed pair of capsules under their guard */}
        {[-0.62, 0.62].map((a) => (
          <Group key={a} transform={[{ translateX: 20 }, { translateY: 15 }, { rotate: a }]}>
            <RoundedRect x={-3} y={-11} width={6} height={13} r={2.4}>
              <LinearGradient start={vec(-3, 0)} end={vec(3, 0)} colors={['#8a9099', '#e6e9ee', '#5c626b']} />
            </RoundedRect>
            <RoundedRect x={-3} y={-11} width={6} height={3.4} r={1.6} color="#2a2c31" />
          </Group>
        ))}
        <Path path={guard} style="stroke" strokeWidth={2} color="#5c626b" strokeCap="round" />
        <RoundedRect x={5} y={18} width={32} height={68} r={4} color="rgba(0,0,0,0.6)">
          <BlurMask blur={1.6} style="normal" />
        </RoundedRect>
        <RoundedRect x={4} y={16} width={32} height={69} r={4}>
          <LinearGradient start={vec(4, 16)} end={vec(36, 85)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
        </RoundedRect>
        <RoundedRect x={4.3} y={16.3} width={31.4} height={68.4} r={3.8} style="stroke" strokeWidth={0.5} color={INK.bevel} />
        <RoundedRect x={8} y={24} width={24} height={18} r={1.2} color="#050506" />
        <Rect x={9} y={25} width={22} height={16}>
          <LinearGradient start={vec(0, 25)} end={vec(0, 41)} colors={[INK.lcdHi, INK.lcdLo]} />
        </Rect>
        <Rect x={11} y={36} width={14} height={1.2} color={INK.green} opacity={0.8} />
        <Rect x={11} y={38.4} width={12} height={1.2} color={INK.green} opacity={0.8} />
        {armed ? <Circle cx={28} cy={28} r={1.2} color={INK.peak} /> : null}
        <Circle cx={33} cy={20} r={1} color={clip ? INK.peak : '#3a1512'} />
        {armed ? (
          <Circle cx={20} cy={55} r={6} color={INK.peak} opacity={0.45}>
            <BlurMask blur={1.6} style="normal" />
          </Circle>
        ) : null}
        <Circle cx={20} cy={55} r={4.6}>
          <RadialGradient c={vec(18.6, 53.6)} r={6} colors={armed ? ['#ff8a7e', '#b3281e'] : ['#7a2018', '#3a0f0b']} />
        </Circle>
        {[11, 17.2, 23.4].map((x) => (
          <RoundedRect key={x} x={x} y={66} width={5.6} height={3.4} r={0.8}>
            <LinearGradient start={vec(0, 66)} end={vec(0, 69.4)} colors={[INK.padHi, INK.padLo]} />
          </RoundedRect>
        ))}
      </Scaled>
      <Leg b={b} g={g} x={20} y={33.6} size={6.6} text={armed ? 'REC' : 'STOP'} color={armed ? '#ff8a7e' : INK.print} />
    </Group>
  );
});

/* ── a handheld mic in a desk stand (70 × 80) ─────────────────────────── */

const MIC_ANG = 0.62;
const MIC_S = 0.24;
const MIC_HEAD = { x: 35 - 100 * MIC_S * Math.cos(MIC_ANG), y: 33 - 100 * MIC_S * Math.sin(MIC_ANG) };
const MIC_TAIL = { x: MIC_HEAD.x + MIC_TRUE.tail.DYNAMIC * MIC_S * Math.cos(MIC_ANG), y: MIC_HEAD.y + MIC_TRUE.tail.DYNAMIC * MIC_S * Math.sin(MIC_ANG) };

const MicTile = memo(function MicTile({ b, on }: { b: B; on: boolean }) {
  const g = b.w / TILE_SIZE.mic.w;
  const plugEnd = { x: MIC_TAIL.x + 44 * MIC_S * Math.cos(MIC_ANG), y: MIC_TAIL.y + 44 * MIC_S * Math.sin(MIC_ANG) };
  const lead = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(plugEnd.x, plugEnd.y);
    p.cubicTo(plugEnd.x + 6, plugEnd.y + 8, plugEnd.x + 4, 77.4, 60, 77.6);
    p.lineTo(72, 77.6);
    return p.detach();
  }, [plugEnd.x, plugEnd.y]);
  return (
    <Scaled b={b} g={g}>
      <Oval x={10} y={73} width={50} height={8} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.6} style="normal" />
      </Oval>
      {/* the cast base and the rod */}
      <Oval x={13} y={70} width={44} height={9}>
        <LinearGradient start={vec(0, 70)} end={vec(0, 79)} colors={['#2c2e33', '#0b0c0e']} />
      </Oval>
      <Oval x={14} y={70} width={42} height={6}>
        <LinearGradient start={vec(14, 0)} end={vec(56, 0)} colors={['#5c626b', '#2a2c31', '#16171a']} />
      </Oval>
      <RoundedRect x={33.4} y={34} width={3.2} height={39} r={1}>
        <LinearGradient start={vec(33.4, 0)} end={vec(36.6, 0)} colors={['#8a9099', '#e6e9ee', '#4a4f57']} />
      </RoundedRect>
      {/* the lead from the mic's plug, lying on the table */}
      <Path path={lead} style="stroke" strokeWidth={2.2} color="#3d4046" strokeCap="round" />
      <Path path={lead} style="stroke" strokeWidth={0.4} color="rgba(190,196,206,0.8)" />
      <HandheldMic x={MIC_HEAD.x} y={MIC_HEAD.y} ang={MIC_ANG} s={MIC_S} device="DYNAMIC" live={on} tail={MIC_TRUE.tail.DYNAMIC} />
      <Group transform={[{ translateX: MIC_TAIL.x }, { translateY: MIC_TAIL.y }, { rotate: MIC_ANG }, { scale: MIC_S }]}>
        <MicXlrPlug x={0} y={0} />
      </Group>
      {/* the clip round the body, and its swivel */}
      <Group transform={[{ translateX: 35 }, { translateY: 33 }, { rotate: MIC_ANG }]}>
        <RoundedRect x={-5.4} y={-4.6} width={10.8} height={9.2} r={2.4} style="stroke" strokeWidth={1.8} color="#141518" />
      </Group>
      <Circle cx={35} cy={37.4} r={2.2}>
        <RadialGradient c={vec(34.2, 36.6)} r={2.6} colors={['#5c626b', '#121316']} />
      </Circle>
    </Scaled>
  );
});

/* ── the wall plate (30 × 48, board units) ────────────────────────────── */

export const WallPlate = memo(function WallPlate({ x, y }: { x: number; y: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={1} y={1.6} width={30} height={48} r={2.4} color="rgba(0,0,0,0.55)">
        <BlurMask blur={1.6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={30} height={48} r={2.4}>
        <LinearGradient start={vec(0, 0)} end={vec(30, 48)} colors={['#f2efe8', '#d9d5ca', '#bdb8ac']} />
      </RoundedRect>
      <RoundedRect x={0.3} y={0.3} width={29.4} height={47.4} r={2.2} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.7)" />
      {[WALL_PLATE.top, WALL_PLATE.bottom].map((o) => (
        <Group key={o.y}>
          <RoundedRect x={o.x - 8} y={o.y - 7.4} width={16} height={14.8} r={4.4}>
            <LinearGradient start={vec(0, o.y - 7.4)} end={vec(0, o.y + 7.4)} colors={['#e9e6de', '#cbc6ba']} />
          </RoundedRect>
          <RoundedRect x={o.x - 8} y={o.y - 7.4} width={16} height={14.8} r={4.4} style="stroke" strokeWidth={0.4} color="rgba(0,0,0,0.28)" />
          {/* the two blades' slots (the neutral one taller) and the earth hole */}
          <RoundedRect x={o.x - 5} y={o.y - 4.6} width={1.6} height={5.4} r={0.4} color="#2a2a2a" />
          <RoundedRect x={o.x + 3.4} y={o.y - 4.2} width={1.6} height={4.6} r={0.4} color="#2a2a2a" />
          <Path path={Skia.Path.MakeFromSVGString(`M${o.x - 1.6} ${o.y + 4.4} A1.6 1.6 0 0 0 ${o.x + 1.6} ${o.y + 4.4} L${o.x + 1.6} ${o.y + 3} L${o.x - 1.6} ${o.y + 3} Z`)!} color="#2a2a2a" />
        </Group>
      ))}
      <Circle cx={15} cy={24} r={1.3}>
        <RadialGradient c={vec(14.6, 23.6)} r={1.6} colors={['#f4f6f8', '#8a9099']} />
      </Circle>
      <Line p1={vec(14.2, 24)} p2={vec(15.8, 24)} color="#4a4f57" strokeWidth={0.4} />
    </Group>
  );
});

/* ── one entry point ──────────────────────────────────────────────────── */

/** Draw `art` into box `b` (board units; `b` already has the tile's aspect). */
export function TileDevice({ art, b }: { art: TileArt; b: B }) {
  switch (art.kind) {
    case 'laptop':
      return <LaptopTile b={b} screen={art.screen} usb={art.usb} />;
    case 'player':
      return <PlayerTile b={b} screen={art.screen} stick={art.stick} />;
    case 'channel':
      return <ChannelTile b={b} a={art} />;
    case 'micch':
      return <MicChTile b={b} a={art} />;
    case 'master':
      return <MasterTile b={b} a={art} />;
    case 'speaker':
      return <SpeakerTile b={b} on={art.on} clip={art.clip} />;
    case 'monitors':
      return <MonitorsTile b={b} on={art.on} />;
    case 'phones':
      return <PhonesTile b={b} />;
    case 'recorder':
      return <RecorderTile b={b} armed={art.armed} clip={art.clip} />;
    case 'mic':
      return <MicTile b={b} on={art.on} />;
    case 'wall':
      return <WallPlate x={b.x} y={b.y} />;
  }
}
