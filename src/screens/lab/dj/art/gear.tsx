/**
 * gear — the rest of the DJ booth's equipment, drawn as the real objects,
 * AUTHORED IN MILLIMETRES (class dimensions in docs/labs/dj/SOURCES.md):
 *
 *   Headphones      closed-back DJ headphones, front view (~190 × 200 mm),
 *                   coiled cable to a 6.35 mm stereo (TRS) plug; each cup can
 *                   glow with what it carries (split cue).
 *   PowerSpeaker    a 12-inch two-way powered PA speaker, front (365 × 600)
 *                   and its rear amplifier panel; `small` = an 8-inch booth
 *                   monitor (270 × 420).
 *   Laptop          an open laptop running two-deck DJ software (the decks'
 *                   waveforms are the real tracks' overviews).
 *   ControllerTop   a two-deck controller with a built-in audio interface
 *                   (550 × 320); `standalone` adds its own screen and media
 *                   slot (a standalone system).
 *   InterfaceTop    a small USB audio interface (160 × 110).
 *   PowerStrip      a switched eight-outlet power strip (330 × 64).
 *
 * Generic: no brand likeness, no logos, no trade dress.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Oval, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { ComboSocket, Fader, Key, Knob, Led, IecInlet, RcaSocket, Rocker, RoundButton, TrsSocket, UsbB, XlrSocket } from './parts';
import { wavePath, WAVE_COLOURS, WAVE_POSITIONS } from './waves';
import { SceneText } from './sceneText';

/* ── headphones ───────────────────────────────────────────────────────── */

export const PHONES_W = 190;
export const PHONES_H = 250;

export const Headphones = memo(function Headphones({ x, y, s = 1, leftGlow, rightGlow, showPlug = true }: { x: number; y: number; s?: number; leftGlow?: string | null; rightGlow?: string | null; showPlug?: boolean }) {
  const band = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(22, 92);
    p.cubicTo(18, 10, 172, 10, 168, 92);
    return p.detach();
  }, []);
  const pad = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(46, 40);
    p.cubicTo(70, 18, 120, 18, 144, 40);
    return p.detach();
  }, []);
  const coil = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const x0 = 30;
    const y0 = 172;
    p.moveTo(x0, y0);
    // a coiled cable: loops along a gentle curve down to the plug
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const cx = x0 + 45 * t + 18 * Math.sin(t * Math.PI);
      const cy = y0 + 58 * t;
      const lx = Math.cos(t * Math.PI * 2 * 9) * 5;
      const ly = Math.sin(t * Math.PI * 2 * 9) * 2.4;
      p.lineTo(cx + lx, cy + ly);
    }
    return p.detach();
  }, []);
  const cup = (cx: number, glow: string | null | undefined, side: 'L' | 'R') => (
    <Group key={side}>
      {glow ? (
        <Oval x={cx - 46} y={96} width={92} height={96} color={glow} opacity={0.55}>
          <BlurMask blur={9} style="normal" />
        </Oval>
      ) : null}
      {/* yoke */}
      <Path
        path={(() => {
          const p = Skia.PathBuilder.Make();
          p.moveTo(cx - 26, 108);
          p.cubicTo(cx - 30, 92, cx - 18, 84, cx, 84);
          p.cubicTo(cx + 18, 84, cx + 30, 92, cx + 26, 108);
          return p.detach();
        })()}
        style="stroke"
        strokeWidth={5}
        color="#5a5f68"
        strokeCap="round"
      />
      {/* cup shell + cushion seen from the front (the cup's depth shows) */}
      <Oval x={cx - 38} y={102} width={76} height={86}>
        <RadialGradient c={vec(cx - 12, 124)} r={60} colors={['#3d4047', '#16171a', '#0b0b0d']} positions={[0, 0.6, 1]} />
      </Oval>
      <Oval x={cx - 38} y={102} width={76} height={86} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.14)" />
      <Oval x={cx - 22} y={118} width={44} height={54}>
        <RadialGradient c={vec(cx - 6, 132)} r={36} colors={['#55595f', '#202226']} />
      </Oval>
      <Oval x={cx - 12} y={124} width={14} height={18} color="rgba(255,255,255,0.12)">
        <BlurMask blur={4} style="normal" />
      </Oval>
      <SceneText x={cx} y={152} size={12} text={side} color={INK.print} face="label" align="center" />
    </Group>
  );
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      {/* headband: the steel band and its padded underside */}
      <Path path={band} style="stroke" strokeWidth={9} color="#1a1b1e" strokeCap="round" />
      <Path path={band} style="stroke" strokeWidth={6.5} color="#2c2e33" strokeCap="round" />
      <Path path={band} style="stroke" strokeWidth={1.4} color="rgba(255,255,255,0.18)" strokeCap="round" />
      <Path path={pad} style="stroke" strokeWidth={10} color="#121315" strokeCap="round" />
      {/* the sliders */}
      {[22, 168].map((sx) => (
        <RoundedRect key={sx} x={sx - 3} y={84} width={6} height={22} r={2}>
          <LinearGradient start={vec(sx - 3, 0)} end={vec(sx + 3, 0)} colors={['#8a9099', '#d8dce2', '#6a7078']} />
        </RoundedRect>
      ))}
      {cup(36, leftGlow, 'L')}
      {cup(154, rightGlow, 'R')}
      {/* the cable leaves the LEFT cup, coils, and ends in the jack plug */}
      <Path path={coil} style="stroke" strokeWidth={2.4} color="#141518" />
      <Path path={coil} style="stroke" strokeWidth={0.7} color="rgba(255,255,255,0.18)" />
      {showPlug ? (
      <Group transform={[{ translateX: 84 }, { translateY: 230 }]}>
        <RoundedRect x={-5} y={-2} width={10} height={14} r={2} color="#16171a" />
        <RoundedRect x={-4} y={12} width={8} height={10} r={1.5}>
          <LinearGradient start={vec(-4, 0)} end={vec(4, 0)} colors={['#8a9099', '#e6e9ee', '#6a7078']} />
        </RoundedRect>
        <Rect x={-2.2} y={22} width={4.4} height={12} color="#c9ced5" />
        <Rect x={-2.2} y={27} width={4.4} height={0.8} color="#16171a" />
        <Rect x={-2.2} y={31} width={4.4} height={0.8} color="#16171a" />
      </Group>
      ) : null}
    </Group>
  );
});

/** Where the headphone cable leaves the drawing (local mm, before `s`). */
export const PHONES_CABLE_END = { x: 84, y: 230 } as const;

/* ── powered speakers ─────────────────────────────────────────────────── */

export const SPEAKER_W = 365;
export const SPEAKER_H = 600;

/** A powered speaker's FRONT. `on` lights the power LED; `small` draws the
 *  8-inch booth monitor proportions. Drawn in its own box at (x, y), scaled
 *  by `s` (1 = true size). */
export const PowerSpeaker = memo(function PowerSpeaker({ x, y, s = 1, on, small = false, signal }: { x: number; y: number; s?: number; on: boolean; small?: boolean; signal?: boolean }) {
  const W = small ? 270 : SPEAKER_W;
  const H = small ? 420 : SPEAKER_H;
  const shell = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const t = W * 0.06;
    p.moveTo(t, 0);
    p.lineTo(W - t, 0);
    p.quadTo(W, 0, W, t);
    p.lineTo(W - t * 0.3, H - t);
    p.quadTo(W - t * 0.3, H, W - t * 1.3, H);
    p.lineTo(t * 1.3, H);
    p.quadTo(t * 0.3, H, t * 0.3, H - t);
    p.lineTo(0, t);
    p.quadTo(0, 0, t, 0);
    p.close();
    return p.detach();
  }, [W, H]);
  const g = { x: W * 0.09, y: H * 0.06, w: W * 0.82, h: H * 0.86 };
  const holes = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const pitch = 7.5;
    for (let yy = g.y + 5; yy < g.y + g.h - 3; yy += pitch * 0.87) {
      const row = Math.round((yy - g.y) / (pitch * 0.87));
      for (let xx = g.x + 5 + (row % 2) * (pitch / 2); xx < g.x + g.w - 3; xx += pitch) p.addCircle(xx, yy, 2);
    }
    return p.detach();
  }, [g.x, g.y, g.w, g.h]);
  const wR = (small ? 203 : 305) / 2;
  const wy = g.y + g.h * (small ? 0.64 : 0.66);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <Path path={shell} color="rgba(0,0,0,0.7)" transform={[{ translateX: 6 }, { translateY: 10 }]}>
        <BlurMask blur={12} style="normal" />
      </Path>
      <Path path={shell}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2f3237', '#1a1b1f', '#0f1012']} positions={[0, 0.5, 1]} />
      </Path>
      <Path path={shell} style="stroke" strokeWidth={2} color={INK.bevel} />
      {/* behind the grille: the horn (top) and the woofer (bottom) */}
      <RoundedRect x={W / 2 - W * 0.26} y={g.y + g.h * 0.07} width={W * 0.52} height={g.h * 0.2} r={10} color="#0b0b0d" />
      <RoundedRect x={W / 2 - W * 0.12} y={g.y + g.h * 0.12} width={W * 0.24} height={g.h * 0.1} r={6} color="#050506" />
      <Circle cx={W / 2} cy={wy} r={wR} color="#09090b" />
      <Circle cx={W / 2} cy={wy} r={wR * 0.86}>
        <RadialGradient c={vec(W / 2 - wR * 0.3, wy - wR * 0.3)} r={wR * 1.2} colors={['#2a2c31', '#0c0d0f']} />
      </Circle>
      <Circle cx={W / 2} cy={wy} r={wR * 0.25} color="#16171a" />
      {/* the perforated steel grille */}
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h} r={10} color="rgba(40,42,47,0.55)" />
      <Path path={holes} color="rgba(0,0,0,0.55)" />
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h} r={10} style="stroke" strokeWidth={3} color="#3a3d43" />
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h * 0.5} r={10} color="rgba(255,255,255,0.05)" />
      {/* the front power LED */}
      <Led cx={W / 2} cy={H - H * 0.035} r={small ? 3.2 : 4} on={on} colour={signal ? INK.green : INK.blue} />
    </Group>
  );
});

/** The rear amplifier panel of a powered speaker (face-on, 230 × 300). */
export const SPEAKER_REAR_W = 230;
export const SPEAKER_REAR_H = 300;
export const SPEAKER_REAR = { input: { x: 70, y: 70 }, thru: { x: 160, y: 70 }, level: { x: 70, y: 150 }, power: { x: 140, y: 210 }, ac: { x: 52, y: 214 } } as const;

export const SpeakerRear = memo(function SpeakerRear({ x, y, s = 1, on, level = 0.75 }: { x: number; y: number; s?: number; on: boolean; level?: number }) {
  const W = SPEAKER_REAR_W;
  const H = SPEAKER_REAR_H;
  const R = SPEAKER_REAR;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={0} y={0} width={W} height={H} r={10}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2a2c31', '#141518']} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={10} style="stroke" strokeWidth={1.5} color={INK.bevel} />
      {/* heat-sink fins */}
      {Array.from({ length: 9 }, (_, i) => (
        <Rect key={i} x={20 + i * 21} y={H - 46} width={8} height={34} color="#0e0f11" />
      ))}
      <ComboSocket cx={R.input.x} cy={R.input.y} d={30} />
      <XlrSocket cx={R.thru.x} cy={R.thru.y} d={24} male />
      <Knob cx={R.level.x} cy={R.level.y} d={26} value={level} />
      <Led cx={150} cy={140} r={3} on={on} colour={INK.green} />
      <Led cx={170} cy={140} r={3} on={false} colour={INK.peak} />
      <IecInlet x={R.ac.x - 12} y={R.ac.y - 8} s={1.4} />
      <Rocker x={R.power.x} y={R.power.y - 6} s={1.6} on={on} />
    </Group>
  );
});

/* ── laptop with DJ software ──────────────────────────────────────────── */

export const LAPTOP_W = 330;
export const LAPTOP_H = 250;

export const Laptop = memo(function Laptop({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const deck = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(10, 210);
    p.lineTo(320, 210);
    p.lineTo(330, 246);
    p.lineTo(0, 246);
    p.close();
    return p.detach();
  }, []);
  const wA = wavePath('nightFerry', 4);
  const wB = wavePath('glassHarbour', 4);
  const sx = 22;
  const sw = 286;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={4} y={6} width={322} height={206} r={8} color="rgba(0,0,0,0.6)">
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={4} y={0} width={322} height={206} r={8}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 206)} colors={['#3a3d43', '#202226']} />
      </RoundedRect>
      <RoundedRect x={16} y={10} width={298} height={186} r={3} color="#05080c" />
      {/* the software: two decks' waveforms over the library */}
      {[0, 1].map((k) => {
        const w = k === 0 ? wA : wB;
        const top = 20 + k * 34;
        return (
          <Group key={k}>
            <Rect x={sx} y={top} width={sw} height={28} color="#0a121c" />
            {w ? (
              <Group clip={Skia.XYWHRect(sx, top, sw, 28)}>
                <Group transform={[{ translateX: sx - 40 * 22 }, { translateY: top + 14 }, { scaleX: 22 }, { scaleY: 13 }]}>
                  <Path path={w}>
                    <LinearGradient start={vec(0, -1)} end={vec(0, 1)} colors={WAVE_COLOURS} positions={WAVE_POSITIONS} />
                  </Path>
                </Group>
              </Group>
            ) : null}
            <Line p1={vec(sx + sw / 2, top)} p2={vec(sx + sw / 2, top + 28)} color={INK.white} strokeWidth={0.8} />
          </Group>
        );
      })}
      {Array.from({ length: 7 }, (_, i) => (
        <Rect key={i} x={sx} y={96 + i * 13} width={sw} height={10} color={i === 2 ? '#13324f' : '#0b1118'} />
      ))}
      {/* the keyboard deck */}
      <Path path={deck}>
        <LinearGradient start={vec(0, 210)} end={vec(0, 246)} colors={['#4a4e55', '#26282d']} />
      </Path>
      <Rect x={60} y={214} width={210} height={20} color="#16171a" opacity={0.85} />
      <RoundedRect x={140} y={236} width={50} height={7} r={2} color="#1d1f23" />
    </Group>
  );
});

/* ── a two-deck controller / a standalone system ──────────────────────── */

export const CTRL_W = 550;
export const CTRL_D = 320;

export const ControllerTop = memo(function ControllerTop({ x, y, s = 1, standalone = false }: { x: number; y: number; s?: number; standalone?: boolean }) {
  const jog = (cx: number) => (
    <Group key={cx}>
      <Circle cx={cx + 3} cy={198} r={76} color="rgba(0,0,0,0.6)">
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Circle cx={cx} cy={194} r={75}>
        <RadialGradient c={vec(cx - 25, 170)} r={110} colors={['#c9ced5', '#6f757e', '#3a3e45']} />
      </Circle>
      <Circle cx={cx} cy={194} r={66}>
        <RadialGradient c={vec(cx - 20, 172)} r={90} colors={['#33363c', '#121315']} />
      </Circle>
      <Circle cx={cx} cy={194} r={18} color="#0a0b0d" />
      <RoundedRect x={cx - 1.5} y={130} width={3} height={14} r={1} color={INK.white} opacity={0.7} />
    </Group>
  );
  const W = CTRL_W;
  const D = CTRL_D;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={6} y={10} width={W} height={D} r={18} color="rgba(0,0,0,0.75)">
        <BlurMask blur={12} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={D} r={18}>
        <LinearGradient start={vec(0, 0)} end={vec(W, D)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
      </RoundedRect>
      <RoundedRect x={0.7} y={0.7} width={W - 1.4} height={D - 1.4} r={17} style="stroke" strokeWidth={1.4} color={INK.bevel} />
      {jog(122)}
      {jog(428)}
      {/* the centre mixer section */}
      <RoundedRect x={212} y={14} width={126} height={292} r={8} color="#141518" />
      {standalone ? (
        <Group>
          <RoundedRect x={222} y={20} width={106} height={66} r={3} color="#050506" />
          <RoundedRect x={225} y={23} width={100} height={60} r={2}>
            <LinearGradient start={vec(0, 23)} end={vec(0, 83)} colors={[INK.lcdHi, INK.lcdLo]} />
          </RoundedRect>
          {[0, 1].map((k) => (
            <Rect key={k} x={229} y={30 + k * 22} width={92} height={16} color={k ? '#0f2b23' : '#102438'} />
          ))}
        </Group>
      ) : (
        <Knob cx={275} cy={40} d={20} value={0.5} capTone="black" scale={false} />
      )}
      {[246, 304].map((cx) => (
        <Group key={cx}>
          <Knob cx={cx} cy={standalone ? 104 : 80} d={15} value={0.5} centre scale={false} />
          <Knob cx={cx} cy={standalone ? 130 : 110} d={15} value={0.5} centre scale={false} />
          <Knob cx={cx} cy={standalone ? 156 : 140} d={15} value={0.5} centre scale={false} />
          <Fader x={cx} y={190} len={60} value={0.85} capW={11} capL={18} ticks={7} />
        </Group>
      ))}
      <Fader x={286} y={252} len={46} value={0.5} horizontal capW={11} capL={18} ticks={7} />
      {/* deck controls */}
      {[26, 506].map((tx) => (
        <Fader key={tx} x={tx + 10} y={110} len={140} value={0.5} capW={16} capL={10} ticks={9} />
      ))}
      {[60, 366].map((px) => (
        <Group key={px}>
          {[0, 1, 2, 3].map((i) => (
            <Key key={i} x={px + i * 30} y={278} w={26} h={22} />
          ))}
        </Group>
      ))}
      <RoundButton cx={34} cy={290} d={24} lit={false} colour={INK.amber} glyph="cue" />
      <RoundButton cx={516} cy={290} d={24} lit={false} colour={INK.green} glyph="play" />
      {standalone ? <RoundedRect x={392} y={14} width={34} height={9} r={2} color="#050506" /> : null}
    </Group>
  );
});

/* ── a small USB audio interface ──────────────────────────────────────── */

export const IFACE_W = 160;
export const IFACE_D = 110;

export const InterfaceTop = memo(function InterfaceTop({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={4} y={7} width={IFACE_W} height={IFACE_D} r={10} color="rgba(0,0,0,0.7)">
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={IFACE_W} height={IFACE_D} r={10}>
        <LinearGradient start={vec(0, 0)} end={vec(IFACE_W, IFACE_D)} colors={['#3a3d43', '#1a1b1f']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={IFACE_W - 1.2} height={IFACE_D - 1.2} r={9.5} style="stroke" strokeWidth={1.2} color={INK.bevel} />
      <Knob cx={54} cy={52} d={34} value={0.6} />
      <Knob cx={112} cy={52} d={22} value={0.4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Led key={i} cx={30 + i * 9} cy={92} r={2} on={i < 3} colour={i < 3 ? INK.green : INK.amber} />
      ))}
      <Led cx={140} cy={18} r={2.2} on colour={INK.blue} />
    </Group>
  );
});

/* ── the power strip ──────────────────────────────────────────────────── */

export const STRIP_W = 330;
export const STRIP_D = 64;
export const stripOutletX = (i: number): number => 54 + (i - 1) * 34;

export const PowerStrip = memo(function PowerStrip({ x, y, s = 1, on, used = [] }: { x: number; y: number; s?: number; on: boolean; used?: readonly number[] }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={3} y={6} width={STRIP_W} height={STRIP_D} r={14} color="rgba(0,0,0,0.7)">
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={STRIP_W} height={STRIP_D} r={14}>
        <LinearGradient start={vec(0, 0)} end={vec(0, STRIP_D)} colors={['#3b3e44', '#1b1c20']} />
      </RoundedRect>
      <RoundedRect x={10} y={20} width={24} height={24} r={4} color={on ? '#b8321f' : '#4a1a13'} />
      {on ? (
        <RoundedRect x={10} y={20} width={24} height={24} r={4} color="#ff5a3a" opacity={0.35}>
          <BlurMask blur={5} style="normal" />
        </RoundedRect>
      ) : null}
      {Array.from({ length: 8 }, (_, k) => {
        const i = k + 1;
        const ox = stripOutletX(i);
        return (
          <Group key={i}>
            <RoundedRect x={ox - 13} y={12} width={26} height={40} r={5} color={used.includes(i) ? '#101113' : '#0c0d0f'} />
            <Rect x={ox - 6} y={20} width={3} height={10} color="#000" />
            <Rect x={ox + 3} y={20} width={3} height={10} color="#000" />
            <Circle cx={ox} cy={40} r={3} color="#000" />
          </Group>
        );
      })}
    </Group>
  );
});

/** A speaker shown with its stand pole (for the system map). */
export function Pole({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <Group>
      <Rect x={x - 6} y={y} width={12} height={h} color="#2a2c31" />
      <Rect x={x - 6} y={y} width={4} height={h} color="rgba(255,255,255,0.12)" />
    </Group>
  );
}

export { RcaSocket, TrsSocket, UsbB };
