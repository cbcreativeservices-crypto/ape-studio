/**
 * TextField — labeled dark input with optional SHOW toggle.
 *
 * ⚠️ RECONSTRUCTED: TextField.dc.html is missing from the design-reference
 * export (only usage sites + the README line "labeled dark input with optional
 * SHOW toggle. Props: label, value, isPassword"). Styling is derived from the
 * bundle's shared language: recessed panel surface, hairline border, Oswald
 * eyebrow label, Share Tech Mono for ID values, amber accent. Flagged in the
 * Milestone-2 review notes — restyle when the real source is supplied.
 */
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  password = false,
  mono = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  password?: boolean;
  mono?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
}) {
  const [hidden, setHidden] = useState(password);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !editable && styles.inputRowDisabled,
        ]}
      >
        <TextInput
          style={[styles.input, mono && styles.inputMono]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Text style={styles.showToggle}>{hidden ? 'SHOW' : 'HIDE'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: spacing.sm },
  label: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#cccccc',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.cardSm,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: { borderColor: colors.amberDeep },
  inputRowDisabled: { opacity: 0.55 },
  input: {
    flex: 1,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  inputMono: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 1 },
  showToggle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.amber,
    paddingLeft: spacing.md,
  },
});
