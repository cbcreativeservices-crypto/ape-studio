/**
 * POLE HAND, END-ON FROM THE LITTLE-FINGER END, TOWARD THE BACK OF THE HAND — STUDY (DEV + WEB ONLY; owner 2026-11-24).
 * `#labpreview/FigureStudy/polehandendlittleback` shows ONLY the authored right hand gripping a 30 mm pole, seen along
 * the pole from the little-finger end with the camera tilted toward the back of the hand (poleHandEndLittleBack.tsx —
 * the fourth end-on view, the same 25° pole tilt): about 3 pt/mm for each of the five cast skin tones; then 1, 0.45 and
 * 0.15 pt/mm; then the LEFT hand (the mirror image, re-lit — the one the boom operator's side view uses): all five
 * tones at 3 pt/mm and a row at 1 pt/mm; then the left hand in 'boom' pole look at 1 pt/mm, each over a scene pole
 * painted as BoomV2 paints it (the drawing's near piece must run on as the same pole), and one such tile at 3 pt/mm.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { POLE_END_LITTLE_BACK_AXIS, POLE_END_LITTLE_BACK_FORESHORTEN, PoleHandEndLittleBack } from '../screens/lab/miking/lessons/shared/figureV2/poleHandEndLittleBack';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the drawing's own frame: the pole's axis at the fist's little-finger side at 0). */
const CROP = { x0: -168, x1: 96, y0: -82, y1: 70 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;
/** The hand's origin across its window (mirrored: the art runs the other way). */
const ox = (s: number, mirror: boolean) => (mirror ? CROP.x1 * s : -CROP.x0 * s);

/** The scene's pole under a placed hand, as BoomV2's PoleSeg paints it (dark rim, tube, lit band), on the drawing's
 *  own axis through (x, y), mirrored with the hand. */
function ScenePole({ x, y, s, mirror }: { x: number; y: number; s: number; mirror: boolean }) {
  const ax = { u: POLE_END_LITTLE_BACK_AXIS.u * (mirror ? -1 : 1), v: POLE_END_LITTLE_BACK_AXIS.v };
  const k = POLE_END_LITTLE_BACK_FORESHORTEN * 900;
  const p = Skia.Path.Make();
  p.moveTo(x - ax.u * k * s, y - ax.v * k * s);
  p.lineTo(x + ax.u * k * s, y + ax.v * k * s);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={31 * s} color="#0b0c0f" />
      <Path path={p} style="stroke" strokeWidth={27 * s} color="#3a3d45" />
      <Group transform={[{ translateX: -1.5 * s }, { translateY: -2 * s }]}>
        <Path path={p} style="stroke" strokeWidth={6 * s} color="#d4d8e0" opacity={0.45} />
      </Group>
    </Group>
  );
}

/** Big tiles stacked in ONE canvas (a browser holds only so many live canvases), the names listed under it. */
function Stack({ ids, s, mirror, boom }: { ids: CastId[]; s: number; mirror: boolean; boom?: boolean }) {
  const w = CW * s;
  const h = CH * s;
  const gap = 10;
  const x = ox(s, mirror);
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: ids.length * (h + gap) - gap }}>
        {ids.map((id, i) => {
          const y = i * (h + gap) - CROP.y0 * s;
          return (
            <Group key={id} clip={Skia.XYWHRect(0, i * (h + gap), w, h)}>
              <Rect x={0} y={i * (h + gap)} width={w} height={h} color={STAGE} />
              {boom ? <ScenePole x={x} y={y} s={s} mirror={mirror} /> : null}
              <PoleHandEndLittleBack who={CAST[id]} x={x} y={y} s={s} mirror={mirror} {...(boom ? { poleLook: 'boom' as const, sleeve: false, pole: [-70, 240] as [number, number] } : {})} />
            </Group>
          );
        })}
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{`top to bottom: ${ids.map((id) => CAST[id].name).join(', ')}`}</Text>
    </View>
  );
}

/** The tones side by side at `s` pt/mm: as many to a canvas as the page's width holds. */
function Row({ s, gap, width, mirror, boom = false }: { s: number; gap: number; width: number; mirror: boolean; boom?: boolean }) {
  const w = CW * s;
  const h = CH * s;
  const per = Math.max(1, Math.min(IDS.length, Math.floor((width - 24 + gap) / (w + gap))));
  const lines = Math.ceil(IDS.length / per);
  // (one canvas for the whole row, wrapped: a browser holds only so many live canvases)
  return (
    <View style={{ marginBottom: gap }}>
      <Canvas style={{ width: per * w + (per - 1) * gap, height: lines * (h + gap) - gap }}>
        {IDS.map((id, k) => {
          const x0 = (k % per) * (w + gap);
          const y0 = Math.floor(k / per) * (h + gap);
          return (
            <Group key={id} clip={Skia.XYWHRect(x0, y0, w, h)}>
              <Rect x={x0} y={y0} width={w} height={h} color={STAGE} />
              {boom ? <ScenePole x={x0 + ox(s, mirror)} y={y0 - CROP.y0 * s} s={s} mirror={mirror} /> : null}
              <PoleHandEndLittleBack who={CAST[id]} x={x0 + ox(s, mirror)} y={y0 - CROP.y0 * s} s={s} mirror={mirror} {...(boom ? { poleLook: 'boom' as const, sleeve: false, pole: [-70, 240] as [number, number] } : {})} />
            </Group>
          );
        })}
      </Canvas>
    </View>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function PoleHandEndLittleBackStudy() {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Label t={`THE RIGHT HAND, ${big.toFixed(2)} pt/mm`} />
      <Stack ids={IDS} s={big} mirror={false} />
      <View style={{ height: 8 }} />
      <Label t={`${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror={false} />
      <View style={{ height: 14 }} />
      <Label t="0.45 pt/mm" />
      <Row s={0.45} gap={8} width={width} mirror={false} />
      <View style={{ height: 14 }} />
      <Label t="0.15 pt/mm" />
      <Row s={0.15} gap={8} width={width} mirror={false} />
      <View style={{ height: 18 }} />
      <Label t={`THE LEFT HAND (mirrored, re-lit), ${big.toFixed(2)} pt/mm`} />
      <Stack ids={IDS} s={big} mirror />
      <View style={{ height: 8 }} />
      <Label t={`THE LEFT HAND, ${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror />
      <View style={{ height: 14 }} />
      <Label t="THE LEFT HAND, 0.45 pt/mm" />
      <Row s={0.45} gap={8} width={width} mirror />
      <View style={{ height: 18 }} />
      <Label t={`THE LEFT HAND in 'boom' pole look over the scene's pole (no sleeve of its own), ${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror boom />
      <View style={{ height: 8 }} />
      <Label t={`(check) the same, ${big.toFixed(2)} pt/mm`} />
      <Stack ids={['drummer']} s={big} mirror boom />
    </ScrollView>
  );
}
