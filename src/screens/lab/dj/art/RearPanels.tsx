/**
 * RearPanels — the back of a media player, a turntable and the mixer, face-on
 * (the view you have reaching round behind the booth to plug in), AUTHORED IN
 * mm. The mixer's rear is the MIRROR of its top: channel 2's inputs are on
 * the LEFT when you look at the back, and so is MASTER R — exactly the trap
 * it is on real gear, so every socket group carries its printed legend
 * (audio review 2026-10-18 #22): CH 2 · PHONO / LINE · GND · CH 1, BOOTH OUT,
 * MASTER OUT (BAL) R · L, USB, AC IN, POWER, with L / R on every pair and a
 * hairline bracket over each group.
 *
 * Every socket is the real connector (parts.tsx). A plugged cable draws its
 * plug over the socket and its own lane away (never merged with another
 * cable); it GLOWS while audio is actually flowing down it (the renderer's
 * route, not a guess).
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { MIXER_REAR, MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS } from '../geometry/boothGeometry';
import { TT_REAR, TT_REAR_JACKS } from '../geometry/dressGeometry';
import { INK } from './ink';
import { IecInlet, RcaSocket, Rj45, Rocker, SlideSwitch, TrsSocket, UsbB, XlrSocket } from './parts';
import { DinSocket } from './eventParts';
import { MIXER_REAR_EXTRA } from '../geometry/eventGeometry';
import { SceneText } from './sceneText';

// the turntable's panel and sockets live in the pure geometry (the cable
// test reaches them); its GND post is LEFT of its outputs (Screen 3 fix)
export { TT_REAR, TT_REAR_JACKS };

/** A chassis GROUND post as it really is: a threaded stud with a knurled
 *  thumb nut on a washer (a spade lug clamps under the nut). Face-on, `d` mm
 *  across the nut. */
export function GndPost({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  const r = d / 2;
  const knurl = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      p.moveTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
      p.lineTo(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98);
    }
    return p.detach();
  }, [cx, cy, r]);
  return (
    <Group>
      {/* the washer on the panel, the nut's shadow, the nut, its knurl, the stud */}
      <Circle cx={cx} cy={cy} r={r * 1.22} color="#07070a" />
      <Circle cx={cx} cy={cy} r={r * 1.14}>
        <RadialGradient c={vec(cx - r * 0.4, cy - r * 0.5)} r={r * 1.6} colors={['#8d929a', '#3a3e45']} />
      </Circle>
      <Circle cx={cx + r * 0.18} cy={cy + r * 0.26} r={r} color="rgba(0,0,0,0.6)">
        <BlurMask blur={r * 0.25} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.5} colors={['#e3e6ea', '#9aa0a8', '#4a4e55']} positions={[0, 0.45, 1]} />
      </Circle>
      <Path path={knurl} style="stroke" strokeWidth={Math.max(0.25, r * 0.07)} color="rgba(0,0,0,0.45)" />
      <Circle cx={cx} cy={cy} r={r * 0.36} color="#2a2c31" />
      <Circle cx={cx} cy={cy} r={r * 0.24}>
        <RadialGradient c={vec(cx - r * 0.08, cy - r * 0.1)} r={r * 0.3} colors={['#c9cdd3', '#5c626b']} />
      </Circle>
    </Group>
  );
}

/** Legend type on the rear panels: 4 mm (capitals ≈ 3 mm). */
const LEG = 4;
const LEG_S = 3.4;

function Panel({ w, h, vents }: { w: number; h: number; vents?: { x0: number; x1: number } }) {
  const slots: number[] = [];
  if (vents) for (let x = vents.x0; x + 4 <= vents.x1; x += 7) slots.push(x);
  return (
    <Group>
      {/* a soft shadow on the table, then the panel with its folded top lip */}
      <RoundedRect x={3} y={6} width={w} height={h} r={6} color="rgba(0,0,0,0.65)">
        <BlurMask blur={5} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={w} height={h} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#2b2e33', '#1c1e22', '#15161a']} positions={[0, 0.5, 1]} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={w} height={4} r={3}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 4)} colors={['#4a4e55', '#2b2e33']} />
      </RoundedRect>
      <Line p1={vec(4, 4.2)} p2={vec(w - 4, 4.2)} color="rgba(0,0,0,0.6)" strokeWidth={0.6} />
      <RoundedRect x={0.6} y={0.6} width={w - 1.2} height={h - 1.2} r={5.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      {slots.map((sx) => (
        <Group key={sx}>
          <RoundedRect x={sx} y={h - 15} width={4} height={10} r={2} color="#060607" />
          <RoundedRect x={sx + 0.5} y={h - 5.6} width={3} height={0.6} r={0.3} color="rgba(255,255,255,0.10)" />
        </Group>
      ))}
    </Group>
  );
}

/** A printed group legend: the words, and a hairline bracket over the
 *  sockets from x0 to x1 (the bracket's feet point down at them). */
function Bracket({ x0, x1, y, t, tone = INK.print }: { x0: number; x1: number; y: number; t: string; tone?: string }) {
  return (
    <Group>
      <SceneText x={(x0 + x1) / 2} y={y - 2} size={LEG} text={t} color={tone} face="label" align="center" />
      <Line p1={vec(x0, y + 2.6)} p2={vec(x0, y)} color={INK.printDim} strokeWidth={0.45} />
      <Line p1={vec(x0, y)} p2={vec(x1, y)} color={INK.printDim} strokeWidth={0.45} />
      <Line p1={vec(x1, y)} p2={vec(x1, y + 2.6)} color={INK.printDim} strokeWidth={0.45} />
    </Group>
  );
}
const Leg = ({ x, y, t, dim = false, size = LEG }: { x: number; y: number; t: string; dim?: boolean; size?: number }) => (
  <SceneText x={x} y={y} size={size} text={t} color={dim ? INK.printDim : INK.print} face="label" align="center" />
);

export const PlayerRear = memo(function PlayerRear({ x, y, on, label }: { x: number; y: number; on: boolean; label: string }) {
  const J = PLAYER_REAR_JACKS;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={PLAYER_REAR.w} h={PLAYER_REAR.h} vents={{ x0: 12, x1: 52 }} />
      <SceneText x={10} y={15} size={6} text={label} color={INK.amber} face="label" />
      <Bracket x0={J.outL.x - 7} x1={J.outR.x + 7} y={38} t="AUDIO OUT" />
      <RcaSocket cx={J.outL.x} cy={J.outL.y} d={12} ring={INK.rcaWhite} />
      <RcaSocket cx={J.outR.x} cy={J.outR.y} d={12} ring={INK.rcaRed} />
      <Leg x={J.outL.x} y={J.outL.y + 13} t="L" />
      <Leg x={J.outR.x} y={J.outR.y + 13} t="R" />
      <Leg x={J.digital.x} y={J.digital.y - 10} t="DIGITAL" size={LEG_S} />
      <RcaSocket cx={J.digital.x} cy={J.digital.y} d={12} ring={INK.coaxOrange} />
      <Leg x={J.digital.x} y={J.digital.y + 13} t="OUT" dim size={LEG_S} />
      <Leg x={J.lan.x} y={J.lan.y - 10} t="LINK" />
      <Rj45 x={J.lan.x - 8} y={J.lan.y - 7} s={1} />
      <Leg x={J.usb.x} y={J.usb.y - 9} t="USB" />
      <UsbB x={J.usb.x - 6} y={J.usb.y - 5.5} s={1} />
      <Leg x={J.power.x} y={J.power.y - 13} t="POWER" size={LEG_S} />
      <Rocker x={J.power.x - 6.5} y={J.power.y - 10} s={1} on={on} />
      <Leg x={J.ac.x} y={J.ac.y - 16} t="AC IN" />
      <IecInlet x={J.ac.x - 12} y={J.ac.y - 8} s={1} />
    </Group>
  );
});

function MixerRearExtrasDraw({ clock }: { clock: MixerRearExtras['clock'] }) {
  const E = MIXER_REAR_EXTRA;
  return (
    <Group>
      <RcaSocket cx={E['rec.L'].x} cy={E['rec.L'].y} d={E['rec.L'].d} ring={INK.rcaWhite} />
      <RcaSocket cx={E['rec.R'].x} cy={E['rec.R'].y} d={E['rec.R'].d} ring={INK.rcaRed} />
      <Leg x={(E['rec.L'].x + E['rec.R'].x) / 2} y={103} t="REC OUT" size={LEG_S} />
      <DinSocket cx={E.midiOut.x} cy={E.midiOut.y} d={E.midiOut.d} />
      <Leg x={E.midiOut.x} y={104} t="MIDI OUT" size={LEG_S} />
      <SlideSwitch x={E.clock.x} y={E.clock.y} w={E.clock.w} h={E.clock.h} pos={clock === 1 ? 0 : clock === 'OFF' ? 1 : 2} />
      <Leg x={E.clock.x + E.clock.w / 2} y={104} t="CLOCK 1·OFF·2" size={LEG_S} />
      <Leg x={E.usb2.x} y={E.usb2.y - 8} t="USB 2" size={LEG_S} />
      <UsbB x={E.usb2.x - 6} y={E.usb2.y - 5.5} s={1} />
    </Group>
  );
}

/** ADDITIVE (round 3, grades screen 3): `w` draws the panel at another
 *  width (Screen 3: the plinth's true 450 mm) with the connector plate's
 *  sockets `inset` mm in from its left end. Omitted = the 300 mm plate
 *  exactly as before. */
export const TurntableRear = memo(function TurntableRear({ x, y, on, preamp, w, inset = 0 }: { x: number; y: number; on: boolean; preamp: 'PHONO' | 'LINE'; w?: number; inset?: number }) {
  const J = TT_REAR_JACKS;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={w ?? TT_REAR.w} h={TT_REAR.h} vents={{ x0: 12 + inset, x1: 60 + inset }} />
      <Group transform={[{ translateX: inset }]}>
        <SceneText x={10} y={15} size={6} text="TURNTABLE (REAR)" color={INK.amber} face="label" />
        <Bracket x0={J.outL.x - 7} x1={J.outR.x + 7} y={30} t="OUT" />
        <RcaSocket cx={J.outL.x} cy={J.outL.y} d={12} ring={INK.rcaWhite} />
        <RcaSocket cx={J.outR.x} cy={J.outR.y} d={12} ring={INK.rcaRed} />
        <Leg x={J.outL.x} y={J.outL.y + 13} t="L" />
        <Leg x={J.outR.x} y={J.outR.y + 13} t="R" />
        <Leg x={J.gnd.x} y={J.gnd.y - 9} t="GND" />
        <GndPost cx={J.gnd.x} cy={J.gnd.y} d={10} />
        {/* the built-in preamp switch: PHONO (raw cartridge) / LINE */}
        <Leg x={J.preamp.x} y={J.preamp.y - 4} t="PHONO · LINE" size={LEG_S} />
        <RoundedRect x={J.preamp.x - 10} y={J.preamp.y} width={20} height={14} r={2} color="#050506" />
        <RoundedRect x={J.preamp.x - 9 + (preamp === 'LINE' ? 9 : 0)} y={J.preamp.y + 1.5} width={9} height={11} r={1.5}>
          <LinearGradient start={vec(0, J.preamp.y)} end={vec(0, J.preamp.y + 14)} colors={['#b9bec6', '#5c626b']} />
        </RoundedRect>
        <Leg x={J.ac.x} y={J.ac.y - 6} t="AC IN" />
        <IecInlet x={J.ac.x - 12} y={J.ac.y} s={1} />
        <Leg x={J.ac.x + 36.5} y={J.ac.y - 9} t="POWER" size={LEG_S} />
        <Rocker x={J.ac.x + 30} y={J.ac.y - 4} s={1} on={on} />
      </Group>
    </Group>
  );
});

/** ADDITIVE (Stage 2b): the mixer's lower-band extras — REC OUT, MIDI OUT
 *  with its CLOCK switch, and USB 2 (geometry/eventGeometry). Omitted =
 *  the Stage 1 panel exactly as before. */
export type MixerRearExtras = { clock: 'OFF' | 1 | 2 };

export const MixerRear = memo(function MixerRear({ x, y, on, extras }: { x: number; y: number; on: boolean; extras?: MixerRearExtras }) {
  const J = MIXER_REAR_JACKS;
  const col = (k: 'ch2.phono' | 'ch2.line' | 'ch1.phono' | 'ch1.line') => (
    <Group key={k}>
      <RcaSocket cx={J[`${k}.L`].x} cy={J[`${k}.L`].y} d={11} ring={INK.rcaWhite} />
      <RcaSocket cx={J[`${k}.R`].x} cy={J[`${k}.R`].y} d={11} ring={INK.rcaRed} />
      <Leg x={J[`${k}.R`].x} y={J[`${k}.R`].y + 13} t={k.endsWith('phono') ? 'PHONO' : 'LINE'} size={LEG_S} />
    </Group>
  );
  const lr = (cx: number) => (
    <Group key={`lr${cx}`}>
      <Leg x={cx} y={J['ch2.phono.L'].y + 1.4} t="L" dim size={LEG_S} />
      <Leg x={cx} y={J['ch2.phono.R'].y + 1.4} t="R" dim size={LEG_S} />
    </Group>
  );
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={MIXER_REAR.w} h={MIXER_REAR.h} vents={extras ? { x0: 236, x1: 262 } : { x0: 150, x1: 262 }} />
      <SceneText x={8} y={13} size={6} text="MIXER (REAR)" color={INK.amber} face="label" />
      <Bracket x0={J['ch2.phono.L'].x - 7} x1={J['ch2.line.L'].x + 7} y={27} t="CH 2" />
      <Bracket x0={J['ch1.phono.L'].x - 7} x1={J['ch1.line.L'].x + 7} y={27} t="CH 1" />
      {(['ch2.phono', 'ch2.line', 'ch1.phono', 'ch1.line'] as const).map(col)}
      {lr(J['ch2.phono.L'].x - 12)}
      {lr(J['ch1.phono.L'].x - 12)}
      <Leg x={J.gnd.x} y={J.gnd.y + 13} t="GND" size={LEG_S} />
      <GndPost cx={J.gnd.x} cy={J.gnd.y} d={9.5} />
      <Bracket x0={J['booth.L'].x - 9} x1={J['booth.L'].x + 9} y={27} t="BOOTH" />
      <TrsSocket cx={J['booth.L'].x} cy={J['booth.L'].y} d={13} />
      <TrsSocket cx={J['booth.R'].x} cy={J['booth.R'].y} d={13} />
      <Leg x={J['booth.L'].x + 11} y={J['booth.L'].y + 1.4} t="L" size={LEG_S} />
      <Leg x={J['booth.R'].x + 11} y={J['booth.R'].y + 1.4} t="R" size={LEG_S} />
      <Bracket x0={J['master.R'].x - 12} x1={J['master.L'].x + 12} y={27} t="MASTER OUT (BAL)" />
      <XlrSocket cx={J['master.R'].x} cy={J['master.R'].y} d={19} male />
      <XlrSocket cx={J['master.L'].x} cy={J['master.L'].y} d={19} male />
      <Leg x={J['master.R'].x} y={J['master.R'].y + 19} t="R" />
      <Leg x={J['master.L'].x} y={J['master.L'].y + 19} t="L" />
      <Leg x={J.usb.x} y={J.usb.y - 8} t={extras ? 'USB 1' : 'USB'} size={LEG_S} />
      {extras ? <MixerRearExtrasDraw clock={extras.clock} /> : null}
      <UsbB x={J.usb.x - 6} y={J.usb.y - 5.5} s={1} />
      <Leg x={J.ac.x} y={J.ac.y - 13} t="AC IN" size={LEG_S} />
      <IecInlet x={J.ac.x - 12} y={J.ac.y - 8} s={1} />
      <Leg x={J.ac.x + 10} y={J.ac.y + 39} t="POWER" size={LEG_S} />
      <Rocker x={J.ac.x + 4} y={J.ac.y + 14} s={0.9} on={on} />
    </Group>
  );
});
