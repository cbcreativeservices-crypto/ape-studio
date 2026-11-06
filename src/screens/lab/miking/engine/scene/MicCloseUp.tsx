/**
 * THE CHOSEN MIC, CLOSE UP (function audit decision 12, 2026-11-05). On a
 * site-sized drawing every mic is a few pixels long, so TYPE could not be
 * seen: Microphones step 1 keeps a small read-only strip under the stage with
 * the chosen mic's own drawing (MikingMicArt, the art the scene draws) at a
 * size the eye can compare. It sits BELOW the scene, so it covers nothing,
 * and it holds no control. Not to scale, and it says so.
 *
 * The dish (decision 11): `spDish` keeps the engine's element, so a dish is
 * drawn here and on the stage (DishMark) with the lessons' own cut-away bowl
 * (shared/sports/DishArt). Its pickup stays unmodelled, so nothing here
 * claims a pattern.
 */
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../theme/tokens';
import { MikingMicArt } from '../../../../../features/lab/micDrawings';
import { DishSection } from '../../lessons/shared/sports/DishArt';
import { DISHES, type Dish } from '../../lessons/shared/sports/parabolic.ts';
import { useStageTextScale } from '../../../rack/stageAspect';
import { aimVec } from '../geometry/vec.ts';
import type { MicPose, MicType, ViewId } from '../model/types.ts';

/** The strip's height on the stage (pt). */
export const CLOSE_UP_H = 58;
/** A mic shown longer than this on the glass already reads as itself (pt). */
export const CLOSE_UP_BELOW_PT = 60;
const BOX_W = 112;
/** The dish's mark across its rim on the glass (pt): at true size a 66 cm rim
 *  on a field is a few points wide, so it is a mark, like the plan pages' one. */
export const DISH_MARK_PT = 30;

/** Behind the vertex the section reaches this far (mm): its grip and cable. */
const DISH_BACK = 150;
/** Ahead of the focus the element's body reaches this far (mm). */
const DISH_ELEMENT = 42;

export const isDishType = (t: Pick<MicType, 'id' | 'art'>): boolean => t.art === 'dish' || t.id === 'spDish';

/** The bowl a dish type is drawn with: the sports preset, or the field dish's
 *  own rim and focus (0.36·D, dishMics.ts) with its depth r²/(4f). */
function dishOf(t: MicType): Dish {
  if (t.id === 'spDish') return DISHES.large;
  const D = t.body.radius.mm * 2;
  const f = D * 0.36;
  return { ...DISHES.large, D, f, depth: (D / 2) ** 2 / (4 * f) };
}

/** A mic's length and depth as the close-up frames it (mm). */
export function closeUpBody(t: MicType): { art: MicType['art']; r: number; len: number; cross: number; fore: number; tail: number } {
  const r = t.body.radius.mm;
  if (isDishType(t)) {
    const d = dishOf(t);
    return { art: 'dish', r: d.D / 2, len: DISH_BACK, cross: d.D, fore: Math.max(d.depth, d.f + DISH_ELEMENT), tail: 0 };
  }
  // A lavalier's clip stands 1.45 r off its axis and its cable runs 10 r behind
  // the body (micDrawingsField): framed on the body alone they leave the box.
  if (t.art === 'lavalier') return { art: t.art, r, len: t.body.length.mm, cross: r * 2.9, fore: 0, tail: r * 10 };
  const side = t.mount === 'surface' || t.address === 'side';
  return { art: t.art, r, len: t.body.length.mm, cross: side ? (t.body.width?.mm ?? r * 2) : r * 2, fore: t.body.fore?.mm ?? 0, tail: 0 };
}

/**
 * The spatial rigs' capsules sit round their `len` and the body runs on down
 * the stand (micDrawingsField): framed whole, the capsules are a dot in the box.
 * So the box frames the capsules (mm) and its lower edge cuts the body off.
 */
function rigFrame(t: MicType): { along: number; across: number; drop: number } | null {
  const r = t.body.radius.mm;
  if (t.art === 'ambiTetra') return { along: r * 2.4, across: r * 2.6, drop: r * 0.2 };
  if (t.art === 'dmsCluster') return { along: r * 6, across: r * 2.6, drop: r * 0.2 };
  return null;
}

/** The strip: the box with the mic in it, its front to the right, and its name. */
export function MicCloseUp({ type: t, w }: { type: MicType; w: number }) {
  const scaleText = useStageTextScale();
  const b = closeUpBody(t);
  const boxH = CLOSE_UP_H - 8;
  const rig = rigFrame(t);
  const along = b.len + b.tail + b.fore;
  const across = Math.max(b.cross, b.r * 2);
  const k = Math.min((BOX_W - 14) / (rig?.along ?? along), (boxH - 10) / (rig?.across ?? across));
  const x0 = BOX_W / 2 + k * (rig ? b.len : (b.len + b.tail - b.fore) / 2);
  const y0 = boxH / 2 - k * (rig?.drop ?? 0);
  const dish = isDishType(t);
  return (
    <View style={[styles.strip, { width: w, height: CLOSE_UP_H }]}>
      <View style={styles.box}>
        <Canvas style={{ width: BOX_W, height: boxH }} accessible accessibilityRole="image" accessibilityLabel={`Close-up of the chosen mic: ${t.label}.`}>
          {dish ? (
            <Group transform={[{ translateX: x0 }, { translateY: boxH / 2 }, { scale: k }]}>
              <DishSection dish={dishOf(t)} px={1 / k} />
            </Group>
          ) : (
            <Group transform={[{ translateX: x0 }, { translateY: y0 }, { rotate: Math.PI / 2 }, { scale: k }]}>
              <MikingMicArt art={b.art} r={b.r} len={b.len} cross={b.cross} fore={b.fore} />
            </Group>
          )}
        </Canvas>
      </View>
      <View style={styles.words}>
        <Text style={[styles.tag, { fontSize: Math.max(9, 9.5 * scaleText) }]}>CLOSE-UP · NOT TO SCALE</Text>
        <Text style={[styles.name, { fontSize: Math.max(10, 11 * scaleText) }]}>{t.label}</Text>
      </View>
    </View>
  );
}

/** A dish on the stage, in the scene's millimetres (under its one transform):
 *  the bowl with its rim plane at the pose, opening along the aim. `size` =
 *  across the rim in scene mm; `px` = scene mm per point on the glass. */
export function DishMark({ pose, view, size, px }: { pose: MicPose; view: ViewId; size: number; px: number }): ReactElement {
  const d = DISHES.large;
  const k = size / d.D;
  const a = aimVec(pose.az, pose.el);
  const ang = Math.atan2(view === 'side' ? a.y : a.z, a.x);
  const v = view === 'side' ? pose.p.y : pose.p.z;
  return (
    <Group transform={[{ translateX: pose.p.x }, { translateY: v }, { rotate: ang }, { scale: k }, { translateX: -d.depth }]}>
      <DishSection dish={d} px={px / k} />
    </Group>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, backgroundColor: '#0d0e12' },
  box: { width: BOX_W, height: CLOSE_UP_H - 8, borderWidth: 1, borderColor: '#3a3a44', borderRadius: 6, overflow: 'hidden', backgroundColor: '#2b2d38' },
  words: { flex: 1, minWidth: 0 },
  tag: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
  name: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, lineHeight: 14 },
});
