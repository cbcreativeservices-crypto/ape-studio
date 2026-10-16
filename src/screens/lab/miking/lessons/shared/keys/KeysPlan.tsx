/**
 * WHERE IT SITS for the electric pianos (LESSON_JOURNEY §8): a stage (or a
 * studio room) from above, at its real scale in mm, the audience to the
 * right (+u), with the neighbours drawn as illustrated objects seen from
 * above. The SAME frame the Studio-or-live page's monitors use:
 *
 *   tine piano   u = x, v = z of the combo's frame C — the combo at the
 *                origin facing the audience, the keyboard 1500 mm to its side
 *                (a drawing default), the player seated behind it
 *   reed piano   u = −x, v = z of frame W — the instrument at the origin, its
 *                speakers facing the PLAYER, who sits on the stage side and
 *                faces the audience over it
 *
 * The player's KEEP-CLEAR space (hands, knees, the sustain pedal) is drawn
 * dashed. Positions are a typical layout, never a measurement (`prov`
 * internal). Static: it changes only on a tap or a switch (D8).
 *
 * The layout lives in keysPlanModel.ts (pure: the plans' overlap test reads
 * the same numbers). Collision pass 2026-10-15: the shared five-piece kit,
 * the shared amp and PA, the studio headphone mix (CueMixPlan), and every
 * word clear of every object.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Wedge2WayTop } from '../wedge2Way';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from '../speakers/speakerModel.ts';
import { C_BASS, C_TREBLE } from './wurliModel.ts';
import { KEYS } from './KeysArt';
import { ChairsTop, chairRowFacingStage, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import { KitTop } from '../kitScene/KitSceneArt';
import { PlanAmpTop, PlanPaStack } from '../speakers/BacklinePlan';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { cueLabels } from '../monitoring/cueMix.ts';
import { clearOfFoots, labelPlaces, unionRect } from '../planFoot.ts';
import { BENCH, CHAIR_ROW, DI, inAisle, KEYS_BOX, KEYS_KIT_AT, KEYS_POS, OTHER_AMP, PEDAL, SHOULDERS, keyboardDims, keysCue, keysFoots, keysItemFootIds, keysItems, keysKeep, keysPaAt, keysRoomDrawn, keysWedgeAt, type KeysRig, type KeysScene } from './keysPlanModel.ts';

/** An audience member's head icon, crown→chin, mm (a real head ≈ 230 mm). */

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

export type { KeysRig, KeysScene } from './keysPlanModel.ts';
export { KEYS_BOX, KEYS_POS, keysItems } from './keysPlanModel.ts';

type Built = ReturnType<typeof build>;
const cache = new Map<KeysRig, Built>();

function keyboardTop(cu: number, cv: number, width: number, depth: number, keyDepth: number, nWhite: number) {
  // From above with the player at −u: the case, a dark lid, the keys on the −u edge.
  const body = rr(cu - depth / 2, cv - width / 2, cu + depth / 2, cv + width / 2, 40);
  const lid = rr(cu - depth / 2 + keyDepth + 40, cv - width / 2 + 30, cu + depth / 2 - 24, cv + width / 2 - 30, 30);
  const whites = make();
  const lines = make();
  const blacks = make();
  const k0 = cv - width / 2 + 70;
  const kw = (width - 140) / nWhite;
  const u0 = cu - depth / 2 + 14;
  const u1 = u0 + keyDepth;
  whites.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, k0, keyDepth, width - 140), 6, 6));
  const pat = [true, true, false, true, true, true, false];
  for (let i = 1; i < nWhite; i++) {
    lines.moveTo(u0, k0 + i * kw);
    lines.lineTo(u1, k0 + i * kw);
    if (pat[(i - 1) % 7]) blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 + keyDepth * 0.38, k0 + i * kw - kw * 0.3, keyDepth * 0.62, kw * 0.6), 4, 4));
  }
  return { body, lid, whites, lines, blacks };
}

function build(rig: KeysRig) {
  const c = cabLayout('combo12');
  const amp = rig === 'rhodes' ? rr(c.box.x0, c.box.z0, c.box.x1, c.box.z1, 16) : null;
  const ampFront = rig === 'rhodes' ? rr(c.box.x1 - 20, c.box.z0 + 24, c.box.x1, c.box.z1 - 24, 4) : null;
  const handle = rig === 'rhodes' ? rr((c.box.x0 + c.box.x1) / 2 - 20, (c.box.z0 + c.box.z1) / 2 - 80, (c.box.x0 + c.box.x1) / 2 + 20, (c.box.z0 + c.box.z1) / 2 + 80, 12) : null;
  const k = keyboardDims(rig);
  const kb = keyboardTop(k.cu, k.cv, k.width, k.depth, k.keyDepth, k.nWhite);
  // the reed piano's two speakers seen from above, facing the player (−u)
  const ovals = make();
  if (rig === 'wurli')
    for (const c2 of [C_BASS, C_TREBLE]) ovals.addRRect(Skia.RRectXY(Skia.XYWHRect(-c2.x - 4, c2.z - 102, 30, 204), 10, 10));
  // the player from above (minimal line art), facing the audience (+u)
  const shoulders = make();
  shoulders.addOval(Skia.XYWHRect(-SHOULDERS.hu, -SHOULDERS.hv, 2 * SHOULDERS.hu, 2 * SHOULDERS.hv));
  // The player's head from above is the figure's own (head fix 2026-10-08: a
  // head ON A BODY is PlayerFigure's skin silhouette, never a circle); its
  // nose points +v, turned below to face +u.
  const headTop = headAbove(pt(0, 0), 100).fill;
  const bench = rr(BENCH.u0, BENCH.v0, BENCH.u1, BENCH.v1, 20);
  const K = keysKeep(rig);
  const keep = rr(K.u0, K.v0, K.u1, K.v1, 60);
  const pedal = rr(-PEDAL.hu, -PEDAL.hv, PEDAL.hu, PEDAL.hv, 14);
  const di = rr(-DI.hu, -DI.hv, DI.hu, DI.hv, 10);
  // The audience: one row of true-size empty chairs facing the stage (−u) —
  // an audience is its chairs, never heads (owner 2026-10-10) — with a centre
  // aisle (2026-10-15).
  const chairs = makeChairsTop(chairRowFacingStage(CHAIR_ROW.u, CHAIR_ROW.v0, CHAIR_ROW.v1).filter(inAisle));
  const B = KEYS_BOX[rig];
  const deck = rr(B.stage.u0, B.stage.v0, KEYS_POS.audience - 450, B.stage.v1, 0);
  const R = keysRoomDrawn(rig);
  const room = rr(R.u0, R.v0, R.u1, R.v1, 40);
  return { amp, ampFront, handle, kb, ovals, shoulders, headTop, bench, keep, pedal, di, chairs, deck, room };
}

export function KeysPlan({ w, h, rig, scene, wedges, highlight, onTap, shortOf, accessibilityLabel }: { w: number; h: number; rig: KeysRig; scene: KeysScene; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = KEYS_BOX[rig][scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  let g = cache.get(rig);
  if (!g) {
    g = build(rig);
    cache.set(rig, g);
  }
  const P = KEYS_POS[rig];
  const items = keysItems(rig, scene, wedges);
  const hi = items.find((i) => i.id === highlight);
  // Collision pass 2026-10-15: every word keeps clear of every object (the
  // plan's footprints) — just outside its own object (below, right, left,
  // above), else in free space with a leader back to it. The audience is
  // named in its aisle.
  const foots = useMemo(() => keysFoots(rig, scene, wedges), [rig, scene, wedges]);
  const footOf = (id: string) => {
    const ids = id === 'drums' ? foots.filter((f) => f.group === 'kit').map((f) => f.id) : keysItemFootIds(rig, id, wedges);
    const fs = foots.filter((f) => ids.includes(f.id));
    return fs.length ? unionRect(fs) : null;
  };
  const cue = scene === 'studio' ? keysCue(rig) : null;
  const labels: StaticLabel[] = [
    ...items.map((i) => {
      const own = footOf(i.id);
      const places = own ? labelPlaces(own, xf.s / ts) : [{ u: i.u, v: i.v + i.r * 0.72 + 90, align: 'center' as const }];
      const first = i.id === 'audience' ? { u: KEYS_POS.audience, v: 0, align: 'center' as const } : places[0];
      return { id: i.id, text: shortOf(i.id), u: first.u, v: first.v, align: first.align, alts: i.id === 'audience' ? [] : places.slice(1), point: { u: i.u, v: i.v }, tone: i.id === 'amp' ? ('amber' as const) : i.id === 'pedal' ? ('muted' as const) : undefined };
    }),
    ...(cue ? cueLabels(cue).map((l) => ({ ...l, tone: 'illustrative' as const })) : []),
  ];
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
  const wedgeAt = (wd: Wedge) => keysWedgeAt(rig, wd);
  const K = KEYS_KIT_AT[rig];
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'stage' ? (
              <Path path={g.deck}>
                <LinearGradient start={vec(0, box.v0)} end={vec(0, box.v1)} colors={['#1a1714', '#141210', '#0e0c0b']} />
              </Path>
            ) : (
              <>
                <Path path={g.room} color="#121216" />
                <Path path={g.room} style="stroke" strokeWidth={40} color="#2a2a31" />
              </>
            )}
            {/* the player's keep-clear space: hands, knees and the sustain pedal */}
            <Path path={g.keep} color={GREY} opacity={0.08} />
            <Path path={g.keep} style="stroke" strokeWidth={22} color={GREY} opacity={0.6}>
              <DashPathEffect intervals={[70, 50]} />
            </Path>
            {/* the drum kit (stage only): the shared five-piece kit, true size */}
            {scene === 'stage' ? (
              <Group transform={[{ translateX: K.u }, { translateY: K.v }]}>
                <KitTop keepOuts={false} />
              </Group>
            ) : null}
            {/* the other amp on the backline: a 2 × 12 combo (690 × 270) */}
            <Group transform={[{ translateX: P.otherAmp.u }, { translateY: P.otherAmp.v }]}>
              <PlanAmpTop u0={OTHER_AMP.u0} u1={OTHER_AMP.u1} v0={OTHER_AMP.v0} v1={OTHER_AMP.v1} />
            </Group>
            {/* the combo (tine piano) */}
            {g.amp ? (
              <>
                <Path path={g.amp} color="#000" opacity={0.5}>
                  <BlurMask blur={40} style="normal" />
                </Path>
                <Path path={g.amp}>
                  <LinearGradient start={vec(-300, -400)} end={vec(200, 400)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
                </Path>
                <Path path={g.ampFront!}>
                  <LinearGradient start={vec(0, -300)} end={vec(0, 300)} colors={['#3d3f46', '#2b2d33', '#1b1c20']} />
                </Path>
                <Path path={g.handle!} color="#0a0a0c" />
              </>
            ) : null}
            {/* the sustain pedal, on the floor: under the front of the tine piano's
                keybed, so the keyboard is drawn over it (its heel end shows) */}
            <Group transform={[{ translateX: P.pedal.u }, { translateY: P.pedal.v }]}>
              <Path path={g.pedal}>
                <LinearGradient start={vec(-70, -45)} end={vec(70, 45)} colors={[...KEYS.chrome]} />
              </Path>
            </Group>
            {/* the keyboard */}
            <Path path={g.kb.body} color="#000" opacity={0.5}>
              <BlurMask blur={30} style="normal" />
            </Path>
            <Path path={g.kb.body}>
              <LinearGradient start={vec(0, -600)} end={vec(600, 600)} colors={rig === 'rhodes' ? [...KEYS.tolex] : [...KEYS.plastic]} />
            </Path>
            <Path path={g.kb.lid}>
              <LinearGradient start={vec(0, -500)} end={vec(500, 500)} colors={rig === 'rhodes' ? ['#4d4f57', '#2a2c31', '#141519'] : ['#a85a46', '#6e3226', '#3a1810']} />
            </Path>
            <Path path={g.kb.whites}>
              <LinearGradient start={vec(0, 0)} end={vec(200, 0)} colors={[...KEYS.ivory]} />
            </Path>
            <Path path={g.kb.lines} style="stroke" strokeWidth={4} color="#7d796f" opacity={0.7} />
            <Path path={g.kb.blacks} color="#0d0d10" />
            {rig === 'wurli' ? <Path path={g.ovals} color="#16110e" /> : null}
            {/* the DI box */}
            <Group transform={[{ translateX: P.di.u }, { translateY: P.di.v }]}>
              <Path path={g.di}>
                <LinearGradient start={vec(-60, -45)} end={vec(60, 45)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
              </Path>
            </Group>
            {/* the player on the bench */}
            <Group transform={[{ translateX: P.player.u }, { translateY: P.player.v }]}>
              <Path path={g.bench} color="#26272c" />
              <Path path={g.shoulders}>
                <RadialGradient c={vec(-40, -80)} r={300} colors={['#5a5d66', '#33363d', '#1c1d22']} />
              </Path>
              <Group transform={[{ rotate: -Math.PI / 2 }]}>
                <FigureHead fill={g.headTop} />
              </Group>
            </Group>
            {scene === 'stage'
              ? wedges.map((wd) => {
                  const a = wedgeAt(wd);
                  return (
                    <Group key={wd.id} transform={[{ translateX: a.u }, { translateY: a.v }, { rotate: a.a }]}>
                      {/* a 2-way floor wedge at true size (shared/wedge2Way.tsx) */}
                      <Wedge2WayTop />
                    </Group>
                  );
                })
              : null}
            {scene === 'stage' ? (
              <>
                {keysPaAt(rig).map((p) => (
                  <Group key={p.v} transform={[{ translateX: p.u }, { translateY: p.v }]}>
                    <PlanPaStack />
                  </Group>
                ))}
                <ChairsTop seats={g.chairs.seats} backs={g.chairs.backs} color="#7d828d" />
              </>
            ) : null}
            {/* Studio: the player's headphone mix (no wedges in a studio). */}
            {cue ? <CueMixPlan rig={cue} /> : null}
            {hi ? <Circle cx={hi.u} cy={hi.v} r={hi.r + 40} style="stroke" strokeWidth={34} color={AMBER} opacity={0.9} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} h={h} clearOf={clearOfFoots(foots)} />
      </View>
    </Pressable>
  );
}
