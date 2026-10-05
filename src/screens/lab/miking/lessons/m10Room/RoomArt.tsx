/**
 * M10 DRUM ROOM MICROPHONES — the look: the research's drawing-default live
 * room around the shared kit (lessons/shared/kitScene), lit like the rest of
 * Lab 1. Side view: the wooden floor, the ceiling, the back and front walls
 * with their absorbers, the door's frame. Top view: four walls with absorber
 * panels, the door and its swing, the walkway to the kit (a keep-out, drawn
 * by the engine as hatching). Live: the PA pair on its stands. Nothing moves.
 */
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { KIT_FLOOR_Y, yAt } from '../shared/kitPlanModel.ts';
import { KitSide, KitTop, kitHitTest, kitLabels } from '../shared/kitScene/KitSceneArt';
import { CORNER_L, CORNER_R, ROOM } from './model.ts';
import { PA } from './geometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const rect = (p: SkPath, x0: number, y0: number, x1: number, y1: number, r = 0) => {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
};

const TOP_Y = yAt(ROOM.ceilingH);
const WALL = 120;

const built: Partial<Record<ViewId, ReturnType<typeof buildSide> | ReturnType<typeof buildTop>>> = {};

function buildSide() {
  const floor = rect(make(), ROOM.back, KIT_FLOOR_Y, ROOM.front, KIT_FLOOR_Y + 40);
  const boards = make();
  for (let x = ROOM.back + 180; x < ROOM.front; x += 180) {
    boards.moveTo(x, KIT_FLOOR_Y + 2);
    boards.lineTo(x, KIT_FLOOR_Y + 38);
  }
  const ceiling = rect(make(), ROOM.back, TOP_Y - 60, ROOM.front, TOP_Y);
  const walls = make();
  rect(walls, ROOM.back - WALL, TOP_Y - 60, ROOM.back, KIT_FLOOR_Y + 40);
  rect(walls, ROOM.front, TOP_Y - 60, ROOM.front + WALL, KIT_FLOOR_Y + 40);
  // Absorber panels on the back and front walls (cosmetic: no source gives them).
  const panels = make();
  for (const h of [700, 1500, 2300]) {
    rect(panels, ROOM.back, yAt(h + 300), ROOM.back + 70, yAt(h - 300), 10);
    rect(panels, ROOM.front - 70, yAt(h + 300), ROOM.front, yAt(h - 300), 10);
  }
  const door = rect(make(), ROOM.back, yAt(2100), ROOM.back + 50, KIT_FLOOR_Y, 4);
  const pa = make();
  rect(pa, PA.x - PA.d / 2, yAt(PA.h1), PA.x + PA.d / 2, yAt(PA.h0), 12);
  const paStand = make();
  paStand.moveTo(PA.x, yAt(PA.h0));
  paStand.lineTo(PA.x, KIT_FLOOR_Y - 120);
  paStand.moveTo(PA.x, KIT_FLOOR_Y - 120);
  paStand.lineTo(PA.x - 260, KIT_FLOOR_Y);
  paStand.moveTo(PA.x, KIT_FLOOR_Y - 120);
  paStand.lineTo(PA.x + 260, KIT_FLOOR_Y);
  return { kind: 'side' as const, floor, boards, ceiling, walls, panels, door, pa, paStand };
}

function buildTop() {
  const walls = make();
  rect(walls, ROOM.back - WALL, ROOM.left - WALL, ROOM.front + WALL, ROOM.left);
  rect(walls, ROOM.back - WALL, ROOM.right, ROOM.front + WALL, ROOM.right + WALL);
  rect(walls, ROOM.back - WALL, ROOM.left, ROOM.back, ROOM.door.z0);
  rect(walls, ROOM.back - WALL, ROOM.door.z1, ROOM.back, ROOM.right);
  rect(walls, ROOM.front, ROOM.left, ROOM.front + WALL, ROOM.right);
  const floor = rect(make(), ROOM.back, ROOM.left, ROOM.front, ROOM.right);
  const boards = make();
  for (let z = ROOM.left + 160; z < ROOM.right; z += 160) {
    boards.moveTo(ROOM.back, z);
    boards.lineTo(ROOM.front, z);
  }
  const panels = make();
  for (let x = ROOM.back + 500; x < ROOM.front - 700; x += 1100) {
    rect(panels, x, ROOM.left, x + 600, ROOM.left + 70, 10);
    rect(panels, x, ROOM.right - 70, x + 600, ROOM.right, 10);
  }
  for (let z = ROOM.left + 500; z < ROOM.right - 600; z += 1100) rect(panels, ROOM.front - 70, z, ROOM.front, z + 600, 10);
  // The door leaf (open into the room) and its swing.
  const leaf = make();
  leaf.moveTo(ROOM.back, ROOM.door.z1);
  leaf.lineTo(ROOM.back + ROOM.door.swing, ROOM.door.z1);
  const swing = make();
  swing.addArc(Skia.XYWHRect(ROOM.back - ROOM.door.swing, ROOM.door.z1 - ROOM.door.swing, 2 * ROOM.door.swing, 2 * ROOM.door.swing), 270, 90);
  const pa = make();
  for (const s of [-1, 1]) rect(pa, PA.x - PA.d / 2, s * PA.z - PA.w / 2, PA.x + PA.d / 2, s * PA.z + PA.w / 2, 14);
  return { kind: 'top' as const, walls, floor, boards, panels, leaf, swing, pa };
}

function sideOf() {
  return (built.side ??= buildSide()) as ReturnType<typeof buildSide>;
}
function topOf() {
  return (built.top ??= buildTop()) as ReturnType<typeof buildTop>;
}

export function RoomArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const live = variant === 'live';
  if (view === 'side') {
    const g = sideOf();
    return (
      <Group>
        <Path path={g.ceiling}>
          <LinearGradient start={vec(0, TOP_Y - 60)} end={vec(0, TOP_Y)} colors={['#1d1e24', '#34363f']} />
        </Path>
        <Path path={g.walls}>
          <LinearGradient start={vec(ROOM.back - WALL, 0)} end={vec(ROOM.back, 0)} colors={['#1d1e24', '#3a3c46']} />
        </Path>
        <Path path={g.panels} color={live ? '#2a2c34' : '#3a3d52'} />
        <Path path={g.panels} style="stroke" strokeWidth={6} color="#5d6a84" opacity={live ? 0.4 : 0.8} />
        <Path path={g.door} color="#4a3524" />
        <Path path={g.floor}>
          <LinearGradient start={vec(0, KIT_FLOOR_Y)} end={vec(0, KIT_FLOOR_Y + 40)} colors={live ? ['#2a2a2e', '#141416'] : ['#8a6238', '#5a3c20']} />
        </Path>
        {!live ? <Path path={g.boards} style="stroke" strokeWidth={5} color="#3a2412" opacity={0.6} /> : null}
        <KitSide reach={false} />
        {live ? (
          <>
            <Path path={g.paStand} style="stroke" strokeWidth={22} strokeCap="round" color="#2a2c32" />
            <Path path={g.pa}>
              <LinearGradient start={vec(PA.x - PA.d / 2, yAt(PA.h1))} end={vec(PA.x + PA.d / 2, yAt(PA.h0))} colors={['#3b3e46', '#1d1e23', '#0e0f12']} />
            </Path>
            <Path path={g.pa} style="stroke" strokeWidth={8} color="#5d616c" />
          </>
        ) : null}
      </Group>
    );
  }
  const g = topOf();
  return (
    <Group>
      <Path path={g.floor}>
        <LinearGradient start={vec(ROOM.back, ROOM.left)} end={vec(ROOM.front, ROOM.right)} colors={live ? ['#1d1d22', '#121215'] : ['#4a3420', '#3a2816', '#2c1e10']} />
      </Path>
      {!live ? <Path path={g.boards} style="stroke" strokeWidth={6} color="#1e140a" opacity={0.5} /> : null}
      <Path path={g.walls} color="#2e3038" />
      <Path path={g.walls} style="stroke" strokeWidth={6} color="#555a66" />
      <Path path={g.panels} color={live ? '#2a2c34' : '#3a3d52'} />
      <Path path={g.panels} style="stroke" strokeWidth={6} color="#5d6a84" opacity={0.8} />
      <Path path={g.leaf} style="stroke" strokeWidth={40} strokeCap="round" color="#6a4a2e" />
      <Path path={g.swing} style="stroke" strokeWidth={10} color="#8a8f9c" opacity={0.7}>
        <DashPathEffect intervals={[50, 40]} />
      </Path>
      <KitTop reach={false} />
      {live ? (
        <>
          <Group transform={[{ translateX: 30 }, { translateY: 40 }]}>
            <Path path={g.pa} color="#000" opacity={0.5}>
              <BlurMask blur={30} style="normal" />
            </Path>
          </Group>
          <Path path={g.pa}>
            <LinearGradient start={vec(PA.x - PA.d / 2, 0)} end={vec(PA.x + PA.d / 2, 0)} colors={['#15161a', '#3b3e46']} />
          </Path>
          <Path path={g.pa} style="stroke" strokeWidth={10} color="#5d616c" />
        </>
      ) : (
        <>
          {[CORNER_L, CORNER_R].map((c) => (
            <Circle key={c.z} cx={c.x} cy={c.z} r={80} style="stroke" strokeWidth={14} color="#6fa8ff" opacity={0.35}>
              <DashPathEffect intervals={[40, 30]} />
            </Circle>
          ))}
        </>
      )}
    </Group>
  );
}

export function roomLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [...kitLabels(view, { drummer: false }).filter((l) => l.id === 'kick' || l.id === 'snare')];
  if (view === 'side') {
    out.push({ id: 'ceiling', text: 'CEILING · 3 M', short: 'CEILING', u: ROOM.back + 200, v: TOP_Y + 140, align: 'left', tone: 'muted' });
    out.push({ id: 'floor', text: 'FLOOR', u: ROOM.front - 200, v: KIT_FLOOR_Y - 60, align: 'right', tone: 'muted' });
    out.push({ id: 'back', text: 'BACK WALL', short: 'BACK', u: ROOM.back + 120, v: yAt(2700), align: 'left', tone: 'muted' });
    out.push({ id: 'front', text: variant === 'live' ? 'AUDIENCE →' : 'FRONT WALL', short: variant === 'live' ? 'AUDIENCE' : 'FRONT', u: ROOM.front - 120, v: yAt(2700), align: 'right', tone: 'muted' });
    if (variant === 'live') out.push({ id: 'pa', text: 'PA', u: PA.x, v: yAt(PA.h1) - 90, align: 'center', tone: 'muted' });
  } else {
    out.push({ id: 'door', text: 'DOOR', u: ROOM.back + 120, v: ROOM.door.z1 + 200, align: 'left', tone: 'muted' });
    out.push({ id: 'corner', text: variant === 'live' ? 'PA' : 'CORNER', u: ROOM.front - 380, v: ROOM.right - 380, align: 'right', tone: 'muted' });
    out.push({ id: 'front', text: variant === 'live' ? 'AUDIENCE →' : 'FRONT WALL', short: 'FRONT', u: ROOM.front - 160, v: 0, align: 'right', tone: 'muted' });
  }
  return out;
}

export function roomHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const k = kitHitTest(view, u, v, tol);
  if (k) return k;
  if (variant === 'live' && Math.abs(u - PA.x) <= PA.d / 2 + tol && (view === 'side' ? v <= yAt(PA.h0) + tol && v >= yAt(PA.h1) - tol : Math.abs(Math.abs(v) - PA.z) <= PA.w / 2 + tol)) return v < 0 || view === 'side' ? 'pa.left' : 'pa.right';
  return null;
}
