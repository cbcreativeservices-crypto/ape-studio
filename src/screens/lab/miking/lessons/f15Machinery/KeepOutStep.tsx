/**
 * F15 — KEEP OUT: the exclusion zone and the airflow round the running fan
 * (shared/measure/exclusion.ts), and the industrial machine that appears
 * ONLY as a no-go example (machinery_sound/GEOMETRY_PROPOSAL.md §2: "drawn
 * only as a no-go example (guards, lockout tag) — no mic placement").
 *
 * From above: the fan, its zone in red dashes, its airflow as a pale cone,
 * and a measurement mic the learner moves with DISTANCE and ANGLE — the page
 * says which keep-out stops it, and why. DEVICE switches to the machine: its
 * guard, its interlocked door, its disconnect with a lockout padlock and tag
 * — no mic, no sensor, no hands. Nothing moves by itself.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Circle, vec } from '@shopify/react-native-skia';
import { fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { Vec3 } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import type { MikingStep } from '../../engine/steps';
import { Card, Landing, Note, Point } from '../../engine/kit';
import { MeasurementMic } from '../../../../../features/lab/micDrawings';
import { CAPSULE, MEAS_DIMS } from '../shared/measure/measureSpec.ts';
import { exclusionHit, zoneRadius } from '../shared/measure/exclusion.ts';
import { fmtMetres } from '../shared/field/sceneFrame.ts';
import { make, rectP } from '../shared/measure/MeasureArt';
import { EAR_Y, EXCL, HUB } from './geometry.ts';
import { FanScene } from './FanArt';

const RED = '#ff6b5e';
const AMBER = '#ffc64d';
const GREEN = '#5bff85';
const DEG = Math.PI / 180;

export type KeepOutWords = { title: string; badge: string; looking: string; prompt: string };
type Device = 'fan' | 'machine';

/** The probe mic at DISTANCE d (mm, in plan from the hub) and ANGLE a (deg off the airflow), at the seated ear height. */
export function probeAt(d: number, a: number): Vec3 {
  return { x: HUB.x + d * Math.cos(a * DEG), y: EAR_Y, z: HUB.z + d * Math.sin(a * DEG) };
}

export function useKeepOutStep({ words, onDone }: { words: KeepOutWords; onDone: () => void }): MikingStep {
  const [d, setD] = useState(400);
  const [a, setA] = useState(20);
  const [device, setDevice] = useState<Device>('fan');
  const p = probeAt(d, a);
  const hit = exclusionHit(EXCL, p);
  const [seen, setSeen] = useState<{ zone: boolean; airflow: boolean; clear: boolean; machine: boolean }>({ zone: false, airflow: false, clear: false, machine: false });
  useEffect(() => {
    if (device === 'machine') setSeen((s) => (s.machine ? s : { ...s, machine: true }));
    else {
      const k = hit ?? 'clear';
      setSeen((s) => (s[k] ? s : { ...s, [k]: true }));
    }
  }, [hit, device]);
  const all = seen.zone && seen.airflow && seen.clear && seen.machine;
  useEffect(() => {
    if (all) onDone();
  }, [all, onDone]);
  const R = zoneRadius(EXCL);
  const params: DockParam[] = [
    { kind: 'options', id: 'device', label: 'DEVICE', valueLabel: device === 'fan' ? 'DESK FAN' : 'MACHINE', selectedId: device, onSelect: (id) => setDevice(id as Device), sticky: true, options: [
      { id: 'fan', label: 'The guarded desk fan', blurb: 'The low-risk device of this lesson, under its own instructions.' },
      { id: 'machine', label: 'An industrial machine', blurb: 'A no-go example only: no mic placement, no sensor, nothing near it.' },
    ] },
    ...(device === 'fan'
      ? ([
          { kind: 'fader', id: 'dist', label: 'DISTANCE', value: (d - 200) / 2000, onChange: (v: number) => setD(Math.round((200 + v * 2000) / 25) * 25), format: () => `${fmtMetres(d, true)} from the fan`, formatShort: () => fmtMetres(d) },
          { kind: 'fader', id: 'angle', label: 'ANGLE', value: a / 180, onChange: (v: number) => setA(Math.round(v * 36) * 5), format: () => `${a}° off the airflow`, formatShort: () => `${a}°` },
        ] as DockParam[])
      : []),
  ];
  const tint = hit === 'zone' ? RED : hit === 'airflow' ? AMBER : GREEN;
  const bezel: BezelItem[] =
    device === 'fan'
      ? [
          { k: 'MIC', v: fmtMetres(d), sub: `at ${a}°`, flex: 1 },
          { k: 'ZONE', v: fmtMetres(R), sub: 'guard + 0.3 m', flex: 1 },
          { k: 'VERDICT', v: hit === 'zone' ? 'IN THE ZONE' : hit === 'airflow' ? 'IN THE AIR' : 'CLEAR', tint, flex: 1.2 },
        ]
      : [
          { k: 'DEVICE', v: 'MACHINE', flex: 1 },
          { k: 'MIC', v: 'NONE', tint: RED, flex: 1 },
          { k: 'SENSOR', v: 'NONE', tint: RED, flex: 1 },
        ];
  const a11y =
    device === 'fan'
      ? `From above: the guarded desk fan, its exclusion zone ${fmtMetres(R)} round it, its airflow ahead. A measurement mic ${fmtMetres(d)} from the fan, ${a} degrees off the airflow: ${hit === 'zone' ? 'inside the exclusion zone' : hit === 'airflow' ? 'in the airflow' : 'clear of both'}.`
      : 'An industrial machine behind its guard, its interlocked door shut, its disconnect switch off with a lockout padlock and tag. No mic and no sensor are placed: a no-go example.';
  const verdict =
    device === 'machine'
      ? 'A no-go example. Guards and interlocks stay in place; you never place a sensor on, open, service or modify an operating machine. Access that counts as servicing falls under the employer’s hazardous-energy procedure — lockout is for authorized people, never improvised.'
      : hit === 'zone'
        ? 'Inside the exclusion zone: no mic, no stand, no cable, no hand while the fan runs — and never reach through the guard for a “cleaner” take. If a position cannot be reached from outside, leave it out.'
        : hit === 'airflow'
          ? 'In the airflow: the capsule reads the wind on it, not the fan — and a windscreen only hides how much. Move beside the stream.'
          : 'Clear of the zone and beside the airflow: a position you can reach, log and repeat.';
  return {
    key: 'keepout',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (device === 'fan' ? <KeepOutPlan w={w} h={h} p={p} tint={tint} label={a11y} /> : <NoGoMachine w={w} h={h} label={a11y} />),
      badge: device === 'fan' ? words.badge : 'A no-go example · its guard, an interlocked door, a locked-out disconnect',
      bezel,
      params,
      initialParam: device === 'fan' ? 'dist' : 'device',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${device === 'fan' ? 'the desk fan' : 'an industrial machine'}`} prompt={words.prompt} />
        <Card>
          <Point title={device === 'machine' ? 'NO-GO' : hit === 'zone' ? 'STOPPED: THE ZONE' : hit === 'airflow' ? 'STOPPED: THE AIRFLOW' : 'CLEAR'}>{verdict}</Point>
          <Point title="BEFORE IT RUNS">Survey the area with the owner or operator; keep hair, clothing, cables, stands and people clear of intakes, blades, belts, pinch points, hot surfaces, liquid, traffic and electrical conductors. If noise is high, follow the site’s hearing procedure.</Point>
        </Card>
        <Note>{`Looked at: inside the zone ${seen.zone ? '✓' : '○'} · in the airflow ${seen.airflow ? '✓' : '○'} · a clear position ${seen.clear ? '✓' : '○'} · the no-go machine ${seen.machine ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function KeepOutPlan({ w, h, p, tint, label }: { w: number; h: number; p: Vec3; tint: string; label: string }) {
  const k = useStageTextScale();
  const box = { u0: -900, u1: 2350, v0: -1250, v1: 1250 };
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = 1 / xf.s;
  // The mic's front at p, aimed at the fan, its body (drawn toward +y) pointing away from it.
  const rot = Math.atan2(p.z - HUB.z, p.x - HUB.x) - Math.PI / 2;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <FanScene view="top" />
          <Line p1={vec(HUB.x, HUB.z)} p2={vec(p.x, p.z)} color={tint} strokeWidth={1.4 * px} opacity={0.7}>
            <DashPathEffect intervals={[6 * px, 5 * px]} />
          </Line>
          <Group transform={[{ translateX: p.x }, { translateY: p.z }, { rotate: rot }]}>
            <MeasurementMic r={CAPSULE.half.mm / 2} len={MEAS_DIMS.bodyHalf.mm} tint={tint} />
          </Group>
          <Circle cx={p.x} cy={p.z} r={9 * px} style="stroke" strokeWidth={2 * px} color={tint} />
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        RED = EXCLUSION ZONE · PALE CONE = AIRFLOW
      </Text>
    </View>
  );
}

/* ── the no-go example: an industrial machine, locked out ── */

function buildMachine() {
  // A floor-standing machine in elevation (mm): its base cabinet, a guarded
  // work area with an interlocked door, a motor housing on top, a control
  // panel with a stop button; beside it, a disconnect switch on a post with
  // a padlock and a tag through its handle.
  const base = rectP(make(), 0, 900, 1600, 1700, 30);
  const door = rectP(make(), 120, 1000, 700, 1620, 20);
  const stripe = make();
  for (let x = 0; x < 1600; x += 120) {
    stripe.moveTo(x, 1700);
    stripe.lineTo(x + 60, 1640);
  }
  const guard = rectP(make(), 60, 300, 1540, 900, 24);
  const mesh = make();
  for (let x = 120; x < 1540; x += 60) {
    mesh.moveTo(x, 320);
    mesh.lineTo(x, 880);
  }
  for (let y = 360; y < 900; y += 60) {
    mesh.moveTo(80, y);
    mesh.lineTo(1520, y);
  }
  const hinge = make();
  rectP(hinge, 50, 380, 90, 440, 8);
  rectP(hinge, 50, 760, 90, 820, 8);
  const motor = rectP(make(), 900, 80, 1450, 300, 60);
  const fins = make();
  for (let x = 960; x < 1420; x += 50) {
    fins.moveTo(x, 110);
    fins.lineTo(x, 270);
  }
  const panel = rectP(make(), 1650, 700, 1950, 1150, 20);
  const post = rectP(make(), 2200, 600, 2260, 1700, 10);
  const box = rectP(make(), 2100, 500, 2360, 860, 24);
  const handle = rectP(make(), 2330, 640, 2420, 700, 12);
  const shackle = make();
  shackle.moveTo(2390, 700);
  shackle.cubicTo(2390, 760, 2460, 760, 2460, 700);
  const lock = rectP(make(), 2370, 740, 2480, 850, 14);
  const tag = make();
  tag.moveTo(2425, 850);
  tag.lineTo(2380, 900);
  tag.lineTo(2380, 1120);
  tag.lineTo(2500, 1120);
  tag.lineTo(2500, 900);
  tag.close();
  const floor = rectP(make(), -200, 1700, 2700, 1760);
  const hatch = make();
  for (let x = -200; x < 2700; x += 90) {
    hatch.moveTo(x, 1760);
    hatch.lineTo(x + 60, 1700);
  }
  return { base, door, stripe, guard, mesh, hinge, motor, fins, panel, post, box, handle, shackle, lock, tag, floor, hatch };
}

function NoGoMachine({ w, h, label }: { w: number; h: number; label: string }) {
  const k = useStageTextScale();
  const p = useMemo(buildMachine, []);
  const xf = useMemo(() => fitXform('side', { u0: -250, u1: 2750, v0: -100, v1: 1800 }, w, h, 10), [w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={p.floor} color="#26272b" />
          <Path path={p.hatch} style="stroke" strokeWidth={10} color={RED} opacity={0.35} />
          <Path path={p.base}>
            <LinearGradient start={vec(0, 900)} end={vec(1600, 1700)} colors={['#5a6a5c', '#38443a', '#1f2620']} />
          </Path>
          <Path path={p.door} style="stroke" strokeWidth={8} color="#1a201b" />
          <Path path={p.stripe} style="stroke" strokeWidth={22} color={AMBER} opacity={0.75} />
          <Path path={p.motor}>
            <LinearGradient start={vec(900, 80)} end={vec(900, 300)} colors={['#8a9a8c', '#4f5d51', '#2a322b']} />
          </Path>
          <Path path={p.fins} style="stroke" strokeWidth={8} color="#26302a" />
          <Path path={p.guard} color="#111417" opacity={0.85} />
          <Path path={p.mesh} style="stroke" strokeWidth={4} color="#c9ced6" opacity={0.55} />
          <Path path={p.guard} style="stroke" strokeWidth={14} color={AMBER} />
          <Path path={p.hinge} color="#9aa0aa" />
          <Path path={p.panel}>
            <LinearGradient start={vec(1650, 700)} end={vec(1950, 1150)} colors={['#4a4e57', '#24262b']} />
          </Path>
          <Circle cx={1800} cy={820} r={60}>
            <RadialGradient c={vec(1780, 800)} r={70} colors={['#ff8a7e', '#c0392b', '#5a1a14']} />
          </Circle>
          <Path path={p.post} color="#5c6068" />
          <Path path={p.box}>
            <LinearGradient start={vec(2100, 500)} end={vec(2360, 860)} colors={['#6a6f79', '#33363d']} />
          </Path>
          <Path path={p.handle} color="#1a1b1f" />
          <Path path={p.shackle} style="stroke" strokeWidth={16} color="#c7ccd4" />
          <Path path={p.lock}>
            <LinearGradient start={vec(2370, 740)} end={vec(2480, 850)} colors={['#ff6b5e', '#a8281c']} />
          </Path>
          <Path path={p.tag} color="#f2e6c9" />
          <Path path={p.tag} style="stroke" strokeWidth={5} color={RED} />
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        NO-GO EXAMPLE · LOCKOUT: AUTHORIZED PEOPLE ONLY
      </Text>
      <Text style={[styles.stamp, { bottom: 6, left: 8, fontSize: 11 * k }]} {...fitValue(11 * k)}>
        NO MIC · NO SENSOR · NO HANDS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { position: 'absolute', color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  stamp: { position: 'absolute', color: RED, fontFamily: fonts.oswaldMedium, letterSpacing: 1.2 },
});

