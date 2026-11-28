/**
 * DEV STUDY — THE MALLET KEYBOARDS' PLAYER (figure V2, D78; the Players
 * builder, 2026-11-24): I07 vibraphone, I08 marimba, I09 xylophone, I10
 * glockenspiel — each lesson's own picture with the switch off and on, at
 * about the phone's size, enlarged, and the hands close up. 'SIDE' is the
 * lessons' front elevation (as the audience sees the player, behind the
 * keyboard); 'ABOVE' the plan (the player at the top). One lesson per page:
 * `#labpreview/FigureStudy/playersMallet-i07` … `-i10`.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { malletInstrument, malletPoses } from '../screens/lab/miking/lessons/shared/mallets/MalletArt';
import { malletGeom, type MalletFamily } from '../screens/lab/miking/lessons/shared/mallets/malletModel';
import { VIBE_FAM } from '../screens/lab/miking/lessons/i07Vibraphone/model';
import { MARIMBA_FAM } from '../screens/lab/miking/lessons/i08Marimba/model';
import { XYLO_FAM } from '../screens/lab/miking/lessons/i09Xylophone/model';
import { GLOCK_FAM } from '../screens/lab/miking/lessons/i10Glockenspiel/model';

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
  row([{ title: 'SIDE · CURRENT', draw: side(false), b: sideBox }, { title: 'SIDE · NEW', draw: side(true), b: sideBox }], small);
  row([{ title: 'ABOVE · CURRENT', draw: top(false), b: topBox }, { title: 'ABOVE · NEW', draw: top(true), b: topBox }], small);
  row([{ title: 'SIDE · NEW, ENLARGED', draw: side(true), b: zoomSide }, { title: 'ABOVE · NEW, ENLARGED', draw: top(true), b: zoomTop }], small);
  // (KeysGuitar3: the hand close-ups one to a row at the full width, so a hand is looked at near 10×)
  for (const m of more) row([{ title: m.title, draw: m.view === 'side' ? side(true) : top(true), b: m.box }], big);
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

const FAMS: Record<string, { fam: MalletFamily; title: string }> = {
  'playersMallet-i07': { fam: VIBE_FAM, title: 'I07 Vibraphone — the player (Kofi)' },
  'playersMallet-i08': { fam: MARIMBA_FAM, title: 'I08 Marimba — the player (Ana)' },
  'playersMallet-i09': { fam: XYLO_FAM, title: 'I09 Xylophone — the player (Ruth)' },
  'playersMallet-i10': { fam: GLOCK_FAM, title: 'I10 Glockenspiel — the player (Mei)' },
};
const NOTE = 'Two mallets, as every one of these lessons draws them: each hand the approved grip round the shaft (the fingers round one side, the thumb round the other, the shaft through the fist), the back of the hand turned up and out (about half-way between palm-down and thumb-up), the mallet in line with the forearm; the upper arms hanging relaxed near the sides. SIDE is the audience’s view (the player behind the keyboard).';

function OneLesson({ width, id: full }: { width: number; id: string }) {
  // (`playersMallet-i10-case`: a variant after the lesson; default the lesson's first)
  const parts = full.split('-');
  const id = parts.slice(0, 2).join('-');
  const f = FAMS[id];
  if (!f) return null;
  const G = malletGeom(f.fam);
  const v = parts[2] && f.fam.variants.some((q) => q.row.id === parts[2]) ? parts[2] : f.fam.variants[0].row.id;
  const L = G.layouts[v];
  const yF = G.floor[v];
  const Art = malletInstrument(f.fam);
  const [mA, mB] = malletPoses(L);
  const span = Math.max(2000, L.xLow - L.xHigh + 600);
  const midX = (L.xLow + L.xHigh) / 2;
  return (
    <Lesson
      width={width}
      title={`${f.title} · ${v}`}
      note={NOTE}
      side={(v2) => <Art view="side" variant={v} v2={v2} />}
      top={(v2) => <Art view="top" variant={v} v2={v2} />}
      sideBox={[midX, yF - 1000, span, Math.min(2100, span)]}
      topBox={[midX, (L.zPlayer + G.boom) / 2, span, Math.min(span, G.boom - L.zPlayer + 400)]}
      zoomSide={[0, yF - 1250, 900, 900]}
      zoomTop={[0, L.zPlayer + 250, 900, 800]}
      more={[
        { title: 'SIDE · THE SHOULDERS AND UPPER ARMS, ABOUT 4×', view: 'side', box: [0, yF - 1330, 640, 400] },
        { title: 'SIDE · THE RIGHT HAND (THE STROKE), ABOUT 10×', view: 'side', box: [mA.hand.x, mA.hand.y - 20, 200, 200] },
        { title: 'SIDE · THE LEFT HAND (RAISED), ABOUT 10×', view: 'side', box: [mB.hand.x, mB.hand.y - 20, 200, 200] },
        { title: 'ABOVE · THE RIGHT HAND, ABOUT 10×', view: 'top', box: [mA.hand.x, mA.hand.z - 30, 220, 220] },
        { title: 'ABOVE · THE LEFT HAND, ABOUT 10×', view: 'top', box: [mB.hand.x, mB.hand.z - 30, 220, 220] },
        { title: 'SIDE · THE FEET (AND THE DAMPER PEDAL), ABOUT 6×', view: 'side', box: [0, yF - 90, 420, 240] },
      ]}
    />
  );
}

export function PlayersMalletStudy({ width, only }: { width: number; only: string }) {
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>The mallet keyboards’ player — current beside new</Text>
      <OneLesson width={width} id={only === 'playersMallet' ? 'playersMallet-i08' : only} />
    </View>
  );
}
