/**
 * WHERE IT SITS for the amplified-chain lessons (LESSON_JOURNEY §8): a stage
 * (or a studio room) from above, at its real scale in mm, the amp at the
 * origin (frame C's x toward the audience = u, z across the stage = v — the
 * SAME frame the Studio-or-live page's monitors use), with the neighbours
 * drawn as illustrated objects seen from above: the player and their
 * instrument, the pedalboard (or a steel's pedals and knee levers) as the
 * player's KEEP-CLEAR space, the wedge, the drum kit, the other amp, the PA
 * and the audience. Positions are a typical layout, never a measurement
 * (`prov` internal). Static: it changes only on a tap or a switch (D8).
 *
 * Art pass 2026-10-10: every neighbour is now the real object from above at
 * true size — the shared five-piece kit (kitScene KitTop), the shared floor
 * wedge (KitPlan WedgePlan), amps with their handles and corners, an
 * instrument worn by a standing player seen EDGE-ON (from above a guitar is
 * its rim, not its face), a pedalboard with its pedals, a DI box, a PA stack
 * (sub with a two-way top). The top-view objects are exported for the
 * speaker module's stage plan (StagePlan.tsx).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from './speakerModel.ts';
import { bassHead } from './ampModel.ts';
import { ChairsTop, chairRowFacingStage, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { FigureHead, FigureMass, headAbove, limb } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import { KitTop } from '../kitScene/KitSceneArt';
import { WedgePlan } from '../KitPlan';
import { SteelBodyTop } from '../electric/SteelArt';

/** An audience member's head icon, crown→chin, mm (a real head ≈ 230 mm). */

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
const INK = '#08080a';
const TOLEX = ['#3a3b41', '#1d1e22', '#0f1012'];
const CHROME = ['#f2f4f8', '#9aa0ab', '#3a3d45'];
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

/* ── top-view objects (u toward the audience, v across; mm) ── */

/** An amp or cabinet from above: tolex top, the four corner caps, the front
 *  (grille cloth / control panel) edge toward +u, and a strap handle along
 *  the width when it has one (a strap ≈ 200 × 30 between two end caps). */
export function PlanAmpTop({ u0, u1, v0, v1, handle = true }: { u0: number; u1: number; v0: number; v1: number; handle?: boolean }) {
  const g = useMemo(() => {
    const body = rr(u0, v0, u1, v1, 14);
    const front = rr(u1 - 16, v0 + 18, u1, v1 - 18, 3);
    const corners = make();
    for (const [cu, cv, su, sv] of [
      [u0, v0, 1, 1],
      [u1, v0, -1, 1],
      [u0, v1, 1, -1],
      [u1, v1, -1, -1],
    ] as const) {
      corners.moveTo(cu - su * 2, cv - sv * 2);
      corners.lineTo(cu + su * 52, cv - sv * 2);
      corners.quadTo(cu + su * 30, cv + sv * 30, cu - su * 2, cv + sv * 52);
      corners.close();
    }
    const uc = (u0 + u1) / 2;
    const vc = (v0 + v1) / 2;
    const strap = rr(uc - 15, vc - 100, uc + 15, vc + 100, 12);
    const caps = [rr(uc - 18, vc - 118, uc + 18, vc - 88, 6), rr(uc - 18, vc + 88, uc + 18, vc + 118, 6)];
    return { body, front, corners, strap, caps };
  }, [u0, u1, v0, v1]);
  return (
    <Group>
      <Group transform={[{ translateX: 18 }, { translateY: 22 }]}>
        <Path path={g.body} color="#000" opacity={0.55}>
          <BlurMask blur={26} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={TOLEX} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={5} color="#55585f" opacity={0.8} />
      <Path path={g.front}>
        <LinearGradient start={vec(0, v0)} end={vec(0, v1)} colors={['#3d3f46', '#2b2d33', '#1b1c20']} />
      </Path>
      <Path path={g.corners}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={CHROME} />
      </Path>
      <Path path={g.corners} style="stroke" strokeWidth={2} color={INK} />
      {handle ? (
        <>
          <Path path={g.strap}>
            <LinearGradient start={vec(0, 0)} end={vec(30, 0)} colors={['#4a3d36', '#2a221e', '#120e0c']} />
          </Path>
          <Path path={g.strap} style="stroke" strokeWidth={2} color={INK} />
          {g.caps.map((p, i) => (
            <Path key={i} path={p}>
              <LinearGradient start={vec(u0, 0)} end={vec(u1, 0)} colors={CHROME} />
            </Path>
          ))}
        </>
      ) : null}
    </Group>
  );
}

/** A compact bass head on the cabinet, from above: its case, side vent
 *  slots, and its knobs standing proud of the front panel (+u). */
export function PlanHeadTop({ u0, u1, v0, v1 }: { u0: number; u1: number; v0: number; v1: number }) {
  const g = useMemo(() => {
    const body = rr(u0, v0, u1, v1, 8);
    const vents = make();
    for (let v = v0 + 40; v < v1 - 40; v += 22) vents.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 + 50, v, u1 - u0 - 110, 8), 4, 4));
    const knobs = make();
    for (let i = 0; i < 6; i++) knobs.addRRect(Skia.RRectXY(Skia.XYWHRect(u1, v0 + 90 + i * 34 - 10, 18, 20), 4, 4));
    return { body, vents, knobs };
  }, [u0, u1, v0, v1]);
  return (
    <Group>
      <Group transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <Path path={g.body} color="#000" opacity={0.5}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={['#4b4e57', '#26282e', '#121316']} />
      </Path>
      <Path path={g.vents} color="#050506" />
      <Path path={g.body} style="stroke" strokeWidth={3} color="#6a6f7a" opacity={0.8} />
      <Path path={g.knobs} color="#1b1c20" />
    </Group>
  );
}

/**
 * A PLAYER FROM ABOVE in the house figure style (round 2, 2026-10-10; was a
 * plain shoulder oval): the shoulders ≈ 450 across and ≈ 220 deep, the upper
 * arms, forearms (sleeves) and hands at true length (upper arm ≈ 300,
 * forearm ≈ 260, hand ≈ 180), facing +u. The head is drawn by the caller
 * (FigureHead, the figure's own head from above). Standing guitarist or
 * bassist: the left hand on the neck (−v), the right hand over the strings
 * at the body; seated steel player: both forearms forward to the strings and
 * the thighs under them.
 */
export function PlanPlayerTop({ pose }: { pose: 'guitar' | 'bass' | 'steel' }) {
  const g = useMemo(() => {
    const seated = pose === 'steel';
    const torso = limb([pt(-15, -118), pt(-15, 118)], [108, 108]);
    const arms = seated
      ? [
          [pt(-5, -175), pt(200, -235), pt(400, -215)],
          [pt(-5, 175), pt(200, 235), pt(400, 205)],
        ]
      : [
          [pt(5, -180), pt(170, -245), pt(175, pose === 'bass' ? -520 : -430)],
          [pt(5, 180), pt(105, 235), pt(160, 120)],
        ];
    const sleeves = arms.map((a) => limb(a, [50, 40, 32]));
    const hands = arms.map((a) => {
      const [e, h] = [a[1], a[2]];
      const l = Math.hypot(h.u - e.u, h.v - e.v) || 1;
      return limb([h, pt(h.u + ((h.u - e.u) / l) * 80, h.v + ((h.v - e.v) / l) * 80)], [30, 24]);
    });
    const thighs = seated ? [-105, 105].map((v) => limb([pt(-10, v), pt(420, v * 1.15)], [82, 62])) : [];
    return { torso, sleeves, hands, thighs };
  }, [pose]);
  return (
    <Group>
      {g.thighs.map((p, i) => (
        <FigureMass key={`t${i}`} path={p} tone="trousers" contour={6} />
      ))}
      <FigureMass path={g.torso} tone="shirt" contour={6} />
      {g.sleeves.map((p, i) => (
        <FigureMass key={`s${i}`} path={p} tone="shirt" contour={6} />
      ))}
      {g.hands.map((p, i) => (
        <FigureMass key={`h${i}`} path={p} tone="skin" contour={5} />
      ))}
    </Group>
  );
}

/** A guitar or bass worn by a standing player who faces +u, from above —
 *  seen EDGE-ON: the body's rim (45 thick; a guitar ≈ 990 long overall with
 *  a 455 body, a bass ≈ 1160 with a 500 body), the neck (22) running to the
 *  player's left (−v) to the headstock with its tuner posts. Player frame:
 *  the player's centre at (0, 0). */
export function PlanInstrumentEdge({ bass }: { bass: boolean }) {
  const g = useMemo(() => {
    const bodyV0 = bass ? -150 : -128;
    const bodyV1 = bass ? 350 : 327;
    const neckV1 = bass ? -720 : -560; // the nut end
    const headV1 = bass ? -810 : -663;
    const body = rr(118, bodyV0, 163, bodyV1, 16);
    const top = rr(158, bodyV0 + 6, 163, bodyV1 - 6, 2);
    const neck = make();
    neck.moveTo(138, bodyV0 + 10);
    neck.lineTo(140, neckV1);
    neck.lineTo(162, neckV1);
    neck.lineTo(162, bodyV0 + 10);
    neck.close();
    const board = rr(156, neckV1, 162, bodyV0 + 10, 1);
    const head = make();
    head.moveTo(140, neckV1);
    head.lineTo(132, headV1);
    head.lineTo(148, headV1);
    head.lineTo(156, neckV1);
    head.close();
    const n = bass ? 4 : 6;
    const posts = Array.from({ length: n }, (_, i) => neckV1 - 14 - (i * (neckV1 - 14 - (headV1 + 10))) / (n - 1));
    return { body, top, neck, board, head, posts };
  }, [bass]);
  const finish = bass ? ['#35507a', '#1a2a4a', '#0a101e'] : ['#a0281f', '#5e120e', '#2a0806'];
  return (
    <Group>
      <Path path={g.neck}>
        <LinearGradient start={vec(138, 0)} end={vec(162, 0)} colors={['#9a6c34', '#ecd09a', '#cfa264']} />
      </Path>
      <Path path={g.board} color="#2e1a10" />
      <Path path={g.head}>
        <LinearGradient start={vec(132, 0)} end={vec(156, 0)} colors={['#9a6c34', '#ecd09a', '#cfa264']} />
      </Path>
      <Path path={g.neck} style="stroke" strokeWidth={1.5} color={INK} />
      <Path path={g.head} style="stroke" strokeWidth={1.5} color={INK} />
      {g.posts.map((v, i) => (
        <Circle key={i} cx={142} cy={v} r={bass ? 7 : 5} color="#c8ccd4" />
      ))}
      <Path path={g.body}>
        <LinearGradient start={vec(118, 0)} end={vec(163, 0)} colors={finish} />
      </Path>
      <Path path={g.top} color="#f6f2e8" opacity={0.85} />
      <Path path={g.body} style="stroke" strokeWidth={2} color={INK} />
    </Group>
  );
}

/** A pedalboard from above (≈ 600 × 330, the player behind it at −u): four
 *  stompboxes (66 × 120), footswitch nearest the player, knobs beyond, short
 *  patch cables between them. Local centre (0, 0). */
export function PlanPedalboard() {
  const g = useMemo(() => {
    const board = rr(-165, -250, 165, 250, 14);
    const rails = make();
    for (let u = -140; u < 150; u += 36) rails.addRect(Skia.XYWHRect(u, -244, 14, 488));
    const pedals = [-180, -60, 60, 180].map((v) => rr(-75, v - 33, 50, v + 33, 8));
    const cables = make();
    for (const v of [-120, 0, 120]) {
      cables.moveTo(10, v - 27);
      cables.quadTo(30, v, 10, v + 27);
    }
    return { board, rails, pedals, cables };
  }, []);
  const tones = [['#8a5a2a', '#55361a', '#2a1a0c'], ['#3d8a5a', '#1f5236', '#0f2a1c'], ['#c9a54a', '#8a6a20', '#4a3a10'], ['#3d6fa8', '#1f3d6a', '#0f1f3a']];
  return (
    <Group>
      <Path path={g.board} color="#17181c" />
      <Path path={g.rails} color="#24262c" />
      <Path path={g.board} style="stroke" strokeWidth={4} color="#3a3d45" />
      {g.pedals.map((p, i) => {
        const v = [-180, -60, 60, 180][i];
        return (
          <Group key={i}>
            <Path path={p}>
              <LinearGradient start={vec(-75, v - 33)} end={vec(50, v + 33)} colors={tones[i]} />
            </Path>
            <Path path={p} style="stroke" strokeWidth={2} color={INK} />
            <Circle cx={-45} cy={v} r={11}>
              <RadialGradient c={vec(-48, v - 3)} r={14} colors={CHROME} />
            </Circle>
            <Circle cx={22} cy={v - 16} r={8} color="#141518" />
            <Circle cx={22} cy={v + 16} r={8} color="#141518" />
            <Circle cx={0} cy={v} r={4} color="#ff5a48" opacity={0.85} />
          </Group>
        );
      })}
      <Path path={g.cables} style="stroke" strokeWidth={6} strokeCap="round" color="#0b0b0d" />
    </Group>
  );
}

/** A passive DI box from above (≈ 110 × 85 × 50): steel case, the XLR out at
 *  one end, the instrument in/thru jacks at the other, a ground-lift toggle. */
export function PlanDiBox() {
  const g = useMemo(() => ({ box: rr(-55, -42, 55, 42, 8), xlr: rr(55, -16, 70, 16, 4), jacks: [rr(-68, -28, -55, -8, 3), rr(-68, 8, -55, 28, 3)], sw: rr(-8, -24, 8, -10, 3) }), []);
  return (
    <Group>
      <Path path={g.box}>
        <LinearGradient start={vec(-55, -42)} end={vec(55, 42)} colors={['#8f949f', '#4a4e57', '#24262c']} />
      </Path>
      <Path path={g.box} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.xlr} color="#2a2c32" />
      {g.jacks.map((p, i) => (
        <Path key={i} path={p} color="#2a2c32" />
      ))}
      <Path path={g.sw} color="#e3e6ec" />
    </Group>
  );
}

/** A ground-stacked PA from above, facing +u: an 18 in sub (560 W × 700 D)
 *  with a two-way top (15 in + horn, a trapezoid 440 wide at the front,
 *  ≈ 420 deep) standing on it. Local centre (0, 0). */
export function PlanPaStack() {
  const g = useMemo(() => {
    const sub = rr(-350, -280, 350, 280, 16);
    const top = make();
    top.moveTo(-190, -170);
    top.lineTo(230, -220);
    top.lineTo(230, 220);
    top.lineTo(-190, 170);
    top.close();
    const grille = rr(214, -206, 230, 206, 3);
    const handles = [rr(-40, -270, 40, -252, 6), rr(-40, 252, 40, 270, 6)];
    const socket = make();
    socket.addCircle(10, 0, 22);
    return { sub, top, grille, handles, socket };
  }, []);
  return (
    <Group>
      <Group transform={[{ translateX: 22 }, { translateY: 26 }]}>
        <Path path={g.sub} color="#000" opacity={0.55}>
          <BlurMask blur={30} style="normal" />
        </Path>
      </Group>
      <Path path={g.sub}>
        <LinearGradient start={vec(-350, -280)} end={vec(350, 280)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
      </Path>
      {g.handles.map((p, i) => (
        <Path key={i} path={p} color="#050506" />
      ))}
      <Path path={g.sub} style="stroke" strokeWidth={5} color="#55585f" opacity={0.8} />
      <Path path={g.top}>
        <LinearGradient start={vec(-190, -200)} end={vec(230, 200)} colors={['#4b4e57', '#26282e', '#121316']} />
      </Path>
      <Path path={g.top} style="stroke" strokeWidth={4} color="#6a6f7a" />
      <Path path={g.grille} color="#2b2d33" />
      <Path path={g.socket} color="#0b0b0d" />
    </Group>
  );
}

export type Backline = 'guitar' | 'bass' | 'steel';
export type BacklineScene = 'stage' | 'studio';

/** Typical positions (mm, plan u/v), ILLUSTRATIVE. */
export const BACKLINE_POS = {
  guitar: { player: { u: 950, v: 560 }, pedals: { u: 1380, v: 560 }, di: { u: 560, v: 1050 } },
  bass: { player: { u: 1050, v: 620 }, pedals: { u: 1480, v: 620 }, di: { u: 620, v: 1150 } },
  steel: { player: { u: 950, v: 720 }, pedals: { u: 1300, v: 720 }, di: { u: 600, v: 1250 } },
  drums: { u: -350, v: -1550 },
  otherAmp: { u: -60, v: 1750 },
  audience: 3300,
} as const;
/** The plan boxes. The stage reaches upstage far enough for the drum kit at
 *  its true size (the art pass of 2026-10-10 drew the real kit, ≈ 1.8 m). */
export const BACKLINE_BOX = { stage: { u0: -1250, u1: 3650, v0: -2450, v1: 2150 }, studio: { u0: -1000, u1: 3100, v0: -2200, v1: 2300 } } as const;
/** Where the shared kit's origin (its kick's batter head) sits on the stage:
 *  the kick 560 short of the side fill, the throne inside the plan. */
const KIT_AT = { u: -250, v: -1600 } as const;
/** The kit's own centre (its plan box, kitPlanModel PLAN_BOX.kit). */
const KIT_MID = { u: -135, v: 20 } as const;

/** Item ids on the plan and where each sits (taps and highlights). */
export function backlineItems(who: Backline, scene: BacklineScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const P = BACKLINE_POS[who];
  const out = [
    { id: 'amp', u: -100, v: 0, r: 420 },
    { id: 'player', u: P.player.u, v: P.player.v, r: 300 },
    { id: 'pedals', u: P.pedals.u, v: P.pedals.v, r: who === 'steel' ? 420 : 260 },
    { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
    { id: 'otherAmp', u: BACKLINE_POS.otherAmp.u, v: BACKLINE_POS.otherAmp.v, r: 420 },
  ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: KIT_AT.u + KIT_MID.u, v: KIT_AT.v + KIT_MID.v, r: 900 });
    for (const w of wedges) out.push({ id: w.id === wedges[0].id ? 'wedge' : w.id, u: w.p.x, v: w.p.z, r: 330 });
    out.push({ id: 'audience', u: BACKLINE_POS.audience + 150, v: 0, r: 700 });
  } else out.push({ id: 'room', u: 2500, v: -1700, r: 500 });
  return out;
}

type Built = ReturnType<typeof build>;
const builtCache = new Map<Backline, Built>();
function build(who: Backline) {
  const P = BACKLINE_POS[who];
  // The amp from above (u = x, v = z of frame C).
  const c = cabLayout(who === 'bass' ? 'bass410' : 'combo12');
  const hd = who === 'bass' ? bassHead() : null;
  // The player from above (minimal line art), facing the audience (+u).
  // The player's head from above is the figure's own (head fix 2026-10-08: a
  // head ON A BODY is PlayerFigure's skin silhouette, never a circle); its
  // nose points +v, turned below to face +u.
  const headTop = headAbove(pt(0, 0), 100).fill;
  // The player's keep-clear space: a pedalboard at the feet, or the steel's
  // pedals, knee levers and volume pedal under the instrument.
  const keep = who === 'steel' ? rr(P.player.u - 80, P.player.v - 520, P.player.u + 520, P.player.v + 520, 50) : rr(P.pedals.u - 180, P.pedals.v - 260, P.pedals.u + 180, P.pedals.v + 260, 40);
  // The audience: one row of true-size empty chairs facing the stage (−u) —
  // an audience is its chairs, never heads (owner 2026-10-10).
  const chairs = makeChairsTop(chairRowFacingStage(BACKLINE_POS.audience, -2100, 2100));
  const room = rr(-950, -2150, 3050, 2250, 40);
  const deck = rr(BACKLINE_BOX.stage.u0, BACKLINE_BOX.stage.v0, BACKLINE_POS.audience - 450, BACKLINE_BOX.stage.v1, 0);
  return { c, hd, headTop, keep, chairs, room, deck };
}

export function BacklinePlan({ w, h, who, scene, wedges, highlight, onTap, shortOf, accessibilityLabel }: { w: number; h: number; who: Backline; scene: BacklineScene; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = BACKLINE_BOX[scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  let g = builtCache.get(who);
  if (!g) {
    g = build(who);
    builtCache.set(who, g);
  }
  const P = BACKLINE_POS[who];
  const items = backlineItems(who, scene, wedges);
  const hi = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = items
    .filter((i) => i.id !== 'room' || scene === 'studio')
    .map((i) => ({ id: i.id, text: shortOf(i.id), u: i.id === 'audience' ? i.u : i.u, v: i.v + i.r * 0.72 + 90, align: 'center' as const, tone: i.id === 'amp' ? ('amber' as const) : i.id === 'pedals' ? ('muted' as const) : undefined }));
  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    let best: string | null = null;
    let bd = Infinity;
    for (const it of items) {
      const d = Math.hypot(u - it.u, v - it.v) - it.r;
      if (d < bd && d < 260) {
        bd = d;
        best = it.id;
      }
    }
    if (best) onTap(best);
  };
  const c = g.c;
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'stage' ? (
              <Path path={g.deck}>
                <LinearGradient start={vec(0, BACKLINE_BOX.stage.v0)} end={vec(0, BACKLINE_BOX.stage.v1)} colors={['#1a1714', '#141210', '#0e0c0b']} />
              </Path>
            ) : (
              <>
                <Path path={g.room} color="#121216" />
                <Path path={g.room} style="stroke" strokeWidth={40} color="#2a2a31" />
              </>
            )}
            {/* The player's keep-clear space (grey dashes). */}
            <Path path={g.keep} color={GREY} opacity={0.08} />
            <Path path={g.keep} style="stroke" strokeWidth={22} color={GREY} opacity={0.6}>
              <DashPathEffect intervals={[70, 50]} />
            </Path>
            {/* The drum kit (stage only): the shared five-piece kit, true size. */}
            {scene === 'stage' ? (
              <Group transform={[{ translateX: KIT_AT.u }, { translateY: KIT_AT.v }]}>
                <KitTop keepOuts={false} />
              </Group>
            ) : null}
            {/* The other amp on the backline: a 2 × 12 combo (690 × 270). */}
            <Group transform={[{ translateX: BACKLINE_POS.otherAmp.u }, { translateY: BACKLINE_POS.otherAmp.v }]}>
              <PlanAmpTop u0={-135} u1={135} v0={-345} v1={345} />
            </Group>
            {/* THE amp (the miked one) and a bass head on top. */}
            <PlanAmpTop u0={c.box.x0} u1={c.box.x1} v0={c.box.z0} v1={c.box.z1} handle={who !== 'bass'} />
            {g.hd ? <PlanHeadTop u0={g.hd.x0} u1={g.hd.x1} v0={g.hd.z0} v1={g.hd.z1} /> : null}
            {/* The DI box. */}
            <Group transform={[{ translateX: P.di.u }, { translateY: P.di.v }]}>
              <PlanDiBox />
            </Group>
            {/* Pedalboard (guitar / bass). */}
            {who !== 'steel' ? (
              <Group transform={[{ translateX: P.pedals.u }, { translateY: P.pedals.v }]}>
                <PlanPedalboard />
              </Group>
            ) : null}
            {/* The player and the instrument (a steel lies on its legs in front). */}
            <Group transform={[{ translateX: P.player.u }, { translateY: P.player.v }]}>
              {who === 'steel' ? (
                <Group transform={[{ translateX: 320 }, { translateY: -450 }, { rotate: Math.PI / 2 }]}>
                  <SteelBodyTop />
                </Group>
              ) : null}
              {who !== 'steel' ? <PlanInstrumentEdge bass={who === 'bass'} /> : null}
              <PlanPlayerTop pose={who} />
              <Group transform={[{ rotate: -Math.PI / 2 }]}>
                <FigureHead fill={g.headTop} />
              </Group>
            </Group>
            {/* Monitors (stage), PA and the audience. */}
            {scene === 'stage' ? wedges.map((wd) => <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={false} />) : null}
            {scene === 'stage' ? (
              <>
                {[-1950, 1950].map((v) => (
                  <Group key={v} transform={[{ translateX: 2850 }, { translateY: v }]}>
                    <PlanPaStack />
                  </Group>
                ))}
                <ChairsTop seats={g.chairs.seats} backs={g.chairs.backs} color="#7d828d" />
              </>
            ) : null}
            {hi ? <Circle cx={hi.u} cy={hi.v} r={hi.r + 40} style="stroke" strokeWidth={34} color={AMBER} opacity={0.9} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
