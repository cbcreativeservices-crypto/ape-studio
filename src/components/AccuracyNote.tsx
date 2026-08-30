/**
 * AccuracyNote — the app-wide honesty chip. TWO standards, two variants:
 *
 * • variant "tool" (default) — LABS & LIVE-INPUT TOOLS. Owner rule 2026-08-09:
 *   these are for TEACHING and UNDERSTANDING, and live tools read through the
 *   phone's UNCALIBRATED mic / sensors / audio path, so steer users to a
 *   dedicated CALIBRATED instrument for accurate measurement. Unobtrusive ⓘ chip
 *   → short explainer; live tools pass a `detail` line (the uncalibrated caveat).
 *
 * • variant "calc" — CALCULATORS & EQUATIONS. Owner CRITICAL standard 2026-08-09
 *   ([[feedback-calc-source-of-truth]]): the equations are a 100%-accurate,
 *   tested, TRUSTED SOURCE OF TRUTH that field pros rely on for high-voltage,
 *   weight, and hazardous work. Its note must SIGNAL TRUST and point to the
 *   cited method — it must NEVER tell a field pro to distrust the math. Green ✓
 *   "VERIFIED" chip → a trust-forward explainer that points to the formula shown.
 *
 * Self-contained (owns its open state) so any screen adds it in one line.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';

/** LAB / LIVE-TOOL copy (variant "tool") — exported so it stays identical
 *  everywhere it is shown or referenced. */
export const ACCURACY_TITLE = 'LEARN HERE — MEASURE WITH THE RIGHT TOOL';
export const ACCURACY_BODY = [
  'The academy\'s labs and live meters are built to help you SEE and understand how audio, acoustics, and signal flow actually work — learn the concepts with us.',
  'Live tools read through your phone’s UNCALIBRATED microphone, sensors, and audio path, so treat their readings as relative, for learning. For accurate, real-world measurement, reach for a dedicated, CALIBRATED instrument.',
];
export const ACCURACY_TOOLS: { job: string; use: string }[] = [
  { job: 'Sound level (SPL)', use: 'a calibrated SPL meter or measurement microphone' },
  { job: 'Room & acoustics', use: 'a proper acoustic analyzer (RTA / RT60)' },
  { job: 'Light', use: 'a dedicated light meter' },
  { job: 'Loudness, alignment & DSP', use: 'lab-grade metering or your DAW’s certified meters' },
];
export const ACCURACY_CLOSER = 'Learn the concept here; measure with the right tool.';

/** CALCULATOR copy (variant "calc") — trust-forward, method-cited. */
export const CALC_TITLE = 'VERIFIED CALCULATION';
export const CALC_BODY = [
  'Built to be a source you can trust in the field. Each result is computed EXACTLY from the formula shown, using established, published engineering methods.',
  'Every calculator names its method — and any standard it follows (Ohm’s law, IEC, ISO, AES, ITU-R) — right by the FORMULA and the notes beside the result, so you can see exactly how the answer was reached.',
];
export const CALC_CLOSER = 'Computed exactly from the method shown — the FORMULA and notes in each calculator show the source.';

export function AccuracyNote({
  variant = 'tool',
  detail,
  label,
  compact = false,
  style,
}: {
  /** "tool" = labs & live-input tools (teaching / uncalibrated caveat);
   *  "calc" = calculators & equations (verified / source-of-truth). */
  variant?: 'tool' | 'calc';
  /** Context-specific caveat shown emphasised at the top (live-input tools). */
  detail?: string;
  /** Chip label; hidden when `compact`. Defaults per variant. */
  label?: string;
  /** Icon-only chip (no label text) — for tight headers. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const isCalc = variant === 'calc';
  const chipLabel = label ?? (isCalc ? 'VERIFIED' : 'ACCURACY');

  return (
    <>
      <Pressable
        style={[styles.chip, style]}
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isCalc ? 'How this calculation is verified' : 'About accuracy and calibration'}
      >
        <Text style={[styles.chipGlyph, isCalc && styles.chipGlyphCalc]}>{isCalc ? '✓' : 'ⓘ'}</Text>
        {compact ? null : <Text style={styles.chipLabel}>{chipLabel}</Text>}
      </Pressable>

      <Modal accessibilityViewIsModal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Swallow taps on the card so they don't close the sheet. */}
          <Pressable accessible={false} style={styles.card} onPress={() => {}}>
            <ScrollView contentContainerStyle={styles.cardBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, isCalc && styles.titleCalc]}>{isCalc ? CALC_TITLE : ACCURACY_TITLE}</Text>

              {detail ? (
                <View style={[styles.detailWrap, isCalc && styles.detailWrapCalc]}>
                  <Text style={styles.detail}>{detail}</Text>
                </View>
              ) : null}

              {(isCalc ? CALC_BODY : ACCURACY_BODY).map((p, i) => (
                <Text key={i} style={styles.body}>
                  {p}
                </Text>
              ))}

              {isCalc ? null : (
                <>
                  <Text style={styles.subhead}>FOR ACCURATE WORK, USE</Text>
                  {ACCURACY_TOOLS.map((t) => (
                    <View key={t.job} style={styles.toolRow}>
                      <Text style={styles.toolDot}>›</Text>
                      <Text style={styles.toolText}>
                        <Text style={styles.toolJob}>{t.job}</Text> → {t.use}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.closer, isCalc && styles.closerCalc]}>{isCalc ? CALC_CLOSER : ACCURACY_CLOSER}</Text>

              <Pressable
                style={[styles.gotIt, isCalc && styles.gotItCalc]}
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={[styles.gotItText, isCalc && styles.gotItTextCalc]}>GOT IT</Text>
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
  chipGlyphCalc: { fontFamily: fonts.oswaldSemiBold, color: colors.green },
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
  titleCalc: { color: colors.green },
  detailWrap: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: 'rgba(255,198,77,.08)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  detailWrapCalc: { borderLeftColor: colors.green, backgroundColor: 'rgba(55,224,95,.08)' },
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
  closerCalc: { color: colors.greenBright },
  gotIt: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  gotItCalc: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: 'rgba(55,224,95,.12)' },
  gotItText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  gotItTextCalc: { color: colors.green },
});
