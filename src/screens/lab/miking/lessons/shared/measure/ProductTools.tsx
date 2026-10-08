/**
 * The PRODUCT tools (F15; Lab 6 group 5, branch lab6-g5): THE CYCLE LOG.
 *
 * A made-up level strip of a device through one operating cycle (cycle.ts:
 * off, start-up, steady with a rattle that comes and goes, stop, off) on a
 * real time base, the start, the steady state and the stop marked. The
 * learner takes a SAMPLE — a short one somewhere in the run, or the whole
 * cycle — and reads what it caught: the rattles, the phases, and its energy
 * average through the SPL calculator (calcBridge.leqOf). Relative dB only,
 * "a made-up example, not a measurement" on the glass (owner D-6B-2).
 * FULLY SILENT; nothing moves by itself; text ≥ 9 pt and zooms.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Line, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { CYCLE, CYCLE_HZ, makeCycle, sampleOf } from './cycle.ts';
import { leqOf } from './calcBridge';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const GREEN = '#5bff85';
const DB_LO = -4;
const DB_HI = 26;

export type CycleWords = { title: string; badge: string; looking: string; prompt: string };
type Len = '5' | '15' | 'whole';

export function useCycleStep({ words, onDone }: { words: CycleWords; onDone: () => void }): MikingStep {
  const levels = useMemo(() => makeCycle(), []);
  const [len, setLen] = useState<Len>('5');
  const [from, setFrom] = useState(14);
  const L = len === 'whole' ? CYCLE.seconds : Number(len);
  const start = len === 'whole' ? 0 : Math.min(from, CYCLE.seconds - L);
  const s = sampleOf(start, L);
  const slice = levels.slice(Math.round(start * CYCLE_HZ), Math.round((start + L) * CYCLE_HZ));
  const leq = leqOf(slice, 1 / CYCLE_HZ);
  const [seenShort, setSeenShort] = useState(false);
  useEffect(() => {
    if (len !== 'whole') setSeenShort(true);
  }, [len, start]);
  const whole = len === 'whole';
  useEffect(() => {
    if (whole && seenShort) onDone();
  }, [whole, seenShort, onDone]);
  const params: DockParam[] = [
    { kind: 'options', id: 'len', label: 'SAMPLE', valueLabel: whole ? 'WHOLE CYCLE' : `${L} S`, selectedId: len, onSelect: (id) => setLen(id as Len), sticky: true, options: [
      { id: '5', label: 'A 5-second sample', blurb: 'A short take somewhere in the run.' },
      { id: '15', label: 'A 15-second sample', blurb: 'A longer take, still part of the run.' },
      { id: 'whole', label: 'The whole cycle, off to off', blurb: 'The background, the start, the steady state, the stop.' },
    ] },
    ...(whole
      ? []
      : ([{ kind: 'fader', id: 'from', label: 'START AT', value: start / (CYCLE.seconds - L), onChange: (v: number) => setFrom(Math.round(v * (CYCLE.seconds - L) * 2) / 2), format: () => `the sample starts ${start.toFixed(1)} s into the run`, formatShort: () => `${start.toFixed(0)} s` }] as DockParam[])),
  ];
  const bezel: BezelItem[] = [
    { k: 'SAMPLE', v: whole ? 'WHOLE' : `${L} s`, sub: whole ? 'off to off' : `from ${start.toFixed(1)} s`, flex: 1 },
    { k: 'RATTLES', v: `${s.rattles} of ${CYCLE.rattles.length}`, tint: s.rattles === CYCLE.rattles.length ? GREEN : s.rattles ? AMBER : undefined, flex: 1 },
    { k: 'ENERGY AVG', v: leq === null ? '—' : `${leq.toFixed(1)}`, sub: 'dB, relative', flex: 1 },
  ];
  const phaseWords = s.phases.map((p) => (p === 'off' ? 'the fan off' : p === 'start' ? 'the start-up' : p === 'steady' ? 'the steady run' : 'the stop')).join(', ');
  const a11y = `A made-up level strip of one cycle of the fan, sixty seconds: off, a start-up at ${CYCLE.on} seconds, a steady run with a rattle at ${CYCLE.rattles.join(', ')} seconds, the stop at ${CYCLE.stop} seconds. ${whole ? 'The whole cycle is sampled' : `A ${L}-second sample from ${start.toFixed(1)} seconds`}: it holds ${phaseWords} and ${s.rattles} of ${CYCLE.rattles.length} rattles.`;
  return {
    key: 'cycle',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <CycleStrip w={w} h={h} levels={levels} start={start} len={L} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: whole ? 'len' : 'from',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${whole ? 'the whole cycle' : `a ${L} s sample`}`} prompt={words.prompt} />
        <Card>
          <Point title={`THIS SAMPLE · ${s.rattles} OF ${CYCLE.rattles.length} RATTLES`}>
            {whole
              ? 'Off to off: the background, the start-up with its overshoot, every rattle in the steady run, the stop. Mark the start, the steady state and the stop in the log — and repeat the run.'
              : s.rattles === 0
                ? `It holds ${phaseWords} — and not one rattle. A take this short, at this phase, would say the fan runs clean.`
                : `It holds ${phaseWords} and ${s.rattles} rattle${s.rattles > 1 ? 's' : ''}: a different sample would give a different picture.`}
          </Point>
          <Point title="WHOLE CYCLES, REPEATED">A short take at one phase can hide an intermittent rattle or exaggerate the start-up. Capture whole cycles with a marker or an operator’s log, repeat each position, and annotate any change in speed or load.</Point>
        </Card>
        <Note>Relative levels on a made-up strip: the shape of a cycle, never a pressure.</Note>
      </>
    ),
  };
}

function CycleStrip({ w, h, levels, start, len, label }: { w: number; h: number; levels: readonly number[]; start: number; len: number; label: string }) {
  const k = useStageTextScale();
  const Lx = 30 * k;
  const R = w - 8;
  const T = 26 * k;
  const B = h - 22 * k;
  const xOf = (t: number) => Lx + ((R - Lx) * t) / CYCLE.seconds;
  const yOf = (db: number) => T + ((B - T) * (DB_HI - Math.max(DB_LO, Math.min(DB_HI, db)))) / (DB_HI - DB_LO);
  const trace = useMemo(() => {
    const p = Skia.Path.Make();
    levels.forEach((v, i) => {
      const x = xOf(i / CYCLE_HZ);
      if (i === 0) p.moveTo(x, yOf(v));
      else p.lineTo(x, yOf(v));
    });
    return p;
  }, [levels, w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (let db = 0; db <= 20; db += 10) {
      p.moveTo(Lx, yOf(db));
      p.lineTo(R, yOf(db));
    }
    for (let t = 0; t <= CYCLE.seconds; t += 10) {
      p.moveTo(xOf(t), T);
      p.lineTo(xOf(t), B);
    }
    return p;
  }, [w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const marks: [number, string][] = [
    [CYCLE.on, 'START'],
    [CYCLE.steady, 'STEADY'],
    [CYCLE.stop, 'STOP'],
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={grid} style="stroke" strokeWidth={1} color="#26282e" />
        <Rect x={xOf(start)} y={T} width={Math.max(1, xOf(start + len) - xOf(start))} height={B - T} color={BLUE} opacity={0.12} />
        <Line p1={vec(xOf(start), T)} p2={vec(xOf(start), B)} color={BLUE} strokeWidth={1.5} />
        <Line p1={vec(xOf(start + len), T)} p2={vec(xOf(start + len), B)} color={BLUE} strokeWidth={1.5} />
        {marks.map(([t]) => (
          <Line key={t} p1={vec(xOf(t), T)} p2={vec(xOf(t), B)} color={AMBER} strokeWidth={1.2} opacity={0.8}>
            <DashPathEffect intervals={[5, 4]} />
          </Line>
        ))}
        <Path path={trace} style="stroke" strokeWidth={1.4} color="#cfd6e2" />
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: Lx, right: 6, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        RELATIVE dB · A MADE-UP CYCLE, NOT A MEASUREMENT
      </Text>
      {marks.map(([t, word], i) => (
        <Text key={word} style={[styles.mark, { top: T + 2 + (i % 2) * 12 * k, left: xOf(t) + 3, fontSize: 9 * k }]} {...fitValue(9 * k)}>
          {word}
        </Text>
      ))}
      {[0, 10, 20].map((db) => (
        <Text key={db} style={[styles.axis, { top: yOf(db) - 7 * k, left: 2, fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${db}`}</Text>
      ))}
      {[0, 10, 20, 30, 40, 50].map((t) => (
        <Text key={t} style={[styles.axis, { top: B + 3, left: xOf(t) - 10 * k, width: 20 * k, textAlign: 'center', fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${t}`}</Text>
      ))}
      <Text style={[styles.axis, { top: B + 3, right: 6, fontSize: 9 * k }]} {...fitValue(9 * k)}>
        60 S
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { position: 'absolute', color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  mark: { position: 'absolute', color: AMBER, fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  axis: { position: 'absolute', color: colors.textMuted, fontFamily: fonts.barlowSemiBold },
});
