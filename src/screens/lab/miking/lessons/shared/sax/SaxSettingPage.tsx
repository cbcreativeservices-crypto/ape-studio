/**
 * Page 3 — THE SETTING: WHERE IT SITS, for the saxophone family
 * (LESSON_JOURNEY §6 stage 3, §8). The lesson's own page (LessonArt.pages.
 * setting): the kit plan does not fit a horn player.
 *
 *   AROUND THE PLAYER (rack)  a plan from above at the real scale: the
 *                             player and the horn (the family's own art),
 *                             the bell's swing hatched, the music stand and
 *                             the neighbours as illustrated objects — the
 *                             rest of a saxophone section (the same family's
 *                             art) and the rhythm section's drum kit (Lab 1's
 *                             shared kit). Tap one, or step through ITEM.
 *   STAGE AND STUDIO (rack)   the same plan on a STAGE (the lesson's own
 *                             monitors — the ones Studio or live uses — and
 *                             the audience side) or in a STUDIO (the room; a
 *                             main pair over the section).
 *   BEFORE ANY MIC (read)     ask the player; hear it unamplified; hearing;
 *                             then the three checks.
 * Positions are a typical layout (internal `prov`; nothing tagged on screen).
 * Credit: the three checks.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { Kit, MainPair, MusicStand, WedgeTop } from '../bowed/BowedSettingPage';
import { SaxScene } from './SaxArt';
import { swingShape } from './saxModel.ts';
import type { SaxPosture } from './saxPosture.ts';

const DEG = Math.PI / 180;
const make = () => Skia.Path.Make();

/** One object on the plan: what it is, where (lesson frame, top view), how
 *  big for a tap, and — for another saxophonist — their posture. */
export type SaxPlanObject = {
  id: string;
  kind: 'self' | 'sax' | 'stand' | 'kit' | 'pair';
  at: { x: number; z: number };
  yaw?: number;
  r: number;
  posture?: SaxPosture;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
};

export type SaxSettingConfig = {
  P: SaxPosture;
  objects: readonly SaxPlanObject[];
  near: ViewBox;
  wide: ViewBox;
  nearA11y: string;
  wideA11y: { stage: string; studio: string };
  nearLanding: string;
  nearIdle: string;
  stageIdle: string;
  studioIdle: string;
  before: readonly { title: string; text: string }[];
  hearing: string;
};

/** The bell's swing in plan (the sector the envelope sweeps). */
function swingPlan(P: SaxPosture) {
  const s = swingShape(P);
  if (s.kind !== 'sector') return make();
  const p = make();
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const a = s.a0 + ((s.a1 - s.a0) * i) / n;
    const x = s.c.x + s.r1 * Math.cos(a);
    const z = s.c.z + s.r1 * Math.sin(a);
    if (i === 0) p.moveTo(x, z);
    else p.lineTo(x, z);
  }
  for (let i = n; i >= 0; i--) {
    const a = s.a0 + ((s.a1 - s.a0) * i) / n;
    p.lineTo(s.c.x + s.r0 * Math.cos(a), s.c.z + s.r0 * Math.sin(a));
  }
  p.close();
  return p;
}

export function SaxPlan({ w, h, cfg, box, scene, wedges, items, highlight, onTap, accessibilityLabel }: { w: number; h: number; cfg: SaxSettingConfig; box: ViewBox; scene: 'kit' | 'stage' | 'studio'; wedges: readonly Wedge[]; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const self = cfg.P;
  const sweep = useMemo(() => swingPlan(self), [self]);
  // A plan is drawn small: the hatch's lines are spaced and weighted for it.
  const hatch = useMemo(() => {
    const p = make();
    const span = box.u1 - box.u0 + (box.v1 - box.v0);
    for (let d = 0; d < span; d += 70) {
      p.moveTo(box.u0 + d, box.v0);
      p.lineTo(box.u0 + d - (box.v1 - box.v0), box.v1);
    }
    return p;
  }, [box]);
  const shown = cfg.objects.filter((o) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit' && o.kind !== 'self'));
  const floor = useMemo(() => {
    const p = make();
    p.addRect(Skia.XYWHRect(box.u0, box.v0, box.u1 - box.u0, box.v1 - box.v0));
    return p;
  }, [box]);
  const room = useMemo(() => {
    const p = make();
    p.addRect(Skia.XYWHRect(box.u0 + 60, box.v0 + 60, box.u1 - box.u0 - 120, box.v1 - box.v0 - 120));
    return p;
  }, [box]);
  const edge = useMemo(() => {
    const p = make();
    p.moveTo(box.u1 - 220, box.v0);
    p.lineTo(box.u1 - 220, box.v1);
    return p;
  }, [box]);
  const sel = cfg.objects.find((o) => o.id === highlight) ?? null;
  const selItem = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = shown
    .filter((o) => o.kind !== 'self')
    // Beside each object, never on it.
    .map((o) => ({ id: o.id, text: o.label.toUpperCase(), short: o.short?.toUpperCase(), u: o.at.x, v: o.at.z + o.r + 70, align: 'center' as const, tone: (highlight === o.id ? undefined : 'muted') as StaticLabel['tone'], alts: [{ u: o.at.x, v: o.at.z - o.r - 60, align: 'center' as const }] }));
  labels.push({ id: 'player', text: 'THE PLAYER', u: self.player.pelvis.x - 360, v: self.player.pelvis.z + 40, align: 'right', tone: 'muted' });
  if (scene === 'stage') labels.push({ id: 'aud', text: 'AUDIENCE · PA →', short: 'AUDIENCE →', u: box.u1 - 40, v: box.v0 + 60, align: 'right', tone: 'muted' });
  if (scene === 'studio') labels.push({ id: 'room', text: 'THE ROOM', u: box.u0 + 120, v: box.v0 + 120, align: 'left', tone: 'muted' });
  const tap = (u: number, v: number) => {
    let best: { id: string; d: number } | null = null;
    for (const o of shown) {
      const d = Math.hypot(u - o.at.x, v - o.at.z) - o.r;
      if (d < 60 && (!best || d < best.d)) best = { id: o.id, d };
    }
    if (scene === 'stage')
      for (const wd of wedges) {
        const d = Math.hypot(u - wd.p.x, v - wd.p.z) - 300;
        if (d < 60 && (!best || d < best.d)) best = { id: wd.id, d };
      }
    if (best) onTap(best.id);
  };
  const ring = (() => {
    const at = sel ? sel.at : wedges.find((x) => x.id === highlight)?.p;
    const r = sel ? sel.r : 330;
    if (!at) return null;
    const p = make();
    p.addCircle(at.x, 'z' in at ? at.z : 0, r + 40);
    return p;
  })();
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => tap((e.nativeEvent.locationX - xf.ox) / xf.s, (e.nativeEvent.locationY - xf.oy) / xf.s)} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}${selItem ? ` Highlighted: ${selItem.label}.` : ''}`}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Path path={floor}>
              <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={scene === 'studio' ? ['#2a2420', '#1a1613'] : ['#1d1e22', '#121316']} />
            </Path>
            {scene === 'studio' ? <Path path={room} style="stroke" strokeWidth={60} color="#3a332c" opacity={0.9} /> : null}
            {scene === 'stage' ? (
              <Path path={edge} style="stroke" strokeWidth={10} color="#ffc64d" opacity={0.35}>
                <DashPathEffect intervals={[60, 40]} />
              </Path>
            ) : null}
            {shown.map((o) => (
              <Group key={o.id} transform={[{ translateX: o.at.x }, { translateY: o.at.z }, { rotate: (o.yaw ?? 0) * DEG }]}>
                {o.kind === 'stand' ? <MusicStand /> : o.kind === 'kit' ? <Kit /> : o.kind === 'pair' ? <MainPair /> : o.kind === 'sax' && o.posture ? (
                  <Group opacity={0.7}>
                    <SaxScene P={o.posture} view="top" />
                  </Group>
                ) : null}
              </Group>
            ))}
            {scene === 'stage' ? wedges.filter((x) => x.glyph !== 'none').map((x) => <WedgeTop key={x.id} at={{ x: x.p.x, z: x.p.z }} faces={{ x: x.faces.x, z: x.faces.z }} />) : null}
            <SaxScene P={self} view="top" />
            <Group clip={sweep}>
              <Path path={hatch} style="stroke" strokeWidth={12} color="#a7adb9" opacity={0.6} />
            </Group>
            <Path path={sweep} style="stroke" strokeWidth={16} color="#a7adb9" opacity={0.85} />
            {ring ? <Path path={ring} style="stroke" strokeWidth={14} color="#ffc64d" opacity={0.9} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function makeSaxSettingPage(cfg: SaxSettingConfig): (p: PageProps) => ReactNode {
  return function SaxSetting({ lesson, answers, onAnswered }: PageProps) {
    const items = lesson.setting.items;
    const nearItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
    const [nearSel, setNearSel] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [where, setWhere] = useState<'stage' | 'studio'>('stage');
    const [wideSel, setWideSel] = useState<string | null>(null);
    const wideItems = items.filter((i) => i.scene === where || i.scene === 'all');
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
      { k: 'FOR A SAX MIC', v: sel ? sel.tag : '—', flex: 1.5 },
      extra,
    ];
    const card = (it: SettingItem | undefined, prompt: string) =>
      it ? (
        <Card>
          <Point title={it.label.toUpperCase()}>{it.note}</Point>
        </Card>
      ) : (
        <Note>{prompt}</Note>
      );
    const nearSelItem = byId(nearSel);
    const wideSelItem = byId(wideSel);
    const steps: MikingStep[] = [
      {
        key: 'near',
        title: 'Around the player',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <SaxPlan w={w} h={h} cfg={cfg} box={cfg.near} scene="kit" wedges={lesson.live.wedges} items={items} highlight={nearSel} onTap={pickNear} accessibilityLabel={cfg.nearA11y} />,
          badge: 'From above · a typical layout · grey hatch = where the bell swings as the player moves',
          bezel: bezel(nearSelItem, { k: 'LOOKED AT', v: `${seen.size} / ${nearItems.length}`, flex: 1 }),
          params: [fader(nearItems, nearSel, pickNear)],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking="Plan · from above · the audience to the right" prompt={cfg.nearLanding} />
            {card(nearSelItem, cfg.nearIdle)}
          </>
        ),
      },
      {
        key: 'stage',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <SaxPlan w={w} h={h} cfg={cfg} box={cfg.wide} scene={where} wedges={lesson.live.wedges} items={items} highlight={wideSel} onTap={pickWide} accessibilityLabel={where === 'stage' ? cfg.wideA11y.stage : cfg.wideA11y.studio} />,
          badge: where === 'stage' ? 'From above · monitors where a stage often puts them · audience side to the right' : 'From above · a typical studio room',
          bezel: bezel(wideSelItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
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
            <Landing looking={where === 'stage' ? 'Plan · on a stage' : 'Plan · in a studio'} prompt="Switch STAGE / STUDIO, and tap what is new around the player." />
            <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
            {card(wideSelItem, where === 'stage' ? cfg.stageIdle : cfg.studioIdle)}
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
              {cfg.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{cfg.hearing}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
