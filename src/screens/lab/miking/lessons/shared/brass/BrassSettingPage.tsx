/**
 * Page 3 — THE SETTING: WHERE IT SITS, for the brass family (LESSON_JOURNEY
 * §6 stage 3, §8). The lesson's own page (LessonArt.pages.setting): the
 * drum page's kit plan does not fit a horn player.
 *
 *   AROUND THE PLAYER (rack)  a plan from above at the real scale: the
 *                             player and the horn (the family's own art),
 *                             the player's space — for a trombone the
 *                             slide's reach to 7th, dashed — and the
 *                             neighbours as illustrated objects: another
 *                             horn player (the same family's art), a music
 *                             stand, a singer at a mic, the drum kit (Lab
 *                             1's shared kit). Tap one, or step through ITEM.
 *   STAGE AND STUDIO (rack)   the same plan on a STAGE (the lesson's own
 *                             monitors — the ones the Studio-or-live page
 *                             uses — and the audience side) or in a STUDIO
 *                             (the room; a main pair for a section).
 *   BEFORE ANY MIC (read)     ask the player; hear it unamplified; hearing;
 *                             then the three checks.
 * Positions are a typical layout (internal `prov`; nothing tagged on screen).
 * Credit: the three checks.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { PaintItem, playerGroups } from '../bowed/BowedArt';
import { Kit, MainPair, MusicStand, WedgeTop } from '../bowed/BowedSettingPage';
import { PROJ, hornGroups } from './BrassArt';
import { SLIDE_7TH } from './brassSpec.ts';
import type { HornPose } from './brassPosture.ts';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

const DEG = Math.PI / 180;
const make = () => Skia.Path.Make();

/** One object on the plan. */
export type BrassPlanObject = {
  id: string;
  kind: 'self' | 'brass' | 'stand' | 'kit' | 'pair' | 'singer';
  at: { x: number; z: number };
  /** Turn on the plan, degrees (from +x toward +z). */
  yaw?: number;
  r: number;
  pose?: HornPose;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
};

export type BrassSettingConfig = {
  P: HornPose;
  objects: readonly BrassPlanObject[];
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

/** A horn player and horn from above (the family's own art). */
function BrassTop({ P, dim }: { P: HornPose; dim: number }) {
  const groups = useMemo(() => [...playerGroups({ player: P.player }, 'top', true), ...hornGroups(P, PROJ.top)].sort((a, b) => a.depth - b.depth), [P]);
  return (
    <Group layer={<Paint opacity={dim} />}>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
    </Group>
  );
}

/** A singer at a vocal mic, from above: shoulders, the head, the mic on its
 *  stand. The head is the figure's own skin silhouette from above (head fix
 *  2026-10-08: a head ON A BODY is PlayerFigure's FigureHead — never a
 *  circle, never the line-art icon), its nose turned to the mic (+u). */
function SingerTop() {
  const p = useMemo(() => {
    const body = make();
    body.addOval(Skia.XYWHRect(-120, -230, 240, 460));
    const head = headAbove(pt(0, 0), 100).fill;
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3;
      legs.moveTo(330, 0);
      legs.lineTo(330 + Math.cos(a) * 220, Math.sin(a) * 220);
    }
    const boom = make();
    boom.moveTo(330, 0);
    boom.lineTo(170, 0);
    const mic = make();
    mic.addRRect(Skia.RRectXY(Skia.XYWHRect(110, -22, 110, 44), 22, 22));
    return { body, head, legs, boom, mic };
  }, []);
  return (
    <>
      <Path path={p.body}>
        <LinearGradient start={vec(-120, -230)} end={vec(120, 230)} colors={['#4c5466', '#2f3542', '#1b1f28']} />
      </Path>
      <Group transform={[{ translateX: 10 }, { rotate: -Math.PI / 2 }]}>
        <FigureHead fill={p.head} />
      </Group>
      <Path path={p.legs} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={9} strokeCap="round" color="#4d515b" />
      <Path path={p.boom} style="stroke" strokeWidth={12} strokeCap="round" color="#2a2c32" />
      <Path path={p.mic}>
        <LinearGradient start={vec(110, -22)} end={vec(220, 22)} colors={['#e8ebf0', '#8d939e', '#3b3f47']} />
      </Path>
    </>
  );
}

export function BrassPlan({ w, h, cfg, box, scene, wedges, items, highlight, onTap, accessibilityLabel }: { w: number; h: number; cfg: BrassSettingConfig; box: ViewBox; scene: 'kit' | 'stage' | 'studio'; wedges: readonly Wedge[]; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const self = cfg.P;
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
  // The player's space: for a trombone, the slide's reach to 7th position.
  const reach = useMemo(() => {
    if (!self.slide) return null;
    const s = self.slide;
    const p = make();
    const x0 = s.outerFrom.x - s.s - 20;
    const x1 = s.crook.x - s.s + SLIDE_7TH + 60;
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, s.z - 80, x1 - x0, 170), 60, 60));
    return p;
  }, [self]);
  const sel = cfg.objects.find((o) => o.id === highlight) ?? null;
  const selItem = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = shown
    .filter((o) => o.kind !== 'self')
    .map((o) => ({ id: o.id, text: o.label.toUpperCase(), short: o.short?.toUpperCase(), u: o.at.x, v: o.at.z + o.r * 0.8, align: 'center' as const, tone: (highlight === o.id ? undefined : 'muted') as StaticLabel['tone'] }));
  labels.push({ id: 'player', text: 'THE PLAYER', u: self.player.pelvis.x - 60, v: self.player.pelvis.z - 330, align: 'center', tone: 'muted' });
  if (reach && self.slide) labels.push({ id: 'reach', text: 'SLIDE AT 7th', short: '7th', u: self.slide.crook.x - self.slide.s + SLIDE_7TH, v: self.slide.z + 170, align: 'center', tone: 'muted' });
  if (scene === 'stage') labels.push({ id: 'aud', text: 'AUDIENCE · PA →', short: 'AUDIENCE →', u: box.u1 - 40, v: box.v0 + 60, align: 'right', tone: 'muted' });
  if (scene === 'studio') labels.push({ id: 'room', text: 'THE ROOM', u: box.u0 + 120, v: box.v0 + 120, align: 'left', tone: 'muted' });
  const tap = (u: number, v: number) => {
    let best: { id: string; d: number } | null = null;
    for (const o of shown) {
      const d = Math.hypot(u - o.at.x, v - o.at.z) - o.r;
      if (d < 60 && (!best || d < best.d)) best = { id: o.id, d };
    }
    if (scene === 'stage') {
      for (const wd of wedges) {
        const d = Math.hypot(u - wd.p.x, v - wd.p.z) - 300;
        if (d < 60 && (!best || d < best.d)) best = { id: wd.id, d };
      }
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
              <Path
                path={(() => {
                  const p = make();
                  p.moveTo(box.u1 - 220, box.v0);
                  p.lineTo(box.u1 - 220, box.v1);
                  return p;
                })()}
                style="stroke"
                strokeWidth={10}
                color="#ffc64d"
                opacity={0.35}
              >
                <DashPathEffect intervals={[60, 40]} />
              </Path>
            ) : null}
            {shown.map((o) => (
              <Group key={o.id} transform={[{ translateX: o.at.x }, { translateY: o.at.z }, { rotate: (o.yaw ?? 0) * DEG }]}>
                {o.kind === 'stand' ? <MusicStand /> : o.kind === 'kit' ? <Kit /> : o.kind === 'pair' ? <MainPair /> : o.kind === 'singer' ? <SingerTop /> : o.kind === 'brass' && o.pose ? <BrassTop P={o.pose} dim={0.7} /> : null}
              </Group>
            ))}
            {scene === 'stage' ? wedges.filter((x) => x.glyph !== 'none').map((x) => <WedgeTop key={x.id} at={{ x: x.p.x, z: x.p.z }} faces={{ x: x.faces.x, z: x.faces.z }} />) : null}
            {reach ? (
              <>
                <Path path={reach} color="rgba(138,143,156,0.14)" />
                <Path path={reach} style="stroke" strokeWidth={3} color="#8a8f9c" opacity={0.8}>
                  <DashPathEffect intervals={[18, 12]} />
                </Path>
              </>
            ) : null}
            <BrassTop P={self} dim={1} />
            {ring ? <Path path={ring} style="stroke" strokeWidth={14} color="#ffc64d" opacity={0.9} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function makeBrassSettingPage(cfg: BrassSettingConfig): (p: PageProps) => ReactNode {
  return function BrassSetting({ lesson, answers, onAnswered }: PageProps) {
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
      { k: `FOR A ${lesson.noun.one.toUpperCase()} MIC`, v: sel ? sel.tag : '—', flex: 1.5 },
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
          render: (w, h) => <BrassPlan w={w} h={h} cfg={cfg} box={cfg.near} scene="kit" wedges={lesson.live.wedges} items={items} highlight={nearSel} onTap={pickNear} accessibilityLabel={cfg.nearA11y} />,
          badge: cfg.P.slide ? 'From above · a typical layout · dashed = the slide’s reach to 7th position' : 'From above · a typical layout · the audience to the right',
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
          render: (w, h) => <BrassPlan w={w} h={h} cfg={cfg} box={cfg.wide} scene={where} wedges={lesson.live.wedges} items={items} highlight={wideSel} onTap={pickWide} accessibilityLabel={where === 'stage' ? cfg.wideA11y.stage : cfg.wideA11y.studio} />,
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
