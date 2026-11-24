/**
 * DEV STUDY — THE OPERATORS (figure V2, wave 3 set 3b of D78, 2026-11-24): the
 * measurement operators (F11, F14 reading the log sheet; F15, F16 standing at
 * rest; F11's keep-away step from above) and the plaza's people (F06), the
 * current look beside the new, at about the lesson's phone size and enlarged,
 * side view and from above. Dev page: `#labpreview/FigureStudy/operators`.
 * The pictures are the lessons' own scenes (the `v2` switch only).
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { BenchScene } from '../screens/lab/miking/lessons/f11MeasurementMics/art';
import { F11_OP_SIDE, F11_OP_TOP } from '../screens/lab/miking/lessons/f11MeasurementMics/geometry';
import { Bench as F14Bench } from '../screens/lab/miking/lessons/f14SystemMeasurement/art';
import { F14_OP_SIDE, F14_OP_TOP } from '../screens/lab/miking/lessons/f14SystemMeasurement/geometry';
import { FanScene } from '../screens/lab/miking/lessons/f15Machinery/FanArt';
import { F15_OP_SIDE, F15_OP_TOP } from '../screens/lab/miking/lessons/f15Machinery/geometry';
import { Room as F16Room } from '../screens/lab/miking/lessons/f16ScientificArrays/art';
import { F16_OP_SIDE, F16_OP_TOP } from '../screens/lab/miking/lessons/f16ScientificArrays/geometry';
import { Site as F06Site } from '../screens/lab/miking/lessons/f06Ambience/art';
import { Operator } from '../screens/lab/miking/lessons/shared/measure/MeasureArt';
import { operatorTop } from '../screens/lab/miking/lessons/shared/measure/measureModel';
import { SitePerson } from '../screens/lab/miking/lessons/shared/field/SiteArt';
import { castFor } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import type { PlayerPose } from '../screens/lab/miking/lessons/shared/players/playerPose';

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
function Lesson({ width, title, note, side, top, sideBox, topBox, zoomSide, zoomTop, more = [], firstIs = 'SIDE' }: {
  /** (review 2026-11-24) what the first column's pictures are: a page of two views from above says so */
  firstIs?: 'SIDE' | 'ABOVE';
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
  more?: { title: string; view: 'side' | 'top'; box: [number, number, number, number] }[];
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
  row([{ title: `${firstIs} · CURRENT`, draw: side(false), b: sideBox }, { title: `${firstIs} · NEW`, draw: side(true), b: sideBox }], small);
  row([{ title: 'ABOVE · CURRENT', draw: top(false), b: topBox }, { title: 'ABOVE · NEW', draw: top(true), b: topBox }], small);
  row([{ title: `${firstIs} · NEW, ENLARGED`, draw: side(true), b: zoomSide }, { title: 'ABOVE · NEW, ENLARGED', draw: top(true), b: zoomTop }], small);
  for (let i = 0; i < more.length; i += 2) row(more.slice(i, i + 2).map((m) => ({ title: m.title, draw: m.view === 'side' ? side(true) : top(true), b: m.box })), small);
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

type B = [number, number, number, number];
/** Boxes round a standing person: the whole scene's neighbourhood, the person, the hands. */
const sideBoxes = (p: PlayerPose, ground: number, ahead: number): { scene: B; zoom: B; hands: B } => {
  const f = p.facing ?? 1;
  return {
    scene: [p.neck.u + f * 400, ground - 900, 2600, 2100],
    zoom: [p.neck.u + f * 120, ground - 1150, 800, 1300],
    // (round 3: the hands hold the board's edges higher, GRIP_UP 110)
    hands: [p.neck.u + f * (ahead + 30), p.neck.v + 200, 360, 360],
  };
};
const topBoxes = (p: PlayerPose, ahead: number): { scene: B; zoom: B; hands: B } => {
  const f = Math.cos(p.facing ?? 0) >= 0 ? 1 : -1;
  return { scene: [p.neck.u + f * 400, p.neck.v, 2600, 2000], zoom: [p.neck.u + f * 200, p.neck.v, 900, 800], hands: [p.neck.u + f * ahead, p.neck.v, 420, 420] };
};

function Operators({ width, pick }: { width: number; pick: string }) {
  const on = (k: string) => pick === k;
  const s11 = sideBoxes(F11_OP_SIDE, F11_OP_SIDE.floor ?? 0, 330);
  const t11 = topBoxes(F11_OP_TOP, 360);
  const s14 = sideBoxes(F14_OP_SIDE, F14_OP_SIDE.floor ?? 0, 330);
  const t14 = topBoxes(F14_OP_TOP, 360);
  const s15 = sideBoxes(F15_OP_SIDE, F15_OP_SIDE.floor ?? 0, 0);
  const t15 = topBoxes(F15_OP_TOP, 0);
  const s16 = sideBoxes(F16_OP_SIDE, F16_OP_SIDE.floor ?? 0, 0);
  const t16 = topBoxes(F16_OP_TOP, 0);
  const keep = operatorTop(1200, -900, -1);
  const voice = castFor('site.voice');
  return (
    <View>
      {on('f11') ? (
      <Lesson
        width={width}
        title="F11 Measurement Mics — you, reading the log sheet (Ana)"
        note="Both hands at the clipboard's lower corners, each closed round the board's side edge (the thumb on the sheet, the fingers curled under the board), the upper arms hanging close, the forearms rising gently, the board tilted back toward the eyes. The board is where the lesson has always drawn it."
        side={(v2) => <BenchScene view="side" variant="bench" v2={v2} />}
        top={(v2) => <BenchScene view="top" variant="bench" v2={v2} />}
        sideBox={s11.scene}
        topBox={t11.scene}
        zoomSide={s11.zoom}
        zoomTop={t11.zoom}
        more={[
          { title: 'SIDE · THE HANDS ON THE BOARD', view: 'side', box: s11.hands },
          { title: 'ABOVE · THE HANDS ON THE BOARD', view: 'top', box: t11.hands },
          { title: 'SIDE · THE NEAR HAND, ABOUT 12×', view: 'side', box: [s11.hands[0] + 30, s11.hands[1] + 20, 170, 170] },
          { title: 'ABOVE · THE NEAR HAND, ABOUT 12×', view: 'top', box: [t11.hands[0] - 30, t11.hands[1] + 115, 170, 170] },
        ]}
      />
      ) : null}
      {on('keep') ? (
      <Lesson
        width={width}
        firstIs="ABOVE"
        title="F11 Measurement Mics — the keep-away step, from above"
        note="The step's own operator (standing back from the mic), here at one distance."
        side={(v2) => <Operator pose={keep} v2={v2} />}
        top={(v2) => <Operator pose={keep} v2={v2} />}
        sideBox={[1200, -900, 1400, 1200]}
        topBox={[1200, -900, 1400, 1200]}
        zoomSide={[1200, -900, 600, 600]}
        zoomTop={[1200, -900, 600, 600]}
      />
      ) : null}
      {on('f14') ? (
      <Lesson
        width={width}
        title="F14 System Measurement — you, reading the log sheet (Ana)"
        side={(v2) => <F14Bench view="side" v2={v2} />}
        top={(v2) => <F14Bench view="top" v2={v2} />}
        sideBox={s14.scene}
        topBox={t14.scene}
        zoomSide={s14.zoom}
        zoomTop={t14.zoom}
        more={[
          { title: 'SIDE · THE HANDS ON THE BOARD', view: 'side', box: s14.hands },
          { title: 'ABOVE · THE HANDS ON THE BOARD', view: 'top', box: t14.hands },
        ]}
      />
      ) : null}
      {on('f15') ? (
      <Lesson
        width={width}
        title="F15 Machinery — the operator standing by (Ana)"
        note="Standing, hands at rest at the sides: the approved resting hand, the back of the hand toward the viewer; from above the arms hang under the shoulders (the approved standing look)."
        side={(v2) => <FanScene view="side" v2={v2} />}
        top={(v2) => <FanScene view="top" v2={v2} />}
        sideBox={s15.scene}
        topBox={t15.scene}
        zoomSide={s15.zoom}
        zoomTop={t15.zoom}
        more={[{ title: 'SIDE · THE HANDS AT REST', view: 'side', box: [F15_OP_SIDE.neck.u, F15_OP_SIDE.neck.v + 600, 400, 400] }]}
      />
      ) : null}
      {on('f16') ? (
      <Lesson
        width={width}
        title="F16 Scientific Arrays — the operator standing by (Ana)"
        side={(v2) => <F16Room view="side" v2={v2} />}
        top={(v2) => <F16Room view="top" v2={v2} />}
        sideBox={s16.scene}
        topBox={t16.scene}
        zoomSide={s16.zoom}
        zoomTop={t16.zoom}
      />
      ) : null}
      {on('f06') ? (
      <Lesson
        width={width}
        title="F06 Ambience — the plaza's people (five passers-by, each a different cast member)"
        note="Standing at rest in the plaza; from above each turned to its heading. The swept voice on the pair step is Mei (the cast has five people; the plaza already shows five)."
        side={(v2) => <F06Site view="side" variant="plaza" v2={v2} />}
        top={(v2) => (
          <Group>
            <F06Site view="top" variant="plaza" v2={v2} />
            <SitePerson f={{ kind: 'person', c: [3000, 2000], heading: 180, role: 'public' }} view="top" v2={v2} who={voice} />
          </Group>
        )}
        sideBox={[0, -3000, 32000, 12000]}
        topBox={[0, 0, 32000, 30000]}
        zoomSide={[-3000, -900, 2200, 2000]}
        zoomTop={[-3000, -4300, 1400, 1400]}
        more={[{ title: 'ABOVE · THE SWEPT VOICE (MEI)', view: 'top', box: [3000, 2000, 1400, 1400] }]}
      />
      ) : null}
    </View>
  );
}

export function OperatorsStudy({ width, only }: { width: number; only: string }) {
  // one lesson per page (a page with many canvases runs out of GPU contexts): /operators-f11, -keep, -f14, -f15, -f16, -f06
  const pick = only.split('-')[1] ?? 'f11';
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>The operators — current beside new</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 12 }}>Each lesson's own scene with the switch off and on; enlarged below. One lesson per page: /operators-f11, /operators-keep, /operators-f14, /operators-f15, /operators-f16, /operators-f06.</Text>
      <Operators width={width} pick={pick} />
    </View>
  );
}
