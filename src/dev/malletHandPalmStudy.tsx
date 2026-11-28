/**
 * MALLET HAND, FROM THE PALM SIDE — STUDY (DEV + WEB ONLY; owner 2026-11-24, "one hand at a time": the timpanist's far
 * hand). `#labpreview/FigureStudy/mallethandpalm` shows ONLY the authored right hand on its mallet seen from the palm
 * side (malletHandPalm.tsx), in its neutral position (forearm level from the right, the shaft 15° down to the left,
 * about 200 mm of it, a timpani felt head at its end): about 2.9 pt/mm for each of the five cast skin tones; then
 * 1 pt/mm; then 0.45 and 0.15 pt/mm; then the mirrored (left) hand at 1 pt/mm. No lesson uses it yet.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { MalletHandPalm } from '../screens/lab/miking/lessons/shared/figureV2/malletHandPalm';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the hand's own frame: the fulcrum at 0; the head to the left). */
const CROP = { x0: -230, x1: 150, y0: -42, y1: 80 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;
/** The close-up crop: the fist only. */
const ZOOM = { x0: -30, x1: 115, y0: -42, y1: 72 };
const ZW = ZOOM.x1 - ZOOM.x0;
const ZH = ZOOM.y1 - ZOOM.y0;

function One({ id, s }: { id: CastId; s: number }) {
  const w = CW * s;
  const h = CH * s;
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <MalletHandPalm who={CAST[id]} x={-CROP.x0 * s} y={-CROP.y0 * s} s={s} />
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{CAST[id].name}</Text>
    </View>
  );
}

/** The tones side by side at `s` pt/mm: as many to a canvas as the page's width holds. */
function Row({ s, gap, width, mirror = false }: { s: number; gap: number; width: number; mirror?: boolean }) {
  const w = CW * s;
  const h = CH * s;
  const per = Math.max(1, Math.min(IDS.length, Math.floor((width - 24 + gap) / (w + gap))));
  const rows: CastId[][] = [];
  for (let i = 0; i < IDS.length; i += per) rows.push(IDS.slice(i, i + per));
  // (mirrored: the hand's frame flipped, so the fulcrum sits at the crop's mirrored place)
  const fx = mirror ? CROP.x1 * s : -CROP.x0 * s;
  return (
    <View>
      {rows.map((ids, r) => (
        <Canvas key={`row${r}`} style={{ width: ids.length * w + (ids.length - 1) * gap, height: h, marginBottom: gap }}>
          {ids.map((id, i) => (
            <Rect key={`r${id}`} x={i * (w + gap)} y={0} width={w} height={h} color={STAGE} />
          ))}
          {ids.map((id, i) => (
            <Group key={id} clip={Skia.XYWHRect(i * (w + gap), 0, w, h)}>
              <MalletHandPalm who={CAST[id]} x={i * (w + gap) + fx} y={-CROP.y0 * s} s={s} mirror={mirror} />
            </Group>
          ))}
        </Canvas>
      ))}
    </View>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function MalletHandPalmStudy() {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  const close = Math.min(8, (width - 24) / ZW);
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
      <View style={{ height: 14 }} />
      <Label t={`mirrored (the left hand), ${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror />
      <View style={{ height: 14 }} />
      <Label t={`close-up, ${close.toFixed(2)} pt/mm`} />
      <Canvas style={{ width: ZW * close, height: ZH * close }}>
        <Rect x={0} y={0} width={ZW * close} height={ZH * close} color={STAGE} />
        <MalletHandPalm who={CAST.drummer} x={-ZOOM.x0 * close} y={-ZOOM.y0 * close} s={close} />
      </Canvas>
    </ScrollView>
  );
}
