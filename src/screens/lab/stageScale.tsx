/**
 * stageScale — FULL SCREEN scaling helpers for the Digital Audio and Gain
 * Staging stages (D35, 2026-09-30: "everything in the drawing zooms with the
 * step").
 *
 * A Skia stage lays itself out at its GLASS size (width ÷ ts, height ÷ ts)
 * and paints through `<Group transform={[{ scale: ts }]}>` — strokes, radii,
 * blurs and dots all double at 2×, crisp (the foundations/viz precedent). The
 * React Native labels laid OVER the canvas are authored in points and would
 * stay phone-sized (THE SKIA TRAP, rack/stageAspect.ts): `SText` / `SView`
 * take the same unscaled style and multiply every pixel key by the stage
 * text scale — fontSize, offsets, widths, padding, radii — so a label sits
 * exactly over the feature it names at every zoom. 1 on the glass = the
 * style untouched.
 *
 * A view-built stage (the Gain chain columns) scales its whole StyleSheet
 * through `useScaledStyles` instead, and keeps its flex layout at the real
 * size. Only real controls keep their size (the dock, not the drawing).
 *
 * The pure maths lives in stageScaleStyle.ts (node-testable, no RN import).
 */
import { useMemo } from 'react';
import { Text, View, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from 'react-native';
import { useStageTextScale } from './rack/stageAspect';
import { scaleStyleRec, scaleStylesRec, type StyleLike } from './stageScaleStyle';

/** Flatten a style and multiply its pixel keys by `ts`. */
export function scaleStyle<T extends ViewStyle | TextStyle>(style: StyleProp<T>, ts: number): T {
  return scaleStyleRec(style as StyleLike, ts) as T;
}

/** Every style of a StyleSheet scaled by `ts`. */
export function scaleStyles<T extends Record<string, ViewStyle | TextStyle>>(sheet: T, ts: number): T {
  return scaleStylesRec(sheet as unknown as Record<string, Record<string, unknown>>, ts) as unknown as T;
}

export function useScaledStyles<T extends Record<string, ViewStyle | TextStyle>>(sheet: T): T {
  const ts = useStageTextScale();
  return useMemo(() => scaleStyles(sheet, ts), [sheet, ts]);
}

/** A stage overlay label: the unscaled style in, the zoomed label out. */
export function SText(props: TextProps) {
  const ts = useStageTextScale();
  if (ts === 1) return <Text {...props} />;
  return <Text {...props} style={scaleStyle<TextStyle>(props.style, ts)} />;
}

/** A stage overlay box (a frame, a lamp) that zooms with the drawing. */
export function SView(props: ViewProps) {
  const ts = useStageTextScale();
  if (ts === 1) return <View {...props} />;
  return <View {...props} style={scaleStyle<ViewStyle>(props.style, ts)} />;
}
