/**
 * HOW IT SOUNDS for the plucked-string family (LESSON_JOURNEY §6 stage 2, §7
 * "Strings": standing waves on a string from a pure, tested model; body
 * radiation in words). FULLY SILENT: the page shows how a pluck becomes sound
 * and where the sound leaves — never a played sound, never a frequency curve.
 *
 *   PLUCK TO SOUND (rack)   the instrument from the front with a numbered
 *                           overlay: ① the pick pulls a string aside; ② it
 *                           swings between its two still ends; ③ it rocks the
 *                           bridge, which drives the top (a banjo's head, a
 *                           resonator's cone); ④ sound leaves the top and the
 *                           opening. STEP, or PLAY ONCE (a staged reveal that
 *                           stops at ④ — no loop, D8); reduced motion steps.
 *   THE STRING'S SHAPES (rack) one IDEAL string (stringPhysics.ts): shape n,
 *                           its n − 1 still points, its whole-number ratio,
 *                           and how much moves under the pick — SWING by hand.
 *   THE HEAD'S SHAPES (rack, banjo only) the head's ideal membrane shapes,
 *                           driven off-centre at the bridge (the drum pages'
 *                           own Bessel tables, MembraneFace).
 *   WHERE IT LEAVES (rack)  the radiating regions, tap or step through; the
 *                           top's lowest motion and the air through the
 *                           opening in a simplified section, SWING by hand.
 *   ATTACK AND BODY (read)  in words, then the three checks.
 * Credit: the pluck sequence reached its end (`soundPath`) + the checks.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { HEAD_SHAPES, strikeShare } from '../../../engine/physics/membrane.ts';
import { MembraneFace } from '../../../engine/scene/MembraneFace';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { modeShape, pluckShare, relativeToLowest, stillPoints } from './stringPhysics.ts';
import type { BuiltGuitarModel, GuitarScene } from './guitarModel.ts';
import { GuitarFace } from './GuitarArt';

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

/** The face view's box: the instrument alone (frame G x, y). */
function faceBox(sc: GuitarScene) {
  const g = sc.g;
  const half = Math.max(g.lowerH, (g.spec.resonatorBack?.d.mm ?? 0) / 2);
  return { u0: g.tail - 40, u1: g.L + g.spec.neck.headLen.mm + 30, v0: -half - 60, v1: half + 60 };
}

/** Which string the sequence plucks (the middle of the set). */
function pluckedString(sc: GuitarScene): number {
  const n = sc.g.stringYs(0).length;
  return Math.floor(n / 2) - (sc.g.spec.strings.perCourse === 2 ? 1 : 0);
}

/* ── ① – ④ over the instrument (the overlay fades in by event) ── */
function PluckSequenceCanvas({ sc, w, h, reveal, pickMm, label }: { sc: GuitarScene; w: number; h: number; reveal: SharedValue<number>; pickMm: number; label: string }) {
  const g = sc.g;
  const sp = g.spec;
  const box = faceBox(sc);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box.u0, box.u1, box.v0, box.v1, w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const textScale = useStageTextScale();
  const k = pluckedString(sc);
  const A = Math.max(14, g.L * 0.03); // drawn amplitude, many times larger than life
  const paths = useMemo(() => {
    const y0 = g.stringYs(0)[k];
    const yN = g.stringYs(g.L)[k];
    const yAt = (x: number) => y0 + ((yN - y0) * x) / g.L;
    const pulled = Skia.Path.Make();
    pulled.moveTo(0, yAt(0));
    pulled.lineTo(pickMm, yAt(pickMm) + A);
    pulled.lineTo(g.L, yAt(g.L));
    const env = Skia.Path.Make();
    for (const s of [-1, 1]) {
      for (let i = 0; i <= 60; i++) {
        const x = (g.L * i) / 60;
        const y = yAt(x) + s * A * Math.sin((Math.PI * x) / g.L);
        if (i === 0) env.moveTo(x, y);
        else env.lineTo(x, y);
      }
    }
    const rest = Skia.Path.Make();
    rest.moveTo(0, yAt(0));
    rest.lineTo(g.L, yAt(g.L));
    // The radiating rings: round the top's moving region and the opening.
    const ringsTop = Skia.Path.Make();
    const topC = sp.body.pot ? { x: sp.body.pot.cx.mm, y: 0 } : sp.cone ? { x: sp.cone.x.mm, y: 0 } : { x: sp.body.xLower.mm + 20, y: 0 };
    const topR = sp.body.pot ? sp.body.pot.d.mm / 2 : sp.cone ? sp.cone.d.mm / 2 : g.lowerH * 0.72;
    for (const kk of [1.08, 1.24, 1.42]) ringsTop.addOval(Skia.XYWHRect(topC.x - topR * kk, -topR * kk * 0.92, topR * 2 * kk, topR * 2 * kk * 0.92));
    const ringsHole = Skia.Path.Make();
    if (sp.opening.kind === 'round' || sp.opening.kind === 'oval') for (const kk of [1.5, 2.1]) ringsHole.addOval(Skia.XYWHRect(g.hole.x - g.hole.r * kk, -g.hole.r2 * kk, g.hole.r * 2 * kk, g.hole.r2 * 2 * kk));
    if (sp.opening.kind === 'coverplate' && sp.opening.ports) for (const s of [-1, 1]) ringsHole.addCircle(sp.opening.ports.x.mm, s * sp.opening.ports.y.mm, sp.opening.ports.d.mm * 0.8);
    if (sp.opening.kind === 'fholes') for (const s of [-1, 1]) ringsHole.addOval(Skia.XYWHRect(sp.opening.x.mm - 70, s * (sp.opening.d2?.mm ?? 60) - 22, 140, 44));
    return { pulled, env, rest, ringsTop, ringsHole, topC, topR, y0: yAt(pickMm) };
  }, [sc, k, pickMm, A]); // eslint-disable-line react-hooks/exhaustive-deps
  // Each event fades in as the reveal reaches it (and stays once shown).
  const o2 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 1)));
  const o3 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 2)));
  const o4 = useDerivedValue(() => Math.max(0, Math.min(1, reveal.value - 3)));
  // ① is shown only until the string is released.
  const o1only = useDerivedValue(() => (reveal.value < 2 ? 1 : 0));
  const labels: StaticLabel[] = [
    { id: 'n1', text: '① PICK', u: pickMm, v: paths.y0 + A + 34, align: 'center', tone: 'amber' },
    { id: 'n2', text: '② STRING', u: g.L * 0.62, v: -A - 30, align: 'center', tone: 'amber' },
    { id: 'n3', text: sp.body.pot ? '③ BRIDGE → HEAD' : sp.cone ? '③ BRIDGE → CONE' : '③ BRIDGE → TOP', short: '③', u: sp.bridge.x.mm, v: (sp.body.pot ? sp.body.pot.d.mm / 2 : g.lowerH) + 30, align: 'center', tone: 'amber' },
    { id: 'n4', text: '④ SOUND LEAVES', short: '④', u: paths.topC.x, v: -(paths.topR * 1.3) - 8, align: 'center', tone: 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <GuitarFace sc={sc} />
          {/* ① the pick pulls the string aside */}
          <Group opacity={o1only}>
            <Path path={paths.pulled} style="stroke" strokeWidth={2.4} color={AMBER} />
            <Path path={tri(pickMm, paths.y0 + A + 6)} color={AMBER} />
          </Group>
          {/* ② the swing between the still ends (rest line dashed) */}
          <Group opacity={o2}>
            <Path path={paths.rest} style="stroke" strokeWidth={1.4} color="#ffffff" opacity={0.6}>
              <DashPathEffect intervals={[8, 6]} />
            </Path>
            <Path path={paths.env} style="stroke" strokeWidth={2.2} color={AMBER} />
            <Circle cx={0} cy={g.stringYs(0)[k]} r={6} color="#ffffff" />
            <Circle cx={g.L} cy={g.stringYs(g.L)[k]} r={6} color="#ffffff" />
          </Group>
          {/* ③ the bridge drives the top / head / cone */}
          <Group opacity={o3}>
            <Circle cx={paths.topC.x} cy={0} r={paths.topR * 0.9}>
              <RadialGradient c={vec(paths.topC.x, 0)} r={paths.topR * 0.9} colors={['rgba(111,168,255,0.55)', 'rgba(111,168,255,0.18)', 'rgba(111,168,255,0)']} />
            </Circle>
            <Path path={brk(sp.bridge.x.mm, sp.bridge.w.mm)} style="stroke" strokeWidth={4} color={AMBER} />
          </Group>
          {/* ④ sound leaves the top and the opening */}
          <Group opacity={o4}>
            <Path path={paths.ringsTop} style="stroke" strokeWidth={3} color={BLUE} opacity={0.75}>
              <DashPathEffect intervals={[18, 10]} />
            </Path>
            <Path path={paths.ringsHole} style="stroke" strokeWidth={2.6} color={BLUE} opacity={0.8}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

function tri(x: number, y: number) {
  const p = Skia.Path.Make();
  p.moveTo(x, y);
  p.lineTo(x - 11, y + 24);
  p.lineTo(x + 11, y + 24);
  p.close();
  return p;
}
function brk(x: number, w: number) {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 14, -w / 2 - 6, 28, w + 12), 6, 6));
  return p;
}

/* ── one ideal string, shape n ── */
export function StringShapesCanvas({ w, h, n, swing, pFrac, label, endWords, pickWord = 'PICK' }: { w: number; h: number; n: number; swing: number; pFrac: number; label: string; endWords: [string, string]; pickWord?: string }) {
  const L = 1000;
  const A = 150;
  const box = { u0: -60, u1: L + 60, v0: -A - 70, v1: A + 90 };
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const textScale = useStageTextScale();
  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 160; i++) {
      const s = i / 160;
      const y = -A * swing * modeShape(n, s);
      if (i === 0) p.moveTo(s * L, y);
      else p.lineTo(s * L, y);
    }
    return p;
  }, [n, swing]);
  const ghost = useMemo(() => {
    const p = Skia.Path.Make();
    for (const sg of [-1, 1]) {
      for (let i = 0; i <= 160; i++) {
        const s = i / 160;
        const y = -A * sg * modeShape(n, s);
        if (i === 0) p.moveTo(s * L, y);
        else p.lineTo(s * L, y);
      }
    }
    return p;
  }, [n]);
  const still = stillPoints(n);
  const pickY = -A * swing * modeShape(n, pFrac);
  const labels: StaticLabel[] = [
    { id: 'a', text: endWords[0], u: 0, v: A + 46, align: 'left', tone: 'muted' },
    { id: 'b', text: endWords[1], u: L, v: A + 46, align: 'right', tone: 'muted' },
    { id: 'p', text: pickWord, u: pFrac * L, v: A + 74, align: 'center', tone: 'amber' },
    ...still.map((s, i) => ({ id: `s${i}`, text: 'STILL', u: s * L, v: -A - 40, align: 'center' as const, tone: 'illustrative' as const })),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Line p1={vec(0, 0)} p2={vec(L, 0)} color="#ffffff" strokeWidth={2} opacity={0.35}>
            <DashPathEffect intervals={[14, 10]} />
          </Line>
          <Path path={ghost} style="stroke" strokeWidth={2} color="#ffffff" opacity={0.12} />
          <Path path={curve} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" />
          {/* the two fixed ends: the saddle and the nut (or a fret) */}
          {[0, L].map((x) => (
            <Path key={`end${x}`} path={endPost(x)}>
              <LinearGradient start={vec(x - 14, -30)} end={vec(x + 14, 30)} colors={['#fbf6ea', '#d8cfba', '#a99d84']} />
            </Path>
          ))}
          {still.map((s) => (
            <Circle key={`st${s}`} cx={s * L} cy={0} r={11} color="#e8eaee" opacity={0.9} />
          ))}
          <Line p1={vec(pFrac * L, A + 20)} p2={vec(pFrac * L, pickY)} color={AMBER} strokeWidth={2} opacity={0.7}>
            <DashPathEffect intervals={[8, 6]} />
          </Line>
          <Path path={tri(pFrac * L, A + 22)} color={AMBER} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
function endPost(x: number) {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 12, -34, 24, 68), 6, 6));
  return p;
}

/* ── where it leaves: the face with a region lit, and a simplified section ── */
function WhereCanvas({ sc, w, h, regionId, swing, label }: { sc: GuitarScene; w: number; h: number; regionId: string; swing: number; label: string }) {
  const g = sc.g;
  const sp = g.spec;
  const faceH = h * 0.62;
  const box = faceBox(sc);
  const xf = useMemo(() => fitXform('side', box, w, faceH, 6), [box.u0, box.u1, box.v0, box.v1, w, faceH]); // eslint-disable-line react-hooks/exhaustive-deps
  const secH = h - faceH;
  const D = g.depth;
  const secBox = { u0: box.u0, u1: box.u1, v0: -D - 40, v1: 110 };
  const xs = useMemo(() => fitXform('top', secBox, w, secH, 6), [w, secH, secBox.u0, secBox.u1]); // eslint-disable-line react-hooks/exhaustive-deps
  const textScale = useStageTextScale();
  const topC = sp.body.pot ? sp.body.pot.cx.mm : sp.cone ? sp.cone.x.mm : sp.bridge.x.mm;
  const spread = sp.body.pot ? sp.body.pot.d.mm * 0.35 : g.lowerH * 0.55;
  // The section: the top's lowest motion as a smooth bulge round the bridge
  // (a simplified picture), the back still, the opening as a gap.
  const section = useMemo(() => {
    const top = Skia.Path.Make();
    const A = 26 * swing;
    for (let i = 0; i <= 120; i++) {
      const x = g.tail + ((g.edge - g.tail) * i) / 120;
      const bump = Math.exp(-(((x - topC) / spread) ** 2));
      const ends = Math.sin((Math.PI * (x - g.tail)) / (g.edge - g.tail));
      const z = A * bump * ends;
      if (i === 0) top.moveTo(x, z);
      else top.lineTo(x, z);
    }
    const back = Skia.Path.Make();
    back.moveTo(g.tail, -D);
    back.lineTo(g.edge, -D);
    back.moveTo(g.tail, -D);
    back.lineTo(g.tail, 0);
    back.moveTo(g.edge, -D);
    back.lineTo(g.edge, 0);
    return { top, back };
  }, [sc, swing, topC, spread]); // eslint-disable-line react-hooks/exhaustive-deps
  const regions = sc.variant ? (sp.opening.kind === 'head' ? ['head', 'strings'] : ['top', 'hole', 'strings']) : [];
  const lit = regionId.split('.').pop() ?? regionId;
  const holeOpen = sp.opening.kind === 'round' || sp.opening.kind === 'oval';
  const labels: StaticLabel[] = [];
  const secLabels: StaticLabel[] = [
    // The section is drawn with +z UP (the canvas flips y): a label at z sits at v = −z.
    { id: 'st', text: sp.body.pot ? 'HEAD' : 'TOP', u: topC, v: -70, align: 'center', tone: 'blue' },
    { id: 'sb', text: sp.body.pot ? (sp.resonatorBack ? 'RESONATOR' : 'OPEN BACK') : 'BACK', u: g.tail + 60, v: D + 24, align: 'left', tone: 'muted' },
    ...(holeOpen ? [{ id: 'sh', text: 'AIR ⇅', u: g.hole.x, v: -70, align: 'center' as const, tone: 'amber' as const }] : []),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <GuitarFace sc={sc} dim={0.85} />
          {lit === 'top' || lit === 'head' ? (
            <Circle cx={topC} cy={0} r={spread * 1.4}>
              <RadialGradient c={vec(topC, 0)} r={spread * 1.4} colors={['rgba(111,168,255,0.55)', 'rgba(111,168,255,0.2)', 'rgba(111,168,255,0)']} />
            </Circle>
          ) : null}
          {lit === 'hole' ? (
            sp.opening.kind === 'coverplate' ? (
              <Circle cx={sp.opening.x.mm} cy={0} r={sp.opening.d.mm / 2 + 14} style="stroke" strokeWidth={8} color={BLUE} />
            ) : sp.opening.kind === 'fholes' ? (
              <Group>
                {[-1, 1].map((s) => (
                  <Circle key={s} cx={sp.opening.x.mm} cy={s * (sp.opening.d2?.mm ?? 60)} r={sp.opening.d.mm * 0.6} style="stroke" strokeWidth={6} color={BLUE} />
                ))}
              </Group>
            ) : (
              <Circle cx={g.hole.x} cy={0} r={g.hole.r * 1.45} style="stroke" strokeWidth={8} color={BLUE} />
            )
          ) : null}
          {lit === 'strings' ? <Path path={stringsBand(sc)} color="rgba(255,198,77,0.32)" /> : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      <View style={{ position: 'absolute', left: 0, top: faceH, width: w, height: secH }}>
        <Canvas style={{ width: w, height: secH }} accessible accessibilityRole="image" accessibilityLabel={`A simplified section of the body: the ${sp.body.pot ? "head" : "top"} bowing in its lowest motion${holeOpen ? ", the air moving in and out through the hole" : ""}.`}>
          <Group transform={[{ translateX: xs.ox }, { translateY: xs.oy }, { scale: xs.s }, { scaleY: -1 }]}>
            <Path path={section.back} style="stroke" strokeWidth={5} color="#8a5229" />
            <Path path={section.top} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" />
            {holeOpen ? (
              <Group>
                <Line p1={vec(g.hole.x - g.hole.r, 0)} p2={vec(g.hole.x + g.hole.r, 0)} color="#0a0806" strokeWidth={10} />
                <Line p1={vec(g.hole.x, -D * 0.4)} p2={vec(g.hole.x, 60)} color={AMBER} strokeWidth={4} opacity={0.85}>
                  <DashPathEffect intervals={[10, 6]} />
                </Line>
              </Group>
            ) : null}
          </Group>
        </Canvas>
        <StaticLabels labels={secLabels} xf={{ ...xs, oy: xs.oy, s: xs.s }} scale={textScale} w={w} />
      </View>
      {regions.length === 0 ? <Text style={styles.missing}>—</Text> : null}
    </View>
  );
}
function stringsBand(sc: GuitarScene) {
  const g = sc.g;
  const p = Skia.Path.Make();
  const x0 = g.fret12 - 90;
  const x1 = Math.min(g.L, g.fret12 + 160);
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, -g.boardHalf(x0) - 14, x1 - x0, g.boardHalf(x0) * 2 + 28), 14, 14));
  return p;
}

/* ═══════════════════════════════ the page ═══════════════════════════════ */

export function makeStringSoundPage(built: BuiltGuitarModel, opts: { membrane?: { diameterMm: number; hooks: number; bridgeMm: number; label: string } } = {}) {
  return function StringSoundPage({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps): ReactNode {
    const S = lesson.sound;
    const C = copyOf(lesson);
    const sc = built.scenes[variant] ?? built.scenes[built.model.defaultVariant];
    const variantLabel = lesson.model.variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
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
    const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? S.stages[i].text;

    /* the string's shapes */
    const PICKS = C.sound.strikes;
    const [shapeIdx, setShapeIdx] = useState(0);
    const [pickId, setPickId] = useState<string>(C.sound.strikeDefault);
    const [swing, setSwing] = useState(1);
    const shapeN = SHAPES[shapeIdx];
    const pick = PICKS.find((p) => p.id === pickId) ?? PICKS[0];
    const pFrac = Math.max(0.01, Math.min(0.99, pick.mm / sc.g.L));
    const share = pluckShare(shapeN, pFrac);
    const sharePct = Math.round(share * 100);
    const rel = relativeToLowest(shapeN, pFrac);

    /* the banjo head's shapes */
    const [headIdx, setHeadIdx] = useState(0);
    const [headSwing, setHeadSwing] = useState(1);
    const hShape = HEAD_SHAPES[headIdx];
    const M = opts.membrane;
    const hShare = M ? strikeShare(hShape, M.bridgeMm / (M.diameterMm / 2)) : 0;

    /* where it leaves */
    const regions = lesson.model.regions.filter((r) => !r.variants || r.variants.includes(variant));
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
        ...(lesson.model.variants.length > 1
          ? [
              {
                kind: 'options' as const,
                id: 'body',
                label: C.variantKey,
                valueLabel: variantLabel,
                selectedId: variant,
                onSelect: (id: string) => setVariant(id),
                options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
              },
            ]
          : []),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [shown, n, stage, playing, motion, variant, lesson.model.variants, C.variantKey, variantLabel],
    );
    const strikeBezel: BezelItem[] = [
      { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
      ...C.sound.cells.map((c) => {
        const at = c.byVariant?.[variant] ?? c.at;
        return { k: c.k, v: at[Math.min(at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 };
      }),
    ];
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
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through straight' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
      {
        kind: 'options',
        id: 'pick',
        label: C.sound.striker,
        valueLabel: pick.label,
        selectedId: pickId,
        onSelect: (id) => setPickId(id),
        sticky: true,
        options: PICKS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
      },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${shapeN}`, flex: 0.7 },
      { k: 'RATIO', v: `× ${shapeN}`, sub: 'vs lowest', flex: 0.8 },
      { k: `UNDER ${C.sound.striker}`, v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
      { k: 'STILL POINTS', v: shapeN === 1 ? 'ENDS ONLY' : `${shapeN - 1}`, flex: 1.1 },
    ];
    const headParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: headIdx / (HEAD_SHAPES.length - 1),
        onChange: (v) => setHeadIdx(Math.round(v * (HEAD_SHAPES.length - 1))),
        format: () => `${hShape.label} · ${hShape.still}`,
        formatShort: () => hShape.label,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (headSwing + 1) / 2,
        home: 1,
        onChange: (v) => setHeadSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(headSwing) < 0.05 ? 'passing through flat' : `${Math.round(Math.abs(headSwing) * 100)} % of its swing`),
        formatShort: () => `${Math.round(headSwing * 100)} %`,
      },
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
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (topSwing + 1) / 2,
        home: 1,
        onChange: (v) => setTopSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(topSwing) < 0.05 ? 'the top passing through rest' : `${Math.round(Math.abs(topSwing) * 100)} % of its swing`),
        formatShort: () => `${Math.round(topSwing * 100)} %`,
      },
    ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const ends: [string, string] = [sc.g.spec.bridge.kind === 'pin' || sc.g.spec.bridge.kind === 'tieblock' ? 'SADDLE' : 'BRIDGE', 'NUT'];
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: 'Pluck to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <PluckSequenceCanvas sc={sc} w={w} h={h} reveal={reveal} pickMm={PICKS.find((p) => p.id === C.sound.strikeDefault)?.mm ?? sc.g.hole.x} label={`${C.sound.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
          badge: 'The order of events, not their speed · string and top motion drawn much larger than they really move · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={C.sound.looking[variant] ?? 'The instrument from the front'} prompt="STEP through the pluck, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
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
            <StringShapesCanvas
              w={w}
              h={h}
              n={shapeN}
              swing={swing}
              pFrac={pFrac}
              endWords={ends}
              label={`One string between its two fixed ends, in shape ${shapeN}: ${shapeN - 1} still points. Under the ${C.sound.strikerPhrase}, ${pick.label.toLowerCase()}, the string moves ${sharePct} percent of this shape's peak.`}
            />
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
                {`A plucked string vibrates in several shapes at once; this is one of them. ${shapeN === 1 ? 'It is the lowest — the note you name.' : `Its pitch is exactly ${shapeN} times the lowest — a whole number, which is why a string sounds clearly “pitched” where a drumhead does not.`} Under the ${C.sound.strikerPhrase} (${pick.label.toLowerCase()}) the string moves ${sharePct} % of this shape’s peak, so the pluck ${share < 0.05 ? `does not set this shape moving at all: the ${C.sound.strikerPhrase} is on a still point` : share < 0.4 ? 'sets it moving only a little' : 'sets it moving strongly'}.${shapeN > 1 && share >= 0.05 ? ` On this ideal string it starts at about ${Math.round(Math.abs(rel) * 100)} % of the lowest shape’s size.` : ''}`}
              </Point>
            </Card>
            {C.sound.shapesNotes.map((t) => (
              <Note key={t.slice(0, 24)}>{t}</Note>
            ))}
          </>
        ),
      },
      ...(M
        ? [
            {
              key: 'head',
              title: 'The head’s shapes',
              kind: 'COMPARE' as const,
              layout: 'rack' as const,
              rack: {
                render: (w: number, h: number) => (
                  <MembraneFace w={w} h={h} diameterMm={M.diameterMm} rods={M.hooks} shape={hShape} strikeMm={M.bridgeMm} swing={headSwing} striker="BRIDGE" hoop="metal" accessibilityLabel={`The ${M.label}, in the shape ${hShape.label}: ${hShape.still}. Under the bridge the head moves ${Math.round(hShare * 100)} percent of this shape's peak.`} />
                ),
                badge: 'A simplified picture: an ideal head on its own, no air, no strings · blue + toward you, amber − away',
                bezel: [
                  { k: 'SHAPE', v: hShape.label, flex: 0.8 },
                  { k: 'RATIO', v: `× ${hShape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
                  { k: 'UNDER BRIDGE', v: `${Math.round(hShare * 100)} %`, sub: 'of its peak', flex: 1.2 },
                ],
                params: headParams,
                initialParam: 'shape',
              },
              well: (
                <>
                  <Landing looking={`${M.label} · shape ${hShape.label}`} prompt="Step through SHAPE. The bridge stands off the centre: which shapes does it drive?" />
                  <Card>
                    <Point title={`SHAPE ${hShape.label}`}>{`The head is a drumhead: its shapes are not whole-number multiples of the lowest${headIdx === 0 ? ' (this is the lowest)' : ` (this one is × ${hShape.ratio.toFixed(2)})`}. The bridge’s feet stand off the centre, so most shapes move under them and get driven — part of the banjo’s bright, quick sound. Under the bridge the head moves ${Math.round(hShare * 100)} % of this shape’s peak.`}</Point>
                  </Card>
                  <Note>Head tension changes every one of these pitches. Tension is the player’s to set — never a miking step.</Note>
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
          render: (w, h) => <WhereCanvas sc={sc} w={w} h={h} regionId={reg?.id ?? ''} swing={topSwing} label={`${C.sound.subject}. Highlighted: ${reg?.label ?? ''}. ${reg?.note ?? ''} Below, a simplified section: the ${sc.g.spec.body.pot ? 'head' : 'top'} bowing in its lowest motion.`} />,
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
            <Landing looking="The front, and a simplified section below" prompt="Step through REGION, then drag SWING and watch the section." />
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

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});

