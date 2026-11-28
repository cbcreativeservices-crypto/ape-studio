/**
 * POLE HAND FROM ABOVE, SUPPORTING THE POLE FROM BELOW — STUDY (DEV + WEB ONLY; 2026-11-25).
 * `#labpreview/FigureStudy/polehandtopunder` shows ONLY the authored right hand cradling a 30 mm pole from below (the
 * underhand overhead hold), seen from directly above (poleHandTopUnder.tsx — B10 post-event overhead's left hand from
 * above, mirrored): about 3 pt/mm for each of the five cast skin tones; then 1, 0.45 and 0.15 pt/mm; then the LEFT hand
 * (the mirror image, re-lit — the one the boom operator's view from above uses): all five tones at 3 pt/mm and rows at 1
 * and 0.45 pt/mm; then the left hand in 'boom' pole look at 1 pt/mm over a scene pole painted as BoomV2 paints it, and
 * one such tile at 3 pt/mm; then the fist close (6 pt/mm), right and left, for checking the joins.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { POLE_TOP_UNDER_AXIS, PoleHandTopUnder } from '../screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the drawing's own frame: the pole's axis at the middle of the fist at 0). */
const CROP = { x0: -64, x1: 128, y0: -86, y1: 70 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;
/** The hand's origin across its window (mirrored: the art runs the other way). */
const ox = (s: number, mirror: boolean) => (mirror ? CROP.x1 * s : -CROP.x0 * s);

/** The scene's pole under a placed hand, as BoomV2's PoleSeg paints it (dark rim, tube, lit band), on the drawing's own
 *  axis through (x, y), mirrored with the hand: B10's boom runs on well past the lower hand both ways. */
function ScenePole({ x, y, s, mirror }: { x: number; y: number; s: number; mirror: boolean }) {
  const ax = { u: POLE_TOP_UNDER_AXIS.u * (mirror ? -1 : 1), v: POLE_TOP_UNDER_AXIS.v };
  const k = 400;
  const p = Skia.Path.Make();
  p.moveTo(x - ax.u * k * s, y - ax.v * k * s);
  p.lineTo(x + ax.u * k * s, y + ax.v * k * s);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={31 * s} strokeCap="round" color="#0b0c0f" />
      <Path path={p} style="stroke" strokeWidth={27 * s} strokeCap="round" color="#3a3d45" />
      <Group transform={[{ translateX: -1.5 * s }, { translateY: -2 * s }]}>
        <Path path={p} style="stroke" strokeWidth={6 * s} strokeCap="round" color="#d4d8e0" opacity={0.45} />
      </Group>
    </Group>
  );
}

const boomProps = { poleLook: 'boom' as const, sleeve: false, pole: [-400, 400] as [number, number] };

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
              <PoleHandTopUnder who={CAST[id]} x={x} y={y} s={s} mirror={mirror} {...(boom ? boomProps : {})} />
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
              <PoleHandTopUnder who={CAST[id]} x={x0 + ox(s, mirror)} y={y0 - CROP.y0 * s} s={s} mirror={mirror} {...(boom ? boomProps : {})} />
            </Group>
          );
        })}
      </Canvas>
    </View>
  );
}

/** (check) the fist alone, close: the right hand and the left, one canvas. */
const CLOSE = { x0: -48, x1: 66, y0: -60, y1: 46 };
function Close({ s }: { s: number }) {
  const w = (CLOSE.x1 - CLOSE.x0) * s;
  const h = (CLOSE.y1 - CLOSE.y0) * s;
  const gap = 10;
  return (
    <Canvas style={{ width: w, height: 2 * h + gap }}>
      {[false, true].map((m, i) => (
        <Group key={String(m)} clip={Skia.XYWHRect(0, i * (h + gap), w, h)}>
          <Rect x={0} y={i * (h + gap)} width={w} height={h} color={STAGE} />
          <PoleHandTopUnder who={CAST.drummer} x={m ? CLOSE.x1 * s : -CLOSE.x0 * s} y={i * (h + gap) - CLOSE.y0 * s} s={s} mirror={m} />
        </Group>
      ))}
    </Canvas>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function PoleHandTopUnderStudy() {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  const close = Math.min(6, (width - 24) / (CLOSE.x1 - CLOSE.x0));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Label t={`THE RIGHT HAND (as authored), ${big.toFixed(2)} pt/mm`} />
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
      <Label t={`THE LEFT HAND (mirrored, re-lit — B10 overhead's, from above), ${big.toFixed(2)} pt/mm`} />
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
      <View style={{ height: 18 }} />
      <Label t={`(check) the fist close, right then left, ${close.toFixed(2)} pt/mm`} />
      <Close s={close} />
    </ScrollView>
  );
}
