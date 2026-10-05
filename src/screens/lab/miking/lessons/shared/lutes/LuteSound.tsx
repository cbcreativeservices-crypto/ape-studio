/**
 * HOW IT SOUNDS for the lute family (LESSON_JOURNEY §6 stage 2, §7
 * "Strings"): standing waves on a string from the pure, tested model; the
 * sympathetic strings from the same model; body radiation in words and a
 * simplified section. FULLY SILENT: never a played sound, never a frequency
 * curve presented as data.
 *
 *   PLUCK TO SOUND (rack)  the instrument with a numbered overlay — the
 *                          pluck, the string's swing (grazing a broad bridge
 *                          on the sitar and the veena), the bridge driving
 *                          the soundboard, the sound leaving (and on the
 *                          sitar, the sympathetic strings answering). STEP,
 *                          or PLAY ONCE: a staged reveal that stops at the
 *                          end (no loop, D8); reduced motion steps.
 *   THE STRING'S SHAPES    one IDEAL string (the guitar family's canvas and
 *                          model): shape n, its still points, what the pluck
 *                          point drives. SWING by hand.
 *   SYMPATHETIC STRINGS    (sitar) which shapes of a played note line up
 *                          with a sympathetic string's own (sympathetic.ts).
 *   WHERE IT LEAVES        the radiating regions, tap or step; a simplified
 *                          section of the body, SWING by hand.
 *   ATTACK AND BODY (read) in words, then the three checks.
 * Credit: the pluck sequence reached its end (`soundPath`) + the checks.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { ViewBox, ViewId } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { modeShape, pluckShare, relativeToLowest } from '../guitars/stringPhysics.ts';
import { StringShapesCanvas } from '../guitars/StringSound';
import { postureOf, type BuiltLute, type LuteScene } from './luteModel.ts';
import { OUD, SITAR, VEENA } from './luteSpec.ts';
import { LuteInstrument } from './LuteArt';
import { bounds, curve, make, poly, vp, type Pt } from './luteDraw';
import { answerWord, etRatio, inStep, SHAPES_SHOWN, TUNINGS } from './sympathetic.ts';

const STEP_MS = 1300;
const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const SHAPES = [1, 2, 3, 4, 5, 6];

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

/** The view the pluck is shown in: the face-on view (the veena's is from above). */
const soundView = (sc: LuteScene): ViewId => (sc.kind === 'veena' ? 'top' : 'side');

/** The instrument's box in a view (its own extent, a margin round it). */
function instrumentBox(sc: LuteScene, view: ViewId): ViewBox {
  const pts: Pt[] = [];
  const P = (x: number, y: number, z: number) => pts.push(vp(sc, view, { x, y, z }));
  if (sc.kind === 'oud') {
    const g = sc.oud!;
    P(g.tail, -g.halfMax, 0);
    P(g.tail, g.halfMax, 0);
    P(g.pegboxEnd.x + 40, -g.halfMax, 0);
    P(g.pegboxEnd.x + 40, g.halfMax, 0);
    if (view === 'top') {
      P(g.tail, 0, -OUD.bowlDepth.mm);
      P(g.pegboxEnd.x, 0, g.pegboxEnd.z);
    }
  } else if (sc.kind === 'sitar') {
    const g = sc.sitar!;
    for (const [x, y] of [[g.bottom, -g.gourd.a], [g.bottom, g.gourd.a], [g.gourd.cx + g.gourd.a, -g.gourd.a], [g.top, -110], [g.top, 110], [g.upperGourd.x, -g.upperGourd.r]]) P(x, y, 0);
  } else {
    const g = sc.veena!;
    for (const [x, y] of [[g.tail, -g.bowl.a], [g.tail, g.bowl.a], [g.bowl.cx + g.bowl.a, g.bowl.a], [g.tip, -110], [g.tip, 140], [g.tip, 0]]) P(x, y, 0);
    P(g.gourd.x, 0, g.gourd.z - g.gourd.r);
  }
  const b = bounds(pts);
  const m = 40;
  return { u0: b.x0 - m, u1: b.x1 + m, v0: b.y0 - m - 30, v1: b.y1 + m + 30 };
}

/** The string the sequence plucks, its two ends and its pluck point (instrument frame). */
function pluckGeom(sc: LuteScene, pickMm: number) {
  if (sc.kind === 'oud') {
    const g = sc.oud!;
    const y0 = g.courseYs(0)[3].y;
    const yN = g.courseYs(g.nut)[3].y;
    return { L: g.nut, y0, yN, z: OUD.stringH.mm, pick: pickMm, bridgeW: OUD.bridgeW.mm };
  }
  if (sc.kind === 'sitar') {
    const g = sc.sitar!;
    return { L: g.nut, y0: g.playedYs(0)[1], yN: g.playedYs(g.nut)[1], z: SITAR.jawariH.mm, pick: pickMm, bridgeW: SITAR.jawariW.mm };
  }
  const g = sc.veena!;
  return { L: g.nut, y0: g.melodyYs(0)[1], yN: g.melodyYs(g.nut)[1], z: VEENA.bridgeH.mm, pick: pickMm, bridgeW: VEENA.bridgeW.mm };
}

/* ── the numbered events over the instrument ── */
function PluckCanvas({ sc, w, h, reveal, pickMm, label }: { sc: LuteScene; w: number; h: number; reveal: SharedValue<number>; pickMm: number; label: string }) {
  const view = soundView(sc);
  const box = useMemo(() => instrumentBox(sc, view), [sc, view]);
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [box, w, h, view]);
  const textScale = useStageTextScale();
  const pg = pluckGeom(sc, pickMm);
  const V = (x: number, y: number, z = pg.z): Pt => vp(sc, view, { x, y, z });
  // Drawn amplitude: across the board in this view, many times larger than life.
  const amp = pg.L * 0.035;
  const ov = useMemo(() => {
    const yAt = (x: number) => pg.y0 + ((pg.yN - pg.y0) * x) / pg.L;
    const pulled = poly([V(0, yAt(0)), V(pg.pick, yAt(pg.pick) + amp), V(pg.L, yAt(pg.L))], false);
    const env = make();
    for (const s of [-1, 1]) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 60; i++) {
        const x = (pg.L * i) / 60;
        pts.push(V(x, yAt(x) + s * amp * Math.sin((Math.PI * x) / pg.L)));
      }
      env.addPath(curve(pts));
    }
    const rest = poly([V(0, yAt(0)), V(pg.L, yAt(pg.L))], false);
    // The board's driven region and where sound leaves.
    let topC: Pt;
    let topR: number;
    const rings = make();
    const holeRings = make();
    if (sc.kind === 'oud') {
      topC = V(40, 0, 0);
      topR = sc.oud!.halfMax * 0.75;
      for (const k of [1.05, 1.22, 1.42]) rings.addOval({ x: topC[0] - topR * k, y: topC[1] - topR * k * 0.92, width: topR * 2 * k, height: topR * 2 * k * 0.92 });
      const r0 = V(OUD.roseMainX.mm, 0, 0);
      for (const k of [1.5, 2.1]) holeRings.addCircle(r0[0], r0[1], (OUD.roseMainD.mm / 2) * k);
      for (const s of [-1, 1]) {
        const rs = V(OUD.roseSmallX.mm, s * OUD.roseSmallY.mm, 0);
        holeRings.addCircle(rs[0], rs[1], OUD.roseSmallD.mm * 0.9);
      }
    } else if (sc.kind === 'sitar') {
      topC = V(sc.sitar!.gourd.cx, 0, 0);
      topR = sc.sitar!.tabliR * 0.85;
      for (const k of [1.12, 1.32, 1.55]) rings.addCircle(topC[0], topC[1], topR * k);
    } else {
      topC = V(sc.veena!.bowl.cx, 0, 0);
      topR = sc.veena!.plateR * 0.8;
      for (const k of [1.12, 1.32, 1.55]) rings.addOval({ x: topC[0] - topR * k, y: topC[1] - topR * k * 0.95, width: topR * 2 * k, height: topR * 2 * k * 0.95 });
    }
    const bridge = poly([V(-6, -pg.bridgeW / 2 - 6, 0), V(6, -pg.bridgeW / 2 - 6, 0), V(6, pg.bridgeW / 2 + 6, 0), V(-6, pg.bridgeW / 2 + 6, 0)]);
    // Sitar: the sympathetic strings, lit when they answer.
    const taraf = make();
    if (sc.kind === 'sitar') {
      const g = sc.sitar!;
      for (const t of g.taraf) taraf.addPath(poly([V(SITAR.tarafBridgeX.mm, t.y0, 6), V(t.pegX, -g.neck.half + 3, 6)], false));
    }
    return { pulled, env, rest, topC, topR, rings, holeRings, bridge, taraf, pickPt: V(pg.pick, yAt(pg.pick) + amp), e0: V(0, yAt(0)), e1: V(pg.L, yAt(pg.L)) };
  }, [sc, view, pickMm]); // eslint-disable-line react-hooks/exhaustive-deps
  const o1only = useDerivedValue(() => (reveal.value < 2 ? 1 : 0));
  const o2 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 1)));
  const o3 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 2)));
  const o4 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 3)));
  const o5 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 4)));
  const radiator = sc.kind === 'oud' ? 'FACE' : sc.kind === 'sitar' ? 'BOARD' : 'TOP PLATE';
  const striker = sc.kind === 'oud' ? 'RISHA' : sc.kind === 'sitar' ? 'MIZRAB' : 'FINGER';
  const mid = vp(sc, view, { x: pg.L * 0.6, y: 0, z: pg.z });
  const labels: StaticLabel[] = [
    { id: 'n1', text: `① ${striker}`, u: ov.pickPt[0], v: ov.pickPt[1] + (sc.kind === 'oud' ? 128 : 60), align: 'center', tone: 'amber' },
    { id: 'n2', text: sc.kind === 'oud' ? '② STRING' : '② STRING ON THE BRIDGE', short: '②', u: mid[0], v: mid[1] - 70, align: 'center', tone: 'amber' },
    { id: 'n3', text: `③ BRIDGE → ${radiator}`, short: '③ BRIDGE', u: ov.e0[0], v: ov.topC[1] + ov.topR + 40, align: 'center', tone: 'amber' },
    { id: 'n4', text: '④ SOUND LEAVES', short: '④', u: ov.topC[0], v: ov.topC[1] - ov.topR * 1.4 - 10, align: 'center', tone: 'amber' },
    ...(sc.kind === 'sitar' ? [{ id: 'n5', text: '⑤ SYMPATHETIC STRINGS', short: '⑤', u: vp(sc, view, { x: 520, y: -150, z: 0 })[0], v: vp(sc, view, { x: 520, y: -150, z: 0 })[1], align: 'center' as const, tone: 'amber' as const }] : []),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <LuteInstrument sc={sc} view={view} />
          <Group opacity={o1only}>
            <Path path={ov.pulled} style="stroke" strokeWidth={2.6} color={AMBER} />
            <Circle cx={ov.pickPt[0]} cy={ov.pickPt[1]} r={9} color={AMBER} />
          </Group>
          <Group opacity={o2}>
            <Path path={ov.rest} style="stroke" strokeWidth={1.4} color="#ffffff" opacity={0.6}>
              <DashPathEffect intervals={[8, 6]} />
            </Path>
            <Path path={ov.env} style="stroke" strokeWidth={2.4} color={AMBER} />
            <Circle cx={ov.e0[0]} cy={ov.e0[1]} r={7} color="#ffffff" />
            <Circle cx={ov.e1[0]} cy={ov.e1[1]} r={7} color="#ffffff" />
          </Group>
          <Group opacity={o3}>
            <Circle cx={ov.topC[0]} cy={ov.topC[1]} r={ov.topR}>
              <RadialGradient c={vec(ov.topC[0], ov.topC[1])} r={ov.topR} colors={['rgba(111,168,255,0.55)', 'rgba(111,168,255,0.18)', 'rgba(111,168,255,0)']} />
            </Circle>
            <Path path={ov.bridge} style="stroke" strokeWidth={5} color={AMBER} />
          </Group>
          <Group opacity={o4}>
            <Path path={ov.rings} style="stroke" strokeWidth={3} color={BLUE} opacity={0.75}>
              <DashPathEffect intervals={[18, 10]} />
            </Path>
            <Path path={ov.holeRings} style="stroke" strokeWidth={2.6} color={BLUE} opacity={0.85}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          </Group>
          {sc.kind === 'sitar' ? (
            <Group opacity={o5}>
              <Path path={ov.taraf} style="stroke" strokeWidth={4} color={AMBER} opacity={0.75} />
            </Group>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the sympathetic strings: which shapes line up ── */
function SympatheticCanvas({ w, h, t, pairIdx, swing, label }: { w: number; h: number; t: number; pairIdx: number; swing: number; label: string }) {
  const L = 1000;
  const A = 110;
  const box: ViewBox = { u0: -40, u1: 1540, v0: -330, v1: 330 };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const textScale = useStageTextScale();
  const pairs = inStep(t);
  const pair = pairs[Math.min(pairIdx, pairs.length - 1)];
  const n = pair?.n ?? 1;
  const m = pair?.m ?? 1;
  const yP = -170;
  const yS = 150;
  const strings = useMemo(() => {
    const sh = (shape: number, y: number, a: number) => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 140; i++) {
        const s = i / 140;
        pts.push([s * L, y - a * modeShape(shape, s)]);
      }
      return curve(pts);
    };
    return { played: sh(n, yP, A * swing), symp: sh(m, yS, pair ? A * 0.8 * swing : 0) };
  }, [n, m, swing, pair]); // eslint-disable-line react-hooks/exhaustive-deps
  // The ladder: pitch on a log scale, both strings' first eight shapes.
  const lo = Math.min(1, t);
  const hi = Math.max(SHAPES_SHOWN, SHAPES_SHOWN * t);
  const yOf = (p: number) => 290 - (580 * Math.log2(p / lo)) / Math.log2(hi / lo);
  const xP = 1200;
  const xS = 1440;
  const rungsP = Array.from({ length: SHAPES_SHOWN }, (_, i) => yOf(i + 1));
  const rungsS = Array.from({ length: SHAPES_SHOWN }, (_, i) => yOf((i + 1) * t));
  const labels: StaticLabel[] = [
    { id: 'lp', text: 'PLAYED STRING', u: 0, v: yP - A - 34, align: 'left', tone: 'amber' },
    { id: 'ls', text: pair ? 'SYMPATHETIC STRING · ANSWERS' : 'SYMPATHETIC STRING · BARELY MOVES', short: 'SYMPATHETIC', u: 0, v: yS - A - 30, align: 'left', tone: 'blue' },
    { id: 'hp', text: 'PLAYED', u: xP, v: -318, align: 'center', tone: 'muted' },
    { id: 'hs', text: 'SYMP.', u: xS, v: -318, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {[yP, yS].map((y) => (
            <Group key={`base${y}`}>
              <Line p1={vec(0, y)} p2={vec(L, y)} color="#ffffff" strokeWidth={2} opacity={0.3}>
                <DashPathEffect intervals={[14, 10]} />
              </Line>
              {[0, L].map((x) => (
                <Path key={`p${x}`} path={poly([[x - 11, y - 30], [x + 11, y - 30], [x + 11, y + 30], [x - 11, y + 30]])}>
                  <LinearGradient start={vec(x - 11, y - 30)} end={vec(x + 11, y + 30)} colors={['#fbf6ea', '#d8cfba', '#a99d84']} />
                </Path>
              ))}
            </Group>
          ))}
          <Path path={strings.played} style="stroke" strokeWidth={6} strokeCap="round" color={AMBER} />
          <Path path={strings.symp} style="stroke" strokeWidth={5} strokeCap="round" color={pair ? BLUE : '#8a8f9c'} />
          {/* the ladder: both strings' shapes, the pairs in step joined */}
          <Line p1={vec(xP, -300)} p2={vec(xP, 300)} color="#5d616c" strokeWidth={3} />
          <Line p1={vec(xS, -300)} p2={vec(xS, 300)} color="#5d616c" strokeWidth={3} />
          {rungsP.map((y, i) => (y >= -300 && y <= 300 ? <Line key={`rp${i}`} p1={vec(xP - 50, y)} p2={vec(xP + 50, y)} color={AMBER} strokeWidth={i + 1 === n && pair ? 8 : 4} opacity={0.9} /> : null))}
          {rungsS.map((y, i) => (y >= -300 && y <= 300 ? <Line key={`rs${i}`} p1={vec(xS - 50, y)} p2={vec(xS + 50, y)} color={BLUE} strokeWidth={i + 1 === m && pair ? 8 : 4} opacity={0.9} /> : null))}
          {pairs.map((q) => (
            <Line key={`pq${q.n}_${q.m}`} p1={vec(xP + 50, yOf(q.n))} p2={vec(xS - 50, yOf(q.m * t))} color="#ffffff" strokeWidth={q === pair ? 5 : 2.5} opacity={q === pair ? 0.95 : 0.55} />
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── where it leaves: the face lit by region, a simplified section below ── */
function WhereCanvas({ sc, w, h, regionId, swing, label }: { sc: LuteScene; w: number; h: number; regionId: string; swing: number; label: string }) {
  const view = soundView(sc);
  const faceH = h * 0.6;
  const box = useMemo(() => instrumentBox(sc, view), [sc, view]);
  const xf = useMemo(() => fitXform(view, box, w, faceH, 6), [box, w, faceH, view]);
  const secH = h - faceH;
  const textScale = useStageTextScale();
  // The section in the instrument's own (x, z): the board, the body below.
  const sec = useMemo(() => {
    let x0: number;
    let x1: number;
    let depth: (x: number) => number;
    let hole: { x: number; r: number } | null = null;
    let drive = 0;
    let spread = 120;
    let extra: { x0: number; x1: number; z0: number; z1: number } | null = null;
    let gourd: { x: number; z: number; r: number } | null = null;
    if (sc.kind === 'oud') {
      const g = sc.oud!;
      x0 = g.tail;
      x1 = g.joint;
      depth = g.depth;
      hole = { x: OUD.roseMainX.mm, r: OUD.roseMainD.mm / 2 };
      drive = 20;
      spread = 150;
    } else if (sc.kind === 'sitar') {
      const g = sc.sitar!;
      x0 = g.bottom;
      x1 = g.gourd.cx + g.gourd.a;
      depth = (x: number) => {
        const dx = (x - g.gourd.cx) / g.gourd.a;
        if (Math.abs(dx) >= 1) return 0;
        const r = Math.sqrt(1 - dx * dx);
        return -g.gourd.zc + g.gourd.c * r;
      };
      drive = -20;
      spread = 110;
      extra = { x0: g.gourd.cx + g.gourd.a - 20, x1: 520, z0: -g.neck.depth, z1: 0 };
    } else {
      const g = sc.veena!;
      x0 = g.tail;
      x1 = g.bowl.cx + g.bowl.a;
      depth = (x: number) => {
        const dx = (x - g.bowl.cx) / g.bowl.a;
        return Math.abs(dx) >= 1 ? 0 : -g.bowl.zc + g.bowl.c * Math.sqrt(1 - dx * dx);
      };
      drive = -40;
      spread = 130;
      extra = { x0: g.bowl.cx + g.bowl.a - 20, x1: g.gourd.x + g.gourd.r + 30, z0: -g.neck.depth, z1: 0 };
      gourd = { x: g.gourd.x, z: g.gourd.z, r: g.gourd.r };
    }
    const top = make();
    const Am = 24 * swing;
    for (let i = 0; i <= 120; i++) {
      const x = x0 + ((x1 - x0) * i) / 120;
      const bump = Math.exp(-(((x - drive) / spread) ** 2));
      const ends = Math.sin((Math.PI * (x - x0)) / (x1 - x0));
      const z = Am * bump * ends;
      if (i === 0) top.moveTo(x, z);
      else top.lineTo(x, z);
    }
    const back: Pt[] = [];
    for (let i = 0; i <= 80; i++) {
      const x = x0 + ((x1 - x0) * i) / 80;
      back.push([x, -depth(x)]);
    }
    const D = Math.max(...back.map((p) => -p[1]), gourd ? -gourd.z + gourd.r : 0);
    return { top, back: curve(back), x0, x1, D, hole, extra, gourd };
  }, [sc, swing]);
  // The section is drawn with +z UP (the group flips y): its box is in −z.
  const secBox: ViewBox = { u0: sec.x0 - 40, u1: (sec.extra?.x1 ?? sec.x1) + 40, v0: -95, v1: sec.D + 30 };
  const xs = useMemo(() => fitXform('top', secBox, w, secH, 6), [w, secH, secBox.u0, secBox.u1, secBox.v0]); // eslint-disable-line react-hooks/exhaustive-deps
  const regs = useMemo(() => {
    const area = (r: string) => {
      if (sc.kind === 'oud') {
        if (r === 'roses') return [{ c: vp(sc, view, { x: OUD.roseMainX.mm, y: 0, z: 0 }), r: OUD.roseMainD.mm * 0.75 }, { c: vp(sc, view, { x: OUD.roseSmallX.mm, y: -OUD.roseSmallY.mm, z: 0 }), r: 40 }, { c: vp(sc, view, { x: OUD.roseSmallX.mm, y: OUD.roseSmallY.mm, z: 0 }), r: 40 }];
        if (r === 'strings') return [{ c: vp(sc, view, { x: sc.oud!.joint + 60, y: 0, z: 0 }), r: 90 }];
        return [{ c: vp(sc, view, { x: 40, y: 0, z: 0 }), r: 150 }];
      }
      if (sc.kind === 'sitar') {
        const g = sc.sitar!;
        if (r === 'jawari') return [{ c: vp(sc, view, { x: 0, y: 0, z: 0 }), r: 60 }];
        if (r === 'taraf') return [{ c: vp(sc, view, { x: 420, y: -10, z: 0 }), r: 170 }];
        return [{ c: vp(sc, view, { x: g.gourd.cx, y: 0, z: 0 }), r: g.tabliR }];
      }
      const g = sc.veena!;
      if (r === 'bridge') return [{ c: vp(sc, view, { x: 0, y: 0, z: 0 }), r: 60 }];
      if (r === 'gourd') return [{ c: vp(sc, view, { x: g.gourd.x, y: 0, z: g.gourd.z }), r: g.gourd.r + 10 }];
      return [{ c: vp(sc, view, { x: g.bowl.cx, y: 0, z: 0 }), r: g.plateR }];
    };
    return area(regionId.split('.').pop() ?? '');
  }, [sc, view, regionId]);
  const lit = regionId.split('.').pop() ?? '';
  const board = sc.kind === 'oud' ? 'FACE' : sc.kind === 'sitar' ? 'TABLI' : 'TOP PLATE';
  const body = sc.kind === 'oud' ? 'BOWL' : sc.kind === 'sitar' ? 'GOURD' : 'RESONATOR';
  const secLabels: StaticLabel[] = [
    { id: 'st', text: board, u: (sec.x0 + sec.x1) / 2 - 40, v: -60, align: 'center', tone: 'blue' },
    { id: 'sb', text: body, u: (sec.x0 + sec.x1) / 2, v: sec.D * 0.55, align: 'center', tone: 'muted' },
    ...(sec.hole ? [{ id: 'sh', text: 'AIR ⇅', u: sec.hole.x, v: -60, align: 'center' as const, tone: 'amber' as const }] : []),
    ...(sec.extra ? [{ id: 'sn', text: 'NECK', u: (sec.extra.x0 + sec.extra.x1) / 2, v: -40, align: 'center' as const, tone: 'muted' as const }] : []),
    ...(sec.gourd ? [{ id: 'sg', text: 'GOURD · SUPPORT', short: 'SUPPORT', u: sec.gourd.x, v: -sec.gourd.z, align: 'center' as const, tone: 'muted' as const }] : []),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <LuteInstrument sc={sc} view={view} dim={0.85} />
          {regs.map((q, i) =>
            lit === 'strings' || lit === 'taraf' ? (
              <Circle key={`rg${i}`} cx={q.c[0]} cy={q.c[1]} r={q.r} color="rgba(255,198,77,0.3)" />
            ) : (
              <Circle key={`rg${i}`} cx={q.c[0]} cy={q.c[1]} r={q.r * 1.15}>
                <RadialGradient c={vec(q.c[0], q.c[1])} r={q.r * 1.15} colors={['rgba(111,168,255,0.6)', 'rgba(111,168,255,0.2)', 'rgba(111,168,255,0)']} />
              </Circle>
            ),
          )}
        </Group>
      </Canvas>
      <View style={{ position: 'absolute', left: 0, top: faceH, width: w, height: secH }}>
        <Canvas style={{ width: w, height: secH }} accessible accessibilityRole="image" accessibilityLabel={`A simplified section through the ${body.toLowerCase()}: the ${board.toLowerCase()} bowing in its lowest motion over the air inside${sec.hole ? ', the air moving in and out through the rose' : ''}.`}>
          <Group transform={[{ translateX: xs.ox }, { translateY: xs.oy }, { scale: xs.s }, { scaleY: -1 }]}>
            <Path path={sec.back} style="stroke" strokeWidth={6} color="#8a5229" />
            {sec.extra ? <Path path={poly([[sec.extra.x0, sec.extra.z0], [sec.extra.x1, sec.extra.z0], [sec.extra.x1, sec.extra.z1], [sec.extra.x0, sec.extra.z1]])} color="#5a3a20" /> : null}
            {sec.gourd ? <Circle cx={sec.gourd.x} cy={sec.gourd.z} r={sec.gourd.r} style="stroke" strokeWidth={5} color="#8a5229" opacity={0.7} /> : null}
            <Path path={sec.top} style="stroke" strokeWidth={7} color={BLUE} strokeCap="round" />
            {sec.hole ? (
              <Group>
                <Line p1={vec(sec.hole.x - sec.hole.r, 0)} p2={vec(sec.hole.x + sec.hole.r, 0)} color="#0a0806" strokeWidth={12} />
                <Line p1={vec(sec.hole.x, -sec.D * 0.45)} p2={vec(sec.hole.x, 70)} color={AMBER} strokeWidth={5} opacity={0.85}>
                  <DashPathEffect intervals={[10, 6]} />
                </Line>
              </Group>
            ) : null}
          </Group>
        </Canvas>
        <StaticLabels labels={secLabels} xf={xs} scale={textScale} w={w} />
      </View>
    </View>
  );
}

/* ═══════════════════════════════ the page ═══════════════════════════════ */

export function makeLuteSoundPage(built: BuiltLute) {
  const sc = built.scene;
  // The sitar is shown LEVEL here (its posture tilts it 45°, which would
  // shrink it on the glass); the oud and the veena keep their posture.
  const face: LuteScene = sc.kind === 'sitar' ? { ...sc, posture: postureOf('oud') } : sc;
  return function LuteSoundPage({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps): ReactNode {
    const S = lesson.sound;
    const C = copyOf(lesson);
    const n = S.stages.length;
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();
    const reveal = useSharedValue(1);
    const [shown, setShown] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [predicted, setPredicted] = useState<string | null>(null);
    useAnimatedReaction(
      () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setShown, cur);
      },
    );
    const stop = () => {
      cancelAnimation(reveal);
      setPlaying(false);
    };
    const goTo = (k: number) => {
      cancelAnimation(reveal);
      setPlaying(false);
      reveal.value = k;
      setShown(k);
    };
    const play = () => {
      if (playing) {
        stop();
        return;
      }
      const from = shown >= n ? 1 : Math.floor(reveal.value);
      if (!motion) {
        goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
        return;
      }
      reveal.value = from;
      setPlaying(true);
      reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setPlaying, false);
      });
    };
    useEffect(() => {
      if ((hidden || !focused) && playing) stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, focused]);
    useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [shown, n, interactiveDone, onInteractive]);
    const stage = S.stages[shown - 1];
    const stageText = (i: number) => S.stages[i].text;

    /* the string's shapes */
    const PICKS = C.sound.strikes;
    const [shapeIdx, setShapeIdx] = useState(0);
    const [pickId, setPickId] = useState<string>(C.sound.strikeDefault);
    const [swing, setSwing] = useState(1);
    const shapeN = SHAPES[shapeIdx];
    const pick = PICKS.find((p) => p.id === pickId) ?? PICKS[0];
    const Ls = pluckGeom(sc, 0).L;
    const pFrac = Math.max(0.01, Math.min(0.99, pick.mm / Ls));
    const share = pluckShare(shapeN, pFrac);
    const sharePct = Math.round(share * 100);
    const rel = relativeToLowest(shapeN, pFrac);

    /* sympathetic strings (sitar) */
    const [tuneId, setTuneId] = useState<string>(TUNINGS[0].id);
    const [pairIdx, setPairIdx] = useState(0);
    const [sSwing, setSSwing] = useState(1);
    const tune = TUNINGS.find((q) => q.id === tuneId) ?? TUNINGS[0];
    const t = etRatio(tune.semis);
    const pairs = inStep(t);
    const pair = pairs[Math.min(pairIdx, pairs.length - 1)];
    const answer = answerWord(pairs);

    /* where it leaves */
    const regions = lesson.model.regions;
    const [regId, setRegId] = useState(regions[0]?.id ?? '');
    const reg = regions.find((r) => r.id === regId) ?? regions[0];
    const [topSwing, setTopSwing] = useState(1);

    const strikeParams: DockParam[] = useMemo(
      () => [
        {
          kind: 'fader',
          id: 'step',
          label: 'STEP',
          value: (shown - 1) / Math.max(1, n - 1),
          onChange: (v) => goTo(1 + Math.round(v * (n - 1))),
          format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`,
          formatShort: () => `${shown} / ${n}`,
        },
        { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [shown, n, stage, playing, motion],
    );
    const strikeBezel: BezelItem[] = [
      { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
      ...C.sound.cells.map((c) => ({ k: c.k, v: c.at[Math.min(c.at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 })),
    ];
    const swingFader = (id: string, value: number, set: (v: number) => void, still: string): DockParam => ({
      kind: 'fader',
      id,
      label: 'SWING',
      value: (value + 1) / 2,
      home: 1,
      onChange: (v) => set(Math.round((v * 2 - 1) * 20) / 20),
      format: () => (Math.abs(value) < 0.05 ? still : `${Math.round(Math.abs(value) * 100)} % of its swing, ${value > 0 ? 'one way' : 'the other way'}`),
      formatShort: () => `${Math.round(value * 100)} %`,
    });
    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: shapeIdx / (SHAPES.length - 1),
        onChange: (v) => setShapeIdx(Math.round(v * (SHAPES.length - 1))),
        format: () => `shape ${shapeN} · ${shapeN - 1} still point${shapeN - 1 === 1 ? '' : 's'}`,
        formatShort: () => `${shapeN}`,
      },
      swingFader('swing', swing, setSwing, 'passing through straight'),
      { kind: 'options', id: 'pick', label: C.sound.striker, valueLabel: pick.label, selectedId: pickId, onSelect: (id) => setPickId(id), sticky: true, options: PICKS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })) },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${shapeN}`, flex: 0.7 },
      { k: 'RATIO', v: `× ${shapeN}`, sub: 'vs lowest', flex: 0.8 },
      { k: `UNDER ${C.sound.striker}`, v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
      { k: 'STILL POINTS', v: shapeN === 1 ? 'ENDS ONLY' : `${shapeN - 1}`, flex: 1.1 },
    ];
    const sympParams: DockParam[] = [
      {
        kind: 'options',
        id: 'tune',
        label: 'TUNED TO',
        valueLabel: tune.label,
        selectedId: tuneId,
        onSelect: (id) => {
          setTuneId(id);
          setPairIdx(0);
        },
        sticky: true,
        options: TUNINGS.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      },
      {
        kind: 'fader',
        id: 'pair',
        label: 'PAIR',
        value: pairs.length > 1 ? Math.min(pairIdx, pairs.length - 1) / (pairs.length - 1) : 0,
        onChange: (v) => setPairIdx(Math.round(v * Math.max(0, pairs.length - 1))),
        format: () => (pair ? `played shape ${pair.n} ↔ sympathetic shape ${pair.m}` : 'no shapes in step'),
        formatShort: () => (pair ? `${pair.n}↔${pair.m}` : '—'),
      },
      swingFader('swing', sSwing, setSSwing, 'both passing through straight'),
    ];
    const sympBezel: BezelItem[] = [
      { k: 'IN STEP', v: `${pairs.length}`, sub: `of the first ${SHAPES_SHOWN}`, flex: 0.9 },
      { k: 'THIS PAIR', v: pair ? `${pair.n} ↔ ${pair.m}` : 'NONE', flex: 1 },
      { k: 'IT ANSWERS', v: answer, flex: 1.4, tint: answer === 'BARELY' ? '#ff6b5e' : undefined },
    ];
    const regParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'region',
        label: 'REGION',
        value: regions.length > 1 ? Math.max(0, regions.findIndex((r) => r.id === regId)) / (regions.length - 1) : 0,
        onChange: (v) => {
          const r = regions[Math.round(v * (regions.length - 1))];
          if (r) setRegId(r.id);
        },
        format: () => reg?.label.toUpperCase() ?? '—',
        formatShort: () => (reg?.label ?? '').toUpperCase().slice(0, 9),
      },
      swingFader('swing', topSwing, setTopSwing, 'the board passing through rest'),
    ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const pickMm = PICKS.find((p) => p.id === C.sound.strikeDefault)?.mm ?? 60;
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: 'Pluck to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <PluckCanvas sc={face} w={w} h={h} reveal={reveal} pickMm={pickMm} label={`${C.sound.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
          badge: 'The order of events, not their speed · string and board motion drawn much larger than they really move · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={C.sound.looking[sc.kind] ?? 'The instrument'} prompt="STEP through the pluck, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
            </Card>
            {reached && predicted != null && C.sound.reveal ? <Note tone="ok">{`You predicted “${predicted}”. ${C.sound.reveal}`}</Note> : null}
            {reached ? <Note>{C.sound.after}</Note> : null}
          </>
        ),
      },
      {
        key: 'shapes',
        title: 'The string’s shapes',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StringShapesCanvas w={w} h={h} n={shapeN} swing={swing} pFrac={pFrac} endWords={['BRIDGE', 'NUT']} pickWord={C.sound.striker} label={`One string between its two fixed ends, in shape ${shapeN}: ${shapeN - 1} still points. Under the ${C.sound.strikerPhrase}, ${pick.label.toLowerCase()}, the string moves ${sharePct} percent of this shape's peak.`} />
          ),
          badge: 'A simplified picture: one ideal string, fixed at both ends · motion drawn larger',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking={`One string · shape ${shapeN}`} prompt={`Step through SHAPE, then try each ${C.sound.striker} point. Which shapes does a pluck in the exact middle leave still?`} />
            <Card>
              <Point title={`SHAPE ${shapeN} · ${shapeN === 1 ? 'STILL ONLY AT THE ENDS' : `${shapeN - 1} STILL POINT${shapeN - 1 === 1 ? '' : 'S'}`}`}>
                {`A plucked string vibrates in several shapes at once; this is one of them. ${shapeN === 1 ? 'It is the lowest — the note you name.' : `Its pitch is exactly ${shapeN} times the lowest — a whole number, which is why a string sounds clearly “pitched”.`} Under the ${C.sound.strikerPhrase} (${pick.label.toLowerCase()}) the string moves ${sharePct} % of this shape’s peak, so the pluck ${share < 0.05 ? `does not set this shape moving at all: the ${C.sound.strikerPhrase} is on a still point` : share < 0.4 ? 'sets it moving only a little' : 'sets it moving strongly'}.${shapeN > 1 && share >= 0.05 ? ` On this ideal string it starts at about ${Math.round(Math.abs(rel) * 100)} % of the lowest shape’s size.` : ''}`}
              </Point>
            </Card>
            {C.sound.shapesNotes.map((x) => (
              <Note key={x.slice(0, 24)}>{x}</Note>
            ))}
          </>
        ),
      },
      ...(sc.kind === 'sitar'
        ? [
            {
              key: 'symp',
              title: 'Sympathetic strings',
              kind: 'COMPARE' as const,
              layout: 'rack' as const,
              rack: {
                render: (w: number, h: number) => (
                  <SympatheticCanvas w={w} h={h} t={t} pairIdx={pairIdx} swing={sSwing} label={`A played string and a sympathetic string tuned ${tune.label.toLowerCase()}. ${pairs.length} of their first ${SHAPES_SHOWN} shapes are in step${pair ? `; shown: played shape ${pair.n} with sympathetic shape ${pair.m}` : ''}. The sympathetic string answers ${answer.toLowerCase()}. Motion drawn larger; no levels implied.`} />
                ),
                badge: 'A simplified picture: two ideal strings · which shapes line up, not how loud · motion drawn larger',
                bezel: sympBezel,
                params: sympParams,
                initialParam: 'tune',
              },
              well: (
                <>
                  <Landing looking={`Played string and one sympathetic string · ${tune.label.toLowerCase()}`} prompt="Change TUNED TO, then step through PAIR. Where the rungs line up, the sympathetic string is pushed in step with itself." />
                  <Card>
                    <Point title={pair ? `IN STEP · PLAYED ${pair.n} ↔ SYMPATHETIC ${pair.m}` : 'NOTHING IN STEP'}>
                      {pair
                        ? `The sympathetic string is never plucked. The bridge passes it the played string’s motion, and it builds up only where one of its own shapes sits at the same pitch as one of the played note’s. Here ${pairs.length} pair${pairs.length === 1 ? '' : 's'} of the first ${SHAPES_SHOWN} line${pairs.length === 1 ? 's' : ''} up${pairs.some((q) => q.n === 1 && q.m === 1) ? ' — including both lowest shapes, so it answers most readily' : ''}.`
                        : 'None of the first shapes line up: pushed out of step with itself, the sympathetic string barely moves. Play a note that matches its tuning, and it rings on.'}
                    </Point>
                  </Card>
                  <Note>This is why the sympathetic strings shimmer after some notes and stay quiet after others: the player tunes them for the music. A mic toward the neck hears more of that shimmer — if this sitar has sympathetic strings at all.</Note>
                </>
              ),
            },
          ]
        : []),
      {
        key: 'where',
        title: 'Where it leaves',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => <WhereCanvas sc={face} w={w} h={h} regionId={reg?.id ?? ''} swing={topSwing} label={`${C.sound.subject}. Highlighted: ${reg?.label ?? ''}. ${reg?.note ?? ''} Below, a simplified section of the body.`} />,
          badge: 'A simplified picture: the lowest motion only, drawn larger · no levels or pitches implied',
          bezel: [
            { k: 'REGION', v: (reg?.label ?? '—').toUpperCase(), flex: 1.6 },
            { k: 'SWING', v: `${Math.round(topSwing * 100)} %`, flex: 0.8 },
          ],
          params: regParams,
          initialParam: 'region',
        },
        well: (
          <>
            <Landing looking="The board, and a simplified section below" prompt="Step through REGION, then drag SWING and watch the section." />
            {reg ? (
              <Card>
                <Point title={reg.label.toUpperCase()}>{reg.note}</Point>
              </Card>
            ) : null}
            <Note>{C.sound.coupledNote}</Note>
          </>
        ),
      },
      {
        key: 'body',
        title: 'Attack and body',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ATTACK">{S.attack}</Point>
              <Point title="BODY">{S.body}</Point>
            </Card>
            <Note>{C.sound.silentNote}</Note>
            {!reached ? <Note tone="warn">The pluck sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

export const LUTE_SOUND_STEPS = (sc: LuteScene) => (sc.kind === 'sitar' ? 5 : 4);
