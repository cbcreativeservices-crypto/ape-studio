/**
 * POLE HAND, FROM ABOVE — STUDY (DEV + WEB ONLY; owner 2026-11-24, hand number three).
 * `#labpreview/FigureStudy/polehandtop` shows ONLY the authored right hand gripping a horizontal pole held overhead,
 * seen from directly above (poleHandTop.tsx): about 3 pt/mm for each of the five cast skin tones; then 1 pt/mm; then
 * 0.45 and 0.15 pt/mm. The page's top is the front (away from the operator).
 * `#labpreview/FigureStudy/polehandtopmirror` (2026-11-24, "Boom top"): the same page for the LEFT hand — the mirror
 * image, re-lit (the light stays at the page's upper left) — as the boom operators' views from above draw it.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PoleHandTop } from '../screens/lab/miking/lessons/shared/figureV2/poleHandTop';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the hand's own frame: the pole's axis at 0, the operator toward +y). */
const CROP = { x0: -85, x1: 85, y0: -50, y1: 115 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;
/** The hand's origin across its window (mirrored: the art runs the other way). */
const ox = (s: number, mirror: boolean) => (mirror ? CROP.x1 * s : -CROP.x0 * s);

function One({ id, s, mirror }: { id: CastId; s: number; mirror: boolean }) {
  const w = CW * s;
  const h = CH * s;
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <PoleHandTop who={CAST[id]} x={ox(s, mirror)} y={-CROP.y0 * s} s={s} pole={[CROP.x0 - 10, CROP.x1 + 10]} mirror={mirror} />
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{CAST[id].name}</Text>
    </View>
  );
}

/** The tones side by side at `s` pt/mm: as many to a canvas as the page's width holds. */
function Row({ s, gap, width, mirror }: { s: number; gap: number; width: number; mirror: boolean }) {
  const w = CW * s;
  const h = CH * s;
  const per = Math.max(1, Math.min(IDS.length, Math.floor((width - 24 + gap) / (w + gap))));
  const rows: CastId[][] = [];
  for (let i = 0; i < IDS.length; i += per) rows.push(IDS.slice(i, i + per));
  return (
    <View>
      {rows.map((ids, r) => (
        <Canvas key={`row${r}`} style={{ width: ids.length * w + (ids.length - 1) * gap, height: h, marginBottom: gap }}>
          {ids.map((id, i) => (
            <Rect key={`r${id}`} x={i * (w + gap)} y={0} width={w} height={h} color={STAGE} />
          ))}
          {ids.map((id, i) => (
            <PoleHandTop key={id} who={CAST[id]} x={i * (w + gap) + ox(s, mirror)} y={-CROP.y0 * s} s={s} pole={[CROP.x0, CROP.x1]} mirror={mirror} />
          ))}
        </Canvas>
      ))}
    </View>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function PoleHandTopStudy({ mirror = false }: { mirror?: boolean }) {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      {mirror ? <Label t="THE LEFT HAND: the approved hand from above, mirrored and re-lit" /> : null}
      <Label t={`${big.toFixed(2)} pt/mm`} />
      {IDS.map((id) => (
        <One key={id} id={id} s={big} mirror={mirror} />
      ))}
      <View style={{ height: 8 }} />
      <Label t={`${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror={mirror} />
      <View style={{ height: 14 }} />
      <Label t="0.45 pt/mm" />
      <Row s={0.45} gap={8} width={width} mirror={mirror} />
      <View style={{ height: 14 }} />
      <Label t="0.15 pt/mm" />
      <Row s={0.15} gap={8} width={width} mirror={mirror} />
    </ScrollView>
  );
}
