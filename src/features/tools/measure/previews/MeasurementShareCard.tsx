/**
 * The card that gets captured when a saved measurement is shared as an IMAGE.
 *
 * WHY THIS EXISTS (owner, device pass 2026-09-11): sharing a measurement sent
 * TEXT only — "in sharing the image is not shared… that is the whole idea of
 * sharing the tools with visuals". The library had already learned this lesson
 * once, when saved measurements displayed descriptions instead of pictures; the
 * share surface had the same gap and nobody had looked at it.
 *
 * WHAT BELONGS IN THE PICTURE, AND WHAT DOES NOT (revised after the owner saw
 * the first version, 2026-09-11):
 *
 * IN — the disclosure that makes the chart readable AS A MEASUREMENT: the
 * scale and axes it was captured on, the tool, the input, the calibration
 * status, the quality and any warning flags. These previews are governed by the
 * rule that a chart must state what it was measured against, so a picture that
 * travels without them would be asserting something it no longer supports.
 *
 * OUT — the marketing footer. The first version burned "Generated with …",
 * the product line and the URL into the image, on the reasoning that a
 * file-only share drops the accompanying text. The owner's verdict was that it
 * "looks bad", and they were right: it repeated the wordmark already at the top
 * of the card, and a URL rendered as flat pixels is not a link — it is a
 * picture of a link, which is strictly worse than the tappable one the old
 * text-only share used to produce. The fix was not better typography; it was
 * sending the text WITH the image (see shareImage.captureAndShare), so the
 * message carries the branding and a real link while the card carries the
 * measurement. Each does the job it is actually good at.
 *
 * Everything here is drawn from the RECORD, never from today's defaults — the
 * same rule the previews themselves follow.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { SavedMeasurement } from '../types';
import { MeasurementPreview } from './MeasurementPreview';
import { PREVIEW_INK } from './previewKit';
import { colors, fonts } from '../../../../theme/tokens';
import { BRAND } from '../../../commercial/brand';

/** Capture width in logical px. view-shot renders at the device pixel ratio, so
 *  a 3× phone yields ~1080 px — plenty for a messaging app without producing a
 *  file so large that the share sheet chokes on it. */
export const SHARE_CARD_W = 360;
const PREVIEW_H = 190;

export const MeasurementShareCard = forwardRef<View, {
  measurement: SavedMeasurement;
  /** Pre-formatted "Taken: …" stamp — the screen owns date formatting (and its
   *  corrupt-stamp fallback), so it is passed in rather than re-derived here. */
  takenAt: string;
  toolName: string;
  qualityLabel: string;
  /** Fires when the card has real dimensions — the caller captures on this,
   *  because a capture taken on the same tick photographs a zero-sized view. */
  onLayout?: (e: LayoutChangeEvent) => void;
}>(function MeasurementShareCard({ measurement, takenAt, toolName, qualityLabel, onLayout }, ref) {
  const m = measurement;
  return (
    <View ref={ref} collapsable={false} onLayout={onLayout} style={styles.card}>
      <Text style={styles.brand}>{BRAND.name.toUpperCase()}</Text>

      <Text style={styles.title} numberOfLines={2}>
        {m.title}
      </Text>

      {/* The picture. onPress is deliberately omitted — a captured card has no
          interaction, and a preview that looked tappable in a screenshot would
          be a lie about a still image.

          forCapture is what makes the spectrogram actually appear: it is drawn
          with Skia, which renders outside the native view hierarchy that
          view-shot photographs, so without this the card captured with an EMPTY
          chart (owner, device pass 2026-09-11) — axes, labels and caption all
          present around a blank frame, which reads as a measurement of silence. */}
      <MeasurementPreview measurement={m} height={PREVIEW_H} forCapture />

      {/* The provenance that makes the picture readable as a MEASUREMENT rather
          than as decoration. Calibration is stated explicitly because an
          uncalibrated capture must never travel looking authoritative. */}
      <View style={styles.meta}>
        <Text style={styles.metaLine}>{toolName} · {takenAt}</Text>
        <Text style={styles.metaLine}>
          Input: {m.input_device} · Calibration: {m.calibration_status.replace(/_/g, ' ')}
        </Text>
        <Text style={styles.metaLine}>Quality: {qualityLabel}</Text>
      </View>

      {/* Warnings ride along with the picture. A capture that dropped samples or
          clipped is still worth sharing — silently is not. */}
      {m.warning_flags.length > 0 && (
        <Text style={styles.warn}>⚠ {m.warning_flags.map((f) => f.replace(/_/g, ' ')).join(' · ')}</Text>
      )}

    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_W,
    padding: 16,
    gap: 9,
    // An opaque ground is required, not cosmetic: a transparent capture becomes
    // black-on-black in some messaging apps and white-on-white in others.
    backgroundColor: '#0b0b0e',
  },
  brand: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.barlowRegular,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  meta: { gap: 2 },
  metaLine: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 15,
    color: PREVIEW_INK,
  },
  warn: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 15,
    color: '#e8b339',
  },
});
