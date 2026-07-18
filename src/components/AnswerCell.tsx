/**
 * AnswerCell — quiz/study answer option (design-reference AnswerCell.dc.html).
 * States: default · selectedBlue · selectedOrange · dimmed, plus a transient
 * `wrongRed` (proposal — the kit shows immediate correct/incorrect feedback in
 * study methods but ships no red state; modeled on selectedOrange, red-toned).
 * Optional ☑/☐ check glyph for multi-select.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';

export type AnswerCellState =
  | 'default'
  | 'selectedBlue'
  | 'selectedOrange'
  | 'dimmed'
  | 'wrongRed'
  | 'correctGreen';
export type AnswerCellCheck = 'none' | 'checked' | 'unchecked';

const STATE_STYLES: Record<
  AnswerCellState,
  { bg: [string, string]; border: string; text: string; opacity: number }
> = {
  default: { bg: ['#232323', '#161616'], border: '#3c3c3c', text: '#e6e6e6', opacity: 1 },
  selectedBlue: { bg: ['#152638', '#0e1926'], border: 'rgba(47,155,255,.8)', text: '#d6ecff', opacity: 1 },
  selectedOrange: { bg: ['#2b1c0a', '#1c1206'], border: 'rgba(255,138,30,.8)', text: '#ffd9a8', opacity: 1 },
  wrongRed: { bg: ['#2b0f0a', '#1c0a06'], border: 'rgba(255,75,58,.8)', text: '#ffb3a8', opacity: 1 },
  correctGreen: { bg: ['#0d2a15', '#0a1f10'], border: 'rgba(55,224,95,.85)', text: '#b9f5c4', opacity: 1 },
  dimmed: { bg: ['#232323', '#161616'], border: '#333333', text: '#e6e6e6', opacity: 0.38 },
};

export function AnswerCell({
  label,
  state = 'default',
  check = 'none',
  // Default +1pt (Booth 2026-07-11) — applies to Ear Training / Scenarios cells,
  // which don't pass an explicit size (Matching/Fill still override).
  fontSize = 16,
  borderWidth = 1,
  minHeight = 56,
  numberOfLines,
  onPress,
  disabled,
}: {
  label: string;
  state?: AnswerCellState;
  check?: AnswerCellCheck;
  fontSize?: number;
  borderWidth?: number;
  minHeight?: number;
  numberOfLines?: number;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const s = STATE_STYLES[state];
  const showCheck = check !== 'none';
  const checked = check === 'checked';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Self-sizing (minHeight-driven), stretching to the parent's width.
      // flex:1 here collapsed to zero height outside scroll containers.
      style={{ alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={s.bg}
          style={[
            styles.cell,
            {
              borderColor: s.border,
              borderWidth,
              minHeight,
              opacity: s.opacity * (pressed ? 0.85 : 1),
              justifyContent: showCheck ? 'flex-start' : 'center',
            },
          ]}
        >
          {showCheck && (
            <Text style={[styles.check, { color: checked ? (state === 'selectedOrange' ? '#ff8a1e' : '#2f9bff') : '#666666' }]}>
              {checked ? '☑' : '☐'}
            </Text>
          )}
          <View style={styles.labelWrap}>
            <Text
              style={[styles.label, { fontSize, color: s.text, textAlign: showCheck ? 'left' : 'center' }]}
              numberOfLines={numberOfLines}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  check: { fontSize: 14 },
  labelWrap: { flexShrink: 1, flexGrow: 1 },
  label: { fontFamily: fonts.barlowMedium },
});
