/**
 * M10 — THE SETTING: WHERE IT SITS (LESSON_JOURNEY §6 stage 3, §8) for a room
 * lesson: the kit in its ROOM (the research's drawing-default live room),
 * not only the kit's neighbours. The same three steps as every lesson:
 *
 *   IN THE ROOM (rack)       the room from above or from the side: tap an item
 *                            (or step through ITEM) — the kit, the walls, the
 *                            ceiling, the corners, the door and its walkway.
 *   STAGE AND STUDIO (rack)  the same room as a stage: the PA, the monitors,
 *                            the audience side.
 *   BEFORE ANY MIC (read)    listen first, decide what the room is for,
 *                            nothing on the walls, hearing — then the checks.
 * Credit: the three checks.
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { SettingItem, ViewBox, ViewId } from '../../engine/model/types.ts';
import { copyOf } from '../../engine/model/copy.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { KIT_FLOOR_Y, yAt } from '../shared/kitPlanModel.ts';
import { CORNER_L, CORNER_R, ROOM } from './model.ts';
import { M10_VIEWS, M10_WEDGES, PA } from './geometry.ts';
import { RoomArt } from './RoomArt';

const AMBER = '#ffc64d';
type Where = 'studio' | 'live';
type Mark = { kind: 'rect'; u0: number; u1: number; v0: number; v1: number } | { kind: 'circle'; u: number; v: number; r: number };

/** Where each item is, in each view (mm) — for the ring and the tap. */
function marksOf(id: string, view: ViewId): Mark[] {
  const side = view === 'side';
  switch (id) {
    case 'kit':
      return [side ? { kind: 'rect', u0: -1000, u1: 700, v0: yAt(1350), v1: KIT_FLOOR_Y } : { kind: 'rect', u0: -1050, u1: 700, v0: -900, v1: 950 }];
    case 'walls':
      return side
        ? [{ kind: 'rect', u0: ROOM.back - 60, u1: ROOM.back + 140, v0: yAt(ROOM.ceilingH), v1: KIT_FLOOR_Y }, { kind: 'rect', u0: ROOM.front - 140, u1: ROOM.front + 60, v0: yAt(ROOM.ceilingH), v1: KIT_FLOOR_Y }]
        : [{ kind: 'rect', u0: ROOM.back - 60, u1: ROOM.front + 60, v0: ROOM.left - 60, v1: ROOM.left + 140 }, { kind: 'rect', u0: ROOM.back - 60, u1: ROOM.front + 60, v0: ROOM.right - 140, v1: ROOM.right + 60 }];
    case 'ceiling':
      return side ? [{ kind: 'rect', u0: ROOM.back, u1: ROOM.front, v0: yAt(ROOM.ceilingH) - 60, v1: yAt(ROOM.ceilingH) + 140 }] : [];
    case 'floor':
      return side ? [{ kind: 'rect', u0: ROOM.back, u1: ROOM.front, v0: KIT_FLOOR_Y - 60, v1: KIT_FLOOR_Y + 60 }] : [];
    case 'corners':
      return side ? [{ kind: 'circle', u: CORNER_R.x, v: CORNER_R.y, r: 260 }] : [CORNER_L, CORNER_R].map((c) => ({ kind: 'circle' as const, u: c.x, v: c.z, r: 300 }));
    case 'door':
      return side ? [{ kind: 'rect', u0: ROOM.back - 40, u1: ROOM.back + 900, v0: yAt(2100), v1: KIT_FLOOR_Y }] : [{ kind: 'rect', u0: ROOM.back - 40, u1: -300, v0: ROOM.door.z0, v1: ROOM.door.z1 }];
    case 'pa':
      return side ? [{ kind: 'rect', u0: PA.x - PA.d / 2 - 40, u1: PA.x + PA.d / 2 + 40, v0: yAt(PA.h1) - 40, v1: KIT_FLOOR_Y }] : [-1, 1].map((s) => ({ kind: 'rect' as const, u0: PA.x - PA.d / 2 - 60, u1: PA.x + PA.d / 2 + 60, v0: s * PA.z - PA.w / 2 - 60, v1: s * PA.z + PA.w / 2 + 60 }));
    case 'monitors':
      return M10_WEDGES.filter((w) => w.glyph !== 'none').map((w) => (side ? { kind: 'rect' as const, u0: w.p.x - 220, u1: w.p.x + 220, v0: KIT_FLOOR_Y - 380, v1: KIT_FLOOR_Y } : { kind: 'circle' as const, u: w.p.x, v: w.p.z, r: 330 }));
    case 'audience':
      return side ? [] : [{ kind: 'rect', u0: ROOM.front - 400, u1: ROOM.front + 40, v0: -1200, v1: 1200 }];
    default:
      return [];
  }
}

const LABEL_AT: Record<string, Partial<Record<ViewId, { u: number; v: number; align: 'left' | 'center' | 'right' }>>> = {
  kit: { side: { u: -150, v: yAt(1500), align: 'center' }, top: { u: -150, v: 1050, align: 'center' } },
  walls: { side: { u: ROOM.back + 200, v: yAt(1500), align: 'left' }, top: { u: 800, v: ROOM.left + 260, align: 'center' } },
  ceiling: { side: { u: 800, v: yAt(ROOM.ceilingH) + 220, align: 'center' } },
  floor: { side: { u: 2200, v: KIT_FLOOR_Y - 140, align: 'center' } },
  corners: { side: { u: CORNER_R.x - 350, v: CORNER_R.y - 330, align: 'right' }, top: { u: CORNER_R.x - 420, v: CORNER_R.z - 160, align: 'right' } },
  door: { side: { u: ROOM.back + 200, v: yAt(2300), align: 'left' }, top: { u: ROOM.back + 200, v: ROOM.door.z0 - 160, align: 'left' } },
  pa: { side: { u: PA.x, v: yAt(PA.h1) - 160, align: 'center' }, top: { u: PA.x - 300, v: PA.z + 420, align: 'right' } },
  monitors: { side: { u: 400, v: KIT_FLOOR_Y - 520, align: 'center' }, top: { u: 900, v: -800, align: 'center' } },
  audience: { top: { u: ROOM.front - 200, v: 1400, align: 'right' } },
};

function markPath(ms: Mark[]) {
  const p = Skia.Path.Make();
  for (const m of ms) {
    if (m.kind === 'rect') p.addRRect(Skia.RRectXY(Skia.XYWHRect(m.u0, m.v0, m.u1 - m.u0, m.v1 - m.v0), 60, 60));
    else p.addCircle(m.u, m.v, m.r);
  }
  return p;
}

function hit(ms: Mark[], u: number, v: number, tol: number): boolean {
  return ms.some((m) => (m.kind === 'rect' ? u >= m.u0 - tol && u <= m.u1 + tol && v >= m.v0 - tol && v <= m.v1 + tol : Math.hypot(u - m.u, v - m.v) <= m.r + tol));
}

/** A floor monitor wedge, illustrated: the cabinet, its sloped grille facing
 *  `faces`, lit from the upper left (the stage's monitors on this plan). */
function FloorWedge({ view, at, faces }: { view: ViewId; at: { x: number; y: number; z: number }; faces: { x: number; z: number } }) {
  const parts = useMemo(() => {
    const cab = Skia.Path.Make();
    const grille = Skia.Path.Make();
    const holes = Skia.Path.Make();
    if (view === 'top') {
      cab.addRRect(Skia.RRectXY(Skia.XYWHRect(-150, -280, 300, 560), 18, 18));
      grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-40, -258, 176, 516), 14, 14));
      for (let x = -26; x < 128; x += 24) for (let z = -244; z < 250; z += 24) holes.addCircle(x, z, 5);
    } else {
      cab.moveTo(-170, 0);
      cab.lineTo(170, 0);
      cab.lineTo(170, -120);
      cab.lineTo(-60, -330);
      cab.lineTo(-170, -330);
      cab.close();
      grille.moveTo(160, -128);
      grille.lineTo(-52, -318);
    }
    return { cab, grille, holes };
  }, [view]);
  const ang = Math.atan2(faces.z, faces.x);
  const v = view === 'top' ? at.z : at.y;
  const flip = view === 'side' && faces.x < 0 ? -1 : 1;
  return (
    <Group transform={[{ translateX: at.x }, { translateY: v }, { rotate: view === 'top' ? ang : 0 }, { scaleX: flip }]}>
      <Path path={parts.cab}>
        <LinearGradient start={vec(-150, -280)} end={vec(150, 280)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      <Path path={parts.cab} style="stroke" strokeWidth={6} color="#70747f" />
      {view === 'top' ? (
        <>
          <Path path={parts.grille} color="#0c0d10" />
          <Path path={parts.holes} color="#4a4e57" />
        </>
      ) : (
        <Path path={parts.grille} style="stroke" strokeWidth={16} color="#0c0d10" />
      )}
    </Group>
  );
}

function RoomPlan({ w, h, view, where, items, sel, onTap, label }: { w: number; h: number; view: ViewId; where: Where; items: readonly SettingItem[]; sel: string | null; onTap: (id: string) => void; label: string }) {
  const textScale = useStageTextScale();
  const box: ViewBox = M10_VIEWS[view];
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [view, box, w, h]);
  const ring = useMemo(() => (sel ? markPath(marksOf(sel, view)) : null), [sel, view]);
  const labels: StaticLabel[] = items
    .map((it) => ({ it, at: LABEL_AT[it.id]?.[view] }))
    .filter((x): x is { it: SettingItem; at: { u: number; v: number; align: 'left' | 'center' | 'right' } } => !!x.at)
    .sort((a, b) => (a.it.id === sel ? -1 : b.it.id === sel ? 1 : 0))
    .map(({ it, at }) => ({ id: it.id, text: it.short, u: at.u, v: at.v, align: at.align, tone: it.id === sel ? ('amber' as const) : ('muted' as const) }));
  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const tol = 20 / xf.s;
    // The smaller things first, the room's walls last.
    const order = ['pa', 'monitors', 'corners', 'door', 'kit', 'audience', 'ceiling', 'floor', 'walls'];
    for (const id of order) if (items.some((i) => i.id === id) && hit(marksOf(id, view), u, v, tol)) return onTap(id);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <RoomArt view={view} variant={where} />
            {where === 'live' ? M10_WEDGES.filter((wd) => wd.glyph !== 'none').map((wd) => <FloorWedge key={wd.id} view={view} at={wd.p} faces={wd.faces} />) : null}
            {ring ? <Path path={ring} style="stroke" strokeWidth={4 / xf.s} color={AMBER} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function PRoomSetting({ lesson, answers, onAnswered }: PageProps) {
  const C = copyOf(lesson);
  const items = lesson.setting.items;
  const roomItems = items.filter((i) => i.scene === 'all' || i.scene === 'studio');
  const [view, setView] = useState<ViewId>('top');
  const [sel, setSel] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [where, setWhere] = useState<Where>('live');
  const [wsel, setWsel] = useState<string | null>(null);
  const [wview, setWview] = useState<ViewId>('top');
  const wideItems = items.filter((i) => i.scene === 'all' || i.scene === (where === 'live' ? 'stage' : 'studio'));
  const byId = (id: string | null) => items.find((i) => i.id === id);
  const pick = (id: string) => {
    if (!roomItems.some((i) => i.id === id)) return;
    setSel(id);
    setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
  };
  const pickWide = (id: string) => {
    if (wideItems.some((i) => i.id === id)) setWsel(id);
  };
  const fader = (list: readonly SettingItem[], s: string | null, p: (id: string) => void): DockParam => {
    const idx = Math.max(0, list.findIndex((i) => i.id === s));
    return {
      kind: 'fader',
      id: 'item',
      label: 'ITEM',
      value: list.length > 1 ? idx / (list.length - 1) : 0,
      onChange: (v) => {
        const it = list[Math.round(v * (list.length - 1))];
        if (it) p(it.id);
      },
      format: () => (s ? `${byId(s)?.short ?? s} · ${byId(s)?.tag ?? ''}` : `step through the ${list.length} items`),
      formatShort: () => (s ? (byId(s)?.short ?? s).slice(0, 9) : 'STEP'),
    };
  };
  const viewToggle = (v: ViewId, set: (f: (x: ViewId) => ViewId) => void): DockParam => ({ kind: 'toggle', id: 'view', label: v === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: v === 'top', onToggle: () => set((x) => (x === 'side' ? 'top' : 'side')) });
  const bezel = (it: SettingItem | undefined, extra: BezelItem): BezelItem[] => [
    { k: 'ITEM', v: it ? it.short : 'TAP ONE', flex: 1.3 },
    { k: 'FOR A ROOM MIC', v: it ? it.tag : '—', flex: 1.5 },
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
  const selItem = byId(sel);
  const wItem = byId(wsel);
  const steps: MikingStep[] = [
    {
      key: 'room',
      title: 'In the room',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <RoomPlan w={w} h={h} view={view} where="studio" items={roomItems} sel={sel} onTap={pick} label={`The studio live room, ${view === 'top' ? 'from above' : 'from the side'}: about 6.5 by 5.4 metres with a 3 metre ceiling, the kit near the back wall, the door and its walkway behind the drummer's right.${selItem ? ` Highlighted: ${selItem.label}.` : ''}`} />,
        badge: 'The room and its size are drawing values · a typical studio live room · grey hatch = the walkway',
        bezel: bezel(selItem, { k: 'LOOKED AT', v: `${seen.size} / ${roomItems.length}`, flex: 1 }),
        params: [fader(roomItems, sel, pick), viewToggle(view, setView)],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={view === 'top' ? 'Plan · the room from above · the kit near the back wall' : 'Side view · the room from the player’s right'} prompt="Tap anything in the room — or step through ITEM — to see what it means for a room mic. There is nothing to answer yet." />
          {card(selItem, 'A room mic hears the kit and everything the room does to it: the walls, the floor and the ceiling send the sound back. The room here is a drawing value — your room is the one that counts.')}
          <Note>{C.setting.leftHanded}</Note>
        </>
      ),
    },
    {
      key: 'stage',
      title: 'Stage and studio',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <RoomPlan w={w} h={h} view={wview} where={where} items={wideItems} sel={wsel} onTap={pickWide} label={`${where === 'live' ? 'The same space as a stage: a PA pair at the front, the monitors by the kit, the audience beyond.' : 'The studio room: no PA, no monitors.'}${wItem ? ` Highlighted: ${wItem.label}.` : ''}`} />,
        badge: where === 'live' ? 'A typical small stage · PA and monitors where a stage often puts them' : 'A typical studio live room',
        bezel: bezel(wItem, { k: 'WHERE', v: where === 'live' ? 'LIVE' : 'STUDIO', flex: 1 }),
        params: [
          fader(wideItems, wsel, pickWide),
          {
            kind: 'options',
            id: 'where',
            label: where === 'live' ? 'STAGE' : 'STUDIO',
            valueLabel: where === 'live' ? 'LIVE' : 'STUDIO',
            selectedId: where,
            onSelect: (id) => {
              setWhere(id as Where);
              setWsel(null);
            },
            sticky: true,
            options: [
              { id: 'live', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
              { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
            ],
          },
          viewToggle(wview, setWview),
        ],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={where === 'live' ? 'The same space as a stage' : 'The studio room'} prompt="Switch STAGE / STUDIO, and tap what is new around the kit." />
          <Body>{where === 'live' ? lesson.setting.stage : lesson.setting.studio}</Body>
          {card(wItem, where === 'live' ? 'On a stage a distant mic hears the PA and the monitors as well as the kit — and the room sends their sound back too.' : 'In a studio the room’s own sound is what a room mic is for.')}
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
          <Note tone="warn">Protect your hearing during repeated full-kit passes. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — it has nothing to do with a microphone’s maximum SPL rating. Keep headphone and PA listening at safe, comfortable levels, and use hearing protection.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
