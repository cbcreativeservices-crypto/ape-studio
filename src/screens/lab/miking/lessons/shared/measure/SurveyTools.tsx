/**
 * The SURVEY tools (F12; reusable by F14–F16): two rack steps.
 *
 *   useDescriptorsStep   a made-up 10-minute level history at receiver A or
 *                        B (levelHistory.ts, seeded): the trace on a real
 *                        time base, coloured on the absolute dBA scale
 *                        (levelColor.splColorForDba), with LAeq,T (through
 *                        the SPL calculator), LAFmax, L10 / L50 / L90 and —
 *                        to show why it is wrong — the mean of the dB.
 *   useBackgroundStep    energy subtraction of a background (background.ts)
 *                        with the method's refusal limit; three meters on
 *                        the same absolute scale.
 *
 * "A made-up example, not a measurement" is said on the glass (owner
 * D-6B-2). Nothing moves by itself; numbers are fitted to ≥ 9 pt.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { splColorForDba } from '../../../../../../features/tools/levelColor';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { describe, EXAMPLE_RUNS, makeHistory, SAMPLES_PER_S } from './levelHistory';
import { DEFAULT_LIMIT_DB, subtractBackground } from './background.ts';

const PEAK_RED = '#ff5a48';
const DB_LO = 40;
const DB_HI = 85;
const f1 = (x: number | null) => (x === null || !Number.isFinite(x) ? '—' : x.toFixed(1));

/** Gradient stops pinned to the absolute dBA scale over a plot from yTop (DB_HI) to yBot (DB_LO). */
function pinnedStops() {
  const dbs = [85, 80, 75, 70, 65, 60, 55, 50, 45, 40];
  return { colors: dbs.map((d) => splColorForDba(d)), positions: dbs.map((d) => (DB_HI - d) / (DB_HI - DB_LO)) };
}

/* ── the level history ── */

export type DescriptorWords = { title: string; badge: string; looking: string; prompt: string; receivers: Readonly<Record<'A' | 'B', string>> };

export function useDescriptorsStep({ words, onDone }: { words: DescriptorWords; onDone: () => void }): MikingStep {
  const [rx, setRx] = useState<'A' | 'B'>('A');
  const [mins, setMins] = useState(10);
  const [showMean, setShowMean] = useState(true);
  const [seen, setSeen] = useState<{ A: boolean; B: boolean; window: boolean }>({ A: true, B: false, window: false });
  const levels = useMemo(() => makeHistory(EXAMPLE_RUNS[rx]), [rx]);
  const d = useMemo(() => describe(levels, 0, mins * 60), [levels, mins]);
  const all = seen.A && seen.B && seen.window;
  useEffect(() => {
    if (all) onDone();
  }, [all, onDone]);
  const params: DockParam[] = [
    { kind: 'options', id: 'rx', label: 'RECEIVER', valueLabel: rx, selectedId: rx, onSelect: (id) => { setRx(id as 'A' | 'B'); setSeen((s) => ({ ...s, [id]: true })); }, options: (['A', 'B'] as const).map((r) => ({ id: r, label: `Receiver ${r}`, blurb: words.receivers[r] })) },
    { kind: 'fader', id: 'window', label: 'WINDOW', value: (mins - 1) / 9, home: 1, onChange: (v) => { setMins(Math.max(1, Math.round(1 + v * 9))); setSeen((s) => ({ ...s, window: true })); }, format: () => `the first ${mins} min of the run`, formatShort: () => `${mins} min` },
    { kind: 'toggle', id: 'mean', label: 'MEAN OF dB', value: showMean, onToggle: () => setShowMean((m) => !m) },
  ];
  const bezel: BezelItem[] = [
    { k: 'LAeq,T', v: f1(d.laeq), sub: `${mins} min`, tint: d.laeq !== null ? splColorForDba(d.laeq) : undefined, flex: 1 },
    { k: 'LAFmax', v: f1(d.lafmax), tint: PEAK_RED, flex: 1 },
    { k: 'L90', v: f1(d.l90), flex: 0.9 },
    { k: 'MEAN OF dB', v: f1(d.meanOfDb), sub: 'not an average', flex: 1.1 },
  ];
  const a11y = `A made-up level history at receiver ${rx}: ten minutes of A-weighted fast readings. Over the first ${mins} minutes, LAeq ${f1(d.laeq)} dB, LAFmax ${f1(d.lafmax)} dB, L10 ${f1(d.l10)}, L50 ${f1(d.l50)}, L90 ${f1(d.l90)} dB; the plain mean of the decibel readings is ${f1(d.meanOfDb)} dB.`;
  return {
    key: 'history',
    title: words.title,
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => <HistoryGraph w={w} h={h} levels={levels} mins={mins} d={d} showMean={showMean} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'window',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · receiver ${rx}`} prompt={words.prompt} />
        <Card>
          <Point title={`LAeq OVER ${mins} MIN · ${f1(d.laeq)} dB`}>The energy average over the window — the steady level with the same energy. The loud pass-bys pull it up.</Point>
          <Point title={`MEAN OF THE dB · ${f1(d.meanOfDb)} dB`}>{`Adding the dB readings and dividing gives ${d.laeq !== null ? (d.laeq - d.meanOfDb).toFixed(1) : '—'} dB less here: decibels are logarithms, so their plain average is not the energy average. Never report it as LAeq.`}</Point>
          <Point title={`L10 ${f1(d.l10)} · L50 ${f1(d.l50)} · L90 ${f1(d.l90)}`}>The levels exceeded 10, 50 and 90 % of the window. L90 may describe a quieter underlying level — but it does not remove a source that never stops.</Point>
          <Point title={`LAFmax · ${f1(d.lafmax)} dB`}>The largest fast reading in the window: one event, not the window’s energy, and not a true peak.</Point>
        </Card>
        <Note>{`Looked at: receiver A ${seen.A ? '✓' : '○'} · receiver B ${seen.B ? '✓' : '○'} · a shorter window ${seen.window ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function HistoryGraph({ w, h, levels, mins, d, showMean, label }: { w: number; h: number; levels: readonly number[]; mins: number; d: ReturnType<typeof describe>; showMean: boolean; label: string }) {
  const k = useStageTextScale();
  const L = 34 * k;
  const R = w - 8;
  const T = 10;
  const B = h - 24 * k;
  const total = levels.length / SAMPLES_PER_S;
  const xOf = (s: number) => L + ((R - L) * s) / total;
  const yOf = (db: number) => T + ((B - T) * (DB_HI - Math.max(DB_LO, Math.min(DB_HI, db)))) / (DB_HI - DB_LO);
  const trace = useMemo(() => {
    const p = Skia.Path.Make();
    // One point per quarter-second (every 2nd sample) keeps the path light; the max of each pair keeps the peaks.
    for (let i = 0; i < levels.length; i += 2) {
      const v = Math.max(levels[i], levels[i + 1] ?? levels[i]);
      const x = xOf(i / SAMPLES_PER_S);
      if (i === 0) p.moveTo(x, yOf(v));
      else p.lineTo(x, yOf(v));
    }
    return p;
  }, [levels, w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const stops = useMemo(pinnedStops, []);
  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (let db = DB_LO; db <= DB_HI; db += 10) {
      p.moveTo(L, yOf(db));
      p.lineTo(R, yOf(db));
    }
    for (let m = 0; m <= total / 60; m += 2) {
      p.moveTo(xOf(m * 60), T);
      p.lineTo(xOf(m * 60), B);
    }
    return p;
  }, [w, h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const wx = xOf(mins * 60);
  const iMax = useMemo(() => {
    let best = 0;
    const n = Math.min(levels.length, Math.ceil(mins * 60 * SAMPLES_PER_S));
    for (let i = 1; i < n; i++) if (levels[i] > levels[best]) best = i;
    return best;
  }, [levels, mins]);
  const tag = (y: number, text: string, color: string) => (
    <Text key={text} style={[styles.tag, { top: y - 15 * k, right: 10, fontSize: 9.5 * k, color }]} {...fitValue(9.5 * k)}>
      {text}
    </Text>
  );
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={grid} style="stroke" strokeWidth={1} color="#26282e" />
        <Rect x={L} y={T} width={Math.max(0, wx - L)} height={B - T} color="#6fa8ff" opacity={0.06} />
        <Line p1={vec(wx, T)} p2={vec(wx, B)} color="#6fa8ff" strokeWidth={1.5} opacity={0.7} />
        <Path path={trace} style="stroke" strokeWidth={1.4}>
          <LinearGradient start={vec(0, T)} end={vec(0, B)} colors={stops.colors} positions={stops.positions} />
        </Path>
        <Group>
          {[d.l10, d.l50, d.l90].map((v) => (
            <Line key={v} p1={vec(L, yOf(v))} p2={vec(wx, yOf(v))} color="#8fbcff" strokeWidth={1.2} opacity={0.85}>
              <DashPathEffect intervals={[5, 4]} />
            </Line>
          ))}
          {d.laeq !== null ? <Line p1={vec(L, yOf(d.laeq))} p2={vec(wx, yOf(d.laeq))} color="#ffc64d" strokeWidth={2.2} /> : null}
          {showMean ? (
            <Line p1={vec(L, yOf(d.meanOfDb))} p2={vec(wx, yOf(d.meanOfDb))} color="#b8bcc6" strokeWidth={1.4} opacity={0.9}>
              <DashPathEffect intervals={[2, 3]} />
            </Line>
          ) : null}
          <Rect x={xOf(iMax / SAMPLES_PER_S) - 3} y={yOf(levels[iMax]) - 3} width={6} height={6} color={PEAK_RED} />
        </Group>
      </Canvas>
      {[DB_LO, 50, 60, 70, 80].map((db) => (
        <Text key={db} style={[styles.axis, { top: yOf(db) - 7 * k, left: 2, fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${db}`}</Text>
      ))}
      {[0, 2, 4, 6, 8].map((m) => (
        <Text key={m} style={[styles.axis, { top: B + 3, left: xOf(m * 60) - 10 * k, width: 20 * k, textAlign: 'center', fontSize: 9 * k }]} {...fitValue(9 * k)}>{`${m}`}</Text>
      ))}
      <Text style={[styles.axis, { top: B + 3, right: 8, fontSize: 9 * k }]} {...fitValue(9 * k)}>10 MIN</Text>
      <Text style={[styles.axis, { top: T - 2, left: L + 4, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>dBA · A MADE-UP EXAMPLE, NOT A MEASUREMENT</Text>
      {d.laeq !== null ? tag(yOf(d.laeq), 'LAeq', '#ffc64d') : null}
      {showMean ? tag(yOf(d.meanOfDb) + 14 * k, 'MEAN OF dB', '#b8bcc6') : null}
      {tag(yOf(d.l90) + 14 * k, 'L90', '#8fbcff')}
    </View>
  );
}

/* ── background subtraction ── */

export type BackgroundWords = { title: string; badge: string; looking: string; prompt: string };

export function useBackgroundStep({ words, onDone }: { words: BackgroundWords; onDone: () => void }): MikingStep {
  const [total, setTotal] = useState(62);
  const [bgL, setBg] = useState(56);
  const [limit, setLimit] = useState(DEFAULT_LIMIT_DB);
  const [seen, setSeen] = useState({ ok: false, refused: false });
  const r = subtractBackground(total, bgL, limit);
  useEffect(() => {
    setSeen((s) => (r.ok && !s.ok ? { ...s, ok: true } : !r.ok && !s.refused ? { ...s, refused: true } : s));
  }, [r.ok]);
  useEffect(() => {
    if (seen.ok && seen.refused) onDone();
  }, [seen, onDone]);
  const params: DockParam[] = [
    { kind: 'fader', id: 'total', label: 'TOTAL', value: (total - 40) / 50, onChange: (v) => setTotal(Math.round(40 + v * 50)), format: () => `with the source running: ${total} dB`, formatShort: () => `${total} dB`, level: true },
    { kind: 'fader', id: 'bg', label: 'BACKGROUND', value: (bgL - 30) / 60, onChange: (v) => setBg(Math.round(30 + v * 60)), format: () => `source stopped: ${bgL} dB`, formatShort: () => `${bgL} dB`, level: true },
    { kind: 'options', id: 'limit', label: 'LIMIT', valueLabel: `${limit} dB`, selectedId: String(limit), onSelect: (id) => setLimit(Number(id)), options: [3, 6, 10].map((x) => ({ id: String(x), label: `${x} dB`, blurb: x === DEFAULT_LIMIT_DB ? 'This lab’s default — your method sets the real limit.' : 'Another method’s limit, for comparison — your method sets the real one.' })) },
  ];
  const bezel: BezelItem[] = [
    { k: 'TOTAL', v: `${total}`, tint: splColorForDba(total), flex: 0.9 },
    { k: 'BACKGROUND', v: `${bgL}`, tint: splColorForDba(bgL), flex: 1.1 },
    { k: 'DIFFERENCE', v: `${r.difference >= 0 ? '' : '−'}${Math.abs(r.difference)} dB`, flex: 1 },
    { k: 'SOURCE ALONE', v: r.ok ? r.source.toFixed(1) : 'REFUSED', tint: r.ok ? splColorForDba(r.source) : '#ff6b5e', flex: 1.1 },
  ];
  const why = r.ok ? '' : r.reason === 'notAbove' ? 'The background reads as loud as the total or louder: the source cannot be separated — report that, and find a quieter time or a method that does not need it.' : `Only ${r.difference} dB apart, inside your method’s limit of ${limit} dB: a small error in either reading would swing the answer. Refused — report that the source could not be separated.`;
  const a11y = `Three meters on one scale: total with the source running ${total} decibels, background with it stopped ${bgL}, ${r.ok ? `the source alone by energy subtraction ${r.source.toFixed(1)}` : 'the source alone refused'}. The method’s limit is ${limit} dB.`;
  return {
    key: 'background',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ThreeMeters w={w} h={h} total={total} bg={bgL} source={r.ok ? r.source : null} limit={limit} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'bg',
    },
    well: (
      <>
        <Landing looking={words.looking} prompt={words.prompt} />
        <Card>
          {r.ok ? (
            <Point title={`THE SOURCE ALONE · ${r.source.toFixed(1)} dB`}>{`The total holds the source’s energy and the background’s, so the background comes off as energy: ${r.correction.toFixed(1)} dB off the total here — not ${total - bgL} dB, which is what plain subtraction would wrongly give as the source.`}</Point>
          ) : (
            <Point title="REFUSED">{why}</Point>
          )}
          <Point title={`THE LIMIT · ${limit} dB`}>The method you use sets how far apart the total and the background must be. This lab’s default is 3 dB — a default, never a rule.</Point>
        </Card>
        <Note>{`Seen: a separated source ${seen.ok ? '✓' : '○'} · a refusal ${seen.refused ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function ThreeMeters({ w, h, total, bg, source, limit, label }: { w: number; h: number; total: number; bg: number; source: number | null; limit: number; label: string }) {
  const k = useStageTextScale();
  const T = 22 * k;
  const B = h - 30 * k;
  const lo = 30;
  const hi = 90;
  const yOf = (db: number) => T + ((B - T) * (hi - Math.max(lo, Math.min(hi, db)))) / (hi - lo);
  const cols = [w * 0.22, w * 0.5, w * 0.78];
  const bw = Math.min(56, w * 0.14);
  const stops = useMemo(() => {
    const dbs = [90, 80, 70, 60, 50, 40, 30];
    return { colors: dbs.map((d) => splColorForDba(d)), positions: dbs.map((d) => (hi - d) / (hi - lo)) };
  }, []);
  const bars: { x: number; db: number | null; key: string }[] = [
    { x: cols[0], db: total, key: 'TOTAL' },
    { x: cols[1], db: bg, key: 'BACKGROUND' },
    { x: cols[2], db: source, key: 'SOURCE ALONE' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        {bars.map((b) => (
          <Group key={b.key}>
            <Rect x={b.x - bw / 2} y={T} width={bw} height={B - T} color="#111317" />
            {b.db !== null ? (
              <Rect x={b.x - bw / 2} y={yOf(b.db)} width={bw} height={B - yOf(b.db)}>
                <LinearGradient start={vec(0, T)} end={vec(0, B)} colors={stops.colors} positions={stops.positions} />
              </Rect>
            ) : (
              <Path path={Skia.Path.Make().addRect(Skia.XYWHRect(b.x - bw / 2, T, bw, B - T))} style="stroke" strokeWidth={2} color="#ff6b5e">
                <DashPathEffect intervals={[6, 5]} />
              </Path>
            )}
            <Rect x={b.x - bw / 2} y={T} width={bw} height={B - T} style="stroke" strokeWidth={1} color="#2c2e35" />
          </Group>
        ))}
        {/* the limit: the band the background must sit below the total by */}
        <Rect x={cols[1] - bw / 2 - 6} y={yOf(total)} width={bw + 12} height={Math.max(0, yOf(total - limit) - yOf(total))} color="#ffc64d" opacity={0.18} />
        <Line p1={vec(cols[0] - bw / 2, yOf(total))} p2={vec(cols[1] + bw / 2 + 6, yOf(total))} color="#ffc64d" strokeWidth={1} opacity={0.6}>
          <DashPathEffect intervals={[4, 4]} />
        </Line>
      </Canvas>
      {bars.map((b) => (
        <View key={b.key} style={[styles.barText, { left: b.x - 60 * k, width: 120 * k, top: B + 4 }]} pointerEvents="none">
          <Text style={[styles.barKey, { fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>{b.key}</Text>
        </View>
      ))}
      {bars.map((b) => (
        <View key={`${b.key}:v`} style={[styles.barText, { left: b.x - 60 * k, width: 120 * k, top: (b.db !== null ? yOf(b.db) : T) - 18 * k }]} pointerEvents="none">
          <Text style={[styles.barVal, { fontSize: 11 * k, color: b.db !== null ? '#eef0f4' : '#ff6b5e' }]} {...fitValue(11 * k)}>{b.db !== null ? `${b.db.toFixed(1)} dB` : 'REFUSED'}</Text>
        </View>
      ))}
      <Text style={[styles.axis, { top: 2, left: 6, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>{`dB · AMBER BAND = YOUR METHOD’S LIMIT (${limit} dB)`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', color: colors.textMuted, fontFamily: fonts.barlowMedium },
  tag: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
  barText: { position: 'absolute', alignItems: 'center' },
  barKey: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, letterSpacing: 1 },
  barVal: { fontFamily: fonts.oswaldMedium },
});
