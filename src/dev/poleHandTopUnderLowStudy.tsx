/**
 * POLE HAND FROM ABOVE, SUPPORTING THE POLE FROM BELOW, THE MIC DRAGGED LOW — STUDY (DEV + WEB ONLY; 2026-11-25).
 * `#labpreview/FigureStudy/polehandtopunderlow` shows ONLY the authored right hand cradling a 30 mm pole from below seen
 * from directly above in the low pose (poleHandTopUnderLow.tsx — B10's left hand from above with the mic dragged below
 * the mouth, mirrored): about 3 pt/mm for each of the five cast skin tones; then 1, 0.55 (about the lesson's own size),
 * 0.45 and 0.15 pt/mm; then the LEFT hand (the mirror image, re-lit — the one the lesson would use): all five tones at
 * 3 pt/mm and rows at 1 and 0.55 pt/mm; the left hand in 'boom' pole look over a scene pole painted as BoomV2 paints it;
 * then SIDE BY SIDE with the approved poleHandTopUnder (the same hand and hold, the mic high) at one size, to judge the
 * family likeness; then the fist close (6 pt/mm), right and left. Few canvases (a browser holds only so many live ones):
 * the tiles of a section share one.
 */
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { POLE_TOP_UNDER_LOW_AXIS, PoleHandTopUnderLow } from '../screens/lab/miking/lessons/shared/figureV2/poleHandTopUnderLow';
import { PoleHandTopUnder } from '../screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder';

const BG = '#0d0f13';
const STAGE = '#14171d';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
/** The crop round the hand (mm, the drawing's own frame: the pole's axis at the middle of the fist at 0). */
const CROP = { x0: -66, x1: 66, y0: -84, y1: 142 };
const CW = CROP.x1 - CROP.x0;
const CH = CROP.y1 - CROP.y0;
/** The approved poleHandTopUnder's own crop (its study page's). */
const OLD = { x0: -64, x1: 128, y0: -86, y1: 70 };
/** The hand's origin across its window (mirrored: the art runs the other way). */
const ox = (s: number, mirror: boolean, c: { x0: number; x1: number } = CROP) => (mirror ? c.x1 * s : -c.x0 * s);

/** The scene's pole under a placed hand, as BoomV2's PoleSeg paints it (dark rim, tube, lit band), on the drawing's own
 *  axis through (x, y), mirrored with the hand: B10's boom runs on well past the front hand both ways. */
function ScenePole({ x, y, s, mirror }: { x: number; y: number; s: number; mirror: boolean }) {
  const ax = { u: POLE_TOP_UNDER_LOW_AXIS.u * (mirror ? -1 : 1), v: POLE_TOP_UNDER_LOW_AXIS.v };
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

/** Big tiles stacked in ONE canvas, the names listed under it. */
function Stack({ ids, s, mirror }: { ids: CastId[]; s: number; mirror: boolean }) {
  const w = CW * s;
  const h = CH * s;
  const gap = 10;
  const x = ox(s, mirror);
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: w, height: ids.length * (h + gap) - gap }}>
        {ids.map((id, i) => (
          <Group key={id} clip={Skia.XYWHRect(0, i * (h + gap), w, h)}>
            <Rect x={0} y={i * (h + gap)} width={w} height={h} color={STAGE} />
            <PoleHandTopUnderLow who={CAST[id]} x={x} y={i * (h + gap) - CROP.y0 * s} s={s} mirror={mirror} />
          </Group>
        ))}
      </Canvas>
      <Text style={{ color: DIM, fontSize: 11 }}>{`top to bottom: ${ids.map((id) => CAST[id].name).join(', ')}`}</Text>
    </View>
  );
}

/** The tones side by side at each of `ss` pt/mm, one band per size, all in ONE canvas. */
function Rows({ ss, width, mirror, boom = false }: { ss: number[]; width: number; mirror: boolean; boom?: boolean }) {
  const gap = 8;
  const bands = ss.map((s) => {
    const w = CW * s;
    const h = CH * s;
    const per = Math.max(1, Math.min(IDS.length, Math.floor((width - 24 + gap) / (w + gap))));
    const lines = Math.ceil(IDS.length / per);
    return { s, w, h, per, H: lines * (h + gap) - gap, W: per * w + (per - 1) * gap };
  });
  const tops: number[] = [];
  let y = 0;
  for (const b of bands) {
    tops.push(y);
    y += b.H + 14;
  }
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: Math.max(...bands.map((b) => b.W)), height: y - 14 }}>
        {bands.map((b, j) =>
          IDS.map((id, k) => {
            const x0 = (k % b.per) * (b.w + gap);
            const y0 = tops[j] + Math.floor(k / b.per) * (b.h + gap);
            return (
              <Group key={`${j}-${id}`} clip={Skia.XYWHRect(x0, y0, b.w, b.h)}>
                <Rect x={x0} y={y0} width={b.w} height={b.h} color={STAGE} />
                {boom ? <ScenePole x={x0 + ox(b.s, mirror)} y={y0 - CROP.y0 * b.s} s={b.s} mirror={mirror} /> : null}
                <PoleHandTopUnderLow who={CAST[id]} x={x0 + ox(b.s, mirror)} y={y0 - CROP.y0 * b.s} s={b.s} mirror={mirror} {...(boom ? boomProps : {})} />
              </Group>
            );
          }),
        )}
      </Canvas>
    </View>
  );
}

/** (family likeness) the approved poleHandTopUnder beside this one, the same tone and size: right hands, then left. */
function Family({ s }: { s: number }) {
  const wA = (OLD.x1 - OLD.x0) * s;
  const hA = (OLD.y1 - OLD.y0) * s;
  const wB = CW * s;
  const hB = CH * s;
  const gap = 10;
  const h = Math.max(hA, hB);
  return (
    <Canvas style={{ width: wA + gap + wB, height: 2 * h + gap }}>
      {[false, true].map((m, i) => {
        const y0 = i * (h + gap);
        return (
          <Group key={String(m)}>
            <Group clip={Skia.XYWHRect(0, y0, wA, hA)}>
              <Rect x={0} y={y0} width={wA} height={hA} color={STAGE} />
              <PoleHandTopUnder who={CAST.drummer} x={ox(s, m, OLD)} y={y0 - OLD.y0 * s} s={s} mirror={m} />
            </Group>
            <Group clip={Skia.XYWHRect(wA + gap, y0, wB, hB)}>
              <Rect x={wA + gap} y={y0} width={wB} height={hB} color={STAGE} />
              <PoleHandTopUnderLow who={CAST.drummer} x={wA + gap + ox(s, m)} y={y0 - CROP.y0 * s} s={s} mirror={m} />
            </Group>
          </Group>
        );
      })}
    </Canvas>
  );
}

/** (check) the fist alone, close: the right hand and the left, one canvas. */
const CLOSE = { x0: -48, x1: 56, y0: -56, y1: 62 };
function Close({ s }: { s: number }) {
  const w = (CLOSE.x1 - CLOSE.x0) * s;
  const h = (CLOSE.y1 - CLOSE.y0) * s;
  const gap = 10;
  return (
    <Canvas style={{ width: w, height: 2 * h + gap }}>
      {[false, true].map((m, i) => (
        <Group key={String(m)} clip={Skia.XYWHRect(0, i * (h + gap), w, h)}>
          <Rect x={0} y={i * (h + gap)} width={w} height={h} color={STAGE} />
          <PoleHandTopUnderLow who={CAST.drummer} x={m ? CLOSE.x1 * s : -CLOSE.x0 * s} y={i * (h + gap) - CLOSE.y0 * s} s={s} mirror={m} />
        </Group>
      ))}
    </Canvas>
  );
}

const Label = ({ t }: { t: string }) => <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{t}</Text>;

export function PoleHandTopUnderLowStudy() {
  const { width } = useWindowDimensions();
  const big = Math.min(3, (width - 24) / CW);
  const one = Math.min(1, (width - 24) / CW);
  const fam = Math.min(1.6, (width - 34) / (OLD.x1 - OLD.x0 + CW));
  const close = Math.min(6, (width - 24) / (CLOSE.x1 - CLOSE.x0));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Label t={`THE RIGHT HAND (as authored) — underhand from above, the mic dragged below the mouth — ${big.toFixed(2)} pt/mm`} />
      <Stack ids={IDS} s={big} mirror={false} />
      <View style={{ height: 8 }} />
      <Label t={`top to bottom: ${one.toFixed(2)} pt/mm, 0.55 pt/mm (about the lesson's own size), 0.45 pt/mm, 0.15 pt/mm`} />
      <Rows ss={[one, 0.55, 0.45, 0.15]} width={width} mirror={false} />
      <View style={{ height: 18 }} />
      <Label t={`THE LEFT HAND (mirrored, re-lit — B10's, from above, mic below the mouth), ${big.toFixed(2)} pt/mm`} />
      <Stack ids={IDS} s={big} mirror />
      <View style={{ height: 8 }} />
      <Label t={`THE LEFT HAND, top to bottom: ${one.toFixed(2)} pt/mm, 0.55 pt/mm (the lesson's size)`} />
      <Rows ss={[one, 0.55]} width={width} mirror />
      <View style={{ height: 14 }} />
      <Label t={`THE LEFT HAND in 'boom' pole look over the scene's pole (no sleeve of its own), ${one.toFixed(2)} pt/mm`} />
      <Rows ss={[one]} width={width} mirror boom />
      <View style={{ height: 18 }} />
      <Label t={`FAMILY LIKENESS: the approved poleHandTopUnder (left, the mic high) beside this one (right, the mic low), ${fam.toFixed(2)} pt/mm — right hands, then left hands`} />
      <Family s={fam} />
      <View style={{ height: 18 }} />
      <Label t={`(check) the fist close, right then left, ${close.toFixed(2)} pt/mm`} />
      <Close s={close} />
    </ScrollView>
  );
}
