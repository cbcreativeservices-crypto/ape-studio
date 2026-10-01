/**
 * stageScaleStyle — the pure half of stageScale (no React Native import, so
 * the node test runner can exercise it): multiply every PIXEL key of a style
 * by the stage text scale. Percent strings, flex, colours and font names are
 * left alone. 1 = the style untouched.
 */

/** Style keys that are pixel sizes — multiplied by the stage text scale. */
export const PX_STYLE_KEYS: ReadonlySet<string> = new Set([
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'left',
  'right',
  'top',
  'bottom',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'gap',
  'rowGap',
  'columnGap',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'shadowRadius',
]);

type StyleRec = Record<string, unknown>;
/** A React Native style prop: an object, a nested array, or a falsy entry. */
export type StyleLike = StyleRec | StyleLike[] | null | undefined | false;

/** StyleSheet.flatten without React Native: later entries win. */
export function flattenStyle(style: StyleLike): StyleRec {
  if (!style) return {};
  if (Array.isArray(style)) {
    const out: StyleRec = {};
    for (const s of style) Object.assign(out, flattenStyle(s));
    return out;
  }
  return style;
}

/** Flatten a style and multiply its pixel keys by `ts`. */
export function scaleStyleRec(style: StyleLike, ts: number): StyleRec {
  const flat = flattenStyle(style);
  if (ts === 1) return flat;
  const out: StyleRec = {};
  for (const key of Object.keys(flat)) {
    const v = flat[key];
    out[key] = PX_STYLE_KEYS.has(key) && typeof v === 'number' ? v * ts : v;
  }
  return out;
}

/** Every style of a sheet scaled by `ts` (the sheet itself when ts is 1). */
export function scaleStylesRec<T extends Record<string, StyleRec>>(sheet: T, ts: number): T {
  if (ts === 1) return sheet;
  const out: Record<string, StyleRec> = {};
  for (const key of Object.keys(sheet)) out[key] = scaleStyleRec(sheet[key], ts);
  return out as T;
}
