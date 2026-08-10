/**
 * AccuracyNote — the app-wide "learn here, measure with the right tool" chip.
 *
 * Owner rule (2026-08-09), global across every lab, tool, and calculator: the
 * app is for TEACHING and UNDERSTANDING. It must always steer users toward a
 * dedicated, CALIBRATED instrument for accurate DSP / audio / acoustic / light
 * work — a phone's mic, sensors, and audio path are not calibrated, and these
 * labs and calculators are simplified teaching models, never standards-
 * compliant measurements.
 *
 * Form (owner choice): an unobtrusive ⓘ chip that opens a short explainer
 * sheet — never a nag, never auto-shown. Self-contained (owns its own open
 * state) so any screen adds it in ONE line:  <AccuracyNote />  — and live-input
 * tools pass a `detail` line, e.g. the SPL meter's uncalibrated-mic caveat.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';

/** The standing message, exported so copy stays identical everywhere it is
 *  shown or referenced (guided lessons, future surfaces). */
export const ACCURACY_TITLE = 'LEARN HERE — MEASURE WITH THE RIGHT TOOL';
export const ACCURACY_BODY = [
  'Pro Audio Training Academy is a teaching tool. It is built to help you understand how audio, acoustics, and signal flow actually work — so learn the concepts with us here.',
  'For accurate, real-world work, reach for a dedicated, CALIBRATED instrument. A phone’s microphone, sensors, and audio path are not calibrated, and these labs and calculators are simplified teaching models — never standards-compliant measurements.',
];
export const ACCURACY_TOOLS: { job: string; use: string }[] = [
  { job: 'Sound level (SPL)', use: 'a calibrated SPL meter or measurement microphone' },
  { job: 'Room & acoustics', use: 'a proper acoustic analyzer (RTA / RT60)' },
  { job: 'Light', use: 'a dedicated light meter' },
  { job: 'Loudness, alignment & DSP', use: 'lab-grade metering or your DAW’s certified meters' },
];
export const ACCURACY_CLOSER = 'Learn the concept here; measure with the right tool.';

export function AccuracyNote({
  detail,
  label = 'ACCURACY',
  compact = false,
  style,
}: {
  /** Context-specific caveat shown emphasised at the top (e.g. a live-input
   *  tool: "This meter uses your phone’s uncalibrated mic — the numbers are for
   *  learning, treat them as relative"). */
  detail?: string;
  /** Chip label; hidden when `compact`. */
  label?: string;
  /** Icon-only chip (no label text) — for tight headers. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        style={[styles.chip, style]}
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="About accuracy and calibration"
      >
        <Text style={styles.chipGlyph}>ⓘ</Text>
        {compact ? null : <Text style={styles.chipLabel}>{label}</Text>}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Swallow taps on the card so they don't close the sheet. */}
          <Pressable style={styles.card} onPress={() => {}}>
            <ScrollView contentContainerStyle={styles.cardBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{ACCURACY_TITLE}</Text>

              {detail ? (
                <View style={styles.detailWrap}>
                  <Text style={styles.detail}>{detail}</Text>
                </View>
              ) : null}

              {ACCURACY_BODY.map((p, i) => (
                <Text key={i} style={styles.body}>
                  {p}
                </Text>
              ))}

              <Text style={styles.subhead}>FOR ACCURATE WORK, USE</Text>
              {ACCURACY_TOOLS.map((t) => (
                <View key={t.job} style={styles.toolRow}>
                  <Text style={styles.toolDot}>›</Text>
                  <Text style={styles.toolText}>
                    <Text style={styles.toolJob}>{t.job}</Text> → {t.use}
                  </Text>
                </View>
              ))}

              <Text style={styles.closer}>{ACCURACY_CLOSER}</Text>

              <Pressable
                style={styles.gotIt}
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.gotItText}>GOT IT</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#131316',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  chipGlyph: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amber, marginTop: -1 },
  chipLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSub },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.66)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '82%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a31',
    backgroundColor: '#101014',
  },
  cardBody: { padding: 18, gap: 11 },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 0.6,
    lineHeight: 20,
    color: colors.amber,
  },
  detailWrap: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: 'rgba(255,198,77,.08)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  detail: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  subhead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textSub,
    marginTop: 4,
  },
  toolRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  toolDot: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, lineHeight: 19 },
  toolText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  toolJob: { fontFamily: fonts.barlowSemiBold, color: colors.textPrimary },
  closer: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textPrimary,
    marginTop: 4,
  },
  gotIt: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  gotItText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
});
