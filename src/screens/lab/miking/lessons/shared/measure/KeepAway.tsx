/**
 * KEEP BACK FROM THE CAPSULE (F11 L35: "Keep the operator away from the
 * capsule as required by the method; a person standing close changes the
 * field"). From above: the source, the measurement mic on its axis, and the
 * person running the measurement, whom the learner moves with DISTANCE.
 *
 * The physics is the engine's (engine/physics): the person reflects some of
 * the source's sound into the capsule, a little later than the direct sound
 * — the extra path, its delay at 20 °C (twoMic.deltaTms, the calculator's
 * speed of sound) and the first comb notch that delay would put in a summed
 * reading (twoMic.notchesHz) — and, by spreading alone, how far below the
 * direct sound it arrives (levels.levelDiffDb). A body also absorbs and
 * scatters, so the real reflection is weaker still: a simplified picture,
 * said once. The keep-away ring's radius is a DRAWING DEFAULT (1 m): the
 * method gives the real one. Nothing moves by itself.
 */
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { MeasurementMic } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Vec3, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { deltaTms, notchesHz } from '../../../engine/physics/twoMic.ts';
import { levelDiffDb } from '../../../engine/physics/levels.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { KeepAwayRing, Operator, TestSpeaker, type TestSpeakerGeom } from './MeasureArt';
import { operatorTop } from './measureModel.ts';
import { CAPSULE, MEAS_DIMS } from './measureSpec.ts';
import { fmtMetres } from '../field/sceneFrame.ts';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** The reflection off a person at O, for a source S and a capsule M. */
export function bodyReflection(S: Vec3, M: Vec3, O: Vec3) {
  const direct = dist(S, M);
  const via = dist(S, O) + dist(O, M);
  const extra = via - direct;
  const ms = deltaTms(extra);
  return { direct, via, extra, ms, firstNotchHz: notchesHz(ms, 1, 20000, 1)[0] ?? null, belowDb: levelDiffDb(direct, via) };
}

export type KeepAwayWords = { title: string; badge: string; looking: string; prompt: string; inside: string; outside: string; note: string };

/** The operator's chest at DISTANCE d (mm) from the capsule, behind it and to one side. */
const opAt = (M: Vec3, d: number): Vec3 => ({ x: M.x + d * Math.cos(Math.PI / 4), y: 0, z: M.z + d * Math.sin(Math.PI / 4) });

export function useKeepAwayStep({ words, speaker, mic, box, onClear }: { words: KeepAwayWords; speaker: TestSpeakerGeom; mic: Vec3; box: ViewBox; onClear: () => void }): MikingStep {
  const ring = MEAS_DIMS.keepAway.mm;
  const [d, setD] = useState(500);
  const [wasIn, setWasIn] = useState(true);
  const O = opAt(mic, d);
  const r = bodyReflection({ x: 0, y: 0, z: 0 }, mic, O);
  const clear = d >= ring;
  useEffect(() => {
    if (!clear) setWasIn(true);
    else if (wasIn) onClear();
  }, [clear, wasIn, onClear]);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'dist',
      label: 'DISTANCE',
      value: (d - 300) / 2200,
      onChange: (v) => setD(Math.round((300 + v * 2200) / 50) * 50),
      format: () => `you stand ${fmtMetres(d, true)} from the capsule`,
      formatShort: () => fmtMetres(d),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'YOU', v: fmtMetres(d), sub: clear ? 'outside the ring' : 'inside the ring', tint: clear ? '#5bff85' : '#ff6b5e', flex: 1 },
    { k: 'EXTRA PATH', v: fmtMetres(r.extra), flex: 1 },
    { k: 'LATER BY', v: `${r.ms.toFixed(1)} ms`, flex: 0.9 },
    { k: 'BELOW DIRECT', v: `${Math.abs(r.belowDb).toFixed(1)} dB`, sub: 'spreading only', flex: 1 },
  ];
  const a11y = `From above: the test loudspeaker on the left, the measurement mic ${fmtMetres(dist({ x: 0, y: 0, z: 0 }, mic))} in front of it on its axis, and you ${fmtMetres(d)} from the capsule, behind it and to one side, ${clear ? 'outside' : 'inside'} the keep-away ring. Your body reflects sound into the mic ${r.ms.toFixed(1)} milliseconds after the direct sound, about ${Math.abs(r.belowDb).toFixed(1)} dB below it by spreading alone.`;
  return {
    key: 'keep',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <KeepAwayScene w={w} h={h} speaker={speaker} mic={mic} O={O} ring={ring} clear={clear} box={box} label={a11y} reflection={r} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'dist',
    },
    well: (
      <>
        <Landing looking={words.looking} prompt={words.prompt} />
        <Card>
          <Point title={clear ? 'OUTSIDE THE RING' : 'INSIDE THE RING'}>{clear ? words.outside : words.inside}</Point>
          <Point title="WHAT YOUR BODY ADDS">{`A copy of the sound off your body, ${fmtMetres(r.extra)} farther, so ${r.ms.toFixed(1)} ms late${r.firstNotchHz ? ` — summed with the direct sound it would put its first notch near ${Math.round(r.firstNotchHz)} Hz` : ''} — and about ${Math.abs(r.belowDb).toFixed(1)} dB below the direct sound by spreading alone. Closer, it is stronger.`}</Point>
        </Card>
        <Note>{words.note}</Note>
      </>
    ),
  };
}

function KeepAwayScene({ w, h, speaker, mic, O, ring, clear, box, label, reflection }: { w: number; h: number; speaker: TestSpeakerGeom; mic: Vec3; O: Vec3; ring: number; clear: boolean; box: ViewBox; label: string; reflection: ReturnType<typeof bodyReflection> }) {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [box, w, h]);
  const px = 1 / xf.s;
  const pose = useMemo(() => operatorTop(O.x + 120, O.z + 120, -1), [O.x, O.z]);
  const floor = useMemo(() => {
    const p = Skia.Path.Make();
    for (let x = Math.ceil(box.u0 / 600) * 600; x < box.u1; x += 600) {
      p.moveTo(x, box.v0);
      p.lineTo(x, box.v1);
    }
    for (let z = Math.ceil(box.v0 / 600) * 600; z < box.v1; z += 600) {
      p.moveTo(box.u0, z);
      p.lineTo(box.u1, z);
    }
    return p;
  }, [box]);
  const labels: StaticLabel[] = [
    { id: 'direct', text: 'DIRECT', u: mic.x / 2, v: -90, align: 'center', tone: 'amber' },
    { id: 'refl', text: `OFF YOU · ${reflection.ms.toFixed(1)} MS LATER`, short: 'OFF YOU', u: (O.x + mic.x) / 2 - 60, v: (O.z + mic.z) / 2 + 160, align: 'right', tone: 'blue' },
    { id: 'ring', text: 'KEEP-AWAY RING (THE METHOD SETS IT)', short: 'KEEP-AWAY', u: mic.x, v: mic.z - ring - 60, align: 'center', tone: clear ? 'muted' : 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={floor} style="stroke" strokeWidth={1.2 * px} color="#24252a" />
          <TestSpeaker g={speaker} view="top" />
          <KeepAwayRing cu={mic.x} cv={mic.z} r={ring} ok={clear} px={px} />
          <Line p1={vec(0, 0)} p2={vec(mic.x, mic.z)} color="#ffc64d" strokeWidth={2.4 * px} />
          <Line p1={vec(0, 0)} p2={vec(O.x, O.z)} color="#6fa8ff" strokeWidth={1.8 * px} opacity={0.85}>
            <DashPathEffect intervals={[8 * px, 6 * px]} />
          </Line>
          <Line p1={vec(O.x, O.z)} p2={vec(mic.x, mic.z)} color="#6fa8ff" strokeWidth={1.8 * px} opacity={0.85}>
            <DashPathEffect intervals={[8 * px, 6 * px]} />
          </Line>
          <Group transform={[{ translateX: mic.x }, { translateY: mic.z }, { rotate: -Math.PI / 2 }]}>
            <MeasurementMic r={CAPSULE.half.mm / 2} len={MEAS_DIMS.bodyHalf.mm} tint="#ffc64d" />
          </Group>
          <Operator pose={pose} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}
