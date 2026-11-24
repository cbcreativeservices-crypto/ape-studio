/**
 * MALLET HAND, FROM THE BACK — STUDY (DEV + WEB ONLY; owner 2026-11-24, "one hand at a time": the mallet hand).
 * `#labpreview/FigureStudy/mallethand` shows ONLY the authored right hand holding a timpani / bass drum mallet seen
 * from the back of the hand (malletHandBack.tsx), in its neutral position (forearm level from the left, the shaft
 * 15° down to the right, about 200 mm of it, a timpani felt head at its end): about 3 pt/mm for each of the five
 * cast skin tones; then 1 pt/mm; then 0.45 and 0.15 pt/mm. No lesson uses it yet.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { MalletHandBack } from '../screens/lab/miking/lessons/shared/figureV2/malletHandBack';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the hand's own frame: the fulcrum at 0). */
const CROP = { x0: -150, x1: 230, y0: -42, y1: 80 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;

function One({ id, s }: { id: CastId; s: number }) {
  const w = CW * s;
  const h = CH * s;
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <MalletHandBack who={CAST[id]} x={-CROP.x0 * s} y={-CROP.y0 * s} s={s} />
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{CAST[id].name}</Text>
    </View>
  );
}

/** The tones side by side at `s` pt/mm: as many to a canvas as the page's width holds. */
function Row({ s, gap, width }: { s: number; gap: number; width: number }) {
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
            // (each in its own cell: the sleeve runs on past the crop)
            <Group key={id} clip={Skia.XYWHRect(i * (w + gap), 0, w, h)}>
              <MalletHandBack who={CAST[id]} x={i * (w + gap) - CROP.x0 * s} y={-CROP.y0 * s} s={s} />
            </Group>
          ))}
        </Canvas>
      ))}
    </View>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function MalletHandStudy() {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Label t={`${big.toFixed(2)} pt/mm`} />
      {IDS.map((id) => (
        <One key={id} id={id} s={big} />
      ))}
      <View style={{ height: 8 }} />
      <Label t={`${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} />
      <View style={{ height: 14 }} />
      <Label t="0.45 pt/mm" />
      <Row s={0.45} gap={8} width={width} />
      <View style={{ height: 14 }} />
      <Label t="0.15 pt/mm" />
      <Row s={0.15} gap={8} width={width} />
    </ScrollView>
  );
}
