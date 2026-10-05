/**
 * WindPlan — the woodwind section from above, for THE SETTING (LESSON_
 * JOURNEY §6 stage 3, §8). Every player is the family's own drawing (the
 * lesson's TOP view: the shared player figure, the chair, the instrument
 * with its keys) at true size in its seat — so a learner meets, from above,
 * exactly the instrument they will mic, among real neighbours: flutes and
 * piccolo, oboes, clarinets and bass clarinet, bassoons; the shared music
 * stands; then (STAGE) the floor wedges, the PA and the audience side, or
 * (STUDIO) the main pair above the conductor and the room.
 *
 * The lesson's own player is lit with an amber ring; the item a learner taps
 * (or steps to with ITEM) is ringed too. Positions are a typical layout
 * (windPlanModel.ts, drawing defaults). Nothing moves (D8); the neighbours'
 * paths are built once (module caches).
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { SettingItem, VariantId } from '../../../engine/model/types.ts';
import type { SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { WindScene } from './WindArt';
import { bassClarinetLayout, bassoonLayout, fluteLayout, straightReedLayout, type Layout } from './windPosture.ts';
import { BASSOON, CLARINET, OBOE, PICCOLO, bassClarinetSpec, fluteSpec } from './windSpec.ts';
import { PLAN_BOX, SLOTS, STAGE, STANDS, planHit, toPlan, type Kind, type SlotId } from './windPlanModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';

/* the neighbours' layouts, built on first use */
const LAYOUTS: Partial<Record<Kind, Layout>> = {};
function layoutOfKind(k: Kind): Layout {
  return (LAYOUTS[k] ??=
    k === 'flute'
      ? fluteLayout(fluteSpec('metal'), 'seated')
      : k === 'piccolo'
        ? fluteLayout(PICCOLO, 'seated')
        : k === 'clarinet'
          ? straightReedLayout(CLARINET, 'seated', 35)
          : k === 'oboe'
            ? straightReedLayout(OBOE, 'seated', 40)
            : k === 'bassClarinet'
              ? bassClarinetLayout(bassClarinetSpec('eflat'))
              : bassoonLayout('seated', BASSOON));
}

/* ── static furniture from above ── */
let furniture: { stands: SkPath; standLegs: SkPath; podium: SkPath; pa: SkPath; paCones: SkPath; seats: SkPath; walls: SkPath; mainBar: SkPath; mainMics: SkPath; mainLegs: SkPath } | null = null;
function furnitureOf() {
  if (furniture) return furniture;
  const stands = make();
  const standLegs = make();
  for (const s of STANDS) {
    // The desk, tilted toward the players (seen from above as a shallow
    // trapezoid), and the tripod's three feet.
    const { u, v } = s.at;
    stands.moveTo(u - 250, v - 30);
    stands.lineTo(u + 250, v - 30);
    stands.lineTo(u + 236, v + 14);
    stands.lineTo(u - 236, v + 14);
    stands.close();
    for (const a of [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 - (2 * Math.PI) / 3]) {
      standLegs.moveTo(u, v);
      standLegs.lineTo(u + Math.cos(a) * 230, v + Math.sin(a) * 230);
    }
  }
  const c = STAGE.conductor;
  const podium = make();
  podium.addRRect(Skia.RRectXY(Skia.XYWHRect(c.u - 450, c.v - 330, 900, 760), 30, 30));
  const pa = make();
  const paCones = make();
  for (const p of STAGE.pa) {
    pa.addRRect(Skia.RRectXY(Skia.XYWHRect(p.u - 330, p.v - 260, 660, 520), 22, 22));
    paCones.addRRect(Skia.RRectXY(Skia.XYWHRect(p.u - 300, p.v + 196, 600, 50), 10, 10));
  }
  const seats = make();
  for (let row = 0; row < 3; row++) {
    for (let i = -7; i <= 6; i++) {
      const u = i * 520 + 260;
      const v = STAGE.audienceV + 220 + row * 520;
      seats.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 220, v - 40, 440, 140), 40, 40));
    }
  }
  const H = STAGE.hall;
  const walls = make();
  walls.addRect(Skia.XYWHRect(H.u0, H.v0, H.u1 - H.u0, H.v1 - H.v0));
  const m = STAGE.main;
  const mainBar = make();
  mainBar.moveTo(m.u - 160, m.v);
  mainBar.lineTo(m.u + 160, m.v);
  const mainMics = make();
  for (const s of [-1, 1]) {
    mainMics.addRRect(Skia.RRectXY(Skia.XYWHRect(m.u + s * 130 - 11, m.v - 110, 22, 104), 9, 9));
  }
  const mainLegs = make();
  for (const a of [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 - (2 * Math.PI) / 3]) {
    mainLegs.moveTo(m.u, m.v + 30);
    mainLegs.lineTo(m.u + Math.cos(a) * 380, m.v + 30 + Math.sin(a) * 380);
  }
  furniture = { stands, standLegs, podium, pa, paCones, seats, walls, mainBar, mainMics, mainLegs };
  return furniture;
}

/** A floor wedge from above: the cabinet, its sloped grille toward `faces`. */
function wedgePath(c: { u: number; v: number }, faces: { u: number; v: number }): { box: SkPath; grille: SkPath } {
  const a = Math.atan2(faces.v, faces.u);
  const R = (x: number, y: number): [number, number] => [c.u + x * Math.cos(a) - y * Math.sin(a), c.v + x * Math.sin(a) + y * Math.cos(a)];
  const box = make();
  const pts = [R(-230, -300), R(230, -300), R(230, 300), R(-230, 300)];
  pts.forEach(([u, v], i) => (i === 0 ? box.moveTo(u, v) : box.lineTo(u, v)));
  box.close();
  const grille = make();
  const g = [R(-20, -270), R(215, -270), R(215, 270), R(-20, 270)];
  g.forEach(([u, v], i) => (i === 0 ? grille.moveTo(u, v) : grille.lineTo(u, v)));
  grille.close();
  return { box, grille };
}

export type WindPlanConfig = {
  own: SlotId;
  /** The lesson's own drawing per variant (its seated default first). */
  layoutOf: (variant: VariantId) => Layout;
  /** The section's words in the corner. */
  ownLabel: string;
};

/** The SettingPlan the engine's setting page (or the family's) draws. */
export function windPlanFor(cfg: WindPlanConfig) {
  return function WindPlanView(p: SettingPlanProps): ReactElement {
    return <WindPlan {...p} cfg={cfg} />;
  };
}

const planIds = (it: SettingItem): readonly string[] => it.planIds ?? [it.id];

function WindPlan({ w, h, scene, variant, items, wedges, highlight, onTap, accessibilityLabel, cfg }: SettingPlanProps & { cfg: WindPlanConfig }) {
  const textScale = useStageTextScale();
  const box = scene === 'kit' ? PLAN_BOX.section : PLAN_BOX.wide;
  const xf = useMemo(() => fitXform('top', box, w, h, 4), [box, w, h]);
  const f = furnitureOf();
  const own = cfg.own;
  const ownL = cfg.layoutOf(variant);
  const shown = items.filter((i) => i.scene === 'all' || i.scene === scene || (scene !== 'kit' && i.scene === 'kit'));
  const lit = new Set<string>(highlight ? planIds(items.find((i) => i.id === highlight) ?? ({ id: highlight } as SettingItem)) : []);
  const wedgesAt = wedges.map((wd) => ({ id: wd.id, at: toPlan(own, { x: wd.p.x, z: wd.p.z }), faces: { u: wd.faces.x, v: wd.faces.z } }));
  const ringAt = (id: string): { u: number; v: number; r: number } | null => {
    if (id === 'self') return { u: SLOTS[own].at.u - 120, v: SLOTS[own].at.v, r: 640 };
    const s = SLOTS[id as SlotId];
    if (s) return { u: s.at.u + (s.kind === 'flute' || s.kind === 'piccolo' ? -180 : 0), v: s.at.v - 40, r: 600 };
    const st = STANDS.find((q) => q.id === id);
    if (st) return { u: st.at.u, v: st.at.v, r: 300 };
    if (id === 'conductor') return { u: STAGE.conductor.u, v: STAGE.conductor.v, r: 520 };
    if (id === 'main') return { u: STAGE.main.u, v: STAGE.main.v, r: 380 };
    const wd = wedgesAt.find((q) => q.id === id);
    if (wd) return { u: wd.at.u, v: wd.at.v, r: 420 };
    if (id === 'pa') return null;
    return null;
  };
  const rings = [...lit].map(ringAt).filter((x): x is { u: number; v: number; r: number } => !!x);
  const tap = (sx: number, sy: number) => {
    const u = (sx - xf.ox) / xf.s;
    const v = (sy - xf.oy) / xf.s;
    const hit = planHit(u, v, 40 / xf.s, { scene, wedges: wedgesAt });
    if (!hit) return;
    const id = hit === own ? 'self' : hit;
    const it = shown.find((i) => planIds(i).includes(id));
    if (it) onTap(it.id);
  };
  const labels: StaticLabel[] = [];
  for (const [id, s] of Object.entries(SLOTS) as [SlotId, (typeof SLOTS)[SlotId]][]) {
    labels.push({ id, text: id === own ? cfg.ownLabel : s.label, short: s.label.split(' ')[0], u: s.at.u - 60, v: s.at.v - 470, align: 'center', tone: id === own ? 'amber' : 'muted' });
  }
  if (scene !== 'kit') labels.push({ id: 'cond', text: 'CONDUCTOR', u: STAGE.conductor.u + 520, v: STAGE.conductor.v, align: 'left', tone: 'muted' });
  if (scene === 'stage') {
    labels.push({ id: 'aud', text: 'AUDIENCE', u: 0, v: STAGE.audienceV + 120, align: 'center', tone: 'muted' });
    for (const wd of wedgesAt) labels.push({ id: `w.${wd.id}`, text: wedges.find((q) => q.id === wd.id)?.short ?? 'WEDGE', u: wd.at.u, v: wd.at.v + 380, align: 'center', tone: 'blue' });
  }
  if (scene === 'studio') labels.push({ id: 'main', text: 'MAIN PAIR', u: STAGE.main.u + 260, v: STAGE.main.v - 120, align: 'left', tone: 'blue' });
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {/* the stage floor */}
            <Path path={f.walls}>
              <LinearGradient start={vec(0, STAGE.hall.v0)} end={vec(0, STAGE.hall.v1)} colors={['#17181d', '#121317', '#0d0e11']} />
            </Path>
            {scene === 'studio' ? <Path path={f.walls} style="stroke" strokeWidth={70} color="#2a2d35" /> : null}
            {scene === 'stage' ? (
              <>
                <Path path={f.seats} color="#2a1c1c" />
                <Path path={f.seats} style="stroke" strokeWidth={10} color="#4a3232" />
                <Path path={f.pa}>
                  <LinearGradient start={vec(-3600, 2900)} end={vec(-3000, 3400)} colors={['#3a3d45', '#1c1d22']} />
                </Path>
                <Path path={f.paCones} color="#0a0a0c" />
              </>
            ) : null}
            {scene !== 'kit' ? (
              <>
                <Path path={f.podium}>
                  <LinearGradient start={vec(-450, 2200)} end={vec(450, 2900)} colors={['#4a3a2c', '#2a2018']} />
                </Path>
                <Path path={f.podium} style="stroke" strokeWidth={8} color="#120d09" />
                <Circle cx={STAGE.conductor.u} cy={STAGE.conductor.v + 40} r={110}>
                  <RadialGradient c={vec(STAGE.conductor.u - 40, STAGE.conductor.v)} r={140} colors={['#7c8492', '#3b404a']} />
                </Circle>
              </>
            ) : null}
            {/* the shared music stands */}
            <Path path={f.standLegs} style="stroke" strokeWidth={22} color="#0e0f12" strokeCap="round" />
            <Path path={f.standLegs} style="stroke" strokeWidth={9} color="#5d636e" strokeCap="round" />
            <Path path={f.stands}>
              <LinearGradient start={vec(0, -60)} end={vec(0, 40)} colors={['#2c2f36', '#121317']} />
            </Path>
            <Path path={f.stands} style="stroke" strokeWidth={8} color="#4d525c" />
            {/* the players, each with its own instrument, from above */}
            {(Object.entries(SLOTS) as [SlotId, (typeof SLOTS)[SlotId]][]).map(([id, s]) => (
              <Group key={id} transform={[{ translateX: s.at.u }, { translateY: s.at.v }]}>
                <WindScene L={id === own ? ownL : layoutOfKind(s.kind)} view="top" showJet={false} playerDim={id === own ? 1 : 0.62} />
              </Group>
            ))}
            {/* the wedges and the main pair */}
            {scene === 'stage'
              ? wedgesAt.map((wd) => {
                  const wp = wedgePath(wd.at, wd.faces);
                  return (
                    <Group key={wd.id}>
                      <Path path={wp.box}>
                        <LinearGradient start={vec(wd.at.u - 250, wd.at.v - 300)} end={vec(wd.at.u + 250, wd.at.v + 300)} colors={['#3b3e46', '#1a1b20']} />
                      </Path>
                      <Path path={wp.grille} color="#0b0b0e" />
                      <Path path={wp.box} style="stroke" strokeWidth={10} color="#6fa8ff" opacity={0.55} />
                    </Group>
                  );
                })
              : null}
            {scene === 'studio' ? (
              <>
                <Path path={f.mainLegs} style="stroke" strokeWidth={22} color="#0e0f12" strokeCap="round" />
                <Path path={f.mainLegs} style="stroke" strokeWidth={10} color="#7d838e" strokeCap="round" />
                <Path path={f.mainBar} style="stroke" strokeWidth={22} color="#9aa1ad" strokeCap="round" />
                <Path path={f.mainMics} color="#d4d8df" />
              </>
            ) : null}
            {/* the lesson's own player, and whatever is highlighted */}
            <Circle cx={SLOTS[own].at.u - 120} cy={SLOTS[own].at.v} r={650} style="stroke" strokeWidth={14} color={AMBER} opacity={0.75}>
              <DashPathEffect intervals={[60, 40]} />
            </Circle>
            {rings.map((r, i) => (
              <Circle key={i} cx={r.u} cy={r.v} r={r.r} style="stroke" strokeWidth={22} color={AMBER}>
                <BlurMask blur={8} style="solid" />
              </Circle>
            ))}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    </Pressable>
  );
}
