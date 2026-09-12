/**
 * The card that gets captured when a saved measurement is shared as an IMAGE.
 *
 * WHY THIS EXISTS (owner, device pass 2026-09-11): sharing a measurement sent
 * TEXT only — "in sharing the image is not shared… that is the whole idea of
 * sharing the tools with visuals". The library had already learned this lesson
 * once, when saved measurements displayed descriptions instead of pictures; the
 * share surface had the same gap and nobody had looked at it.
 *
 * WHY THE WORDS ARE BURNED INTO THE PICTURE, rather than sent alongside it:
 * a share sheet that takes a file does not reliably carry a message with it —
 * `expo-sharing` shares the FILE, and RN's `Share.share({message, url})` only
 * pairs them on iOS. So the text would silently vanish on exactly the platforms
 * the owner shares from. Since these previews are governed by the honesty rule
 * that a chart must state the axes and scale it was MEASURED on, a picture that
 * arrives stripped of that disclosure is worse than no picture: it is a chart
 * asserting something it no longer supports. Putting the disclosure inside the
 * captured pixels means the two cannot be separated by anything downstream.
 *
 * Everything here is drawn from the RECORD, never from today's defaults — the
 * same rule the previews themselves follow.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { SavedMeasurement } from '../types';
import { MeasurementPreview } from './MeasurementPreview';
import { PREVIEW_BORDER, PREVIEW_INK } from './previewKit';
import { colors, fonts } from '../../../../theme/tokens';
import { BRAND, shareFooterLines } from '../../../commercial/brand';

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
          be a lie about a still image. */}
      <MeasurementPreview measurement={m} height={PREVIEW_H} />

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

      <View style={styles.rule} />
      {shareFooterLines().map((l) => (
        <Text key={l} style={styles.footer}>{l}</Text>
      ))}
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
  rule: { height: 1, backgroundColor: PREVIEW_BORDER, marginTop: 2 },
  footer: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 13,
    color: colors.textMuted,
  },
});
