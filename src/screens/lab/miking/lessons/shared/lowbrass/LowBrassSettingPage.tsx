/**
 * Page 3 — THE SETTING: WHERE IT SITS, for the low / coiled brass
 * (LESSON_JOURNEY §6 stage 3, §8). The lesson's own page
 * (LessonArt.pages.setting): the kit plan does not fit a seated brass player.
 *
 *   AROUND THE PLAYER (rack)  a plan from above at the real scale: the player
 *                             and the instrument (the family's own art), the
 *                             player's space hatched (the bell, the hands, a
 *                             horn's "bells up"), and the neighbours as
 *                             illustrated objects — another brass player of
 *                             the family, a music stand, the wall behind a
 *                             horn. Tap one, or step through ITEM.
 *   STAGE AND STUDIO (rack)   the same plan on a STAGE (the lesson's own
 *                             monitors — the ones STUDIO OR LIVE uses — the
 *                             audience side) or in a STUDIO (the room, a main
 *                             pair, a piano for a horn recital).
 *   BEFORE ANY MIC (read)     ask the player; hear it unamplified; hearing;
 *                             then the three checks.
 * Positions are a typical layout (internal `prov`; nothing tagged on screen).
 * Credit: the three checks.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Wedge2WayTop } from '../wedge2Way';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { LowBrassScene } from './LowBrassArt';
import { brassScene } from './lowBrassScene.ts';
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const DEG = Math.PI / 180;

export type PlanObject = {
  id: string;
  kind: 'self' | 'brass' | 'stand' | 'piano' | 'pair' | 'wall';
  /** Where it sits (lesson frame, plan: x toward the audience, z to the player's right). */
  at: { x: number; z: number };
  /** Turn on the plan (deg, from +x toward +z). */
  yaw?: number;
  /** Its tap radius (mm). */
  r: number;
  /** Another brass player: which instrument and bell. */
  spec?: LowBrassSpec;
  orient?: Orient;
  label: string;
  short?: string;
  scene: 'kit' | 'stage' | 'studio' | 'all';
};

export type LowBrassSettingConfig = {
  spec: LowBrassSpec;
  objects: readonly PlanObject[];
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

/* ── plan objects ── */
function MusicStand() {
  const p = useMemo(() => {
    const desk = make();
    desk.addRRect(Skia.RRectXY(Skia.XYWHRect(-55, -240, 110, 480), 10, 10));
    const lip = make();
    lip.addRRect(Skia.RRectXY(Skia.XYWHRect(-62, -240, 20, 480), 6, 6));
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      legs.moveTo(0, 0);
      legs.lineTo(Math.cos(a) * 250, Math.sin(a) * 250);
    }
    return { desk, lip, legs };
  }, []);
  return (
    <>
      <Path path={p.legs} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={9} strokeCap="round" color="#4d515b" />
      <Path path={p.desk}>
        <LinearGradient start={vec(-55, -240)} end={vec(55, 240)} colors={['#3a3d45', '#1c1d22', '#0c0c0f']} />
      </Path>
      <Path path={p.lip} color="#26282e" />
      <Path path={p.desk} style="stroke" strokeWidth={4} color="#70747f" />
    </>
  );
}

/** A grand piano from above (generic): the bentside case, the keyboard
 *  toward the pianist (−x of its own frame), the open lid's outline. */
function GrandPiano() {
  const p = useMemo(() => {
    const L = 2100;
    const W = 1500;
    const c = make();
    c.moveTo(0, -W / 2);
    c.lineTo(0, W / 2);
    c.lineTo(L * 0.42, W / 2);
    c.cubicTo(L * 0.62, W / 2, L * 0.66, W * 0.12, L * 0.82, 0);
    c.cubicTo(L * 0.98, -W * 0.12, L * 1.02, -W * 0.32, L * 0.96, -W * 0.44);
    c.cubicTo(L * 0.9, -W * 0.52, L * 0.5, -W / 2, 0, -W / 2);
    c.close();
    const keys = make();
    keys.addRect(Skia.XYWHRect(-150, -W / 2 + 20, 150, W - 40));
    const blacks = make();
    for (let i = 0; i < 36; i++) blacks.addRect(Skia.XYWHRect(-150, -W / 2 + 40 + i * ((W - 80) / 36), 95, 18));
    const plate = make();
    plate.addOval(Skia.XYWHRect(L * 0.12, -W * 0.38, L * 0.55, W * 0.72));
    return { c, keys, blacks, plate };
  }, []);
  return (
    <>
      <Path path={p.c}>
        <LinearGradient start={vec(0, -750)} end={vec(2100, 750)} colors={['#3d3f46', '#17181c', '#060607']} />
      </Path>
      <Path path={p.plate} color="#b38b3e" opacity={0.35} />
      <Path path={p.c} style="stroke" strokeWidth={8} color="#7d818c" opacity={0.7} />
      <Path path={p.keys} color="#ece9e1" />
      <Path path={p.blacks} color="#111" />
    </>
  );
}

/** A main stereo pair on a tall stand, from above. */
function MainPair() {
  const p = useMemo(() => {
    const legs = make();
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
      legs.moveTo(0, 0);
      legs.lineTo(Math.cos(a) * 280, Math.sin(a) * 280);
    }
    const bar = make();
    bar.moveTo(0, -130);
    bar.lineTo(0, 130);
    const mics = make();
    for (const s of [-1, 1]) {
      mics.moveTo(-20, s * 110);
      mics.lineTo(-20 - 120 * Math.cos(45 * DEG), s * (110 + 120 * Math.sin(45 * DEG)));
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

/** A wall (or a stage shell) seen edge-on from above, hatched behind. */
function Wall({ len }: { len: number }) {
  const p = useMemo(() => {
    const face = make();
    face.addRect(Skia.XYWHRect(-60, -len / 2, 60, len));
    const hatch = make();
    for (let z = -len / 2; z < len / 2; z += 110) {
      hatch.moveTo(-60, z);
      hatch.lineTo(-200, z + 120);
    }
    return { face, hatch };
  }, [len]);
  return (
    <>
      <Path path={p.hatch} style="stroke" strokeWidth={8} color="#5a5e68" />
      <Path path={p.face}>
        <LinearGradient start={vec(-60, -len / 2)} end={vec(0, len / 2)} colors={['#9aa0ab', '#5d626d', '#2f3239']} />
      </Path>
    </>
  );
}

/** A 2-way floor wedge from above, at true size (shared/wedge2Way.tsx):
 *  its sloped baffle — woofer and horn behind the grille — facing `faces`,
 *  the flat top panel and rear input at the back. */
function WedgeTop({ at, faces }: { at: { x: number; z: number }; faces: { x: number; z: number } }) {
  const ang = Math.atan2(faces.z, faces.x);
  return (
    <Group transform={[{ translateX: at.x }, { translateY: at.z }, { rotate: ang }]}>
      <Wedge2WayTop />
    </Group>
  );
}

/** Diagonal hatching across a box (mm). */
function hatchFor(box: ViewBox): SkPath {
  const p = make();
  const span = box.u1 - box.u0 + (box.v1 - box.v0);
  for (let d = 0; d < span; d += 34) {
    p.moveTo(box.u0 + d, box.v0);
    p.lineTo(box.u0 + d - (box.v1 - box.v0), box.v1);
  }
  return p;
}

/** The player's space in plan: the body, the bell and the hands (and a horn's
 *  "bells up"), as one outline. */
function playerSpace(spec: LowBrassSpec, orient: Orient): SkPath {
  const s = brassScene(spec, orient);
  const cap = (a: { x: number; z: number }, b: { x: number; z: number }, r: number) => {
    const q = make();
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L;
    const nz = dx / L;
    q.moveTo(a.x + nx * r, a.z + nz * r);
    q.lineTo(b.x + nx * r, b.z + nz * r);
    q.arcToOval(Skia.XYWHRect(b.x - r, b.z - r, 2 * r, 2 * r), (Math.atan2(nz, nx) * 180) / Math.PI, -180, false);
    q.lineTo(a.x - nx * r, a.z - nz * r);
    q.arcToOval(Skia.XYWHRect(a.x - r, a.z - r, 2 * r, 2 * r), (Math.atan2(-nz, -nx) * 180) / Math.PI, -180, false);
    q.close();
    return q;
  };
  const parts = [cap({ x: s.J.pelvis.x, z: s.J.pelvis.z }, { x: s.bell.rim.x, z: s.bell.rim.z }, s.bell.R + 110), cap({ x: s.J.pelvis.x, z: -180 }, { x: s.J.toeR.x, z: 180 }, 300)];
  if (s.bellsUp) parts.push(cap({ x: s.bell.rim.x, z: s.bell.rim.z }, { x: s.bellsUp.x, z: s.bellsUp.z }, s.bell.R + 60));
  let out: SkPath | null = null;
  for (const q of parts) out = out ? Skia.Path.MakeFromOp(out, q, PathOp.Union) ?? out : q;
  return out ?? make();
}

export function LowBrassPlan({ w, h, cfg, orient, box, scene, wedges, items, highlight, onTap, accessibilityLabel }: { w: number; h: number; cfg: LowBrassSettingConfig; orient: Orient; box: ViewBox; scene: 'kit' | 'stage' | 'studio'; wedges: readonly Wedge[]; items: readonly SettingItem[]; highlight: string | null; onTap: (id: string) => void; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const self = brassScene(cfg.spec, orient);
  const space = useMemo(() => playerSpace(cfg.spec, orient), [orient]); // eslint-disable-line react-hooks/exhaustive-deps
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
    .map((o) => ({ id: o.id, text: o.label.toUpperCase(), short: o.short?.toUpperCase(), u: o.at.x, v: o.at.z + o.r * 0.8, align: 'center' as const, tone: (highlight === o.id ? undefined : 'muted') as StaticLabel['tone'] }));
  labels.push({ id: 'player', text: 'THE PLAYER', u: self.J.pelvis.x - 120, v: -360, align: 'right', tone: 'muted', at: { u: self.J.pelvis.x, v: -150 } });
  if (scene === 'stage') labels.push({ id: 'aud', text: 'AUDIENCE · PA →', short: 'AUDIENCE →', u: box.u1 - 40, v: box.v0 + 70, align: 'right', tone: 'muted' });
  if (scene === 'studio') labels.push({ id: 'room', text: 'THE ROOM', u: box.u0 + 120, v: box.v0 + 130, align: 'left', tone: 'muted' });
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
              <Path path={(() => { const p = make(); p.moveTo(box.u1 - 220, box.v0); p.lineTo(box.u1 - 220, box.v1); return p; })()} style="stroke" strokeWidth={10} color="#ffc64d" opacity={0.35}>
                <DashPathEffect intervals={[60, 40]} />
              </Path>
            ) : null}
            {shown.map((o) => (
              <Group key={o.id} transform={[{ translateX: o.at.x }, { translateY: o.at.z }, { rotate: (o.yaw ?? 0) * DEG }]}>
                {o.kind === 'stand' ? <MusicStand /> : o.kind === 'piano' ? <GrandPiano /> : o.kind === 'pair' ? <MainPair /> : o.kind === 'wall' ? <Wall len={o.r * 2} /> : o.kind === 'brass' && o.spec ? <LowBrassScene s={brassScene(o.spec, o.orient ?? o.spec.orients[0])} view="top" dim={0.7} /> : null}
              </Group>
            ))}
            {scene === 'stage' ? wedges.filter((x) => x.glyph !== 'none').map((x) => <WedgeTop key={x.id} at={{ x: x.p.x, z: x.p.z }} faces={{ x: x.faces.x, z: x.faces.z }} />) : null}
            <LowBrassScene s={self} view="top" />
            <Group clip={space}>
              <Path path={hatch} style="stroke" strokeWidth={2} color="#8a8f9c" opacity={0.4} />
            </Group>
            <Path path={space} style="stroke" strokeWidth={2.5} color="#8a8f9c" opacity={0.7} />
            {ring ? <Path path={ring} style="stroke" strokeWidth={14} color="#ffc64d" opacity={0.9} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function makeLowBrassSettingPage(cfg: LowBrassSettingConfig): (p: PageProps) => ReactNode {
  return function LowBrassSetting({ lesson, answers, onAnswered, variant }: PageProps) {
    const orient = (cfg.spec.orients.includes(variant as Orient) ? variant : cfg.spec.orients[0]) as Orient;
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
          render: (w, h) => <LowBrassPlan w={w} h={h} cfg={cfg} orient={orient} box={cfg.near} scene="kit" wedges={lesson.live.wedges} items={items} highlight={nearSel} onTap={pickNear} accessibilityLabel={cfg.nearA11y} />,
          badge: 'From above · a typical layout · grey hatch = the player’s space',
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
          render: (w, h) => <LowBrassPlan w={w} h={h} cfg={cfg} orient={orient} box={cfg.wide} scene={where} wedges={lesson.live.wedges} items={items} highlight={wideSel} onTap={pickWide} accessibilityLabel={where === 'stage' ? cfg.wideA11y.stage : cfg.wideA11y.studio} />,
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
