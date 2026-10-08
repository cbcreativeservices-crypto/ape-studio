/**
 * THE ARENA PAGE PIECES — the steps Lab 7 part 2, group 3 (lab7-g6) adds to
 * the shared sports kit (sportsPages.tsx stays group 2's): B15 and B16 use
 * the pass-by step, B17 the coverage planner, the M/S width and the downmix.
 *
 *   usePassByStep       a source WALKS a path past two fixed mics: each mic's
 *                       range and level against its own loudest point, the
 *                       arrival difference between them and its first
 *                       notch; the aim ACROSS or OBLIQUE (along the path);
 *                       the double-range place. No pitch number, ever.
 *   useCoveragePlanStep the roles × the minimal / extensive layouts, the
 *                       mic channels counted, and the failure drill
 *   useMsWidthStep      Mid-Side: the decoded left and right pickups as the
 *                       width k changes — and the mono sum that never does
 *   useDownmixStep      stereo → mono and 3/2 → stereo as labelled examples,
 *                       and the one delivery card
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing moves by itself (a finger moves everything). Every
 * glass is a FieldStage (one labelled canvas, labels ≥ 9 pt that zoom).
 */
import { useEffect, useMemo, useState } from 'react';
import { Circle, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { PatternId, Prediction } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard } from '../../../engine/kit';
import { FieldStage, type FieldInset } from '../field/FieldStage';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { levelColorForDb } from '../../../../../../features/tools/levelColor';
import { fmtM1, planRange, planUV, type P2, type PlanRect, type VenueScene } from './venuePlan.ts';
import { MicOnPlan, PlanStage, devIndex, type SportMic } from './sportsPages';
import { PlanPath, TargetRing, venueLabels } from './VenueArt';
import { PITCH_NOTE, pickupDb, pointAt, readPass, type PassCase, type PassMic } from './passBy.ts';
import { LAYOUTS, LAYOUT_IDS, ROLES, ROLE_IDS, carrierFor, channelCount, countParts, roleChannels, type LayoutId, type RoleId } from './coverage.ts';
import { DELIVERY, ITU_K, K_STEPS, MONO_SOURCES, downmixShareDb, monoChangeDb, msBalanceDb, msDecode, sideDb } from './downmix.ts';

const AMBER = '#ffc64d';
const BLUE = '#8fbcff';
const RED = '#ff6b5e';
const GREEN = '#5bff85';
const WHITE = '#eef1f5';
const make = () => Skia.Path.Make();
const sgn = (x: number, d = 1) => `${x > 0.05 ? '+' : x < -0.05 ? '−' : ''}${Math.abs(x).toFixed(d)}`;

/* ═════════ THE PASS-BY ═════════ */

export type PassBySpec = {
  scene: VenueScene;
  box?: PlanRect;
  path: readonly P2[];
  hSrc: number;
  /** Mic 1 at its place; `far`: the double-range place (an option). */
  m1: SportMic;
  far?: SportMic;
  m2: SportMic;
  /** Mic 1's two aims: across the path, or oblique (along it). */
  aims: { across: P2; oblique: P2 };
  pattern: PatternId;
  /** The path's end names and the point names along it (for the readouts). */
  stops: readonly { t: number; short: string }[];
  onInteractive: (id: string) => void;
  done: boolean;
  prediction?: Prediction;
  intro: string;
};

/** The level-along-the-path graph (an inset): mic 1's pickup at every point
 *  of the walk against its own loudest point, the "within 6 dB" band, and
 *  where the source is now. A simplified picture: one point source, straight
 *  paths, the ideal pattern. */
function levelInset(c: PassCase, t: number, stops: PassBySpec['stops']): FieldInset {
  const W = 1000;
  const H = 420;
  const N = 160;
  const FLOOR = -18;
  const ys = Array.from({ length: N + 1 }, (_, i) => pickupDb(c.mics[0], pointAt(c.path, i / N), c.hSrc));
  const peak = Math.max(...ys);
  const yOf = (db: number) => (-Math.max(FLOOR, Math.min(0, db - peak)) / -FLOOR) * H - H;
  const curve = make();
  ys.forEach((y, i) => (i === 0 ? curve.moveTo(0, yOf(y)) : curve.lineTo((i / N) * W, yOf(y))));
  const band = make();
  band.addRect(Skia.XYWHRect(0, -H, W, H * (6 / -FLOOR)));
  const now = make();
  now.moveTo(t * W, -H);
  now.lineTo(t * W, 0);
  const axis = make();
  axis.moveTo(0, 0);
  axis.lineTo(W, 0);
  return {
    view: 'top',
    box: { u0: -60, u1: W + 60, v0: -H - 130, v1: 110 },
    at: { x: 0.52, y: 0.02, w: 0.46, h: 0.3 },
    draw: (px) => (
      <Group>
        <Path path={band} color={GREEN} opacity={0.12} />
        <Path path={axis} style="stroke" strokeWidth={1 * px} color="#5b5f69" />
        <Path path={curve} style="stroke" strokeWidth={2.2 * px} color={BLUE} />
        <Path path={now} style="stroke" strokeWidth={1.6 * px} color={AMBER} />
      </Group>
    ),
    labels: [
      { id: 'tt', text: 'MIC 1 ALONG THE WALK', short: 'MIC 1', u: 0, v: -H - 70, align: 'left', tone: 'muted' },
      ...stops.map((s, i) => ({ id: `s.${i}`, text: s.short, u: s.t * W, v: 70, align: 'center' as const, tone: 'muted' as const })),
    ],
  };
}

export function usePassByStep(spec: PassBySpec): MikingStep {
  const { onInteractive, done } = spec;
  // The web preview harness only: `&walk=<n>` (tenths, 1-based), `&aim=2`, `&far=2`.
  const [t, setT] = useState(() => Math.min(1, devIndex('walk') / 10));
  const [aim, setAim] = useState<'across' | 'oblique'>(() => (devIndex('aim') === 1 ? 'oblique' : 'across'));
  const [far, setFar] = useState(() => devIndex('far') === 1);
  const [seen, setSeen] = useState({ start: true, end: false, aims: new Set<string>(['across']) });
  const [predicted, setPredicted] = useState<string | null>(null);
  const m1base = far && spec.far ? spec.far : spec.m1;
  const aimAt = aim === 'across' ? spec.aims.across : spec.aims.oblique;
  const m1: SportMic = { ...m1base, aimAt, aimH: spec.hSrc };
  const pm = (m: SportMic, pattern: PatternId | null): PassMic => ({ id: m.id, label: m.label, at: m.at, h: m.h, aimAt: m.aimAt, aimH: m.aimH, pattern });
  const c: PassCase = useMemo(() => ({ path: spec.path, hSrc: spec.hSrc, mics: [pm(m1, spec.pattern), pm(spec.m2, spec.pattern)] }), [m1.at.x, m1.at.y, aimAt.x, aimAt.y, spec]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = readPass(c, t);
  const a = r.mics[0];
  const b = r.mics[1];
  const nearStop = spec.stops.find((s) => Math.abs(s.t - t) < 0.04);
  const complete = seen.start && seen.end && seen.aims.size >= 2;
  useEffect(() => {
    if (complete && !done) onInteractive('passBy');
  }, [complete, done, onInteractive]);
  const equal = Math.abs(r.dtMs) < 0.05;
  const words = `The source ${fmtM1(a.range)} from mic 1 (${sgn(a.vsPeakDb)} dB against its loudest point on the walk, ${Math.round(a.offAxis)}° off its axis) and ${fmtM1(b.range)} from mic 2. ${equal ? 'Both paths are equal here: the two mics hear it together.' : `Mic 2 hears it ${Math.abs(r.dtMs).toFixed(1)} ms ${r.dtMs > 0 ? 'later' : 'earlier'}; the first notch of their sum near ${r.notches[0] ? `${Math.round(r.notches[0])} Hz` : 'none'}.`}`;
  return {
    key: 'passby',
    title: 'A source passing by',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage
          w={w}
          h={h}
          scene={spec.scene}
          box={spec.box}
          a11y={words}
          labels={[...venueLabels(spec.scene, { marks: false }), { id: 'm1', text: 'MIC 1', u: planUV(m1.at).u, v: planUV(m1.at).v + 900, align: 'center', tone: 'amber' }, { id: 'm2', text: 'MIC 2', u: planUV(spec.m2.at).u, v: planUV(spec.m2.at).v - 900, align: 'center', tone: 'amber' }]}
          inset={levelInset(c, t, spec.stops)}
        >
          {(px, g) => (
            <>
              <PlanPath a={r.src} b={m1.at} px={px} width={2.2} />
              <PlanPath a={r.src} b={spec.m2.at} px={px} width={2.2} color={AMBER} />
              <MicOnPlan g={g} m={m1} px={px} />
              <MicOnPlan g={g} m={spec.m2} px={px} />
              <TargetRing p={r.src} px={px} active />
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · blue = the path to mic 1 · amber = the path to mic 2 · the corner graph = mic 1’s level along the walk (green = within 6 dB of its loudest) · calculated from the drawing, a simplified picture',
      bezel: [
        { k: 'AT', v: nearStop ? nearStop.short : '—', flex: 0.6 },
        { k: 'MIC 1', v: fmtM1(a.range), flex: 0.9 },
        { k: 'LEVEL', v: `${sgn(a.vsPeakDb)} dB`, tint: a.vsPeakDb < -6 ? RED : undefined, flex: 0.9 },
        { k: 'Δt', v: equal ? '0 ms' : `${Math.abs(r.dtMs).toFixed(1)} ms`, flex: 0.8 },
        { k: 'NOTCH', v: r.notches[0] ? `${Math.round(r.notches[0])} Hz` : '—', flex: 0.9 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'walk',
          label: 'WALK',
          value: t,
          onChange: (v) => {
            setT(v);
            if (v < 0.06 || v > 0.94) setSeen((s) => ({ ...s, start: s.start || v < 0.06, end: s.end || v > 0.94 }));
          },
          format: () => `the source ${fmtM1(a.range)} from mic 1`,
          formatShort: () => fmtM1(a.range),
        },
        {
          kind: 'options',
          id: 'aim',
          label: 'AIM',
          valueLabel: aim === 'across' ? 'ACROSS' : 'OBLIQUE',
          selectedId: aim,
          sticky: true,
          onSelect: (id) => {
            setAim(id as 'across' | 'oblique');
            setSeen((s) => ({ ...s, aims: new Set([...s.aims, id]) }));
          },
          options: [
            { id: 'across', label: 'Across the path', blurb: 'Mic 1 aimed straight across the walk, at its middle point.' },
            { id: 'oblique', label: 'Oblique, along the path', blurb: 'Mic 1 aimed along the walk, toward the approach — from the same approved place.' },
          ],
        },
        ...(spec.far
          ? [
              {
                kind: 'options' as const,
                id: 'place',
                label: 'MIC 1',
                valueLabel: far ? 'FARTHER' : 'START',
                selectedId: far ? 'far' : 'near',
                sticky: true,
                onSelect: (id: string) => setFar(id === 'far'),
                options: [
                  { id: 'near', label: 'At its starting place', blurb: 'Mic 1 at its place in the equipment area.' },
                  { id: 'far', label: 'Twice as far from the walk', blurb: 'The double-range trial: the same aim, twice the distance to the middle point.' },
                ],
              },
            ]
          : []),
      ],
      initialParam: 'walk',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`A walking source · mic 1 ${aim === 'across' ? 'aimed across' : 'aimed along the path'}${far ? ', twice as far' : ''}`} prompt={spec.intro} />
        <NowLine text={words} />
        <Card>
          <Point title="THE LEVEL">{`Mic 1 is loudest where the source passes closest and on its axis; ${a.vsPeakDb < -6 ? 'here it is more than 6 dB down — the edge of its useful sector.' : 'here it is within 6 dB of that — inside its useful sector.'} Each doubling of distance costs about 6 dB in the open.`}</Point>
          <Point title="THE DELAY">{equal ? 'Here both mics are equally far from the source: their sum has no comb. Walk on — the paths stop being equal.' : `The two mics hear the source ${Math.abs(r.dtMs).toFixed(1)} ms apart. Walk the source: the delay changes, so a delay set for one point is wrong at the next.`}</Point>
          <Point title="THE AIM">{aim === 'across' ? 'Aimed across: a short, strong sector where the source passes in front — it leaves the mic quickly.' : 'Aimed along the path: the approach stays on the axis longer, the useful sector stretches — and more of whatever lies beyond (a crowd, a loudspeaker) sits on the axis too.'}</Point>
        </Card>
        <Note tone="info">{PITCH_NOTE}</Note>
        {complete ? <Note tone="ok">{`One fixed mic covers a moving source well only over part of its path, and two mics hear it in time only where their paths are equal. Choose a dominant mic per sector or hand off — not one delay for every point. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>Walk the source from one end to the other, and try both aims.</Body>}
      </>
    ),
  };
}

/* ═════════ THE COVERAGE PLANNER ═════════ */

const ROLE_TINT: Readonly<Record<RoleId, string>> = { commentary: '#c9a3ff', action: AMBER, main: BLUE, spots: '#7fe0c8' };
const ROLE_ART: Readonly<Record<RoleId, { art: 'broadcastDynamic' | 'shotgun' | 'sdc' | 'ambiTetra'; r: number; len: number; cross?: number }>> = {
  commentary: { art: 'broadcastDynamic', r: 30, len: 190 },
  action: { art: 'shotgun', r: 10.5, len: 220 },
  main: { art: 'sdc', r: 10.5, len: 104 },
  spots: { art: 'sdc', r: 10.5, len: 104 },
};

function CoverageBoard({ w, h, layout, lost, carrier, a11y }: { w: number; h: number; layout: LayoutId; lost: string | null; carrier: string | null; a11y: string }) {
  const ins = LAYOUTS[layout].inputs;
  const CW = 200;
  const GAP = 24;
  const X0 = 250;
  const ROW = 190;
  const cards = ROLE_IDS.flatMap((r, ri) => ins.filter((q) => q.role === r).map((q, i) => ({ q, u: X0 + i * (CW + GAP), v: 40 + ri * ROW })));
  const labels: StaticLabel[] = [
    ...ROLE_IDS.map((r, ri) => ({ id: `r.${r}`, text: `${ROLES[r].short} · ${roleChannels(layout, r)}`, short: ROLES[r].short, u: 10, v: 40 + ri * ROW + 70, align: 'left' as const, tone: (roleChannels(layout, r) ? 'amber' : 'muted') as StaticLabel['tone'] })),
    ...cards.map((c) => ({ id: `c.${c.q.id}`, text: c.q.short, u: c.u + CW / 2, v: c.v + 150, align: 'center' as const, tone: (c.q.id === lost ? 'muted' : c.q.id === carrier ? 'amber' : undefined) as StaticLabel['tone'] })),
  ];
  return (
    <FieldStage w={w} h={h} view="top" box={{ u0: 0, u1: X0 + 4 * (CW + GAP), v0: 0, v1: 40 + 4 * ROW }} a11y={a11y} labels={labels}>
      {(px) => (
        <Group>
          {cards.map(({ q, u, v }) => {
            const card = make();
            card.addRRect(Skia.RRectXY(Skia.XYWHRect(u, v, CW, 130), 14, 14));
            const off = q.id === lost;
            const on = q.id === carrier;
            const look = ROLE_ART[q.role];
            const n = q.channels;
            const many = q.role === 'commentary' || q.role === 'action' ? 1 : 2;
            const arts: { art: (typeof ROLE_ART)[RoleId]['art'] }[] = q.role === 'main' && n === 4 ? [{ art: 'ambiTetra' }] : Array.from({ length: many }, () => ({ art: look.art }));
            const cross = make();
            cross.moveTo(u + 20, v + 20);
            cross.lineTo(u + CW - 20, v + 110);
            cross.moveTo(u + CW - 20, v + 20);
            cross.lineTo(u + 20, v + 110);
            return (
              <Group key={q.id} opacity={off ? 0.4 : 1}>
                <Path path={card} color="#1b1d22" />
                <Path path={card} style="stroke" strokeWidth={(on ? 3 : 1.4) * px} color={on ? AMBER : ROLE_TINT[q.role]} opacity={on ? 1 : 0.8} />
                {arts.map((a, i) => {
                  const sc = a.art === 'ambiTetra' ? 0.9 : a.art === 'broadcastDynamic' ? 0.5 : a.art === 'shotgun' ? 0.62 : 0.85;
                  const L = a.art === 'ambiTetra' ? 120 : look.len;
                  // Lying across the card, front to the left, centred on it; a pair one above the other.
                  return (
                    <Group key={i} transform={[{ translateX: u + CW / 2 - (L * sc) / 2 }, { translateY: v + 62 + (arts.length > 1 ? (i - 0.5) * 30 : 0) }, { rotate: -Math.PI / 2 }, { scale: sc }]}>
                      <MikingMicArt art={a.art} r={a.art === 'ambiTetra' ? 30 : look.r} len={L} cross={a.art === 'ambiTetra' ? 60 : look.cross} />
                    </Group>
                  );
                })}
                {Array.from({ length: n }, (_, i) => (
                  <Circle key={`d${i}`} cx={u + 18 + i * 16} cy={v + 116} r={5} color={ROLE_TINT[q.role]} />
                ))}
                {off ? <Path path={cross} style="stroke" strokeWidth={3 * px} color={RED} /> : null}
              </Group>
            );
          })}
        </Group>
      )}
    </FieldStage>
  );
}

export function useCoveragePlanStep({ onInteractive, done, prediction }: { onInteractive: (id: string) => void; done: boolean; prediction?: Prediction }): MikingStep {
  // The web preview harness only: `&layout=2`, `&lose=<n>` (the input at index n − 1).
  const [layout, setLayout] = useState<LayoutId>(() => LAYOUT_IDS[Math.min(devIndex('layout'), LAYOUT_IDS.length - 1)]);
  const [lost, setLost] = useState<string | null>(() => (devIndex('lose') ? (LAYOUTS[LAYOUT_IDS[Math.min(devIndex('layout'), LAYOUT_IDS.length - 1)]].inputs[devIndex('lose')]?.id ?? null) : null));
  const [seenLayouts, setSeenLayouts] = useState<ReadonlySet<LayoutId>>(() => new Set(['minimal']));
  const [lostRoles, setLostRoles] = useState<ReadonlySet<RoleId>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const ins = LAYOUTS[layout].inputs;
  const lostIn = ins.find((q) => q.id === lost) ?? null;
  const carry = lostIn ? carrierFor(layout, lostIn.id) : null;
  const complete = seenLayouts.size === LAYOUT_IDS.length && lostRoles.size >= 2;
  useEffect(() => {
    if (complete && !done) onInteractive('coveragePlan');
  }, [complete, done, onInteractive]);
  const n = channelCount(layout);
  const parts = countParts(layout);
  const a11y = `The ${LAYOUTS[layout].label.toLowerCase()} layout: ${ins.map((q) => `${q.label} (${q.channels} channel${q.channels > 1 ? 's' : ''})`).join(', ')} — ${n} mic channels.${lostIn ? ` ${lostIn.label} is lost. ${carry?.words ?? ''}` : ''}`;
  return {
    key: 'coverage',
    title: 'Plan the coverage',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <CoverageBoard w={w} h={h} layout={layout} lost={lost} carrier={carry?.by?.id ?? null} a11y={a11y} />,
      badge: 'Each card = one input · dots = its mic channels · amber outline = what carries a lost role · red cross = lost · line feeds, communications and spares not counted',
      bezel: [
        { k: 'LAYOUT', v: LAYOUTS[layout].short, flex: 1.3 },
        { k: 'CHANNELS', v: `${n}`, flex: 1 },
        { k: 'BY ROLE', v: parts.join(' + '), flex: 1.3 },
        { k: 'CARRIED BY', v: carry ? (carry.by ? carry.by.short : 'GAP') : '—', tint: carry && !carry.by ? RED : undefined, flex: 1.2 },
      ],
      params: [
        {
          kind: 'options',
          id: 'layout',
          label: 'LAYOUT',
          valueLabel: LAYOUTS[layout].short,
          selectedId: layout,
          sticky: true,
          onSelect: (id) => {
            setLayout(id as LayoutId);
            setLost(null);
            setSeenLayouts((p) => (p.has(id as LayoutId) ? p : new Set([...p, id as LayoutId])));
          },
          options: LAYOUT_IDS.map((l) => ({ id: l, label: LAYOUTS[l].label, blurb: LAYOUTS[l].blurb })),
        },
        {
          kind: 'options',
          id: 'lose',
          label: 'LOSE',
          valueLabel: lostIn ? lostIn.short : 'NONE',
          selectedId: lost ?? 'none',
          sticky: true,
          onSelect: (id) => {
            const q = ins.find((x) => x.id === id);
            setLost(q ? q.id : null);
            if (q) setLostRoles((p) => (p.has(q.role) ? p : new Set([...p, q.role])));
          },
          options: [{ id: 'none', label: 'Nothing lost', blurb: 'Every input is up.' }, ...ins.map((q) => ({ id: q.id, label: `Lose ${q.label}`, blurb: ROLES[q.role].job }))],
        },
      ],
      initialParam: 'layout',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`The ${LAYOUTS[layout].label.toLowerCase()} layout · ${n} mic channels`} prompt="Compare the two LAYOUTS, then LOSE an input at a time: which input carries its role now — and where is there a gap?" />
        <Card>
          <Point title={`${LAYOUTS[layout].label.toUpperCase()} · ${parts.join(' + ')} = ${n}`}>{LAYOUTS[layout].blurb}</Point>
          {carry ? <Point title={carry.by ? `CARRIED BY ${carry.by.short}` : 'A KNOWN GAP'}>{carry.words}</Point> : <Point title="THE DRILL">Lose one input at a time and decide, before the event, which feed replaces it and how to avoid a jump in level.</Point>}
        </Card>
        <Body>An extensive layout earns its extra channels only by covering what the smaller one demonstrably lacks — more mics also bring more spill, peaks, cable routes and timing differences to manage.</Body>
        {complete ? <Note tone="ok">{`Both layouts compared and the drill run. Start minimal, add an input only for a tested gap — and know what survives each loss. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>{`Layouts looked at: ${seenLayouts.size} of ${LAYOUT_IDS.length}; roles lost: ${lostRoles.size} (lose at least two different roles).`}</Body>}
      </>
    ),
  };
}

/* ═════════ M/S WIDTH ═════════ */

/** A source direction for the M/S panel (degrees off the front, + = left). */
export type MsSource = { id: string; label: string; short: string; deg: number };

function polarPath(f: (deg: number) => number, R: number, sign: 1 | -1 | 0 = 0): ReturnType<typeof make> {
  const p = make();
  let started = false;
  for (let d = -180; d <= 180; d += 2) {
    const g = f(d);
    if (sign !== 0 && Math.sign(g) !== sign && Math.abs(g) > 1e-6) {
      started = false;
      continue;
    }
    const r = Math.abs(g) * R;
    const u = -Math.sin((d * Math.PI) / 180) * r;
    const v = -Math.cos((d * Math.PI) / 180) * r;
    if (!started) {
      p.moveTo(u, v);
      started = true;
    } else p.lineTo(u, v);
  }
  return p;
}

export function useMsWidthStep({ sources, onInteractive, done }: { sources: readonly MsSource[]; onInteractive: (id: string) => void; done: boolean }): MikingStep {
  // The web preview harness only: `&k=<n>` (k = (n − 1) ÷ 4), `&src=<n>`.
  const [k, setK] = useState(() => (devIndex('k') ? Math.min(1.5, devIndex('k') / 4) : 0.5));
  const [sid, setSid] = useState(() => sources[Math.min(devIndex('src'), sources.length - 1)].id);
  const [seen, setSeen] = useState({ low: false, high: false, src: new Set<string>([sources[0].id]) });
  const src = sources.find((s) => s.id === sid) ?? sources[0];
  const d = msDecode(src.deg, k);
  const bal = msBalanceDb(src.deg, k);
  const complete = seen.low && seen.high && seen.src.size >= 2;
  useEffect(() => {
    if (complete && !done) onInteractive('msWidth');
  }, [complete, done, onInteractive]);
  const R = 900;
  const words = `Width k ${k.toFixed(2)}: the Side ${k > 0 ? `${sideDb(k).toFixed(1)} dB against the Mid` : 'off'}. ${src.label}: ${Math.abs(bal) < 0.05 ? 'equal in left and right' : `${Math.abs(bal).toFixed(1)} dB louder in the ${bal > 0 ? 'left' : 'right'}`}; the mono sum is the Mid alone, whatever the width.`;
  const labels: StaticLabel[] = [
    { id: 'f', text: 'FRONT', u: 0, v: -R - 120, align: 'center', tone: 'muted' },
    { id: 'l', text: 'LEFT', u: -R - 60, v: 0, align: 'right', tone: 'amber' },
    { id: 'r', text: 'RIGHT', u: R + 60, v: 0, align: 'left', tone: 'blue' },
    { id: 's', text: src.short, u: -Math.sin((src.deg * Math.PI) / 180) * (R + 120), v: -Math.cos((src.deg * Math.PI) / 180) * (R + 120) - 60, align: 'center', tone: 'amber' },
  ];
  return {
    key: 'ms',
    title: 'Mid-Side width',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="top" box={{ u0: -R - 420, u1: R + 420, v0: -R - 260, v1: R + 180 }} a11y={words} labels={labels}>
          {(px) => {
            const grid = make();
            grid.addCircle(0, 0, R);
            grid.addCircle(0, 0, R / 2);
            grid.moveTo(-R, 0);
            grid.lineTo(R, 0);
            grid.moveTo(0, -R);
            grid.lineTo(0, R);
            const ray = make();
            ray.moveTo(0, 0);
            ray.lineTo(-Math.sin((src.deg * Math.PI) / 180) * R, -Math.cos((src.deg * Math.PI) / 180) * R);
            const peak = Math.max(1, ...[-180, -90, 0, 90].map((q) => Math.max(Math.abs(msDecode(q, k).L), Math.abs(msDecode(q, k).R))));
            const scale = R / (peak * R);
            return (
              <Group>
                <Path path={grid} style="stroke" strokeWidth={1 * px} color="#5b5f69" opacity={0.6} />
                <Path path={polarPath((q) => msDecode(q, 0).mono, R * scale)} style="stroke" strokeWidth={1.8 * px} color={WHITE} opacity={0.8}>
                  <DashPathEffect intervals={[6 * px, 5 * px]} />
                </Path>
                <Path path={polarPath((q) => msDecode(q, k).L, R * scale, 1)} style="stroke" strokeWidth={2.6 * px} color={AMBER} />
                <Path path={polarPath((q) => msDecode(q, k).R, R * scale, 1)} style="stroke" strokeWidth={2.6 * px} color={BLUE} />
                <Path path={polarPath((q) => msDecode(q, k).L, R * scale, -1)} style="stroke" strokeWidth={1.6 * px} color={AMBER} opacity={0.6}>
                  <DashPathEffect intervals={[3 * px, 4 * px]} />
                </Path>
                <Path path={polarPath((q) => msDecode(q, k).R, R * scale, -1)} style="stroke" strokeWidth={1.6 * px} color={BLUE} opacity={0.6}>
                  <DashPathEffect intervals={[3 * px, 4 * px]} />
                </Path>
                <Path path={ray} style="stroke" strokeWidth={1.6 * px} color={AMBER} opacity={0.7} />
                <Group transform={[{ translateX: 115 }, { translateY: 120 }, { rotate: Math.PI / 2 }, { scale: 2.4 }]}>
                  <MikingMicArt art="sideLdc" r={22} len={96} cross={44} />
                </Group>
                <Group transform={[{ translateX: 0 }, { translateY: -40 }, { scale: 2.4 }]}>
                  <MikingMicArt art="sdc" r={10.5} len={104} />
                </Group>
              </Group>
            );
          }}
        </FieldStage>
      ),
      badge: 'From above · amber = the left channel’s pickup · blue = the right’s · dashed thin = the opposite-polarity lobes · white dashed = the mono sum (the Mid alone) · a simplified picture: ideal patterns',
      bezel: [
        { k: 'WIDTH k', v: k.toFixed(2), flex: 1 },
        { k: 'SIDE', v: k > 0 ? `${sideDb(k).toFixed(1)} dB` : 'OFF', flex: 1 },
        { k: src.short, v: Math.abs(bal) < 0.05 ? 'CENTRE' : `${Math.abs(bal).toFixed(1)} dB ${bal > 0 ? 'L' : 'R'}`, flex: 1.2 },
        { k: 'MONO', v: '= MID', tint: GREEN, flex: 0.9 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'k',
          label: 'WIDTH',
          value: k / 1.5,
          onChange: (v) => {
            const q = Math.round(v * 1.5 * 20) / 20;
            setK(q);
            setSeen((s) => ({ ...s, low: s.low || q <= 0.1, high: s.high || q >= 1 }));
          },
          format: () => `width k ${k.toFixed(2)} (the Side ${k > 0 ? `${sideDb(k).toFixed(1)} dB` : 'off'})`,
          formatShort: () => k.toFixed(2),
          home: 0.5 / 1.5,
        },
        {
          kind: 'options',
          id: 'src',
          label: 'SOURCE',
          valueLabel: src.short,
          selectedId: sid,
          sticky: true,
          onSelect: (id) => {
            setSid(id);
            setSeen((s) => ({ ...s, src: new Set([...s.src, id]) }));
          },
          options: sources.map((s) => ({ id: s.id, label: s.label, blurb: `${Math.abs(Math.round(s.deg))}° ${s.deg > 0 ? 'left' : s.deg < 0 ? 'right' : ''} of the front`.replace('  ', ' ') })),
        },
      ],
      initialParam: 'k',
    },
    well: (
      <>
        <Landing looking={`Mid-Side · width ${k.toFixed(2)}`} prompt="Change the WIDTH from none to wide, and move the SOURCE. Watch the left and right pickups — and the mono sum, which never moves." />
        <NowLine text={words} />
        <Card>
          <Point title="THE MATRIX">{`Left = Mid + k × Side; Right = Mid − k × Side. Add them and halve: (L + R) ÷ 2 = Mid — the Side cancels. Here the source gives Mid ${d.mono.toFixed(2)}, left ${d.L.toFixed(2)}, right ${d.R.toFixed(2)}.`}</Point>
          <Point title="THE WIDTH">{k === 0 ? 'No Side at all: left and right are the same — mono in two channels.' : k > 1 ? 'Wide: the opposite-polarity rear lobe of each side’s pickup (dashed) grows large, and the image can pull to the edges. Start modest.' : 'A modest width: the left channel favours the left, the right the right, and the centre stays in the centre. Each side already has a small opposite-polarity rear lobe (dashed); it grows with the width.'}</Point>
          <Point title="CHECK">Decode once, with the Side’s positive lobe facing the side you call left; then compare stereo and mono. A source at the positive lobe should appear on the intended side.</Point>
        </Card>
        {complete ? <Note tone="ok">Width is a decision made after the capture: the mono sum keeps the Mid whatever k is. Start with a modest width, check left and right with a gentle source, and listen in mono.</Note> : <Body>Take the width to none and to wide, and look from two sources.</Body>}
      </>
    ),
  };
}

/* ═════════ THE DOWNMIX ═════════ */

type SurroundId = 'centre' | 'rear' | 'front';
const SURROUND: Readonly<Record<SurroundId, { label: string; short: string; ins: Readonly<Partial<Record<'L' | 'C' | 'R' | 'LS' | 'RS', number>>> }>> = {
  centre: { label: 'Commentary in the centre channel', short: 'CENTRE', ins: { C: 1 } },
  rear: { label: 'Crowd in the left surround only', short: 'SURROUND', ins: { LS: 1 } },
  front: { label: 'Action in the left channel only', short: 'FRONT L', ins: { L: 1 } },
};
const SURROUND_IDS: readonly SurroundId[] = ['centre', 'rear', 'front'];
const toDb = (x: number) => (x <= 1e-9 ? -Infinity : 20 * Math.log10(x));

/** The 3/2 → stereo example for one source: L′ and R′ (linear). */
function fold(ins: Partial<Record<'L' | 'C' | 'R' | 'LS' | 'RS', number>>): { Lp: number; Rp: number } {
  const g = (k: 'L' | 'C' | 'R' | 'LS' | 'RS') => ins[k] ?? 0;
  return { Lp: g('L') + ITU_K * g('C') + ITU_K * g('LS'), Rp: g('R') + ITU_K * g('C') + ITU_K * g('RS') };
}

function MeterBoard({ w, h, bars, a11y, title }: { w: number; h: number; bars: readonly { id: string; label: string; db: number; out?: boolean }[]; a11y: string; title: string }) {
  const FLOOR = -24;
  const BW = 120;
  const GAP = 60;
  const H = 600;
  const W = bars.length * (BW + GAP) + GAP;
  const yOf = (db: number) => (Number.isFinite(db) ? (Math.max(FLOOR, Math.min(0, db)) / FLOOR) * H : H);
  const labels: StaticLabel[] = [
    { id: 't', text: title, u: W / 2, v: -90, align: 'center', tone: 'muted' },
    ...bars.flatMap((b, i) => [
      { id: `n.${b.id}`, text: b.label, u: GAP + i * (BW + GAP) + BW / 2, v: H + 70, align: 'center' as const, tone: (b.out ? 'amber' : 'muted') as StaticLabel['tone'] },
      { id: `v.${b.id}`, text: Number.isFinite(b.db) ? `${b.db > -0.05 ? '0' : `−${Math.abs(b.db).toFixed(1)}`} dB` : 'SILENT', u: GAP + i * (BW + GAP) + BW / 2, v: yOf(b.db) - 50, align: 'center' as const },
    ]),
  ];
  return (
    <FieldStage w={w} h={h} view="top" box={{ u0: 0, u1: W, v0: -170, v1: H + 130 }} a11y={a11y} labels={labels}>
      {(px) => (
        <Group>
          {bars.map((b, i) => {
            const u = GAP + i * (BW + GAP);
            const well = make();
            well.addRRect(Skia.RRectXY(Skia.XYWHRect(u, 0, BW, H), 10, 10));
            const fill = make();
            const top = yOf(b.db);
            if (top < H) fill.addRRect(Skia.RRectXY(Skia.XYWHRect(u + 8, top, BW - 16, H - top - 8), 6, 6));
            return (
              <Group key={b.id}>
                <Path path={well} color="#15161a" />
                <Path path={well} style="stroke" strokeWidth={(b.out ? 2.4 : 1.2) * px} color={b.out ? AMBER : '#5b5f69'} />
                <Path path={fill} color={levelColorForDb(b.db, -36, 12)} />
              </Group>
            );
          })}
        </Group>
      )}
    </FieldStage>
  );
}

export function useDownmixStep({ onInteractive, done }: { onInteractive: (id: string) => void; done: boolean }): MikingStep {
  // The web preview harness only: `&fmt=2`, `&src=<n>`.
  const [fmt, setFmt] = useState<'mono' | 'surround'>(() => (devIndex('fmt') === 1 ? 'surround' : 'mono'));
  const [mono, setMono] = useState(() => MONO_SOURCES[Math.min(devIndex('src'), MONO_SOURCES.length - 1)].id);
  const [sur, setSur] = useState<SurroundId>('centre');
  const [seen, setSeen] = useState({ mono: new Set<string>([MONO_SOURCES[0].id]), surround: false });
  const complete = seen.mono.size === MONO_SOURCES.length && seen.surround;
  useEffect(() => {
    if (complete && !done) onInteractive('downmix');
  }, [complete, done, onInteractive]);
  const ms = MONO_SOURCES.find((s) => s.id === mono) ?? MONO_SOURCES[0];
  const change = monoChangeDb(ms.gL, ms.gR, ms.correlated);
  const sv = SURROUND[sur];
  const f = fold(sv.ins);
  const bars =
    fmt === 'mono'
      ? [
          { id: 'L', label: 'L', db: toDb(ms.gL) },
          { id: 'R', label: 'R', db: toDb(ms.gR) },
          { id: 'M', label: 'MONO', db: change, out: true },
        ]
      : [
          ...(['L', 'C', 'R', 'LS', 'RS'] as const).map((c) => ({ id: c, label: c, db: toDb(sv.ins[c] ?? 0) })),
          { id: 'Lp', label: 'L′', db: toDb(f.Lp), out: true },
          { id: 'Rp', label: 'R′', db: toDb(f.Rp), out: true },
        ];
  const words =
    fmt === 'mono'
      ? `${ms.label}: in the mono sum it is ${Math.abs(change) < 0.05 ? 'unchanged' : `${Math.abs(change).toFixed(1)} dB lower`} than in its louder channel.`
      : `${sv.label}: the stereo fold gives L′ ${Number.isFinite(toDb(f.Lp)) ? `${toDb(f.Lp).toFixed(1)} dB` : 'nothing'} and R′ ${Number.isFinite(toDb(f.Rp)) ? `${toDb(f.Rp).toFixed(1)} dB` : 'nothing'}.`;
  return {
    key: 'downmix',
    title: 'The downmix',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <MeterBoard w={w} h={h} bars={bars} a11y={words} title={fmt === 'mono' ? 'STEREO → MONO · M = (L + R) ÷ 2' : `3/2 → STEREO · L′ = L + ${ITU_K} C + ${ITU_K} LS`} />,
      badge: 'Levels against the source’s own level in one channel · an example downmix, a simplified picture — your broadcaster’s coefficients and metadata decide',
      bezel: fmt === 'mono'
        ? [
            { k: 'FORMAT', v: 'MONO', flex: 1 },
            { k: 'SOURCE', v: ms.short, flex: 1.2 },
            { k: 'IN MONO', v: Math.abs(change) < 0.05 ? '0 dB' : `−${Math.abs(change).toFixed(1)} dB`, tint: change < -4 ? RED : undefined, flex: 1.1 },
          ]
        : [
            { k: 'FORMAT', v: '3/2 → 2', flex: 1 },
            { k: 'SOURCE', v: sv.short, flex: 1.2 },
            { k: 'SHARE', v: `${downmixShareDb().toFixed(1)} dB`, flex: 1.1 },
          ],
      params: [
        {
          kind: 'options',
          id: 'fmt',
          label: 'FORMAT',
          valueLabel: fmt === 'mono' ? 'MONO' : '3/2 → 2',
          selectedId: fmt,
          sticky: true,
          onSelect: (id) => {
            setFmt(id as 'mono' | 'surround');
            if (id === 'surround') setSeen((s) => ({ ...s, surround: true }));
          },
          options: [
            { id: 'mono', label: 'Stereo to mono', blurb: 'The practice trial: M = (L + R) ÷ 2.' },
            { id: 'surround', label: 'Five channels to stereo', blurb: 'An example fold-down: L′ = L + 0.7071 C + 0.7071 LS (and the same on the right).' },
          ],
        },
        fmt === 'mono'
          ? {
              kind: 'options',
              id: 'src',
              label: 'SOURCE',
              valueLabel: ms.short,
              selectedId: mono,
              sticky: true,
              onSelect: (id) => {
                setMono(id);
                setSeen((s) => ({ ...s, mono: new Set([...s.mono, id]) }));
              },
              options: MONO_SOURCES.map((s) => ({ id: s.id, label: s.label, blurb: s.correlated ? 'The same signal in both channels it reaches.' : 'Different, unrelated signals in the two channels.' })),
            }
          : {
              kind: 'options',
              id: 'src5',
              label: 'SOURCE',
              valueLabel: sv.short,
              selectedId: sur,
              sticky: true,
              onSelect: (id) => setSur(id as SurroundId),
              options: SURROUND_IDS.map((s) => ({ id: s, label: SURROUND[s].label, blurb: 'One source in one channel of the five.' })),
            },
      ],
      initialParam: 'fmt',
    },
    well: (
      <>
        <Landing looking={fmt === 'mono' ? 'Stereo to mono' : 'Five channels to stereo'} prompt="Try each SOURCE in the mono FORMAT, then the five-channel fold-down. Watch what each output loses — on a real job the numbers only point you to where to listen." />
        <NowLine text={words} />
        <Card>
          {fmt === 'mono' ? (
            <Point title="THE MONO CHECK">Centre speech keeps its level; a cheer in one channel drops about 6 dB; diffuse applause about 3 dB. So a mono check can thin the crowd and leave the speech — or lose a hard-panned effect. Listen at a matched loudness; a meter only helps you find the moment.</Point>
          ) : (
            <Point title="THE FOLD-DOWN">The centre and the surrounds go into each side about 3 dB down (0.7071). This is one example from a broadcast recommendation — every codec and renderer can differ. Keep headroom on the bus: the fold-down adds channels together.</Point>
          )}
          <Point title="KEEP THE EVENT IN THE MAIN CHANNELS">The low-frequency effects channel is an optional extra: keep the engine, the impacts and the venue’s body in the main channels, so the event does not depend on it surviving a downmix.</Point>
        </Card>
        <Card>
          <Point title="ONE DELIVERY EXAMPLE">{`A program measured at ${DELIVERY.lufs} LUFS integrated, ±${DELIVERY.liveLu} LU where live work makes the target impractical, and no true peak above ${DELIVERY.dBTP} dBTP. One broadcaster’s kind of specification — use your broadcaster’s.`}</Point>
          <Point title="TWO DIFFERENT METERS">An input’s peak in dBFS at a converter is not the program’s loudness. Measure the whole program, not a single input — and a limiter cannot undo a clipped preamp.</Point>
        </Card>
        {complete ? <Note tone="ok">Every output gets its own listen — stereo, the declared mono and each downmix — before the event, not after.</Note> : <Body>Try every mono SOURCE, then the five-channel fold-down.</Body>}
      </>
    ),
  };
}

/** The plan distance between two points, re-exported for the lessons' words. */
export const planDist = planRange;
