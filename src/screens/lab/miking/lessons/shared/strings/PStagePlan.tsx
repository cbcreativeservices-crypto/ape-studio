/**
 * Page 3 for a Lab 4 instrument — THE SETTING: WHERE IT SITS (LESSON_JOURNEY
 * §6 stage 3, §8). A lesson's own page (LessonArt.pages.setting): the drum
 * page's kit plan does not fit a piano, a harp or an amplifier.
 *
 *   AROUND IT (rack)        the instrument and its player from above, with
 *                           what sits round them (a singer, a music stand, an
 *                           amplifier) as illustrated objects; tap an item (or
 *                           step through ITEM) to read what it means for a mic.
 *   STAGE AND STUDIO (rack) the same plan, wider: a STAGE (the monitors the
 *                           lesson's Studio-or-live page uses later, the
 *                           audience and the PA) or a STUDIO (the room, what
 *                           a distant pair would sit in, and each performer's
 *                           personal headphone mixer — no wedges in a studio).
 *   BEFORE ANY MIC (read)   ask the player and the owner first; protect your
 *                           hearing; then the three checks.
 * Positions are ILLUSTRATIVE (a typical layout); nothing moves (D8).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * any plan): every glyph's size and footprint lives in pstagePlanModel.ts
 * (pure — the overlap test reads the same numbers); the floor wedge is the
 * shared 2-way wedge at true size (D70); words keep clear of every object
 * (StaticLabels `clearOf`), moving to free space with a leader.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { tapsWhenFew } from '../../../engine/rack/fewStops.ts';
import type { SettingItem, VariantId, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import { copyOf } from '../../../engine/model/copy.ts';
import type { PageProps } from '../../../pages/pageTypes';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import { Wedge2WayTop } from '../wedge2Way';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { cueCables, cueLabels, type CueRig } from '../monitoring/cueMix.ts';
import { clearOfFoots, labelPlaces, rectOfCircle, unionRect, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { GLYPH, roomOfBox, spotAngle, spotFoots, spotsIn, type PlanGlyph, type PlanScene, type PlanSpot } from './pstagePlanModel.ts';

export type { PlanGlyph, PlanSpot } from './pstagePlanModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const AMBER = '#ffc64d';

export type StagePlanSpec = {
  /** The instrument and its player from above (the lesson's own art). */
  Own: (p: { variant: VariantId; lit: boolean }) => ReactElement;
  /** The SettingItem id the instrument itself stands for, and its hit test. */
  ownItem: string;
  ownHit: (variant: VariantId, u: number, v: number) => boolean;
  near: (variant: VariantId) => ViewBox;
  wide: (variant: VariantId) => ViewBox;
  /** The stage's wide plan when it must reach further (past the deck's edge
   *  for the AUDIENCE word); default `wide`. */
  wideStage?: (variant: VariantId) => ViewBox;
  spots: (variant: VariantId) => readonly PlanSpot[];
  /** Every object's footprint on a plan (the lesson's pure planModel.ts):
   *  the words keep clear of them. */
  foots: (variant: VariantId, scene: PlanScene) => readonly PlanFoot[];
  /** The studio's headphone mix (one personal mixer per performer). */
  cue: (variant: VariantId) => CueRig;
  /** The studio room's inner wall faces (default: the wide box, inset). */
  room?: (variant: VariantId) => PlanRect;
  /** The plan rect an item drawn by the lesson's own art names (a 'none'
   *  spot: the player, the pedals…), for its words' places. */
  named?: (variant: VariantId, item: string) => PlanRect | null;
  nearBadge: string;
  nearLooking: string;
  /** Where the audience is on the wide plan (its label, plan mm). */
  audience: (variant: VariantId) => { text: string; u: number; v: number; align: 'left' | 'center' | 'right'; lip: { axis: 'u' | 'v'; at: number } };
  /** The hearing note on BEFORE ANY MIC (the lesson's numbers, plain words). */
  hearing: string;
};

/* ── glyphs from above (mm, about their own origin, facing +u; sizes: GLYPH) ── */
const glyphCache = new Map<string, Record<string, SkPath>>();
function glyphPaths(g: PlanGlyph, half?: { u: number; v: number }): Record<string, SkPath> {
  const key = g === 'band' && half ? `band:${half.u}:${half.v}` : g;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const o: Record<string, SkPath> = {};
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
    return p;
  };
  const tripod = (r: number, a0: number, x = 0) => {
    const p = Skia.Path.Make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + a0;
      p.moveTo(x, 0);
      p.lineTo(x + Math.cos(a) * r, Math.sin(a) * r);
    }
    return p;
  };
  if (g === 'singer' || g === 'chair') {
    const S = GLYPH.singer;
    o.shoulders = Skia.Path.Make();
    o.shoulders.addOval(Skia.XYWHRect(S.body.u0, S.body.v0, S.body.u1 - S.body.u0, S.body.v1 - S.body.v0));
    // The head is the figure's own skin silhouette from above (head fix
    // 2026-10-08: a head ON A BODY is PlayerFigure's FigureHead, never an
    // oval); nose +v here, turned to the glyph's front (+u) where drawn.
    o.head = headAbove(pt(0, 0), 95).fill;
    if (g === 'singer') {
      o.stand = Skia.Path.Make();
      o.stand.moveTo(150, 0);
      o.stand.lineTo(S.standAt, 0);
      o.mic = rr(S.micTo - 120, -26, 120, 52, 22);
      o.base = tripod(S.baseR, Math.PI / 6, S.standAt);
    } else {
      const C = GLYPH.chair;
      o.seat = rr(C.u0, C.v0, C.u1 - C.u0, C.v1 - C.v0, 50);
    }
  } else if (g === 'stand') {
    // A music stand from above: the desk, edge-on, and its tripod.
    const T = GLYPH.stand;
    o.desk = rr(-T.deskD / 2, -T.deskW / 2, T.deskD, T.deskW, 10);
    o.base = tripod(T.baseR, 0);
  } else if (g === 'pair') {
    // Two pencil condensers on a stereo bar, on one stand (from above).
    const P = GLYPH.pair;
    o.bar = rr(-P.barD / 2, -P.barW / 2, P.barD, P.barW, 14);
    o.micA = rr(-60, -175, 130, 34, 15);
    o.micB = rr(-60, 141, 130, 34, 15);
    o.base = tripod(P.baseR, Math.PI / 6);
  } else if (g === 'mic') {
    // One condenser on a tripod stand, its front toward `faces`.
    const M = GLYPH.mic;
    o.base = tripod(M.baseR, Math.PI / 3);
    o.mic = rr(M.body.u0, M.body.v0, M.body.u1 - M.body.u0, M.body.v1 - M.body.v0, 15);
    o.hub = Skia.Path.Make();
    o.hub.addCircle(0, 0, 26);
  } else if (g === 'amp') {
    const A = GLYPH.amp;
    o.cab = rr(A.u0, A.v0, A.u1 - A.u0, A.v1 - A.v0, 16);
    o.handle = rr(-190, -90, 70, 180, 30);
    o.grille = rr(-12, -236, 12, 472, 4);
  } else if (g === 'pa') {
    const P = GLYPH.pa;
    o.cab = rr(P.u0, P.v0, P.u1 - P.u0, P.v1 - P.v0, 24);
    o.horn = rr(80, -120, 120, 240, 20);
  } else if (g === 'di') {
    // A passive DI box on the floor: its case and the two jacks at its ends.
    const D = GLYPH.di;
    o.cab = rr(D.u0, D.v0, D.u1 - D.u0, D.v1 - D.v0, 10);
    o.jacks = Skia.Path.Make();
    o.jacks.addCircle(D.u0 + 18, 0, 11);
    o.jacks.addCircle(D.u1 - 18, 0, 11);
  } else if (g === 'band') {
    // Other players' area: a riser outline (a generic band, not a source).
    const h = half ?? { u: GLYPH.band.hu, v: GLYPH.band.hv };
    o.riser = rr(-h.u, -h.v, h.u * 2, h.v * 2, 40);
  }
  glyphCache.set(key, o);
  return o;
}

function Glyph({ spot, lit }: { spot: PlanSpot; lit: boolean }) {
  if (spot.glyph === 'none') return null;
  const ang = spotAngle(spot);
  if (spot.glyph === 'wedge') {
    // The shared 2-way floor wedge at true size (D70), its baffle to `faces`.
    return (
      <Group transform={[{ translateX: spot.x }, { translateY: spot.z }, { rotate: ang }]}>
        <Wedge2WayTop shadow highlight={lit ? AMBER : undefined} highlightW={14} />
      </Group>
    );
  }
  const p = glyphPaths(spot.glyph, spot.half);
  const edge = lit ? AMBER : '#70747f';
  return (
    <Group transform={[{ translateX: spot.x }, { translateY: spot.z }, { rotate: ang }]}>
      {spot.glyph === 'singer' || spot.glyph === 'chair' ? (
        <>
          {p.seat ? <Path path={p.seat} color="#2a2b31" /> : null}
          <Path path={p.shoulders}>
            <LinearGradient start={vec(-120, -230)} end={vec(120, 230)} colors={['#4b5366', '#353b49', '#232733']} />
          </Path>
          <Group transform={[{ translateX: 5 }, { rotate: -Math.PI / 2 }]}>
            <FigureHead fill={p.head} />
          </Group>
          {p.stand ? <Path path={p.base} style="stroke" strokeWidth={12} strokeCap="round" color="#4d515b" /> : null}
          {p.stand ? <Path path={p.stand} style="stroke" strokeWidth={14} strokeCap="round" color="#5a5f69" /> : null}
          {p.mic ? <Path path={p.mic} color="#1a1b1f" /> : null}
          <Path path={p.shoulders} style="stroke" strokeWidth={lit ? 14 : 0} color={edge} />
        </>
      ) : spot.glyph === 'stand' ? (
        <>
          <Path path={p.base} style="stroke" strokeWidth={14} strokeCap="round" color="#4d515b" />
          <Path path={p.desk} color="#202126" />
          <Path path={p.desk} style="stroke" strokeWidth={lit ? 12 : 4} color={edge} />
        </>
      ) : spot.glyph === 'pair' ? (
        <>
          <Path path={p.base} style="stroke" strokeWidth={14} strokeCap="round" color="#4d515b" />
          <Path path={p.bar} color="#2a2c32" />
          <Path path={p.micA}>
            <LinearGradient start={vec(-60, -175)} end={vec(70, -141)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
          </Path>
          <Path path={p.micB}>
            <LinearGradient start={vec(-60, 141)} end={vec(70, 175)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
          </Path>
          <Path path={p.bar} style="stroke" strokeWidth={lit ? 12 : 3} color={edge} />
        </>
      ) : spot.glyph === 'mic' ? (
        <>
          <Path path={p.base} style="stroke" strokeWidth={14} strokeCap="round" color="#4d515b" />
          <Path path={p.hub} color="#2a2c32" />
          <Path path={p.mic}>
            <LinearGradient start={vec(-60, -17)} end={vec(110, 17)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
          </Path>
          <Path path={p.mic} style="stroke" strokeWidth={lit ? 12 : 3} color={edge} />
        </>
      ) : spot.glyph === 'amp' ? (
        <>
          <Path path={p.cab}>
            <LinearGradient start={vec(-290, -250)} end={vec(0, 250)} colors={['#3b3e46', '#1b1c20', '#0e0f12']} />
          </Path>
          <Path path={p.handle} color="#0b0b0d" />
          <Path path={p.grille} color="#8a7a5a" />
          <Path path={p.cab} style="stroke" strokeWidth={lit ? 14 : 5} color={edge} />
        </>
      ) : spot.glyph === 'pa' ? (
        <>
          <Path path={p.cab}>
            <LinearGradient start={vec(-220, -300)} end={vec(220, 300)} colors={['#3b3e46', '#1b1c20']} />
          </Path>
          <Path path={p.horn} color="#0c0d10" />
          <Path path={p.cab} style="stroke" strokeWidth={lit ? 14 : 5} color={edge} />
        </>
      ) : spot.glyph === 'di' ? (
        <>
          <Path path={p.cab}>
            <LinearGradient start={vec(-70, -42)} end={vec(70, 42)} colors={['#5a5f69', '#2c2f36']} />
          </Path>
          <Path path={p.jacks} color="#0c0d10" />
          <Path path={p.cab} style="stroke" strokeWidth={lit ? 12 : 4} color={edge} />
        </>
      ) : (
        <Path path={p.riser} style="stroke" strokeWidth={lit ? 14 : 6} color={edge} opacity={0.7}>
          <DashPathEffect intervals={[40, 26]} />
        </Path>
      )}
    </Group>
  );
}

/** The stage's downstage edge: a dashed line across the plan. */
function StageLip({ box, lip }: { box: ViewBox; lip: { axis: 'u' | 'v'; at: number } }) {
  const p = Skia.Path.Make();
  if (lip.axis === 'u') {
    p.moveTo(lip.at, box.v0 + 40);
    p.lineTo(lip.at, box.v1 - 40);
  } else {
    p.moveTo(box.u0 + 40, lip.at);
    p.lineTo(box.u1 - 40, lip.at);
  }
  return (
    <Path path={p} style="stroke" strokeWidth={10} color="#5d616c">
      <DashPathEffect intervals={[40, 26]} />
    </Path>
  );
}

/** The studio room: a 40 mm wall drawn just outside its inner faces. */
const roomCache = new Map<string, SkPath>();
function roomPath(r: PlanRect): SkPath {
  const k = `${r.u0}:${r.u1}:${r.v0}:${r.v1}`;
  let p = roomCache.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(r.u0 - 20, r.v0 - 20, r.u1 - r.u0 + 40, r.v1 - r.v0 + 40));
    roomCache.set(k, p);
  }
  return p;
}

export function StagePlanCanvas({ spec, w, h, variant, scene, items, highlight, onTap, accessibilityLabel }: { spec: StagePlanSpec; w: number; h: number; variant: VariantId; scene: PlanScene; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = scene === 'near' ? spec.near(variant) : scene === 'stage' && spec.wideStage ? spec.wideStage(variant) : spec.wide(variant);
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [box, w, h]);
  const spots = spotsIn(spec.spots(variant), scene);
  const foots = useMemo(() => spec.foots(variant, scene), [spec, variant, scene]);
  const cue = scene === 'studio' ? spec.cue(variant) : null;
  const room = scene === 'studio' ? (spec.room ? spec.room(variant) : roomOfBox(box)) : null;
  const Own = spec.Own;
  // The words go at the lesson's own place, else just outside the named
  // object (below, right, left, above), else into free space with a leader
  // back to it — never on an object (clearOf).
  const rectOf = (s: PlanSpot): PlanRect => {
    const fs = spotFoots(s).filter((f) => !f.zone);
    if (fs.length) return unionRect(fs);
    return spec.named?.(variant, s.item) ?? rectOfCircle({ u: s.x, v: s.z }, s.r * 0.5);
  };
  const labels: StaticLabel[] = spots.map((s) => {
    const it = items.find((i) => i.id === s.item);
    return {
      id: s.item,
      text: it?.short ?? s.text ?? s.item.toUpperCase(),
      u: s.x + (s.label?.du ?? 0),
      v: s.z + (s.label?.dv ?? s.r + 60),
      align: 'center' as const,
      alts: labelPlaces(rectOf(s), xf.s / textScale),
      point: { u: s.x, v: s.z },
      tone: highlight === s.item ? ('amber' as const) : ('muted' as const),
    };
  });
  if (scene === 'stage') {
    const { lip: _lip, ...a } = spec.audience(variant);
    void _lip;
    labels.push({ id: 'aud', ...a, point: { u: a.u, v: a.v }, tone: 'muted' });
  }
  if (room && !labels.some((l) => l.text === 'THE ROOM')) labels.push({ id: 'room.name', text: 'THE ROOM', u: room.u0 + 200, v: room.v0 + 260, align: 'left', point: { u: room.u0 + 200, v: room.v0 + 260 }, tone: 'muted' });
  if (cue) labels.push(...cueLabels(cue).map((l) => ({ ...l, tone: 'illustrative' as const })));
  const onPress = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const near = spots.find((s) => Math.hypot(u - s.x, v - s.z) <= s.r);
    if (near) onTap(near.item);
    else if (spec.ownHit(variant, u, v)) onTap(spec.ownItem);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => onPress(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {room ? <Path path={roomPath(room)} style="stroke" strokeWidth={40} color="#3a3d45" /> : null}
          {/* Stage: the deck's downstage edge (dashed), the house beyond it. */}
          {scene === 'stage' ? <StageLip box={box} lip={spec.audience(variant).lip} /> : null}
          {spots.filter((s) => s.glyph === 'band').map((s) => (
            <Glyph key={s.item} spot={s} lit={highlight === s.item} />
          ))}
          <Own variant={variant} lit={highlight === spec.ownItem} />
          {spots.filter((s) => s.glyph !== 'band').map((s) => (
            <Glyph key={s.item} spot={s} lit={highlight === s.item} />
          ))}
          {/* Studio: each performer's headphone mix (no wedges in a studio). */}
          {cue ? <CueMixPlan rig={cue} /> : null}
        </Group>
      </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(foots, cue ? cueCables(cue) : [])} />
    </View>
  );
}

export function makeStagePage(spec: StagePlanSpec) {
  return function PStagePlan({ lesson, answers, onAnswered, variant }: PageProps) {
    const C = copyOf(lesson);
    const items = lesson.setting.items;
    const nearItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
    const [nearSel, setNearSel] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [where, setWhere] = useState<'stage' | 'studio'>('stage');
    const [wideSel, setWideSel] = useState<string | null>(null);
    const wideItems = items.filter((i) => i.scene === where || i.scene === 'all' || i.scene === 'kit');
    const byId = (id: string | null): SettingItem | undefined => items.find((i) => i.id === id);
    const pickNear = (id: string) => {
      if (!nearItems.some((i) => i.id === id)) return;
      setNearSel(id);
      setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    };
    const pickWide = (id: string) => {
      if (wideItems.some((i) => i.id === id)) setWideSel(id);
    };
    const fader = (list: readonly SettingItem[], sel: string | null, pick: (id: string) => void): DockParam => {
      const idx = Math.max(0, list.findIndex((i) => i.id === sel));
      return tapsWhenFew(
        {
          kind: 'fader',
          id: 'item',
          label: 'ITEM',
          value: list.length > 1 ? idx / (list.length - 1) : 0,
          onChange: (v) => {
            const it = list[Math.round(v * (list.length - 1))];
            if (it) pick(it.id);
          },
          format: () => (sel ? `${byId(sel)?.short ?? sel} · ${byId(sel)?.tag ?? ''}` : `step through the ${list.length} items`),
          formatShort: () => (sel ? (byId(sel)?.short ?? sel).slice(0, 9) : 'STEP'),
        },
        list.length,
        list.findIndex((q) => q.id === sel),
        (i) => list[i].short,
        (i) => pick(list[i].id),
      );
    };
    const bezel = (sel: SettingItem | undefined, extra: BezelItem): BezelItem[] => [
      { k: 'ITEM', v: sel ? sel.short : 'TAP ONE', flex: 1.4 },
      { k: 'FOR A MIC', v: sel ? sel.tag : '—', flex: 1.4 },
      extra,
    ];
    const card = (it: SettingItem | undefined, idle: string) =>
      it ? (
        <Card>
          <Point title={it.label.toUpperCase()}>{it.note}</Point>
        </Card>
      ) : (
        <Note>{idle}</Note>
      );
    const nearIt = byId(nearSel);
    const wideIt = byId(wideSel);
    const steps: MikingStep[] = [
      {
        key: 'near',
        title: 'Around it',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StagePlanCanvas spec={spec} w={w} h={h} variant={variant} scene="near" items={items} highlight={nearSel} onTap={pickNear} accessibilityLabel={`${C.setting.kitA11y} ${nearIt ? `Highlighted: ${nearIt.label}.` : ''}`} />
          ),
          badge: spec.nearBadge,
          bezel: bezel(nearIt, { k: 'LOOKED AT', v: `${seen.size} / ${nearItems.length}`, flex: 1 }),
          params: [fader(nearItems, nearSel, pickNear)],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={spec.nearLooking} prompt={C.setting.kitLanding} />
            {card(nearIt, C.setting.kitIdle)}
            {C.setting.leftHanded ? <Note>{C.setting.leftHanded}</Note> : null}
          </>
        ),
      },
      {
        key: 'wide',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StagePlanCanvas spec={spec} w={w} h={h} variant={variant} scene={where} items={items} highlight={wideSel} onTap={pickWide} accessibilityLabel={`${where === 'stage' ? C.setting.stageA11y : C.setting.studioA11y} ${wideIt ? `Highlighted: ${wideIt.label}.` : ''}`} />
          ),
          badge: where === 'stage' ? 'From above · monitors where a stage often puts them · a typical layout' : 'From above · a typical studio room',
          bezel: bezel(wideIt, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
          params: [
            fader(wideItems, wideSel, pickWide),
            {
              kind: 'options',
              id: 'where',
              label: where === 'stage' ? 'STAGE' : 'STUDIO',
              valueLabel: where === 'stage' ? 'LIVE' : 'STUDIO',
              selectedId: where,
              onSelect: (id) => {
                setWhere(id as 'stage' | 'studio');
                setWideSel(null);
              },
              sticky: true,
              options: [
                { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
                { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={where === 'stage' ? 'Plan · on a stage' : 'Plan · in a studio'} prompt="Switch STAGE / STUDIO, and tap what is new around it." />
            <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
            {card(wideIt, where === 'stage' ? C.setting.stageIdle : C.setting.studioIdle)}
          </>
        ),
      },
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {C.setting.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{spec.hearing}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

export const planLabelFor = (it: SettingItem | undefined) => it?.short ?? '';
