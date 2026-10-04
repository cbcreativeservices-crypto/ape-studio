/**
 * ProgressUnreadableNote — the ONE note every lab hub shows where its progress
 * or credit would be when the learner's saved progress could not be read from
 * the device (owner 2026-10-03, "do 2"; house rule D51: a screen showing saved
 * data has three faces — loading, UNREADABLE, truly empty — and a failed read
 * is never shown as empty or "not started").
 *
 * Inline, never a popup, nothing auto-appears beyond the hub's own body (Low-
 * Light Production Mode). It never blocks anything: the module list below it
 * stays usable and every module can still be practised. Text ≥ 12 pt.
 *
 * The words live in kit/labEnd.ts (pure, unit-tested):
 * test/labHubUnreadable_20261003.
 */
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { PROGRESS_LOADING, PROGRESS_UNREADABLE } from './labEnd';

export { PROGRESS_LOADING, PROGRESS_UNREADABLE };

export function ProgressUnreadableNote({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.box, style]} accessible accessibilityLabel={PROGRESS_UNREADABLE} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{PROGRESS_UNREADABLE}</Text>
    </View>
  );
}

/** The quiet face while the read is still out (no "0 of N" flash). */
export function ProgressLoadingNote({ style }: { style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.loading, style]}>{PROGRESS_LOADING}</Text>;
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: '#4a3a12',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1a160c',
  },
  text: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  loading: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
});
