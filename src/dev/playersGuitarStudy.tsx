/**
 * DEV STUDY — THE GUITAR FAMILY'S PLAYERS (figure V2, wave 3 set 3c of D78,
 * 2026-11-24): each lesson's own picture with the switch off and on (the
 * current look beside the new) at about the phone's size, enlarged about 3×,
 * and the hands about 6×. One lesson variant per page (a page with many
 * canvases runs out of GPU contexts): `#labpreview/FigureStudy/playersGuitar-<lesson>-<variant>`.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { GuitarSceneArt } from '../screens/lab/miking/lessons/shared/guitars/GuitarArt';
import type { BuiltGuitarModel, GuitarScene } from '../screens/lab/miking/lessons/shared/guitars/guitarModel';
import { guitarPlayerPose } from '../screens/lab/miking/lessons/shared/guitars/guitarPlayer';
import { guitarFamParts } from '../screens/lab/miking/lessons/shared/guitars/guitarPlayerV2';
import { C01_BUILT } from '../screens/lab/miking/lessons/c01Guitar/geometry';
import { C03_BUILT } from '../screens/lab/miking/lessons/c03Resonator/geometry';
import { C05A_BUILT } from '../screens/lab/miking/lessons/c05aBanjo/geometry';
import { C05B_BUILT } from '../screens/lab/miking/lessons/c05bMandolin/geometry';
import { C05C_BUILT } from '../screens/lab/miking/lessons/c05cUkulele/geometry';
import { C07_BUILT } from '../screens/lab/miking/lessons/c07AcousticBass/geometry';

const STAGE = '#0b0c10';
const INK = '#e8e6e1';
const DIM = '#9a978f';

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

/** One lesson in ONE canvas (the browser allows only so many): old | new at the phone's size (side, from
 *  above), then the new enlarged and the close-ups, each picture cropped to its box. */
function Lesson({ width, title, note, side, top, sideBox, topBox, zoomSide, zoomTop, more = [] }: {
  width: number;
  title: string;
  note?: string;
  side: (v2: boolean) => ReactNode;
  top: (v2: boolean) => ReactNode;
  sideBox: [number, number, number, number];
  topBox: [number, number, number, number];
  zoomSide: [number, number, number, number];
  zoomTop: [number, number, number, number];
  /** further close-ups (the hands, a foot …) */
  more?: { title: string; view: 'side' | 'top'; box: [number, number, number, number]; wide?: boolean }[];
}) {
  const gap = 8;
  const lab = 16;
  const small = Math.floor(Math.min(300, (width - 24 - gap) / 2));
  const big = Math.floor(Math.min(2 * small + gap, width - 24));
  type Item = { title: string; draw: ReactNode; b: [number, number, number, number]; w: number; x: number; y: number; h: number };
  const items: Item[] = [];
  let y = 0;
  const row = (cells: { title: string; draw: ReactNode; b: [number, number, number, number] }[], w: number) => {
    const h = Math.max(...cells.map((c) => (c.b[3] * w) / c.b[2]));
    cells.forEach((c, i) => items.push({ ...c, w, x: i * (w + gap), y, h }));
    y += h + lab + gap;
  };
  row([{ title: 'SIDE · CURRENT', draw: side(false), b: sideBox }, { title: 'SIDE · NEW', draw: side(true), b: sideBox }], small);
  row([{ title: 'ABOVE · CURRENT', draw: top(false), b: topBox }, { title: 'ABOVE · NEW', draw: top(true), b: topBox }], small);
  row([{ title: 'SIDE · NEW, ENLARGED', draw: side(true), b: zoomSide }, { title: 'ABOVE · NEW, ENLARGED', draw: top(true), b: zoomTop }], small);
  const pairs = more.filter((m) => !m.wide);
  for (let i = 0; i < pairs.length; i += 2) row(pairs.slice(i, i + 2).map((m) => ({ title: m.title, draw: m.view === 'side' ? side(true) : top(true), b: m.box })), small);
  // (a close-up across the whole width: the hands checked at about 10×)
  for (const m of more.filter((q) => q.wide)) row([{ title: m.title, draw: m.view === 'side' ? side(true) : top(true), b: m.box }], big);
  const W = big;
  const H = y;
  return (
    <View style={{ marginBottom: 24 }}>
      <Head title={title} note={note} />
      <View>
        <Canvas style={{ width: W, height: H }}>
          {items.map((q, i) => {
            const k = q.w / q.b[2];
            return (
              <Group key={i} clip={Skia.XYWHRect(q.x, q.y, q.w, q.h)}>
                <Rect x={q.x} y={q.y} width={q.w} height={q.h} color={STAGE} />
                <Group transform={[{ translateX: q.x + q.w / 2 - q.b[0] * k }, { translateY: q.y + q.h / 2 - q.b[1] * k }, { scale: k }]}>
                  <FigureScale ptPerMm={k}>{q.draw}</FigureScale>
                </Group>
              </Group>
            );
          })}
        </Canvas>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} pointerEvents="none">
          {items.map((q, i) => (
            <Text key={i} style={{ position: 'absolute', left: q.x, top: q.y + q.h + 1, color: DIM, fontSize: 11, width: q.w }}>
              {q.title} · {(q.w / q.b[2]).toFixed(2)} pt/mm
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const BUILT: Record<string, BuiltGuitarModel> = { c01: C01_BUILT, c03: C03_BUILT, c05a: C05A_BUILT, c05b: C05B_BUILT, c05c: C05C_BUILT, c07: C07_BUILT };

/** One lesson variant: the views' boxes from the scene (the player and the instrument). */
function GuitarLesson({ width, sc, title }: { width: number; sc: GuitarScene; title: string }) {
  const F = guitarPlayerPose(sc, 'side');
  const T = guitarPlayerPose(sc, 'top');
  const g = sc.g;
  const cu = (g.tail + g.L) / 2;
  const side: [number, number, number, number] = [cu, (F.head.c.v + sc.floorY) / 2, g.L - g.tail + 700, sc.floorY - F.head.c.v + 300];
  const top: [number, number, number, number] = [cu, (T.head.c.v + 200) / 2, g.L - g.tail + 700, 1100];
  const zs: [number, number, number, number] = [(F.head.c.u + g.edge) / 2, (F.head.c.v + 60) / 2, 900, 900];
  const zt: [number, number, number, number] = [(T.head.c.u + g.edge) / 2, T.head.c.v / 2, 900, 800];
  // (the new hands' own middles: the palm's points, front and from above)
  const mid = (pts: { x: number; y: number; z: number }[], top: boolean) => {
    const n = pts.length || 1;
    const x = pts.reduce((a, q) => a + q.x, 0) / n;
    const y = pts.reduce((a, q) => a + (top ? q.z : q.y), 0) / n;
    return { u: x, v: y };
  };
  const PF = guitarFamParts(sc, 'front');
  const PT = guitarFamParts(sc, 'top');
  const wR = mid(PF.R.sk.palm, false);
  const wL = mid(PF.L.sk.palm, false);
  const tR = mid(PT.R.sk.palm, true);
  const tL = mid(PT.L.sk.palm, true);
  return (
    <Lesson
      width={width}
      title={title}
      side={(v2) => <GuitarSceneArt sc={sc} view="side" v2={v2} />}
      top={(v2) => <GuitarSceneArt sc={sc} view="top" v2={v2} />}
      sideBox={side}
      topBox={top}
      zoomSide={zs}
      zoomTop={zt}
      more={[
        { title: 'FRONT · THE PICKING HAND, ABOUT 10×', view: 'side', box: [wR.u, wR.v + 20, 160, 160] },
        { title: 'FRONT · THE FRETTING HAND, ABOUT 10×', view: 'side', box: [wL.u + 10, wL.v - 30, 170, 170] },
        { title: 'ABOVE · THE PICKING HAND, ABOUT 10×', view: 'top', box: [tR.u, tR.v + 20, 170, 170] },
        { title: 'ABOVE · THE FRETTING HAND, ABOUT 10×', view: 'top', box: [tL.u + 10, tL.v + 20, 170, 170] },
        { title: 'FRONT · THE PICKING HAND, ABOUT 10× (WIDE)', view: 'side', box: [wR.u, wR.v + 20, 200, 150], wide: true },
        { title: 'FRONT · THE FRETTING HAND, ABOUT 10× (WIDE)', view: 'side', box: [wL.u + 10, wL.v - 30, 200, 150], wide: true },
        { title: 'FRONT · THE SHOULDERS, ABOUT 3×', view: 'side', box: [F.neck.u, F.neck.v + 60, 640, 360], wide: true },
        { title: 'FRONT · THE FRETTING FINGERTIPS, ABOUT 16×', view: 'side', box: [wL.u + 50, wL.v - 40, 120, 90], wide: true },
      ]}
    />
  );
}

export function PlayersGuitarStudy({ width, only }: { width: number; only: string }) {
  // playersGuitar-<lesson>-<variant>
  const [, lesson = 'c01', variant] = only.split('-');
  const B = BUILT[lesson] ?? C01_BUILT;
  const vid = variant && B.scenes[variant] ? variant : B.model.defaultVariant;
  const sc = B.scenes[vid];
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>The guitar family — current beside new</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 8 }}>{`Variants: ${Object.keys(B.scenes).join(', ')} (…-${lesson}-<variant>)`}</Text>
      <GuitarLesson width={width} sc={sc} title={`${lesson.toUpperCase()} · ${vid} · ${sc.variant.posture}`} />
    </View>
  );
}
