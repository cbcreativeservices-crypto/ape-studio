/**
 * laptopArt — Screen 16's drawings: the LAPTOP RIG from above (the laptop,
 * a controller in front of it, the booth's mixer beside it — the gear's own
 * drawings at their class dimensions) with its two USB cables, each a real
 * cable from a USB-A plug to a plug seated in its device; and the software's
 * AUDIO SETUP window (screen points): the device, rate, buffer and latency,
 * the processing LOAD, a DROPOUT lamp that flashes on every dropout the
 * render put in the sound, and each deck's output pair.
 */
import { BlurMask, Group, Line, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { Cable, Led } from './parts';
import { ControllerTop, CTRL_D, CTRL_USB, CTRL_W, LAPTOP_H, LAPTOP_USB, LAPTOP_W, Laptop, UsbAPlugTop } from './gear';
import { MixerTop } from './MixerTop';
import { useMotion } from './motion';
import { SceneText } from './sceneText';
import { MIXER_D, MIXER_W, type Box, type Pt } from '../geometry/boothGeometry';
import { bufferMs, loadOf, outputLatencyMs, type LaptopState } from '../model/djLaptop';
import type { Booth } from '../model/djModel';

/**
 * The rig's layout (mm), ALL AT ONE SCALE (visual review 2 #9, D67): the
 * controller (550 mm) on the left, the laptop (330 mm) in the middle, the
 * booth's mixer (270 mm) on the right, their front edges on one line — the
 * true relative sizes. The laptop's left port feeds the controller, its
 * right port the mixer; each cable runs in its own lane BEHIND the devices.
 */
export const RIG = {
  ctrl: { x: 0, y: 70, s: 1 },
  laptop: { x: 620, y: 40, s: 1 },
  mixer: { x: 1020, y: 0 },
} as const;
/** The table line: every device's front edge. */
export const RIG_FRONT = 390;
export const RIG_FRAME: Box = { x: -12, y: -128, w: 1562, h: 540 };
/** The mixer's rear USB-B socket, seen from above: on its rear edge, mirrored
 *  from the rear panel (rear x 222 → top x 48). */
const MIX_USB: Pt = { x: RIG.mixer.x + MIXER_W - 222, y: RIG.mixer.y };
const LAP_R: Pt = { x: RIG.laptop.x + LAPTOP_USB.R.x, y: RIG.laptop.y + LAPTOP_USB.R.y };
const LAP_L: Pt = { x: RIG.laptop.x + LAPTOP_USB.L.x, y: RIG.laptop.y + LAPTOP_USB.L.y };
const CTL_USB: Pt = { x: RIG.ctrl.x + CTRL_USB.x, y: RIG.ctrl.y };
/** The cables' lanes: the mixer's down the gap and along y −60 behind the
 *  mixer; the controller's down its own gap and along y 22 behind it. */
const MIX_LANE = { x: 1000, y: -62 };
const CTL_LANE = { x: 578, y: 22 };
export const RIG_POINTS = { mixUsb: MIX_USB, lapR: LAP_R, lapL: LAP_L, ctlUsb: CTL_USB, mixLane: MIX_LANE, ctlLane: CTL_LANE };
/** Device bodies (HARD label obstacles: no label lies on the gear). */
export const RIG_BODIES: readonly Box[] = [
  { x: RIG.laptop.x, y: RIG.laptop.y, w: LAPTOP_W, h: LAPTOP_H },
  { x: RIG.ctrl.x, y: RIG.ctrl.y, w: CTRL_W, h: CTRL_D },
  { x: RIG.mixer.x, y: RIG.mixer.y, w: MIXER_W, h: MIXER_D },
  // the plugs standing out of the devices
  { x: MIX_USB.x - 10, y: MIX_USB.y - 30, w: 20, h: 30 },
  { x: CTL_USB.x - 10, y: CTL_USB.y - 30, w: 20, h: 30 },
  { x: LAP_R.x, y: LAP_R.y - 9, w: 38, h: 18 },
  { x: LAP_L.x - 38, y: LAP_L.y - 9, w: 38, h: 18 },
];

const USB_STYLE = { colour: '#3a3d43', width: 4.2, pattern: 'dots' as const };

/** A USB-B plug seated in a rear socket, seen from above: the socket's metal
 *  shroud on the rear edge, the square overmould with its moulded USB mark,
 *  and the strain relief the cable leaves from (pointing away up the page). */
export function UsbBPlugSeated({ x, y }: { x: number; y: number }) {
  return (
    <Group>
      {/* the socket's metal shroud, just proud of the rear edge */}
      <RoundedRect x={x - 7} y={y - 2.5} width={14} height={3} r={0.8}>
        <LinearGradient start={vec(x - 7, 0)} end={vec(x + 7, 0)} colors={['#6c727b', '#e1e5ea', '#5c626b']} />
      </RoundedRect>
      <RoundedRect x={x - 8 + 1} y={y - 22 + 1.5} width={16} height={19} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={1.5} style="normal" />
      </RoundedRect>
      <RoundedRect x={x - 8} y={y - 22} width={16} height={19} r={3}>
        <LinearGradient start={vec(x - 8, 0)} end={vec(x + 8, 0)} colors={['#2a2c31', '#4a4d54', '#121315']} />
      </RoundedRect>
      <Line p1={vec(x - 5, y - 20.5)} p2={vec(x + 5, y - 20.5)} color="rgba(255,255,255,0.16)" strokeWidth={0.7} />
      {/* the moulded trident mark */}
      <Line p1={vec(x, y - 18)} p2={vec(x, y - 9)} color="rgba(255,255,255,0.28)" strokeWidth={0.8} />
      <Line p1={vec(x - 3, y - 15)} p2={vec(x + 3, y - 15)} color="rgba(255,255,255,0.28)" strokeWidth={0.8} />
      {/* the strain relief */}
      <RoundedRect x={x - 3.4} y={y - 32} width={6.8} height={11} r={3}>
        <LinearGradient start={vec(x - 3.4, 0)} end={vec(x + 3.4, 0)} colors={['#202226', '#3a3d43', '#121315']} />
      </RoundedRect>
    </Group>
  );
}

/** The rig: devices, then each USB cable in its own lane, glowing with what
 *  it carries (audio blue while the software's decks reach the mixer;
 *  control amber). An unplugged cable lies loose behind its device. */
export function LaptopRig({ booth, audioLive, flow }: { booth: Booth; audioLive: boolean; flow: boolean }) {
  const l = booth.laptop;
  const mixRun: [number, number][] = [[LAP_R.x + 36, LAP_R.y], [MIX_LANE.x, LAP_R.y], [MIX_LANE.x, MIX_LANE.y], [MIX_USB.x, MIX_LANE.y], [MIX_USB.x, MIX_USB.y - 32]];
  const ctlRun: [number, number][] = [[LAP_L.x - 36, LAP_L.y], [CTL_LANE.x, LAP_L.y], [CTL_LANE.x, CTL_LANE.y], [CTL_USB.x, CTL_LANE.y], [CTL_USB.x, CTL_USB.y - 32]];
  return (
    <Group>
      {/* the table under the rig, its front edge lit */}
      <RoundedRect x={-400} y={-400} width={2200} height={400 + RIG_FRONT + 26} r={0} color="#121316" />
      <RoundedRect x={-400} y={RIG_FRONT + 26} width={2200} height={3} r={0} color="rgba(255,255,255,0.10)" />
      <ControllerTop x={RIG.ctrl.x} y={RIG.ctrl.y} s={RIG.ctrl.s} />
      <Laptop x={RIG.laptop.x} y={RIG.laptop.y} s={RIG.laptop.s} />
      <MixerTop x={RIG.mixer.x} y={RIG.mixer.y} booth={booth} />
      {l?.usbMixer ? (
        <Group>
          <Cable pts={mixRun} style={USB_STYLE} glow={audioLive ? INK.blue : null} flow={flow && audioLive} />
          <UsbAPlugTop x={LAP_R.x} y={LAP_R.y} dir={1} />
          <UsbBPlugSeated x={MIX_USB.x} y={MIX_USB.y} />
        </Group>
      ) : (
        <Group>
          {/* the empty socket, and the cable's B end lying behind the mixer */}
          <RoundedRect x={MIX_USB.x - 7} y={MIX_USB.y - 2.5} width={14} height={3} r={0.8} color="#6c727b" />
          <Cable pts={[[LAP_R.x + 36, LAP_R.y], [MIX_LANE.x - 14, LAP_R.y], [MIX_LANE.x - 14, MIX_LANE.y + 40], [MIX_LANE.x + 20, MIX_LANE.y + 10]]} style={USB_STYLE} />
          <UsbAPlugTop x={LAP_R.x} y={LAP_R.y} dir={1} />
          <UsbBPlugSeated x={MIX_LANE.x + 30} y={MIX_LANE.y + 36} />
        </Group>
      )}
      {l?.usbCtrl ? (
        <Group>
          <Cable pts={ctlRun} style={USB_STYLE} glow={INK.amber} />
          <UsbAPlugTop x={LAP_L.x} y={LAP_L.y} dir={-1} />
          <UsbBPlugSeated x={CTL_USB.x} y={CTL_USB.y} />
        </Group>
      ) : (
        <Group>
          <RoundedRect x={CTL_USB.x - 7} y={CTL_USB.y - 2.5} width={14} height={3} r={0.8} color="#6c727b" />
          <Cable pts={[[LAP_L.x - 36, LAP_L.y], [CTL_LANE.x, LAP_L.y], [CTL_LANE.x, CTL_LANE.y], [CTL_USB.x + 90, CTL_LANE.y], [CTL_USB.x + 60, CTL_LANE.y - 6]]} style={USB_STYLE} />
          <UsbAPlugTop x={LAP_L.x} y={LAP_L.y} dir={-1} />
          <UsbBPlugSeated x={CTL_USB.x + 50} y={CTL_LANE.y + 18} />
        </Group>
      )}
    </Group>
  );
}

/** The software's AUDIO SETUP window (screen points). */
export function AudioSetupPanel({ b, l, dropTimes, count, k = 1 }: { b: Box; l: LaptopState; dropTimes: SharedValue<number[]>; count: number; k?: number }) {
  const { clock } = useMotion();
  const flash = useDerivedValue((): number => {
    const now = clock.value;
    for (const t of dropTimes.value) if (now >= t && now - t < 0.22) return 1;
    return 0;
  });
  const fs = 9.5 * k;
  const big = 11.5 * k;
  const load = loadOf(l);
  const lc = load >= 1 ? INK.peak : load > 0.6 ? INK.amber : INK.green;
  const rowY = (i: number) => b.y + 30 * k + i * 19 * k;
  const col2 = b.x + b.w * 0.5;
  const lx = b.x + 10;
  const val = (x: number, y: number, k1: string, v: string, tint: string = INK.white) => (
    <Group>
      <SceneText x={x} y={y} size={fs} text={k1} color={INK.printDim} face="label" minPt={9.5} />
      <SceneText x={x + 64 * k} y={y} size={big} text={v} color={tint} face="mono" minPt={9.5} />
    </Group>
  );
  const barW = b.w - 20 - 64 * k - 104 * k;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="#0a1018" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(120,170,220,0.25)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={17 * k} r={8} color="rgba(120,170,220,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 12.5 * k} size={fs} text="DJ SOFTWARE · AUDIO SETUP" color={INK.amber} face="label" minPt={9.5} />
      {val(lx, rowY(0), 'DEVICE', l.device, l.device === 'MIXER USB' ? INK.green : '#ff8a7e')}
      {val(col2, rowY(0), 'RATE', `${(l.rate / 1000).toFixed(1)} kHz`)}
      {val(lx, rowY(1), 'BUFFER', `${l.buffer} · ${bufferMs(l.buffer, l.rate).toFixed(1)} ms`)}
      {val(col2, rowY(1), 'LATENCY', `${outputLatencyMs(l.buffer, l.rate).toFixed(1)} ms`, INK.blue)}
      <SceneText x={lx} y={rowY(2)} size={fs} text="LOAD" color={INK.printDim} face="label" minPt={9.5} />
      <RoundedRect x={lx + 64 * k} y={rowY(2) - 9 * k} width={barW} height={10 * k} r={3} color="#15161a" />
      <RoundedRect x={lx + 64 * k} y={rowY(2) - 9 * k} width={barW * Math.min(1, load)} height={10 * k} r={3} color={lc} />
      <Line p1={vec(lx + 64 * k + barW, rowY(2) - 11 * k)} p2={vec(lx + 64 * k + barW, rowY(2) + 3 * k)} color={INK.peak} strokeWidth={1.2} />
      <SceneText x={lx + 64 * k + barW + 6} y={rowY(2)} size={fs} text={`${Math.round(load * 100)}%`} color={lc} face="mono" minPt={9.5} />
      <Group>
        <Led cx={b.x + b.w - 54 * k} cy={rowY(2) - 4 * k} r={4 * k} on={flash} colour={INK.peak} />
        <SceneText x={b.x + b.w - 44 * k} y={rowY(2)} size={fs} text={`DROP ${count}`} color={count ? '#ff8a7e' : INK.printDim} face="label" minPt={9.5} />
      </Group>
      {val(lx, rowY(3), 'DECK 1 TO', l.assign.A, l.assign.A === 'USB 1/2' ? INK.white : '#ff8a7e')}
      {val(col2, rowY(3), 'DECK 2 TO', l.assign.B, l.assign.B === 'USB 3/4' ? INK.white : '#ff8a7e')}
    </Group>
  );
}
