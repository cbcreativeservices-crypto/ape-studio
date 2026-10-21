/**
 * dvsArt — Screen 18's drawings (screen points):
 *
 *   DvsScope  the control signal as the DVS software sees it: its two sides
 *             plotted against each other (L across, R up), the ring a
 *             quadrature tone draws — from the render's own samples after
 *             the mixer's phono stage (engine/djStage2.controlScope). Round
 *             and sharp = good; hum wobbles it, a hot signal squares it, a
 *             dirty record fuzzes it, a stopped platter is a dot.
 *   DvsRig    behind the booth: the real rear panels, the laptop on its
 *             stand and every lead, at one scale (below).
 *   DvsRoute  where each signal goes: the turntable's CONTROL tone into the
 *             mixer's PHONO jacks and over USB to the software; the software's
 *             MUSIC back over USB 1/2 to channel 1 and the crowd — and, in
 *             red, a control tone on its way to the speakers.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { Cable, PlugFace } from './parts';
import { styleOf } from './cables';
import { MixerRear, TT_REAR_JACKS, TurntableRear } from './RearPanels';
import { armPartAt } from '../geometry/armGeometry';
import { INK } from './ink';
import { SceneText } from './sceneText';
import { DNode, DWire } from './s2Diagram';
import { MIXER_REAR_JACKS, TT, type Box } from '../geometry/boothGeometry';
import { DVS_MODE_WORDS, type DvsLock, type DvsMode } from '../model/djDvs';

export function DvsScope({ b, scope, quality, lock, mode, k = 1 }: { b: Box; scope: { l: number[]; r: number[] } | null; quality: number; lock: DvsLock; mode: DvsMode; k?: number }) {
  const fs = 9.5 * k;
  const cx = b.x + b.w / 2;
  const top = b.y + 18 * k;
  const bot = b.y + b.h - 26 * k;
  const R = Math.min(b.w - 16, bot - top) / 2;
  const cy = (top + bot) / 2;
  const dots = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (scope) for (let i = 0; i < scope.l.length; i++) p.addCircle(cx + scope.l[i] * R, cy - scope.r[i] * R, 1.1);
    return p.detach();
  }, [scope, cx, cy, R]);
  const tint = lock === 'LOCKED' ? INK.green : lock === 'UNSTABLE' ? INK.amber : lock === 'IGNORED' ? INK.printDim : INK.peak;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={fs} text="CONTROL SIGNAL" color={INK.amber} face="label" minPt={9.5} />
      <Line p1={vec(cx - R, cy)} p2={vec(cx + R, cy)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line p1={vec(cx, cy - R)} p2={vec(cx, cy + R)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R * 0.5} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.18)">
        <DashPathEffect intervals={[3, 3]} />
      </Circle>
      <Path path={dots} color={tint} opacity={0.4}>
        <BlurMask blur={2} style="normal" />
      </Path>
      <Path path={dots} color={tint} />
      <SceneText x={b.x + 8} y={b.y + b.h - 15 * k} size={fs} text={`${Math.round(quality * 100)} % · ${lock}`} color={tint} face="label" minPt={9.5} />
      <SceneText x={b.x + 8} y={b.y + b.h - 4} size={fs} text={DVS_MODE_WORDS[mode]} color={INK.white} face="label" minPt={9.5} />
    </Group>
  );
}

/**
 * BEHIND THE BOOTH — the DVS cabling as you see it reaching round the back
 * (grade 2026-10-19: real rear panels and a real laptop, at ONE scale, on a
 * table). Authored in mm (x right, y DOWN, the table top at y = 0), drawn at
 * one scale — as near the turntable top view's scale beside it as the inset
 * allows:
 *   - the MIXER's rear (the house panel, MixerRear: its printed legends, the
 *     CH 1 PHONO pair, the GND post, the USB-B socket) on its feet;
 *   - the TURNTABLE's back: its 453 mm plinth on its domed feet, its rear
 *     connector plate (the house panel, TurntableRear: OUT L / R, GND, the
 *     PHONO / LINE switch, AC IN), and over the plinth the platter's rim
 *     with its strobe dots, the record, and the arm from behind (its pillar,
 *     the counterweight's end face, the tube out to the headshell — the SAME
 *     pose as the top view);
 *   - the LAPTOP on its stand behind the mixer, seen from behind: the lid's
 *     back, the hinge, the base's rear face with its ports, the stand's legs
 *     on the table.
 * Every lead is the house cable (its plug bodies, its own lane, rounded
 * bends, no merging): the control record's RCA pair (white L, red R, amber
 * glow while the platter turns), the thin ground wire (a LOOSE spade lies on
 * the table), the USB cable (blue glow while it carries audio). Their names
 * sit in the free bands, never on a cable or a panel.
 */
const RIG = {
  mixer: { x: 0, y: -116, feetH: 8 },
  tt: { x: 295, w: 453, plinth: 104, feet: 34, plateX: 20, plateY: 7 },
  lap: { x: -40, w: 330, stand: 120, base: 17, lid: 200 },
  view: { x0: -46, x1: 620, y0: -347, y1: 12 },
} as const;
const TT_TOP = -(RIG.tt.feet + RIG.tt.plinth);
const TT_PLATE = { x: RIG.tt.x + RIG.tt.plateX, y: TT_TOP + RIG.tt.plateY };
const ttJack = (j: keyof typeof TT_REAR_JACKS): [number, number] => [TT_PLATE.x + TT_REAR_JACKS[j].x, TT_PLATE.y + TT_REAR_JACKS[j].y];
const mixJack = (j: keyof typeof MIXER_REAR_JACKS): [number, number] => [RIG.mixer.x + MIXER_REAR_JACKS[j].x, RIG.mixer.y + MIXER_REAR_JACKS[j].y];
const LAP_BASE = -(RIG.lap.stand + RIG.lap.base);
const LAP_PORT: [number, number] = [219, LAP_BASE + RIG.lap.base / 2];

/** The leads' lanes (mm), each its own: the RCA pair and the ground wire run
 *  along the table in front of the panels' feet, nested so none crosses
 *  another; the USB cable drops from the laptop over the mixer's back. */
export function dvsRigRuns(gnd: boolean) {
  const [tl, tly] = ttJack('outL');
  const [tr, try_] = ttJack('outR');
  const [tg, tgy] = ttJack('gnd');
  const ml = mixJack('ch1.phono.L');
  const mr = mixJack('ch1.phono.R');
  const mg = mixJack('gnd');
  const mu = mixJack('usb');
  const L: [number, number][] = [[tl, tly], [tl, -17], [99, -17], [99, ml[1]], [ml[0], ml[1]]];
  const R: [number, number][] = [[tr, try_], [tr, -11.5], [mr[0], -11.5], [mr[0], mr[1]]];
  const G: [number, number][] = gnd ? [[tg, tgy], [tg, -5], [56, -5], [56, mg[1]], [mg[0], mg[1]]] : [[tg, tgy], [tg, -5], [118, -5], [104, -3]];
  const U: [number, number][] = [[LAP_PORT[0], LAP_PORT[1] + 4], [215, -110], [215, -62], [mu[0], mu[1] - 9]];
  return { L, R, G, U, usb: mu };
}

function LaptopFromBehind() {
  const { x, w, base, lid } = RIG.lap;
  const by = LAP_BASE;
  const ly = by - lid;
  return (
    <Group>
      {/* the stand: its platform and two legs down to the table */}
      {[x + 10, x + w - 20].map((lx) => (
        <RoundedRect key={lx} x={lx} y={by + base} width={10} height={RIG.lap.stand} r={2}>
          <LinearGradient start={vec(lx, 0)} end={vec(lx + 10, 0)} colors={['#c9ced5', '#8a9099', '#4a4e56']} />
        </RoundedRect>
      ))}
      <RoundedRect x={x + 4} y={by + base} width={w - 8} height={4} r={1.5}>
        <LinearGradient start={vec(0, by + base)} end={vec(0, by + base + 4)} colors={['#b9bec6', '#5c626b']} />
      </RoundedRect>
      {/* the lid's back (the screen faces the DJ, away from us): a dark
          shell, lit from the upper left, its rim catching the light; the
          screen's glow spills over its top edge */}
      <RoundedRect x={x + 6} y={ly - 6} width={w - 12} height={10} r={5} color="rgba(120,170,255,0.10)">
        <BlurMask blur={5} style="normal" />
      </RoundedRect>
      <RoundedRect x={x + 4} y={ly} width={w - 8} height={lid + 2} r={9}>
        <LinearGradient start={vec(x, ly)} end={vec(x + w, by)} colors={['#3e4148', '#2a2c31', '#1c1d21']} />
      </RoundedRect>
      <RoundedRect x={x + 4.6} y={ly + 0.6} width={w - 9.2} height={lid} r={8.5} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.16)" />
      <Line p1={vec(x + 30, by - 20)} p2={vec(x + 150, ly + 12)} color="rgba(255,255,255,0.05)" strokeWidth={26} strokeCap="round" />
      {/* the hinge, then the base's rear face: vents, ports, rubber feet */}
      <RoundedRect x={x + 22} y={by - 3} width={w - 44} height={6} r={3}>
        <LinearGradient start={vec(0, by - 3)} end={vec(0, by + 3)} colors={['#4a4e56', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={x} y={by} width={w} height={base} r={3}>
        <LinearGradient start={vec(0, by)} end={vec(0, by + base)} colors={['#4a4d54', '#2a2c31', '#17181c']} />
      </RoundedRect>
      {Array.from({ length: 16 }, (_, i) => (
        <RoundedRect key={i} x={x + 40 + i * 6.5} y={by + 6} width={3.6} height={6} r={1.2} color="#08090b" />
      ))}
      {/* a USB-C, a second USB-A, and the USB-A the cable is in */}
      <RoundedRect x={163} y={LAP_PORT[1] - 1.6} width={9} height={3.2} r={1.6} color="#050506" />
      <RoundedRect x={186} y={LAP_PORT[1] - 2.4} width={13} height={4.8} r={0.6} color="#050506" />
      <Rect x={188} y={LAP_PORT[1] - 0.2} width={9} height={1.4} color="#2a5ea8" />
      <RoundedRect x={x + 20} y={by + base - 1} width={18} height={2.4} r={1.2} color="#0b0c0e" />
      <RoundedRect x={x + w - 38} y={by + base - 1} width={18} height={2.4} r={1.2} color="#0b0c0e" />
    </Group>
  );
}

/** The turntable from behind, on its own feet: the plinth's back with its
 *  connector plate, and above it the platter's rim, the record and the arm. */
function TurntableFromBehind({ preamp, ang }: { preamp: 'PHONO' | 'LINE'; ang: number }) {
  const { x, w, plinth, feet } = RIG.tt;
  const top = TT_TOP;
  // from behind the turntable is mirrored: plinth x (from its front-left)
  // becomes w − x from its left end as we see it
  const mx = (px: number) => x + w - px;
  const platterX = mx(TT.platter.cx);
  const pivotX = mx(TT.armPivot.x);
  const stylusX = mx(armPartAt('stylus', ang).x);
  const tubeY = top - 43;
  const recTop = top - 22;
  const dots = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 22; i++) p.addRect(Skia.XYWHRect(platterX - 160 + i * 15.2, top - 11, 4, 4));
    return p.detach();
  }, [platterX, top]);
  return (
    <Group>
      {/* the domed feet, then the plinth's back face */}
      {[x + 26, x + w - 76].map((fx) => (
        <RoundedRect key={fx} x={fx} y={-feet} width={50} height={feet} r={12}>
          <LinearGradient start={vec(fx, 0)} end={vec(fx + 50, 0)} colors={['#3a3c42', '#1e1f23', '#0b0c0e']} />
        </RoundedRect>
      ))}
      <RoundedRect x={x} y={top} width={w} height={plinth} r={6}>
        <LinearGradient start={vec(0, top)} end={vec(0, top + plinth)} colors={['#34373d', '#23252a', '#16171a']} />
      </RoundedRect>
      <Line p1={vec(x + 4, top + 0.7)} p2={vec(x + w - 4, top + 0.7)} color="rgba(255,255,255,0.2)" strokeWidth={1} />
      <TurntableRear x={TT_PLATE.x} y={TT_PLATE.y} on preamp={preamp} />
      {/* the platter's rim (its strobe dots) and the record on it */}
      <RoundedRect x={platterX - 166} y={top - 17} width={332} height={17} r={1.5}>
        <LinearGradient start={vec(0, top - 17)} end={vec(0, top)} colors={['#eef1f4', '#b9bec6', '#6c727b']} />
      </RoundedRect>
      <Path path={dots} color="#3a3e45" />
      <RoundedRect x={platterX - 151} y={recTop} width={302} height={5} r={1} color="#d4d7dc" />
      {/* the arm from behind: its base and pillar, the counterweight's end
          face toward us, the tube out to the headshell over the record */}
      <Line p1={vec(pivotX, tubeY)} p2={vec(stylusX, recTop - 16)} color="#b9bec6" strokeWidth={8.5} strokeCap="round" />
      <RoundedRect x={stylusX - 12} y={recTop - 20} width={24} height={18} r={2} color="#16171a" />
      <RoundedRect x={pivotX - 26} y={top - 6} width={52} height={6} r={2} color="#2a2c31" />
      <RoundedRect x={pivotX - 11} y={tubeY} width={22} height={top - 6 - tubeY} r={2}>
        <LinearGradient start={vec(pivotX - 11, 0)} end={vec(pivotX + 11, 0)} colors={['#eef1f4', '#9aa0a8', '#4a4e56']} />
      </RoundedRect>
      <Circle cx={pivotX} cy={tubeY} r={15}>
        <RadialGradient c={vec(pivotX - 5, tubeY - 5)} r={18} colors={['#eef1f4', '#9aa0a8', '#3a3e45']} />
      </Circle>
      <Circle cx={pivotX} cy={tubeY} r={15} style="stroke" strokeWidth={1} color="rgba(0,0,0,0.5)" />
      <Circle cx={pivotX} cy={tubeY} r={4} color="#3a3e45" />
    </Group>
  );
}

export function DvsRig({ b, gnd, ttPlaying, usbLive, preamp, ang, scale, k = 1 }: { b: Box; gnd: boolean; ttPlaying: boolean; usbLive: boolean; preamp: 'PHONO' | 'LINE'; ang: number; scale: number; k?: number }) {
  const fs = 9.5 * k;
  const V = RIG.view;
  const head = fs + 8;
  const foot = fs + 8;
  const s = Math.min(scale, (b.w - 8) / (V.x1 - V.x0), (b.h - head - foot) / (V.y1 - V.y0));
  // centred in the height left over; the names band right under the table
  const hC = (V.y1 - V.y0) * s;
  const top = b.y + head + Math.max(0, (b.h - head - foot - hC) / 2);
  const ox = b.x + 4 - V.x0 * s;
  const oy = top - V.y0 * s;
  const bandY = top + hC + fs + 3;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;
  const runs = useMemo(() => dvsRigRuns(gnd), [gnd]);
  const rcaL = styleOf({ id: 'L', kind: 'rca', colour: INK.rcaWhite, pts: [], plugged: true, live: false, label: 'L' });
  const rcaR = styleOf({ id: 'R', kind: 'rca', colour: INK.rcaRed, pts: [], plugged: true, live: false, label: 'R', dashed: true });
  const ctrl = ttPlaying ? INK.amber : null;
  const usbPlug = runs.usb;
  const table = { y: 0, h: 12 };
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={fs} text="BEHIND THE BOOTH" color={INK.amber} face="label" minPt={9.5} />
      {gnd ? null : <SceneText x={b.x + b.w - 8} y={b.y + 13 * k} size={fs} text="GND LOOSE: HUM" color={INK.peak} face="label" align="right" minPt={9.5} />}
      <Group clip={Skia.XYWHRect(b.x + 2, top - 2, b.w - 4, hC + 4)}>
        <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: s }]}>
          {/* furthest first: the laptop on its stand, behind the mixer */}
          <LaptopFromBehind />
          {/* the table's back edge, everything standing on it */}
          <Rect x={V.x0 - 10} y={table.y} width={V.x1 - V.x0 + 140} height={table.h} color="#2a2c31" />
          <Line p1={vec(V.x0 - 10, 0.6)} p2={vec(V.x1 + 130, 0.6)} color="rgba(255,255,255,0.22)" strokeWidth={1} />
          {/* the mixer on its feet, its rear panel */}
          {[RIG.mixer.x + 16, RIG.mixer.x + 234].map((fx) => (
            <RoundedRect key={fx} x={fx} y={-RIG.mixer.feetH} width={20} height={RIG.mixer.feetH} r={2} color="#141518" />
          ))}
          <MixerRear x={RIG.mixer.x} y={RIG.mixer.y} on />
          <TurntableFromBehind preamp={preamp} ang={ang} />
          {/* the leads, each in its own lane: the ground wire, the RCA pair
              (the control tone, amber while the platter turns), the USB */}
          <Cable pts={runs.G} style={{ colour: '#7d838c', width: 1.8, pattern: 'plain' }} />
          {gnd ? (
            <RoundedRect x={mixJack('gnd')[0] - 7} y={mixJack('gnd')[1] - 2.5} width={8} height={5} r={1} color="#c9ced5" />
          ) : (
            <Group>
              <RoundedRect x={98} y={-6} width={9} height={5} r={1} color="#c9ced5" />
              <Circle cx={100.5} cy={-3.5} r={1.4} color="#2a2c31" />
            </Group>
          )}
          <Circle cx={ttJack('gnd')[0]} cy={ttJack('gnd')[1]} r={3.4} color="#c9ced5" />
          <Cable pts={runs.R} style={rcaR} glow={ctrl} />
          <Cable pts={runs.L} style={rcaL} glow={ctrl} />
          {[runs.L[0], runs.L[runs.L.length - 1]].map(([px, py], i) => <PlugFace key={`l${i}`} cx={px} cy={py} kind="rca" colour={INK.rcaWhite} />)}
          {[runs.R[0], runs.R[runs.R.length - 1]].map(([px, py], i) => <PlugFace key={`r${i}`} cx={px} cy={py} kind="rca" colour={INK.rcaRed} />)}
          <Cable pts={runs.U} style={{ colour: '#50545c', width: 4.2, pattern: 'dots' }} glow={usbLive ? INK.blue : null} />
          {/* the USB-A plug in the laptop, and the USB-B plug in the mixer, face-on */}
          <RoundedRect x={LAP_PORT[0] - 8} y={LAP_PORT[1] - 4.5} width={16} height={9} r={2}>
            <LinearGradient start={vec(0, LAP_PORT[1] - 4.5)} end={vec(0, LAP_PORT[1] + 4.5)} colors={['#4a4d54', '#16171a']} />
          </RoundedRect>
          <RoundedRect x={usbPlug[0] - 8.5} y={usbPlug[1] - 9} width={17} height={17} r={3}>
            <LinearGradient start={vec(usbPlug[0] - 8.5, 0)} end={vec(usbPlug[0] + 8.5, 0)} colors={['#2a2c31', '#4a4d54', '#121315']} />
          </RoundedRect>
          <Line p1={vec(usbPlug[0], usbPlug[1] - 5)} p2={vec(usbPlug[0], usbPlug[1] + 4)} color="rgba(255,255,255,0.28)" strokeWidth={0.8} />
          <Line p1={vec(usbPlug[0] - 3, usbPlug[1] - 2)} p2={vec(usbPlug[0] + 3, usbPlug[1] - 2)} color="rgba(255,255,255,0.28)" strokeWidth={0.8} />
        </Group>
      </Group>
      {/* the names, in the free air and the band under the table — never on
          a panel or a cable */}
      <SceneText x={X(RIG.lap.x + RIG.lap.w + 8)} y={Y(-290)} size={fs} text="LAPTOP" color={INK.print} face="label" minPt={9.5} />
      <SceneText x={X(V.x1) - 4} y={Y(TT_TOP - 62)} size={fs} text="TURNTABLE" color={INK.print} face="label" align="right" minPt={9.5} />
      <SceneText x={X(RIG.mixer.x) + 2} y={bandY} size={fs} text="MIXER" color={INK.print} face="label" minPt={9.5} />
      <SceneText x={X(usbPlug[0])} y={bandY} size={fs} text="USB" color={usbLive ? INK.blue : INK.printDim} face="label" align="center" minPt={9.5} />
      <SceneText x={X(V.x1) - 4} y={bandY} size={fs} text="CTRL L/R" color={ttPlaying ? INK.amber : INK.printDim} face="label" align="right" minPt={9.5} />
    </Group>
  );
}
export function DvsRoute({ b, ttPlaying, toneOnCh1, thru, lock, chInput, musicLive, k = 1, flow = false }: { b: Box; ttPlaying: boolean; toneOnCh1: boolean; thru: boolean; lock: DvsLock; chInput: string; musicLive: boolean; k?: number; flow?: boolean }) {
  const fs = 10.6 * k;
  const w = (b.w - 24) / 2;
  const h = 32 * k;
  const gx = b.x + 8;
  const gx2 = gx + w + 8;
  const ry = (i: number) => b.y + 20 * k + i * (h + 12 * k);
  const tt: Box = { x: gx, y: ry(0), w, h };
  const ph: Box = { x: gx2, y: ry(0), w, h };
  const sw: Box = { x: gx2, y: ry(1), w, h };
  const ch: Box = { x: gx, y: ry(2), w, h };
  const cr: Box = { x: gx2, y: ry(2), w, h };
  const R = (x: Box): [number, number] => [x.x + x.w, x.y + x.h / 2];
  const L = (x: Box): [number, number] => [x.x, x.y + x.h / 2];
  const B = (x: Box): [number, number] => [x.x + x.w / 2, x.y + x.h];
  const T = (x: Box): [number, number] => [x.x + x.w / 2, x.y];
  const ctrlLive = ttPlaying;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={9.5 * k} text="WHERE EACH SIGNAL GOES" color={INK.amber} face="label" minPt={9.5} />
      <DNode b={tt} title="TURNTABLE" sub="CONTROL REC." live={ttPlaying} tone="amber" size={fs} />
      <DNode b={ph} title="MIXER PHONO" sub="IN, TO USB" live={ttPlaying} tone="amber" size={fs} />
      <DNode b={sw} title="SOFTWARE" sub={lock === 'IGNORED' ? 'INTERNAL' : lock} live={musicLive || thru} tone={lock === 'LOST' ? 'red' : 'blue'} size={fs} />
      <DNode b={ch} title="CHANNEL 1" sub={`INPUT ${chInput}`} live={musicLive || toneOnCh1} tone={toneOnCh1 ? 'red' : 'blue'} size={fs} />
      <DNode b={cr} title="CROWD" sub={toneOnCh1 ? 'HEARS THE TONE' : 'MASTER'} live={musicLive || toneOnCh1} tone={toneOnCh1 ? 'red' : 'blue'} size={fs} />
      <DWire pts={[R(tt), L(ph)]} kind="control" live={ctrlLive} flow={flow} />
      <DWire pts={[B(ph), T(sw)]} kind="control" live={ctrlLive && chInput !== 'x'} flow={flow} />
      <SceneText x={sw.x + sw.w / 2 + 6} y={ph.y + ph.h + 10 * k} size={fs} text="USB" color={INK.amber} face="label" minPt={9.5} />
      <DWire pts={[[sw.x, sw.y + sw.h / 2], [ch.x + ch.w / 2, sw.y + sw.h / 2], T(ch)]} kind={thru ? 'loop' : 'audio'} live={(musicLive || thru) && chInput === 'USB'} flow={flow} />
      <SceneText x={ch.x + 4} y={sw.y + sw.h / 2 - 4} size={fs} text={thru ? 'USB 1/2 · TONE (THRU)' : 'USB 1/2 · MUSIC'} color={thru ? INK.peak : INK.blue} face="label" minPt={9.5} />
      {toneOnCh1 && chInput === 'PHONO' ? <DWire pts={[[ph.x, ph.y + ph.h - 4], [tt.x + tt.w - 8, ph.y + ph.h - 4], [tt.x + tt.w - 8, ch.y]]} kind="loop" live flow={flow} /> : null}
      <DWire pts={[R(ch), L(cr)]} kind={toneOnCh1 ? 'loop' : 'audio'} live={musicLive || toneOnCh1} flow={flow} />
    </Group>
  );
}
