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
import { ChainIcon, type IconArt } from './chainIcons';
import { PlanAmpTop, PlanDiBox, PlanInstrumentEdge, PlanPaStack, PlanPlayerTop } from './BacklinePlan';
import { KitTop } from '../kitScene/KitSceneArt';
import { WedgePlan } from '../KitPlan';

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

/** The shared five-piece kit's origin on this stage (its kick's batter head)
 *  and its own centre (kitPlanModel PLAN_BOX.kit): the kit at true size,
 *  the kick clear of the side fill (art pass 2026-10-10). */
const KIT_AT = { u: -400, v: -1770 } as const;
const KIT_MID = { u: -135, v: 20 } as const;

type Built = ReturnType<typeof build>;
let built: Built | null = null;
/* The organ console, its bench and pedalboard, and the rotary cabinet, from
 * above (drawing defaults typical of the classic tonewheel console): the
 * console 1245 wide with its lid, two manuals stepped toward the player (61
 * playing keys + 12 reverse-coloured preset keys each, white keys 23 wide),
 * key cheeks at the ends; the 25-note pedalboard (15 naturals, 10 sharps)
 * in front of it on the floor; the bench 1100 × 380 with its hinged lid; the
 * rotary cabinet 742 × 524 (LESLIE) with its top moulding, front toward +u. */
function build() {
  // A player seen from above: shoulders and the figure's own head from above
  // (head fix 2026-10-08: a head ON A BODY is PlayerFigure's skin-silhouette
  // head — never a circle, never the line-art icon). headAbove's nose points
  // +v; the group below turns it to face the audience (+u).
  const head = headAbove(pt(0, 0), 100).fill;
  // The organ console (local: keys toward +u, where the organist sits).
  const organ = rr(make(), -260, -622, 70, 622, 18);
  const lid = rr(make(), -250, -610, 40, 610, 12);
  const cheeks = make();
  rr(cheeks, 60, -622, 250, -520, 10);
  rr(cheeks, 60, 466, 250, 622, 10);
  const manuals = [rr(make(), 60, -520, 150, -362 + 36 * 23, 2), rr(make(), 150, -520, 250, -362 + 36 * 23, 2)];
  const keyLines = make();
  const blackKeys = make();
  // Preset keys (−520 … −362), then 61 playing keys = 36 naturals × 23 mm.
  const K0 = -362;
  for (const [k0, k1] of [[60, 150], [150, 250]] as const) {
    for (let v = -520 + 23; v < K0 + 36 * 23; v += 23) {
      keyLines.moveTo(k0 + 2, v);
      keyLines.lineTo(k1 - 1, v);
    }
    // Sharps on the back 58 % of each manual: after C, D, F, G, A.
    for (let oct = 0; oct < 5; oct++)
      for (const w of [0, 1, 3, 4, 5]) {
        const v = K0 + (oct * 7 + w + 1) * 23;
        blackKeys.addRRect(Skia.RRectXY(Skia.XYWHRect(k0 + 2, v - 6.5, (k1 - k0) * 0.58, 13), 2, 2));
      }
  }
  const presets = [rr(make(), 62, -518, 148, -362, 2), rr(make(), 152, -518, 248, -362, 2)];
  const pedalNat = make();
  const pedalSharp = make();
  for (let i = 0; i < 15; i++) {
    const v = -462 + i * 66;
    pedalNat.addRRect(Skia.RRectXY(Skia.XYWHRect(250, v - 22, 300, 44), 6, 6));
  }
  for (const i of [0, 1, 3, 4, 5, 7, 8, 10, 11, 12]) {
    const v = -462 + i * 66 + 33;
    pedalSharp.addRRect(Skia.RRectXY(Skia.XYWHRect(250, v - 13, 150, 26), 5, 5));
  }
  const pedalFrame = rr(make(), 240, -510, 560, 510, 14);
  const bench = rr(make(), -190, -550, 190, 550, 24);
  const benchLid = rr(make(), -170, -530, 170, 530, 16);
  // The rotary cabinet from above (front toward +u): moulded top, walnut grain.
  const lw = LESLIE.w.mm / 2;
  const ld = LESLIE.d.mm / 2;
  const leslie = rr(make(), -ld - 9, -lw - 9, ld + 9, lw + 9, 14);
  const leslieTop = rr(make(), -ld + 14, -lw + 14, ld - 14, lw - 14, 8);
  const grain = make();
  for (let i = 0; i < 14; i++) {
    const u = -ld + 30 + i * 36 + ((i * 7) % 5);
    grain.moveTo(u, -lw + 20);
    grain.cubicTo(u + 8, -lw * 0.4, u - 8, lw * 0.3, u + 3, lw - 20);
  }
  // PA and the audience: one row of true-size empty chairs facing the stage
  // (−u) — never heads (owner 2026-10-10).
  const chairs = makeChairsTop(chairRowFacingStage(POS.audience, -2400, 2400));
  // The studio room's walls.
  const room = rr(make(), -1300, -2200, 3200, 2900, 40);
  const playerSpace = make();
  playerSpace.addCircle(POS.player.u, POS.player.v, 520);
  const organSpace = rr(make(), POS.organ.u - 300, POS.organ.v - 720, POS.bench.u + 420, POS.organ.v + 720, 60);
  const deck = rr(make(), PLAN_BOX.stage.u0, PLAN_BOX.stage.v0, POS.audience - 450, PLAN_BOX.stage.v1, 0);
  return { head, organ, lid, cheeks, manuals, keyLines, blackKeys, presets, pedalNat, pedalSharp, pedalFrame, bench, benchLid, leslie, leslieTop, grain, chairs, room, playerSpace, organSpace, deck };
}
function getBuilt(): Built {
  return (built ??= build());
}

export const PLAN_BOX = { stage: { u0: -1500, u1: 3750, v0: -2700, v1: 3000 }, studio: { u0: -1400, u1: 3300, v0: -2300, v1: 3000 } } as const;

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
    out.push({ id: 'drums', u: KIT_AT.u + KIT_MID.u, v: KIT_AT.v + KIT_MID.v, r: 900 });
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
            {/* the drum kit: the shared five-piece kit, true size */}
            {scene === 'stage' ? (
              <Group transform={[{ translateX: KIT_AT.u }, { translateY: KIT_AT.v }]}>
                <KitTop keepOuts={false} />
              </Group>
            ) : null}
            {/* the guitar's 1 × 12 cabinet (its speaker faces the audience) and its DI box */}
            <PlanAmpTop u0={CAB.box.x0} u1={CAB.box.x1} v0={CAB.box.z0} v1={CAB.box.z1} />
            <Line p1={vec(POS.di.u, POS.di.v)} p2={vec(CAB.box.x0 + 60, 180)} color="#2a2c32" strokeWidth={16} />
            <Group transform={[{ translateX: POS.di.u }, { translateY: POS.di.v }]}>
              <PlanDiBox />
            </Group>
            {/* the guitarist, from above, the guitar worn edge-on */}
            <Group transform={[{ translateX: POS.player.u }, { translateY: POS.player.v }]}>
              <PlanInstrumentEdge bass={false} />
              <PlanPlayerTop pose="guitar" />
              <Group transform={[{ rotate: -Math.PI / 2 }]}>
                <FigureHead fill={b.head} />
              </Group>
            </Group>
            {/* the organ console, its pedalboard, the bench; the rotary cabinet beside it */}
            <Group transform={[{ translateX: POS.organ.u }, { translateY: POS.organ.v }]}>
              <Path path={b.pedalFrame} color="#2a1a0c" />
              <Path path={b.pedalNat}>
                <LinearGradient start={vec(250, 0)} end={vec(550, 0)} colors={['#e2b679', '#c48f52', '#8a5426']} />
              </Path>
              <Path path={b.pedalNat} style="stroke" strokeWidth={3} color="#3a220e" />
              <Path path={b.pedalSharp}>
                <LinearGradient start={vec(250, 0)} end={vec(400, 0)} colors={['#3a3d45', '#15161a']} />
              </Path>
              <Group transform={[{ translateX: 16 }, { translateY: 20 }]}>
                <Path path={b.organ} color="#000" opacity={0.55}>
                  <BlurMask blur={30} style="normal" />
                </Path>
              </Group>
              <Path path={b.organ}>
                <LinearGradient start={vec(-260, -622)} end={vec(70, 622)} colors={['#9a6034', '#6b3d1c', '#3c210e']} />
              </Path>
              <Path path={b.lid}>
                <LinearGradient start={vec(-250, -610)} end={vec(40, 610)} colors={['#b07a44', '#7a4a20', '#4a2a10']} />
              </Path>
              <Path path={b.organ} style="stroke" strokeWidth={6} color="#1a0f07" />
              <Path path={b.cheeks}>
                <LinearGradient start={vec(60, 0)} end={vec(250, 0)} colors={['#7a4a20', '#4a2a10']} />
              </Path>
              {b.manuals.map((m, i) => (
                <Path key={`m${i}`} path={m} color="#f1ede4" />
              ))}
              <Path path={b.keyLines} style="stroke" strokeWidth={2.4} color="#8a857a" />
              <Path path={b.blackKeys} color="#141416" />
              {b.presets.map((m, i) => (
                <Path key={`p${i}`} path={m} color="#1b1b1e" opacity={0.92} />
              ))}
            </Group>
            <Group transform={[{ translateX: POS.bench.u }, { translateY: POS.bench.v }]}>
              <Path path={b.bench}>
                <LinearGradient start={vec(-190, -550)} end={vec(190, 550)} colors={['#7a4a20', '#4a2a10', '#2a170a']} />
              </Path>
              <Path path={b.benchLid} style="stroke" strokeWidth={4} color="#1a0f07" opacity={0.7} />
            </Group>
            <Group transform={[{ translateX: POS.leslie.u }, { translateY: POS.leslie.v }]}>
              <Group transform={[{ translateX: 16 }, { translateY: 20 }]}>
                <Path path={b.leslie} color="#000" opacity={0.55}>
                  <BlurMask blur={30} style="normal" />
                </Path>
              </Group>
              <Path path={b.leslie}>
                <LinearGradient start={vec(-271, -380)} end={vec(271, 380)} colors={['#c48f52', '#7a4a20', '#3a220e']} />
              </Path>
              <Path path={b.leslieTop}>
                <LinearGradient start={vec(-262, -371)} end={vec(262, 371)} colors={['#b07a44', '#8a5426', '#5c3417']} />
              </Path>
              <Path path={b.grain} style="stroke" strokeWidth={4} color="#2b170a" opacity={0.18} />
              <Path path={b.leslie} style="stroke" strokeWidth={6} color="#1a0f07" />
            </Group>
            {/* monitors (the same positions as the Studio-or-live page) */}
            {wedgeList.map((wd) => (
              <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={false} />
            ))}
            {/* PA and audience */}
            {scene === 'stage' ? (
              <>
                {POS.pa.map((p, i) => (
                  <Group key={i} transform={[{ translateX: p.u }, { translateY: p.v }]}>
                    <PlanPaStack />
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
  // The links, drawn as what they are: the instrument cable, the SPEAKER
  // cable (amp to cabinet only), the AIR (blue arcs, cabinet to mic), the
  // mic cable, and the amp's direct out (amber dashes) — art pass 2026-10-10:
  // the old drawing coloured every cable as air.
  const links = useMemo(() => {
    const instrument = make();
    instrument.moveTo(at.player.u + 85, 0);
    instrument.lineTo(at.amp.u - 85, 0);
    const speaker = make();
    speaker.moveTo(at.amp.u + 70, 30);
    speaker.cubicTo(at.amp.u + 110, 40, at.cab.u - 120, 40, at.cab.u - 80, 30);
    const micCable = make();
    micCable.moveTo(at.mic.u + 85, 0);
    micCable.lineTo(940 - 85, 0);
    const waves = make();
    for (const [x, r] of [[560, 30], [600, 42], [640, 54]] as const) waves.addArc(Skia.XYWHRect(x - r, -r, 2 * r, 2 * r), -40, 80);
    const wire = make();
    wire.moveTo(250, 50);
    wire.lineTo(250, 210);
    wire.lineTo(390, 210);
    wire.moveTo(510, 210);
    wire.lineTo(940, 210);
    wire.lineTo(940, 60);
    return { instrument, speaker, micCable, waves, wire };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
  // [id, drawing, u, v, size in model units]; the guitar is drawn a little
  // smaller and right of its point so its body stays inside the glass.
  const ICONS: readonly (readonly [string, IconArt, number, number, number?])[] = [
    ['player', 'guitar', at.player.u + 22, at.player.v, 140],
    ['amp', 'guitarHead', at.amp.u, at.amp.v],
    ['cab', 'cab112', at.cab.u, at.cab.v],
    ['mic', 'mic', at.mic.u, at.mic.v],
    ['desk', 'desk', 940, 0],
    ['di', 'ampOut', at.di.u, at.di.v],
  ];
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Path path={links.instrument} style="stroke" strokeWidth={8} strokeCap="round" color="#3a3c44" />
            <Path path={links.speaker} style="stroke" strokeWidth={14} strokeCap="round" color="#2a1c0c" />
            <Path path={links.speaker} style="stroke" strokeWidth={9} strokeCap="round" color="#b07a3a" />
            <Path path={links.micCable} style="stroke" strokeWidth={8} strokeCap="round" color="#3a3c44" />
            <Path path={links.waves} style="stroke" strokeWidth={7} strokeCap="round" color={BLUE} opacity={0.85} />
            <Path path={links.wire} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round">
              <DashPathEffect intervals={[16, 10]} />
            </Path>
            {hi ? <Circle cx={hi.u} cy={hi.v} r={100} style="stroke" strokeWidth={6} color={AMBER} /> : null}
          </Group>
          {/* The objects, each drawn true to itself (icons in screen pixels, 170 model units across). */}
          {ICONS.map(([id, art, u, v, size]) => (
            <Group key={id} transform={[{ translateX: xf.ox + u * xf.s }, { translateY: xf.oy + v * xf.s }]}>
              <ChainIcon art={art} S={(size ?? 170) * xf.s} />
            </Group>
          ))}
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
