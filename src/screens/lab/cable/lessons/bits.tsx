/**
 * Shared building blocks for Cable & Connector Lab lesson bodies — the ONE
 * source for the lab's interaction chrome so all 12 lessons render
 * identically (MicSelect pixel conventions; verdicts are glyph + words +
 * color, never color alone; accessibility state on every Pressable).
 */
import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { CORE_PRINCIPLE } from '../data/lessons';

/** The central principle, shown as the amber lesson banner (MicSelect idiom). */
export function PrincipleBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{CORE_PRINCIPLE}</Text>
    </View>
  );
}

/** Amber takeaway banner for per-lesson LESSON strings. */
export function LessonBanner({ text }: { text: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

/** Section eyebrow inside a lesson body. */
export function Eyebrow({ text }: { text: string }) {
  return <Text style={styles.eyebrow}>{text}</Text>;
}

/** Tappable option chip (selected = amber border + tint, + accessibilityState). */
export function OptionChip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      accessibilityLabel={label}
      style={[styles.chip, active && styles.chipActive, disabled && { opacity: 0.5 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Detail card container (deep panel idiom). */
export function DetailCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.detailCard}>{children}</View>;
}

export type Verdict = 'correct' | 'accepted' | 'wrong';

/** Tri-state verdict banner: glyph + words + color (ScenariosScreen pattern —
 *  NEVER color alone). Announces itself to screen readers without moving
 *  focus (house §23 rule). */
export function VerdictBanner({ verdict, text }: { verdict: Verdict; text: string }) {
  const glyph = verdict === 'correct' ? '✓' : verdict === 'accepted' ? '△' : '✕';
  const head = verdict === 'correct' ? 'Correct' : verdict === 'accepted' ? 'Also defensible' : 'Not quite';
  const tint = verdict === 'correct' ? colors.green : verdict === 'accepted' ? colors.amber : '#ff8a6b';
  useEffect(() => {
    // Announce, never move focus (house §23 rule).
    AccessibilityInfo.announceForAccessibility(`${head}. ${text}`);
  }, [head, text]);
  return (
    <View style={[styles.verdict, { borderColor: tint }]}>
      <Text style={[styles.verdictHead, { color: tint }]}>{`${glyph} ${head.toUpperCase()}`}</Text>
      <Text style={styles.verdictText}>{text}</Text>
    </View>
  );
}

/** Green completion banner for a lesson's solved knowledge check. */
export function CheckDoneBanner({ text }: { text: string }) {
  return (
    <View style={styles.doneBanner}>
      <Text style={styles.doneText}>{`✓ ${text}`}</Text>
    </View>
  );
}

export const lessonStyles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, fontStyle: 'italic' },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  cardHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.amberLabel, marginTop: 4 },
});

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 11,
  },
  bannerText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary, marginTop: 4 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  chipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.7, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  detailCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
    gap: 6,
  },
  verdict: {
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#101014',
    padding: 11,
    gap: 4,
  },
  verdictHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  verdictText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  doneBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    padding: 11,
  },
  doneText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.green },
});
