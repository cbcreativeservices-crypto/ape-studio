/**
 * MicGear — the microphone screen's equipment, drawn as the real objects and
 * AUTHORED IN MILLIMETRES (class dimensions in docs/labs/dj/SOURCES.md,
 * "Drawings, Stage 2b"):
 *
 *   HandheldMic       a handheld vocal mic seen from the side: the ball
 *                     grille (Ø 50 mm) over its foam, the grille ring, the
 *                     tapered body (185 mm), the male XLR at its tail. The
 *                     CONDENSER has a finer, flatter grille and a gold band;
 *                     the WIRELESS transmitter is longer, with a battery
 *                     cover, a status window and an antenna cap, and no XLR.
 *   MicXlrPlug        the cable's female XLR on the mic's tail.
 *   ReceiverRear      a half-rack wireless receiver's REAR panel (210 × 44):
 *                     two antennas, DC in, the XLR output and its MIC / LINE
 *                     output switch.
 *   MixerFront        this mixer's FRONT panel (270 × 56) — the face under the
 *                     crossfader: MIC 2 and MIC 1 combo inputs (only MIC 1
 *                     with +48 V), their GAIN knobs, the two headphone jacks
 *                     (at the same 66 / 88 mm as the top view's front edge),
 *                     MIC LEVEL, MIC ON, TALK OVER and its DEPTH, and the mic
 *                     SEND switches to BOOTH and REC.
 *
 * Light from the upper left; legends authored at real silk-screen size
 * (they appear as the learner zooms in). Generic: no brand, no logo.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Oval, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { ComboSocket, Halo, Key, Knob, Led, TrsSocket } from './parts';
import { SceneText } from './sceneText';
import type { MicDevice, MicState } from '../model/djEvent';

const LEG = 3.6;

/* ── the handheld microphone (side view, head at the origin, tail to +x) ── */

export const MIC_LEN = { DYNAMIC: 182, CONDENSER: 182, WIRELESS: 236 } as const;
/** Where the cable leaves the mic (local mm) for a wired mic. */
export const MIC_TAIL = { x: 182, y: 0 } as const;

export const HandheldMic = memo(function HandheldMic({ x, y, ang = 0, s = 1, device, live = false }: { x: number; y: number; ang?: number; s?: number; device: MicDevice; live?: boolean }) {
  const wireless = device === 'WIRELESS';
  const R = device === 'CONDENSER' ? 23 : 25;
  const bodyEnd = wireless ? 222 : 160;
  const r0 = wireless ? 19 : 18;
  const r1 = wireless ? 14.5 : 12;
  const body = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(26, -r0);
    p.cubicTo(70, -r0 + 1, 120, -r1 - 2, bodyEnd, -r1);
    p.lineTo(bodyEnd, r1);
    p.cubicTo(120, r1 + 2, 70, r0 - 1, 26, r0);
    p.close();
    return p.detach();
  }, [r0, r1, bodyEnd]);
  // the grille mesh: a diamond weave clipped to the ball
  const mesh = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const step = device === 'CONDENSER' ? 2.2 : 3.2;
    for (let k = -2 * R; k <= 2 * R; k += step) {
      p.moveTo(k - R, -R);
      p.lineTo(k + R, R);
      p.moveTo(k + R, -R);
      p.lineTo(k - R, R);
    }
    return p.detach();
  }, [R, device]);
  const clipBall = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (device === 'CONDENSER') p.addOval(Skia.XYWHRect(-R * 0.92, -R, R * 1.84, R * 2));
    else p.addCircle(0, 0, R);
    return p.detach();
  }, [R, device]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: ang }, { scale: s }]}>
      {/* contact shadow */}
      <Path path={body} color="rgba(0,0,0,0.55)" transform={[{ translateX: 3 }, { translateY: 6 }]}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Circle cx={3} cy={6} r={R} color="rgba(0,0,0,0.5)">
        <BlurMask blur={6} style="normal" />
      </Circle>
      {/* the body: satin metal, lit along its top */}
      <Path path={body}>
        <LinearGradient start={vec(0, -r0)} end={vec(0, r0)} colors={['#7c818a', '#3a3d44', '#1b1c20', '#0d0e10']} positions={[0, 0.28, 0.7, 1]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.14)" />
      <Line p1={vec(40, -r0 + 3.2)} p2={vec(bodyEnd - 6, -r1 + 2.4)} color="rgba(255,255,255,0.22)" strokeWidth={1.4} strokeCap="round" />
      {wireless ? (
        <Group>
          {/* battery cover seam, status window, power slide, antenna cap */}
          <Line p1={vec(150, -r1 - 1.5)} p2={vec(150, r1 + 1.5)} color="rgba(0,0,0,0.65)" strokeWidth={0.8} />
          <RoundedRect x={92} y={-5} width={22} height={10} r={2} color="#05080c" />
          <RoundedRect x={92} y={-5} width={22} height={10} r={2} style="stroke" strokeWidth={0.5} color="rgba(120,170,220,0.4)" />
          <Rect x={95} y={-1.5} width={8} height={3} color={live ? INK.green : INK.ledOff} />
          <RoundedRect x={124} y={-3} width={12} height={6} r={1.6} color="#0b0c0e" />
          <RoundedRect x={live ? 130 : 125} y={-2.2} width={5} height={4.4} r={1} color="#9aa0a8" />
          <RoundedRect x={bodyEnd - 1} y={-r1 + 1.5} width={14} height={(r1 - 1.5) * 2} r={6}>
            <LinearGradient start={vec(0, -r1)} end={vec(0, r1)} colors={['#3a3c42', '#0b0b0d']} />
          </RoundedRect>
        </Group>
      ) : (
        <Group>
          {/* the male XLR at the tail */}
          <RoundedRect x={bodyEnd - 1} y={-11} width={22} height={22} r={2}>
            <LinearGradient start={vec(0, -11)} end={vec(0, 11)} colors={['#e6e9ee', '#9aa0a8', '#4a4f57']} positions={[0, 0.35, 1]} />
          </RoundedRect>
          {[166, 170, 174].map((g) => (
            <Line key={g} p1={vec(g, -11)} p2={vec(g, 11)} color="rgba(0,0,0,0.28)" strokeWidth={0.5} />
          ))}
        </Group>
      )}
      {/* the grille ring (gold on the condenser) */}
      <RoundedRect x={19} y={-r0 - 1.5} width={11} height={(r0 + 1.5) * 2} r={3}>
        <LinearGradient start={vec(0, -r0)} end={vec(0, r0)} colors={device === 'CONDENSER' ? ['#f0dc9e', '#a8893f', '#5e4c22'] : ['#9aa0a8', '#4a4f57', '#1d1f23']} />
      </RoundedRect>
      {/* the ball: foam behind the mesh, the mesh, a specular */}
      <Group clip={clipBall}>
        <Circle cx={0} cy={0} r={R + 2}>
          <RadialGradient c={vec(-R * 0.3, -R * 0.35)} r={R * 1.5} colors={['#5d626b', '#2a2c31', '#0b0c0e']} positions={[0, 0.5, 1]} />
        </Circle>
        <Path path={mesh} style="stroke" strokeWidth={device === 'CONDENSER' ? 0.45 : 0.6} color="rgba(225,230,236,0.55)" />
        <Path path={mesh} style="stroke" strokeWidth={0.4} color="rgba(0,0,0,0.5)" transform={[{ translateX: 0.5 }, { translateY: 0.6 }]} />
      </Group>
      <Path path={clipBall} style="stroke" strokeWidth={1.4} color="#2c2f35" />
      <Path path={clipBall} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.25)" />
      <Oval x={-R * 0.62} y={-R * 0.7} width={R * 0.7} height={R * 0.48} color="rgba(255,255,255,0.32)">
        <BlurMask blur={R * 0.12} style="normal" />
      </Oval>
    </Group>
  );
});

/** The cable's female XLR, seated on the mic's tail and pointing along +x
 *  (mic-local mm; drawn inside the mic's transform by the caller). */
export function MicXlrPlug({ x, y, ang = 0 }: { x: number; y: number; ang?: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: ang }]}>
      <RoundedRect x={0} y={-10.5} width={30} height={21} r={2.5}>
        <LinearGradient start={vec(0, -10.5)} end={vec(0, 10.5)} colors={['#eef1f4', '#9aa0a8', '#4a4f57']} positions={[0, 0.35, 1]} />
      </RoundedRect>
      <RoundedRect x={4} y={-12} width={9} height={2.4} r={1} color="#6e737c" />
      <RoundedRect x={30} y={-6} width={14} height={12} r={3}>
        <LinearGradient start={vec(0, -6)} end={vec(0, 6)} colors={['#3a3c42', '#0b0b0d']} />
      </RoundedRect>
    </Group>
  );
}

/* ── the wireless receiver, rear panel (210 × 44) ─────────────────────── */

export const RX_W = 210;
export const RX_H = 44;
export const RX_JACKS = { out: { x: 112, y: 24 } } as const;

export const ReceiverRear = memo(function ReceiverRear({ x, y, rxOut, on }: { x: number; y: number; rxOut: 'MIC' | 'LINE'; on: boolean }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* the two antennas, up from their BNC jacks */}
      {[
        { bx: 14, a: -1.73 },
        { bx: RX_W - 14, a: -1.41 },
      ].map((an) => (
        <Group key={an.bx}>
          <Line p1={vec(an.bx, 12)} p2={vec(an.bx + Math.cos(an.a) * 150, 12 + Math.sin(an.a) * 150)} color="#0b0c0e" strokeWidth={6} strokeCap="round" />
          <Line p1={vec(an.bx, 12)} p2={vec(an.bx + Math.cos(an.a) * 150, 12 + Math.sin(an.a) * 150)} strokeWidth={4.4} strokeCap="round">
            <LinearGradient start={vec(an.bx - 3, 0)} end={vec(an.bx + 3, 0)} colors={['#2a2c31', '#5a5e66', '#17181b']} />
          </Line>
          <RoundedRect x={an.bx - 5} y={6} width={10} height={14} r={2}>
            <LinearGradient start={vec(an.bx - 5, 0)} end={vec(an.bx + 5, 0)} colors={['#6f757e', '#d8dce2', '#4a4f57']} />
          </RoundedRect>
        </Group>
      ))}
      <RoundedRect x={3} y={5} width={RX_W} height={RX_H} r={4} color="rgba(0,0,0,0.6)">
        <BlurMask blur={4} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={RX_W} height={RX_H} r={4}>
        <LinearGradient start={vec(0, 0)} end={vec(0, RX_H)} colors={['#2e3136', '#17181b']} />
      </RoundedRect>
      <RoundedRect x={0.5} y={0.5} width={RX_W - 1} height={RX_H - 1} r={3.5} style="stroke" strokeWidth={0.8} color={INK.bevel} />
      {[14, RX_W - 14].map((bx) => (
        <Circle key={bx} cx={bx} cy={24} r={5}>
          <RadialGradient c={vec(bx - 1.5, 22.5)} r={6} colors={[INK.metalHi, INK.metalLo]} />
        </Circle>
      ))}
      <SceneText x={14} y={38} size={LEG} text="ANT A" color={INK.printDim} face="label" align="center" />
      <SceneText x={RX_W - 14} y={38} size={LEG} text="ANT B" color={INK.printDim} face="label" align="center" />
      {/* DC in */}
      <Circle cx={42} cy={24} r={4.4} color="#0b0c0e" />
      <Circle cx={42} cy={24} r={1.6} color="#c9ccd2" />
      <SceneText x={42} y={38} size={LEG} text="DC IN" color={INK.print} face="label" align="center" />
      {/* the output switch: MIC | LINE */}
      <RoundedRect x={64} y={18} width={26} height={11} r={2} color="#050506" />
      <RoundedRect x={rxOut === 'MIC' ? 65.2 : 77.6} y={19.2} width={12} height={8.6} r={1.6}>
        <LinearGradient start={vec(0, 19)} end={vec(0, 28)} colors={['#b9bec6', '#5c626b']} />
      </RoundedRect>
      <SceneText x={70} y={14} size={LEG} text="MIC" color={rxOut === 'MIC' ? INK.amber : INK.printDim} face="label" align="center" />
      <SceneText x={84} y={14} size={LEG} text="LINE" color={rxOut === 'LINE' ? INK.amber : INK.printDim} face="label" align="center" />
      <SceneText x={77} y={39} size={LEG} text="OUTPUT LEVEL" color={INK.print} face="label" align="center" />
      {/* the XLR output (male) and a jack output */}
      <Group>
        <RoundedRect x={RX_JACKS.out.x - 12} y={RX_JACKS.out.y - 12} width={24} height={24} r={2.4}>
          <LinearGradient start={vec(RX_JACKS.out.x - 12, 0)} end={vec(RX_JACKS.out.x + 12, 0)} colors={['#3a3d44', '#15161a']} />
        </RoundedRect>
        <Circle cx={RX_JACKS.out.x} cy={RX_JACKS.out.y} r={9}>
          <RadialGradient c={vec(RX_JACKS.out.x - 3, RX_JACKS.out.y - 3)} r={11} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
        </Circle>
        <Circle cx={RX_JACKS.out.x} cy={RX_JACKS.out.y} r={7.4} color="#0b0b0d" />
      </Group>
      <SceneText x={RX_JACKS.out.x} y={9} size={LEG} text="BAL OUT" color={INK.print} face="label" align="center" />
      <TrsSocket cx={146} cy={24} d={9} />
      <SceneText x={146} y={38} size={LEG} text="OUT" color={INK.print} face="label" align="center" />
      <Led cx={170} cy={14} r={1.6} on={on} colour={INK.green} />
      <SceneText x={178} y={15} size={LEG} text="RF" color={INK.printDim} face="label" />
    </Group>
  );
});

/* ── this mixer's front panel (270 × 56) ──────────────────────────────── */

export const FRONT_W = 270;
export const FRONT_H = 56;
export const FRONT = {
  mic2: { x: 22, y: 31, d: 20 },
  gain2: { x: 47, y: 31, d: 12 },
  phones635: { x: 66, y: 31, d: 11 },
  phones35: { x: 88, y: 31, d: 7 },
  gain1: { x: 111, y: 31, d: 12 },
  mic1: { x: 136, y: 31, d: 22 },
  phantom: { x: 156, y: 18, w: 10, h: 6 },
  phantomLed: { x: 161, y: 31 },
  level: { x: 180, y: 31, d: 14 },
  on: { x: 197, y: 19, w: 15, h: 11 },
  talk: { x: 218, y: 19, w: 17, h: 11 },
  depth: { x: 252, y: 31, d: 11 },
  sendBooth: { x: 197, y: 40, w: 15, h: 6 },
  sendRec: { x: 218, y: 40, w: 17, h: 6 },
} as const;

export type FrontPart = 'mic1' | 'mic2' | 'gain1' | 'gain2' | 'phantom' | 'level' | 'on' | 'talk' | 'depth' | 'sendBooth' | 'sendRec' | 'phones';

export function frontPartBox(p: FrontPart): { x: number; y: number; w: number; h: number } {
  const F = FRONT;
  const c = (o: { x: number; y: number; d: number }, k = 1.5) => ({ x: o.x - (o.d * k) / 2, y: o.y - (o.d * k) / 2, w: o.d * k, h: o.d * k });
  const r = (o: { x: number; y: number; w: number; h: number }) => ({ x: o.x - 2, y: o.y - 2, w: o.w + 4, h: o.h + 4 });
  switch (p) {
    case 'mic1': return c(F.mic1, 1.3);
    case 'mic2': return c(F.mic2, 1.3);
    case 'gain1': return c(F.gain1);
    case 'gain2': return c(F.gain2);
    case 'phantom': return { x: F.phantom.x - 3, y: F.phantom.y - 9, w: F.phantom.w + 6, h: 26 };
    case 'level': return c(F.level);
    case 'on': return r(F.on);
    case 'talk': return r(F.talk);
    case 'depth': return c(F.depth);
    case 'sendBooth': return r(F.sendBooth);
    case 'sendRec': return r(F.sendRec);
    case 'phones': return { x: F.phones635.x - 8, y: 20, w: F.phones35.x - F.phones635.x + 16, h: 22 };
  }
}

/** A two-position slide switch, face-on (left = off). */
function Slide2({ x, y, w, h, on }: { x: number; y: number; w: number; h: number; on: boolean }) {
  const kw = w / 2;
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.3} color="#050506" />
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.3} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.10)" />
      <RoundedRect x={x + (on ? kw : 0) + kw * 0.1} y={y + h * 0.14} width={kw * 0.8} height={h * 0.72} r={h * 0.2}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={on ? ['#ffe08a', '#b8862a'] : ['#b9bec6', '#5c626b']} />
      </RoundedRect>
    </Group>
  );
}

export const MixerFront = memo(function MixerFront({ x, y, mic, highlight = [], phonesIn = true }: { x: number; y: number; mic: MicState; highlight?: readonly FrontPart[]; phonesIn?: boolean }) {
  const F = FRONT;
  const leg = (cx: number, t: string, yy = 9.5, dim = false) => <SceneText x={cx} y={yy} size={LEG} text={t} color={dim ? INK.printDim : INK.print} face="label" align="center" />;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* the face: brushed metal under the top's chamfered front lip */}
      <RoundedRect x={3} y={6} width={FRONT_W} height={FRONT_H} r={5} color="rgba(0,0,0,0.65)">
        <BlurMask blur={5} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={FRONT_W} height={FRONT_H} r={5}>
        <LinearGradient start={vec(0, 0)} end={vec(0, FRONT_H)} colors={['#2c2f35', '#1d1f23', '#141518']} positions={[0, 0.45, 1]} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={FRONT_W} height={3.4} r={2}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 3.4)} colors={['#5a5e66', '#2c2f35']} />
      </RoundedRect>
      <Line p1={vec(3, 3.6)} p2={vec(FRONT_W - 3, 3.6)} color="rgba(0,0,0,0.6)" strokeWidth={0.5} />
      <RoundedRect x={0.5} y={0.5} width={FRONT_W - 1} height={FRONT_H - 1} r={4.5} style="stroke" strokeWidth={0.8} color={INK.bevel} />
      {/* group frames: MIC 2 · PHONES · MIC 1 · MIC CHANNEL */}
      <RoundedRect x={8} y={14} width={50} height={36} r={3} style="stroke" strokeWidth={0.4} color={INK.printDim} />
      <RoundedRect x={97} y={14} width={74} height={36} r={3} style="stroke" strokeWidth={0.4} color={INK.printDim} />
      {/* MIC 2: combo, no phantom */}
      <ComboSocket cx={F.mic2.x} cy={F.mic2.y} d={F.mic2.d} />
      {leg(F.mic2.x, 'MIC 2')}
      <Knob cx={F.gain2.x} cy={F.gain2.y} d={F.gain2.d} value={mic.gain2} />
      {leg(F.gain2.x, 'GAIN')}
      {/* the headphone jacks (same x as the top view's front edge) */}
      <TrsSocket cx={F.phones635.x} cy={F.phones635.y} d={F.phones635.d} />
      <TrsSocket cx={F.phones35.x} cy={F.phones35.y} d={F.phones35.d} />
      {leg((F.phones635.x + F.phones35.x) / 2, 'PHONES')}
      {phonesIn ? <Circle cx={F.phones635.x + 0.6} cy={F.phones635.y + 0.8} r={4.2} color="#111215" /> : null}
      {/* MIC 1: combo WITH phantom */}
      <Knob cx={F.gain1.x} cy={F.gain1.y} d={F.gain1.d} value={mic.gain1} />
      {leg(F.gain1.x, 'GAIN')}
      <ComboSocket cx={F.mic1.x} cy={F.mic1.y} d={F.mic1.d} />
      {leg(F.mic1.x, 'MIC 1')}
      <Slide2 x={F.phantom.x} y={F.phantom.y} w={F.phantom.w} h={F.phantom.h} on={mic.phantom} />
      {leg(F.phantom.x + F.phantom.w / 2, '+48V', 14)}
      <Led cx={F.phantomLed.x} cy={F.phantomLed.y + 6} r={1.5} on={mic.phantom} colour={INK.red} />
      {/* the mic channel */}
      <Knob cx={F.level.x} cy={F.level.y} d={F.level.d} value={mic.level} />
      {leg(F.level.x, 'LEVEL')}
      <Key x={F.on.x} y={F.on.y} w={F.on.w} h={F.on.h} lit={mic.on} colour={INK.red} />
      {leg(F.on.x + F.on.w / 2, 'ON', 15.6)}
      <Key x={F.talk.x} y={F.talk.y} w={F.talk.w} h={F.talk.h} lit={mic.talkover} colour={INK.amber} />
      {leg(F.talk.x + F.talk.w / 2, 'TALK OVER', 15.6)}
      <Knob cx={F.depth.x} cy={F.depth.y} d={F.depth.d} value={mic.depth} />
      {leg(F.depth.x, 'DEPTH')}
      <Slide2 x={F.sendBooth.x} y={F.sendBooth.y} w={F.sendBooth.w} h={F.sendBooth.h} on={mic.toBooth} />
      <Slide2 x={F.sendRec.x} y={F.sendRec.y} w={F.sendRec.w} h={F.sendRec.h} on={mic.toRec} />
      {leg(F.sendBooth.x + F.sendBooth.w / 2, 'BOOTH', 52.5, true)}
      {leg(F.sendRec.x + F.sendRec.w / 2, 'REC', 52.5, true)}
      {highlight.map((p) => (
        <Halo key={p} b={frontPartBox(p)} round={p === 'mic1' || p === 'mic2' || p.startsWith('gain') || p === 'level' || p === 'depth'} />
      ))}
    </Group>
  );
});
