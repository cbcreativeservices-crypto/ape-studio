/**
 * legibility — the two owner rules for display text, in one place
 * (pattern hunt P14/P15, 2026-10-02).
 *
 *  1. Nothing is drawn under 9 pt on a phone (owner 2026-09-25). For a
 *     drawing that scales (an SVG in a viewBox, a StageFit stage) the rule is
 *     on the RENDERED size: authored fontSize × the fit scale at 375 / 390
 *     wide. Plain React Native text is drawn at its authored size.
 *  2. A value is never ellipsized ("12…" is a wrong number, not a short one).
 *     A one-line value that can outgrow its box SHRINKS to fit — down to the
 *     9 pt floor, never below it. (A rack readout that is still too wide
 *     drops its LABEL — BezelReadouts does that; see D36.)
 *
 * `fitValue(fontSize)` is the props for rule 2 on a plain <Text>:
 *
 *     <Text style={styles.value} {...fitValue(14)}>{value}</Text>
 *
 * Pass the style's fontSize. The shrink floor is 9 pt, so `minimumFontScale`
 * is 9 ÷ fontSize (1 when the text is already at or under 9 — it may not
 * shrink at all then). test/patternP14_20261002.test.ts guards both rules.
 */

/** The smallest a piece of display text may render, in points. */
export const MIN_DISPLAY_PT = 9;

export type FitValueProps = {
  numberOfLines: 1;
  adjustsFontSizeToFit: true;
  minimumFontScale: number;
};

/** One-line props for a value: shrink to fit, never under 9 pt, never "…". */
export function fitValue(fontSize: number): FitValueProps {
  const fs = Number.isFinite(fontSize) && fontSize > 0 ? fontSize : MIN_DISPLAY_PT;
  const scale = Math.min(1, MIN_DISPLAY_PT / fs);
  // Rounded UP, so fontSize × minimumFontScale is never a hair under 9.
  return { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: Math.min(1, Math.ceil(scale * 1000) / 1000) };
}
