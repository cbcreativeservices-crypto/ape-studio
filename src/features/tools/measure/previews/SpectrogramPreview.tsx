/**
 * A SAVED spectrogram, redrawn as the picture it was captured as.
 *
 * The library used to render this measurement as "GRID: 79 cols × 128 cells".
 * The grid itself was in the payload the whole time — what was missing was the
 * drawing (owner, device pass 2026-09-11).
 *
 * IT IS A REDRAW, NOT A SCREENSHOT, and that is the better of the two:
 *   • it is the real measured data, so it can be re-scaled or re-ranged later
 *     without anyone having kept a bitmap around,
 *   • it costs nothing beyond the numbers already stored, and
 *   • it goes through the SAME buildRasterImage the live tool uses, so it
 *     cannot drift from what the user watched.
 * The last point is why spectrogramRaster.ts exists as a shared module rather
 * than this file owning a second copy of the colour maths.
 *
 * It reproduces the capture exactly rather than approximately, because the
 * colour anchor is a fixed constant (history never recolours, owner
 * 2026-08-14) and the stored grid is already the raster input — so the only
 * other thing the drawing needs, the dynamic range, travels in the record.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, Image as SkiaImage } from '@shopify/react-native-skia';
import Svg, { Line } from 'react-native-svg';
import type { SpectrogramSnapshotPayload } from '../types';
import {
  buildRasterImage,
  FIXED_ANCHOR_DB,
  FREQ_LABELS,
  freqFraction,
} from '../spectrogramRaster';
import { PreviewFrame, PREVIEW_GRID, PREVIEW_H, TickLabel } from './previewKit';

export function SpectrogramPreview({
  payload,
  height = PREVIEW_H,
  onPress,
}: {
  payload: SpectrogramSnapshotPayload;
  height?: number;
  onPress?: () => void;
}) {
  // Redraw from the record's OWN dynamic range, never today's chip selection —
  // a snapshot captured at 40 dB must not come back stretched over 80.
  const img = useMemo(
    () => buildRasterImage(payload.grid, FIXED_ANCHOR_DB, payload.dynamicRangeDb),
    [payload.grid, payload.dynamicRangeDb],
  );
  // An SkImage is native memory behind a JS handle; release it when this row
  // collapses or the record changes. Same reasoning as the live tool's — the
  // image never leaves this component, so nothing can read it after disposal.
  useEffect(() => () => img?.dispose(), [img]);

  // Skia needs a pixel width; the frame is fluid, so measure it. Nothing is
  // drawn until it is known — a raster stretched to a guessed width would
  // misrepresent the time axis the caption is stating.
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cols = payload.grid.length;
  const seconds = cols * payload.timeStepSec;
  const caption =
    `${seconds.toFixed(1)} s × ${payload.bandsHz[0] ?? 50}–` +
    `${payload.bandsHz[payload.bandsHz.length - 1] ?? 16000} Hz · ` +
    `${payload.dynamicRangeDb} dB range below 0 dBFS · ${payload.fftPreset}`;
  const a11y =
    `Saved spectrogram: ${seconds.toFixed(1)} seconds of audio across ` +
    `${payload.bandsHz.length} frequency rows, coloured over a ${payload.dynamicRangeDb} decibel ` +
    'range below full scale. Brighter means louder.';

  return (
    <PreviewFrame caption={caption} height={height} onPress={onPress} a11yLabel={a11y}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        {img && w > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            {/* fit="fill" so the capture spans the frame exactly as the live
                grid does — the time axis is stated in the caption, not implied
                by leaving the raster its native pixel width. */}
            <SkiaImage image={img} x={0} y={0} width={w} height={height} fit="fill" />
          </Canvas>
        ) : null}
      </View>
      {/* The same decade rules and labels the live grid draws, from the same
          shared axis — so a saved capture is read against the axis it was
          measured on. */}
      <Svg style={StyleSheet.absoluteFill}>
        {FREQ_LABELS.map((l) => (
          <Line
            key={l.text}
            x1={0}
            x2="100%"
            y1={freqFraction(l.hz) * height}
            y2={freqFraction(l.hz) * height}
            stroke={PREVIEW_GRID}
            strokeWidth={1}
            strokeDasharray="3 5"
            strokeOpacity={0.55}
          />
        ))}
      </Svg>
      {FREQ_LABELS.map((l) => (
        // Clamped into the frame: 10 kHz sits within a few pixels of the top of
        // a 50 Hz–16 kHz log axis, so an unclamped label rides half outside the
        // clip and reads as a smudge rather than an axis.
        <TickLabel
          key={l.text}
          text={l.text}
          x={4}
          y={Math.max(2, Math.min(height - 13, freqFraction(l.hz) * height - 11))}
        />
      ))}
      <View style={styles.newestEdge} />
    </PreviewFrame>
  );
}

const styles = StyleSheet.create({
  /** The right edge is the newest column, the same as live. A one-pixel rule
   *  says which way time runs without spending a label on it. */
  newestEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: PREVIEW_GRID,
    opacity: 0.7,
  },
});
