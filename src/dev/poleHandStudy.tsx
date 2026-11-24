/**
 * POLE HAND STUDY — DEV + WEB ONLY (owner 2026-11-24: "one hand at a time").
 * `#labpreview/FigureStudy/polehand` shows ONLY the authored right hand
 * gripping a horizontal pole, seen from the palm side (poleHandFront.tsx):
 * about 3 pt/mm for each of the five cast skin tones; then 1 pt/mm; then a
 * lesson's size (≈ 0.15 pt/mm) and 3× that (0.45 pt/mm). No lesson uses it yet.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { CAST, castFor, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PoleHandFront } from '../screens/lab/miking/lessons/shared/figureV2/poleHandFront';
import { BoomOperatorV2, boomPlans } from '../screens/lab/miking/lessons/shared/figureV2/BoomV2';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { RIG_B04 } from './frontBoomStudy';

const OPERATOR = castFor('operator.boom');

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the hand's own frame: the pole's axis at 0). */
const CROP = { x0: -85, x1: 85, y0: -50, y1: 118 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;

function One({ id, s }: { id: CastId; s: number }) {
  const w = CW * s;
  const h = CH * s;
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <PoleHandFront who={CAST[id]} x={-CROP.x0 * s} y={-CROP.y0 * s} s={s} pole={[CROP.x0 - 10, CROP.x1 + 10]} />
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{CAST[id].name}</Text>
    </View>
  );
}

/** The boom operator from the front (as /boomz-b04-front draws it), both hands the approved pole hand: a window on
 *  the hands at `near` pt/mm, then the whole operator at `whole` pt/mm — one canvas. */
function Operator({ width, near, whole }: { width: number; near: number; whole: number }) {
  const B = boomPlans(RIG_B04, OPERATOR, 'front');
  const fs = B.arms.map((a) => B.vs.proj(a.hand.arm.fist));
  const c = { u: fs.reduce((t, p) => t + p.u, 0) / fs.length, v: fs.reduce((t, p) => t + p.v, 0) / fs.length + 120 };
  const W1 = Math.min(width - 24, 760);
  const H1 = 520 * near;
  const mm2 = { u: 0, v: 300, w: 1300, h: 2015 };
  const W2 = mm2.w * whole;
  const H2 = mm2.h * whole;
  const op = <BoomOperatorV2 view="front" rig={RIG_B04} who={OPERATOR} dim={1} />;
  return (
    <Canvas style={{ width: W1, height: H1 + 10 + H2 }}>
      <Rect x={0} y={0} width={W1} height={H1} color={STAGE} />
      <Group clip={{ x: 0, y: 0, width: W1, height: H1 }}>
        <Group transform={[{ translateX: W1 / 2 - c.u * near }, { translateY: H1 / 2 - c.v * near }, { scale: near }]}>
          <FigureScale ptPerMm={near}>{op}</FigureScale>
        </Group>
      </Group>
      <Rect x={0} y={H1 + 10} width={W2} height={H2} color={STAGE} />
      <Group clip={{ x: 0, y: H1 + 10, width: W2, height: H2 }}>
        <Group transform={[{ translateX: W2 / 2 - mm2.u * whole }, { translateY: H1 + 10 + H2 / 2 - mm2.v * whole }, { scale: whole }]}>
          <FigureScale ptPerMm={whole}>{op}</FigureScale>
        </Group>
      </Group>
    </Canvas>
  );
}

/** The tones side by side at `s` pt/mm: as many to a canvas as the page's width holds (`mirror`: the left hand). */
function Row({ s, gap, width, mirror = false }: { s: number; gap: number; width: number; mirror?: boolean }) {
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
            <PoleHandFront key={id} who={CAST[id]} x={i * (w + gap) + (mirror ? CROP.x1 : -CROP.x0) * s} y={-CROP.y0 * s} s={s} pole={[CROP.x0, CROP.x1]} mirror={mirror} />
          ))}
        </Canvas>
      ))}
    </View>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function PoleHandStudy() {
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
      <View style={{ height: 18 }} />
      <Label t={`The LEFT hand (the mirror image, re-lit: the light stays upper left) · ${one.toFixed(2)} pt/mm`} />
      <Row s={one} gap={8} width={width} mirror />
      <View style={{ height: 14 }} />
      <Label t="The boom operator from the front, both hands (B04 close, overhead hold) · 1 pt/mm, then 0.3 pt/mm" />
      <Operator width={width} near={1} whole={0.3} />
    </ScrollView>
  );
}
