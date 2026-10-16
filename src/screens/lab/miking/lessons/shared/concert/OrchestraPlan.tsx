/**
 * OrchestraPlan — the stage from above for Lab 1's concert lessons (M06–M08,
 * LESSON_JOURNEY §6 stage 3, §8): the percussion row at the back with its
 * neighbours, then (STAGE / STUDIO) the whole orchestra, the conductor, the
 * main pair, the PA and the audience. Every object is an illustrated real
 * object at its real size, lit from the upper left: timpani (copper bowls
 * under coated heads, chrome counterhoops and T-handles, the pedal on the
 * player's side), the concert bass drum in its tilting stand, the concert
 * snare (the shared drum family's plan) on its stand, the headed tambourine
 * with its jingle pairs, a suspended cymbal, the trap table, chairs, music
 * stands and trombone bells, the podium, the main pair, PA stacks and floor
 * wedges. Positions are a typical layout (orchestraPlanModel.ts, drawing
 * defaults; the badge says so). IN A STUDIO: no audience and no wedges —
 * each performer's personal headphone mixer (CueMixPlan), fed back to the
 * distribution points on the side walls. Every word keeps clear of every
 * object (orchestraFoots, StaticLabels `clearOf`).
 *
 * Nothing moves (D8). A tap names an item; the dock's ITEM fader is the
 * no-tap path to the same cards. Same contract as the kit plan (KitPlan.tsx).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { Wedge2WayTop } from '../wedge2Way';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { SettingItem } from '../../../engine/model/types.ts';
import type { SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CymbalPlan, DrumPlan } from '../drums/DrumArt';
import { TimpanoTop } from './TimpaniArt';
import { CONCERT_SNARE_14x65 } from '../drums/concertSpec.ts';
import { AMBER, BRONZE, GREY, LACQUER, legs, make, oval, rect, rrect, seg, type SkPath } from './paths.ts';
import { BASS_STAND, CHAIR, DECK_EDGE_V, FRONT, ORCH_BOX, orchestraCue, orchestraFoots, orchHitTest, orchItemRect, ownPerformer, panelRects, PERC, PERC_STAND, PERC_STANDS, playerSpaces, ROWS, SNARE_STAND, stageWedgesOf, timpaniShown, WALL_T, type OwnInstrument, type PlanPt } from './orchestraPlanModel.ts';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { cueCables, cueHub, cueLabels } from '../monitoring/cueMix.ts';
import { clearOfFoots, labelPlaces } from '../planFoot.ts';

type Scene = SettingPlanProps['scene'];

/* ── hatch for the players' spaces ── */
let hatchCache: SkPath | null = null;
function hatchPath(): SkPath {
  if (hatchCache) return hatchCache;
  const p = make();
  for (let k = -9000; k < 9000; k += 90) {
    p.moveTo(k, -1000);
    p.lineTo(k + 9500, 8500);
  }
  hatchCache = p;
  return p;
}

/* ── timpani: the shared timpano drawing (TimpaniArt), the pedal toward the
 *  player (upstage, −v) ── */
function TimpanoPlan({ c, d }: { c: PlanPt; d: number }) {
  return (
    <Group transform={[{ translateX: c.u }, { translateY: c.v }]}>
      <TimpanoTop R={d / 2} pedalA={-Math.PI / 2} />
    </Group>
  );
}

/* ── the concert bass drum from above, in its tilting stand ── */
function BassDrumPlan({ hi }: { hi: boolean }) {
  const B = PERC.bassDrum;
  const R = B.d / 2;
  const L = B.depth;
  const u0 = B.c.u - L / 2;
  const u1 = B.c.u + L / 2;
  const g = useMemo(() => {
    const shell = rect(make(), u0, B.c.v - R, u1, B.c.v + R);
    const hoops = rrect(rrect(make(), u0 - BASS_STAND.hoop, B.c.v - R - 18, u0 + 18, B.c.v + R + 18, 10), u1 - 18, B.c.v - R - 18, u1 + BASS_STAND.hoop, B.c.v + R + 18, 10);
    const rods = make();
    for (const s of [-1, 1]) {
      for (const [a, b] of [
        [u0 + 6, u0 + 120],
        [u1 - 120, u1 - 6],
      ] as const) {
        seg(rods, a, B.c.v + s * (R + 34), b, B.c.v + s * (R + 34));
      }
    }
    // The stand: two uprights at the pivots (either side of the shell), the
    // base rails across, four casters at the corners (drawing defaults).
    const S = BASS_STAND;
    const frame = make();
    const yo = R + S.yo;
    seg(frame, B.c.u - S.rail, B.c.v - yo, B.c.u + S.rail, B.c.v - yo);
    seg(frame, B.c.u - S.rail, B.c.v + yo, B.c.u + S.rail, B.c.v + yo);
    seg(frame, B.c.u - S.rail, B.c.v - yo, B.c.u - S.rail, B.c.v + yo);
    seg(frame, B.c.u + S.rail, B.c.v - yo, B.c.u + S.rail, B.c.v + yo);
    const casters = make();
    for (const su of [-1, 1]) for (const sv of [-1, 1]) oval(casters, B.c.u + su * S.rail, B.c.v + sv * yo, S.caster, S.caster);
    const pivots = make();
    for (const sv of [-1, 1]) oval(pivots, B.c.u, B.c.v + sv * (R + 52), 46, 46);
    return { shell, hoops, rods, frame, casters, pivots, yo };
  }, [u0, u1, R, B.c.u, B.c.v]);
  return (
    <Group>
      <Path path={g.shell} color="#000" opacity={0.55} transform={[{ translateX: 30 }, { translateY: 40 }]}>
        <BlurMask blur={40} style="normal" />
      </Path>
      <Path path={g.frame} style="stroke" strokeWidth={BASS_STAND.railW} strokeCap="round" color="#141519" />
      <Path path={g.frame} style="stroke" strokeWidth={32} strokeCap="round" color="#5b5f69" />
      <Path path={g.casters} color="#0e0f12" />
      <Path path={g.casters} style="stroke" strokeWidth={8} color="#8a8f99" />
      <Path path={g.shell}>
        <LinearGradient start={vec(0, B.c.v - R)} end={vec(0, B.c.v + R)} colors={LACQUER} positions={[0, 0.12, 0.3, 0.55, 0.85, 1]} />
      </Path>
      <Path path={g.rods} style="stroke" strokeWidth={16} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={6} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.hoops}>
        <LinearGradient start={vec(0, B.c.v - R)} end={vec(0, B.c.v + R)} colors={['#c48a4c', '#7a4a20', '#2f1b0a']} />
      </Path>
      <Path path={g.pivots}>
        <RadialGradient c={vec(B.c.u - 14, B.c.v - R)} r={70} colors={['#eef1f6', '#7d828d']} />
      </Path>
      {hi ? <Path path={rrect(make(), u0 - 110, B.c.v - g.yo - 110, u1 + 110, B.c.v + g.yo + 110, 60)} style="stroke" strokeWidth={28} color={AMBER} /> : null}
    </Group>
  );
}

/* ── the headed tambourine, held at 45° (its head toward the audience and
 *  up): an ellipse in plan, the frame's jingle pairs round it ── */
function TambourinePlan({ hi }: { hi: boolean }) {
  const T = PERC.tambourine;
  const R = T.d / 2;
  const k = Math.cos(Math.PI / 4);
  const g = useMemo(() => {
    const jingles = make();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 2 * Math.PI + Math.PI / 8;
      oval(jingles, T.c.u + Math.cos(a) * (R + 4), T.c.v + Math.sin(a) * (R + 4) * k, 30, 30 * k);
    }
    return { jingles };
  }, [T.c.u, T.c.v, R, k]);
  return (
    <Group>
      <Path path={oval(make(), T.c.u + 30, T.c.v + 50, R + 20, (R + 20) * k)} color="#000" opacity={0.5}>
        <BlurMask blur={30} style="normal" />
      </Path>
      <Path path={oval(make(), T.c.u, T.c.v, R + 12, (R + 12) * k)}>
        <LinearGradient start={vec(T.c.u - R, T.c.v - R)} end={vec(T.c.u + R, T.c.v + R)} colors={['#e9c48a', '#c48f52', '#7a4a20']} />
      </Path>
      <Path path={g.jingles}>
        <RadialGradient c={vec(T.c.u - R * 0.5, T.c.v - R * 0.5)} r={R * 2.2} colors={['#ffffff', '#c8ccd4', '#6c717c']} />
      </Path>
      <Path path={oval(make(), T.c.u, T.c.v, R - 4, (R - 4) * k)}>
        <RadialGradient c={vec(T.c.u - R * 0.35, T.c.v - R * 0.35)} r={R * 1.6} colors={['#f6ecd2', '#e2cfa3', '#c6ad7c']} />
      </Path>
      {hi ? <Path path={oval(make(), T.c.u, T.c.v, R + 110, (R + 110) * 0.85)} style="stroke" strokeWidth={28} color={AMBER} /> : null}
    </Group>
  );
}

/* ── furniture: a chair, a music stand, a trombone bell, the trap table ── */
/** A row's chairs and, per desk pair, their ONE shared music stand on the
 *  line between them (owner 2026-10-16). */
function chairs(r: { v: number; u: readonly number[]; desks: readonly number[] }, bells: boolean): { seats: SkPath; backs: SkPath; desks: SkPath; legsP: SkPath; bellsP: SkPath | null } {
  const v = r.v;
  const seats = make();
  const backs = make();
  const desks = make();
  const legsP = make();
  const bellsP = make();
  const C = CHAIR;
  for (const [i, u] of r.u.entries()) {
    rrect(seats, u - C.seat.hw, v + C.seat.v0, u + C.seat.hw, v + C.seat.v1, C.seat.r);
    rrect(backs, u - C.back.hw, v + C.back.v0, u + C.back.hw, v + C.back.v1, C.back.r);
    // the bell forward, on the side away from the shared stand
    if (bells) oval(bellsP, u + (i % 2 ? 1 : -1) * C.bell.du, v + C.bell.dv, C.bell.r, C.bell.r);
  }
  for (const u of r.desks) {
    rrect(desks, u - C.desk.hw, v + C.desk.v0, u + C.desk.hw, v + C.desk.v1, C.desk.r);
    legs(legsP, u, v + C.legV, 0, C.legR, 3, -Math.PI / 2);
  }
  return { seats, backs, desks, legsP, bellsP: bells ? bellsP : null };
}

function Rows({ wide }: { wide: boolean }) {
  const g = useMemo(() => ({ brass: chairs(ROWS.brass, true), winds: chairs(ROWS.winds, false), strings: ROWS.strings.map((r) => chairs(r, false)) }), []);
  const draw = (c: ReturnType<typeof chairs>, key: string) => (
    <Group key={key}>
      <Path path={c.legsP} style="stroke" strokeWidth={14} strokeCap="round" color="#3a3d45" />
      <Path path={c.seats}>
        <LinearGradient start={vec(-4000, -800)} end={vec(4000, 8000)} colors={['#3d3f48', '#24262c']} />
      </Path>
      <Path path={c.backs} color="#15161a" />
      <Path path={c.desks}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 8000)} colors={['#4a4e57', '#2a2c32']} />
      </Path>
      {c.bellsP ? (
        <>
          <Path path={c.bellsP}>
            <RadialGradient c={vec(0, 0)} r={9000} colors={BRONZE} />
          </Path>
          <Path path={c.bellsP} style="stroke" strokeWidth={12} color="#f6d58f" opacity={0.8} />
        </>
      ) : null}
    </Group>
  );
  return (
    <Group>
      {draw(g.brass, 'brass')}
      {wide ? (
        <>
          {draw(g.winds, 'winds')}
          {g.strings.map((s, i) => draw(s, `str${i}`))}
        </>
      ) : null}
    </Group>
  );
}

function TrapTable({ hi }: { hi: boolean }) {
  const t = PERC.table;
  const g = useMemo(() => {
    const top = rrect(make(), t.u0, t.v0, t.u1, t.v1, 20);
    const sticks = make();
    seg(sticks, t.u0 + 60, t.v0 + 80, t.u1 - 120, t.v0 + 120);
    seg(sticks, t.u0 + 60, t.v0 + 120, t.u1 - 120, t.v0 + 160);
    const mallets = make();
    seg(mallets, t.u0 + 60, t.v1 - 110, t.u1 - 160, t.v1 - 90);
    seg(mallets, t.u0 + 60, t.v1 - 70, t.u1 - 160, t.v1 - 50);
    const heads = make();
    oval(heads, t.u1 - 140, t.v1 - 90, 22, 22);
    oval(heads, t.u1 - 140, t.v1 - 50, 22, 22);
    return { top, sticks, mallets, heads };
  }, [t.u0, t.u1, t.v0, t.v1]);
  return (
    <Group>
      <Path path={g.top} color="#000" opacity={0.5} transform={[{ translateX: 24 }, { translateY: 30 }]}>
        <BlurMask blur={26} style="normal" />
      </Path>
      <Path path={g.top}>
        <LinearGradient start={vec(t.u0, t.v0)} end={vec(t.u1, t.v1)} colors={['#2c3a33', '#1c2620', '#121814']} />
      </Path>
      <Path path={g.sticks} style="stroke" strokeWidth={16} strokeCap="round" color="#c48f52" />
      <Path path={g.mallets} style="stroke" strokeWidth={12} strokeCap="round" color="#9c6631" />
      <Path path={g.heads} color="#e7dfcb" />
      {hi ? <Path path={rrect(make(), t.u0 - 70, t.v0 - 70, t.u1 + 70, t.v1 + 70, 40)} style="stroke" strokeWidth={24} color={AMBER} /> : null}
    </Group>
  );
}

/** A percussionist's music stand (desk and tripod), in front of the player. */
function standsOf(pts: readonly PlanPt[]): { desks: SkPath; legsP: SkPath } {
  const desks = make();
  const legsP = make();
  for (const p of pts) {
    rrect(desks, p.u - PERC_STAND.hw, p.v - PERC_STAND.hd, p.u + PERC_STAND.hw, p.v + PERC_STAND.hd, 14);
    legs(legsP, p.u, p.v, 0, PERC_STAND.legR, 3, -Math.PI / 2);
  }
  return { desks, legsP };
}

/* ── the front of the stage ── */
function Podium({ hi }: { hi: boolean }) {
  const c = FRONT.conductor;
  const sd = FRONT.scoreDesk;
  return (
    <Group>
      <Path path={rrect(make(), c.u - c.r, c.v - c.r, c.u + c.r, c.v + c.r, 60)} color="#000" opacity={0.5} transform={[{ translateX: 30 }, { translateY: 40 }]}>
        <BlurMask blur={36} style="normal" />
      </Path>
      <Path path={rrect(make(), c.u - c.r, c.v - c.r, c.u + c.r, c.v + c.r, 60)}>
        <LinearGradient start={vec(c.u - c.r, c.v - c.r)} end={vec(c.u + c.r, c.v + c.r)} colors={['#4a3020', '#2a1a10', '#140c06']} />
      </Path>
      <Path path={rrect(make(), c.u - c.r + 40, c.v - c.r + 40, c.u + c.r - 40, c.v + c.r - 40, 40)} style="stroke" strokeWidth={10} color="#7a5a40" opacity={0.6} />
      {/* the score desk, upstage of the conductor, facing them */}
      <Path path={rrect(make(), c.u - sd.hw, c.v - c.r + sd.dv0, c.u + sd.hw, c.v - c.r + sd.dv1, 18)}>
        <LinearGradient start={vec(0, c.v - c.r + sd.dv0)} end={vec(0, c.v - c.r + sd.dv1)} colors={['#5d616c', '#2a2c32']} />
      </Path>
      {hi ? <Path path={rrect(make(), c.u - c.r - 90, c.v - c.r + sd.dv0 - 80, c.u + c.r + 90, c.v + c.r + 90, 80)} style="stroke" strokeWidth={28} color={AMBER} /> : null}
    </Group>
  );
}

function MainPair({ hi }: { hi: boolean }) {
  const m = FRONT.main;
  const g = useMemo(() => {
    const tri = legs(make(), m.u, m.v, 0, m.legR, 3, -Math.PI / 2);
    const bar = seg(make(), m.u - m.spread - 60, m.v, m.u + m.spread + 60, m.v);
    const mics = make();
    for (const s of [-1, 1]) {
      // two pencil mics on the bar, splayed, facing the orchestra (up)
      const x = m.u + s * m.spread;
      const ang = s * 0.6;
      mics.moveTo(x, m.v);
      mics.lineTo(x + Math.sin(ang) * 150, m.v - Math.cos(ang) * 150);
    }
    return { tri, bar, mics };
  }, [m.u, m.v, m.spread, m.legR]);
  return (
    <Group>
      <Path path={g.tri} style="stroke" strokeWidth={22} strokeCap="round" color="#3a3d45" />
      <Circle cx={m.u} cy={m.v} r={34} color="#16171b" />
      <Path path={g.bar} style="stroke" strokeWidth={18} strokeCap="round" color="#8a8f99" />
      <Path path={g.mics} style="stroke" strokeWidth={34} strokeCap="round" color="#1b1c21" />
      <Path path={g.mics} style="stroke" strokeWidth={20} strokeCap="round" color="#b6bbc5" />
      {hi ? <Circle cx={m.u} cy={m.v} r={420} style="stroke" strokeWidth={28} color={AMBER} /> : null}
    </Group>
  );
}

function PaStack({ at, hi }: { at: PlanPt; hi: boolean }) {
  const g = useMemo(() => {
    const P = FRONT.paCab;
    const cab = rrect(make(), at.u - P.hw, at.v - P.hd, at.u + P.hw, at.v + P.hd, 22);
    const grille = rrect(make(), at.u - P.hw + 30, at.v + P.hd - 140, at.u + P.hw - 30, at.v + P.hd - 20, 14);
    return { cab, grille };
  }, [at.u, at.v]);
  return (
    <Group>
      <Path path={g.cab} color="#000" opacity={0.5} transform={[{ translateX: 30 }, { translateY: 40 }]}>
        <BlurMask blur={30} style="normal" />
      </Path>
      <Path path={g.cab}>
        <LinearGradient start={vec(at.u - FRONT.paCab.hw, at.v - FRONT.paCab.hd)} end={vec(at.u + FRONT.paCab.hw, at.v + FRONT.paCab.hd)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      <Path path={g.grille} color="#0c0d10" />
      <Path path={g.cab} style="stroke" strokeWidth={10} color="#70747f" opacity={0.9} />
      {hi ? <Path path={rrect(make(), at.u - FRONT.paCab.hw - 80, at.v - FRONT.paCab.hd - 80, at.u + FRONT.paCab.hw + 80, at.v + FRONT.paCab.hd + 80, 40)} style="stroke" strokeWidth={26} color={AMBER} /> : null}
    </Group>
  );
}

/** A 2-way floor wedge from above, at true size (shared/wedge2Way.tsx):
 *  its sloped baffle — woofer and horn behind the grille — facing `faces`,
 *  the flat top panel and rear input at the back. */
function WedgePlan({ at, faces, hi }: { at: PlanPt; faces: PlanPt; hi: boolean }) {
  const ang = Math.atan2(faces.v, faces.u);
  return (
    <Group transform={[{ translateX: at.u }, { translateY: at.v }, { rotate: ang }]}>
      <Wedge2WayTop highlight={hi ? AMBER : undefined} highlightW={22} />
    </Group>
  );
}

/** The plan items an item stands for (default: its own id). */
function planIdsOf(it: Pick<SettingItem, 'id' | 'planIds'>): readonly string[] {
  return it.planIds && it.planIds.length ? it.planIds : [it.id];
}

export type OrchestraPlanProps = SettingPlanProps & { own: OwnInstrument };

export function OrchestraPlan({ w, h, scene, variant, items, wedges, highlight, onTap, accessibilityLabel, own }: OrchestraPlanProps) {
  const textScale = useStageTextScale();
  const four = own === 'timpani' && variant === 'four';
  const wide = scene !== 'kit';
  const studio = scene === 'studio';
  const box = wide ? ORCH_BOX.wide : ORCH_BOX.ensemble;
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const stageWedges = useMemo(() => (scene === 'stage' ? stageWedgesOf(own, wedges) : []), [scene, own, wedges]);
  // Every object's footprint (the same numbers as the drawing): the words
  // keep clear of them. The near (kit) view has no wedges, PA or mixers.
  const foots = useMemo(() => orchestraFoots(own, studio ? 'studio' : 'stage', four, scene === 'stage' ? wedges : []), [own, studio, four, scene, wedges]);
  const cue = useMemo(() => (studio ? orchestraCue(own, four) : []), [studio, own, four]);
  const spaces = useMemo(() => {
    const p = make();
    for (const poly of playerSpaces(four)) {
      poly.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
      p.close();
    }
    return p;
  }, [four]);
  const percStands = useMemo(() => standsOf(PERC_STANDS.map((s) => s.at)), []);
  const audience = useMemo(() => {
    const p = make();
    const v = FRONT.audienceV;
    for (const u of FRONT.audienceArrowsU) {
      p.moveTo(u, v - 40);
      p.lineTo(u, v + 220);
      p.moveTo(u - 60, v + 160);
      p.lineTo(u, v + 220);
      p.lineTo(u + 60, v + 160);
    }
    return p;
  }, []);
  const walls = useMemo(() => {
    const H = FRONT.hall;
    return rect(make(), H.u0, H.v0, H.u1, H.v1);
  }, []);
  const panels = useMemo(() => {
    const p = make();
    for (const { r } of panelRects()) rrect(p, r.u0, r.v0, r.u1, r.v1, 20);
    return p;
  }, []);

  // Which items are lit: the chosen one, and the lesson's own instrument.
  const chosen = items.find((i) => i.id === highlight);
  const lit = new Set<string>(chosen ? planIdsOf(chosen) : []);
  const hi = (id: string) => lit.has(id) || id === own;
  const shownHere = (i: SettingItem) => i.scene === 'all' || i.scene === scene;
  const itemOfPlan = (pid: string) => items.find((i) => shownHere(i) && planIdsOf(i).includes(pid)) ?? null;

  // Collision pass 2026-10-15: each name goes just outside its object's own
  // footprint (below, right, left, above), else into free space with a
  // leader back to the object — never on an object.
  const labels: StaticLabel[] = [];
  const addItem = (it: SettingItem) => {
    for (const pid of planIdsOf(it)) {
      const r = orchItemRect(pid, foots);
      if (!r) continue;
      const places = labelPlaces(r, xf.s / textScale);
      labels.push({ id: `${it.id}:${pid}`, text: it.short, u: places[0].u, v: places[0].v, align: places[0].align, alts: places.slice(1), point: { u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 }, tone: highlight === it.id || pid === own ? 'amber' : undefined });
      break;
    }
  };
  const visible = items.filter(shownHere);
  if (chosen) addItem(chosen);
  const ownItem = visible.find((i) => planIdsOf(i).includes(own));
  if (ownItem) addItem(ownItem);
  for (const it of visible) addItem(it);
  const seen = new Set<string>();
  const uniq = labels.filter((l) => {
    const k = l.id.split(':')[0];
    return seen.has(k) ? false : (seen.add(k), true);
  });
  // The studio's headphone mix: HEADPHONE MIX at the lesson's own player's
  // mixer (every performer has the same one) and CONTROL ROOM at its wall box.
  const mine = `cueMix:${ownPerformer(own)}`;
  for (const rig of cue) {
    const hub = cueHub(rig).rect;
    for (const l of cueLabels(rig)) {
      const s = rig.stations.find((x) => `cueMix:${x.id}` === l.id);
      if (s && l.id !== mine) continue;
      uniq.push({ ...l, tone: 'illustrative', point: s ? s.at : { u: (hub.u0 + hub.u1) / 2, v: (hub.v0 + hub.v1) / 2 } });
    }
  }

  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const pid = orchHitTest(u, v, 20 / xf.s, { scene, four, wedges: stageWedges });
    const it = pid ? itemOfPlan(pid) : null;
    if (it) onTap(it.id);
  };

  const snare = PERC.snare;
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {/* the stage floor (boards) to the deck's edge; the whole hall in the studio */}
            <Path path={rect(make(), box.u0, box.v0, box.u1, studio ? FRONT.hall.v1 : Math.min(box.v1, DECK_EDGE_V))}>
              <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={['#2a2018', '#1e1711', '#15100c']} />
            </Path>
            {studio ? (
              <>
                <Path path={walls} style="stroke" strokeWidth={WALL_T} color="#2a2c32" />
                <Path path={panels} color="#3a3d52" />
                <Path path={panels} style="stroke" strokeWidth={8} color="#5d6a84" />
              </>
            ) : null}
            {/* the deck's edge and the audience: a stage only (a studio has no audience) */}
            {scene === 'stage' ? (
              <>
                <Line p1={vec(FRONT.hall.u0, DECK_EDGE_V)} p2={vec(FRONT.hall.u1, DECK_EDGE_V)} color="#5d616c" strokeWidth={18}>
                  <DashPathEffect intervals={[90, 60]} />
                </Line>
                <Path path={audience} style="stroke" strokeWidth={34} color="#aab0bd" strokeCap="round" strokeJoin="round" />
                {lit.has('audience') ? <Path path={audience} style="stroke" strokeWidth={60} color={AMBER} strokeCap="round" opacity={0.85} /> : null}
              </>
            ) : null}
            {/* the players' spaces (keep-outs, the lab's grey hatch) */}
            <Group clip={spaces}>
              <Path path={hatchPath()} style="stroke" strokeWidth={10} color={GREY} opacity={0.4} />
            </Group>
            <Path path={spaces} style="stroke" strokeWidth={10} color={GREY} opacity={0.6} />
            <Rows wide={wide} />
            {lit.has('brass') ? <Path path={rrect(make(), ROWS.brass.u[0] - 330, ROWS.brass.v - 360, ROWS.brass.u[ROWS.brass.u.length - 1] + 330, ROWS.brass.v + 560, 60)} style="stroke" strokeWidth={26} color={AMBER} /> : null}
            {wide && lit.has('winds') ? <Path path={rrect(make(), ROWS.winds.u[0] - 330, ROWS.winds.v - 360, ROWS.winds.u[ROWS.winds.u.length - 1] + 330, ROWS.winds.v + 560, 60)} style="stroke" strokeWidth={26} color={AMBER} /> : null}
            {wide && lit.has('strings') ? <Path path={rrect(make(), ROWS.strings[0].u[0] - 330, ROWS.strings[0].v - 360, ROWS.strings[0].u[ROWS.strings[0].u.length - 1] + 330, ROWS.strings[1].v + 560, 60)} style="stroke" strokeWidth={26} color={AMBER} /> : null}
            {/* percussion */}
            {timpaniShown(four).map((d) => (
              <TimpanoPlan key={d.id} c={d.c} d={d.d} />
            ))}
            {hi('timpani') ? (
              <Path
                path={(() => {
                  const ds = timpaniShown(four);
                  const u0 = Math.min(...ds.map((d) => d.c.u - d.d / 2)) - 140;
                  const u1 = Math.max(...ds.map((d) => d.c.u + d.d / 2)) + 140;
                  const v0 = Math.min(...ds.map((d) => d.c.v - d.d / 2)) - 300;
                  const v1 = Math.max(...ds.map((d) => d.c.v + d.d / 2)) + 140;
                  return rrect(make(), u0, v0, u1, v1, 90);
                })()}
                style="stroke"
                strokeWidth={28}
                color={AMBER}
              />
            ) : null}
            <BassDrumPlan hi={hi('bassDrum')} />
            <Group transform={[{ translateX: snare.c.u }, { translateY: snare.c.v }]}>
              <Path path={legs(make(), 0, 0, 40, snare.d / 2 + SNARE_STAND.legOut, 3, Math.PI / 2)} style="stroke" strokeWidth={SNARE_STAND.legW} strokeCap="round" color="#7a7f8a" />
              <DrumPlan drum={{ spec: CONCERT_SNARE_14x65, c: { x: 0, y: 0, z: 0 }, tiltDeg: 0 }} />
              {hi('snare') ? <Circle cx={0} cy={0} r={snare.d / 2 + 190} style="stroke" strokeWidth={28} color={AMBER} /> : null}
            </Group>
            <Path path={percStands.legsP} style="stroke" strokeWidth={14} strokeCap="round" color="#3a3d45" />
            <Path path={percStands.desks} color="#4a4e57" />
            <TambourinePlan hi={hi('tambourine')} />
            <CymbalPlan cx={PERC.cymbal.c.u} cz={PERC.cymbal.c.v} d={PERC.cymbal.d} tiltDeg={0} highlight={lit.has('cymbal')} dim={0.9} />
            <TrapTable hi={lit.has('table')} />
            {wide ? (
              <>
                <Podium hi={lit.has('conductor')} />
                <MainPair hi={lit.has('main')} />
              </>
            ) : null}
            {scene === 'stage' ? FRONT.pa.map((p, i) => <PaStack key={`pa${i}`} at={p} hi={lit.has('pa')} />) : null}
            {stageWedges.map((wd) => (
              <WedgePlan key={wd.id} at={wd.at} faces={wd.faces} hi={lit.has(wd.id)} />
            ))}
            {/* Studio: each performer's headphone mix (no wedges in a studio). */}
            {cue.map((rig) => (
              <CueMixPlan key={rig.id} rig={rig} />
            ))}
            {studio && lit.has('hall') ? <Path path={walls} style="stroke" strokeWidth={60} color={AMBER} opacity={0.8} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={uniq} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(foots, cue.flatMap(cueCables))} />
    </View>
  );
}

/** A lesson's SettingPlan: the orchestra plan with its own instrument lit. */
export function orchestraPlanFor(own: OwnInstrument) {
  return function OwnOrchestraPlan(p: SettingPlanProps) {
    return <OrchestraPlan {...p} own={own} />;
  };
}

