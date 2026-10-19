/**
 * laptopArt — Screen 16's drawings: the LAPTOP RIG from above (the laptop,
 * a controller in front of it, the booth's mixer beside it — the gear's own
 * drawings at their class dimensions) with its two USB cables, each a real
 * cable from a USB-A plug to a plug seated in its device; and the software's
 * AUDIO SETUP window (screen points): the device, rate, buffer and latency,
 * the processing LOAD, a DROPOUT lamp that flashes on every dropout the
 * render put in the sound, and each deck's output pair.
 */
import { Group, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { Cable, Led } from './parts';
import { ControllerTop, CTRL_D, CTRL_USB, CTRL_W, LAPTOP_H, LAPTOP_USB, LAPTOP_W, Laptop, RearPlugTop, UsbAPlugTop } from './gear';
import { MixerTop } from './MixerTop';
import { useMotion } from './motion';
import { SceneText } from './sceneText';
import { MIXER_D, MIXER_W, type Box, type Pt } from '../geometry/boothGeometry';
import { bufferMs, loadOf, outputLatencyMs, type LaptopState } from '../model/djLaptop';
import type { Booth } from '../model/djModel';

/** The rig's layout (mm): laptop top-left (×0.8), controller under it
 *  (×0.48), the mixer on the right (×1). */
export const RIG = {
  laptop: { x: 0, y: 0, s: 0.8 },
  ctrl: { x: 0, y: LAPTOP_H * 0.8 + 50, s: 0.48 },
  mixer: { x: LAPTOP_W * 0.8 + 72, y: 30 },
} as const;
export const RIG_FRAME: Box = { x: -56, y: -16, w: LAPTOP_W * 0.8 + 72 + MIXER_W + 66, h: LAPTOP_H * 0.8 + 50 + CTRL_D * 0.48 + 26 };
/** The mixer's rear USB socket, seen from above: its rear edge, mirrored. */
const MIX_USB: Pt = { x: RIG.mixer.x + MIXER_W - 222, y: RIG.mixer.y };
const LAP_R: Pt = { x: RIG.laptop.x + LAPTOP_USB.R.x * RIG.laptop.s, y: RIG.laptop.y + LAPTOP_USB.R.y * RIG.laptop.s };
const LAP_L: Pt = { x: RIG.laptop.x + LAPTOP_USB.L.x * RIG.laptop.s, y: RIG.laptop.y + LAPTOP_USB.L.y * RIG.laptop.s };
const CTL_USB: Pt = { x: RIG.ctrl.x + CTRL_USB.x * RIG.ctrl.s, y: RIG.ctrl.y };
export const RIG_POINTS = { mixUsb: MIX_USB, lapR: LAP_R, lapL: LAP_L, ctlUsb: CTL_USB };
/** Device bodies (label obstacles). */
export const RIG_BODIES: readonly Box[] = [
  { x: RIG.laptop.x, y: RIG.laptop.y, w: LAPTOP_W * RIG.laptop.s, h: LAPTOP_H * RIG.laptop.s },
  { x: RIG.ctrl.x, y: RIG.ctrl.y, w: CTRL_W * RIG.ctrl.s, h: CTRL_D * RIG.ctrl.s },
  { x: RIG.mixer.x, y: RIG.mixer.y, w: MIXER_W, h: MIXER_D },
];

const USB_STYLE = { colour: '#3a3d43', width: 4.2, pattern: 'dots' as const };

/** The rig: devices, then each USB cable in its own lane, glowing with what
 *  it carries (audio blue while the software's decks reach the mixer). */
export function LaptopRig({ booth, audioLive, flow }: { booth: Booth; audioLive: boolean; flow: boolean }) {
  const l = booth.laptop;
  // each cable in its own lane: out of the plug's boot, round the device
  // edges, into the plug seated in the other device
  const laneX = (LAP_R.x + 36 + RIG.mixer.x) / 2;
  const mixRun: [number, number][] = [[LAP_R.x + 36, LAP_R.y], [laneX, LAP_R.y], [laneX, MIX_USB.y - 36], [MIX_USB.x, MIX_USB.y - 36], [MIX_USB.x, MIX_USB.y - 22]];
  const ctlLaneY = (RIG.laptop.y + LAPTOP_H * RIG.laptop.s + CTL_USB.y - 22) / 2;
  const ctlRun: [number, number][] = [[LAP_L.x - 36, LAP_L.y], [LAP_L.x - 44, LAP_L.y], [LAP_L.x - 44, ctlLaneY], [CTL_USB.x, ctlLaneY], [CTL_USB.x, CTL_USB.y - 22]];
  return (
    <Group>
      <Laptop x={RIG.laptop.x} y={RIG.laptop.y} s={RIG.laptop.s} />
      <ControllerTop x={RIG.ctrl.x} y={RIG.ctrl.y} s={RIG.ctrl.s} />
      <MixerTop x={RIG.mixer.x} y={RIG.mixer.y} booth={booth} />
      {l?.usbMixer ? (
        <Group>
          <Cable pts={mixRun} style={USB_STYLE} glow={audioLive ? INK.blue : null} flow={flow && audioLive} />
          <UsbAPlugTop x={LAP_R.x} y={LAP_R.y} dir={1} />
          <RearPlugTop x={MIX_USB.x} y={MIX_USB.y} kind="usb" />
        </Group>
      ) : (
        <Group>
          <Cable pts={[[MIX_USB.x, MIX_USB.y - 22], [MIX_USB.x, MIX_USB.y - 40], [MIX_USB.x + 30, MIX_USB.y - 44]]} style={USB_STYLE} />
          <RearPlugTop x={MIX_USB.x} y={MIX_USB.y} kind="usb" />
          <UsbAPlugTop x={MIX_USB.x + 44} y={MIX_USB.y - 44} dir={1} />
        </Group>
      )}
      {l?.usbCtrl ? (
        <Group>
          <Cable pts={ctlRun} style={USB_STYLE} glow={l.usbCtrl ? INK.amber : null} />
          <UsbAPlugTop x={LAP_L.x} y={LAP_L.y} dir={-1} />
          <RearPlugTop x={CTL_USB.x} y={CTL_USB.y} kind="usb" />
        </Group>
      ) : (
        <Group>
          <Cable pts={[[CTL_USB.x, CTL_USB.y - 22], [CTL_USB.x, CTL_USB.y - 40], [CTL_USB.x - 30, CTL_USB.y - 46]]} style={USB_STYLE} />
          <RearPlugTop x={CTL_USB.x} y={CTL_USB.y} kind="usb" />
          <UsbAPlugTop x={CTL_USB.x - 44} y={CTL_USB.y - 46} dir={-1} />
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
