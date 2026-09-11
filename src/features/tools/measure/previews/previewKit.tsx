/**
 * The shared frame every saved-measurement preview draws inside.
 *
 * WHY PREVIEWS EXIST (owner, device pass 2026-09-11): "snapshots are not
 * images… the whole idea of capturing the spectrogram". The Saved Measurement
 * Library was storing measurements and displaying DESCRIPTIONS of them — a
 * captured waterfall rendered as "GRID: 79 cols × 128 cells". Every payload
 * already carried the numbers needed to draw the real thing; nothing was
 * missing but the drawing.
 *
 * HONESTY RULES THESE PREVIEWS FOLLOW, because a picture asserts more than a
 * number does:
 *   • Everything drawn is a REAL stored value. No interpolation that invents
 *     resolution the measurement does not have, no smoothing that would flatter
 *     a noisy capture.
 *   • Each preview states its own axes and scale. A saved record carries the
 *     range it was captured at, so it is labelled from the RECORD, never from
 *     today's defaults — an old snapshot must not redraw itself against a scale
 *     it was never measured on.
 *   • A preview is never the only place a value appears; the summary rows stay
 *     underneath, so nothing depends on reading a small chart.
 *
 * The frame itself is deliberately plain: a dark chart ground, a hairline
 * border, and an optional caption strip. The measurement is the only thing with
 * colour in it.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';

/** Chart ground — the same near-black the live tool grids sit on, so a saved
 *  capture reads as the same instrument rather than a document about it. */
export const PREVIEW_BG = '#0e0e10';
export const PREVIEW_BORDER = '#2a2a32';
/** Axis rules and ticks: present enough to read against, quiet enough that the
 *  measurement stays the brightest thing in the frame. */
export const PREVIEW_GRID = '#4a4a58';
export const PREVIEW_INK = colors.textMuted;

/** Thumbnail height in the expanded row. Tall enough for a 128-row waterfall to
 *  show structure; short enough that the summary rows stay on screen with it. */
export const PREVIEW_H = 132;
/** The enlarged view's height — set by the caller from the viewport. */
export const PREVIEW_FULL_MIN_H = 220;

/**
 * The frame. `caption` is the scale/axis disclosure and is NOT optional
 * decoration: it is how the chart says what it is measured against.
 *
 * When `onPress` is given the whole frame becomes one button. The hint says
 * what tapping does rather than describing the image, and `a11yLabel` carries
 * the measurement in words — a chart that only exists visually is not a
 * readout, and the live tools already hold that line.
 */
export function PreviewFrame({
  children,
  caption,
  height = PREVIEW_H,
  onPress,
  a11yLabel,
}: {
  children: ReactNode;
  caption: string;
  height?: number;
  onPress?: () => void;
  a11yLabel: string;
}) {
  const body = (
    <View style={[styles.frame, { height }]}>
      {children}
    </View>
  );
  return (
    <View style={styles.wrap}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityHint="Opens this measurement full screen."
        >
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={a11yLabel}>{body}</View>
      )}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

/** An axis tick label. Kept here so every preview's ticks match. */
export function TickLabel({ text, x, y }: { text: string; x: number; y: number }) {
  return <Text style={[styles.tick, { left: x, top: y }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 5, marginBottom: 10 },
  frame: {
    alignSelf: 'stretch',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PREVIEW_BORDER,
    backgroundColor: PREVIEW_BG,
    overflow: 'hidden',
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    lineHeight: 15,
    color: PREVIEW_INK,
    letterSpacing: 0.2,
  },
  tick: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 9,
    color: PREVIEW_INK,
  },
});
