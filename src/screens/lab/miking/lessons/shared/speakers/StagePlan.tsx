/**
 * WHERE IT SITS, for amplified speakers (LESSON_JOURNEY §8): a STAGE (or a
 * studio room) from above, at its real scale in mm, with the neighbours drawn
 * as illustrated objects seen from above — a guitar combo on the backline, its
 * player, the guitarist's wedge, a side fill, a drum kit, an organ with its
 * bench and pedals and the rotary cabinet beside it, the PA and the audience —
 * and the SIGNAL PATH as an illustrated chain (air path and the separate
 * electrical path of a direct output).
 *
 * Positions are a typical layout, never a measurement (`prov` internal; the
 * wedge and side fill are the SAME positions the Studio-or-live page uses).
 * Static: it changes only when the learner taps or switches (D8).
 *
 * Plan coordinates: u = toward the audience (right on screen), v = across the
 * stage; the guitar cabinet's speaker at (0, 0) — frame C's x and z.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout, LESLIE } from './speakerModel.ts';
import { ChairsTop, chairRowFacingStage, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

/** An audience member's head icon, crown→chin, mm (a real head ≈ 230 mm). */

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREY = '#8a8f9c';

export type PlanScene = 'stage' | 'studio';

const CAB = cabLayout('1x12');
/** Typical positions (mm), ILLUSTRATIVE. */
const POS = {
  player: { u: 1050, v: 120 },
  di: { u: 260, v: 420 },
  drums: { u: -350, v: -1750 },
  organ: { u: 500, v: 1850 },
  bench: { u: 1050, v: 1850 },
  leslie: { u: -150, v: 2450 },
  pa: [
    { u: 2850, v: -2200 },
    { u: 2850, v: 2650 },
  ],
  audience: 3300,
} as const;

function rr(p: SkPath, u0: number, v0: number, u1: number, v1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

type Built = ReturnType<typeof build>;
let built: Built | null = null;
function build() {
  const cab = rr(make(), CAB.box.x0, CAB.box.z0, CAB.box.x1, CAB.box.z1, 18);
  const cabGrille = rr(make(), CAB.box.x1 - 22, CAB.box.z0 + 26, CAB.box.x1, CAB.box.z1 - 26, 4);
  const handle = rr(make(), CAB.box.x0 + 90, -70, CAB.box.x0 + 130, 70, 10);
  // A player seen from above: shoulders and the figure's own head from above
  // (head fix 2026-10-08: a head ON A BODY is PlayerFigure's skin-silhouette
  // head — never a circle, never the line-art icon). headAbove's nose points
  // +v; the group below turns it to face the audience (+u).
  const shoulders = make();
  shoulders.addOval(Skia.XYWHRect(-120, -230, 240, 460));
  const head = headAbove(pt(0, 0), 100).fill;
  // A guitar across the body (top view): body and neck.
  const guitar = make();
  guitar.addOval(Skia.XYWHRect(60, -210, 170, 230));
  guitar.addRRect(Skia.RRectXY(Skia.XYWHRect(130, 0, 40, 420), 10, 10));
  // A DI box.
  const di = rr(make(), -60, -45, 60, 45, 10);
  // A drum kit from above (shells as discs with hoops; cymbals as thin discs).
  const drums: { u: number; v: number; r: number; kind: 'drum' | 'cym' }[] = [
    { u: 0, v: 0, r: 279, kind: 'drum' },
    { u: 350, v: -380, r: 178, kind: 'drum' },
    { u: 160, v: 220, r: 152, kind: 'drum' },
    { u: 360, v: 330, r: 203, kind: 'drum' },
    { u: 420, v: -620, r: 178, kind: 'cym' },
    { u: 520, v: 120, r: 228, kind: 'cym' },
    { u: 80, v: -480, r: 203, kind: 'cym' },
  ];
  // An organ console from above: the cabinet, the keyboards, the pedals.
  const organ = rr(make(), -260, -620, 260, 620, 26);
  const keys = make();
  for (const off of [120, 180]) rr(keys, off - 22, -520, off + 22, 520, 6);
  const keyLines = make();
  for (let v = -510; v < 520; v += 26) {
    keyLines.moveTo(110, v);
    keyLines.lineTo(150, v);
    keyLines.moveTo(170, v);
    keyLines.lineTo(210, v);
  }
  const pedals = make();
  for (let v = -420; v <= 420; v += 60) rr(pedals, 280, v - 14, 520, v + 14, 8);
  const bench = rr(make(), -150, -420, 150, 420, 30);
  // The rotary cabinet from above: the wood top and its louvers.
  const lw = LESLIE.w.mm / 2;
  const ld = LESLIE.d.mm / 2;
  const leslie = rr(make(), -ld, -lw, ld, lw, 12);
  const louvers = make();
  for (let v = -300; v < 300; v += 22) {
    louvers.moveTo(ld - 4, v);
    louvers.lineTo(ld + 10, v + 8);
  }
  // A floor wedge from above (sloped grille facing `faces`).
  const wedge = rr(make(), -150, -280, 150, 280, 18);
  const wedgeGrille = rr(make(), -40, -258, 136, 258, 14);
  // PA stack from above, and the audience: one row of true-size empty chairs
  // facing the stage (−u) — never heads (owner 2026-10-10).
  const pa = rr(make(), -300, -300, 300, 300, 20);
  const paHorn = rr(make(), 140, -140, 300, 140, 12);
  const chairs = makeChairsTop(chairRowFacingStage(POS.audience, -2400, 2400));
  // The studio room's walls.
  const room = rr(make(), -1300, -2200, 3200, 2900, 40);
  const playerSpace = make();
  playerSpace.addCircle(POS.player.u, POS.player.v, 520);
  const organSpace = rr(make(), POS.organ.u - 300, POS.organ.v - 720, POS.bench.u + 420, POS.organ.v + 720, 60);
  const deck = rr(make(), PLAN_BOX.stage.u0, PLAN_BOX.stage.v0, POS.audience - 450, PLAN_BOX.stage.v1, 0);
  return { cab, cabGrille, handle, shoulders, head, guitar, di, drums, organ, keys, keyLines, pedals, bench, leslie, louvers, wedge, wedgeGrille, pa, paHorn, chairs, room, playerSpace, organSpace, deck };
}
function getBuilt(): Built {
  return (built ??= build());
}

export const PLAN_BOX = { stage: { u0: -1300, u1: 3750, v0: -2550, v1: 3000 }, studio: { u0: -1400, u1: 3300, v0: -2300, v1: 3000 } } as const;

/** Item ids the plan carries, and where each sits (for taps and highlights). */
export function planItems(scene: PlanScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const out = [
    { id: 'cab', u: (CAB.box.x0 + CAB.box.x1) / 2, v: 0, r: 330 },
    { id: 'player', u: POS.player.u, v: POS.player.v, r: 280 },
    { id: 'di', u: POS.di.u, v: POS.di.v, r: 150 },
    { id: 'organ', u: (POS.organ.u + POS.bench.u) / 2, v: POS.organ.v, r: 650 },
    { id: 'leslie', u: POS.leslie.u, v: POS.leslie.v, r: 420 },
  ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: POS.drums.u + 200, v: POS.drums.v, r: 760 });
    for (const w of wedges) out.push({ id: w.id === 'guitarWedge' ? 'wedge' : w.id, u: w.p.x, v: w.p.z, r: 330 });
    out.push({ id: 'audience', u: POS.audience + 150, v: 0, r: 700 });
  } else {
    out.push({ id: 'room', u: 2600, v: -1700, r: 600 });
  }
  return out;
}

export function StagePlan({ w, h, scene, wedges, highlight, onTap, shortOf, accessibilityLabel }: { w: number; h: number; scene: PlanScene; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = PLAN_BOX[scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, scene]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = getBuilt();
  const items = planItems(scene, wedges);
  const hi = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = items.map((i) => ({ id: i.id, text: shortOf(i.id), u: i.u, v: i.v + i.r * 0.72 + 60, align: 'center' as const, tone: i.id === highlight ? ('amber' as const) : ('muted' as const) }));
  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    let best: string | null = null;
    let bd = Infinity;
    for (const i of items) {
      const d = Math.hypot(u - i.u, v - i.v) - i.r;
      if (d < bd) {
        bd = d;
        best = i.id;
      }
    }
    if (best && bd < 260) onTap(best);
  };
  const wedgeList = scene === 'stage' ? wedges : [];
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {/* the floor: a stage deck, or the studio room with its walls */}
            {scene === 'stage' ? (
              <Path path={b.deck}>
                <LinearGradient start={vec(box.u0, 0)} end={vec(POS.audience, 0)} colors={['#1a1714', '#211c17', '#15120f']} />
              </Path>
            ) : (
              <>
                <Path path={b.room}>
                  <LinearGradient start={vec(-1300, -2200)} end={vec(3200, 2900)} colors={['#1c1915', '#15130f']} />
                </Path>
                <Path path={b.room} style="stroke" strokeWidth={60} color="#3a3d45" />
              </>
            )}
            {/* the player's space and the organist's space: keep clear */}
            <Path path={b.playerSpace} color={GREY} opacity={0.08} />
            <Path path={b.playerSpace} style="stroke" strokeWidth={16} color={GREY} opacity={0.5}>
              <DashPathEffect intervals={[50, 34]} />
            </Path>
            <Path path={b.organSpace} color={GREY} opacity={0.08} />
            <Path path={b.organSpace} style="stroke" strokeWidth={16} color={GREY} opacity={0.5}>
              <DashPathEffect intervals={[50, 34]} />
            </Path>
            {/* the guitar combo (its speaker faces the audience) and its DI box */}
            <Path path={b.cab} color="#000" opacity={0.55}>
              <BlurMask blur={40} style="normal" />
            </Path>
            <Path path={b.cab}>
              <LinearGradient start={vec(CAB.box.x0, CAB.box.z0)} end={vec(CAB.box.x1, CAB.box.z1)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
            </Path>
            <Path path={b.cabGrille} color="#2b2d33" />
            <Path path={b.handle} color="#0b0b0d" />
            <Path path={b.cab} style="stroke" strokeWidth={10} color="#55585f" />
            <Group transform={[{ translateX: POS.di.u }, { translateY: POS.di.v }]}>
              <Path path={b.di}>
                <LinearGradient start={vec(-60, -45)} end={vec(60, 45)} colors={['#8f949f', '#3e424b']} />
              </Path>
            </Group>
            <Line p1={vec(POS.di.u, POS.di.v)} p2={vec(CAB.box.x0 + 60, 180)} color="#2a2c32" strokeWidth={16} />
            {/* the guitarist, from above */}
            <Group transform={[{ translateX: POS.player.u }, { translateY: POS.player.v }]}>
              <Path path={b.shoulders} color="#3b3f48" />
              <Path path={b.guitar}>
                <LinearGradient start={vec(60, -210)} end={vec(230, 420)} colors={['#a06a38', '#5c3417']} />
              </Path>
              <Group transform={[{ rotate: -Math.PI / 2 }]}>
                <FigureHead fill={b.head} />
              </Group>
            </Group>
            {/* the drum kit */}
            {scene === 'stage'
              ? b.drums.map((d, i) => (
                  <Group key={i} transform={[{ translateX: POS.drums.u + d.u }, { translateY: POS.drums.v + d.v }]}>
                    {d.kind === 'drum' ? (
                      <>
                        <Circle cx={0} cy={0} r={d.r + 12} color="#5a5d66" />
                        <Circle cx={0} cy={0} r={d.r}>
                          <RadialGradient c={vec(-d.r * 0.35, -d.r * 0.4)} r={d.r * 1.5} colors={['#fbf8f0', '#ece5d5', '#bfb39c']} />
                        </Circle>
                      </>
                    ) : (
                      <>
                        <Circle cx={0} cy={0} r={d.r}>
                          <RadialGradient c={vec(-d.r * 0.3, -d.r * 0.3)} r={d.r * 1.4} colors={['#f2d58a', '#b8902f', '#6b5216']} />
                        </Circle>
                        <Circle cx={0} cy={0} r={d.r * 0.18} color="#8a6a20" />
                      </>
                    )}
                  </Group>
                ))
              : null}
            {/* the organ, its pedals, the bench; the rotary cabinet beside it */}
            <Group transform={[{ translateX: POS.organ.u }, { translateY: POS.organ.v }]}>
              <Path path={b.organ}>
                <LinearGradient start={vec(-260, -620)} end={vec(260, 620)} colors={['#9a6034', '#6b3d1c', '#3c210e']} />
              </Path>
              <Path path={b.pedals}>
                <LinearGradient start={vec(280, 0)} end={vec(520, 0)} colors={['#c48f52', '#7a4a20']} />
              </Path>
              <Path path={b.keys} color="#f1ede4" />
              <Path path={b.keyLines} style="stroke" strokeWidth={4} color="#1b1b1e" />
            </Group>
            <Group transform={[{ translateX: POS.bench.u }, { translateY: POS.bench.v }]}>
              <Path path={b.bench}>
                <LinearGradient start={vec(-150, -420)} end={vec(150, 420)} colors={['#6b3d1c', '#3c210e']} />
              </Path>
            </Group>
            <Group transform={[{ translateX: POS.leslie.u }, { translateY: POS.leslie.v }]}>
              <Path path={b.leslie}>
                <LinearGradient start={vec(-262, -371)} end={vec(262, 371)} colors={['#c48f52', '#7a4a20', '#3a220e']} />
              </Path>
              <Path path={b.louvers} style="stroke" strokeWidth={10} color="#2b170a" />
              <Path path={b.leslie} style="stroke" strokeWidth={8} color="#1a0f07" />
            </Group>
            {/* monitors (the same positions as the Studio-or-live page) */}
            {wedgeList.map((wd) => (
              <Group key={wd.id} transform={[{ translateX: wd.p.x }, { translateY: wd.p.z }, { rotate: Math.atan2(wd.faces.z, wd.faces.x) }]}>
                <Path path={b.wedge}>
                  <LinearGradient start={vec(-150, -280)} end={vec(150, 280)} colors={['#3b3e46', '#24262c', '#15161a']} />
                </Path>
                <Path path={b.wedgeGrille} color="#0c0d10" />
                <Path path={b.wedge} style="stroke" strokeWidth={8} color="#70747f" />
              </Group>
            ))}
            {/* PA and audience */}
            {scene === 'stage' ? (
              <>
                {POS.pa.map((p, i) => (
                  <Group key={i} transform={[{ translateX: p.u }, { translateY: p.v }]}>
                    <Path path={b.pa}>
                      <LinearGradient start={vec(-300, -300)} end={vec(300, 300)} colors={['#3b3e46', '#15161a']} />
                    </Path>
                    <Path path={b.paHorn} color="#0b0b0d" />
                  </Group>
                ))}
                <ChairsTop seats={b.chairs.seats} backs={b.chairs.backs} color="#7d828d" />
              </>
            ) : null}
            {hi ? <Circle cx={hi.u} cy={hi.v} r={hi.r + 40} style="stroke" strokeWidth={30} color={AMBER} /> : null}
            <Line p1={vec(CAB.box.x1 + 40, 0)} p2={vec(POS.player.u - 300, 0)} color={BLUE} strokeWidth={14} opacity={0.5}>
              <DashPathEffect intervals={[60, 40]} />
            </Line>
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}

/* ── the signal path, as an illustrated chain ── */
export const CHAIN = ['player', 'amp', 'cab', 'air', 'mic', 'di'] as const;
export function SignalChain({ w, h, highlight, onTap, accessibilityLabel }: { w: number; h: number; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  // Model box: a chain across 0…1000 (u), two rows: the air path on top,
  // the electrical (DI) path below.
  const box = { u0: -20, u1: 1020, v0: -140, v1: 300 };
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const at: Record<(typeof CHAIN)[number], { u: number; v: number }> = { player: { u: 60, v: 0 }, amp: { u: 250, v: 0 }, cab: { u: 450, v: 0 }, air: { u: 610, v: 0 }, mic: { u: 760, v: 0 }, di: { u: 450, v: 210 } };
  const paths = useMemo(() => {
    const amp = rr(make(), -70, -60, 70, 50, 10);
    const ampFace = rr(make(), -60, -48, 60, -4, 6);
    const knobs = make();
    for (let k = -45; k <= 45; k += 18) knobs.addCircle(k, 22, 7);
    const cab = rr(make(), -85, -90, 85, 90, 12);
    const grille = rr(make(), -72, -77, 72, 77, 8);
    const cone = make();
    cone.addCircle(0, 0, 58);
    const dust = make();
    dust.addCircle(0, 0, 20);
    const waves = make();
    for (const r of [40, 75, 110]) waves.addArc(Skia.XYWHRect(-r, -r, 2 * r, 2 * r), -40, 80);
    const mic = make();
    mic.addRRect(Skia.RRectXY(Skia.XYWHRect(-12, -70, 24, 40), 8, 8));
    mic.addRRect(Skia.RRectXY(Skia.XYWHRect(-9, -30, 18, 60), 6, 6));
    const stand = make();
    stand.moveTo(0, 30);
    stand.lineTo(0, 110);
    stand.moveTo(-45, 112);
    stand.lineTo(45, 112);
    const di = rr(make(), -60, -40, 60, 40, 10);
    const desk = rr(make(), -60, -55, 60, 55, 10);
    const guitar = make();
    guitar.addOval(Skia.XYWHRect(-50, -10, 80, 95));
    guitar.addRRect(Skia.RRectXY(Skia.XYWHRect(-6, -120, 14, 120), 5, 5));
    const airLine = make();
    airLine.moveTo(110, 0);
    airLine.lineTo(180, 0);
    airLine.moveTo(320, 0);
    airLine.lineTo(365, 0);
    airLine.moveTo(800, 0);
    airLine.lineTo(900, 0);
    const wire = make();
    wire.moveTo(250, 50);
    wire.lineTo(250, 210);
    wire.lineTo(390, 210);
    wire.moveTo(510, 210);
    wire.lineTo(940, 210);
    wire.lineTo(940, 60);
    return { amp, ampFace, knobs, cab, grille, cone, dust, waves, mic, stand, di, desk, guitar, airLine, wire };
  }, []);
  const labels: StaticLabel[] = [
    { id: 'player', text: 'PLAYER', u: at.player.u, v: -125, align: 'center', tone: highlight === 'player' ? 'amber' : 'muted' },
    { id: 'amp', text: 'AMP', u: at.amp.u, v: -125, align: 'center', tone: highlight === 'amp' ? 'amber' : 'muted' },
    { id: 'cab', text: 'SPEAKER', u: at.cab.u, v: -125, align: 'center', tone: highlight === 'cab' ? 'amber' : 'muted' },
    { id: 'air', text: 'AIR', u: at.air.u, v: -125, align: 'center', tone: highlight === 'air' ? 'amber' : 'blue' },
    { id: 'mic', text: 'MIC', u: at.mic.u, v: -125, align: 'center', tone: highlight === 'mic' ? 'amber' : 'muted' },
    { id: 'desk', text: 'DESK', u: 940, v: -125, align: 'center', tone: 'muted' },
    { id: 'di', text: 'DIRECT OUT · ELECTRICAL', short: 'DIRECT OUT', u: at.di.u, v: 290, align: 'center', tone: highlight === 'di' ? 'amber' : 'muted' },
  ];
  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    let best: string | null = null;
    let bd = Infinity;
    for (const k of CHAIN) {
      const d = Math.hypot(u - at[k].u, v - at[k].v);
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    if (best && bd < 140) onTap(best);
  };
  const hi = highlight && highlight in at ? at[highlight as (typeof CHAIN)[number]] : null;
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Path path={paths.airLine} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" />
            <Path path={paths.wire} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round">
              <DashPathEffect intervals={[16, 10]} />
            </Path>
            <Group transform={[{ translateX: at.player.u }, { translateY: at.player.v }]}>
              <Path path={paths.guitar}>
                <LinearGradient start={vec(-50, -120)} end={vec(30, 85)} colors={['#c48f52', '#5c3417']} />
              </Path>
            </Group>
            <Group transform={[{ translateX: at.amp.u }, { translateY: at.amp.v }]}>
              <Path path={paths.amp}>
                <LinearGradient start={vec(-70, -60)} end={vec(70, 50)} colors={['#3a3b41', '#15161a']} />
              </Path>
              <Path path={paths.ampFace} color="#c9cdd5" opacity={0.85} />
              <Path path={paths.knobs} color="#0b0b0d" />
            </Group>
            <Group transform={[{ translateX: at.cab.u }, { translateY: at.cab.v }]}>
              <Path path={paths.cab}>
                <LinearGradient start={vec(-85, -90)} end={vec(85, 90)} colors={['#3a3b41', '#15161a']} />
              </Path>
              <Path path={paths.grille} color="#2b2d33" />
              <Path path={paths.cone}>
                <RadialGradient c={vec(-20, -20)} r={80} colors={['#4f4740', '#171411']} />
              </Path>
              <Path path={paths.dust} color="#5b524a" />
            </Group>
            <Group transform={[{ translateX: at.air.u - 60 }, { translateY: at.air.v }]}>
              <Path path={paths.waves} style="stroke" strokeWidth={6} color={BLUE} opacity={0.8} />
            </Group>
            <Group transform={[{ translateX: at.mic.u }, { translateY: at.mic.v }, { rotate: -Math.PI / 2 }]}>
              <Path path={paths.mic}>
                <LinearGradient start={vec(-12, -70)} end={vec(12, 30)} colors={['#a9aeb8', '#3a3d45']} />
              </Path>
            </Group>
            <Group transform={[{ translateX: 940 }, { translateY: 0 }]}>
              <Path path={paths.desk}>
                <LinearGradient start={vec(-60, -55)} end={vec(60, 55)} colors={['#4a4e57', '#15161a']} />
              </Path>
            </Group>
            <Group transform={[{ translateX: at.di.u }, { translateY: at.di.v }]}>
              <Path path={paths.di}>
                <LinearGradient start={vec(-60, -40)} end={vec(60, 40)} colors={['#8f949f', '#3e424b']} />
              </Path>
            </Group>
            {hi ? <Circle cx={hi.u} cy={hi.v} r={100} style="stroke" strokeWidth={6} color={AMBER} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
