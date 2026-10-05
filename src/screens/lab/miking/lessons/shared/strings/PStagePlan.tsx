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
 *                           audience and the PA) or a STUDIO (the room, and
 *                           what a distant pair would sit in).
 *   BEFORE ANY MIC (read)   ask the player and the owner first; protect your
 *                           hearing; then the three checks.
 * Positions are ILLUSTRATIVE (a typical layout); nothing moves (D8).
 */
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, VariantId, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import { copyOf } from '../../../engine/model/copy.ts';
import type { PageProps } from '../../../pages/pageTypes';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const AMBER = '#ffc64d';

export type PlanGlyph = 'wedge' | 'singer' | 'stand' | 'pair' | 'amp' | 'pa' | 'band' | 'chair' | 'none';
/** An item on the plan: where it sits (lesson frame, plan x / z), what it is
 *  drawn as, and which scene shows it. `item` = the SettingItem it names. */
export type PlanSpot = { item: string; glyph: PlanGlyph; x: number; z: number; faces?: { x: number; z: number }; scene: 'near' | 'stage' | 'studio' | 'all'; r: number; label?: { du: number; dv: number } };

export type StagePlanSpec = {
  /** The instrument and its player from above (the lesson's own art). */
  Own: (p: { variant: VariantId; lit: boolean }) => ReactElement;
  /** The SettingItem id the instrument itself stands for, and its hit test. */
  ownItem: string;
  ownHit: (variant: VariantId, u: number, v: number) => boolean;
  near: (variant: VariantId) => ViewBox;
  wide: (variant: VariantId) => ViewBox;
  spots: (variant: VariantId) => readonly PlanSpot[];
  nearBadge: string;
  nearLooking: string;
  /** Where the audience is on the wide plan (its label, plan mm). */
  audience: (variant: VariantId) => { text: string; u: number; v: number; align: 'left' | 'center' | 'right' };
  /** The hearing note on BEFORE ANY MIC (the lesson's numbers, plain words). */
  hearing: string;
};

/* ── glyphs from above (mm, about their own origin, facing +u) ── */
const glyphCache = new Map<string, Record<string, SkPath>>();
function glyphPaths(g: PlanGlyph): Record<string, SkPath> {
  const hit = glyphCache.get(g);
  if (hit) return hit;
  const o: Record<string, SkPath> = {};
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
    return p;
  };
  if (g === 'wedge') {
    // A floor monitor from above: its short top panel (back) and its sloped
    // baffle behind a perforated grille (front, +u).
    o.cab = rr(-160, -270, 320, 540, 20);
    o.grille = rr(-40, -250, 180, 500, 14);
    o.holes = Skia.Path.Make();
    for (let x = -26; x < 128; x += 22) for (let z = -236; z < 240; z += 22) o.holes.addCircle(x, z, 4.4);
    o.recess = rr(-130, -70, 52, 140, 14);
  } else if (g === 'singer' || g === 'chair') {
    o.shoulders = Skia.Path.Make();
    o.shoulders.addOval(Skia.XYWHRect(-120, -230, 240, 460));
    o.head = Skia.Path.Make();
    o.head.addOval(Skia.XYWHRect(-80, -85, 170, 170));
    if (g === 'singer') {
      o.stand = Skia.Path.Make();
      o.stand.moveTo(150, 0);
      o.stand.lineTo(330, 0);
      o.mic = rr(250, -26, 120, 52, 22);
      o.base = Skia.Path.Make();
      for (let k = 0; k < 3; k++) {
        const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
        o.base.moveTo(330, 0);
        o.base.lineTo(330 + Math.cos(a) * 150, Math.sin(a) * 150);
      }
    } else {
      o.seat = rr(-230, -230, 360, 460, 50);
    }
  } else if (g === 'stand') {
    // A music stand from above: the desk, edge-on, and its tripod.
    o.desk = rr(-30, -250, 60, 500, 10);
    o.base = Skia.Path.Make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3;
      o.base.moveTo(0, 0);
      o.base.lineTo(Math.cos(a) * 220, Math.sin(a) * 220);
    }
  } else if (g === 'pair') {
    // Two pencil condensers on a stereo bar, on one stand (from above).
    o.bar = rr(-30, -200, 60, 400, 14);
    o.micA = rr(-60, -175, 130, 34, 15);
    o.micB = rr(-60, 141, 130, 34, 15);
    o.base = Skia.Path.Make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      o.base.moveTo(0, 0);
      o.base.lineTo(Math.cos(a) * 260, Math.sin(a) * 260);
    }
  } else if (g === 'amp') {
    o.cab = rr(-290, -250, 290, 500, 16);
    o.handle = rr(-190, -90, 70, 180, 30);
    o.grille = rr(-12, -236, 12, 472, 4);
  } else if (g === 'pa') {
    o.cab = rr(-220, -300, 440, 600, 24);
    o.horn = rr(80, -120, 120, 240, 20);
  } else if (g === 'band') {
    // Other players' area: a riser outline (a generic band, not a source).
    o.riser = rr(-900, -1100, 1800, 2200, 40);
  }
  glyphCache.set(g, o);
  return o;
}

function Glyph({ spot, lit }: { spot: PlanSpot; lit: boolean }) {
  if (spot.glyph === 'none') return null;
  const p = glyphPaths(spot.glyph);
  const ang = spot.faces ? Math.atan2(spot.faces.z, spot.faces.x) : 0;
  const edge = lit ? AMBER : '#70747f';
  return (
    <Group transform={[{ translateX: spot.x }, { translateY: spot.z }, { rotate: ang }]}>
      {spot.glyph === 'wedge' ? (
        <>
          <Group transform={[{ translateX: 16 }, { translateY: 20 }]}>
            <Path path={p.cab} color="#000" opacity={0.6}>
              <BlurMask blur={22} style="normal" />
            </Path>
          </Group>
          <Path path={p.cab}>
            <LinearGradient start={vec(-160, -270)} end={vec(160, 270)} colors={['#3b3e46', '#24262c', '#15161a']} />
          </Path>
          <Path path={p.grille} color="#0c0d10" />
          <Path path={p.holes} color="#4a4e57" />
          <Path path={p.recess} color="#0e0f12" />
          <Path path={p.cab} style="stroke" strokeWidth={lit ? 14 : 5} color={edge} />
        </>
      ) : spot.glyph === 'singer' || spot.glyph === 'chair' ? (
        <>
          {p.seat ? <Path path={p.seat} color="#2a2b31" /> : null}
          <Path path={p.shoulders}>
            <LinearGradient start={vec(-120, -230)} end={vec(120, 230)} colors={['#4b5366', '#353b49', '#232733']} />
          </Path>
          <Path path={p.head}>
            <RadialGradient c={vec(-20, -30)} r={140} colors={['#9a8572', '#7b6858', '#5d4e42']} />
          </Path>
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
      ) : (
        <Path path={p.riser} style="stroke" strokeWidth={lit ? 14 : 6} color={edge} opacity={0.7}>
          <DashPathEffect intervals={[40, 26]} />
        </Path>
      )}
    </Group>
  );
}

const roomCache = new Map<string, SkPath>();
function roomPath(box: ViewBox): SkPath {
  const k = `${box.u0}:${box.u1}:${box.v0}:${box.v1}`;
  let p = roomCache.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(box.u0 + 60, box.v0 + 60, box.u1 - box.u0 - 120, box.v1 - box.v0 - 120));
    roomCache.set(k, p);
  }
  return p;
}

export function StagePlanCanvas({ spec, w, h, variant, scene, items, highlight, onTap, accessibilityLabel }: { spec: StagePlanSpec; w: number; h: number; variant: VariantId; scene: 'near' | 'stage' | 'studio'; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const box = scene === 'near' ? spec.near(variant) : spec.wide(variant);
  const xf = useMemo(() => fitXform('top', box, w, h, 8), [box, w, h]);
  const spots = spec.spots(variant).filter((s) => s.scene === 'all' || s.scene === scene || (scene !== 'near' && s.scene === 'near'));
  const Own = spec.Own;
  const labels: StaticLabel[] = spots.map((s) => {
    const it = items.find((i) => i.id === s.item);
    return { id: s.item, text: it?.short ?? s.item.toUpperCase(), u: s.x + (s.label?.du ?? 0), v: s.z + (s.label?.dv ?? s.r + 60), align: 'center' as const, tone: highlight === s.item ? ('amber' as const) : ('muted' as const) };
  });
  if (scene === 'stage') labels.push({ id: 'aud', ...spec.audience(variant), tone: 'muted' });
  if (scene === 'studio') labels.push({ id: 'room', text: 'THE ROOM', u: box.u0 + 120, v: box.v0 + 140, align: 'left', tone: 'muted' });
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
          {scene === 'studio' ? (
            <Path path={roomPath(box)} style="stroke" strokeWidth={40} color="#3a3d45" />
          ) : null}
          {spots.filter((s) => s.glyph === 'band').map((s) => (
            <Glyph key={s.item} spot={s} lit={highlight === s.item} />
          ))}
          <Own variant={variant} lit={highlight === spec.ownItem} />
          {spots.filter((s) => s.glyph !== 'band').map((s) => (
            <Glyph key={s.item} spot={s} lit={highlight === s.item} />
          ))}
        </Group>
      </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
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
      return {
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
      };
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
