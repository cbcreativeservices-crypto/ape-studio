/**
 * gear — the rest of the DJ booth's equipment, drawn as the real objects,
 * AUTHORED IN MILLIMETRES (class dimensions in docs/labs/dj/SOURCES.md):
 *
 *   Headphones      closed-back DJ headphones seen from the front, as you
 *                   wear them (L on the wearer's left): padded, stitched
 *                   headband, steel sliders into swivel yokes, upright cups
 *                   nearly edge-on with pleated cushions; a coiled cable to a
 *                   6.35 mm stereo (TRS) plug. Each cup can glow with what it
 *                   carries (split cue).
 *   PowerSpeaker    a 12-inch two-way powered PA speaker, front (365 × 600):
 *                   tapered cabinet, handle cut-out, waveguide horn and
 *                   woofer behind a perforated grille; `small` = an 8-inch
 *                   booth monitor (270 × 420).
 *   SpeakerRear     its amplifier panel; SpeakerPlate the compact input plate
 *                   (combo input, level, IEC inlet, switch) the room map wires.
 *   Laptop          an open laptop from ABOVE (lid leaning back, so its
 *                   screen is foreshortened): keyboard, trackpad, the DJ
 *                   software (the decks' waveforms are the real tracks').
 *   ControllerTop   a two-deck controller (550 × 320) with its built-in audio
 *                   interface: jogs, tempo, transport, SYNC / SHIFT, loop,
 *                   hot cues 1–4, browse and load, a two-channel mixer with
 *                   level meters; `standalone` adds its own screen and slot.
 *   InterfaceTop    a small USB audio interface (160 × 110) and InterfaceRear
 *                   (two balanced TRS outputs, USB-C).
 *   PowerStrip      a switched eight-outlet power strip (330 × 64).
 *   TripodStand     a speaker stand (pole into the cabinet's top-hat cup).
 *
 * Generic: no brand likeness, no logos, no trade dress.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Oval, Path, RadialGradient, Rect, RoundedRect, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { CUE_COLOURS, INK } from './ink';
import { ComboSocket, Fader, Key, Knob, Led, LedColumn, IecInlet, RcaSocket, Rocker, RoundButton, shade, TrsSocket, UsbB, UsbC, XlrSocket } from './parts';
import { WaveBody } from './waveDraw';
import { SceneText } from './sceneText';
import { PHONES_CABLE_END, PHONES_H, PHONES_W, PLATE, PLATE_H, PLATE_W, SPEAKER_H, SPEAKER_W, STRIP_D, STRIP_W, stripOutletX } from '../geometry/gearGeometry';

export { PHONES_CABLE_END, PHONES_H, PHONES_W, PLATE, PLATE_H, PLATE_W, SPEAKER_H, SPEAKER_W, STRIP_D, STRIP_W, stripOutletX };

const LEG = 4;

/* ── headphones ───────────────────────────────────────────────────────── */


const CUP = { L: 46, R: 154, cy: 162, rx: 34, ry: 47 } as const;

export const Headphones = memo(function Headphones({ x, y, s = 1, leftGlow, rightGlow, showPlug = true }: { x: number; y: number; s?: number; leftGlow?: string | null; rightGlow?: string | null; showPlug?: boolean }) {
  const band = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(30, 96);
    p.cubicTo(18, 4, 182, 4, 170, 96);
    return p.detach();
  }, []);
  const pad = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(52, 46);
    p.cubicTo(76, 20, 124, 20, 148, 46);
    return p.detach();
  }, []);
  // the coiled cable: overlapping lit loops along a gentle curve from the
  // left cup down to where it straightens
  const coil = useMemo(() => {
    const loops: { cx: number; cy: number; a: number }[] = [];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const cx = 46 + 50 * t + 8 * Math.sin(t * Math.PI);
      const cy = 212 + 28 * t;
      const dx = 50 + 8 * Math.PI * Math.cos(t * Math.PI);
      const a = Math.atan2(28, dx);
      loops.push({ cx, cy, a });
    }
    return loops;
  }, []);
  const coilLit = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addArc(Skia.XYWHRect(-6.4, -2.6, 12.8, 5.2), 195, 110);
    return p.detach();
  }, []);
  const cup = (side: 'L' | 'R', glow: string | null | undefined) => {
    const cx = side === 'L' ? CUP.L : CUP.R;
    const out = side === 'L' ? -1 : 1; // the cup's outer side
    const shellCx = cx + out * 7;
    const cushCx = cx - out * 19;
    const pleats = (() => {
      const p = Skia.PathBuilder.Make();
      for (let i = 0; i < 15; i++) {
        const t = (i + 0.5) / 15;
        const yy = CUP.cy - CUP.ry * 0.92 + t * CUP.ry * 1.84;
        const half = 13 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - CUP.cy) / (CUP.ry * 0.96), 2)));
        p.moveTo(cushCx - half * 0.85, yy);
        p.quadTo(cushCx, yy + 1.6, cushCx + half * 0.85, yy);
      }
      return p.detach();
    })();
    const arm = (() => {
      const p = Skia.PathBuilder.Make();
      p.moveTo(cx + out * 2, 108);
      p.cubicTo(cx + out * 14, 118, cx + out * 12, 142, shellCx + out * 2, CUP.cy);
      return p.detach();
    })();
    return (
      <Group key={side}>
        {glow ? (
          <Oval x={cx - CUP.rx - 8} y={CUP.cy - CUP.ry - 8} width={(CUP.rx + 8) * 2} height={(CUP.ry + 8) * 2} color={glow} opacity={0.5}>
            <BlurMask blur={10} style="normal" />
          </Oval>
        ) : null}
        {/* contact shadow */}
        <Oval x={cx - CUP.rx + 3} y={CUP.cy - CUP.ry + 5} width={CUP.rx * 2} height={CUP.ry * 2} color="rgba(0,0,0,0.6)">
          <BlurMask blur={5} style="normal" />
        </Oval>
        {/* the cushion (inner side): leatherette, pleated */}
        <Oval x={cushCx - 15} y={CUP.cy - CUP.ry} width={30} height={CUP.ry * 2}>
          <LinearGradient start={vec(cushCx - 15, CUP.cy - CUP.ry)} end={vec(cushCx + 15, CUP.cy + CUP.ry)} colors={['#3b3d42', '#1c1d21', '#0d0e10']} />
        </Oval>
        <Path path={pleats} style="stroke" strokeWidth={0.7} color="rgba(0,0,0,0.6)" />
        <Path path={pleats} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.10)" transform={[{ translateY: -0.7 }]} />
        {/* the shell (outer side): a moulded dome lit from the upper left */}
        <Oval x={shellCx - 28} y={CUP.cy - CUP.ry + 1} width={56} height={CUP.ry * 2 - 2}>
          <RadialGradient c={vec(shellCx - 12, CUP.cy - 26)} r={70} colors={['#565a62', '#2a2c31', '#121315', '#08080a']} positions={[0, 0.35, 0.75, 1]} />
        </Oval>
        <Oval x={shellCx - 28} y={CUP.cy - CUP.ry + 1} width={56} height={CUP.ry * 2 - 2} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
        {/* the seam between shell and cushion */}
        <Oval x={cx - out * 6 - 3} y={CUP.cy - CUP.ry + 2} width={6} height={CUP.ry * 2 - 4} color="#060607" />
        <Oval x={shellCx - 14} y={CUP.cy - 34} width={14} height={26} color="rgba(255,255,255,0.13)">
          <BlurMask blur={4} style="normal" />
        </Oval>
        {/* the swivel yoke: an arm over the cup's front to its pivot boss */}
        <Path path={arm} style="stroke" strokeWidth={6} color="#0b0c0e" strokeCap="round" />
        <Path path={arm} style="stroke" strokeWidth={4.4} strokeCap="round">
          <LinearGradient start={vec(cx - 10, 100)} end={vec(cx + 10, 170)} colors={['#c9ced5', '#6f757e', '#3a3e45']} />
        </Path>
        <Circle cx={shellCx + out * 2} cy={CUP.cy} r={5.4} color="#0b0c0e" />
        <Circle cx={shellCx + out * 2} cy={CUP.cy} r={4.2}>
          <RadialGradient c={vec(shellCx + out * 2 - 1.4, CUP.cy - 1.4)} r={5} colors={[INK.metalHi, INK.metalLo]} />
        </Circle>
        {/* the yoke's top block, L / R embossed */}
        <RoundedRect x={cx - 10} y={98} width={20} height={12} r={3.5}>
          <LinearGradient start={vec(cx - 10, 98)} end={vec(cx + 10, 110)} colors={['#4a4d54', '#1d1f23']} />
        </RoundedRect>
        <RoundedRect x={cx - 10} y={98} width={20} height={12} r={3.5} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.18)" />
        <SceneText x={cx + 0.3} y={107.6} size={8} text={side} color="rgba(0,0,0,0.75)" face="label" align="center" />
        <SceneText x={cx} y={107} size={8} text={side} color={INK.print} face="label" align="center" />
      </Group>
    );
  };
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      {/* headband: the spring-steel band */}
      <Path path={band} style="stroke" strokeWidth={9} color="#0b0c0e" strokeCap="round" />
      <Path path={band} style="stroke" strokeWidth={7}>
        <LinearGradient start={vec(20, 0)} end={vec(180, 90)} colors={['#5a5e66', '#2c2e33', '#17181b']} />
      </Path>
      <Path path={band} style="stroke" strokeWidth={1.3} color="rgba(255,255,255,0.22)" transform={[{ translateY: -2 }]} />
      {/* the padded underside, with its stitching */}
      <Path path={pad} style="stroke" strokeWidth={15} color="#0d0e10" strokeCap="round" />
      <Path path={pad} style="stroke" strokeWidth={12.5} strokeCap="round">
        <LinearGradient start={vec(0, 22)} end={vec(0, 50)} colors={['#3a3c42', '#1b1c20']} />
      </Path>
      <Path path={pad} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.28)" transform={[{ translateY: -4 }]}>
        <DashPathEffect intervals={[2.2, 1.8]} />
      </Path>
      <Path path={pad} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.18)" transform={[{ translateY: 4 }]}>
        <DashPathEffect intervals={[2.2, 1.8]} />
      </Path>
      {/* the steel sliders, out of the band into the yokes */}
      {[30, 170].map((sx) => (
        <Group key={sx}>
          <RoundedRect x={sx - 3} y={78} width={6} height={26} r={2}>
            <LinearGradient start={vec(sx - 3, 0)} end={vec(sx + 3, 0)} colors={['#7a8089', '#e1e5ea', '#5c626b']} />
          </RoundedRect>
          {[84, 90, 96].map((ny) => (
            <Line key={ny} p1={vec(sx - 2.6, ny)} p2={vec(sx + 2.6, ny)} color="rgba(0,0,0,0.35)" strokeWidth={0.5} />
          ))}
        </Group>
      ))}
      {/* the slider bends into the yoke block */}
      <Line p1={vec(30, 103)} p2={vec(CUP.L - 6, 103)} color="#8a9099" strokeWidth={3} strokeCap="round" />
      <Line p1={vec(170, 103)} p2={vec(CUP.R + 6, 103)} color="#8a9099" strokeWidth={3} strokeCap="round" />
      {cup('L', leftGlow)}
      {cup('R', rightGlow)}
      {/* the cable leaves the LEFT cup, coils, then runs straight to the plug */}
      <Line p1={vec(46, 205)} p2={vec(46, 213)} color="#121315" strokeWidth={3.2} strokeCap="round" />
      {coil.map((c, i) => (
        <Group key={i} transform={[{ translateX: c.cx }, { translateY: c.cy }, { rotate: c.a + Math.PI / 2 }]}>
          <Oval x={-6.4} y={-2.6} width={12.8} height={5.2} style="stroke" strokeWidth={2.6} color="#0f1012" />
          <Path path={coilLit} style="stroke" strokeWidth={0.7} color="rgba(255,255,255,0.24)" strokeCap="round" />
        </Group>
      ))}
      <Line p1={vec(coil[coil.length - 1].cx, coil[coil.length - 1].cy)} p2={vec(PHONES_CABLE_END.x, PHONES_CABLE_END.y)} color="#121315" strokeWidth={3} strokeCap="round" />
      {showPlug ? <JackPlug x={PHONES_CABLE_END.x} y={PHONES_CABLE_END.y} /> : null}
    </Group>
  );
});

/** A 6.35 mm stereo (TRS) jack plug, side view, pointing down from (x, y):
 *  strain-relief boot, knurled shell, collar, then the sleeve, ring and tip
 *  with their two insulator bands. */
export function JackPlug({ x, y }: { x: number; y: number }) {
  const boot = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(x - 2.8, y);
    p.lineTo(x + 2.8, y);
    p.lineTo(x + 4.6, y + 11);
    p.lineTo(x - 4.6, y + 11);
    p.close();
    return p.detach();
  }, [x, y]);
  const tip = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(x - 3.17, y + 52);
    p.lineTo(x + 3.17, y + 52);
    p.quadTo(x + 3.17, y + 57, x, y + 58);
    p.quadTo(x - 3.17, y + 57, x - 3.17, y + 52);
    p.close();
    return p.detach();
  }, [x, y]);
  const metal = (x0: number, x1: number) => <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={['#7a8089', '#eef1f4', '#9aa0a8', '#5c626b']} positions={[0, 0.35, 0.6, 1]} />;
  return (
    <Group>
      <Path path={boot}>
        <LinearGradient start={vec(x - 5, 0)} end={vec(x + 5, 0)} colors={['#2a2c31', '#121315', '#060607']} />
      </Path>
      <RoundedRect x={x - 5} y={y + 11} width={10} height={17} r={1.6}>
        {metal(x - 5, x + 5)}
      </RoundedRect>
      {[14, 17, 20, 23].map((g) => (
        <Line key={g} p1={vec(x - 5, y + g)} p2={vec(x + 5, y + g)} color="rgba(0,0,0,0.3)" strokeWidth={0.5} />
      ))}
      <Rect x={x - 3.9} y={y + 28} width={7.8} height={2.2}>
        <LinearGradient start={vec(x - 4, 0)} end={vec(x + 4, 0)} colors={['#8a7440', '#f0dc9e', '#8a7440']} />
      </Rect>
      <Rect x={x - 3.17} y={y + 30.2} width={6.35} height={13.6}>
        {metal(x - 3.2, x + 3.2)}
      </Rect>
      <Rect x={x - 3.17} y={y + 43.8} width={6.35} height={1.3} color="#0b0b0d" />
      <Rect x={x - 3.17} y={y + 45.1} width={6.35} height={5.6}>
        {metal(x - 3.2, x + 3.2)}
      </Rect>
      <Rect x={x - 3.17} y={y + 50.7} width={6.35} height={1.3} color="#0b0b0d" />
      <Path path={tip}>{metal(x - 3.2, x + 3.2)}</Path>
    </Group>
  );
}

/* ── powered speakers ─────────────────────────────────────────────────── */


/** A powered speaker's FRONT. `on` lights the power LED; `small` draws the
 *  8-inch booth monitor proportions. Drawn in its own box at (x, y), scaled
 *  by `s` (1 = true size). */
export const PowerSpeaker = memo(function PowerSpeaker({ x, y, s = 1, on, small = false, signal, pole = false }: { x: number; y: number; s?: number; on: boolean; small?: boolean; signal?: boolean; pole?: boolean }) {
  const W = small ? 270 : SPEAKER_W;
  const H = small ? 420 : SPEAKER_H;
  const taper = W * 0.035;
  const shell = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const r = W * 0.05;
    p.moveTo(r, 0);
    p.lineTo(W - r, 0);
    p.quadTo(W, 0, W, r);
    p.lineTo(W - taper, H - r);
    p.quadTo(W - taper, H, W - taper - r, H);
    p.lineTo(taper + r, H);
    p.quadTo(taper, H, taper, H - r);
    p.lineTo(0, r);
    p.quadTo(0, 0, r, 0);
    p.close();
    return p.detach();
  }, [W, H, taper]);
  // the grille: a perforated steel panel; drivers show through it
  const g = { x: W * 0.085, y: H * 0.1, w: W * 0.83, h: H * 0.84 };
  const holes = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const pitch = small ? 6.2 : 7.2;
    const rr = pitch * 0.34;
    let row = 0;
    for (let yy = g.y + 5; yy < g.y + g.h - 3; yy += pitch * 0.87, row++) {
      for (let xx = g.x + 5 + (row % 2) * (pitch / 2); xx < g.x + g.w - 3; xx += pitch) p.addCircle(xx, yy, rr);
    }
    return p.detach();
  }, [g.x, g.y, g.w, g.h, small]);
  // the grille's steel webs: the plate with every hole cut out of it, so the
  // drivers behind show through the holes
  const webs = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(g.x, g.y, g.w, g.h), 10, 10));
    p.addPath(holes);
    p.setFillType(1);
    return p.detach();
  }, [g.x, g.y, g.w, g.h, holes]);
  const wR = (small ? 203 : 305) / 2;
  const wy = g.y + g.h * (small ? 0.65 : 0.66);
  const horn = { cx: W / 2, cy: g.y + g.h * (small ? 0.2 : 0.17), w: W * (small ? 0.62 : 0.58), h: H * (small ? 0.16 : 0.15) };
  const handle = { w: W * 0.36, h: small ? 16 : 22 };
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      {pole ? (
        <Group>
          <RoundedRect x={W / 2 - 22} y={H - 4} width={44} height={14} r={3}>
            <LinearGradient start={vec(W / 2 - 22, 0)} end={vec(W / 2 + 22, 0)} colors={['#3a3e45', '#9aa0a8', '#2a2c31']} />
          </RoundedRect>
        </Group>
      ) : null}
      <Path path={shell} color="rgba(0,0,0,0.7)" transform={[{ translateX: 6 }, { translateY: 10 }]}>
        <BlurMask blur={12} style="normal" />
      </Path>
      <Path path={shell}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2f3237', '#1a1b1f', '#0f1012']} positions={[0, 0.5, 1]} />
      </Path>
      {/* the side walls: the lit left edge and the shaded right one */}
      <Rect x={2} y={W * 0.05} width={7} height={H - W * 0.1}>
        <LinearGradient start={vec(2, 0)} end={vec(9, 0)} colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)']} />
      </Rect>
      <Rect x={W - taper - 8} y={W * 0.05} width={7} height={H - W * 0.1}>
        <LinearGradient start={vec(W - taper - 8, 0)} end={vec(W - taper - 1, 0)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} />
      </Rect>
      <Path path={shell} style="stroke" strokeWidth={2} color={INK.bevel} />
      {/* the carry handle cut into the top */}
      <RoundedRect x={W / 2 - handle.w / 2} y={H * 0.025} width={handle.w} height={handle.h} r={handle.h / 2}>
        <LinearGradient start={vec(0, H * 0.025)} end={vec(0, H * 0.025 + handle.h)} colors={['#020203', '#0d0e10', '#2a2c31']} positions={[0, 0.7, 1]} />
      </RoundedRect>
      <RoundedRect x={W / 2 - handle.w / 2} y={H * 0.025} width={handle.w} height={handle.h} r={handle.h / 2} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.08)" />
      {/* behind the grille: the waveguide horn… */}
      <RoundedRect x={horn.cx - horn.w / 2} y={horn.cy - horn.h / 2} width={horn.w} height={horn.h} r={horn.h * 0.22}>
        <RadialGradient c={vec(horn.cx, horn.cy)} r={horn.w * 0.55} colors={['#020203', '#17181c', '#43464d', '#666a72']} positions={[0, 0.3, 0.8, 1]} />
      </RoundedRect>
      <RoundedRect x={horn.cx - horn.w / 2} y={horn.cy - horn.h / 2} width={horn.w} height={horn.h} r={horn.h * 0.22} style="stroke" strokeWidth={1.4} color="rgba(255,255,255,0.10)" />
      <Oval x={horn.cx - W * 0.075} y={horn.cy - horn.h * 0.17} width={W * 0.15} height={horn.h * 0.34} color="#000" />
      <Oval x={horn.cx - W * 0.075} y={horn.cy - horn.h * 0.17} width={W * 0.15} height={horn.h * 0.34} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
      {/* …and the woofer: basket, surround, cone, dust cap */}
      <Circle cx={W / 2} cy={wy} r={wR} color="#060607" />
      <Circle cx={W / 2} cy={wy} r={wR * 0.97}>
        <SweepGradient c={vec(W / 2, wy)} colors={['#3a3d43', '#202226', '#3a3d43', '#1a1b1f', '#3a3d43']} />
      </Circle>
      <Circle cx={W / 2} cy={wy} r={wR * 0.9}>
        <RadialGradient c={vec(W / 2 - wR * 0.35, wy - wR * 0.4)} r={wR * 1.25} colors={['#62666e', '#2a2c31', '#121315']} positions={[0, 0.5, 1]} />
      </Circle>
      <Circle cx={W / 2} cy={wy} r={wR * 0.79} color="#08090a" />
      <Circle cx={W / 2} cy={wy} r={wR * 0.78}>
        <RadialGradient c={vec(W / 2 - wR * 0.2, wy - wR * 0.25)} r={wR * 0.95} colors={['#44474e', '#24262b', '#121315']} />
      </Circle>
      {[0.62, 0.48, 0.36].map((k) => (
        <Circle key={k} cx={W / 2} cy={wy} r={wR * k} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.04)" />
      ))}
      <Circle cx={W / 2} cy={wy} r={wR * 0.22}>
        <RadialGradient c={vec(W / 2 - wR * 0.08, wy - wR * 0.09)} r={wR * 0.26} colors={['#70747c', '#26282d']} />
      </Circle>
      <Circle cx={W / 2 - wR * 0.07} cy={wy - wR * 0.08} r={wR * 0.06} color="rgba(255,255,255,0.18)">
        <BlurMask blur={wR * 0.04} style="normal" />
      </Circle>
      {/* the perforated steel grille: holes lit on their lower-right walls */}
      <Path path={holes} color="rgba(0,0,0,0.28)" />
      <Path path={webs} opacity={0.82}>
        <LinearGradient start={vec(g.x, g.y)} end={vec(g.x + g.w, g.y + g.h)} colors={['#3a3d43', '#26282d', '#1a1b1f']} />
      </Path>
      <Path path={holes} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.10)" transform={[{ translateX: 0.35 }, { translateY: 0.45 }]} />
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h} r={10} style="stroke" strokeWidth={3} color="#3a3d43" />
      <RoundedRect x={g.x + 1.5} y={g.y + 1.5} width={g.w - 3} height={g.h - 3} r={9} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.12)" />
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h * 0.45} r={10}>
        <LinearGradient start={vec(g.x, g.y)} end={vec(g.x + g.w * 0.4, g.y + g.h * 0.45)} colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']} />
      </RoundedRect>
      {/* the front power LED */}
      <Led cx={W / 2} cy={H - H * 0.028} r={small ? 3.2 : 4} on={on} colour={signal ? INK.green : INK.blue} />
    </Group>
  );
});

/** A speaker stand, front view: three legs from a hub 600 mm above the
 *  floor (spread 1.1 m) and the pole up into the cabinet's top-hat cup at
 *  `top`; drawn at scale `s` standing on the floor line `floor`. */
export function TripodStand({ x, top, s = 1, floor }: { x: number; top: number; s?: number; floor: number }) {
  const hub = floor - 600 * s;
  const legs = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const half = 550 * s;
    p.moveTo(x, hub);
    p.lineTo(x - half, floor);
    p.moveTo(x, hub);
    p.lineTo(x + half, floor);
    p.moveTo(x, hub);
    p.lineTo(x + half * 0.12, floor - 6 * s);
    return p.detach();
  }, [x, hub, floor, s]);
  return (
    <Group>
      <Path path={legs} style="stroke" strokeWidth={30 * s + 1.2} color="#0b0c0e" strokeCap="round" />
      <Path path={legs} style="stroke" strokeWidth={30 * s} color="#2c2e33" strokeCap="round" />
      <Rect x={x - 18 * s} y={top} width={36 * s} height={hub - top}>
        <LinearGradient start={vec(x - 18 * s, 0)} end={vec(x + 18 * s, 0)} colors={['#2a2c31', '#a3a9b2', '#2a2c31']} />
      </Rect>
      <RoundedRect x={x - 34 * s} y={hub - 50 * s} width={68 * s} height={100 * s} r={10 * s}>
        <LinearGradient start={vec(x - 34 * s, 0)} end={vec(x + 34 * s, 0)} colors={['#16171a', '#3a3d43', '#16171a']} />
      </RoundedRect>
    </Group>
  );
}

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
      <RoundedRect x={4} y={6} width={W} height={H} r={10} color="rgba(0,0,0,0.6)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={10}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2a2c31', '#141518']} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={10} style="stroke" strokeWidth={1.5} color={INK.bevel} />
      {/* heat-sink fins */}
      {Array.from({ length: 9 }, (_, i) => (
        <Group key={i}>
          <RoundedRect x={20 + i * 21} y={H - 46} width={8} height={34} r={1.5} color="#0b0c0e" />
          <Rect x={20 + i * 21} y={H - 46} width={1.4} height={34} color="rgba(255,255,255,0.08)" />
        </Group>
      ))}
      <ComboSocket cx={R.input.x} cy={R.input.y} d={30} />
      <XlrSocket cx={R.thru.x} cy={R.thru.y} d={24} male />
      <Knob cx={R.level.x} cy={R.level.y} d={26} value={level} />
      <Led cx={150} cy={140} r={3} on={on} colour={INK.green} />
      <Led cx={170} cy={140} r={3} on={false} colour={INK.peak} />
      <IecInlet x={R.ac.x - 12} y={R.ac.y - 8} s={1.4} />
      <Rocker x={R.power.x} y={R.power.y - 6} s={1.6} on={on} />
      <SceneText x={R.input.x} y={R.input.y - 26} size={LEG + 1} text="INPUT" color={INK.print} face="label" align="center" />
      <SceneText x={R.thru.x} y={R.thru.y - 23} size={LEG + 1} text="THRU" color={INK.print} face="label" align="center" />
      <SceneText x={R.level.x} y={R.level.y - 22} size={LEG + 1} text="LEVEL" color={INK.print} face="label" align="center" />
      <SceneText x={160} y={128} size={LEG} text="ON · LIMIT" color={INK.printDim} face="label" align="center" />
      <SceneText x={R.ac.x + 5} y={R.ac.y - 14} size={LEG + 1} text="AC IN" color={INK.print} face="label" align="center" />
    </Group>
  );
});

/** A powered speaker's compact INPUT PLATE (face-on, 150 × 92), as the room
 *  map wires it at true size: combo input, level, IEC inlet, power switch. */

export const SpeakerPlate = memo(function SpeakerPlate({ x, y, on, title, live }: { x: number; y: number; on: boolean; title: string; live?: boolean }) {
  const W = PLATE_W;
  const H = PLATE_H;
  const P = PLATE;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={3} y={5} width={W} height={H} r={6} color="rgba(0,0,0,0.6)">
        <BlurMask blur={4} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={['#2e3136', '#17181b']} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={4} r={2} color="rgba(255,255,255,0.10)" />
      <RoundedRect x={0.6} y={0.6} width={W - 1.2} height={H - 1.2} r={5.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      <SceneText x={8} y={13} size={7} text={title} color={INK.amber} face="label" />
      <ComboSocket cx={P.input.x} cy={P.input.y} d={22} />
      <Knob cx={P.level.x} cy={P.level.y} d={14} value={0.75} />
      <IecInlet x={P.ac.x - 12} y={P.ac.y - 8} s={1} />
      <Rocker x={P.power.x - 5.5} y={P.power.y - 9} s={0.85} on={on} />
      <Led cx={P.level.x + 18} cy={P.level.y - 12} r={2} on={on} colour={live ? INK.green : INK.blue} />
      <SceneText x={P.input.x} y={P.input.y + 22} size={LEG} text="INPUT" color={INK.print} face="label" align="center" />
      <SceneText x={P.level.x} y={P.level.y + 20} size={LEG} text="LEVEL" color={INK.print} face="label" align="center" />
      <SceneText x={P.ac.x} y={P.ac.y + 18} size={LEG} text="AC IN" color={INK.print} face="label" align="center" />
    </Group>
  );
});

/* ── laptop with DJ software (seen from above) ────────────────────────── */

export const LAPTOP_W = 330;
export const LAPTOP_H = 350;
/** The laptop's USB-A ports (local mm), one on each side. */
export const LAPTOP_USB = { L: { x: 0, y: 236 }, R: { x: LAPTOP_W, y: 236 } } as const;

export const Laptop = memo(function Laptop({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const LID = 118;
  const BASE_Y = 124;
  const keys = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number }[] = [];
    const kx0 = 30;
    const kw = 270;
    const rows = 6;
    const ky0 = BASE_Y + 22;
    const pitch = 15.6;
    for (let r = 0; r < rows; r++) {
      const n = r === 0 ? 14 : r === 5 ? 9 : 13;
      const ky = ky0 + r * pitch;
      const hgt = r === 0 ? 8 : 13;
      if (r === 5) {
        // the bottom row: the space bar between the modifiers
        const parts = [18, 18, 24, 108, 24, 18, 18, 18];
        let xx = kx0;
        for (const pw of parts) {
          out.push({ x: xx, y: ky, w: pw - 2.4, h: hgt });
          xx += pw + 0.4;
        }
        continue;
      }
      const w0 = (kw - (n - 1) * 2.4) / n;
      for (let i = 0; i < n; i++) out.push({ x: kx0 + i * (w0 + 2.4), y: ky + (r === 0 ? 3 : 0), w: w0, h: hgt });
    }
    return out;
  }, []);
  const sx = 24;
  const sw = 282;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={6} y={10} width={LAPTOP_W} height={LAPTOP_H} r={12} color="rgba(0,0,0,0.65)">
        <BlurMask blur={9} style="normal" />
      </RoundedRect>
      {/* the lid, leaning back: its screen seen foreshortened from above */}
      <RoundedRect x={4} y={0} width={LAPTOP_W - 8} height={LID} r={8}>
        <LinearGradient start={vec(0, 0)} end={vec(0, LID)} colors={['#202226', '#33363c']} />
      </RoundedRect>
      <RoundedRect x={14} y={6} width={LAPTOP_W - 28} height={LID - 14} r={3} color="#04070b" />
      {/* the software: two decks' waveforms over the library */}
      {[0, 1].map((k) => {
        const id = k === 0 ? 'nightFerry' : 'glassHarbour';
        const top = 12 + k * 22;
        return (
          <Group key={k}>
            <Rect x={sx} y={top} width={sw} height={18} color="#08111b" />
            <Group clip={Skia.XYWHRect(sx, top, sw, 18)}>
              <Group transform={[{ translateX: sx - 40 * 22 }, { translateY: top + 9 }, { scaleX: 22 }, { scaleY: 8 }]}>
                <WaveBody id={id} step={2} />
              </Group>
            </Group>
            <Line p1={vec(sx + sw / 2, top)} p2={vec(sx + sw / 2, top + 18)} color={INK.white} strokeWidth={0.8} />
            <SceneText x={sx + 3} y={top + 6} size={4.4} text={k === 0 ? 'DECK 1' : 'DECK 2'} color={INK.amber} face="label" />
          </Group>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <Rect key={i} x={sx} y={60 + i * 9} width={sw} height={7} color={i === 1 ? '#13324f' : '#0b1118'} />
      ))}
      <RoundedRect x={14} y={6} width={LAPTOP_W - 28} height={(LID - 14) * 0.45} r={3} color="rgba(140,180,230,0.05)" />
      {/* the hinge */}
      <RoundedRect x={22} y={LID - 2} width={LAPTOP_W - 44} height={8} r={3}>
        <LinearGradient start={vec(0, LID - 2)} end={vec(0, LID + 6)} colors={['#4a4e55', '#16171a']} />
      </RoundedRect>
      {/* the base: an aluminium deck, keyboard, trackpad */}
      <RoundedRect x={0} y={BASE_Y} width={LAPTOP_W} height={LAPTOP_H - BASE_Y} r={12}>
        <LinearGradient start={vec(0, BASE_Y)} end={vec(LAPTOP_W, LAPTOP_H)} colors={['#4a4e56', '#33363c', '#24262b']} positions={[0, 0.55, 1]} />
      </RoundedRect>
      <RoundedRect x={0.7} y={BASE_Y + 0.7} width={LAPTOP_W - 1.4} height={LAPTOP_H - BASE_Y - 1.4} r={11.3} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.16)" />
      <RoundedRect x={24} y={BASE_Y + 16} width={282} height={102} r={5} color="#16171a" />
      {keys.map((kk, i) => (
        <Group key={i}>
          <RoundedRect x={kk.x} y={kk.y} width={kk.w} height={kk.h} r={1.6}>
            <LinearGradient start={vec(kk.x, kk.y)} end={vec(kk.x, kk.y + kk.h)} colors={['#2e3035', '#141518']} />
          </RoundedRect>
          <Line p1={vec(kk.x + 1, kk.y + 0.5)} p2={vec(kk.x + kk.w - 1, kk.y + 0.5)} color="rgba(255,255,255,0.10)" strokeWidth={0.5} />
        </Group>
      ))}
      <RoundedRect x={LAPTOP_W / 2 - 56} y={BASE_Y + 132} width={112} height={78} r={6}>
        <LinearGradient start={vec(0, BASE_Y + 132)} end={vec(0, BASE_Y + 210)} colors={['#3d4047', '#2c2e33']} />
      </RoundedRect>
      <RoundedRect x={LAPTOP_W / 2 - 56} y={BASE_Y + 132} width={112} height={78} r={6} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.12)" />
      {/* the side ports */}
      <Rect x={LAPTOP_W - 1.5} y={LAPTOP_USB.R.y - 6} width={1.5} height={12} color="#050506" />
      <Rect x={0} y={LAPTOP_USB.L.y - 6} width={1.5} height={12} color="#050506" />
    </Group>
  );
});

/** A USB-A plug seen from ABOVE in a side port: metal shell into the port,
 *  overmould and strain relief out along `dir` (+1 right, −1 left). */
export function UsbAPlugTop({ x, y, dir = 1 }: { x: number; y: number; dir?: 1 | -1 }) {
  const ox = (v: number) => x + dir * v;
  const lx = Math.min(ox(0), ox(12));
  const bx = Math.min(ox(10), ox(36));
  return (
    <Group>
      <Rect x={lx} y={y - 6} width={12} height={12}>
        <LinearGradient start={vec(0, y - 6)} end={vec(0, y + 6)} colors={['#eef1f4', '#8a9099', '#5c626b']} />
      </Rect>
      <RoundedRect x={bx + 1} y={y - 7.5 + 1.5} width={26} height={15} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.5} style="normal" />
      </RoundedRect>
      <RoundedRect x={bx} y={y - 7.5} width={26} height={15} r={3}>
        <LinearGradient start={vec(0, y - 7.5)} end={vec(0, y + 7.5)} colors={['#3a3d43', '#16171a']} />
      </RoundedRect>
      <Line p1={vec(bx + 4, y - 6)} p2={vec(bx + 22, y - 6)} color="rgba(255,255,255,0.16)" strokeWidth={0.7} />
    </Group>
  );
}

/** A plug seen from ABOVE entering a device's rear edge (pointing down the
 *  page into the edge at (x, y)): USB-B / XLR / RCA overmould and boot. */
export function RearPlugTop({ x, y, kind }: { x: number; y: number; kind: 'usb' | 'xlr' }) {
  const bw = kind === 'xlr' ? 19 : 14;
  const bl = kind === 'xlr' ? 34 : 22;
  return (
    <Group>
      <RoundedRect x={x - bw / 2 + 1} y={y - bl + 2} width={bw} height={bl} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.5} style="normal" />
      </RoundedRect>
      <RoundedRect x={x - bw / 2} y={y - bl} width={bw} height={bl} r={kind === 'xlr' ? 4 : 3}>
        <LinearGradient start={vec(x - bw / 2, 0)} end={vec(x + bw / 2, 0)} colors={kind === 'xlr' ? ['#5c626b', '#d6dae0', '#3a3e45'] : ['#2a2c31', '#4a4d54', '#121315']} />
      </RoundedRect>
      {kind === 'xlr' ? <RoundedRect x={x - 3} y={y - bl + 6} width={6} height={9} r={1.5} color="#16171a" /> : null}
    </Group>
  );
}

/* ── a two-deck controller / a standalone system ──────────────────────── */

export const CTRL_W = 550;
export const CTRL_D = 320;
/** The controller's rear USB socket and its MASTER OUT plugs (local mm). */
export const CTRL_USB = { x: 275, y: 0 } as const;
export const CTRL_OUT = { x: 446, y: 0 } as const;

const CJ = { r: 75, cy: 196, xs: [112, 438] as const };

export const ControllerTop = memo(function ControllerTop({ x, y, s = 1, standalone = false }: { x: number; y: number; s?: number; standalone?: boolean }) {
  const dimples = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (const cx of CJ.xs) {
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        p.addCircle(cx + Math.cos(a) * CJ.r * 0.86, CJ.cy + Math.sin(a) * CJ.r * 0.86, 0.8);
      }
    }
    return p.detach();
  }, []);
  const quiet = useSharedValue(-60);
  const W = CTRL_W;
  const D = CTRL_D;
  const jog = (cx: number) => (
    <Group key={cx}>
      <Circle cx={cx} cy={CJ.cy} r={CJ.r + 6} color="#0d0e11" />
      <Circle cx={cx + 3} cy={CJ.cy + 4} r={CJ.r + 1} color="rgba(0,0,0,0.6)">
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Circle cx={cx} cy={CJ.cy} r={CJ.r}>
        <SweepGradient c={vec(cx, CJ.cy)} colors={['#9da3ac', '#d9dde3', '#7d838c', '#c5cad1', '#8b919a', '#e0e4ea', '#9da3ac']} />
      </Circle>
      <Circle cx={cx} cy={CJ.cy} r={CJ.r * 0.92}>
        <RadialGradient c={vec(cx - 22, CJ.cy - 26)} r={CJ.r * 1.3} colors={['#34373d', '#17181b', '#0b0c0e']} positions={[0, 0.55, 1]} />
      </Circle>
      <Circle cx={cx} cy={CJ.cy} r={24} color="#050506" />
      <Circle cx={cx} cy={CJ.cy} r={21}>
        <RadialGradient c={vec(cx, CJ.cy - 8)} r={26} colors={[INK.lcdHi, INK.lcdLo]} />
      </Circle>
      <RoundedRect x={cx - 1.4} y={CJ.cy - 20} width={2.8} height={8} r={1} color={INK.white} />
      <Circle cx={cx - 24} cy={CJ.cy - 28} r={16} color="rgba(255,255,255,0.05)">
        <BlurMask blur={8} style="normal" />
      </Circle>
    </Group>
  );
  /** One deck's controls; `side` 0 = left deck (outer edge on the left). */
  const deck = (side: 0 | 1) => {
    const ox = side === 0 ? 0 : 336;
    const outer = side === 0 ? 26 : W - 26;
    const xr = (v: number) => (side === 0 ? v : W - v);
    return (
      <Group key={side}>
        {/* FX knobs and the loop keys across the top of the deck */}
        {[0, 1, 2].map((i) => (
          <Knob key={i} cx={ox + 60 + i * 34} cy={38} d={14} value={0.3 + i * 0.15} />
        ))}
        <Key x={ox + 160} y={30} w={34} h={14} />
        <SceneText x={ox + 177} y={39.4} size={LEG} text="FX ON" color={INK.print} face="label" align="center" />
        {['LOOP IN', 'OUT', '½', '×2'].map((t, i) => (
          <Group key={t}>
            <Key x={ox + 54 + i * 36} y={74} w={32} h={12} />
            <SceneText x={ox + 70 + i * 36} y={81.4} size={LEG} text={t} color={INK.print} face="label" align="center" />
          </Group>
        ))}
        {/* SYNC (top), SHIFT (bottom) beside the jog; tempo on the outer edge */}
        <Key x={xr(side === 0 ? 14 : 46)} y={104} w={32} h={13} colour={INK.blue} />
        <SceneText x={xr(30)} y={113} size={LEG} text="SYNC" color={INK.print} face="label" align="center" />
        <Key x={xr(side === 0 ? 14 : 46)} y={248} w={32} h={13} />
        <SceneText x={xr(30)} y={257} size={LEG} text="SHIFT" color={INK.print} face="label" align="center" />
        <Fader x={outer} y={128} len={90} value={0.5} capW={16} capL={10} ticks={9} />
        <SceneText x={outer} y={124} size={LEG} text="TEMPO" color={INK.print} face="label" align="center" />
        {/* transport */}
        <RoundButton cx={xr(30)} cy={286} d={24} lit={false} colour={INK.amber} glyph="cue" />
        <RoundButton cx={xr(64)} cy={286} d={24} lit={false} colour={INK.green} glyph="play" />
        {/* hot cue pads 1–4 */}
        {[0, 1, 2, 3].map((i) => {
          const px = side === 0 ? 96 + i * 27 : W - 96 - (3 - i) * 27 - 24;
          return (
            <Group key={i}>
              <RoundedRect x={px} y={274} width={24} height={24} r={4} color={shade(CUE_COLOURS[i], 0.32)} />
              <RoundedRect x={px} y={274} width={24} height={24} r={4} style="stroke" strokeWidth={1} color={shade(CUE_COLOURS[i], 0.75)} />
              <SceneText x={px + 12} y={288} size={5} text={String(i + 1)} color={INK.print} face="label" align="center" />
            </Group>
          );
        })}
        <SceneText x={side === 0 ? 96 : W - 96 - 3 * 27 - 24} y={270} size={LEG} text="HOT CUE" color={INK.printDim} face="label" />
      </Group>
    );
  };
  // the mixer section's strips
  const strips = [246, 304];
  const sy = standalone ? { hi: 120, mid: 142, lo: 164, filter: 186, cue: 204, fader: 214, len: 40, meterTop: 112, meterH: 84 } : { trim: 74, hi: 98, mid: 120, lo: 142, filter: 164, cue: 184, fader: 198, len: 56, meterTop: 68, meterH: 112 };
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={6} y={10} width={W} height={D} r={18} color="rgba(0,0,0,0.75)">
        <BlurMask blur={12} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={D} r={18}>
        <LinearGradient start={vec(0, 0)} end={vec(W, D)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} />
      </RoundedRect>
      <RoundedRect x={0.7} y={0.7} width={W - 1.4} height={D - 1.4} r={17} style="stroke" strokeWidth={1.4} color={INK.bevel} />
      {jog(CJ.xs[0])}
      {jog(CJ.xs[1])}
      <Path path={dimples} color="rgba(0,0,0,0.5)" />
      {deck(0)}
      {deck(1)}
      {/* the centre mixer section, on its own face plate */}
      <RoundedRect x={212} y={12} width={126} height={296} r={8}>
        <LinearGradient start={vec(212, 0)} end={vec(338, 0)} colors={['#131417', '#1b1c20', '#131417']} />
      </RoundedRect>
      <RoundedRect x={212} y={12} width={126} height={296} r={8} style="stroke" strokeWidth={0.8} color="rgba(0,0,0,0.6)" />
      {standalone ? (
        <Group>
          <RoundedRect x={220} y={16} width={110} height={64} r={4} color="#050506" />
          <RoundedRect x={223} y={19} width={104} height={58} r={2}>
            <LinearGradient start={vec(0, 19)} end={vec(0, 77)} colors={[INK.lcdHi, INK.lcdLo]} />
          </RoundedRect>
          {[0, 1].map((k) => {
            const top = 24 + k * 25;
            return (
              <Group key={k}>
                <Rect x={226} y={top} width={98} height={20} color="#06101a" />
                <Group clip={Skia.XYWHRect(226, top, 98, 20)}>
                  <Group transform={[{ translateX: 226 - 34 * 8 }, { translateY: top + 10 }, { scaleX: 8 }, { scaleY: 9 }]}>
                    <WaveBody id={k ? 'glassHarbour' : 'nightFerry'} step={2} />
                  </Group>
                </Group>
                <Line p1={vec(275, top)} p2={vec(275, top + 20)} color={INK.white} strokeWidth={0.8} />
              </Group>
            );
          })}
          <Knob cx={275} cy={96} d={14} value={0.5} capTone="black" scale={false} />
          <Key x={222} y={90} w={26} h={11} />
          <Key x={302} y={90} w={26} h={11} />
          <SceneText x={235} y={98} size={LEG} text="LOAD A" color={INK.print} face="label" align="center" />
          <SceneText x={315} y={98} size={LEG} text="LOAD B" color={INK.print} face="label" align="center" />
        </Group>
      ) : (
        <Group>
          <Knob cx={275} cy={34} d={18} value={0.5} capTone="black" scale={false} />
          <SceneText x={275} y={21} size={LEG} text="BROWSE" color={INK.print} face="label" align="center" />
          <Key x={220} y={28} w={26} h={11} />
          <Key x={304} y={28} w={26} h={11} />
          <SceneText x={233} y={36} size={LEG} text="LOAD A" color={INK.print} face="label" align="center" />
          <SceneText x={317} y={36} size={LEG} text="LOAD B" color={INK.print} face="label" align="center" />
          <Knob cx={232} cy={54} d={11} value={0.6} />
          <Knob cx={318} cy={54} d={11} value={0.7} />
          <SceneText x={232} y={65} size={3.2} text="PHONES" color={INK.printDim} face="label" align="center" />
          <SceneText x={318} y={65} size={3.2} text="MASTER" color={INK.printDim} face="label" align="center" />
        </Group>
      )}
      {strips.map((cx) => (
        <Group key={cx}>
          {'trim' in sy && sy.trim != null ? <Knob cx={cx} cy={sy.trim} d={12} value={0.5} /> : null}
          <Knob cx={cx} cy={sy.hi} d={13} value={0.5} centre />
          <Knob cx={cx} cy={sy.mid} d={13} value={0.5} centre />
          <Knob cx={cx} cy={sy.lo} d={13} value={0.5} centre />
          <Knob cx={cx} cy={sy.filter} d={13} value={0.5} centre capTone="black" />
          <Key x={cx - 11} y={sy.cue} w={22} h={9} />
          <Fader x={cx} y={sy.fader} len={sy.len} value={0.85} capW={11} capL={16} ticks={7} />
        </Group>
      ))}
      {/* the level meters (the house loudness ramp; dark — nothing playing) */}
      <LedColumn x={266} y={sy.meterTop} w={5} h={sy.meterH} level={quiet} />
      <LedColumn x={279} y={sy.meterTop} w={5} h={sy.meterH} level={quiet} />
      <Fader x={286} y={252} len={46} value={0.5} horizontal capW={11} capL={18} ticks={7} />
      <SceneText x={275} y={300} size={LEG} text="CROSSFADER" color={INK.printDim} face="label" align="center" />
      {standalone ? (
        <Group>
          <RoundedRect x={392} y={8} width={34} height={9} r={2} color="#050506" />
          <SceneText x={409} y={24} size={LEG} text="USB" color={INK.print} face="label" align="center" />
        </Group>
      ) : null}
    </Group>
  );
});

/* ── a small USB audio interface ──────────────────────────────────────── */

export const IFACE_W = 160;
export const IFACE_D = 110;
/** The rear panel (face-on, 160 × 46): two balanced outputs and USB-C. */
export const IFACE_REAR = { w: 160, h: 46, outL: { x: 34, y: 26 }, outR: { x: 66, y: 26 }, usb: { x: 124, y: 26 } } as const;

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
      <Knob cx={42} cy={46} d={26} value={0.55} />
      <Knob cx={112} cy={46} d={34} value={0.45} />
      <SceneText x={42} y={24} size={LEG} text="GAIN" color={INK.print} face="label" align="center" />
      <SceneText x={112} y={20} size={LEG} text="MONITOR" color={INK.print} face="label" align="center" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Led key={i} cx={24 + i * 9} cy={80} r={2} on={false} colour={INK.green} />
      ))}
      <Led cx={142} cy={16} r={2.2} on colour={INK.blue} />
      <SceneText x={134} y={17.4} size={3.4} text="USB" color={INK.printDim} face="label" align="right" />
      {/* the front lip: the phones jack's knurled nut */}
      <RoundedRect x={8} y={IFACE_D - 10} width={IFACE_W - 16} height={8} r={2.5}>
        <LinearGradient start={vec(0, IFACE_D - 10)} end={vec(0, IFACE_D - 2)} colors={['#3a3d44', '#0b0c0e']} />
      </RoundedRect>
      <Oval x={124 - 6} y={IFACE_D - 9.2} width={12} height={6.4}>
        <LinearGradient start={vec(118, 0)} end={vec(130, 0)} colors={[INK.metalHi, INK.metalLo]} />
      </Oval>
      <Oval x={124 - 3} y={IFACE_D - 7.6} width={6} height={3.2} color="#020203" />
      <SceneText x={104} y={IFACE_D - 3.8} size={3.4} text="PHONES" color={INK.printDim} face="label" align="right" />
    </Group>
  );
});

/** The interface's REAR (face-on): OUT L and OUT R balanced TRS jacks and
 *  the USB-C socket (with its plug seated when `usbIn`). */
export const InterfaceRear = memo(function InterfaceRear({ x, y, usbIn = true }: { x: number; y: number; usbIn?: boolean }) {
  const R = IFACE_REAR;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={3} y={4} width={R.w} height={R.h} r={6} color="rgba(0,0,0,0.6)">
        <BlurMask blur={4} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={R.w} height={R.h} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(0, R.h)} colors={['#2e3136', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={R.w} height={3.5} r={2} color="rgba(255,255,255,0.10)" />
      <TrsSocket cx={R.outL.x} cy={R.outL.y} d={13} />
      <TrsSocket cx={R.outR.x} cy={R.outR.y} d={13} />
      <UsbC cx={R.usb.x} cy={R.usb.y} plugged={usbIn} />
      <SceneText x={R.outL.x} y={R.outL.y - 10} size={LEG} text="OUT L" color={INK.print} face="label" align="center" />
      <SceneText x={R.outR.x} y={R.outR.y - 10} size={LEG} text="OUT R" color={INK.print} face="label" align="center" />
      <SceneText x={(R.outL.x + R.outR.x) / 2} y={R.h - 3} size={3.4} text="BALANCED LINE" color={INK.printDim} face="label" align="center" />
      <SceneText x={R.usb.x} y={R.usb.y - 10} size={LEG} text="USB" color={INK.print} face="label" align="center" />
    </Group>
  );
});

/* ── the power strip ──────────────────────────────────────────────────── */


export const PowerStrip = memo(function PowerStrip({ x, y, s = 1, on, used = [], mirrored = false }: { x: number; y: number; s?: number; on: boolean; used?: readonly number[]; mirrored?: boolean }) {
  const outX = (i: number) => (mirrored ? STRIP_W - stripOutletX(i) : stripOutletX(i));
  const swX = mirrored ? STRIP_W - 34 : 10;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={3} y={6} width={STRIP_W} height={STRIP_D} r={14} color="rgba(0,0,0,0.7)">
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={STRIP_W} height={STRIP_D} r={14}>
        <LinearGradient start={vec(0, 0)} end={vec(0, STRIP_D)} colors={['#3b3e44', '#1b1c20']} />
      </RoundedRect>
      <RoundedRect x={0.7} y={0.7} width={STRIP_W - 1.4} height={STRIP_D - 1.4} r={13.3} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
      {/* the lit rocker switch */}
      <RoundedRect x={swX} y={18} width={24} height={28} r={4} color="#0b0c0e" />
      <RoundedRect x={swX + 2} y={20} width={20} height={24} r={3} color={on ? '#b8321f' : '#4a1a13'} />
      {on ? (
        <RoundedRect x={swX + 2} y={20} width={20} height={24} r={3} color="#ff5a3a" opacity={0.35}>
          <BlurMask blur={5} style="normal" />
        </RoundedRect>
      ) : null}
      <Line p1={vec(swX + 12, 24)} p2={vec(swX + 12, 30)} color="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeCap="round" />
      {Array.from({ length: 8 }, (_, k) => {
        const i = k + 1;
        const ox = outX(i);
        return (
          <Group key={i}>
            <RoundedRect x={ox - 13} y={12} width={26} height={40} r={5}>
              <LinearGradient start={vec(0, 12)} end={vec(0, 52)} colors={['#121316', '#1d1f23']} />
            </RoundedRect>
            <RoundedRect x={ox - 13} y={12} width={26} height={40} r={5} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.08)" />
            <RoundedRect x={ox - 6} y={20} width={3} height={10} r={0.8} color="#000" />
            <RoundedRect x={ox + 3} y={20} width={3} height={10} r={0.8} color="#000" />
            <Circle cx={ox} cy={40} r={3} color="#000" />
            {used.includes(i) ? null : <SceneText x={ox} y={60} size={3.6} text={String(i)} color={INK.printDim} face="label" align="center" />}
          </Group>
        );
      })}
    </Group>
  );
});

export { RcaSocket, TrsSocket, UsbB };
