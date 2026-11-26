/**
 * HandPlan — THE SETTING for the hand-drum family (LESSON_JOURNEY §6 stage
 * 3, §8): the band seen from above, with the lesson's own drums drawn by its
 * art (top view), the player at them, and the neighbours as illustrated real
 * objects — a drum kit, a bass amp, other percussion, a vocal mic, floor
 * monitors, the audience and PA, or a studio room. Lit from the upper left
 * like the rest of the lab. Positions are ILLUSTRATIVE (said in the badge).
 *
 * Nothing moves (D8). A tap names an item; the dock's ITEM fader is the
 * no-tap path to the same cards.
 *
 * Collision pass 2026-10-15: the sizes and footprints come from the pure
 * layout (handPlanModel.ts — the overlap test reads the same numbers); in a
 * STUDIO every performer has a personal headphone mixer fed from the
 * CONTROL ROOM (no wedges); the names keep clear of every object.
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Wedge2WayTop } from '../wedge2Way';
import { KitTop } from '../kitScene/KitSceneArt';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { VariantId } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels } from '../../../engine/scene/StaticLabels';
import type { PlanThing } from './family.ts';
import { INK } from './handDrumArt';
import { AMP_TOP, KEYS_TOP, kitOrigin, MICSTAND_TOP, PA_TOP, PERC_TOP, PLAYER_TOP, ROOM_WALL, SIDEFILL_TOP, handPlanLabels, keysBench, micLegAngles, paStacks, planCue, planRoom, shownThings, type ArtPlan, type PlanBox, type PlanCueSpec } from './handPlanModel.ts';
import { clearOfFoots, foot, planTurn, unionRect, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { cueCables } from '../monitoring/cueMix.ts';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
// (figure V2, wave 6 of D78: the plan player in the approved look, behind `v2`)
import { PlayerTopV2 } from '../figureV2/elsewhereTop';
import { handDrumPlayer } from '../figureV2/markerPose';
import { castFor, type CastMember } from '../figureV2/cast';
// (cast figures 2026-11-26) a neighbor who holds an acoustic guitar: the guitar family's own player and plan chair
import { GuitarSceneArt } from '../guitars/GuitarArt';
import { ChairPlan, type PlanObject } from '../guitars/StagePlan';
import { planFrame, playerRect, SIZES } from '../guitars/stagePlanModel.ts';
import { sceneOf, type GuitarScene } from '../guitars/guitarModel.ts';
import { C01_VARIANTS } from '../../c01Guitar/model.ts';

/** The player's head from above (nose +v), built once on first draw. */
let playerHeadTop: ReturnType<typeof headAbove>['fill'] | null = null;
const getPlayerHeadTop = () => (playerHeadTop ??= headAbove(pt(0, 0), 96).fill);

const AMBER = '#ffc64d';
type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/** How far a tap may land from a thing's anchor and still name it (mm). */
const REACH: Record<PlanThing['kind'], number> = { kit: 900, amp: 330, perc: 360, micstand: 260, wedge: 330, sidefill: 360, audience: 500, room: 140, player: 330, drums: 420, keys: 520 };

export function planHit(things: readonly PlanThing[], scene: 'kit' | 'stage' | 'studio', u: number, v: number, tol: number, box: { u0: number; u1: number; v0: number; v1: number }): string | null {
  const shown = things.filter((t) => t.scene === 'all' || t.scene === scene);
  let best: string | null = null;
  let bd = 1e12;
  for (const t of shown) {
    if (t.kind === 'room') {
      const edge = Math.min(Math.abs(u - box.u0), Math.abs(u - box.u1), Math.abs(v - box.v0), Math.abs(v - box.v1));
      if (edge <= REACH.room + tol && edge < bd) {
        bd = edge;
        best = t.id;
      }
      continue;
    }
    if (t.kind === 'audience') {
      if (u >= t.u - REACH.audience - tol && u - t.u < bd) {
        bd = Math.max(0, u - t.u);
        best = t.id;
      }
      continue;
    }
    const d = Math.hypot(u - t.u, v - t.v);
    if (d <= REACH[t.kind] + tol && d < bd) {
      bd = d;
      best = t.id;
    }
  }
  return best;
}

/* ── the illustrated neighbours (mm, centred on their anchor) ── */
function headDisc(cx: number, cy: number, r: number, coated = true) {
  return (
    <Group key={`${cx}:${cy}`}>
      <Circle cx={cx + 6} cy={cy + 9} r={r + 8} color="#000" opacity={0.5}>
        <BlurMask blur={8} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r + 7}>
        <RadialGradient c={vec(cx - r * 0.5, cy - r * 0.5)} r={r * 1.8} colors={['#b9bec8', '#5b5f69', '#25272d']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.6} colors={coated ? ['#fbf8f0', '#ece5d5', '#cfc4ad'] : ['#f6e9cc', '#e6cf9e', '#c9a874']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={1.4} color="#6e6655" />
    </Group>
  );
}
function cymbal(cx: number, cy: number, r: number) {
  const lathe = make();
  for (let q = r * 0.3; q < r - 4; q += 10) lathe.addCircle(cx, cy, q);
  return (
    <Group key={`c${cx}:${cy}`}>
      <Circle cx={cx + 8} cy={cy + 11} r={r} color="#000" opacity={0.45}>
        <BlurMask blur={10} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.4, cy - r * 0.45)} r={r * 1.7} colors={['#ffe9a8', '#d6a84a', '#8a6420', '#3d2a08']} />
      </Circle>
      <Path path={lathe} style="stroke" strokeWidth={1} color="#5a4010" opacity={0.35} />
      <Circle cx={cx} cy={cy} r={r * 0.2} color="#b58a34" />
      <Circle cx={cx} cy={cy} r={6} color="#2a2c32" />
    </Group>
  );
}
function cabinet(cx: number, cy: number, w: number, d: number, face: number, grille = true) {
  return (
    <Group key={`k${cx}:${cy}`} transform={[{ translateX: cx }, { translateY: cy }, { rotate: face }]}>
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2 + 12, -w / 2 + 16, d, w), 14, 14)); return p; })()} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2, -w / 2, d, w), 14, 14)); return p; })()}>
        <LinearGradient start={vec(-d / 2, -w / 2)} end={vec(d / 2, w / 2)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      {grille ? (
        <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(d / 2 - 26, -w / 2 + 14, 18, w - 28), 6, 6)); return p; })()} color="#0c0d10" />
      ) : null}
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2, -w / 2, d, w), 14, 14)); return p; })()} style="stroke" strokeWidth={3} color="#70747f" />
    </Group>
  );
}

/* ── (cast figures 2026-11-26, owner ruling) the neighbor who holds an acoustic guitar (I02's guitarist) ──
 * Not a new drawing: C01's own seated player with C01's steel-string dreadnought, from above, in the approved
 * look (GuitarSceneArt v2: the guitar family's player, the left hand on the neck, the right arm over the body,
 * the hands as that drawing brings them), on the C01 plan's chair (StagePlan ChairPlan at planFrame's chairZ) —
 * the guitar family's plan, turned into this plan: the head at the marker's point, facing +u, the neck to the
 * player's left (−v), as the marker faced. The person is the guitar family's (player.guitar). */
let aguitarScene: GuitarScene | null = null;
const getAguitarScene = (): GuitarScene => (aguitarScene ??= sceneOf(C01_VARIANTS.find((x) => x.id === 'steel') ?? C01_VARIANTS[0]));
let aguitarChair: PlanObject | null = null;
/** The drawn guitarist's footprints on this plan (the guitar family's own: playerRect, the chair, the instrument
 *  from the tail to the headstock), turned as the drawing is — so the words keep off what is drawn. */
function aguitarFoots(t: PlanThing): PlanFoot[] {
  const sc = getAguitarScene();
  const F = planFrame(sc);
  const g = sc.g;
  const C = SIZES.chair;
  const toPlan = (r: PlanRect): PlanRect => ({ u0: t.u + (r.v0 - F.head.z), u1: t.u + (r.v1 - F.head.z), v0: t.v - (r.u1 - F.head.x), v1: t.v - (r.u0 - F.head.x) });
  return [
    foot(`${t.id}:held.player`, 'player', toPlan(playerRect(sc))),
    foot(`${t.id}:held.chair`, 'chair', toPlan({ u0: F.head.x - C.half, u1: F.head.x + C.half, v0: F.chairZ - C.back, v1: F.chairZ + C.front })),
    foot(`${t.id}:held.instrument`, 'instrument', toPlan({ u0: g.tail, u1: g.L + g.spec.neck.headLen.mm, v0: -g.depth, v1: 40 })),
  ];
}
function AcousticGuitaristTop({ u, v, ptPerMm }: { u: number; v: number; ptPerMm: number }) {
  const sc = getAguitarScene();
  const F = planFrame(sc);
  const chair = (aguitarChair ??= { id: 'chair', kind: 'chair', at: { x: F.head.x, z: F.chairZ }, scene: 'kit' });
  // the guitar plan's (x, z) → this plan's (u, v) = (z, −x) about the head (a quarter turn: facing +z → +u)
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: -Math.PI / 2 }, { translateX: -F.head.x }, { translateY: -F.head.z }]}>
      <ChairPlan o={chair} hi={false} />
      <GuitarSceneArt sc={sc} view="top" v2 assumePtPerMm={ptPerMm} />
    </Group>
  );
}

function Thing({ t, Drums, variant, box, turnDrums, v2 = false, who, ptPerMm }: { t: PlanThing; Drums: (p: { view: 'top'; variant: VariantId; planTurn?: boolean }) => ReactElement; variant: VariantId; box: PlanBox; turnDrums?: boolean; v2?: boolean; who?: CastMember; ptPerMm: number }) {
  switch (t.kind) {
    case 'drums':
      return (
        <Group transform={[{ translateX: t.u }, { translateY: t.v }]}>
          {/* A lesson whose model frame is turned from the plan's draws its own
              top view turned (planTurn); every other lesson as before. */}
          {turnDrums ? <Drums view="top" variant={variant} planTurn /> : <Drums view="top" variant={variant} />}
        </Group>
      );
    case 'player': {
      // (figure V2: the player in the approved top view, both hands flat on the heads where the old arms reached)
      // (cast figures 2026-11-26) a neighbor who holds an acoustic guitar: the guitar family's seated player
      if (v2 && t.holds === 'aguitar') return <AcousticGuitaristTop u={t.u} v={t.v} ptPerMm={ptPerMm} />;
      if (v2)
        return <PlayerTopV2 player={handDrumPlayer(t.u, t.v)} who={who ?? castFor('plan.handDrums')} />;
      // A player seen from above: shoulders, arms reaching forward, head.
      const P = PLAYER_TOP;
      const sh = make();
      sh.addOval(Skia.XYWHRect(t.u - P.back, t.v - P.half, 2 * P.back, 2 * P.half));
      const arms = make();
      arms.moveTo(t.u + P.arm.u0, t.v - P.arm.v);
      arms.quadTo(t.u + 190, t.v - 200, t.u + P.arm.u1, t.v - 150);
      arms.moveTo(t.u + P.arm.u0, t.v + P.arm.v);
      arms.quadTo(t.u + 190, t.v + 200, t.u + P.arm.u1, t.v + 150);
      return (
        <Group>
          <Path path={sh} color="#000" opacity={0.5}>
            <BlurMask blur={14} style="normal" />
          </Path>
          <Path path={arms} style="stroke" strokeWidth={P.arm.w} strokeCap="round" color="#2d3a52" />
          <Path path={arms} style="stroke" strokeWidth={P.arm.w - 16} strokeCap="round" color="#3f5276" />
          <Path path={sh}>
            <LinearGradient start={vec(t.u - P.back, t.v - P.half)} end={vec(t.u + P.back, t.v + P.half)} colors={['#5a6e96', '#3f5276', '#26324a']} />
          </Path>
          {/* The head: the figure's own skin silhouette from above (head fix
              2026-10-08 — a head ON A BODY is PlayerFigure's FigureHead, never
              a circle), its nose toward the drums (+u). */}
          <Group transform={[{ translateX: t.u + P.headDu }, { translateY: t.v }, { rotate: -Math.PI / 2 }]}>
            <FigureHead fill={getPlayerHeadTop()} />
          </Group>
        </Group>
      );
    }
    case 'kit': {
      // the shared five-piece kit at true size, its drummer on the throne
      const o = kitOrigin(t);
      return (
        <Group transform={[{ translateX: o.u }, { translateY: o.v }]}>
          <KitTop keepOuts={false} />
        </Group>
      );
    }
    case 'amp':
      return cabinet(t.u, t.v, AMP_TOP.w, AMP_TOP.d, t.face ?? 0);
    case 'sidefill':
      return cabinet(t.u, t.v, SIDEFILL_TOP.w, SIDEFILL_TOP.d, t.face ?? 0);
    case 'wedge':
      // a 2-way floor wedge at true size, not an amp box (shared/wedge2Way.tsx)
      return (
        <Group transform={[{ translateX: t.u }, { translateY: t.v }, { rotate: t.face ?? 0 }]}>
          <Wedge2WayTop shadow />
        </Group>
      );
    case 'keys': {
      const K = KEYS_TOP;
      const keys = make();
      for (let k = 0; k < K.keys; k++) keys.addRect(Skia.XYWHRect(t.u - (K.keys * K.keyW) / 2 + k * K.keyW, t.v - 60, K.keyW - 5, 120));
      // The player's bench (no figure: the headphones rest on it in a studio).
      const b = keysBench(t);
      const bench = make();
      bench.addRRect(Skia.RRectXY(Skia.XYWHRect(b.u - K.bench.w / 2, b.v - K.bench.d / 2, K.bench.w, K.bench.d), 40, 40));
      return (
        <Group>
          {cabinet(t.u, t.v, K.w, K.d, Math.PI / 2, false)}
          <Path path={keys} color="#eceef2" />
          <Path path={bench}>
            <LinearGradient start={vec(b.u - K.bench.w / 2, b.v - K.bench.d / 2)} end={vec(b.u + K.bench.w / 2, b.v + K.bench.d / 2)} colors={['#3b2f2a', '#241c19', '#130f0d']} />
          </Path>
          <Path path={bench} style="stroke" strokeWidth={4} color="#5a4a40" />
        </Group>
      );
    }
    case 'micstand': {
      const M = MICSTAND_TOP;
      const legs = make();
      for (const a of micLegAngles()) {
        legs.moveTo(t.u, t.v);
        legs.lineTo(t.u + Math.cos(a) * M.leg, t.v + Math.sin(a) * M.leg);
      }
      const boom = make();
      boom.moveTo(t.u, t.v);
      boom.lineTo(t.u - M.boom, t.v);
      const mu = t.u - M.boom - 20;
      return (
        <Group>
          <Path path={legs} style="stroke" strokeWidth={M.legW} strokeCap="round" color={INK} />
          <Path path={legs} style="stroke" strokeWidth={M.legW - 7} strokeCap="round" color="#5b5f69" />
          <Path path={boom} style="stroke" strokeWidth={16} strokeCap="round" color="#4d515b" />
          <Circle cx={mu} cy={t.v} r={M.mic}>
            <RadialGradient c={vec(mu - 12, t.v - 12)} r={M.mic + 12} colors={['#9ba1ac', '#4c515b', '#1b1d22']} />
          </Circle>
        </Group>
      );
    }
    case 'perc': {
      const P = PERC_TOP;
      return (
        <Group>
          {P.heads.map((h) => headDisc(t.u + h.u, t.v + h.v, h.r, false))}
          <Path path={(() => { const p = make(); P.bell.forEach((b, i) => (i ? p.lineTo(t.u + b.u, t.v + b.v) : p.moveTo(t.u + b.u, t.v + b.v))); p.close(); return p; })()}>
            <LinearGradient start={vec(t.u + 110, t.v - 120)} end={vec(t.u + 240, t.v - 20)} colors={['#6b707b', '#2a2c32', '#121317']} />
          </Path>
        </Group>
      );
    }
    case 'audience': {
      // The deck's downstage edge (dashed) and the way to the house beyond it
      // (owner 2026-10-15: the audience is an off-plan DIRECTION here — a
      // half-metre strip past the lip is no audience floor).
      const lip = make();
      lip.moveTo(t.u, box.v0 + 40);
      lip.lineTo(t.u, box.v1 - 40);
      const arrows = make();
      const H = box.v1 - box.v0;
      for (const v of [box.v0 + H * 0.22, box.v1 - H * 0.22]) {
        arrows.moveTo(t.u + 90, v);
        arrows.lineTo(t.u + 300, v);
        arrows.moveTo(t.u + 264, v - 34);
        arrows.lineTo(t.u + 300, v);
        arrows.lineTo(t.u + 264, v + 34);
      }
      return (
        <Group>
          <Path path={lip} style="stroke" strokeWidth={8} color="#5d616c">
            <DashPathEffect intervals={[40, 26]} />
          </Path>
          <Path path={arrows} style="stroke" strokeWidth={14} color="#aab0bd" strokeCap="round" strokeJoin="round" />
          {/* The PA stacks on the deck's downstage corners, facing the audience. */}
          {paStacks(t, box).map((p) => cabinet(p.u, p.v, PA_TOP.w, PA_TOP.d, 0))}
        </Group>
      );
    }
    case 'room':
      return null;
  }
}

export type HandPlanProps = {
  w: number;
  h: number;
  scene: 'kit' | 'stage' | 'studio';
  variant: VariantId;
  Drums: (p: { view: 'top'; variant: VariantId; planTurn?: boolean }) => ReactElement;
  /** The lesson's model frame is turned from the plan's (HandExtra.plan.turn):
   *  the art draws its top view in the plan's frame. */
  turnDrums?: boolean;
  things: readonly PlanThing[];
  box: { u0: number; u1: number; v0: number; v1: number };
  /** The lesson's own art from above (its footprint, and its player's head
   *  when the art draws one): handPlanModel modelArtPlan / malletArtPlan. */
  art: ArtPlan;
  /** The studio's headphone mix (handPlanModel PlanCueSpec). */
  cue?: PlanCueSpec;
  shortOf: (id: string) => string;
  highlight: string | null;
  onTap: (id: string) => void;
  accessibilityLabel: string;
  /** (figure V2, wave 6 of D78) the plan's player in the approved look, as `who` — OFF by default: a lesson
   *  switches it on together with its own player. */
  v2?: boolean;
  who?: CastMember;
};

export function HandPlan({ w, h, scene, variant, Drums, turnDrums, things, box, art, cue, shortOf, highlight, onTap, accessibilityLabel, v2 = false, who }: HandPlanProps) {
  const textScale = useStageTextScale();
  // DOWNSTAGE = BOTTOM (owner 2026-10-16): the stage is drawn turned, the audience below.
  const T = useMemo(() => planTurn(scene === 'stage'), [scene]);
  const xf = useMemo(() => fitXform('top', T.rect(box), w, h, 6), [w, h, box, T]);
  const shown = shownThings(things, scene);
  // The studio's wall: drawn OUTSIDE the room's inner face (the plan box
  // inset by ROOM_INSET), so nothing in the room stands on it.
  const walls = useMemo(() => {
    const r = planRoom(box);
    const outer: SkPath = make();
    outer.addRect(Skia.XYWHRect(r.u0 - ROOM_WALL / 2, r.v0 - ROOM_WALL / 2, r.u1 - r.u0 + ROOM_WALL, r.v1 - r.v0 + ROOM_WALL));
    const inner: SkPath = make();
    inner.addRect(Skia.XYWHRect(r.u0 - 4, r.v0 - 4, r.u1 - r.u0 + 8, r.v1 - r.v0 + 8));
    return { outer, inner };
  }, [box]);
  // Collision pass 2026-10-15: the studio's headphone mix; the words kept
  // clear of every object (and of the studio's walls), each pointing back at
  // its object (handPlanModel — the same footprints the overlap test reads).
  const rig = useMemo(() => planCue(things, box, art, cue, scene), [things, box, art, cue, scene]);
  const planWords = handPlanLabels(things, box, scene, art, cue, shortOf, highlight, xf.s / textScale, T.places);
  // (cast figures 2026-11-26) a neighbor who holds an acoustic guitar is drawn larger than the marker's
  // footprint: its name goes round what is drawn (the same places, from the drawn footprints), and no word sits on it
  const held = v2 ? shown.filter((t) => t.kind === 'player' && t.holds === 'aguitar') : [];
  const heldFoots = held.map((t) => ({ t, fs: aguitarFoots(t) }));
  const labels = planWords.labels.map((l) => {
    const h = heldFoots.find((x) => x.t.id === l.id);
    if (!h) return l;
    const [first, ...alts] = T.places(unionRect(h.fs), xf.s / textScale);
    return { ...l, u: first.u, v: first.v, align: first.align, alts };
  });
  // (the person and the chair block the other words; the slim neck does not: the neighbors' names stay put)
  const blockers = [...planWords.blockers, ...heldFoots.flatMap((x) => x.fs.filter((f) => f.kind !== 'instrument'))];
  const hl = shown.find((t) => t.id === highlight);
  return (
    <Pressable
      onPress={(e) => {
        const { u, v } = T.unPt({ u: (e.nativeEvent.locationX - xf.ox) / xf.s, v: (e.nativeEvent.locationY - xf.oy) / xf.s });
        const id = planHit(things, scene, u, v, 30 / xf.s, box);
        if (id) onTap(id);
      }}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: w, height: h }}
    >
      <View style={{ width: w, height: h }} pointerEvents="none">
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }, { rotate: T.rotate }]}>
            {scene === 'studio' ? (
              <>
                <Path path={walls.outer} style="stroke" strokeWidth={ROOM_WALL} color="#2a2420" />
                <Path path={walls.inner} style="stroke" strokeWidth={8} color="#6b5a48" />
              </>
            ) : null}
            {shown.map((t) =>
              rig && held.includes(t) ? null : <Thing key={t.id} t={t} Drums={Drums} variant={variant} box={box} turnDrums={turnDrums} v2={v2} who={who} ptPerMm={xf.s} />,
            )}
            {/* Studio: each performer's headphone mix (no wedges in a studio). */}
            {rig ? <CueMixPlan rig={rig} /> : null}
            {/* (cast figures 2026-11-26) a seated guitarist's held neck and arms are above the floor's feeds: drawn
                over them, then his own headphones (and their cord) over him again */}
            {rig
              ? held.map((t) => (
                  <Group key={`held${t.id}`}>
                    <Thing t={t} Drums={Drums} variant={variant} box={box} turnDrums={turnDrums} v2={v2} who={who} ptPerMm={xf.s} />
                    {rig.stations.some((s) => s.id === t.id) ? <CueMixPlan rig={{ ...rig, stations: rig.stations.filter((s) => s.id === t.id) }} /> : null}
                  </Group>
                ))
              : null}
            {hl && hl.kind !== 'room' && hl.kind !== 'audience' ? <Circle cx={hl.u} cy={hl.v} r={REACH[hl.kind] * 0.8} style="stroke" strokeWidth={14} color={AMBER} opacity={0.9} /> : null}
            {hl && hl.kind === 'room' ? <Path path={walls.inner} style="stroke" strokeWidth={22} color={AMBER} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={T.labels(labels)} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(T.foots(blockers), T.cables(rig ? cueCables(rig) : []))} />
      </View>
    </Pressable>
  );
}
