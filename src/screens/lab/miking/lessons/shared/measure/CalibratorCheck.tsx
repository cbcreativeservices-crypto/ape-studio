/**
 * THE FIELD CHECK, before and after (F11 L29–L33; calibrator.ts is the
 * maths). On the glass: the calibrator seated over the mic's capsule, cut
 * away so the coupler cavity and the capsule's grid show — seated firmly,
 * seated loosely, or (a 1/4 in capsule) missing its adapter — and the
 * check's log: the level the calibrator STATES, the reading BEFORE the run,
 * the reading AFTER it (unadjusted), the DRIFT, and the result's label.
 *
 * Every reading is a MADE-UP EXAMPLE (owner D-6B-2), one story per scenario;
 * the tolerance is the BRIEF's (the method's), never a number this lab
 * invents. The calibrator makes a high level inside its coupler: it goes on
 * a capsule, never to an ear — said on the page. FULLY SILENT.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { MeasurementMic } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { fitXform } from '../../../engine/geometry/frame.ts';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { Calibrator } from './MeasureArt';
import { CAL_SCENARIOS, pascalsOf, runCheck, type CalScenario, type Seat } from './calibrator.ts';
import { CAPSULE, MEAS_DIMS, ONE_FREQUENCY_LIMIT } from './measureSpec.ts';
import { resultLabel } from './resultLabel.ts';

type Phase = 'seat' | 'before' | 'run' | 'after';
const fmtDb = (x: number | null) => (x === null ? 'no stable reading' : `${x.toFixed(1)} dB`);
const sign = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;

export type CalWords = { title: string; badge: string; looking: string; prompt: string; safety: string };

export function useCalibratorStep({ words, onDone }: { words: CalWords; onDone: () => void }): MikingStep {
  const [sid, setSid] = useState<string>(CAL_SCENARIOS[0].id);
  const sc = CAL_SCENARIOS.find((s) => s.id === sid) ?? CAL_SCENARIOS[0];
  const [seat, setSeat] = useState<Seat>('loose');
  const [phase, setPhase] = useState<Phase>('seat');
  const [pre, setPre] = useState<number | null | undefined>(undefined);
  const [post, setPost] = useState<number | undefined>(undefined);
  const out = runCheck(sc, seat);
  const reset = (id: string) => {
    setSid(id);
    setSeat('loose');
    setPhase('seat');
    setPre(undefined);
    setPost(undefined);
  };
  const preReading = sc.pre[seat];
  const preOk = out.pre.stable && out.pre.within;
  const done = post !== undefined;
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  const label = resultLabel({ chainKnown: true, sensitivityOwn: true, preCheck: pre === undefined ? null : preOk, postCheck: post === undefined ? null : out.pass, methodNamed: true });
  const next = () => {
    if (phase === 'seat' || phase === 'before') {
      setPre(preReading);
      setPhase(preOk ? 'run' : 'before');
    } else if (phase === 'run') {
      setPhase('after');
      setPost(sc.post);
    } else {
      reset(sc.id);
    }
  };
  const seats: { id: Seat; label: string; blurb: string }[] = [
    { id: 'seated', label: 'Seated firmly', blurb: 'Pushed fully on, square, as both manuals direct.' },
    { id: 'loose', label: 'Seated loosely', blurb: 'Not fully on: the coupler leaks and the level inside drops.' },
    ...(sc.capsule === 'quarter' ? [{ id: 'noAdapter' as Seat, label: 'No 1/4 in adapter', blurb: 'A 1/4 in capsule straight into a 1/2 in coupler: no seal at all.' }] : []),
  ];
  const params: DockParam[] = [
    { kind: 'options', id: 'scenario', label: 'EXAMPLE', valueLabel: sc.label.toUpperCase(), selectedId: sc.id, onSelect: reset, options: CAL_SCENARIOS.map((s) => ({ id: s.id, label: s.label, blurb: s.brief })) },
    { kind: 'options', id: 'seat', label: 'SEAT', valueLabel: seats.find((s) => s.id === seat)?.label.toUpperCase() ?? '—', selectedId: seat, onSelect: (id) => phase !== 'after' && phase !== 'run' && setSeat(id as Seat), sticky: true, options: seats },
    { kind: 'action', id: 'next', label: phase === 'run' ? 'RUN, READ AFTER' : phase === 'after' ? 'START AGAIN' : 'READ BEFORE', onPress: next, tint: colors.green },
  ];
  const bezel: BezelItem[] = [
    { k: 'STATED', v: `${sc.stated} dB`, sub: '1 kHz', flex: 0.9 },
    { k: 'BEFORE', v: pre === undefined ? '—' : pre === null ? 'NONE' : `${pre.toFixed(1)}`, tint: pre === undefined ? undefined : preOk ? '#5bff85' : '#ff6b5e', flex: 0.9 },
    { k: 'AFTER', v: post === undefined ? '—' : post.toFixed(1), sub: post === undefined ? undefined : 'unadjusted', flex: 0.9 },
    { k: 'DRIFT', v: out.drift === null || post === undefined ? '—' : `${sign(out.drift)} dB`, tint: post !== undefined ? (out.pass ? '#5bff85' : '#ff6b5e') : undefined, flex: 0.9 },
  ];
  const a11y = `The field calibrator over a ${sc.capsule === 'quarter' ? 'quarter' : 'half'} inch measurement mic, ${seats.find((s) => s.id === seat)?.label.toLowerCase()}. It states ${sc.stated} decibels at 1 kilohertz. Before: ${pre === undefined ? 'not read' : fmtDb(pre ?? null)}. After: ${post === undefined ? 'not read' : `${post.toFixed(1)} dB, unadjusted`}.`;
  return {
    key: 'cal',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <CalScene w={w} h={h} sc={sc} seat={seat} label={label.word} a11y={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'seat',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${sc.label}`} prompt={words.prompt} />
        <Card>
          <Point title="THE BRIEF">{sc.brief}</Point>
          <Point title="WHAT IT MAKES">{`${sc.stated} dB at 1 kHz is a pressure of about ${pascalsOf(sc.stated).toFixed(sc.stated === 94 ? 2 : 1)} Pa at the diaphragm${sc.stated === 94 ? ' — the familiar “94 dB is about 1 pascal”' : ''}.`}</Point>
          {pre !== undefined ? <Point title="BEFORE THE RUN">{`${fmtDb(pre)} against ${sc.stated} dB stated. ${out.action}`}</Point> : <Point title="FIRST">Choose how it sits in SEAT, then READ BEFORE.</Point>}
          {post !== undefined && out.drift !== null ? <Point title="AFTER THE RUN">{`${post.toFixed(1)} dB, read before anything is adjusted: a drift of ${sign(out.drift)} dB against the brief’s ±${sc.tolerance} dB. ${out.action}`}</Point> : null}
          <Point title="THE LABEL">{`${label.word}${label.why.length ? ` — ${label.why.join('; ')}` : ''}.`}</Point>
        </Card>
        <Note>{ONE_FREQUENCY_LIMIT}</Note>
        <Note tone="warn">{words.safety}</Note>
      </>
    ),
  };
}

function CalScene({ w, h, sc, seat, label, a11y }: { w: number; h: number; sc: CalScenario; seat: Seat; label: string; a11y: string }) {
  const k = useStageTextScale();
  const box = { u0: -150, u1: 230, v0: -95, v1: 95 };
  const xf = useMemo(() => fitXform('side', box, w, h - 26 * k, 8), [w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = sc.capsule === 'quarter';
  const r = (q ? CAPSULE.quarter.mm / 2 + 0.6 : CAPSULE.half.mm / 2);
  const len = q ? MEAS_DIMS.bodyQuarter.mm : MEAS_DIMS.bodyHalf.mm;
  // How far the capsule sits in the coupler: firmly 16 mm, loosely 6 mm, no adapter: 16 mm in a cavity too wide.
  const depth = seat === 'loose' ? 6 : 16;
  const adapter = q && seat !== 'noAdapter';
  const gap = useMemo(() => {
    const p = Skia.Path.Make();
    if (seat === 'loose') p.addRect(Skia.XYWHRect(-depth - 2, -r - 6, 4, 2 * r + 12));
    return p;
  }, [seat, r, depth]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h - 26 * k }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the mic, pointing left into the coupler; its front `depth` mm inside the mouth */}
          <Group transform={[{ translateX: -depth }, { rotate: -Math.PI / 2 }]}>
            <MeasurementMic r={r} len={len} />
          </Group>
          {/* the calibrator, mouth at x = 0 facing +x, body to the left (cut-away shows the cavity) */}
          <Group transform={[{ scale: -1 }]}>
            <Calibrator x0={0} cy={0} len={140} dia={70} adapter={adapter} lit levelDb={sc.stated} />
          </Group>
          {seat === 'loose' ? <Path path={gap} color="#ff6b5e" opacity={0.55} /> : null}
        </Group>
      </Canvas>
      <View style={[styles.foot, { height: 26 * k }]} pointerEvents="none">
        <Text style={[styles.label, { fontSize: 11 * k }]} {...fitValue(11 * k)}>{`RESULT · ${label}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { justifyContent: 'center', paddingHorizontal: 10 },
  label: { color: colors.amber, fontFamily: fonts.oswaldMedium, letterSpacing: 1, textAlign: 'center' },
});
