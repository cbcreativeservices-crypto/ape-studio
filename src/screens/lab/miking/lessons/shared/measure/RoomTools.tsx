/**
 * The ROOM tools (F13; reusable by F14): two rack steps.
 *
 *   useDecayStep      THE DECAY READER (decay.ts): a made-up energy decay curve
 *                     per octave band, the noise floor (raised by the air
 *                     handling with FLOOR), and the three estimates — EDT, T20,
 *                     T30 — each fitted over its own range and extended to
 *                     60 dB to show the extrapolation; a fit whose end would
 *                     sit within 10 dB of the floor is REFUSED, not drawn.
 *   useSamplingStep   WHERE THE RECEIVERS GO (sampling.ts): pick positions on
 *                     the room's plan and read what the set can stand for.
 *
 * "A simplified example, not a measurement" on the glass (owner D-6B-2).
 * Nothing moves by itself; text ≥ 9 pt, growing with full screen.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Vec3, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { EXAMPLE_BANDS, FLOOR_MARGIN_DB, fitDecay, METRIC_RANGE, sampleDecay, type DecayFit, type DecayMetric } from './decay.ts';
import { judgeSampling, SPOTS, type SpotKind } from './sampling.ts';

const COL: Readonly<Record<DecayMetric, string>> = { EDT: '#7fe0c0', T20: '#ffc64d', T30: '#6fa8ff' };
const METRICS: readonly DecayMetric[] = ['EDT', 'T20', 'T30'];
const TMAX = 3;
const fmtS = (f: DecayFit) => (f.ok ? `${f.seconds.toFixed(2)} s` : 'NOT ENOUGH RANGE');

/* ── the decay reader ── */

export type DecayWords = { title: string; badge: string; looking: string; prompt: string };

export function useDecayStep({ words, onDone }: { words: DecayWords; onDone: () => void }): MikingStep {
  const [bi, setBi] = useState(2);
  const [extra, setExtra] = useState(0);
  const [focus, setFocus] = useState<DecayMetric>('T30');
  const [seen, setSeen] = useState({ refused: false, valid: false });
  const b = EXAMPLE_BANDS[bi];
  const model = useMemo(() => ({ ...b.model, floorDb: b.model.floorDb + extra }), [b, extra]);
  const samples = useMemo(() => sampleDecay(model, TMAX), [model]);
  const fits = useMemo(() => Object.fromEntries(METRICS.map((m) => [m, fitDecay(samples, model.floorDb, m)])) as Record<DecayMetric, DecayFit>, [samples, model.floorDb]);
  useEffect(() => {
    const refused = !fits.T30.ok;
    const valid = fits.T20.ok || fits.T30.ok;
    setSeen((s) => ({ refused: s.refused || refused, valid: s.valid || valid }));
  }, [fits]);
  useEffect(() => {
    if (seen.refused && seen.valid) onDone();
  }, [seen, onDone]);
  const params: DockParam[] = [
    { kind: 'options', id: 'band', label: 'BAND', valueLabel: b.label, selectedId: String(bi), onSelect: (id) => setBi(Number(id)), sticky: true, options: EXAMPLE_BANDS.map((x, i) => ({ id: String(i), label: x.label, blurb: `The ${x.label} octave band of the made-up example.` })) },
    { kind: 'fader', id: 'floor', label: 'NOISE', value: extra / 20, home: 0, onChange: (v) => setExtra(Math.round(v * 20)), format: () => (extra ? `the air handling on: the floor ${extra} dB higher` : 'a quiet room'), formatShort: () => `+${extra} dB` },
    { kind: 'options', id: 'metric', label: 'FIT', valueLabel: focus, selectedId: focus, onSelect: (id) => setFocus(id as DecayMetric), options: METRICS.map((m) => ({ id: m, label: m, blurb: `From ${METRIC_RANGE[m].from} to ${METRIC_RANGE[m].to} dB, extended to 60 dB (×${METRIC_RANGE[m].factor}).` })) },
  ];
  const bezel: BezelItem[] = [
    ...METRICS.map((m) => ({ k: m, v: fits[m].ok ? (fits[m] as { seconds: number }).seconds.toFixed(2) : 'REFUSED', sub: fits[m].ok ? 's' : 'range', tint: fits[m].ok ? COL[m] : '#ff6b5e', flex: 1 })),
    { k: 'RANGE', v: `${-model.floorDb} dB`, flex: 0.9 },
  ];
  const a11y = `A made-up decay in the ${b.label} band: the level falls from 0 dB to a noise floor ${-model.floorDb} dB down. EDT ${fmtS(fits.EDT)}, T20 ${fmtS(fits.T20)}, T30 ${fmtS(fits.T30)}.`;
  const f = fits[focus];
  return {
    key: 'decay',
    title: words.title,
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => <DecayGraph w={w} h={h} samples={samples} floorDb={model.floorDb} fits={fits} focus={focus} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'floor',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${b.label}`} prompt={words.prompt} />
        <Card>
          <Point title={`${focus} · ${fmtS(f)}`}>
            {f.ok
              ? `Fitted from ${METRIC_RANGE[focus].from} to ${METRIC_RANGE[focus].to} dB and extended to 60 dB (×${METRIC_RANGE[focus].factor}): an estimate of the time for a 60 dB decay, never 20 or 30 dB of seconds observed.`
              : `Refused: its end, ${METRIC_RANGE[focus].to} dB, would sit within ${FLOOR_MARGIN_DB} dB of the floor (${model.floorDb} dB). It needs ${-METRIC_RANGE[focus].to + FLOOR_MARGIN_DB} dB of range; this band has ${-model.floorDb}. Try a valid shorter fit, a quieter time — never a louder source just to force a result.`}
          </Point>
          <Point title="EDT IS ITS OWN MEASURE">The early decay — the first 10 dB — can be shorter or longer than T20 and T30 in the same room: report it separately, never as a stand-in for them.</Point>
        </Card>
        <Note>{`Seen: a refused fit ${seen.refused ? '✓' : '○'} · a valid one ${seen.valid ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function DecayGraph({ w, h, samples, floorDb, fits, focus, label }: { w: number; h: number; samples: readonly { t: number; db: number }[]; floorDb: number; fits: Record<DecayMetric, DecayFit>; focus: DecayMetric; label: string }) {
  const k = useStageTextScale();
  const L = 34 * k;
  const R = w - 10;
  const T = 14 * k;
  const B = h - 22 * k;
  const xOf = (t: number) => L + ((R - L) * t) / TMAX;
  const yOf = (db: number) => T + ((B - T) * Math.min(65, Math.max(0, -db))) / 65;
  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    samples.forEach((s, i) => (i ? p.lineTo(xOf(s.t), yOf(s.db)) : p.moveTo(xOf(s.t), yOf(s.db))));
    return p;
  }, [samples, w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (let d = 0; d <= 60; d += 10) {
      p.moveTo(L, yOf(-d));
      p.lineTo(R, yOf(-d));
    }
    for (let t = 0; t <= TMAX; t += 0.5) {
      p.moveTo(xOf(t), T);
      p.lineTo(xOf(t), B);
    }
    return p;
  }, [w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const range = METRIC_RANGE[focus];
  const fitLine = (m: DecayMetric): ReactElement | null => {
    const f = fits[m];
    if (!f.ok) return null;
    const t60 = (-60 - f.intercept) / f.slopeDbPerS;
    return (
      <Group key={m}>
        <Line p1={vec(xOf(f.t0), yOf(f.intercept + f.slopeDbPerS * f.t0))} p2={vec(xOf(f.t1), yOf(f.intercept + f.slopeDbPerS * f.t1))} color={COL[m]} strokeWidth={m === focus ? 3 : 1.6} />
        <Line p1={vec(xOf(f.t1), yOf(f.intercept + f.slopeDbPerS * f.t1))} p2={vec(xOf(Math.min(TMAX, t60)), yOf(f.intercept + f.slopeDbPerS * Math.min(TMAX, t60)))} color={COL[m]} strokeWidth={m === focus ? 1.6 : 1} opacity={0.8}>
          <DashPathEffect intervals={[5, 4]} />
        </Line>
      </Group>
    );
  };
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={grid} style="stroke" strokeWidth={1} color="#26282e" />
        {/* the focused fit's evaluation range */}
        <Rect x={L} y={yOf(range.from)} width={R - L} height={yOf(range.to) - yOf(range.from)} color={COL[focus]} opacity={0.08} />
        {/* the noise floor and the 10 dB margin above it */}
        <Rect x={L} y={yOf(floorDb)} width={R - L} height={B - yOf(floorDb)} color="#8a8b93" opacity={0.16} />
        <Line p1={vec(L, yOf(floorDb + FLOOR_MARGIN_DB))} p2={vec(R, yOf(floorDb + FLOOR_MARGIN_DB))} color="#ff6b5e" strokeWidth={1.2} opacity={0.8}>
          <DashPathEffect intervals={[4, 4]} />
        </Line>
        <Path path={curve} style="stroke" strokeWidth={2.4} color="#e8eaee" />
        {METRICS.map(fitLine)}
      </Canvas>
      {[0, -20, -40, -60].map((d) => (
        <Text key={d} style={[styles.axis, { top: yOf(d) - 7 * k, left: 2, fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${d}`}</Text>
      ))}
      {[0, 1, 2].map((t) => (
        <Text key={t} style={[styles.axis, { top: B + 3, left: xOf(t) - 8 * k, width: 16 * k, textAlign: 'center', fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${t}`}</Text>
      ))}
      <Text style={[styles.axis, { top: B + 3, right: 8, fontSize: 9 * k }]} {...fitValue(9 * k)}>3 SECONDS</Text>
      <Text style={[styles.axis, { top: 0, left: L + 4, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>dB · A SIMPLIFIED EXAMPLE, NOT A MEASUREMENT</Text>
      <Text style={[styles.tag, { top: yOf(floorDb) + 2, left: L + 6, fontSize: 9.5 * k, color: '#b8bcc6' }]} {...fitValue(9.5 * k)}>NOISE FLOOR</Text>
      <Text style={[styles.tag, { top: yOf(floorDb + FLOOR_MARGIN_DB) - 15 * k, right: 12, fontSize: 9.5 * k, color: '#ff6b5e' }]} {...fitValue(9.5 * k)}>10 dB ABOVE IT</Text>
    </View>
  );
}

/* ── where the receivers go ── */

export type SamplingWords = { title: string; badge: string; looking: string; prompt: string };

export function useSamplingStep({ words, Room, box, spots, onDone }: { words: SamplingWords; Room: () => ReactElement; box: ViewBox; spots: Readonly<Record<SpotKind, Vec3>>; onDone: () => void }): MikingStep {
  const [chosen, setChosen] = useState<SpotKind[]>(['centre']);
  const v = judgeSampling(chosen);
  useEffect(() => {
    if (v.ok) onDone();
  }, [v.ok, onDone]);
  const toggle = (id: SpotKind) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const params: DockParam[] = [
    { kind: 'options', id: 'spots', label: 'POSITIONS', valueLabel: `${chosen.length} CHOSEN`, selectedId: null, onSelect: (id) => toggle(id as SpotKind), sticky: true, options: SPOTS.map((s, i) => ({ id: s.id, label: `${chosen.includes(s.id) ? '✓' : '○'} ${i + 1} · ${s.label}`, blurb: s.note })) },
    { kind: 'action', id: 'clear', label: 'CLEAR', onPress: () => setChosen([]) },
  ];
  const bezel: BezelItem[] = [
    { k: 'POSITIONS', v: String(chosen.length), flex: 0.8 },
    { k: 'NEAR / FAR', v: `${chosen.some((c) => ['front', 'mid', 'centre', 'side'].includes(c)) ? '✓' : '—'} / ${chosen.some((c) => ['rear', 'corner'].includes(c)) ? '✓' : '—'}`, flex: 1 },
    { k: 'THE SET', v: v.ok ? 'CAN DESCRIBE IT' : 'NOT YET', tint: v.ok ? '#5bff85' : '#ffc64d', flex: 1.4 },
  ];
  const a11y = `The room from above with six numbered positions; chosen: ${chosen.map((c) => SPOTS.find((s) => s.id === c)?.label).join(', ') || 'none'}. ${v.points.join(' ')}`;
  return {
    key: 'spots',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <SpotPlan w={w} h={h} Room={Room} box={box} spots={spots} chosen={chosen} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'spots',
    },
    well: (
      <>
        <Landing looking={words.looking} prompt={words.prompt} />
        <Card>
          {v.points.map((p, i) => (
            <Point key={p.slice(0, 30)} title={v.ok && i === 0 ? '✓ THE SET CAN DESCRIBE THE ROOM' : 'NOT YET'}>
              {p}
            </Point>
          ))}
        </Card>
        <Note>The method sets the real number of positions and their spacing; this is the reasoning, not a count.</Note>
      </>
    ),
  };
}

function SpotPlan({ w, h, Room, box, spots, chosen, label }: { w: number; h: number; Room: () => ReactElement; box: ViewBox; spots: Readonly<Record<SpotKind, Vec3>>; chosen: readonly SpotKind[]; label: string }) {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [box, w, h]);
  const px = 1 / xf.s;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Room />
          {SPOTS.map((s) => {
            const p = spots[s.id];
            const on = chosen.includes(s.id);
            return (
              <Group key={s.id}>
                <Circle cx={p.x} cy={p.z} r={15 * px} color={on ? '#5bff85' : '#0b0c0f'} opacity={on ? 0.9 : 0.75} />
                <Circle cx={p.x} cy={p.z} r={15 * px} style="stroke" strokeWidth={2.4 * px} color={on ? '#0b0c0f' : '#ffc64d'} />
              </Group>
            );
          })}
        </Group>
      </Canvas>
      {SPOTS.map((s, i) => {
        const p = spots[s.id];
        return (
          <Text key={s.id} style={[styles.num, { left: xf.ox + p.x * xf.s - 10 * k, top: xf.oy + p.z * xf.s - 8 * k, width: 20 * k, fontSize: 11 * k, color: chosen.includes(s.id) ? '#0b0c0f' : '#ffc64d' }]} {...fitValue(11 * k)}>
            {`${i + 1}`}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', color: colors.textMuted, fontFamily: fonts.barlowMedium },
  tag: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
  num: { position: 'absolute', textAlign: 'center', fontFamily: fonts.oswaldMedium },
});
