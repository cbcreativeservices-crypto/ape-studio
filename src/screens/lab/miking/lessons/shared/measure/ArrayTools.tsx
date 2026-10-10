/**
 * The ARRAY AND SENSOR tools (F16; Lab 6 group 5, branch lab6-g5): four rack
 * steps on the physics of arrays.ts, and the air/water units card.
 *
 *   useBaselineStep   two omni elements on a straight baseline and a source
 *                     at the centre point, at the side point, or at the side
 *                     point's MIRROR behind the array: each arrival (ms) and
 *                     the difference R − L through the ensemble family's
 *                     dtLR — the mirror gives the same difference (the front/
 *                     back ambiguity); a third element off the line breaks it
 *   useLineArrayStep  a uniform line of elements: the spacing against half a
 *                     wavelength at the top frequency — f_max = c / (2d)
 *   useProbeStep      a p–p intensity probe on the outward normal of an
 *                     enclosing surface round a small device: the reading
 *                     along its axis follows cos θ; the pressure does not care
 *   useKitStep        the specialist kit, drawn as objects: an acoustic
 *                     camera (its hot spot an estimate), an ultrasonic
 *                     detector (the sample rate against the band), a
 *                     hydrophone on its mooring (the water's reference
 *                     pressure — and why it cannot be compared with air's by
 *                     subtracting)
 *   UnitsCard         the air/water card: 20 µPa against 1 µPa
 *
 * Speeds of sound are the calculator's. FULLY SILENT; nothing moves by
 * itself; text ≥ 9 pt and zooms with full screen.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Vec3 } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { deltaTms } from '../../../engine/physics/twoMic.ts';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { MeasurementMic } from '../../../../../../features/lab/micDrawings';
import { CAPSULE, MEAS_DIMS } from './measureSpec.ts';
import { axialShare, baselineDt, baselinePair, firstHeard, lambdaHalf, mirrorOf, nyquistOk, spacingFor, SPACERS_MM, WATER_AIR } from './arrays.ts';
import { AcousticCamera, Hydrophone, IntensityProbe, UltrasonicDetector } from './SensorArt';
import { make, rectP, TestSpeaker } from './MeasureArt';
import { fmtMetres } from '../field/sceneFrame.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff6b5e';
const TAPE = '#e8c547';
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const fmtHz = (hz: number) => (!Number.isFinite(hz) ? '—' : hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)} kHz` : `${Math.round(hz)} Hz`);

/** A measurement mic drawn in plan, its front at (x, z), aimed along +x (its body behind it). */
function PlanMic({ p, tint }: { p: Vec3; tint: string }) {
  return (
    <Group transform={[{ translateX: p.x }, { translateY: p.z }, { rotate: Math.PI / 2 }]}>
      <MeasurementMic r={CAPSULE.half.mm / 2} len={MEAS_DIMS.bodyHalf.mm} tint={tint} />
    </Group>
  );
}

/* ── 1 · the baseline ── */

export type BaselineWords = { title: string; badge: string; looking: string; prompt: string };
type SrcId = 'centre' | 'side' | 'mirror';

export function useBaselineStep({ words, baseline, centre, side, third }: { words: BaselineWords; baseline: number; centre: Vec3; side: Vec3; third: Vec3 }): MikingStep {
  const caps = useMemo(() => baselinePair(baseline), [baseline]);
  const SRC: Record<SrcId, { label: string; p: Vec3 }> = { centre: { label: 'the centre point', p: centre }, side: { label: 'the side point', p: side }, mirror: { label: 'the side point’s mirror, behind', p: mirrorOf(side) } };
  const [src, setSrc] = useState<SrcId>('centre');
  const [withThird, setWithThird] = useState(false);
  const S = SRC[src].p;
  const L = caps[0].p;
  const R = caps[1].p;
  const tL = deltaTms(dist(S, L));
  const tR = deltaTms(dist(S, R));
  const tB = deltaTms(dist(S, third));
  const dt = baselineDt(caps, S);
  const first = firstHeard(caps, S);
  const params: DockParam[] = [
    { kind: 'options', id: 'src', label: 'SOURCE', valueLabel: src === 'centre' ? 'CENTRE' : src === 'side' ? 'SIDE' : 'MIRROR', selectedId: src, onSelect: (id) => setSrc(id as SrcId), sticky: true, options: [
      { id: 'centre', label: 'At the centre point', blurb: `${fmtMetres(dist(centre, { x: 0, y: 0, z: 0 }))} straight in front of the origin.` },
      { id: 'side', label: 'At the side point', blurb: 'The same source moved 1 m to the right.' },
      { id: 'mirror', label: 'At the side point’s mirror, behind', blurb: 'Where the side point would be if it were behind the array instead of in front.' },
    ] },
    { kind: 'toggle', id: 'third', label: 'THIRD', value: withThird, onToggle: () => setWithThird((v) => !v) },
  ];
  const order = withThird ? [['L', tL], ['R', tR], ['B', tB]].sort((a, b) => (a[1] as number) - (b[1] as number)).map((x) => x[0]).join(' → ') : '';
  const bezel: BezelItem[] = [
    { k: 'L', v: tL.toFixed(2), sub: 'ms', flex: 0.8 },
    { k: 'R', v: tR.toFixed(2), sub: 'ms', flex: 0.8 },
    { k: 'R − L', v: `${dt >= 0 ? '+' : '−'}${Math.abs(dt).toFixed(3)}`, sub: 'ms', tint: AMBER, flex: 1 },
    withThird ? { k: 'ORDER', v: order, tint: GREEN, flex: 1.3 } : { k: 'FIRST', v: first === 'both' ? 'TOGETHER' : first, flex: 1 },
  ];
  const a11y = `From above: two omni elements ${fmtMetres(baseline)} apart on the baseline axis${withThird ? ', a third behind the origin' : ''}, and the source at ${SRC[src].label}. It reaches L after ${tL.toFixed(2)} milliseconds and R after ${tR.toFixed(2)}: R minus L is ${dt.toFixed(3)} milliseconds.${withThird ? ` The order: ${order}.` : ''}`;
  const sideDt = baselineDt(caps, side);
  return {
    key: 'baseline',
    title: words.title,
    kind: 'LEARN',
    layout: 'rack',
    rack: {
      render: (w, h) => <BaselinePlan w={w} h={h} L={L} R={R} S={S} third={withThird ? third : null} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'src',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${SRC[src].label}`} prompt={words.prompt} />
        <Card>
          <Point title={src === 'centre' ? 'TOGETHER' : src === 'side' ? 'R FIRST' : 'THE SAME AS THE SIDE POINT'}>
            {src === 'centre'
              ? 'Straight in front, the two paths are the same length: both elements hear the click together.'
              : src === 'side'
                ? `Nearer the right element: R hears it ${Math.abs(dt).toFixed(3)} ms before L. The order says which side — not yet the angle or the range.`
                : `Behind the array, the pair hears exactly what it heard from the side point in front (${sideDt.toFixed(3)} ms): a straight baseline cannot tell front from back.`}
          </Point>
          <Point title="ONE CLOCK">Both elements on one synchronized recorder. Two recorders started by hand drift and start apart — the time between their tracks is not the sound’s.</Point>
        </Card>
        {withThird ? <Note tone="ok">{`A third element off the line breaks the mirror: here the order is ${order}. A source in front reaches it last; one behind reaches it first.`}</Note> : <Note>Turn on THIRD to add an element behind the origin, off the line.</Note>}
      </>
    ),
  };
}

function BaselinePlan({ w, h, L, R, S, third, label }: { w: number; h: number; L: Vec3; R: Vec3; S: Vec3; third: Vec3 | null; label: string }) {
  const k = useStageTextScale();
  const box = { u0: -2400, u1: 2500, v0: -1400, v1: 1500 };
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = 1 / xf.s;
  const tape = useMemo(() => {
    const p = make();
    rectP(p, -12, -1300, 12, 1300, 3);
    rectP(p, -2300, -12, 2300, 12, 3);
    return p;
  }, []);
  const ang = Math.atan2(-S.z, -S.x);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Rect x={box.u0} y={box.v0} width={box.u1 - box.u0} height={box.v1 - box.v0} color="#1d1e22" />
          <Path path={tape} color={TAPE} opacity={0.55} />
          <Circle cx={0} cy={0} r={80} style="stroke" strokeWidth={14} color={TAPE} />
          <Line p1={vec(S.x, S.z)} p2={vec(L.x, L.z)} color={BLUE} strokeWidth={2 * px} />
          <Line p1={vec(S.x, S.z)} p2={vec(R.x, R.z)} color={AMBER} strokeWidth={2 * px} />
          {third ? (
            <Line p1={vec(S.x, S.z)} p2={vec(third.x, third.z)} color={GREEN} strokeWidth={1.6 * px}>
              <DashPathEffect intervals={[8 * px, 5 * px]} />
            </Line>
          ) : null}
          <Group transform={[{ translateX: S.x }, { translateY: S.z }, { rotate: ang }]}>
            <TestSpeaker g={{ front: 0, depth: 200, top: 0, bottom: 1, half: 100, woofer: { y: 0, r: 60 }, tweeter: { y: 0, r: 15 }, floorY: 1, stand: false, facing: 1 }} view="top" />
          </Group>
          <PlanMic p={L} tint={BLUE} />
          <PlanMic p={R} tint={AMBER} />
          {third ? <PlanMic p={third} tint={GREEN} /> : null}
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        BLUE = TO L · AMBER = TO R · TAPE = AXES
      </Text>
      {[
        ['L', L, BLUE],
        ['R', R, AMBER],
        ...(third ? [['B', third, GREEN] as const] : []),
      ].map(([t, p, c]) => (
        <Text key={t as string} style={[styles.tag, { left: xf.ox + (p as Vec3).x * xf.s - 26 * k, top: xf.oy + (p as Vec3).z * xf.s - 18 * k, fontSize: 11 * k, color: c as string }]} {...fitValue(11 * k)}>
          {t as string}
        </Text>
      ))}
    </View>
  );
}

/* ── 2 · the line array and λ/2 ── */

export type LineArrayWords = { title: string; badge: string; looking: string; prompt: string };
const TOPS = [2000, 5000, 10000] as const;

export function useLineArrayStep({ words, onDone }: { words: LineArrayWords; onDone: () => void }): MikingStep {
  const [top, setTop] = useState<number>(5000);
  const [d, setD] = useState(60);
  const fmax = lambdaHalf(d);
  const ok = fmax >= top;
  const [seen, setSeen] = useState({ ok: false, bad: false });
  useEffect(() => {
    setSeen((s) => (ok ? (s.ok ? s : { ...s, ok: true }) : s.bad ? s : { ...s, bad: true }));
  }, [ok]);
  useEffect(() => {
    if (seen.ok && seen.bad) onDone();
  }, [seen.ok, seen.bad, onDone]);
  const params: DockParam[] = [
    { kind: 'options', id: 'top', label: 'TOP', valueLabel: fmtHz(top), selectedId: String(top), onSelect: (id) => setTop(Number(id)), options: TOPS.map((f) => ({ id: String(f), label: `Up to ${fmtHz(f)}`, blurb: `Half a wavelength at ${fmtHz(f)}: about ${Math.round(spacingFor(f))} mm.` })) },
    { kind: 'fader', id: 'spacing', label: 'SPACING', value: (d - 10) / 290, onChange: (v) => setD(Math.round((10 + v * 290) / 5) * 5), format: () => `${d} mm between neighbouring elements`, formatShort: () => `${d} mm` },
  ];
  const bezel: BezelItem[] = [
    { k: 'SPACING', v: `${d}`, sub: 'mm', flex: 0.8 },
    { k: 'HALF λ AT TOP', v: `${Math.round(spacingFor(top))}`, sub: 'mm', flex: 1 },
    { k: 'NO ALIASING TO', v: fmtHz(fmax), sub: 'c ÷ 2d', tint: ok ? GREEN : RED, flex: 1.1 },
  ];
  const a11y = `A uniform line of eight measurement mics, ${d} millimetres apart. Half a wavelength at ${fmtHz(top)} is about ${Math.round(spacingFor(top))} millimetres: the line keeps clear of spatial aliasing up to ${fmtHz(fmax)}${ok ? ', above the top frequency' : ', below the top frequency'}.`;
  return {
    key: 'lineArray',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <LineArrayView w={w} h={h} d={d} half={spacingFor(top)} ok={ok} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'spacing',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${d} mm`} prompt={words.prompt} />
        <Card>
          <Point title={ok ? 'BELOW HALF A WAVELENGTH' : 'WIDER THAN HALF A WAVELENGTH'}>
            {ok
              ? `At ${d} mm the line keeps clear of ambiguous lobes up to about ${fmtHz(fmax)} — above your top frequency of ${fmtHz(top)}.`
              : `At ${d} mm ambiguous lobes appear above about ${fmtHz(fmax)} — below your top frequency of ${fmtHz(top)}: a direction there could be read in more than one place.`}
          </Point>
          <Point title="A DESIGN PRINCIPLE, NOT ONE SPACING">For a simple uniform line, spacing at or below half a wavelength of the highest frequency of interest; a wider aperture sharpens the angle at a given wavelength. Practical arrays use irregular spacing and processing with limits of their own — their maker states the usable band.</Point>
        </Card>
        <Note>{`Looked at: a spacing that keeps clear ${seen.ok ? '✓' : '○'} · one that aliases below the top ${seen.bad ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function LineArrayView({ w, h, d, half, ok, label }: { w: number; h: number; d: number; half: number; ok: boolean; label: string }) {
  const k = useStageTextScale();
  const n = 8;
  const span = d * (n - 1);
  const box = { u0: -Math.max(span, 7 * half) / 2 - 80, u1: Math.max(span, 7 * half) / 2 + 80, v0: -260, v1: 160 };
  const xf = useMemo(() => fitXform('top', box, w, h - 26 * k, 10), [w, h, k, box.u0]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = 1 / xf.s;
  const xs = Array.from({ length: n }, (_, i) => -span / 2 + i * d);
  const bar = useMemo(() => rectP(make(), -span / 2 - 30, -8, span / 2 + 30, 8, 4), [span]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy + 26 * k }, { scale: xf.s }]}>
          <Path path={bar}>
            <LinearGradient start={vec(0, -8)} end={vec(0, 8)} colors={['#9da2ac', '#3b3e45']} />
          </Path>
          {xs.map((x) => (
            <Group key={x} transform={[{ translateX: x }, { translateY: -128 }]}>
              <MeasurementMic r={Math.min(CAPSULE.half.mm / 2, d * 0.3)} len={120} tint={ok ? GREEN : RED} />
            </Group>
          ))}
          {/* the half-wavelength ruler at the top frequency, under the bar */}
          <Line p1={vec(xs[0], 90)} p2={vec(xs[0] + half, 90)} color={AMBER} strokeWidth={3 * px} />
          <Line p1={vec(xs[0], 70)} p2={vec(xs[0], 110)} color={AMBER} strokeWidth={2 * px} />
          <Line p1={vec(xs[0] + half, 70)} p2={vec(xs[0] + half, 110)} color={AMBER} strokeWidth={2 * px} />
          <Line p1={vec(xs[0], 40)} p2={vec(xs[1], 40)} color={ok ? GREEN : RED} strokeWidth={3 * px} />
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        EIGHT ELEMENTS · AMBER = HALF λ AT THE TOP
      </Text>
      <Text style={[styles.tag, { bottom: 4, left: 8, fontSize: 10 * k, color: ok ? GREEN : RED }]} {...fitValue(10 * k)}>
        {`SPACING ${d} MM`}
      </Text>
      <Text style={[styles.tag, { bottom: 4, right: 8, fontSize: 10 * k, color: AMBER }]} {...fitValue(10 * k)}>
        {`HALF λ ${Math.round(half)} MM`}
      </Text>
    </View>
  );
}

/* ── 3 · the intensity probe ── */

export type ProbeWords = { title: string; badge: string; looking: string; prompt: string };

export function useProbeStep({ words, onDone }: { words: ProbeWords; onDone: () => void }): MikingStep {
  const [deg, setDeg] = useState(30);
  const [spacer, setSpacer] = useState<number>(SPACERS_MM[1]);
  const share = axialShare(deg);
  const [seen, setSeen] = useState({ along: false, across: false, back: false });
  useEffect(() => {
    setSeen((s) => ({ along: s.along || deg === 0, across: s.across || deg === 90, back: s.back || deg === 180 }));
  }, [deg]);
  useEffect(() => {
    if (seen.along && seen.across && seen.back) onDone();
  }, [seen.along, seen.across, seen.back, onDone]);
  const params: DockParam[] = [
    { kind: 'fader', id: 'angle', label: 'ANGLE', value: deg / 180, onChange: (v) => setDeg(Math.round(v * 36) * 5), format: () => `the probe’s axis ${deg}° from the outward normal`, formatShort: () => `${deg}°` },
    { kind: 'options', id: 'spacer', label: 'SPACER', valueLabel: `${spacer} MM`, selectedId: String(spacer), onSelect: (id) => setSpacer(Number(id)), options: SPACERS_MM.map((s) => ({ id: String(s), label: `${s} mm spacer`, blurb: s === 50 ? 'The widest: toward the lows.' : s === 12 ? 'The narrowest: toward the highs.' : 'The middle of the set.' })) },
  ];
  const bezel: BezelItem[] = [
    { k: 'ANGLE', v: `${deg}°`, sub: 'off the normal', flex: 0.9 },
    { k: 'ALONG THE AXIS', v: `${share >= 0 ? '' : '−'}${Math.abs(Math.round(share * 100))} %`, sub: 'cos θ', tint: Math.abs(share) < 0.05 ? RED : share > 0 ? GREEN : AMBER, flex: 1.1 },
    { k: 'PRESSURE', v: 'UNCHANGED', sub: 'scalar', flex: 1 },
  ];
  const a11y = `From above: a small device inside a dashed enclosing surface with outward normals; a pressure–pressure intensity probe on one normal, its ${spacer} millimetre spacer between two capsules, its axis ${deg} degrees from the normal. It reads ${Math.round(share * 100)} percent of the flow along its axis; the pressure it sees is the same.`;
  return {
    key: 'probe',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ProbeView w={w} h={h} deg={deg} spacer={spacer} share={share} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'angle',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${deg}°`} prompt={words.prompt} />
        <Card>
          <Point title={deg === 90 ? 'ACROSS THE AXIS: NEAR ZERO' : deg > 90 ? 'THE OTHER WAY: NEGATIVE' : 'ALONG THE AXIS'}>
            {deg === 90
              ? 'Turned 90° to the flow, the probe reads almost nothing along its axis — even though the pressure is the same. Pressure has no direction; intensity has one.'
              : deg > 90
                ? 'Turned past 90°, the flow runs against the probe’s positive direction: the reading turns negative. Follow the maker’s positive direction and the surface’s outward normal.'
                : `It reads the component of the flow along its axis: ${Math.round(share * 100)} % at ${deg}°.`}
          </Point>
          <Point title="THE SPACER AND THE CHECKS">The spacer and the calibration set the probe’s usable band — a wider spacer toward the lows, a narrower one toward the highs; its data gives each one’s range. Check the pressure and phase calibration and the residual intensity as its procedure says.</Point>
        </Card>
        <Note>{`On paper only, without a qualified operator: looked at ${seen.along ? '✓' : '○'} along the normal · ${seen.across ? '✓' : '○'} across it · ${seen.back ? '✓' : '○'} against it.`}</Note>
      </>
    ),
  };
}

function ProbeView({ w, h, deg, spacer, share, label }: { w: number; h: number; deg: number; spacer: number; share: number; label: string }) {
  const k = useStageTextScale();
  const box = { u0: -520, u1: 940, v0: -460, v1: 460 };
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = 1 / xf.s;
  const p = useMemo(() => {
    const device = rectP(make(), -220, -160, 220, 160, 26);
    const vents = make();
    for (let y = -110; y <= 110; y += 44) rectP(vents, 150, y - 10, 210, y + 10, 6);
    const surface = rectP(make(), -360, -300, 360, 300, 40);
    const normals = make();
    for (const [x, y, dx, dy] of [[360, -150, 1, 0], [360, 150, 1, 0], [-360, 0, -1, 0], [0, -300, 0, -1], [0, 300, 0, 1], [-200, 300, 0, 1], [200, -300, 0, -1]] as const) {
      normals.moveTo(x, y);
      normals.lineTo(x + dx * 90, y + dy * 90);
      normals.moveTo(x + dx * 90, y + dy * 90);
      normals.lineTo(x + dx * 70 - dy * 12, y + dy * 70 + dx * 12);
      normals.moveTo(x + dx * 90, y + dy * 90);
      normals.lineTo(x + dx * 70 + dy * 12, y + dy * 70 - dx * 12);
    }
    const scan = make();
    scan.moveTo(400, -260);
    for (let y = -260; y <= 260; y += 104) {
      scan.lineTo(400, y);
      scan.lineTo(440, y + 52);
    }
    return { device, vents, surface, normals, scan };
  }, []);
  const cx = 670;
  const cy = 0;
  const arrowLen = 160 * Math.abs(share) + 4;
  const rad = (deg * Math.PI) / 180;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Rect x={box.u0} y={box.v0} width={box.u1 - box.u0} height={box.v1 - box.v0} color="#1b1c20" />
          <Path path={p.surface} style="stroke" strokeWidth={2.2 * px} color={BLUE} opacity={0.8}>
            <DashPathEffect intervals={[8 * px, 6 * px]} />
          </Path>
          <Path path={p.normals} style="stroke" strokeWidth={2 * px} color={BLUE} opacity={0.75} />
          <Path path={p.scan} style="stroke" strokeWidth={1.6 * px} color="#9aa0aa" opacity={0.6}>
            <DashPathEffect intervals={[4 * px, 4 * px]} />
          </Path>
          <Path path={p.device}>
            <LinearGradient start={vec(-220, -160)} end={vec(220, 160)} colors={['#5a5f69', '#2c2f35', '#17181b']} />
          </Path>
          <Path path={p.vents} color="#0c0d0f" />
          <Path path={p.device} style="stroke" strokeWidth={1.6 * px} color="#07080a" />
          {/* the flow through the surface here: along the outward normal (+u) */}
          <Line p1={vec(cx - 110, cy + 330)} p2={vec(cx + 110, cy + 330)} color={AMBER} strokeWidth={3 * px} />
          <Line p1={vec(cx + 110, cy + 330)} p2={vec(cx + 90, cy + 318)} color={AMBER} strokeWidth={3 * px} />
          <Line p1={vec(cx + 110, cy + 330)} p2={vec(cx + 90, cy + 342)} color={AMBER} strokeWidth={3 * px} />
          <IntensityProbe cx={cx} cy={cy} spacer={spacer} deg={deg} scale={1.6} />
          {/* the reading along the probe's axis: an arrow as long as cos θ, green forward, amber backward */}
          <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: rad }]}>
            <Line p1={vec(0, -40)} p2={vec(share >= 0 ? arrowLen : -arrowLen, -40)} color={Math.abs(share) < 0.05 ? RED : share > 0 ? GREEN : AMBER} strokeWidth={4 * px} />
          </Group>
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        ON PAPER · BLUE = SURFACE AND OUTWARD NORMALS
      </Text>
      <Text style={[styles.tag, { bottom: 4, left: 8, fontSize: 10 * k, color: AMBER }]} {...fitValue(10 * k)}>
        AMBER = THE FLOW HERE
      </Text>
    </View>
  );
}

/* ── 4 · the specialist kit, and the units card ── */

export type KitWords = { title: string; badge: string; looking: string; prompt: string };
type Kit = 'camera' | 'ultra' | 'hydro';
const RATES = [48000, 96000, 192000, 384000] as const;

/** The air/water units card (DOSITS-AW): never a subtraction. */
export function UnitsCard() {
  return (
    <Card>
      <Point title="AIR · dB re 20 µPa">Airborne sound pressure levels are usually given against 20 micropascals.</Point>
      <Point title="WATER · dB re 1 µPa">Underwater levels are usually given against 1 micropascal. The references alone are {WATER_AIR.refGapDb.toFixed(0)} dB apart — and the same sound intensity in water and in air differs by about {WATER_AIR.equalIntensityDb} dB in all, because water and air carry sound differently.</Point>
      <Point title="NOT COMPARABLE BY SUBTRACTING">So an underwater number and an airborne number are not directly comparable, and no fixed amount subtracted makes them so. Report each with its medium and its reference.</Point>
    </Card>
  );
}

export function useKitStep({ words, onDone }: { words: KitWords; onDone: () => void }): MikingStep {
  const [kit, setKit] = useState<Kit>('camera');
  const [rate, setRate] = useState<number>(48000);
  const [topK, setTopK] = useState(60);
  const [seen, setSeen] = useState<ReadonlySet<Kit>>(() => new Set(['camera']));
  useEffect(() => {
    setSeen((s) => (s.has(kit) ? s : new Set([...s, kit])));
  }, [kit]);
  const all = seen.size === 3;
  useEffect(() => {
    if (all) onDone();
  }, [all, onDone]);
  const fTop = topK * 1000;
  const keeps = nyquistOk(rate, fTop);
  const params: DockParam[] = [
    { kind: 'options', id: 'kit', label: 'KIT', valueLabel: kit === 'camera' ? 'CAMERA' : kit === 'ultra' ? 'ULTRASONIC' : 'HYDROPHONE', selectedId: kit, onSelect: (id) => setKit(id as Kit), sticky: true, options: [
      { id: 'camera', label: 'An acoustic camera', blurb: 'A planar array round a lens: a map of where sound seems to come from.' },
      { id: 'ultra', label: 'An ultrasonic detector', blurb: 'A detector and mic for sound above the audible band.' },
      { id: 'hydro', label: 'A hydrophone on its mooring', blurb: 'An underwater pressure sensor, rated and calibrated for its deployment.' },
    ] },
    ...(kit === 'ultra'
      ? ([
          { kind: 'options', id: 'rate', label: 'RATE', valueLabel: `${rate / 1000} kHz`, selectedId: String(rate), onSelect: (id: string) => setRate(Number(id)), options: RATES.map((r) => ({ id: String(r), label: `${r / 1000} kHz sample rate`, blurb: `Keeps a band only below ${r / 2000} kHz.` })) },
          { kind: 'fader', id: 'top', label: 'TOP', value: (topK - 10) / 140, onChange: (v: number) => setTopK(Math.round(10 + v * 140)), format: () => `the band you need reaches ${topK} kHz`, formatShort: () => `${topK} kHz` },
        ] as DockParam[])
      : []),
  ];
  const bezel: BezelItem[] =
    kit === 'camera'
      ? [
          { k: 'MAP', v: 'AN ESTIMATE', tint: AMBER, flex: 1.2 },
          { k: 'CHECK WITH', v: 'A KNOWN SOURCE', flex: 1.3 },
        ]
      : kit === 'ultra'
        ? [
            { k: 'RATE', v: `${rate / 1000}`, sub: 'kHz', flex: 0.8 },
            { k: 'KEEPS BELOW', v: `${rate / 2000}`, sub: 'kHz', flex: 1 },
            { k: 'YOUR TOP', v: `${topK}`, sub: 'kHz', tint: keeps ? GREEN : RED, flex: 0.9 },
          ]
        : [
            { k: 'WATER REF', v: '1 µPa', flex: 1 },
            { k: 'AIR REF', v: '20 µPa', flex: 1 },
            { k: 'COMPARABLE', v: 'NOT BY SUBTRACTING', tint: RED, flex: 1.6 },
          ];
  const a11y =
    kit === 'camera'
      ? 'An acoustic camera: a ring of capsules round a lens on a mount, facing a small device; a coloured patch on the device marks where the map puts the sound — an estimate, not a photograph of sound.'
      : kit === 'ultra'
        ? `A handheld ultrasonic detector. At a ${rate / 1000} kilohertz sample rate a band is kept only below ${rate / 2000} kilohertz; the band you need reaches ${topK} kilohertz, so it is ${keeps ? 'kept' : 'not kept'}.`
        : 'Under water, from the side: the surface, a buoy, a mooring line to an anchor on the bottom, and a hydrophone hanging on its cable partway down. Underwater levels use a reference of 1 micropascal.';
  return {
    key: 'kit',
    title: words.title,
    kind: 'LEARN',
    layout: 'rack',
    rack: {
      render: (w, h) => <KitView w={w} h={h} kit={kit} rate={rate} topK={topK} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'kit',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${kit === 'camera' ? 'an acoustic camera' : kit === 'ultra' ? 'an ultrasonic detector' : 'a hydrophone'}`} prompt={words.prompt} />
        {kit === 'camera' ? (
          <Card>
            <Point title="A HOT SPOT IS AN ESTIMATE">The map is produced by a model from synchronized channels: its peak can be a real source, a reflection, a sidelobe or an artifact. Check with a known stationary source at a modest level, repeat from another viewpoint, and compare with a single-mic look before calling anything a fault.</Point>
            <Point title="WHAT SETS THE PICTURE">The band, the dynamic range, the processing, the array’s size and the distance. Save the raw channels with the map, and note the range and threshold you displayed.</Point>
          </Card>
        ) : kit === 'ultra' ? (
          <Card>
            <Point title={keeps ? 'THE RATE KEEPS THE BAND' : 'THE RATE IS TOO LOW'}>{`A sample rate must be more than twice the highest frequency kept: ${rate / 1000} kHz keeps a band below ${rate / 2000} kHz. ${keeps ? 'Your band fits — if the mic and the filter reach it too.' : 'Your band does not fit.'}`}</Point>
            <Point title="A LABEL IS NOT A RESPONSE">A sample-rate label alone does not prove the mic hears that high: the transducer’s band and the anti-alias filter must reach it too. Detecting calls is not counting animals — that needs a survey design. Never emit unverified ultrasound; inaudible is not harmless.</Point>
          </Card>
        ) : (
          <>
            <Card>
              <Point title="RATED AND CALIBRATED FOR THE DEPLOYMENT">An air mic is not a hydrophone. Log the depth, the mooring, the orientation, the water conditions, the permissions and the sensor’s self-noise; convert its voltage with its own chain calibration before reporting a pressure.</Point>
            </Card>
            <UnitsCard />
          </>
        )}
        <Note>{`Drawn as objects, for a qualified operator — looked at: camera ${seen.has('camera') ? '✓' : '○'} · ultrasonic ${seen.has('ultra') ? '✓' : '○'} · hydrophone ${seen.has('hydro') ? '✓' : '○'}.`}</Note>
      </>
    ),
  };
}

function KitView({ w, h, kit, rate, topK, label }: { w: number; h: number; kit: Kit; rate: number; topK: number; label: string }) {
  const k = useStageTextScale();
  if (kit === 'camera') return <CameraView w={w} h={h} label={label} k={k} />;
  if (kit === 'ultra') return <UltraView w={w} h={h} rate={rate} topK={topK} label={label} k={k} />;
  return <HydroView w={w} h={h} label={label} k={k} />;
}

function CameraView({ w, h, label, k }: { w: number; h: number; label: string; k: number }) {
  const box = { u0: -700, u1: 1500, v0: -520, v1: 560 };
  const xf = useMemo(() => fitXform('side', box, w, h, 8), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const dev = useMemo(() => rectP(make(), 900, -200, 1400, 300, 30), []);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Rect x={box.u0} y={box.v0} width={box.u1 - box.u0} height={box.v1 - box.v0} color="#1b1c20" />
          <Path path={dev}>
            <LinearGradient start={vec(900, -200)} end={vec(1400, 300)} colors={['#5a5f69', '#2c2f35']} />
          </Path>
          <Circle cx={1260} cy={-60} r={110} color="#ff6b5e" opacity={0.55}>
            <BlurMask blur={40} style="normal" />
          </Circle>
          <Circle cx={1260} cy={-60} r={50} color="#ffc64d" opacity={0.6}>
            <BlurMask blur={20} style="normal" />
          </Circle>
          <AcousticCamera cx={-250} cy={-80} r={260} />
          <Line p1={vec(-170, -80)} p2={vec(880, -80)} color={BLUE} strokeWidth={2 / xf.s} opacity={0.5}>
            <DashPathEffect intervals={[8 / xf.s, 6 / xf.s]} />
          </Line>
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        ACOUSTIC CAMERA · THE PATCH IS AN ESTIMATE
      </Text>
    </View>
  );
}

function UltraView({ w, h, rate, topK, label, k }: { w: number; h: number; rate: number; topK: number; label: string; k: number }) {
  const top = h * 0.48;
  const L = 14;
  const R = w - 14;
  const kHzMax = 200;
  const xOf = (kHz: number) => L + ((R - L) * Math.min(kHzMax, kHz)) / kHzMax;
  const keeps = nyquistOk(rate, topK * 1000);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: w * 0.12 }, { translateY: h * 0.18 }, { scale: Math.min(w / 520, h / 300) }]}>
          <UltrasonicDetector x={0} y={0} len={300} />
        </Group>
        <Rect x={L} y={top + 30 * k} width={R - L} height={18} color="#24262b" />
        <Rect x={L} y={top + 30 * k} width={xOf(rate / 2000) - L} height={18} color={GREEN} opacity={0.45} />
        <Line p1={vec(xOf(topK), top + 22 * k)} p2={vec(xOf(topK), top + 30 * k + 26)} color={keeps ? GREEN : RED} strokeWidth={3} />
        <Line p1={vec(xOf(20), top + 30 * k)} p2={vec(xOf(20), top + 30 * k + 18)} color="#aab0bd" strokeWidth={1.5} />
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        GREEN = THE BAND THIS RATE CAN KEEP
      </Text>
      <Text style={[styles.tag, { top: top + 30 * k + 24, left: L, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>
        0
      </Text>
      <Text style={[styles.tag, { top: top + 30 * k + 24, left: xOf(20) - 12 * k, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>
        20 kHz
      </Text>
      <Text style={[styles.tag, { top: top + 2 * k, left: Math.min(R - 70 * k, xOf(topK) - 20 * k), fontSize: 9.5 * k, color: keeps ? GREEN : RED }]} {...fitValue(9.5 * k)}>
        {`YOUR TOP ${topK} kHz`}
      </Text>
      <Text style={[styles.tag, { top: top + 30 * k + 24, right: 8, fontSize: 9 * k, color: '#aab0bd' }]} {...fitValue(9 * k)}>
        200 kHz
      </Text>
    </View>
  );
}

function HydroView({ w, h, label, k }: { w: number; h: number; label: string; k: number }) {
  const box = { u0: -1500, u1: 1500, v0: -500, v1: 4200 };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = useMemo(() => {
    const water = rectP(make(), box.u0, 0, box.u1, 4000);
    const surface = make();
    surface.moveTo(box.u0, 0);
    for (let x = box.u0; x < box.u1; x += 200) {
      surface.quadTo(x + 50, -30, x + 100, 0);
      surface.quadTo(x + 150, 30, x + 200, 0);
    }
    const bed = make();
    bed.moveTo(box.u0, 3900);
    bed.cubicTo(-600, 3820, 400, 4020, box.u1, 3880);
    bed.lineTo(box.u1, 4200);
    bed.lineTo(box.u0, 4200);
    bed.close();
    const line = make();
    line.moveTo(300, 3880);
    line.lineTo(300, 60);
    const buoy = make();
    buoy.addOval({ x: 160, y: -170, width: 280, height: 230 });
    const anchor = rectP(make(), 180, 3820, 420, 3920, 20);
    return { water, surface, bed, line, buoy, anchor };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Rect x={box.u0} y={box.v0} width={box.u1 - box.u0} height={500} color="#1d2228" />
          <Path path={p.water}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 4000)} colors={['#1f4a66', '#123048', '#0a1a28']} />
          </Path>
          <Path path={p.surface} style="stroke" strokeWidth={14} color="#9cc4e8" opacity={0.8} />
          <Path path={p.bed}>
            <LinearGradient start={vec(0, 3800)} end={vec(0, 4200)} colors={['#5a4a36', '#2e261c']} />
          </Path>
          <Path path={p.line} style="stroke" strokeWidth={12} color="#c9b98a" opacity={0.85} />
          <Path path={p.anchor} color="#3a3d44" />
          <Path path={p.buoy}>
            <RadialGradient c={vec(240, -110)} r={220} colors={['#ffb36b', '#e0661f', '#8a3410']} />
          </Path>
          <Hydrophone x={-300} y={1900} len={260} cable={1900} />
          <Line p1={vec(-300, 0)} p2={vec(300, 0)} color="#c9b98a" strokeWidth={10} opacity={0.5} />
        </Group>
      </Canvas>
      <Text style={[styles.cap, { top: 3, left: 8, right: 8, fontSize: 9.5 * k }]} {...fitValue(9.5 * k)}>
        HYDROPHONE ON A MOORING · SIZES A DRAWING
      </Text>
      <Text style={[styles.tag, { left: xf.ox + (-300 + 120) * xf.s, top: xf.oy + 1950 * xf.s, fontSize: 10 * k, color: '#9cc4e8' }]} {...fitValue(10 * k)}>
        dB re 1 µPa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { position: 'absolute', color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  tag: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.5 },
});

