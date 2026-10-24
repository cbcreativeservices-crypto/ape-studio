/**
 * Shared pieces for the exit-flow screens (Membership and billing, Cancel
 * membership, Delete account). Text scales with the OS size like the other
 * reading surfaces (no cap); the ‹ key holds at BACK_GLYPH_MAX_SCALE through
 * HomeOrBackKey. Nothing here is drawn under 11 pt.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { HomeOrBackKey } from '../../components/nav/HomeOrBackKey';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../theme/tokens';
import { readingColumn } from '../../theme/readingColumn';
import { COMMENT_MAX, Q3_PROMPT, Q3_WARNING, type Choice } from '../../features/exit/survey';

/**
 * `stepBack`: a LATER step of a multi-step flow (owner 2026-10-15: "there is no
 * back nav in these screens"). The key returns to the previous step, so it is
 * always the ‹ arrow — never the HOME key, whatever opened the screen.
 */
export function ExitHeader({ eyebrow, onBack, stepBack = false }: { eyebrow: string; onBack?: () => void; stepBack?: boolean }) {
  return (
    <View style={ui.header}>
      {onBack && stepBack ? (
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the previous step" style={ui.backKey}>
          <Text style={ui.backGlyph} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
        </Pressable>
      ) : onBack ? (
        <HomeOrBackKey onPress={onBack} backStyle={ui.backGlyph} style={ui.backKey} />
      ) : (
        <View style={ui.backKey} />
      )}
      <Text style={ui.eyebrow} accessibilityRole="header">
        {eyebrow}
      </Text>
    </View>
  );
}

/** One-selection list, nothing preselected. Tapping the chosen one again clears it. */
export function ChoiceList<C extends string>({
  prompt,
  choices,
  value,
  onChange,
  allowClear = true,
}: {
  prompt: string;
  choices: readonly Choice<C>[];
  value: C | null;
  onChange: (next: C | null) => void;
  allowClear?: boolean;
}) {
  return (
    <View style={ui.question} accessibilityRole="radiogroup" accessibilityLabel={prompt}>
      <Text style={ui.prompt}>{prompt}</Text>
      {choices.map((c) => {
        const on = value === c.code;
        return (
          <Pressable
            key={c.code}
            onPress={() => onChange(on && allowClear ? null : c.code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            aria-checked={on}
            accessibilityLabel={c.label}
            style={({ pressed }) => [ui.choice, on && ui.choiceOn, pressed && ui.pressed]}
          >
            <View style={[ui.radio, on && ui.radioOn]}>{on ? <View style={ui.radioDot} /> : null}</View>
            <Text style={ui.choiceLabel}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type BtnKind = 'primary' | 'secondary' | 'danger' | 'link';

export function Btn({
  label,
  onPress,
  kind = 'secondary',
  disabled = false,
  hint,
}: {
  label: string;
  onPress: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole={kind === 'link' ? 'link' : 'button'}
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={kind === 'link' ? 8 : undefined}
      style={({ pressed }) => [
        kind === 'link' ? ui.link : ui.btn,
        kind === 'primary' && ui.btnPrimary,
        kind === 'danger' && ui.btnDanger,
        disabled && ui.btnDisabled,
        pressed && !disabled && ui.pressed,
      ]}
    >
      <Text
        style={[
          kind === 'link' ? ui.linkLabel : ui.btnLabel,
          kind === 'primary' && ui.btnLabelPrimary,
          kind === 'danger' && ui.btnLabelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Optional Question 3: 500 characters, with the sensitive-information warning. */
export function CommentBox({
  value,
  onChange,
  onSend,
  sending,
  status,
  statusText,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  sending: boolean;
  status: 'idle' | 'sent' | 'failed';
  statusText?: string;
}) {
  if (status === 'sent') {
    return <Text style={ui.body}>{statusText}</Text>;
  }
  return (
    <View style={ui.question}>
      <Text style={ui.prompt}>{Q3_PROMPT}</Text>
      <Text style={ui.note}>{Q3_WARNING}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, COMMENT_MAX))}
        maxLength={COMMENT_MAX}
        multiline
        style={ui.comment}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={`${Q3_PROMPT} Optional. Up to ${COMMENT_MAX} characters.`}
        textAlignVertical="top"
      />
      <Text style={ui.counter}>{`${value.length} / ${COMMENT_MAX}`}</Text>
      {status === 'failed' && statusText ? <Text style={ui.note}>{statusText}</Text> : null}
      <Btn label={sending ? 'Sending…' : 'Send'} onPress={onSend} disabled={sending || !value.trim()} />
    </View>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <View style={ui.card}>{children}</View>;
}

export const ui = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6, minHeight: 44 },
  backKey: { width: 40, minHeight: 44, justifyContent: 'center' },
  backGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, lineHeight: 34 },
  eyebrow: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amber },
  scroll: { padding: 20, paddingTop: 8, gap: 16, ...readingColumn },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  strong: { fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  note: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  error: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 20, color: '#ff8a80' },
  question: { gap: 8 },
  prompt: { fontFamily: fonts.barlowSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    backgroundColor: '#151515',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  choiceOn: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  choiceLabel: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.amber },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.amber },
  pressed: { opacity: 0.75 },
  btn: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3c3c3c',
    backgroundColor: '#181818',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { borderColor: colors.amberDeep, backgroundColor: '#2a1f08' },
  btnDanger: { borderColor: 'rgba(255,90,80,.6)', backgroundColor: '#1a0f0e' },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary, textAlign: 'center' },
  btnLabelPrimary: { color: colors.amber },
  btnLabelDanger: { color: '#ff5b52' },
  link: { paddingVertical: 8, alignSelf: 'flex-start' },
  linkLabel: { fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 21, color: colors.cyan, textDecorationLine: 'underline' },
  card: { borderWidth: 1, borderColor: '#262626', backgroundColor: '#121212', borderRadius: 12, padding: 16, gap: 8 },
  comment: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 12,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  counter: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end' },
  dock: {
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#0e0e0e',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    ...readingColumn,
  },
});
