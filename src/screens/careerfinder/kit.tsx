/**
 * Audio Career Finder — screen kit (owner brief 2026-09-03).
 *
 * The Finder is a LAB-LIKE area: it borrows the paged-lab chrome (‹ back,
 * amber kicker, condensed title, hairline footer) and the primitives text kit,
 * so it sits beside Envelope / Speech / Tuning without a second design system.
 * Everything here is reused by the five Finder screens; nothing is exported
 * for other features yet.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../../features/settings/a11y';
import { DIMENSION_CODES, DIMENSIONS, type DimensionCode } from '../../features/careerfinder/dimensions';
import { band, type DimensionScores } from '../../features/careerfinder/scoring';
import { CENTRALITY, type AudioCentrality } from '../../features/careerfinder/careerIndex';

/* ── shell ─────────────────────────────────────────────────────────────── */

export function FinderShell({
  kicker, title, onBack, backLabel = 'Go back', children, footer, scrollRef, headerRight,
}: {
  kicker: string;
  title: string;
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
  headerRight?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={backLabel}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker} numberOfLines={1}>{kicker}</Text>
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">{title}</Text>
        </View>
        {headerRight}
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (footer ? 24 : 40) }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>{footer}</View> : null}
    </View>
  );
}

/* ── small parts ───────────────────────────────────────────────────────── */

export function BetaPill({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.beta, compact && styles.betaCompact]} accessible accessibilityRole="text" accessibilityLabel="Beta">
      <Text style={styles.betaText}>BETA</Text>
    </View>
  );
}

export function SectionLabel({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'green' | 'cyan' | 'muted' }) {
  const color = tone === 'green' ? colors.green : tone === 'cyan' ? colors.cyanBright : tone === 'muted' ? colors.textMuted : colors.amberLabel;
  return <Text style={[styles.sectionLabel, { color }]} accessibilityRole="header">{children}</Text>;
}

export function Lead({ children }: { children: ReactNode }) { return <Text style={styles.lead}>{children}</Text>; }
export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) { return <Text style={[styles.body, muted && { color: colors.textMuted }]}>{children}</Text>; }
export function Card({ children, tone = 'plain', style }: { children: ReactNode; tone?: 'plain' | 'raised' | 'ok' | 'amber'; style?: object }) {
  return <View style={[styles.card, tone === 'raised' && styles.cardRaised, tone === 'ok' && styles.cardOk, tone === 'amber' && styles.cardAmber, style]}>{children}</View>;
}

/** Full-width call to action. `tone` green = the one primary action on a screen. */
export function CtaButton({ label, onPress, tone = 'plain', disabled, a11y, hint }: { label: string; onPress: () => void; tone?: 'green' | 'plain' | 'quiet'; disabled?: boolean; a11y?: string; hint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.cta, tone === 'green' && styles.ctaGreen, tone === 'quiet' && styles.ctaQuiet, disabled && { opacity: 0.4 }, pressed && !disabled && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.ctaText, tone === 'green' && { color: colors.green }, tone === 'quiet' && { color: colors.textSub }]}>{label}</Text>
    </Pressable>
  );
}

/** Compact footer button (the paged-lab BACK / CONTINUE idiom). */
export function NavButton({ label, onPress, primary, disabled, a11y }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean; a11y?: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.navBtn, primary && styles.navNext, disabled && { opacity: 0.35 }]} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} accessibilityLabel={a11y ?? label}>
      <Text style={[styles.navText, primary && { color: colors.green }]}>{label}</Text>
    </Pressable>
  );
}

/** Text link (secondary navigation: "How this works", "Browse all families"). */
export function TextLink({ label, onPress, a11y, muted }: { label: string; onPress: () => void; a11y?: string; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.link} accessibilityRole="link" accessibilityLabel={a11y ?? label}>
      <Text style={[styles.linkText, muted && { color: colors.textSub }]}>{label} ›</Text>
    </Pressable>
  );
}

/** A row of text links — the labs' compact way to offer secondary actions. */
export function LinkRow({ children }: { children: ReactNode }) {
  return <View style={styles.linkRow}>{children}</View>;
}

/** Header ★ save toggle (44 pt). */
export function SaveStar({ saved, onPress, name }: { saved: boolean; onPress: () => void; name: string }) {
  return (
    <Pressable onPress={onPress} style={styles.star} hitSlop={6} accessibilityRole="button" accessibilityState={{ selected: saved }} accessibilityLabel={saved ? `Remove ${name} from saved families` : `Save ${name}`}>
      <Text style={[styles.starText, saved && { color: colors.amber }]}>{saved ? '★' : '☆'}</Text>
    </Pressable>
  );
}

/* ── progress bar ──────────────────────────────────────────────────────── */

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(1, value));
  const width = useRef(new Animated.Value(v)).current;
  useEffect(() => {
    if (!animationsAllowed()) { width.setValue(v); return; }
    Animated.timing(width, { toValue: v, duration: 260, useNativeDriver: false }).start();
  }, [v, width]);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }} style={styles.barWrap}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}

/* ── chips ─────────────────────────────────────────────────────────────── */

const strengthOf = (s: number | undefined, insufficient?: boolean) => (insufficient || s == null ? 'unknown' : band(s));
const STRENGTH_WORD = { strong: 'strong', some: 'some', neutral: 'neutral', little: 'little', unknown: 'unexplored' } as const;

/** A dimension chip. With `dims`, it also shows the user's level in words
 *  (never colour alone); `primary` marks the family's 50 %-weight activity as
 *  "· main" so the weight is visible. */
export function DimChip({ code, dims, primary }: { code: DimensionCode; dims?: DimensionScores; primary?: boolean }) {
  const d = dims?.[code];
  const strength = dims ? strengthOf(d?.score, d?.insufficient) : null;
  const label = DIMENSIONS[code].label;
  const a11y = `${label}${primary ? ', main activity' : ''}${strength ? `: ${strength === 'unknown' ? 'not enough evidence' : strength === 'neutral' ? 'neutral' : `${strength} interest`}` : ''}`;
  return (
    <View style={[styles.chip, primary && styles.chipPrimary, strength === 'strong' && styles.chipStrong]} accessible accessibilityRole="text" accessibilityLabel={a11y}>
      <Text style={[styles.chipText, strength === 'strong' && { color: colors.cyanBright }]}>{label}</Text>
      {primary ? <Text style={styles.chipMain}>· main</Text> : null}
      {strength ? <Text style={styles.chipSub}>· {STRENGTH_WORD[strength]}</Text> : null}
    </View>
  );
}

/** Rank badge for a family card: green ring for the top two, muted otherwise. */
export function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 2;
  return (
    <View style={[styles.rank, top && styles.rankTop]} accessible accessibilityRole="text" accessibilityLabel={`Rank ${rank}`}>
      <Text style={[styles.rankText, top && { color: colors.green }]}>{rank}</Text>
    </View>
  );
}

/** Small right-aligned count tag ("50 titles"). */
export function CountTag({ n, noun = 'titles' }: { n: number; noun?: string }) {
  return <Text style={styles.countTag}>{n} {noun}</Text>;
}

export function CentralityChip({ value, count }: { value: AudioCentrality; count?: number }) {
  const c = CENTRALITY[value];
  return (
    <View style={[styles.cent, value === 'core' && styles.centCore, value === 'specialized' && styles.centSpec]} accessible accessibilityRole="text" accessibilityLabel={`${c.label}${count != null ? `, ${count} titles` : ''}. ${c.explain}`}>
      <Text style={[styles.centText, value === 'core' && { color: colors.amber }, value === 'specialized' && { color: colors.cyanBright }]}>{count != null ? `${count} ` : ''}{c.label.toUpperCase()}</Text>
    </View>
  );
}

/* ── the dimension spectrum (results hero) ─────────────────────────────── */

const SPEC_W = 340, SPEC_H = 132;

/**
 * Fourteen bars, one per dimension, height = the user's score. An unexplored
 * dimension draws as an outlined bar with a "?" rather than an empty space,
 * so "I don't know" is visibly different from "dislike". Prose alt text lists
 * every value for screen readers.
 */
export function DimensionSpectrum({ dims, highlight }: { dims: DimensionScores; highlight?: DimensionCode[] }) {
  const n = DIMENSION_CODES.length;
  const gap = 6, left = 10, right = 10;
  const bw = (SPEC_W - left - right - gap * (n - 1)) / n;
  const top = 14, base = SPEC_H - 26;
  const summary = DIMENSION_CODES.map((c) => {
    const d = dims[c];
    return `${DIMENSIONS[c].label}: ${d.insufficient ? 'not enough evidence' : strengthOf(d.score) + ' interest'}`;
  }).join('; ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Your interest by activity. ${summary}. Heights show what you said you would enjoy, not ability.`} style={{ width: '100%' }}>
      <Svg width="100%" height={SPEC_H} viewBox={`0 0 ${SPEC_W} ${SPEC_H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={SPEC_W} height={SPEC_H} rx={10} fill="#0a0a0c" stroke={colors.hairline} />
        {[0.25, 0.5, 0.75].map((g) => <Line key={g} x1={left} y1={base - (base - top) * g} x2={SPEC_W - right} y2={base - (base - top) * g} stroke="rgba(255,255,255,0.06)" />)}
        <Line x1={left} y1={base} x2={SPEC_W - right} y2={base} stroke={colors.textMuted} strokeWidth={1} />
        {DIMENSION_CODES.map((c, i) => {
          const d = dims[c];
          const x = left + i * (bw + gap);
          const h = Math.max(2, (base - top) * d.score);
          const hi = highlight?.includes(c);
          const fill = d.insufficient ? 'none' : hi ? colors.cyanBright : d.score >= 0.75 ? colors.amber : d.score >= 0.5 ? colors.amberLabel : '#3a3a40';
          return (
            <Svg key={c}>
              <Rect x={x} y={base - h} width={bw} height={h} rx={2} fill={fill} stroke={d.insufficient ? colors.textMuted : 'none'} strokeDasharray={d.insufficient ? '3 2' : undefined} />
              {d.insufficient ? <SvgText x={x + bw / 2} y={base - h / 2 + 3} fontSize={10} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>?</SvgText> : null}
              <SvgText x={x + bw / 2} y={SPEC_H - 11} fontSize={9.5} fill={hi ? colors.cyanBright : colors.textSub} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{c}</SvgText>
            </Svg>
          );
        })}
      </Svg>
      {highlight?.length ? (
        <Text style={styles.legend} accessible={false}>
          {highlight.map((c) => `${c} ${DIMENSIONS[c].label}`).join('  ·  ')}
        </Text>
      ) : null}
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },

  beta: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.amberLabel, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  betaCompact: { paddingHorizontal: 5, paddingVertical: 1 },
  betaText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6 },

  sectionLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.8, marginTop: 4 },
  lead: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 16.5, lineHeight: 23 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', padding: 12, gap: 8 },
  cardRaised: { backgroundColor: '#17171b', borderColor: '#33333a' },
  cardOk: { borderColor: colors.green, backgroundColor: '#0f2416' },
  cardAmber: { borderColor: 'rgba(255,198,77,0.45)', backgroundColor: '#1a150b' },

  cta: { minHeight: 46, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ctaGreen: { borderColor: colors.green, backgroundColor: '#173021' },
  ctaQuiet: { borderColor: 'transparent', backgroundColor: 'transparent', minHeight: 44 },
  ctaText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },

  navBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },

  link: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 14 },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, alignItems: 'center' },
  star: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  starText: { color: colors.textSub, fontSize: 22, lineHeight: 26 },

  barWrap: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#26262b', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.green },

  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 4, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#101013' },
  chipPrimary: { borderColor: '#3a3a44' },
  chipStrong: { borderColor: 'rgba(127,212,255,0.5)', backgroundColor: '#0f1a22' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.4 },
  chipSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  chipMain: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
  rank: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  rankTop: { borderColor: colors.green, backgroundColor: '#0f2416' },
  rankText: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, lineHeight: 15 },
  countTag: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 11.5 },
  legend: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginTop: 4 },

  cent: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: '#101013' },
  centCore: { borderColor: 'rgba(255,198,77,0.45)' },
  centSpec: { borderColor: 'rgba(127,212,255,0.4)' },
  centText: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1 },
});
