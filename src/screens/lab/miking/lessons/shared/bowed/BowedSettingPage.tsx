/**
 * Page 3 — THE SETTING: WHERE IT SITS, for the bowed family (LESSON_JOURNEY
 * §6 stage 3, §8). The lesson's own page (LessonArt.pages.setting): the
 * drum page's kit plan does not fit a string player.
 *
 *   AROUND THE PLAYER (rack)  a plan from above at the real scale: the
 *                             player and the instrument (the lesson's own
 *                             art), the bow's sweep hatched, and the
 *                             neighbours as illustrated objects — other
 *                             string players (the same family's art), a
 *                             music stand, a piano, a drum kit (Lab 1's
 *                             shared kit). Tap one, or step through ITEM.
 *   STAGE AND STUDIO (rack)   the same plan on a STAGE (the lesson's own
 *                             monitors — the ones the Studio-or-live page
 *                             uses — and the audience side) or in a STUDIO
 *                             (the room; a main pair for an ensemble).
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
import { CymbalPlan, DrumPlan, KickFromAbove, topTransform } from '../drums/DrumArt';
import { KICK_22x18 } from '../drums/drumSpec.ts';
import { KIT_CYMBALS, KIT_DRUMS } from '../kitPlanModel.ts';
import { hatchFor, pluckPath, sceneGroups, sweepPaths } from './BowedArt';
import type { Posture } from './posture.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/** One object on the plan: what it is, where (lesson frame, top view), how
 *  big for a tap, and — for another string player — their posture. */
export type PlanObject = {
  id: string;
  kind: 'self' | 'bowed' | 'stand' | 'piano' | 'kit' | 'pair';
  at: { x: number; z: number };
  /** Turn on the plan, degrees (from +x toward +z). */
  yaw?: number;
  r: number;
  posture?: Posture;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
};

export type BowedSettingConfig = {
  P: Posture;
  /** What works the strings: the bow (its sweep hatched) or a plucking hand. Default bow. */
  hands?: 'bow' | 'pluck';
  objects: readonly PlanObject[];
  /** The plan boxes (lesson frame, mm): around the player, and the wider room. */
  near: ViewBox;
  wide: ViewBox;
  /** The words. */
  nearA11y: string;
  wideA11y: { stage: string; studio: string };
  nearLanding: string;
  nearIdle: string;
  stageIdle: string;
  studioIdle: string;
  before: readonly { title: string; text: string }[];
  hearing: string;
};

/* ── plan drawings ── */
const DEG = Math.PI / 180;
const make = () => Skia.Path.Make();

export function MusicStand() {
  const p = useMemo(() => {
    const desk = make();
    desk.addRRect(Skia.RRectXY(Skia.XYWHRect(-60, -250, 120, 500), 10, 10));
    const lip = make();
    lip.addRRect(Skia.RRectXY(Skia.XYWHRect(42, -250, 22, 500), 6, 6));
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      legs.moveTo(0, 0);
      legs.lineTo(Math.cos(a) * 260, Math.sin(a) * 260);
    }
    return { desk, lip, legs };
  }, []);
  return (
    <>
      <Path path={p.legs} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={9} strokeCap="round" color="#4d515b" />
      <Path path={p.desk}>
        <LinearGradient start={vec(-60, -250)} end={vec(60, 250)} colors={['#3a3d45', '#1c1d22', '#0c0c0f']} />
      </Path>
      <Path path={p.lip} color="#26282e" />
      <Path path={p.desk} style="stroke" strokeWidth={4} color="#70747f" />
    </>
  );
}

/** A grand piano from above (generic): its bentside case, the keyboard, the
 *  open lid's outline. ≈ 2.1 m long. */
export function GrandPiano() {
  const p = useMemo(() => {
    const L = 2100;
    const Wd = 1500;
    const caseP = make();
    caseP.moveTo(0, 0);
    caseP.lineTo(0, Wd);
    caseP.lineTo(L * 0.42, Wd);
    caseP.cubicTo(L * 0.62, Wd, L * 0.66, Wd * 0.62, L * 0.82, Wd * 0.5);
    caseP.cubicTo(L * 0.98, Wd * 0.38, L * 1.02, Wd * 0.18, L * 0.96, Wd * 0.06);
    caseP.cubicTo(L * 0.9, -Wd * 0.02, L * 0.5, 0, 0, 0);
    caseP.close();
    const keys = make();
    keys.addRect(Skia.XYWHRect(-150, 20, 150, Wd - 40));
    const blacks = make();
    for (let i = 0; i < 36; i++) blacks.addRect(Skia.XYWHRect(-150, 40 + i * ((Wd - 80) / 36), 95, 18));
    const plate = make();
    plate.addOval(Skia.XYWHRect(L * 0.12, Wd * 0.12, L * 0.55, Wd * 0.72));
    return { caseP, keys, blacks, plate };
  }, []);
  return (
    <>
      <Path path={p.caseP}>
        <LinearGradient start={vec(0, 0)} end={vec(2100, 1500)} colors={['#3d3f46', '#17181c', '#060607']} />
      </Path>
      <Path path={p.plate} color="#b38b3e" opacity={0.35} />
      <Path path={p.caseP} style="stroke" strokeWidth={8} color="#7d818c" opacity={0.7} />
      <Path path={p.keys} color="#ece9e1" />
      <Path path={p.blacks} color="#111" />
    </>
  );
}

/** A main stereo pair on a tall stand, from above: tripod, bar, two mics. */
export function MainPair() {
  const p = useMemo(() => {
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      legs.moveTo(0, 0);
      legs.lineTo(Math.cos(a) * 300, Math.sin(a) * 300);
    }
    const bar = make();
    bar.moveTo(0, -140);
    bar.lineTo(0, 140);
    const mics = make();
    for (const s of [-1, 1]) {
      mics.moveTo(-20, s * 120);
      mics.lineTo(-20 - 130 * Math.cos(45 * DEG), s * (120 + 130 * Math.sin(45 * DEG)));
    }
    return { legs, bar, mics };
  }, []);
  return (
    <>
      <Path path={p.legs} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={9} strokeCap="round" color="#4d515b" />
      <Path path={p.bar} style="stroke" strokeWidth={16} strokeCap="round" color="#2a2c32" />
      <Path path={p.mics} style="stroke" strokeWidth={26} strokeCap="round" color="#0b0c0f" />
      <Path path={p.mics} style="stroke" strokeWidth={20} strokeCap="round" color="#b9bec8" />
    </>
  );
}

/** Lab 1's shared kit (drum family art), placed by its kick's batter centre. */
export function Kit() {
  return (
    <Group opacity={0.85}>
      <KickFromAbove spec={KICK_22x18} u0={0} z={0} />
      {(['snare', 'tom1', 'tom2', 'floor'] as const).map((id) => (
        <Group key={id} transform={topTransform(KIT_DRUMS[id])}>
          <DrumPlan drum={KIT_DRUMS[id]} />
        </Group>
      ))}
      {(['hihat', 'crash1', 'crash2', 'ride'] as const).map((id) => (
        <CymbalPlan key={id} cx={KIT_CYMBALS[id].c.x} cz={KIT_CYMBALS[id].c.z} d={KIT_CYMBALS[id].d} tiltDeg={KIT_CYMBALS[id].tiltDeg} dim={0.6} />
      ))}
    </Group>
  );
}

/** A floor wedge from above: the sloped baffle (facing `faces`) behind a grille. */
export function WedgeTop({ at, faces }: { at: { x: number; z: number }; faces: { x: number; z: number } }) {
  const ang = Math.atan2(faces.z, faces.x);
  const p = useMemo(() => {
    const cab = make();
    cab.addRRect(Skia.RRectXY(Skia.XYWHRect(-150, -280, 300, 560), 18, 18));
    const grille = make();
    grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-40, -258, 176, 516), 14, 14));
    const holes = make();
    for (let x = -26; x < 128; x += 20) for (let z = -244; z < 250; z += 20) holes.addCircle(x, z, 4.2);
    return { cab, grille, holes };
  }, []);
  return (
    <Group transform={[{ translateX: at.x }, { translateY: at.z }, { rotate: ang }]}>
      <Path path={p.cab}>
        <LinearGradient start={vec(-150, -280)} end={vec(150, 280)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      <Path path={p.grille} color="#0c0d10" />
      <Path path={p.holes} color="#4a4e57" opacity={0.9} />
      <Path path={p.cab} style="stroke" strokeWidth={4} color="#70747f" opacity={0.9} />
    </Group>
  );
}

/** A string player and instrument from above (the family's own art). */
function BowedTop({ P, dim, bow = true }: { P: Posture; dim: number; bow?: boolean }) {
  const groups = useMemo(() => sceneGroups(P, 'top', { bow }), [P, bow]);
  return (
    <Group opacity={dim}>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) =>
            typeof it.fill === 'object' ? (
              <Path key={i} path={it.path}>
                <LinearGradient start={vec(it.box.u0, it.box.v0)} end={vec(it.box.u1, it.box.v1)} colors={it.fill.colors} positions={it.fill.positions} />
              </Path>
            ) : it.fill ? (
              <Path key={i} path={it.path} color={it.fill} />
            ) : it.stroke ? (
              <Path key={i} path={it.path} style="stroke" strokeWidth={it.stroke.w} color={it.stroke.color} opacity={it.stroke.opacity ?? 1} />
            ) : null,
          )}
        </Group>
      ))}
    </Group>
  );
}

export function BowedPlan({ w, h, cfg, box, scene, wedges, items, highlight, onTap, accessibilityLabel }: { w: number; h: number; cfg: BowedSettingConfig; box: ViewBox; scene: 'kit' | 'stage' | 'studio'; wedges: readonly Wedge[]; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const self = cfg.P;
  const sweep = useMemo(() => (cfg.hands === 'pluck' ? pluckPath(self, 'top') : sweepPaths(self, 'top').bow), [self, cfg.hands]);
  const hatch = useMemo(() => hatchFor(box), [box]);
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
  const sel = cfg.objects.find((o) => o.id === highlight) ?? null;
  const selItem = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = shown
    .filter((o) => o.kind !== 'self')
    .map((o) => ({ id: o.id, text: o.label.toUpperCase(), short: o.short?.toUpperCase(), u: o.at.x, v: o.at.z + o.r * 0.75, align: 'center' as const, tone: (highlight === o.id ? undefined : 'muted') as StaticLabel['tone'] }));
  labels.push({ id: 'player', text: 'THE PLAYER', u: self.player.pelvis.x, v: self.player.pelvis.z - 330, align: 'center', tone: 'muted' });
  if (scene === 'stage') labels.push({ id: 'aud', text: 'AUDIENCE · PA →', short: 'AUDIENCE →', u: box.u1 - 40, v: box.v0 + 60, align: 'right', tone: 'muted' });
  if (scene === 'studio') labels.push({ id: 'room', text: 'THE ROOM', u: box.u0 + 120, v: box.v0 + 120, align: 'left', tone: 'muted' });
  const tap = (u: number, v: number) => {
    let best: { id: string; d: number } | null = null;
    for (const o of shown) {
      const d = Math.hypot(u - o.at.x, v - o.at.z) - o.r;
      if (d < 60 && (!best || d < best.d)) best = { id: o.id, d };
    }
    for (const wd of wedges) {
      if (scene !== 'stage') continue;
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
          {scene === 'stage' ? <Path path={(() => { const p = make(); p.moveTo(box.u1 - 220, box.v0); p.lineTo(box.u1 - 220, box.v1); return p; })()} style="stroke" strokeWidth={10} color="#ffc64d" opacity={0.35}><DashPathEffect intervals={[60, 40]} /></Path> : null}
          {shown.map((o) => (
            <Group key={o.id} transform={[{ translateX: o.at.x }, { translateY: o.at.z }, { rotate: (o.yaw ?? 0) * DEG }]}>
              {o.kind === 'stand' ? <MusicStand /> : o.kind === 'piano' ? <GrandPiano /> : o.kind === 'kit' ? <Kit /> : o.kind === 'pair' ? <MainPair /> : o.kind === 'bowed' && o.posture ? <BowedTop P={o.posture} dim={0.72} /> : null}
            </Group>
          ))}
          {scene === 'stage' ? wedges.filter((x) => x.glyph !== 'none').map((x) => <WedgeTop key={x.id} at={{ x: x.p.x, z: x.p.z }} faces={{ x: x.faces.x, z: x.faces.z }} />) : null}
          <BowedTop P={self} dim={1} bow={cfg.hands !== 'pluck'} />
          <Group clip={sweep}>
            <Path path={hatch} style="stroke" strokeWidth={2} color="#8a8f9c" opacity={0.5} />
          </Group>
          <Path path={sweep} style="stroke" strokeWidth={2.5} color="#8a8f9c" opacity={0.75} />
          {ring ? <Path path={ring} style="stroke" strokeWidth={14} color="#ffc64d" opacity={0.9} /> : null}
        </Group>
      </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function makeBowedSettingPage(cfg: BowedSettingConfig): (p: PageProps) => ReactNode {
  return function BowedSetting({ lesson, answers, onAnswered }: PageProps) {
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
          render: (w, h) => <BowedPlan w={w} h={h} cfg={cfg} box={cfg.near} scene="kit" wedges={lesson.live.wedges} items={items} highlight={nearSel} onTap={pickNear} accessibilityLabel={cfg.nearA11y} />,
          badge: cfg.hands === 'pluck' ? 'From above · a typical layout · grey hatch = the plucking hand’s path' : 'From above · a typical layout · grey hatch = the bow’s sweep',
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
          render: (w, h) => <BowedPlan w={w} h={h} cfg={cfg} box={cfg.wide} scene={where} wedges={lesson.live.wedges} items={items} highlight={wideSel} onTap={pickWide} accessibilityLabel={where === 'stage' ? cfg.wideA11y.stage : cfg.wideA11y.studio} />,
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

export type { SkPath };
