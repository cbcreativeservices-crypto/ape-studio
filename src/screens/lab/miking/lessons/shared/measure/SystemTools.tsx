/**
 * The SYSTEM tools (F14; Lab 6 group 5, branch lab6-g5): three rack steps
 * on the physics of systems.ts and venue.ts.
 *
 *   useTimingStep    the REFERENCE TAP AND THE DELAY: the arrivals at a seat
 *                    on a real time base (ms after the drive), the tap before
 *                    or after the processor (its latency a made-up example),
 *                    the delay you set — and a delay finder that takes the
 *                    strongest arrival, which with a second source left on is
 *                    not the one you are measuring
 *   useWindowStep    THE WINDOW: a time window from the direct sound; the
 *                    reflections it lets in; the frequency step it resolves,
 *                    about 1 / T
 *   useOverlapStep   THE OVERLAP SEAT: the left main and the front fill
 *                    reaching a seat a few milliseconds apart, the fill's
 *                    delay, and the ideal comb their sum would show — aligned
 *                    at one seat, off at the next
 *
 * Arrival times are geometry ÷ the calculator's speed of sound; the arrival
 * HEIGHTS are a made-up example, said on the glass. FULLY SILENT; nothing
 * moves by itself; text ≥ 9 pt and zooms with full screen.
 */
import { ChairsTop, chairRowFacingStage, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Prediction, Vec3 } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { PairComb } from '../speakers/PairComb';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard } from '../../../engine/kit';
import { arrivalMs, delayOn, EXAMPLE_DSP_MS, inWindow, pickArrival, windowResolutionHz, type Arrival, type Tap } from './systems.ts';
import { alignAt, FILL, MAIN_L, overlapAt, seatPoint, VENUE } from './venue.ts';
import { fmtMetres } from '../field/sceneFrame.ts';
import { TestSpeaker } from './MeasureArt';
import { SubCab } from './VenueArt';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff6b5e';
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const fmtMs = (ms: number) => (Number.isFinite(ms) ? `${ms.toFixed(2)} ms` : '—');
const fmtHz = (hz: number) => (!Number.isFinite(hz) ? '—' : hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)} kHz` : `${Math.round(hz)} Hz`);

/* ── the arrivals chart: arrivals on a real time base ── */

type ChartMark = { ms: number; color: string; label: string; dashed?: boolean };

/** Arrivals as spikes on a time axis 0…maxMs (heights: dB above a −30 dB floor). */
function ArrivalChart({ w, h, arrivals, maxMs, colorOf, marks, window, label, note }: { w: number; h: number; arrivals: readonly Arrival[]; maxMs: number; colorOf: (a: Arrival) => string; marks: readonly ChartMark[]; window?: { from: number; ms: number } | null; label: string; note: string }) {
  const k = useStageTextScale();
  const L = 12;
  const R = w - 12;
  const T = 26 * k;
  const B = h - 22 * k;
  const xOf = (ms: number) => L + ((R - L) * Math.max(0, Math.min(maxMs, ms))) / maxMs;
  const yOf = (db: number) => B - ((B - T) * (Math.max(-30, Math.min(0, db)) + 30)) / 30;
  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    const step = maxMs > 30 ? 10 : 5;
    for (let ms = 0; ms <= maxMs + 1e-9; ms += step) {
      p.moveTo(xOf(ms), T);
      p.lineTo(xOf(ms), B);
    }
    for (const db of [0, -10, -20]) {
      p.moveTo(L, yOf(db));
      p.lineTo(R, yOf(db));
    }
    return p;
  }, [w, h, k, maxMs]); // eslint-disable-line react-hooks/exhaustive-deps
  const ticks: number[] = [];
  for (let ms = 0; ms < maxMs - 1e-9; ms += maxMs > 30 ? 10 : 5) ticks.push(ms);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={grid} style="stroke" strokeWidth={1} color="#26282e" />
        {window ? <Rect x={xOf(window.from)} y={T} width={Math.max(1, xOf(window.from + window.ms) - xOf(window.from))} height={B - T} color={BLUE} opacity={0.1} /> : null}
        {window ? <Line p1={vec(xOf(window.from + window.ms), T)} p2={vec(xOf(window.from + window.ms), B)} color={BLUE} strokeWidth={1.6} opacity={0.85} /> : null}
        <Line p1={vec(L, B)} p2={vec(R, B)} color="#4a4c58" strokeWidth={1.2} />
        {arrivals.map((a) => (
          <Group key={a.id}>
            <Line p1={vec(xOf(a.ms), B)} p2={vec(xOf(a.ms), yOf(a.db))} color={colorOf(a)} strokeWidth={a.direct ? 3 : 2}>
              {a.direct ? null : <DashPathEffect intervals={[4, 3]} />}
            </Line>
            <Circle cx={xOf(a.ms)} cy={yOf(a.db)} r={a.direct ? 3.5 : 2.5} color={colorOf(a)} />
          </Group>
        ))}
        {marks.map((m) => (
          <Line key={m.label} p1={vec(xOf(m.ms), T - 4)} p2={vec(xOf(m.ms), B + 4)} color={m.color} strokeWidth={2}>
            {m.dashed ? <DashPathEffect intervals={[6, 4]} /> : null}
          </Line>
        ))}
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: L, right: L, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        {note}
      </Text>
      {arrivals.map((a, i) => (
        <Text key={a.id} style={[styles.tag, { top: T + 2 + i * 14 * k, left: Math.min(R - 90 * k, xOf(a.ms) + 3), fontSize: 9 * k, color: colorOf(a) }]} {...fitValue(9 * k)}>
          {a.label}
        </Text>
      ))}
      {ticks.map((ms) => (
        <Text key={ms} style={[styles.axis, { top: B + 3, left: xOf(ms) - 14 * k, width: 28 * k, textAlign: 'center', fontSize: 9 * k }]} {...fitValue(9 * k)}>
          {`${ms}`}
        </Text>
      ))}
      <Text style={[styles.axis, { top: B + 3, right: 4, fontSize: 9 * k }]} {...fitValue(9 * k)}>
        MS
      </Text>
    </View>
  );
}

/* ── 1 · the reference tap and the delay ── */

export type TimingWords = { title: string; badge: string; looking: string; prompt: string };
type TimingCase = 'alone' | 'both';

/** The arrivals at the overlap seat (venue.ts), ms after the drive at the tap. */
export function timingArrivals(c: TimingCase, tap: Tap): Arrival[] {
  const seat = seatPoint(VENUE.rows[1], -900);
  const lat = tap === 'pre' ? EXAMPLE_DSP_MS : 0;
  const fillMm = dist(FILL, seat);
  // The floor bounce off the audience floor: the fill's image below the floor.
  const fillFloor = dist({ ...FILL, y: -FILL.y }, seat);
  const mainMm = dist(MAIN_L, seat);
  const out: Arrival[] = [
    { id: 'fill', label: 'THE FILL · DIRECT', ms: arrivalMs(fillMm) + lat, db: c === 'both' ? -6 : 0, direct: true },
    { id: 'fillFloor', label: 'FLOOR', ms: arrivalMs(fillFloor) + lat, db: c === 'both' ? -12 : -6, direct: false },
  ];
  if (c === 'both') out.push({ id: 'main', label: 'THE MAIN, LEFT ON', ms: arrivalMs(mainMm) + lat, db: 0, direct: false });
  return out;
}

export function useTimingStep({ words, prediction, onDone }: { words: TimingWords; prediction?: Prediction; onDone: () => void }): MikingStep {
  const [tap, setTap] = useState<Tap>('pre');
  const [c, setC] = useState<TimingCase>('alone');
  const [delay, setDelay] = useState(0);
  const [predicted, setPredicted] = useState<string | null>(null);
  const arr = useMemo(() => timingArrivals(c, tap), [c, tap]);
  const pick = pickArrival(arr);
  const on = arr.find((a) => delayOn(delay, a)) ?? null;
  const right = on?.id === pick.first.id;
  const [caught, setCaught] = useState(false);
  useEffect(() => {
    if (c === 'both' && right) setCaught(true);
  }, [c, right]);
  useEffect(() => {
    if (caught) onDone();
  }, [caught, onDone]);
  const MAX = 30;
  const params: DockParam[] = [
    { kind: 'options', id: 'case', label: 'SOURCES', valueLabel: c === 'alone' ? 'FILL ALONE' : 'MAIN LEFT ON', selectedId: c, onSelect: (id) => setC(id as TimingCase), sticky: true, options: [
      { id: 'alone', label: 'The front fill alone, the mains muted', blurb: 'Only the source you are measuring plays.' },
      { id: 'both', label: 'The front fill, with the left main left on', blurb: 'A second, louder source arrives a few milliseconds later.' },
    ] },
    { kind: 'options', id: 'tap', label: 'TAP', valueLabel: tap === 'pre' ? 'PRE-DSP' : 'POST-DSP', selectedId: tap, onSelect: (id) => setTap(id as Tap), options: [
      { id: 'pre', label: 'Before the processor', blurb: `The processor’s latency is in the measured path: every arrival is ${EXAMPLE_DSP_MS.toFixed(1)} ms later (a made-up latency).` },
      { id: 'post', label: 'After the processor', blurb: 'The processor is left out: the arrivals are the acoustic paths alone.' },
    ] },
    { kind: 'fader', id: 'delay', label: 'DELAY', value: delay / MAX, onChange: (v) => setDelay(Math.round(v * MAX * 20) / 20), format: () => `measurement delay ${fmtMs(delay)}`, formatShort: () => `${delay.toFixed(1)} ms` },
    { kind: 'action', id: 'finder', label: 'FINDER', onPress: () => setDelay(Math.round(pick.finder.ms * 20) / 20) },
  ];
  const tint = on ? (right ? GREEN : RED) : AMBER;
  const bezel: BezelItem[] = [
    { k: 'DELAY SET', v: delay.toFixed(2), sub: 'ms', tint, flex: 1 },
    { k: 'FIRST ARRIVAL', v: pick.first.ms.toFixed(2), sub: 'ms · the fill', flex: 1.1 },
    { k: 'STRONGEST', v: pick.finder.ms.toFixed(2), sub: pick.finder.id === 'main' ? 'ms · the main' : 'ms · the fill', tint: pick.trap ? RED : undefined, flex: 1.1 },
  ];
  const colorOf = (a: Arrival) => (a.id === 'main' ? AMBER : BLUE);
  const a11y = `Arrivals at a front-row seat near the aisle, ${tap === 'pre' ? 'the reference tapped before the processor' : 'the reference tapped after the processor'}. ${arr.map((a) => `${a.label.toLowerCase()} at ${a.ms.toFixed(2)} milliseconds`).join('; ')}. The delay is set to ${delay.toFixed(2)} milliseconds${on ? `, on ${on.label.toLowerCase()}` : ''}.`;
  const verdict = !on
    ? 'Set the DELAY on an arrival — or press FINDER and judge what it chose.'
    : right
      ? `On the first arrival of the source you are measuring: the front fill${tap === 'pre' ? ', with the processor’s latency inside' : ''}.`
      : `On ${on.label.toLowerCase()} — ${on.id === 'main' ? 'the strongest arrival, but another source: the finder chose it because it is louder' : 'a reflection, not the direct sound'}. Look for the fill’s own first arrival.`;
  return {
    key: 'timing',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ArrivalChart w={w} h={h} arrivals={arr} maxMs={MAX} colorOf={colorOf} marks={[{ ms: delay, color: tint, label: 'delay' }]} label={a11y} note={`${tap === 'pre' ? 'TAP BEFORE THE PROCESSOR' : 'TAP AFTER THE PROCESSOR'} · MADE-UP HEIGHTS`} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'delay',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${words.looking} · ${c === 'alone' ? 'the fill alone' : 'the left main left on'}`} prompt={words.prompt} />
        <Card>
          <Point title={on ? (right ? 'ON THE RIGHT ARRIVAL' : 'ON THE WRONG ARRIVAL') : 'THE DELAY'}>{verdict}</Point>
          <Point title="WHERE THE REFERENCE IS TAKEN">{`Before the processor, its latency is part of the path and of the delay (here ${(arrivalMs(dist(FILL, seatPoint(VENUE.rows[1], -900))) + EXAMPLE_DSP_MS).toFixed(2)} ms to the fill’s arrival); after it, only the acoustic path (${arrivalMs(dist(FILL, seatPoint(VENUE.rows[1], -900))).toFixed(2)} ms). Neither is wrong: they answer different questions — name the tap.`}</Point>
        </Card>
        {pick.trap ? <Note tone="warn">A delay finder takes the strongest arrival. With the left main still on, that is the main, not the fill you are measuring: mute what you are not measuring, and check the arrivals by eye.</Note> : <Note>Re-check the delay every time the mic moves or a path changes.</Note>}
      </>
    ),
  };
}

/* ── 2 · the window and the resolution ── */

export type WindowWords = { title: string; badge: string; looking: string; prompt: string };

/** The bench's arrivals at the axis mic (2 m out, both 1.2 m above the floor): the direct sound, then the floor, the ceiling and a side wall — mirror images; the room is a drawing default. */
export function benchArrivals(): Arrival[] {
  const S: Vec3 = { x: 0, y: -1200, z: 0 };
  const M: Vec3 = { x: 2000, y: -1200, z: 0 };
  const CEIL = -3000;
  const WALL_Z = 2500;
  const rows: [string, string, Vec3, number][] = [
    ['direct', 'DIRECT', S, 0],
    ['floor', 'FLOOR', { ...S, y: -S.y }, -5],
    ['ceiling', 'CEILING', { ...S, y: 2 * CEIL - S.y }, -8],
    ['wall', 'SIDE WALL', { ...S, z: 2 * WALL_Z }, -9],
  ];
  return rows.map(([id, label, p, db]) => ({ id, label, ms: arrivalMs(dist(p, M)), db, direct: id === 'direct' }));
}

const WIN_STEPS = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120, 200] as const;

export function useWindowStep({ words, onDone }: { words: WindowWords; onDone: () => void }): MikingStep {
  const arr = useMemo(benchArrivals, []);
  const direct = arr[0];
  const [i, setI] = useState(2);
  const T = WIN_STEPS[i];
  const res = windowResolutionHz(T);
  const inside = inWindow(arr, direct.ms, T);
  const [seen, setSeen] = useState({ short: inside.length === 1, long: inside.length > 2 });
  useEffect(() => {
    setSeen((s) => ({ short: s.short || inside.length === 1, long: s.long || inside.length === arr.length }));
  }, [inside.length, arr.length]);
  useEffect(() => {
    if (seen.short && seen.long) onDone();
  }, [seen.short, seen.long, onDone]);
  const params: DockParam[] = [
    { kind: 'fader', id: 'window', label: 'WINDOW', value: i / (WIN_STEPS.length - 1), onChange: (v) => setI(Math.round(v * (WIN_STEPS.length - 1))), format: () => `a ${T} ms window from the direct sound`, formatShort: () => `${T} ms` },
  ];
  const bezel: BezelItem[] = [
    { k: 'WINDOW', v: `${T}`, sub: 'ms', flex: 0.8 },
    { k: 'RESOLVES ABOUT', v: fmtHz(res), sub: 'steps · 1 ÷ T', tint: AMBER, flex: 1.2 },
    { k: 'INSIDE', v: `${inside.length} of ${arr.length}`, sub: inside.length === 1 ? 'direct only' : 'with reflections', flex: 1 },
  ];
  const maxMs = T + direct.ms > 30 ? 60 : 30;
  const a11y = `The arrivals at a mic 2 metres out on the loudspeaker’s axis: the direct sound at ${direct.ms.toFixed(2)} milliseconds, then the floor, the ceiling and a side wall. A ${T} millisecond window from the direct sound lets in ${inside.length} of ${arr.length} arrivals and resolves frequency steps of about ${fmtHz(res)}.`;
  const colorOf = (a: Arrival) => (a.direct ? AMBER : inside.includes(a) ? BLUE : '#7b7f8a');
  return {
    key: 'window',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ArrivalChart w={w} h={h} arrivals={arr} maxMs={maxMs} colorOf={colorOf} marks={[]} window={{ from: direct.ms, ms: T }} label={a11y} note="MIC 2 M OUT ON THE AXIS · MADE-UP HEIGHTS" />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'window',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${T} ms`} prompt={words.prompt} />
        <Card>
          <Point title={inside.length === 1 ? 'THE DIRECT SOUND ONLY' : 'THE ROOM COMES IN'}>
            {inside.length === 1
              ? `A ${T} ms window keeps the floor’s bounce out (it arrives ${(arr[1].ms - direct.ms).toFixed(2)} ms after the direct sound) — but it resolves frequency only in steps of about ${fmtHz(res)}: nothing below that is described.`
              : `A ${T} ms window resolves steps of about ${fmtHz(res)} — and lets in ${inside.length - 1} reflection${inside.length > 2 ? 's' : ''}. More of the lows, more of the room.`}
          </Point>
          <Point title="STATE IT">Write down the window and the frequency range it supports. A short window is a direct-sound estimate above about 1 ÷ T; a long one is the loudspeaker in this room.</Point>
        </Card>
        <Note>{`Looked at: a window with the direct sound alone ${seen.short ? '✓' : '○'} · a window with every reflection ${seen.long ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

/* ── 3 · the overlap seat: the main and the fill ── */

export type OverlapWords = { title: string; badge: string; looking: string; prompt: string };
const OVERLAP_SEATS = [
  { id: 'r1', label: 'Row 1, by the aisle', p: seatPoint(VENUE.rows[0], -900) },
  { id: 'r2', label: 'Row 2, by the aisle', p: seatPoint(VENUE.rows[1], -900) },
  { id: 'r3', label: 'Row 3, mid-side', p: seatPoint(VENUE.rows[2], -2700) },
] as const;
type SeatId = (typeof OVERLAP_SEATS)[number]['id'];
type Play = 'main' | 'fill' | 'both';

export function useOverlapStep({ words, prediction, onDone }: { words: OverlapWords; prediction?: Prediction; onDone: () => void }): MikingStep {
  const [seatId, setSeatId] = useState<SeatId>('r2');
  const [delay, setDelay] = useState(0);
  const [play, setPlay] = useState<Play>('both');
  const [predicted, setPredicted] = useState<string | null>(null);
  const seat = OVERLAP_SEATS.find((s) => s.id === seatId)!;
  const o = overlapAt(seat.p, delay);
  const aligned = Math.abs(o.dtMs) < 0.1;
  const [alignedAt, setAlignedAt] = useState<SeatId | null>(null);
  const [movedOn, setMovedOn] = useState(false);
  useEffect(() => {
    if (aligned && play === 'both') setAlignedAt((a) => a ?? seatId);
  }, [aligned, play, seatId]);
  useEffect(() => {
    if (alignedAt && seatId !== alignedAt) setMovedOn(true);
  }, [alignedAt, seatId]);
  useEffect(() => {
    if (movedOn) onDone();
  }, [movedOn, onDone]);
  const MAX = 15;
  const params: DockParam[] = [
    { kind: 'options', id: 'seat', label: 'SEAT', valueLabel: seatId.toUpperCase(), selectedId: seatId, onSelect: (id) => setSeatId(id as SeatId), sticky: true, options: OVERLAP_SEATS.map((s) => ({ id: s.id, label: s.label, blurb: `${fmtMetres(dist(MAIN_L, s.p))} from the left main, ${fmtMetres(dist(FILL, s.p))} from the fill.` })) },
    { kind: 'options', id: 'play', label: 'PLAYING', valueLabel: play === 'both' ? 'BOTH' : play === 'main' ? 'MAIN' : 'FILL', selectedId: play, onSelect: (id) => setPlay(id as Play), options: [
      { id: 'main', label: 'The left main alone', blurb: 'Measure each subsystem alone first.' },
      { id: 'fill', label: 'The front fill alone', blurb: 'Then the other, alone, at the same seat.' },
      { id: 'both', label: 'Both together', blurb: 'Then together — and nothing changed silently.' },
    ] },
    { kind: 'fader', id: 'delay', label: 'FILL DELAY', value: delay / MAX, home: 0, onChange: (v) => setDelay(Math.round(v * MAX * 20) / 20), format: () => `the fill delayed ${fmtMs(delay)}`, formatShort: () => `${delay.toFixed(1)} ms` },
    { kind: 'action', id: 'align', label: 'ALIGN HERE', onPress: () => setDelay(Math.max(0, Math.round(alignAt(seat.p) * 100) / 100)) },
  ];
  const bezel: BezelItem[] = [
    { k: 'MAIN', v: fmtMs(arrivalMs(o.mainMm)), sub: fmtMetres(o.mainMm), flex: 1 },
    { k: 'FILL', v: fmtMs(arrivalMs(o.fillMm) + delay), sub: delay ? `+${delay.toFixed(2)} ms` : fmtMetres(o.fillMm), flex: 1 },
    { k: 'APART', v: play === 'both' ? fmtMs(Math.abs(o.dtMs)) : '—', tint: play !== 'both' ? undefined : aligned ? GREEN : AMBER, flex: 1 },
    { k: 'FIRST DIP', v: play === 'both' && o.firstNotchHz ? fmtHz(o.firstNotchHz) : '—', flex: 1 },
  ];
  const a11y = `${seat.label}: the left main ${fmtMetres(o.mainMm)} away and the front fill ${fmtMetres(o.fillMm)} away, the fill delayed ${delay.toFixed(2)} milliseconds. ${play === 'both' ? `Their arrivals are ${Math.abs(o.dtMs).toFixed(2)} milliseconds apart${o.firstNotchHz ? `; the ideal sum has its first dip near ${fmtHz(o.firstNotchHz)}` : ''}.` : `Only the ${play === 'main' ? 'left main' : 'front fill'} plays.`}`;
  return {
    key: 'overlap',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <OverlapScene w={w} h={h} seat={seat.p} play={play} o={o} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'delay',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${words.looking} · ${seat.label.toLowerCase()}`} prompt={words.prompt} />
        <Card>
          <Point title={play !== 'both' ? 'ONE SOURCE AT A TIME' : aligned ? 'LINED UP AT THIS SEAT' : 'TWO ARRIVALS'}>
            {play !== 'both'
              ? 'Each subsystem alone first, at this seat, its trace stored on its own. Then both together.'
              : aligned
                ? `The fill’s delay lines its arrival up with the main’s here. Now move to another SEAT: the paths change, and so does the gap.${alignedAt && alignedAt !== seatId ? ` Here the two are ${fmtMs(Math.abs(o.dtMs))} apart again.` : ''}`
                : `${fmtMs(Math.abs(o.dtMs))} apart: summed, the two dip first near ${o.firstNotchHz ? fmtHz(o.firstNotchHz) : '—'} and at the odd multiples above it, wherever their levels are close.`}
          </Point>
          <Point title="ONE SEAT IS NOT THE ROOM">An alignment chosen at one mic can change at another seat. Record the arrivals and the phase before and after, compare another seat before you settle, and never change a gain or a delay silently.</Point>
        </Card>
        <Note>The dips assume equal levels from one point each in a free field: a simplified picture of where the sum cancels, never what the seat sounds like.</Note>
      </>
    ),
  };
}

function OverlapScene({ w, h, seat, play, o, label }: { w: number; h: number; seat: Vec3; play: Play; o: ReturnType<typeof overlapAt>; label: string }) {
  const k = useStageTextScale();
  const planH = Math.round(h * 0.56);
  const combH = h - planH;
  const box = { u0: -1400, u1: 5200, v0: -4900, v1: 900 };
  const xf = useMemo(() => fitXform('top', box, w, planH, 6), [w, planH]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = 1 / xf.s;
  // The audience as its empty chairs from above, facing the stage (round 2,
  // 2026-10-10 — they were purple squares; the house audienceChairs).
  const chairs = useMemo(() => {
    const at: { x: number; y: number; rotation: number }[] = [];
    for (const x of VENUE.rows.slice(0, 3)) for (const z of VENUE.seatsZ) if (z < 900) at.push({ x, y: z, rotation: chairRowFacingStage(x, z, z)[0].rotation });
    return makeChairsTop(at);
  }, []);
  const deck = useMemo(() => Skia.Path.Make().addRect(Skia.XYWHRect(box.u0, box.v0, -box.u0, box.v1 - box.v0)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const main = play !== 'fill';
  const fill = play !== 'main';
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ width: w, height: planH }}>
        <Canvas style={{ width: w, height: planH }} accessible accessibilityRole="image" accessibilityLabel={label}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Path path={deck} color="#3b3027" />
            <ChairsTop seats={chairs.seats} backs={chairs.backs} color="#6e5a78" strokeWidth={1.4 * px} />
            <SubCab view="top" />
            <TestSpeaker g={{ front: VENUE.main.x, depth: VENUE.main.depth, top: 0, bottom: 1, half: VENUE.main.half, woofer: { y: 0, r: 190 }, tweeter: { y: 0, r: 55 }, floorY: 0, z: -VENUE.main.z }} view="top" />
            <TestSpeaker g={{ front: VENUE.fill.x, depth: VENUE.fill.depth, top: 0, bottom: 1, half: VENUE.fill.half, woofer: { y: 0, r: 72 }, tweeter: { y: 0, r: 18 }, floorY: 0, stand: false }} view="top" />
            {main ? <Line p1={vec(MAIN_L.x, MAIN_L.z)} p2={vec(seat.x, seat.z)} color={AMBER} strokeWidth={2.2 * px} /> : null}
            {fill ? (
              <Line p1={vec(FILL.x, FILL.z)} p2={vec(seat.x, seat.z)} color={BLUE} strokeWidth={2.2 * px}>
                <DashPathEffect intervals={[8 * px, 5 * px]} />
              </Line>
            ) : null}
            <Circle cx={seat.x} cy={seat.z} r={6 * px} color={GREEN} />
            <Circle cx={seat.x} cy={seat.z} r={10 * px} style="stroke" strokeWidth={1.5 * px} color={GREEN} opacity={0.7} />
          </Group>
        </Canvas>
        <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
          AMBER = LEFT MAIN · BLUE DASHES = FRONT FILL
        </Text>
      </View>
      {play === 'both' ? (
        <PairComb w={w} h={combH - 18 * k} dtMs={o.dtMs} gA={1} gB={1} sEff={1} label={`The ideal sum of the two arrivals, ${Math.abs(o.dtMs).toFixed(2)} milliseconds apart, equal levels.`} />
      ) : (
        <View style={[styles.alone, { height: combH }]}>
          <Text style={[styles.aloneText, { fontSize: 11 * k }]} {...fitValue(11 * k)}>
            {play === 'main' ? 'THE LEFT MAIN ALONE · ITS OWN TRACE' : 'THE FRONT FILL ALONE · ITS OWN TRACE'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { position: 'absolute', color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  tag: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.5 },
  axis: { position: 'absolute', color: colors.textMuted, fontFamily: fonts.barlowSemiBold },
  alone: { justifyContent: 'center', alignItems: 'center' },
  aloneText: { color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 1 },
});

