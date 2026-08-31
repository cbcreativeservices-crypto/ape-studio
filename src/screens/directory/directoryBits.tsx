/**
 * Shared pieces for the Audio Community Directory. Deliberately small: the
 * directory is a compact professional layer, not a social product, so it reuses
 * the app's existing chip/row/section idiom rather than inventing a look.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.eyebrow}>
      {children}
    </Text>
  );
}

export function Helper({ children }: { children: ReactNode }) {
  return <Text style={s.helper}>{children}</Text>;
}

/** A selectable chip. `star` marks the one primary area (§6.2 — a visible
 *  control, never press-and-hold, which is undiscoverable and inaccessible). */
export function Chip({
  label,
  on,
  disabled,
  starred,
  onPress,
  onStar,
  onRemove,
}: {
  label: string;
  on?: boolean;
  disabled?: boolean;
  starred?: boolean;
  onPress?: () => void;
  onStar?: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={[s.chip, on && s.chipOn, disabled && s.chipDisabled]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={s.chipBody}
        accessibilityRole="button"
        accessibilityState={{ selected: !!on, disabled: !!disabled }}
        accessibilityLabel={label}
        accessibilityHint={
          disabled ? 'You have reached the limit for this section' : on ? 'Selected. Tap to remove.' : undefined
        }
      >
        <Text style={[s.chipText, on && s.chipTextOn, disabled && s.chipTextDisabled]}>
          {starred ? '★ ' : ''}
          {label}
        </Text>
      </Pressable>
      {onStar ? (
        <Pressable
          onPress={onStar}
          hitSlop={8}
          style={s.chipAction}
          accessibilityRole="button"
          accessibilityLabel={starred ? `${label} is your primary area` : `Set ${label} as your primary area`}
          accessibilityState={{ selected: !!starred }}
        >
          <Text style={[s.chipActionText, starred && s.chipActionOn]}>{starred ? '★' : '☆'}</Text>
        </Pressable>
      ) : null}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={s.chipAction}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <Text style={s.chipActionText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <View style={s.wrap}>{children}</View>;
}

export function CountHint({ used, cap, noun }: { used: number; cap: number; noun: string }) {
  return (
    <Text style={[s.count, used >= cap && s.countFull]} accessibilityLabel={`${used} of ${cap} ${noun} chosen`}>
      {used}/{cap} {noun}
    </Text>
  );
}

export function Banner({ tone, children }: { tone: 'info' | 'warn' | 'good'; children: ReactNode }) {
  return (
    <View style={[s.banner, tone === 'warn' && s.bannerWarn, tone === 'good' && s.bannerGood]}>
      <Text style={[s.bannerText, tone === 'warn' && s.bannerTextWarn, tone === 'good' && s.bannerTextGood]}>
        {children}
      </Text>
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.amber} />
      <Text style={s.helper}>{label}</Text>
    </View>
  );
}

/** Empty state. §10.1: suggestions must never pressure someone into revealing
 *  more about themselves — so these only ever suggest widening the FILTERS. */
export function EmptyState({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {lines.map((l) => (
        <Text key={l} style={s.helper}>
          {l}
        </Text>
      ))}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'amber',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'amber' | 'green' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        tone === 'green' && s.btnGreen,
        tone === 'danger' && s.btnDanger,
        disabled && s.btnDisabled,
        pressed && !disabled && s.btnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text
        style={[
          s.btnText,
          tone === 'green' && s.btnTextGreen,
          tone === 'danger' && s.btnTextDanger,
          disabled && s.btnTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** The §4.6 line. Self-reported information must never read as verified. */
export function SelfReportedNote() {
  return (
    <Text style={s.disclosure}>
      Profile details are provided by the member. Pro Audio Training Academy credentials are
      independently verifiable.
    </Text>
  );
}

const s = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.amberLabel,
    marginTop: 18,
    marginBottom: 6,
  },
  helper: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: 6,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 40,
  },
  chipOn: { backgroundColor: '#0d1f14', borderColor: 'rgba(55,224,95,.6)' },
  chipDisabled: { opacity: 0.45 },
  chipBody: { paddingVertical: 9, paddingHorizontal: 12, justifyContent: 'center', minHeight: 40 },
  chipText: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#9a9a9a' },
  chipTextOn: { color: '#5bff85' },
  chipTextDisabled: { color: colors.textMutedDeep },
  chipAction: { paddingHorizontal: 9, paddingVertical: 9, minWidth: 34, minHeight: 40, justifyContent: 'center' },
  chipActionText: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  chipActionOn: { color: colors.amber },
  count: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.1, color: colors.textMutedDeep },
  countFull: { color: colors.amber },
  banner: {
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    backgroundColor: '#141414',
    borderRadius: 9,
    padding: 11,
    marginTop: 10,
  },
  bannerWarn: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#1e1a10' },
  bannerGood: { borderColor: 'rgba(55,224,95,.45)', backgroundColor: '#0d1f14' },
  bannerText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  bannerTextWarn: { color: colors.amber },
  bannerTextGood: { color: colors.green },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  empty: { paddingVertical: 28, paddingHorizontal: 4, gap: 2 },
  emptyTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 0.6,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  btn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.6)',
    backgroundColor: '#241a06',
    marginTop: 12,
  },
  btnGreen: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0d1f14' },
  btnDanger: { borderColor: 'rgba(255,90,80,.55)', backgroundColor: '#1e1010' },
  btnDisabled: { borderColor: '#2c2c2c', backgroundColor: '#141414' },
  btnPressed: { opacity: 0.75 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  btnTextGreen: { color: colors.green },
  btnTextDanger: { color: '#ff6a60' },
  btnTextDisabled: { color: colors.textMutedDeep },
  disclosure: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMutedDeep,
    marginTop: 14,
  },
});

export const directoryStyles = s;
