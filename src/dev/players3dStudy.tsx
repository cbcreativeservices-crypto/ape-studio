/**
 * DEV STUDY — THE PLAYERS, SET 3d (figure V2, wave 3 of D78, 2026-11-24): the
 * tonbak player on a chair (M12) and the tabla player cross-legged on the
 * floor, barefoot (M13) — each lesson's own picture with the switch off and
 * on, at about the phone's size and enlarged. One lesson per page (a page with
 * many canvases runs out of GPU contexts): `#labpreview/FigureStudy/players3d-m12`,
 * `/players3d-m13`.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { TonbakArt } from '../screens/lab/miking/lessons/m12Tonbak/art';
import { TablaArt } from '../screens/lab/miking/lessons/m13Tabla/art';

const STAGE = '#0b0c10';
const INK = '#e8e6e1';
const DIM = '#9a978f';

type Box = [number, number, number, number];
type Shot = { title: string; view: 'side' | 'top'; v2: boolean; box: Box };

/** One lesson in ONE canvas, two pictures per row. */
function Lesson({ width, title, note, draw, shots }: { width: number; title: string; note: string; draw: (view: 'side' | 'top', v2: boolean) => ReactNode; shots: Shot[] }) {
  const gap = 8;
  const lab = 16;
  const w = Math.floor(Math.min(300, (width - 24 - gap) / 2));
  type Item = Shot & { x: number; y: number; h: number };
  const items: Item[] = [];
  let y = 0;
  for (let i = 0; i < shots.length; i += 2) {
    const row = shots.slice(i, i + 2);
    const h = Math.max(...row.map((s) => (s.box[3] * w) / s.box[2]));
    row.forEach((s, j) => items.push({ ...s, x: j * (w + gap), y, h }));
    y += h + lab + gap;
  }
  const W = 2 * w + gap;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 2, marginBottom: 6 }}>{note}</Text>
      <View>
        <Canvas style={{ width: W, height: y }}>
          {items.map((q, i) => {
            const k = w / q.box[2];
            return (
              <Group key={i} clip={Skia.XYWHRect(q.x, q.y, w, q.h)}>
                <Rect x={q.x} y={q.y} width={w} height={q.h} color={STAGE} />
                <Group transform={[{ translateX: q.x + w / 2 - q.box[0] * k }, { translateY: q.y + q.h / 2 - q.box[1] * k }, { scale: k }]}>
                  <FigureScale ptPerMm={k}>{draw(q.view, q.v2)}</FigureScale>
                </Group>
              </Group>
            );
          })}
        </Canvas>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: y }} pointerEvents="none">
          {items.map((q, i) => (
            <Text key={i} style={{ position: 'absolute', left: q.x, top: q.y + q.h + 1, color: DIM, fontSize: 11, width: w }}>
              {q.title} · {(w / q.box[2]).toFixed(2)} pt/mm
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export function Players3dStudy({ width, only }: { width: number; only: string }) {
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>The players, set 3d — current beside new</Text>
      {only === 'players3d-m12' ? (
        <Lesson
          width={width}
          title="M12 Tonbak — the player on a chair"
          note="The goblet drum across the lap, the head facing the player’s right; the right hand’s fingers on the head, the left hand over the top of the drum at the head’s upper edge, the drum under the left forearm."
          draw={(view, v2) => <TonbakArt view={view} variant="std" v2={v2} />}
          shots={[
            { title: 'SIDE · CURRENT', view: 'side', v2: false, box: [-250, -600, 1400, 1500] },
            { title: 'SIDE · NEW', view: 'side', v2: true, box: [-250, -600, 1400, 1500] },
            { title: 'ABOVE · CURRENT', view: 'top', v2: false, box: [-250, 0, 1400, 1300] },
            { title: 'ABOVE · NEW', view: 'top', v2: true, box: [-250, 0, 1400, 1300] },
            { title: 'SIDE · NEW, ENLARGED', view: 'side', v2: true, box: [-200, -780, 560, 600] },
            { title: 'ABOVE · NEW, ENLARGED', view: 'top', v2: true, box: [-250, 0, 640, 600] },
            { title: 'SIDE · THE HANDS, ABOUT 6×', view: 'side', v2: true, box: [-120, -740, 300, 300] },
            { title: 'ABOVE · THE HANDS, ABOUT 6×', view: 'top', v2: true, box: [-150, 60, 300, 300] },
            { title: 'SIDE · THE ARMS (FAR ARM, NEAR ELBOW), ABOUT 3×', view: 'side', v2: true, box: [-200, -820, 320, 320] },
            { title: 'SIDE · THE NEAR ELBOW, ABOUT 6×', view: 'side', v2: true, box: [-250, -700, 160, 160] },
          ]}
        />
      ) : null}
      {only === 'players3d-m13' ? (
        <Lesson
          width={width}
          title="M13 Tabla — the player cross-legged on the floor, barefoot"
          note="The dayan in front of the right hand, the bayan in front of the left; the right hand on the dayan’s head (fingers to the rim and the patch), the heel of the left hand on the bayan’s head, the fingers on its maidan."
          draw={(view, v2) => <TablaArt view={view} variant="std" v2={v2} />}
          shots={[
            { title: 'SIDE · CURRENT', view: 'side', v2: false, box: [-300, -560, 1300, 1300] },
            { title: 'SIDE · NEW', view: 'side', v2: true, box: [-300, -560, 1300, 1300] },
            { title: 'ABOVE · CURRENT', view: 'top', v2: false, box: [-300, 0, 1300, 1100] },
            { title: 'ABOVE · NEW', view: 'top', v2: true, box: [-300, 0, 1300, 1100] },
            { title: 'SIDE · NEW, ENLARGED', view: 'side', v2: true, box: [-380, -520, 600, 700] },
            { title: 'ABOVE · NEW, ENLARGED', view: 'top', v2: true, box: [-380, 0, 640, 700] },
          ]}
        />
      ) : null}
      {only === 'players3d-m13' ? (
        <Lesson
          width={width}
          title="M13 Tabla — close-ups"
          note="The hands on the heads, the crossed legs and the bare feet."
          draw={(view, v2) => <TablaArt view={view} variant="std" v2={v2} />}
          shots={[
            { title: 'SIDE · THE HANDS, ABOUT 6×', view: 'side', v2: true, box: [-120, -460, 320, 240] },
            { title: 'SIDE · THE LEGS AND FEET, ABOUT 3×', view: 'side', v2: true, box: [-380, -120, 560, 300] },
            { title: 'SIDE · THE LEFT FOOT (ITS SOLE), ABOUT 6×', view: 'side', v2: true, box: [-290, -50, 280, 160] },
            { title: 'SIDE · THE LEFT FOOT’S TOES, ABOUT 12×', view: 'side', v2: true, box: [-210, -40, 120, 90] },
            { title: 'SIDE · THE RIGHT HEEL, ABOUT 8×', view: 'side', v2: true, box: [-470, -60, 200, 150] },
            { title: 'ABOVE · THE CROSSED LEGS, ABOUT 3×', view: 'top', v2: true, box: [-380, 0, 560, 760] },
          ]}
        />
      ) : null}
    </View>
  );
}
