/**
 * RearPanels — the back of a media player, a turntable and the mixer, face-on
 * (the view you have leaning over the booth to plug in), AUTHORED IN mm. The
 * mixer's rear is the mirror of its top: channel 2's inputs are on the LEFT
 * when you look at the back — exactly the trap it is on real gear.
 *
 * Every socket is the real connector (parts.tsx): RCA pairs with white (L) and
 * red (R) rings, the orange digital coax, RJ45 LAN, USB-B, XLR outputs (male),
 * 6.35 mm TRS booth outputs, the ground post, the IEC inlet and the power
 * switch. A plugged cable draws its plug over the socket and its own lane
 * away (never merged with another cable); it GLOWS while audio is actually
 * flowing down it (the renderer's route, not a guess).
 */
import { memo } from 'react';
import { Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { MIXER_REAR, MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS } from '../geometry/boothGeometry';
import { INK } from './ink';
import { GroundPost, IecInlet, RcaSocket, Rj45, Rocker, TrsSocket, UsbB, XlrSocket } from './parts';
import { SceneText } from './sceneText';

export const TT_REAR = { w: 300, h: 90 } as const;
export const TT_REAR_JACKS = { outL: { x: 84, y: 46 }, outR: { x: 108, y: 46 }, gnd: { x: 140, y: 46 }, preamp: { x: 176, y: 38 }, ac: { x: 230, y: 34 } } as const;

function Panel({ w, h }: { w: number; h: number }) {
  return (
    <Group>
      <RoundedRect x={3} y={5} width={w} height={h} r={6} color="rgba(0,0,0,0.7)" />
      <RoundedRect x={0} y={0} width={w} height={h} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#2b2e33', '#15161a']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={w - 1.2} height={h - 1.2} r={5.5} style="stroke" strokeWidth={1} color={INK.bevel} />
    </Group>
  );
}

export const PlayerRear = memo(function PlayerRear({ x, y, on, label }: { x: number; y: number; on: boolean; label: string }) {
  const J = PLAYER_REAR_JACKS;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={PLAYER_REAR.w} h={PLAYER_REAR.h} />
      <SceneText x={16} y={20} size={9} text={label} color={INK.print} face="label" />
      <RcaSocket cx={J.outL.x} cy={J.outL.y} d={12} ring={INK.rcaWhite} />
      <RcaSocket cx={J.outR.x} cy={J.outR.y} d={12} ring={INK.rcaRed} />
      <RcaSocket cx={J.digital.x} cy={J.digital.y} d={12} ring={INK.coaxOrange} />
      <Rj45 x={J.lan.x - 8} y={J.lan.y - 7} s={1} />
      <UsbB x={J.usb.x - 6} y={J.usb.y - 5.5} s={1} />
      <Rocker x={J.power.x - 6.5} y={J.power.y - 10} s={1} on={on} />
      <IecInlet x={J.ac.x - 12} y={J.ac.y - 8} s={1} />
    </Group>
  );
});

export const TurntableRear = memo(function TurntableRear({ x, y, on, preamp }: { x: number; y: number; on: boolean; preamp: 'PHONO' | 'LINE' }) {
  const J = TT_REAR_JACKS;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={TT_REAR.w} h={TT_REAR.h} />
      <SceneText x={16} y={20} size={9} text="TURNTABLE (REAR)" color={INK.print} face="label" />
      <RcaSocket cx={J.outL.x} cy={J.outL.y} d={12} ring={INK.rcaWhite} />
      <RcaSocket cx={J.outR.x} cy={J.outR.y} d={12} ring={INK.rcaRed} />
      <GroundPost cx={J.gnd.x} cy={J.gnd.y} d={11} />
      {/* the built-in preamp switch: PHONO (raw cartridge) / LINE */}
      <RoundedRect x={J.preamp.x - 10} y={J.preamp.y} width={20} height={14} r={2} color="#050506" />
      <RoundedRect x={J.preamp.x - 9 + (preamp === 'LINE' ? 9 : 0)} y={J.preamp.y + 1.5} width={9} height={11} r={1.5}>
        <LinearGradient start={vec(0, J.preamp.y)} end={vec(0, J.preamp.y + 14)} colors={['#b9bec6', '#5c626b']} />
      </RoundedRect>
      <Rocker x={J.ac.x + 30} y={J.ac.y - 4} s={1} on={on} />
      <IecInlet x={J.ac.x - 12} y={J.ac.y} s={1} />
    </Group>
  );
});

export const MixerRear = memo(function MixerRear({ x, y, on }: { x: number; y: number; on: boolean }) {
  const J = MIXER_REAR_JACKS;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Panel w={MIXER_REAR.w} h={MIXER_REAR.h} />
      <SceneText x={12} y={18} size={9} text="MIXER (REAR)" color={INK.print} face="label" />
      {(['ch2.phono', 'ch2.line', 'ch1.phono', 'ch1.line'] as const).map((k) => (
        <Group key={k}>
          <RcaSocket cx={J[`${k}.L`].x} cy={J[`${k}.L`].y} d={11} ring={INK.rcaWhite} />
          <RcaSocket cx={J[`${k}.R`].x} cy={J[`${k}.R`].y} d={11} ring={INK.rcaRed} />
        </Group>
      ))}
      <GroundPost cx={J.gnd.x} cy={J.gnd.y} d={10} />
      <TrsSocket cx={J['booth.L'].x} cy={J['booth.L'].y} d={13} />
      <TrsSocket cx={J['booth.R'].x} cy={J['booth.R'].y} d={13} />
      <XlrSocket cx={J['master.L'].x} cy={J['master.L'].y} d={19} male />
      <XlrSocket cx={J['master.R'].x} cy={J['master.R'].y} d={19} male />
      <UsbB x={J.usb.x - 6} y={J.usb.y - 5.5} s={1} />
      <IecInlet x={J.ac.x - 12} y={J.ac.y - 8} s={1} />
      <Rocker x={J.ac.x + 4} y={J.ac.y + 14} s={0.9} on={on} />
    </Group>
  );
});
