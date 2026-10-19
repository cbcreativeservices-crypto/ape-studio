/**
 * DrumMachine — screen 22's hybrid-rig instrument, drawn as the real object
 * and AUTHORED IN MILLIMETRES (class dimensions in SOURCES.md):
 *
 *   DrumMachineTop   a compact drum machine from above (330 × 176): its
 *                    display (tempo, CLOCK source, the CLOCK-IN light that
 *                    flashes on every beat the clock brings), PLAY / STOP,
 *                    TEMPO and LEVEL, four voice keys, and the sixteen STEP
 *                    keys whose lights run with ITS OWN beat — from the
 *                    leader's clock on EXT, from its own tempo on INT.
 *   DrumMachineRear  its back panel (330 × 52): DC IN, USB-C (a USB DEVICE
 *                    port), MIDI IN on 5-pin DIN and on a 3.5 mm TRS jack
 *                    (type A), MIDI OUT, OUT L / R and PHONES.
 *   ClockTicks       the clock cable's beat marks: one dot per beat the
 *                    clock carries, travelling the cable — an overlay of
 *                    WHEN, never of sound (the cable carries none).
 *
 * The step lights are lesson motion (the learner started the drum machine);
 * they read the booth's one clock. Generic: no brand, no logo.
 */
import { memo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { Key, Knob, Led, TrsSocket } from './parts';
import { DinSocket } from './eventParts';
import { SceneText } from './sceneText';
import { useMotion } from './motion';
import { UsbC } from './parts';

/** Legends read from the 2x full-screen step (visual review #22). */
const LEG = 4.6;

export const DM_W = 330;
export const DM_D = 176;
export const DM_REAR_H = 52;
export const DM_REAR = { dc: { x: 20, y: 26 }, usb: { x: 46, y: 26 }, midiDin: { x: 82, y: 26 }, midiTrs: { x: 116, y: 26 }, midiOut: { x: 150, y: 26 }, outL: { x: 254, y: 26 }, outR: { x: 280, y: 26 }, phones: { x: 308, y: 26 } } as const;

/** The step clock a running drum machine follows: its beat 0 at booth time
 *  `t0` (its bar 1), `beat0` beats there, at `bpm`. null = not running. */
export type StepClock = { t0: number; beat0: number; bpm: number } | null;

function StepKeys({ clock }: { clock: StepClock }) {
  const { clock: c } = useMotion();
  const t0 = clock?.t0 ?? 0;
  const b0 = clock?.beat0 ?? 0;
  const bpm = clock?.bpm ?? 0;
  const on = !!clock;
  const step = useDerivedValue(() => {
    if (!on) return -1;
    const beat = b0 + ((c.value - t0) * bpm) / 60;
    if (beat < 0) return -1;
    return Math.floor(beat * 4) % 16;
  });
  return (
    <Group>
      {Array.from({ length: 16 }, (_, i) => {
        const x = 20 + i * 18.5 + Math.floor(i / 4) * 2;
        return <StepKey key={i} x={x} i={i} step={step} />;
      })}
    </Group>
  );
}

/** A rubber voice pad seen from above: its cast shadow, the domed cap lit
 *  from the upper left (radial gradient), a 1 pt rim light on its top-left
 *  edge, and an inner glow in the voice's colour while it plays (visual
 *  review 2026-10-18, #19). */
function Pad({ x, y, w, h, colour, lit }: { x: number; y: number; w: number; h: number; colour: string; lit: boolean }) {
  return (
    <Group>
      <RoundedRect x={x + 1.2} y={y + 2} width={w} height={h} r={4} color="rgba(0,0,0,0.6)">
        <BlurMask blur={2} style="normal" />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={h} r={4}>
        <RadialGradient c={vec(x + w * 0.32, y + h * 0.28)} r={Math.max(w, h) * 0.85} colors={lit ? ['#5a5d64', '#2a2c31', '#141518'] : ['#4a4d54', '#24262b', '#111214']} positions={[0, 0.55, 1]} />
      </RoundedRect>
      {lit ? (
        <RoundedRect x={x + 2} y={y + 2} width={w - 4} height={h - 4} r={3} color={colour} opacity={0.38}>
          <BlurMask blur={3} style="normal" />
        </RoundedRect>
      ) : null}
      <Path path={Skia.Path.MakeFromSVGString(`M ${x + 1} ${y + h - 3} L ${x + 1} ${y + 4} Q ${x + 1} ${y + 1} ${x + 4} ${y + 1} L ${x + w - 3} ${y + 1}`)!} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.28)" strokeCap="round" />
      <RoundedRect x={x} y={y} width={w} height={h} r={4} style="stroke" strokeWidth={0.5} color="rgba(0,0,0,0.7)" />
    </Group>
  );
}

function StepKey({ x, i, step }: { x: number; i: number; step: { value: number } }) {
  const lit = useDerivedValue((): number => (step.value === i ? 1 : 0));
  const dim = i % 4 === 0;
  return (
    <Group>
      <Key x={x} y={136} w={14} h={14} colour={INK.amber} dim={false} />
      <Circle cx={x + 7} cy={129} r={1.8} color={dim ? INK.amberDim : INK.ledOff} />
      <Group opacity={lit}>
        <Circle cx={x + 7} cy={129} r={4} color={INK.amber} opacity={0.5}>
          <BlurMask blur={2.4} style="normal" />
        </Circle>
        <Circle cx={x + 7} cy={129} r={1.8} color={INK.amber} />
        <RoundedRect x={x} y={136} width={14} height={14} r={3} color={INK.amber} opacity={0.35} />
      </Group>
    </Group>
  );
}

/** The CLOCK IN light: lit for the first part of every beat the clock brings. */
function ClockLed({ x, y, beatClock }: { x: number; y: number; beatClock: StepClock }) {
  const { clock: c } = useMotion();
  const t0 = beatClock?.t0 ?? 0;
  const b0 = beatClock?.beat0 ?? 0;
  const bpm = beatClock?.bpm ?? 0;
  const on = !!beatClock;
  const lit = useDerivedValue((): number => {
    if (!on) return 0;
    const beat = b0 + ((c.value - t0) * bpm) / 60;
    const f = beat - Math.floor(beat);
    return f < 0.18 ? 1 : 0;
  });
  return <Led cx={x} cy={y} r={2.2} on={lit} colour={INK.green} />;
}

export const DrumMachineTop = memo(function DrumMachineTop({ x, y, running, sync, bpm, clockIn, steps, beatClock, level, tempoKnob }: { x: number; y: number; running: boolean; sync: 'INT' | 'EXT'; bpm: number | null; clockIn: boolean; steps: StepClock; beatClock: StepClock; level: number; tempoKnob: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={5} y={9} width={DM_W} height={DM_D} r={12} color="rgba(0,0,0,0.65)">
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={DM_W} height={DM_D} r={12}>
        <LinearGradient start={vec(0, 0)} end={vec(DM_W, DM_D)} colors={['#3a3d44', '#24262b', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={DM_W} height={6} r={4} color="rgba(255,255,255,0.08)" />
      <RoundedRect x={0.6} y={0.6} width={DM_W - 1.2} height={DM_D - 1.2} r={11.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      {/* the display */}
      <RoundedRect x={18} y={18} width={120} height={46} r={4} color="#050506" />
      <RoundedRect x={20} y={20} width={116} height={42} r={3}>
        <LinearGradient start={vec(0, 20)} end={vec(0, 62)} colors={[INK.lcdHi, INK.lcdLo]} />
      </RoundedRect>
      <SceneText x={25} y={44} size={17} text={bpm == null ? '---.-' : bpm.toFixed(1)} color={INK.amber} face="mono" />
      <SceneText x={112} y={30} size={6} text="BPM" color={INK.printDim} face="label" />
      <SceneText x={26} y={57} size={6.4} text={sync === 'EXT' ? (clockIn ? 'CLOCK: EXT · LOCKED' : 'CLOCK: EXT · NONE') : 'CLOCK: INTERNAL'} color={sync === 'EXT' && !clockIn ? INK.red : INK.print} face="label" />
      <ClockLed x={128} y={50} beatClock={clockIn ? beatClock : null} />
      <SceneText x={128} y={30} size={LEG} text="CLK" color={INK.printDim} face="label" align="center" />
      {/* tempo, level */}
      <Knob cx={170} cy={40} d={22} value={tempoKnob} />
      <Knob cx={212} cy={40} d={22} value={level} />
      <SceneText x={170} y={18} size={LEG} text="TEMPO" color={INK.print} face="label" align="center" />
      <SceneText x={212} y={18} size={LEG} text="LEVEL" color={INK.print} face="label" align="center" />
      {/* transport */}
      <Key x={244} y={28} w={30} h={20} lit={running} colour={INK.green} />
      <Key x={282} y={28} w={30} h={20} />
      <SceneText x={259} y={60} size={LEG} text="PLAY" color={INK.print} face="label" align="center" />
      <SceneText x={297} y={60} size={LEG} text="STOP" color={INK.print} face="label" align="center" />
      {/* the four voices */}
      {['SHAKER', 'RIM', 'CONGA L', 'CONGA H'].map((t, i) => (
        <Group key={t}>
          <Pad x={22 + i * 42} y={74} w={34} h={22} lit={running} colour={['#6fa8ff', '#5bff85', '#ffc64d', '#ff8a3d'][i]} />
          <SceneText x={39 + i * 42} y={106} size={LEG} text={t} color={INK.print} face="label" align="center" />
        </Group>
      ))}
      <SceneText x={20} y={120} size={LEG} text="STEPS 1 – 16" color={INK.printDim} face="label" />
      {/* a printed bar line at the start of every beat group (steps 1, 5, 9, 13) */}
      {[0, 4, 8, 12].map((i) => {
        const gx = 20 + i * 18.5 + Math.floor(i / 4) * 2 - 2.2;
        return (
          <Group key={i}>
            <Line p1={vec(gx, 124)} p2={vec(gx, 154)} color={INK.amberDim} strokeWidth={0.9} />
            <SceneText x={gx + 1.5} y={160} size={LEG} text={String(i + 1)} color={INK.printDim} face="label" />
          </Group>
        );
      })}
      <StepKeys clock={running ? steps : null} />
    </Group>
  );
});

export const DrumMachineRear = memo(function DrumMachineRear({ x, y }: { x: number; y: number }) {
  const R = DM_REAR;
  const leg = (cx: number, t: string) => <SceneText x={cx} y={46} size={LEG} text={t} color={INK.print} face="label" align="center" />;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={3} y={5} width={DM_W} height={DM_REAR_H} r={6} color="rgba(0,0,0,0.6)">
        <BlurMask blur={4} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={DM_W} height={DM_REAR_H} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(0, DM_REAR_H)} colors={['#2c2f35', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={DM_W - 1.2} height={DM_REAR_H - 1.2} r={5.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      <SceneText x={8} y={10} size={5} text="DRUM MACHINE (REAR)" color={INK.amber} face="label" />
      <Circle cx={R.dc.x} cy={R.dc.y} r={4.6} color="#0b0c0e" />
      <Circle cx={R.dc.x} cy={R.dc.y} r={1.6} color="#c9ccd2" />
      {leg(R.dc.x, 'DC IN')}
      <UsbC cx={R.usb.x} cy={R.usb.y} plugged={false} />
      {leg(R.usb.x, 'USB')}
      <DinSocket cx={R.midiDin.x} cy={R.midiDin.y} d={14} />
      {leg(R.midiDin.x, 'MIDI IN')}
      <TrsSocket cx={R.midiTrs.x} cy={R.midiTrs.y} d={7} />
      {leg(R.midiTrs.x, 'MIDI IN (A)')}
      <DinSocket cx={R.midiOut.x} cy={R.midiOut.y} d={14} />
      {leg(R.midiOut.x, 'MIDI OUT')}
      <TrsSocket cx={R.outL.x} cy={R.outL.y} d={11} />
      <TrsSocket cx={R.outR.x} cy={R.outR.y} d={11} />
      {leg(R.outL.x, 'OUT L')}
      {leg(R.outR.x, 'OUT R')}
      <TrsSocket cx={R.phones.x} cy={R.phones.y} d={9} />
      {leg(R.phones.x, 'PHONES')}
    </Group>
  );
});

/** Beat marks along the clock cable: dots `spacing` mm apart that move one
 *  spacing per beat the clock carries (an overlay of WHEN — the cable
 *  carries timing, never sound). */
export function ClockTicks({ path, beatClock, spacing }: { path: SkPath; beatClock: StepClock; spacing: number }) {
  const { clock: c } = useMotion();
  const t0 = beatClock?.t0 ?? 0;
  const b0 = beatClock?.beat0 ?? 0;
  const bpm = beatClock?.bpm ?? 0;
  const on = !!beatClock;
  const phase = useDerivedValue(() => {
    if (!on) return 0;
    const beat = b0 + ((c.value - t0) * bpm) / 60;
    return -((beat - Math.floor(beat)) * spacing);
  });
  if (!on) return null;
  return (
    <Path path={path} style="stroke" strokeWidth={4.4} color="#c9a2ff" strokeCap="round">
      <DashPathEffect intervals={[0.01, spacing]} phase={phase} />
    </Path>
  );
}

/** A straight-ish cable path from a to b through a bend (for the clock). */
export function clockPath(pts: [number, number][]): SkPath {
  const p = Skia.PathBuilder.Make();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  return p.detach();
}

