/**
 * MIKING HAND STUDIO — DEV + WEB ONLY (hands redesign 2026-10-24).
 *
 * `#labpreview/MikingHands/<lessonId>[~u~v~w]` draws one Miking lesson's own
 * art (every variant, every view) LARGE, cropped to a window centred on
 * (u, v) mm and `w` mm wide (default: the whole view; `~view` limits it to
 * one view, `*` keeps all; a 6th field is the top view's own v), so a hand can be
 * judged at the detail a 3× phone shows. Nothing here ships to a phone: the
 * harness module is required only in the web dev branch of App.tsx.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { lessonArt } from '../screens/lab/miking/data/lessonArtLoader';
import { lessonById } from '../screens/lab/miking/data/lessonLoader';
import { viewsOf, type ViewId } from '../screens/lab/miking/engine/model/types';
import { AnatomicalHand } from '../screens/lab/miking/lessons/shared/hand/anatomy/AnatomicalHand';
import { gripCylinder, openHandOn, pinchGrip, v3 } from '../screens/lab/miking/lessons/shared/hand/anatomy/anatomy';
import type { HandView, V3 } from '../screens/lab/miking/lessons/shared/players/handModel';

/** `#labpreview/MikingHands/POSES`: the shared hand alone, in its standard
 *  poses, from four sides (frame: +x forward, +y down, +z right). */
const VIEWS: { name: string; v: HandView }[] = [
  { name: 'from the right', v: (p: V3) => ({ u: p.x, v: p.y, d: p.z }) },
  { name: 'from above', v: (p: V3) => ({ u: p.x, v: p.z, d: -p.y }) },
  { name: 'from the left', v: (p: V3) => ({ u: -p.x, v: p.y, d: -p.z }) },
  { name: 'from below', v: (p: V3) => ({ u: p.x, v: -p.z, d: p.y }) },
];
function poses() {
  const W = v3(-90, 0, 40);
  return [
    {
      name: 'flat, palm down',
      sk: openHandOn(v3(-90, 0, 0), v3(1, 0, 0), v3(0, 1, 0), 1, 0.05),
    },
    {
      name: 'cupped, palm down',
      sk: openHandOn(v3(-90, 0, 0), v3(1, 0, 0), v3(0, 1, 0), 1, 0.45),
    },
    {
      name: 'fist round Ø45 tube (across)',
      sk: gripCylinder(
        { c: v3(0, 0, 0), axis: v3(0, 0, 1), r: 22.5, slide: 20 },
        {
          thumbSign: 1,
          wrist: v3(-95, -20, 0),
          angle: [70, 90],
          back: v3(0, -1, 0),
        },
      ).sk,
    },
    {
      name: 'diagonal grip Ø45 tube (along)',
      sk: gripCylinder(
        { c: v3(0, 0, 0), axis: v3(1, 0, 0), r: 22.5, slide: 30 },
        {
          thumbSign: 1,
          wrist: W,
          angle: [35, 55],
          back: v3(0, -0.25, 1),
          thumb: 'along',
        },
      ).sk,
    },
    {
      name: 'stick Ø14',
      sk: gripCylinder(
        { c: v3(0, 0, 0), axis: v3(1, 0, -1), r: 7, tipward: true },
        {
          thumbSign: 1,
          wrist: v3(-90, -10, 30),
          angle: [45, 60],
          back: v3(0, -1, 0),
        },
      ).sk,
    },
    {
      name: 'pinch',
      sk: pinchGrip(v3(30, 20, 0), v3(1, 0, 0), v3(0, -1, 0), 1),
    },
  ];
}
function PoseSheet({ W, which }: { W: number; which?: number }) {
  const list = poses().filter((_, i) => which === undefined || i === which);
  const s = W / (which === undefined ? 300 : 240);
  const H = W * (which === undefined ? 0.8 : 0.75);
  const cols = which === undefined ? 4 : 2;
  // ONE canvas per pose (a browser keeps only ≈ 16 WebGL contexts).
  return (
    <>
      {list.map((p) => (
        <View key={p.name}>
          <Text style={{ color: '#9aa3b2', fontSize: 12 }}>
            {p.name} — {VIEWS.map((v) => v.name).join(' · ')}
          </Text>
          <Canvas style={{ width: W * cols, height: H * (4 / cols) }}>
            <Rect x={0} y={0} width={W * cols} height={H * (4 / cols)} color="#14171d" />
            {VIEWS.map((v, i) => (
              <Group key={v.name} transform={[{ translateX: W * (i % cols) + W / 2 }, { translateY: H * Math.floor(i / cols) + H / 2 }, { scale: s }]}>
                <AnatomicalHand sk={p.sk} view={v.v} />
              </Group>
            ))}
          </Canvas>
        </View>
      ))}
    </>
  );
}

export function MikingHandStudio() {
  const route = useRoute();
  const raw = String((route.params as { id?: string } | undefined)?.id ?? 'I03a');
  const [id, cu, cv, cw, only, cvTop] = raw.split('~');
  const { width } = useWindowDimensions();
  if (id === 'POSES')
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#0d0f13' }} contentContainerStyle={{ padding: 12, gap: 12 }}>
        <PoseSheet W={cu ? Math.min((width - 40) / 2, 700) : Math.min((width - 40) / 4, 400)} which={cu ? Number(cu) : undefined} />
      </ScrollView>
    );
  const lesson = lessonById(id);
  const art = lessonArt(id);
  if (!lesson || !art) return <Text style={{ color: 'white' }}>No lesson {id}</Text>;
  const model = lesson.model;
  const W = Math.min((width - 70) / 2, 760);
  const Instrument = art.Instrument;
  const panels: { variant: string; view: ViewId }[] = [];
  for (const v of model.variants) {
    const views = viewsOf(model, v.id);
    for (const view of Object.keys(views) as ViewId[]) if (!only || only === view || only === '*') panels.push({ variant: v.id, view });
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0d0f13' }}
      contentContainerStyle={{
        padding: 12,
        gap: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}
    >
      {panels.map(({ variant, view }) => {
        const box = viewsOf(model, variant)[view]!;
        const ww = cw ? Number(cw) : box.u1 - box.u0;
        const wh = cw ? ww * 0.62 : box.v1 - box.v0;
        const u0 = cu ? Number(cu) - ww / 2 : box.u0;
        const vc = view === 'top' && cvTop ? cvTop : cv;
        const v0 = vc ? Number(vc) - wh / 2 : box.v0;
        const s = W / ww;
        const H = wh * s;
        return (
          <View key={`${variant}.${view}`}>
            <Text style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>
              {id} · {variant} · {view} · {s.toFixed(2)} px/mm
            </Text>
            <Canvas style={{ width: W, height: H }}>
              <Rect x={0} y={0} width={W} height={H} color="#14171d" />
              <Group transform={[{ translateX: -u0 * s }, { translateY: -v0 * s }, { scale: s }]}>
                <Instrument view={view} variant={variant} />
              </Group>
            </Canvas>
          </View>
        );
      })}
    </ScrollView>
  );
}
